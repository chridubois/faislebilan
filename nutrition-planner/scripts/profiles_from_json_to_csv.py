#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Convertit un JSON (array ou JSONL) de profils en CSVs pour Supabase :
 - profiles.csv
 - profile_targets.csv
 - profile_allergies.csv
 - profile_dislikes.csv
 - profile_conditions.csv

Calcule les cibles (kcal, macros, fibres, sodium, ... au format long) en s'appuyant sur nutrients.csv
et une policy (yaml) optionnelle.

Usage :
  python profiles_from_json_to_csv.py \
    --json ./profiles.json \
    --nutrients ./nutrients.csv \
    --out ./out \
    --policy ./policy.yaml \
    --namespace 123e4567-e89b-12d3-a456-426614174000

Notes :
- `--namespace` sert à fabriquer un UUID déterministe à partir de `profile_id` (si ton PK est uuid).
- Si tu préfères garder ton `profile_id` texte comme PK en base, n'utilise pas --namespace et le script placera
  la valeur dans la colonne `id` telle quelle (string). À toi d’aligner le DDL.
"""

import argparse
import os
import uuid
import json
from datetime import date, datetime
import pandas as pd
import yaml
import math

# --------- POLITIQUE PAR DÉFAUT (personnalisable via --policy) ----------
DEFAULT_POLICY = {
    "activity_map": {   # combine sport_frequency + job_activity -> catégorie
        # sport_frequency: "none","1-2","3-4","5+", "athlete"
        # job_activity: "sedentary","light","moderate","active","very_active"
        # règle globale : on prend le max des deux niveaux
        "levels": ["sedentary","light","moderate","active","very_active"],
        "sport_to_level": {
            "none": "sedentary",
            "0": "sedentary",
            "1-2": "light",
            "2": "light",
            "3-4": "moderate",
            "3": "moderate",
            "4": "active",
            "5+": "very_active",
            "5": "very_active",
            "athlete": "very_active"
        }
    },
    "activity_factors": {
        "sedentary": 1.2,
        "light": 1.375,
        "moderate": 1.55,
        "active": 1.725,
        "very_active": 1.9
    },
    "goal_multiplier": {
        "cut": 0.85,        # -15%
        "maintain": 1.00,
        "bulk": 1.15
    },
    # Macros g/kg (peuvent être surchargés par conditions, ex: grossesse)
    "protein_g_per_kg": {
        "default": 1.6,
        "cut": 1.8,
        "maintain": 1.6,
        "bulk": 1.8
    },
    "fat_g_per_kg": {
        "default": 0.8,
        "cut": 0.8,
        "maintain": 0.8,
        "bulk": 0.9
    },
    "fiber_g_per_1000kcal": 14.0,
    "sodium_mg_max": 2300,

    # Ajustements de conditions (ex: grossesse)
    # Les deltas s’appliquent après le calcul de base
    "condition_adjustments": {
        "pregnancy": {
            "kcal_delta": 300,        # +300 kcal/j (trimestre 2/3 ; simplifié)
            "protein_g_per_kg": 1.8,  # ↑ besoin prot
            "fiber_g_per_1000kcal": 14.0,
            "sodium_mg_max": 2000
        },
        "breastfeeding": {
            "kcal_delta": 500,
            "protein_g_per_kg": 1.9
        }
    },

    # Codes nutriments (doivent matcher nutrients.code)
    "codes": {
        "energy_kcal": "energy_reg_kcal_100g",
        "protein": "protein_625_g_100g",
        "fat": "fat_g_100g",
        "carbs": "carbs_g_100g",
        "fiber": "fiber_g_100g",
        "sodium": "sodium_mg_100g"
    },

    # Pour tous les autres nutriments : laisser vide (target/min/max = null)
    # Tu peux ici fixer des bornes par défaut si tu veux contraindre tout le catalogue.
    "defaults_for_other_nutrients": {
        # "vitamin_c_mg_100g": {"min": 45, "target": 80, "max": 200, "priority": 10}
    }
}
# -----------------------------------------------------------------------

def load_policy(path: str | None):
    if path and os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            user_policy = yaml.safe_load(f)
        # fusion superficielle
        out = DEFAULT_POLICY.copy()
        for k, v in (user_policy or {}).items():
            if isinstance(v, dict) and isinstance(out.get(k), dict):
                out[k] = {**out[k], **v}
            else:
                out[k] = v
        return out
    return DEFAULT_POLICY

def parse_json_profiles(json_path: str):
    # supporte array JSON ou JSONL
    with open(json_path, "r", encoding="utf-8") as f:
        txt = f.read().strip()
    if not txt:
        return []
    if txt[0] == "[":
        return json.loads(txt)
    # JSONL
    rows = []
    for line in txt.splitlines():
        line = line.strip()
        if not line:
            continue
        rows.append(json.loads(line))
    return rows

def age_from_birthdate(iso_date: str) -> float:
    try:
        d = datetime.fromisoformat(iso_date).date()
    except Exception:
        return None
    today = date.today()
    years = today.year - d.year - ((today.month, today.day) < (d.month, d.day))
    return float(years)

def pick_activity_level(sport_freq: str, job_activity: str, policy: dict) -> str:
    levels = policy["activity_map"]["levels"]
    sport_map = policy["activity_map"]["sport_to_level"]
    s = (sport_freq or "").strip().lower()
    j = (job_activity or "").strip().lower()
    sport_level = sport_map.get(s, "sedentary")
    job_level = j if j in levels else "sedentary"
    # prendre le niveau le plus élevé entre sport et job
    return levels[max(levels.index(sport_level), levels.index(job_level))]

def mifflin_st_jeor(gender: str, age: float, weight_kg: float, height_cm: float) -> float:
    g = (gender or "").strip().lower()
    base = 10 * weight_kg + 6.25 * height_cm - 5 * age
    return base + (5 if g in ("m","male","man","homme","h") else -161)

def round_g(x: float) -> float:
    return float(f"{x:.1f}")

def to_uuid(namespace: str | None, seed: str):
    if namespace:
        ns = uuid.UUID(namespace)
        return str(uuid.uuid5(ns, seed))
    # sinon, on rend le seed tel quel (string) – à toi d’aligner le DDL si ce n’est pas un uuid
    return seed

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", required=True, help="Chemin du JSON (array ou JSONL) de profils")
    ap.add_argument("--nutrients", required=True, help="nutrients.csv (code,name,unit)")
    ap.add_argument("--out", default="./out")
    ap.add_argument("--policy", default=None)
    ap.add_argument("--namespace", default=None, help="UUID namespace pour ids déterministes depuis profile_id")
    ap.add_argument("--emit-empty-other-nutrients", action="store_true",
                    help="Écrire aussi des lignes vides pour les nutriments sans cibles explicites")
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)
    policy = load_policy(args.policy)
    nutrients_df = pd.read_csv(args.nutrients)
    units_map = nutrients_df.set_index("code")["unit"].to_dict()
    codes = policy["codes"]

    raw_profiles = parse_json_profiles(args.json)
    if not raw_profiles:
        raise SystemExit("Aucun profil trouvé dans le JSON.")

    profiles_rows = []
    targets_rows = []
    allergies_rows = []
    dislikes_rows = []
    conditions_rows = []

    for p in raw_profiles:
        ext_id = str(p.get("profile_id"))  # ex: "pro_amelie_0002"
        pid = to_uuid(args.namespace, ext_id)

        first_name = p.get("first_name") or p.get("name") or "Profil"
        gender = p.get("gender", "").lower()
        birth_date = p.get("birth_date")
        age_years = p.get("age_years") or age_from_birthdate(birth_date) or 30.0
        height_cm = float(p.get("height_cm") or 170.0)
        weight_kg = float(p.get("weight_kg") or 70.0)
        goal = (p.get("goal") or "maintain").lower()
        sport_freq = str(p.get("sport_frequency") or "none")
        job_activity = str(p.get("job_activity") or "sedentary")
        conditions = p.get("conditions") or []
        food_budget_level = p.get("food_budget_level") or ""
        max_time_per_meal_min = p.get("max_time_per_meal_min") or None

        # 1) activité
        activity = pick_activity_level(sport_freq, job_activity, policy)

        # 2) BMR / TDEE / kcal target
        bmr = mifflin_st_jeor(gender, float(age_years), weight_kg, height_cm)
        af = policy["activity_factors"].get(activity, policy["activity_factors"]["moderate"])
        tdee = bmr * af
        kcal_target = tdee * policy["goal_multiplier"].get(goal, 1.0)

        # 3) macros de base
        prot_per_kg = policy["protein_g_per_kg"].get(goal, policy["protein_g_per_kg"]["default"])
        fat_per_kg  = policy["fat_g_per_kg"].get(goal, policy["fat_g_per_kg"]["default"])

        # Ajustements par conditions
        for c in conditions:
            adj = policy.get("condition_adjustments", {}).get(str(c).lower())
            if not adj:
                continue
            kcal_target += adj.get("kcal_delta", 0)
            if "protein_g_per_kg" in adj:
                prot_per_kg = adj["protein_g_per_kg"]
            if "fat_g_per_kg" in adj:
                fat_per_kg = adj["fat_g_per_kg"]
            if "fiber_g_per_1000kcal" in adj:
                policy["fiber_g_per_1000kcal"] = adj["fiber_g_per_1000kcal"]
            if "sodium_mg_max" in adj:
                policy["sodium_mg_max"] = adj["sodium_mg_max"]

        protein_g = prot_per_kg * weight_kg
        fat_g     = fat_per_kg * weight_kg
        kcal_pf   = protein_g*4 + fat_g*9
        carbs_g   = max(0.0, (kcal_target - kcal_pf) / 4.0)

        fiber_g   = (kcal_target / 1000.0) * float(policy["fiber_g_per_1000kcal"])
        sodium_max = float(policy["sodium_mg_max"])

        # -- profiles.csv
        profiles_rows.append({
            "id": pid,
            "external_code": ext_id,      # pour trace si tu gardes un PK uuid en DB
            "user_id": "",                # à remplir si tu veux lier à users
            "name": first_name,
            "gender": {"male":"m","m":"m","female":"f","f":"f"}.get(gender, "nb"),
            "birth_date": birth_date or "",
            "age_years": float(age_years),
            "weight_kg": float(weight_kg),
            "height_cm": float(height_cm),
            "activity": activity,         # sedentary|light|...
            "goal": goal,                 # cut|maintain|bulk|custom
            "food_budget_level": food_budget_level,
            "max_time_per_meal_min": int(max_time_per_meal_min) if max_time_per_meal_min else ""
        })

        # -- targets (format long)
        def add_target(code, target=None, minv=None, maxv=None, priority=0):
            if code not in units_map:
                return
            targets_rows.append({
                "profile_id": pid,
                "nutrient_code": code,
                "target_value": None if target is None else float(target),
                "min_value": None if minv is None else float(minv),
                "max_value": None if maxv is None else float(maxv),
                "unit": units_map.get(code, ""),
                "priority": int(priority)
            })

        add_target(codes["energy_kcal"], target=int(round(kcal_target)), priority=100)
        add_target(codes["protein"],     target=round_g(protein_g), priority=90)
        add_target(codes["fat"],         target=round_g(fat_g),     priority=80)
        add_target(codes["carbs"],       target=round_g(carbs_g),   priority=70)
        add_target(codes["fiber"],       target=round_g(fiber_g),   priority=60)
        add_target(codes["sodium"],      maxv=int(round(sodium_max)), priority=50)

        defaults = policy.get("defaults_for_other_nutrients", {}) or {}
        known = {codes["energy_kcal"], codes["protein"], codes["fat"], codes["carbs"], codes["fiber"], codes["sodium"]}
        if args.emit_empty_other_nutrients:
            # crée 1 ligne par nutriment (même sans cible)
            for code in nutrients_df["code"]:
                if code in known:
                    continue
                d = defaults.get(code)
                if d:
                    add_target(code, target=d.get("target"), minv=d.get("min"), maxv=d.get("max"), priority=d.get("priority", 0))
                else:
                    add_target(code, target=None, minv=None, maxv=None, priority=0)
        else:
            # ajoute seulement si defaults fournis
            for code, d in defaults.items():
                add_target(code, target=d.get("target"), minv=d.get("min"), maxv=d.get("max"), priority=d.get("priority", 0))

        # -- allergies / dislikes / conditions
        for a in (p.get("allergies") or []):
            ing = a.get("ingredient_id")
            if ing:
                allergies_rows.append({"profile_id": pid, "ingredient_id": ing, "label": a.get("label","")})
        for d in (p.get("dislikes") or []):
            ing = d.get("ingredient_id")
            if ing:
                dislikes_rows.append({"profile_id": pid, "ingredient_id": ing, "label": d.get("label","")})
        for c in conditions:
            conditions_rows.append({"profile_id": pid, "condition": str(c)})

    # Écrit les CSV
    out_dir = args.out
    pd.DataFrame(profiles_rows, columns=[
        "id","external_code","user_id","name","gender","birth_date","age_years",
        "weight_kg","height_cm","activity","goal","food_budget_level","max_time_per_meal_min"
    ]).to_csv(os.path.join(out_dir, "profiles.csv"), index=False)

    pd.DataFrame(targets_rows, columns=[
        "profile_id","nutrient_code","target_value","min_value","max_value","unit","priority"
    ]).to_csv(os.path.join(out_dir, "profile_targets.csv"), index=False)

    if allergies_rows:
        pd.DataFrame(allergies_rows, columns=["profile_id","ingredient_id","label"]).to_csv(
            os.path.join(out_dir, "profile_allergies.csv"), index=False)
    if dislikes_rows:
        pd.DataFrame(dislikes_rows, columns=["profile_id","ingredient_id","label"]).to_csv(
            os.path.join(out_dir, "profile_dislikes.csv"), index=False)
    if conditions_rows:
        pd.DataFrame(conditions_rows, columns=["profile_id","condition"]).to_csv(
            os.path.join(out_dir, "profile_conditions.csv"), index=False)

    print(f"[OK] Écrit CSVs dans {out_dir}")

if __name__ == "__main__":
    main()
