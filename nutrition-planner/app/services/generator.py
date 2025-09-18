# app/services/generator.py
from __future__ import annotations

import uuid
import random
import math
from typing import Dict, List, Tuple, Optional, Set
from fastapi import HTTPException

from app.utils.loader import load_recipes, load_targets
from app.services.nutrition import recipe_per_portion
from app.utils.config import load_optimizer_config

# ⬇️ IMPORTANT : on n'utilise QUE les schémas
from app.schemas.menu import WeekPlan, DayPlan, Meal, MealItem, Recipe

# Mémoire volatile des plans (MVP)
PLANS: Dict[str, WeekPlan] = {}

# Clés/étiquettes/units utiles pour le rendu (et cumul hebdo)
NUT_META = {
    "energy_kcal": ("kcal", "kcal_per_day"),
    "protein_g":   ("g",   "protein_g_per_day"),
    "carbs_g":     ("g",   "carbs_g_per_day"),
    "fat_g":       ("g",   "fat_g_per_day"),
    "fiber_g":     ("g",   "fiber_g_per_day"),
    "sugars_g":    ("g",   "sugars_g_per_day"),
    "sodium_mg":   ("mg",  "sodium_mg_per_day"),
    "calcium_mg":  ("mg",  "calcium_mg_per_day"),
    "iron_mg":     ("mg",  "iron_mg_per_day"),
    "magnesium_mg":("mg",  "magnesium_mg_per_day"),
    "zinc_mg":     ("mg",  "zinc_mg_per_day"),
    "potassium_mg":("mg",  "potassium_mg_per_day"),
    "iodine_ug":   ("µg",  "iodine_ug_per_day"),
    "selenium_ug": ("µg",  "selenium_ug_per_day"),
    "vitamin_a_ug_rae": ("µg", "vitamin_a_ug_rae_per_day"),
    "vitamin_d_ug":     ("µg", "vitamin_d_ug_per_day"),
    "vitamin_e_mg":     ("mg", "vitamin_e_mg_per_day"),
    "vitamin_c_mg":     ("mg", "vitamin_c_mg_per_day"),
    "vitamin_b1_mg":    ("mg", "vitamin_b1_mg_per_day"),
    "vitamin_b2_mg":    ("mg", "vitamin_b2_mg_per_day"),
    "vitamin_b3_mg":    ("mg", "vitamin_b3_mg_per_day"),
    "vitamin_b6_mg":    ("mg", "vitamin_b6_mg_per_day"),
    "vitamin_b9_ug_dfe":("µg", "vitamin_b9_ug_dfe_per_day"),
    "vitamin_b12_ug":   ("µg", "vitamin_b12_ug_per_day"),
    "omega3_ala_g": ("g", "omega3_ala_g_per_day"),
    "omega3_epa_g": ("g", "omega3_epa_g_per_day"),
    "omega3_dha_g": ("g", "omega3_dha_g_per_day"),
}

CFG = load_optimizer_config()

SLOTS = CFG["slots"]["order"]
SLOT_RATIOS = CFG["slots"]["ratios"]
INTRA_RATIOS = CFG["slots"]["intra_ratios"]

TOL = CFG["scaling"]["band_tolerance"]

MIN_SV = CFG["scaling"]["min_servings"]
MAX_SV = CFG["scaling"]["max_servings"]
STEP   = CFG["scaling"]["step"]
ENERGY_NORM_TOL = CFG["scaling"]["normalize_energy_tolerance"]


def clamp(x, a, b): return max(a, min(b, x))

# ---------- helpers data ----------

def _recipes_idx() -> Dict[str, Recipe]:
    data = load_recipes()
    if not data:
        raise HTTPException(status_code=503, detail="No recipes available")
    # Valide en schéma; default course_type="main" si absent
    out: Dict[str, Recipe] = {}
    for r in data:
        rr = dict(r)
        rr.setdefault("course_type", "main")
        out[rr["id"]] = Recipe.model_validate(rr)
    return out

def _round_step(x: float) -> float:
    if STEP <= 0: return x
    return round(x / STEP) * STEP


def _pool_for_course(recipes: List[Recipe], slot: str, course: str) -> List[Recipe]:
    pool = [
        r for r in recipes
        if r.course_type == course and ((r.meal_types or []) and slot in r.meal_types)
    ]
    if not pool:
        pool = [r for r in recipes if r.course_type == course]
    return pool

def _pick_recipe(recipes: List[Recipe], slot: str, course: Optional[str], allow_repeat: bool) -> Recipe:
    if course:
        pool = _pool_for_course(recipes, slot, course)
    else:
        pool = [r for r in recipes if (r.meal_types or []) and slot in r.meal_types]
        if not pool:
            pool = recipes[:]
    if not pool:
        raise HTTPException(status_code=503, detail=f"No recipe available for {slot}/{course}")
    if allow_repeat or len(pool) <= 1:
        return random.choice(pool)
    return random.sample(pool, k=1)[0]

def _servings_to_hit_kcal(recipe: Recipe, slot_kcal_target: float) -> float:
    base = recipe_per_portion(recipe, 1.0).energy_kcal or 1.0
    sv = clamp(slot_kcal_target / base, MIN_SV, MAX_SV)
    return round(sv, 2)

# ---------- helpers nutriments ----------

def _day_energy(idx: Dict[str, Recipe], meals: List[Meal]) -> float:
    total = 0.0
    for m in meals:
        if m.items:
            for it in m.items:
                r = idx[it.recipe_id]
                total += recipe_per_portion(r, 1.0).energy_kcal * (it.servings or it.scale or 1.0)
        else:
            r = idx[m.recipe_id] if m.recipe_id in idx else None
            if r:
                total += recipe_per_portion(r, 1.0).energy_kcal * (m.servings or m.scale or 1.0)
    return total

def _day_fat(idx: Dict[str, Recipe], meals: List[Meal]) -> float:
    total = 0.0
    for m in meals:
        if m.items:
            for it in m.items:
                r = idx.get(it.recipe_id)
                if not r:
                    continue
                total += recipe_per_portion(r, 1.0).fat_g * (it.servings or it.scale or 1.0)
        else:
            r = idx.get(m.recipe_id)
            if r:
                total += recipe_per_portion(r, 1.0).fat_g * (m.servings or m.scale or 1.0)
    return total

def _scale_day_servings(meals: List[Meal], factor: float):
    """Multiplie toutes les portions du jour par un facteur commun, borné 0.6..2.5"""
    for m in meals:
        if m.items:
            for it in m.items:
                sv = (it.servings or it.scale or 1.0) * factor
                it.servings = round(clamp(sv, MIN_SV, MAX_SV), 2)
                it.scale = it.servings
        else:
            if m.servings is not None or m.scale is not None:
                sv = (m.servings or m.scale or 1.0) * factor
                m.servings = round(clamp(sv, MIN_SV, MAX_SV), 2)
                m.scale = m.servings

def _macro_targets_per_day(override: Optional[dict] = None):
    """
    Retourne les cibles/jour pour kcal, prot, carbs, fat.
    Si `override` est fourni, on l'utilise en priorité.
    """
    if override:
        return dict(
            kcal=float(override.get("kcal_per_day", CFG["defaults"]["kcal_per_day"])),
            protein=float(override.get("protein_g_per_day", CFG["defaults"]["protein_g_per_day"])),
            carbs=float(override.get("carbs_g_per_day", CFG["defaults"]["carbs_g_per_day"])),
            fat=float(override.get("fat_g_per_day", CFG["defaults"]["fat_g_per_day"])),
        )
    t = load_targets() or {}
    return dict(
        kcal=float(t.get("kcal_per_day", CFG["defaults"]["kcal_per_day"])),
        protein=float(t.get("protein_g_per_day", CFG["defaults"]["protein_g_per_day"])),
        carbs=float(t.get("carbs_g_per_day", CFG["defaults"]["carbs_g_per_day"])),
        fat=float(t.get("fat_g_per_day", CFG["defaults"]["fat_g_per_day"])),
    )

BANDS_DAY = {
  "kcal":    (CFG["bands_day"]["kcal"]["lo"],    CFG["bands_day"]["kcal"]["hi"]),
  "protein": (CFG["bands_day"]["protein"]["lo"], CFG["bands_day"]["protein"]["hi"]),
  "carbs":   (CFG["bands_day"]["carbs"]["lo"],   CFG["bands_day"]["carbs"]["hi"]),
  "fat":     (CFG["bands_day"]["fat"]["lo"],     CFG["bands_day"]["fat"]["hi"]),
}

# -------- DIAGNOSTICS: détecter les "gaps" de recettes --------

def _macro_room_vs_bands(cur, targets):
    lo = {k: BANDS_DAY[k][0] * targets[k] for k in ("kcal","protein","carbs","fat")}
    hi = {k: BANDS_DAY[k][1] * targets[k] for k in ("kcal","protein","carbs","fat")}
    need = {
        "kcal": max(0.0, lo["kcal"]    - cur["kcal"]),
        "protein": max(0.0, lo["protein"] - cur["protein"]),
        "carbs": max(0.0, lo["carbs"]  - cur["carbs"]),
    }
    room = {
        "kcal": max(0.0, hi["kcal"]    - cur["kcal"]),
        "protein": max(0.0, hi["protein"] - cur["protein"]),
        "carbs": max(0.0, hi["carbs"]  - cur["carbs"]),
        "fat": max(0.0, hi["fat"]      - cur["fat"]),
    }
    return need, room, lo, hi

def _best_density_in_pool(recipes: List[Recipe], slot: str, course: str):
    """Renvoie les meilleures densités dispo: prot/fat, carbs/fat, kcal/fat pour (slot, course)."""
    if not recipes:
        return {"pf": 0.0, "cf": 0.0, "kf": 0.0}
    pool = [r for r in recipes if (r.course_type or "main")==course and ((r.meal_types or []) and slot in r.meal_types)]
    best_pf = best_cf = best_kf = 0.0
    for r in pool:
        per = recipe_per_portion(r, 1.0)
        f = max(per.fat_g, 1e-6)
        best_pf = max(best_pf, per.protein_g   / f)
        best_cf = max(best_cf, per.carbs_g     / f)
        best_kf = max(best_kf, per.energy_kcal / f)
    return {"pf": best_pf, "cf": best_cf, "kf": best_kf}

def _required_density(need_value: float, fat_room: float, per_unit: float) -> float:
    """
    Densité requise 'macro/fat' pour combler un manque 'need_value' sans dépasser la marge lipides 'fat_room'.
    """
    if need_value <= 0:
        return 0.0
    if fat_room <= 0:
        return float("inf")
    return need_value / max(fat_room, 1e-6)

def diagnose_day_gaps(idx: Dict[str, Recipe], recipes: List[Recipe], meals: List[Meal], targets_day: Dict[str, float]):
    """
    Retourne une liste de specs manquantes pour ce jour:
    [{slot, course_type, need: ['protein'|'carbs'|'kcal'], required_ratio: 'carbs/fat ≥ 7', tip: 'desserts fruités…'}]
    """
    cur = _day_macros(idx, meals)
    need, room, lo, hi = _macro_room_vs_bands(cur, targets_day)

    gaps = []
    if need["protein"]<=0 and need["carbs"]<=0 and need["kcal"]<=0:
        return gaps  # tout est dans la bande

    for slot in ("breakfast","lunch","dinner"):
        for course in (("main",) if slot=="breakfast" else ("main","dessert")):
            dens = _best_density_in_pool(recipes, slot, course)
            # besoins prioritaires
            req_pf = _required_density(need["protein"], room["fat"], 1.0)
            req_cf = _required_density(need["carbs"],   room["fat"], 1.0)
            req_kf = _required_density(need["kcal"],    room["fat"], 1.0)

            if need["protein"]>0 and (dens["pf"] + 1e-9) < req_pf:
                gaps.append({
                    "slot": slot, "course_type": course,
                    "need": "protein",
                    "required_ratio": f"protein/fat ≥ {req_pf:.1f}",
                    "best_pool_ratio": f"{dens['pf']:.1f}",
                    "tip": "Ajouter 1-2 recettes riches en protéines et très pauvres en lipides (poulet/thon/tofu 'secs', skyr, fromage blanc, œufs blancs)."
                })
            if need["carbs"]>0 and (dens["cf"] + 1e-9) < req_cf:
                gaps.append({
                    "slot": slot, "course_type": course,
                    "need": "carbs",
                    "required_ratio": f"carbs/fat ≥ {req_cf:.1f}",
                    "best_pool_ratio": f"{dens['cf']:.1f}",
                    "tip": "Ajouter 1-2 recettes glucidiques maigres (semoule/riz/pâtes nature, pain + confiture légère, compote SSu, fruits)."
                })
            if need["kcal"]>0 and (dens["kf"] + 1e-9) < req_kf:
                gaps.append({
                    "slot": slot, "course_type": course,
                    "need": "kcal",
                    "required_ratio": f"kcal/fat ≥ {req_kf:.1f}",
                    "best_pool_ratio": f"{dens['kf']:.1f}",
                    "tip": "Ajouter 1-2 recettes denses en énergie mais peu grasses (banane, flocons + yaourt 0-2%, miel en petite dose)."
                })
    return gaps

def diagnose_plan_gaps(plan: WeekPlan):
    """
    Analyse un plan entier et renvoie:
    {
      "by_day": [{ "day_index": 0, "gaps": [...] }, ...],
      "summary": { "<slot>/<course>/<need>": { "required_ratio_max": 9.2, "best_pool_ratio": 5.1, "count_days": 3, "tip": "..." }, ... }
    }
    """
    idx = _recipes_idx()
    recipes = list(idx.values())
    T = _macro_targets_per_day()
    targets_day = {"kcal": load_targets().get("kcal_per_day", 2000),
                   "protein": T["protein"], "carbs": T["carbs"], "fat": T["fat"]}

    by_day = []
    summary: Dict[str, dict] = {}

    for d in plan.days:
        gaps = diagnose_day_gaps(idx, recipes, d.meals, targets_day)
        by_day.append({"day_index": d.date_index, "gaps": gaps})
        for g in gaps:
            k = f"{g['slot']}/{g['course_type']}/{g['need']}"
            req = float(g["required_ratio"].split("≥")[1])
            best = float(g["best_pool_ratio"])
            tip = g["tip"]
            ent = summary.setdefault(k, {"required_ratio_max": 0.0, "best_pool_ratio": best, "count_days": 0, "tip": tip})
            ent["required_ratio_max"] = max(ent["required_ratio_max"], req)
            ent["best_pool_ratio"] = min(ent["best_pool_ratio"], best)
            ent["count_days"] += 1

    return {"by_day": by_day, "summary": summary}


def _band_penalty_range(value: float, target: float, lo_mul: float, hi_mul: float) -> float:
    """0 dans la bande [lo..hi]*target ; pénalité quadratique sinon (écart relatif au bord le + proche)."""
    if target <= 0:
        return 0.0
    lo, hi = lo_mul * target, hi_mul * target
    if lo <= value <= hi:
        return 0.0
    if value < lo:
        rel = (lo - value) / max(target, 1e-6)
    else:
        rel = (value - hi) / max(target, 1e-6)
    return rel * rel

def _prot_density(per) -> float:
    ek = max(per.energy_kcal, 1e-6)
    return per.protein_g / ek

def _carb_density(per) -> float:
    ek = max(per.energy_kcal, 1e-6)
    return per.carbs_g / ek

def _clone_meal(meal: Meal) -> Meal:
    if meal.items:
        return Meal(slot=meal.slot, items=[
            MealItem(recipe_id=it.recipe_id, servings=(it.servings or it.scale or 1.0), scale=(it.servings or it.scale or 1.0), course_type=(it.course_type or "main"))
            for it in meal.items
        ])
    return Meal(slot=meal.slot, recipe_id=meal.recipe_id, servings=meal.servings, scale=meal.scale)

def _replace_item_keep_kcal(
    idx: Dict[str, Recipe],
    meals: List[Meal],
    day_targets: Dict[str, float],
    *,
    slot: str,
    item_index: int,
    course_type: str,
    new_recipe: Recipe,
) -> bool:
    tmp_meals = [_clone_meal(m) for m in meals]
    m = next((mm for mm in tmp_meals if mm.slot == slot), None)
    if not m or not m.items or not (0 <= item_index < len(m.items)):
        return False

    old = m.items[item_index]
    old_r = idx.get(old.recipe_id)
    if not old_r:
        return False
    old_per = recipe_per_portion(old_r, 1.0)
    old_sv  = (old.servings or old.scale or 1.0)
    old_kcal = old_per.energy_kcal * old_sv

    new_per = recipe_per_portion(new_recipe, 1.0)
    if new_per.energy_kcal <= 0:
        return False
    new_sv = clamp(old_kcal / new_per.energy_kcal, MIN_SV, MAX_SV)
    new_sv = round(new_sv, 2)

    m.items[item_index] = MealItem(recipe_id=new_recipe.id, servings=new_sv, scale=new_sv, course_type=course_type)

    cur = _day_macros(idx, tmp_meals)
    hi = {
        "kcal":    BANDS_DAY["kcal"][1]    * day_targets["kcal"],
        "protein": BANDS_DAY["protein"][1] * day_targets["protein"],
        "carbs":   BANDS_DAY["carbs"][1]   * day_targets["carbs"],
        "fat":     BANDS_DAY["fat"][1]     * day_targets["fat"],
    }
    if (cur["kcal"]   > hi["kcal"] or
        cur["protein"]> hi["protein"] or
        cur["carbs"]  > hi["carbs"] or
        cur["fat"]    > hi["fat"]):
        return False

    real_m = next((mm for mm in meals if mm.slot == slot), None)
    real_m.items[item_index] = MealItem(recipe_id=new_recipe.id, servings=new_sv, scale=new_sv, course_type=course_type)
    return True

def _day_macros(idx: Dict[str, Recipe], meals: List[Meal]):
    out = dict(kcal=0.0, protein=0.0, carbs=0.0, fat=0.0)
    for m in meals:
        if m.items:
            for it in m.items:
                r = idx.get(it.recipe_id)
                if not r:
                    continue
                per = recipe_per_portion(r, 1.0)
                f = (it.servings or it.scale or 1.0)
                out["kcal"]    += per.energy_kcal * f
                out["protein"] += per.protein_g   * f
                out["carbs"]   += per.carbs_g     * f
                out["fat"]     += per.fat_g       * f
        else:
            if not getattr(m, "recipe_id", None):
                continue
            r = idx.get(m.recipe_id)
            if not r:
                continue
            per = recipe_per_portion(r, 1.0)
            f = (getattr(m, "servings", None) or getattr(m, "scale", 1.0) or 1.0)
            out["kcal"]    += per.energy_kcal * f
            out["protein"] += per.protein_g   * f
            out["carbs"]   += per.carbs_g     * f
            out["fat"]     += per.fat_g       * f
    return out

def _scale_items_selective(meals: List[Meal], predicate, factor: float):
    for m in meals:
        if not m.items:
            continue
        for it in m.items:
            if not predicate(m, it):
                continue
            sv = (it.servings or it.scale or 1.0) * factor
            it.servings = round(clamp(sv, MIN_SV, MAX_SV), 2)
            it.scale = it.servings

def _collect_items_with_per(idx: Dict[str, Recipe], meals: List[Meal]):
    out = []
    for m in meals:
        if not m.items:
            continue
        for it in m.items:
            r = idx.get(it.recipe_id)
            if not r:
                continue
            per = recipe_per_portion(r, 1.0)
            out.append((m, it, per))
    return out

def _enforce_bands(idx: Dict[str, Recipe], meals: List[Meal], targets):
    """
    Ajuste les portions du *jour* pour satisfaire les bandes.
    """
    tgt = {
        "kcal": targets["kcal"],
        "protein": targets["protein"],
        "carbs": targets["carbs"],
        "fat": targets["fat"],
    }
    lo = {k: BANDS_DAY[k][0] * tgt[k] for k in tgt}
    hi = {k: BANDS_DAY[k][1] * tgt[k] for k in tgt}

    cur = _day_macros(idx, meals)
    if cur["fat"] > hi["fat"]:
        fat_dess, fat_other = 0.0, 0.0
        for m, it, per in _collect_items_with_per(idx, meals):
            f = per.fat_g * (it.servings or it.scale or 1.0)
            if (it.course_type or "main") == "dessert": fat_dess += f
            else: fat_other += f
        if fat_dess > 0:
            target_dess_fat = max(0.0, hi["fat"] - fat_other)
            fac = clamp(target_dess_fat / max(fat_dess, 1e-6), MIN_SV, 1.0)
            _scale_items_selective(meals, lambda m, it: (it.course_type or "main") == "dessert", fac)
            cur = _day_macros(idx, meals)
        if cur["fat"] > hi["fat"]:
            fac = clamp(hi["fat"] / max(cur["fat"], 1e-6), MIN_SV, 1.0)
            _scale_items_selective(meals, lambda m, it: True, fac)
            cur = _day_macros(idx, meals)

    MAX_ITERS = 24
    for _ in range(MAX_ITERS):
        cur = _day_macros(idx, meals)
        need = {
            "kcal": max(0.0, lo["kcal"] - cur["kcal"]),
            "protein": max(0.0, lo["protein"] - cur["protein"]),
            "carbs": max(0.0, lo["carbs"] - cur["carbs"]),
        }
        done = (need["kcal"] <= 0 and need["protein"] <= 0 and need["carbs"] <= 0)
        fat_room = hi["fat"] - cur["fat"]
        if done or fat_room <= 0:
            break

        cand = []
        for m in meals:
            if not m.items:
                continue
            for it in m.items:
                r = idx.get(it.recipe_id)
                if not r: continue
                per = recipe_per_portion(r, 1.0)
                sv = (it.servings or it.scale or 1.0)
                if sv >= MAX_SV: continue
                cand.append((m, it, per, sv))

        if not cand:
            break

        def score(x):
            _, _, per, _ = x
            if need["protein"] > 0:
                return (per.protein_g / max(per.fat_g, 1e-6))
            if need["carbs"] > 0:
                return (per.carbs_g / max(per.fat_g, 1e-6)) if per.fat_g > 0 else 1e9
            return (per.energy_kcal / max(per.fat_g, 1e-6)) if per.fat_g > 0 else 1e9

        cand.sort(key=score, reverse=True)

        improved = False
        for (m, it, per, sv) in cand:
            max_add = MAX_SV - sv
            if per.fat_g > 0:
                max_add = min(max_add, (hi["fat"] - cur["fat"]) / per.fat_g)
            if per.energy_kcal > 0:
                max_add = min(max_add, (hi["kcal"] - cur["kcal"]) / per.energy_kcal)
            if per.protein_g > 0:
                max_add = min(max_add, (hi["protein"] - cur["protein"]) / per.protein_g)
            if per.carbs_g > 0:
                max_add = min(max_add, (hi["carbs"] - cur["carbs"]) / per.carbs_g)
            if max_add <= 0.0:
                continue
            target_add = 0.0
            if need["protein"] > 0 and per.protein_g > 0:
                target_add = need["protein"] / per.protein_g
            elif need["carbs"] > 0 and per.carbs_g > 0:
                target_add = need["carbs"] / per.carbs_g
            elif need["kcal"] > 0 and per.energy_kcal > 0:
                target_add = need["kcal"] / per.energy_kcal
            add = clamp(min(max_add, target_add), 0.25, 1.0)
            add = max(STEP, round(add * 2) / 2.0)
            if add <= 0:
                continue
            it.servings = round(clamp(sv + add, MIN_SV, MAX_SV), 2)
            it.scale = it.servings
            improved = True
            break

        if not improved:
            break

def _boost_protein_by_swaps(
    idx: Dict[str, Recipe],
    recipes: List[Recipe],
    meals: List[Meal],
    day_targets: Dict[str, float],
    used_recipes: Optional[Set[str]] = None,   # <-- NEW
    desserts_of_day: Optional[Set[str]] = None,
    max_swaps: int = 6,
):
    """
    Si protéines du jour < 80%, tente jusqu'à max_swaps remplacements d'items
    par des recettes du même slot/course_type avec meilleure densité prot/kcal.
    Respecte tous les plafonds de bande et servings 0.6..2.5.
    Respecte AUSSI l’unicité des plats de la semaine via used_recipes.
    """
    lo_prot = BANDS_DAY["protein"][0] * day_targets["protein"]

    for _ in range(max_swaps):
        cur = _day_macros(idx, meals)
        if cur["protein"] >= lo_prot:
            break

        # lister tous les items avec leur densité prot/kcal
        candidates = []
        for m in meals:
            if not m.items:
                continue
            for i, it in enumerate(m.items):
                r = idx.get(it.recipe_id)
                if not r:
                    continue
                per = recipe_per_portion(r, 1.0)
                dens = _prot_density(per)
                candidates.append((dens, m.slot, i, (it.course_type or "main"), r, per))

        if not candidates:
            break

        # on vise à améliorer les items les moins denses d'abord
        candidates.sort(key=lambda x: x[0])  # densité croissante = pire d'abord
        improved = False

        for dens, slot, i, ctype, r_old, per_old in candidates:
            # pool même slot + même course
            pool = [
                rr for rr in recipes
                if (rr.course_type or "main") == ctype
                and ((rr.meal_types or []) and slot in rr.meal_types)
                and rr.id != r_old.id
            ]
            if not pool:
                continue

            # TRIS densité prot/kcal décroissante
            pool.sort(key=lambda rr: _prot_density(recipe_per_portion(rr, 1.0)), reverse=True)

            improved = False
            for rr in pool[:12]:
                # --- unicité PLATS semaine ---
                if ctype == "main" and used_recipes is not None and rr.id in used_recipes:
                    continue
                # --- unicité DESSERTS du jour ---
                if ctype == "dessert" and desserts_of_day is not None and rr.id in desserts_of_day:
                    continue

                if _replace_item_keep_kcal(idx, meals, day_targets,
                                        slot=slot, item_index=i, course_type=ctype, new_recipe=rr):
                    # mise à jour sets d’unicité
                    if ctype == "main" and used_recipes is not None:
                        used_recipes.discard(r_old.id)
                        used_recipes.add(rr.id)
                    if ctype == "dessert" and desserts_of_day is not None:
                        desserts_of_day.discard(r_old.id)
                        desserts_of_day.add(rr.id)
                    improved = True
                    break
            if improved:
                break

        if not improved:
            break

def _band_penalty(value: float, target: float) -> float:
    if target <= 0:
        return 0.0
    lo, hi = (1.0 - TOL) * target, (1.0 + TOL) * target
    if lo <= value <= hi:
        return 0.0
    rel = (value - target) / target
    if rel > 0:
        excess = rel - TOL
    else:
        excess = abs(rel) - TOL
    return excess * excess

def _lean_score(per) -> float:
    return per.protein_g / max(per.fat_g, 0.5)

def _pick_lean_booster(recipes: List[Recipe], slot: str, idx: Dict[str, Recipe], *, course: str = "dessert"):
    pool = [
        r for r in recipes
        if (r.course_type or "main") == course
        and ((r.meal_types or []) and slot in r.meal_types)
    ]
    if not pool:
        return None
    pool = sorted(pool, key=lambda r: _lean_score(recipe_per_portion(r, 1.0)), reverse=True)
    return pool[0]

def _normalize_day_macros(idx, meals, kcal_t, prot_t, carbs_t, fat_t):
    cur = _day_macros(idx, meals)
    factors = []
    if cur["kcal"] > 1.10 * kcal_t:   factors.append(kcal_t / cur["kcal"])
    if cur["protein"] > 1.15 * prot_t: factors.append(prot_t / cur["protein"])
    if cur["carbs"] > 1.15 * carbs_t:  factors.append(carbs_t / cur["carbs"])
    if cur["fat"] > 1.00 * fat_t:      factors.append(fat_t / cur["fat"])
    if factors:
        fac = max(0.5, min(1.0, min(factors)))
        _scale_day_servings(meals, fac)

def _add_item_with_fat_room(meal: Meal, recipe: Recipe, per, fat_room: float, slot: str) -> bool:
    if slot == "breakfast":
        return False
    if (recipe.course_type or "main") != "dessert":
        return False
    items = meal.items or []
    dessert_idx = next((i for i, it in enumerate(items) if (it.course_type or "main") == "dessert"), None)
    if per.fat_g <= 0:
        sv = 1.0
    else:
        sv = min(2.0, fat_room / per.fat_g)
    sv = max(0.5, round(sv * 2) / 2.0)
    if sv < 0.5:
        return False
    booster = MealItem(recipe_id=recipe.id, servings=sv, scale=sv, course_type="dessert")
    if dessert_idx is not None:
        items[dessert_idx] = booster
    else:
        if len(items) >= 2:
            return False
        items.append(booster)
    meal.items = items
    return True

# ---------- génération / mutations ----------

def _compose_meal(
    recipes: List[Recipe],
    slot: str,
    kcal_target_per_day: int,
    allow_repeat: bool,
    *,
    idx: Dict[str, Recipe],
    day_fat_so_far: float,
    fat_limit_g_per_day: Optional[float],
    meals_so_far: Optional[List[Meal]] = None,
    targets_override: Optional[dict] = None,
    used_recipes: Optional[Set[str]] = None,    # mains already used in the week
    desserts_of_day: Optional[Set[str]] = None  # desserts already used this day
) -> Tuple[Meal, float]:
    """
    Compose one Meal (main + optional dessert) with constraints.
    """
    slot_total = kcal_target_per_day * SLOT_RATIOS[slot]
    intra = INTRA_RATIOS.get(slot, {"main": 1.0})

    items: List[MealItem] = []
    day_fat = day_fat_so_far

    r_main: Optional[Recipe] = None
    r_des: Optional[Recipe] = None

    T = _macro_targets_per_day(targets_override)
    target_prot_slot  = T["protein"] * SLOT_RATIOS[slot]
    target_carbs_slot = T["carbs"]   * SLOT_RATIOS[slot]

    base_meals = meals_so_far or []

    def _fit_fat(servings: float, fat_per_serv: float) -> float:
        nonlocal day_fat
        if fat_limit_g_per_day is None:
            return servings
        remain = fat_limit_g_per_day - day_fat
        if remain <= 0:
            return 0.0
        max_serv = remain / max(fat_per_serv, 1e-6)
        max_serv = clamp(max_serv, 0.0, MAX_SV)
        if max_serv < MIN_SV:
            return 0.0
        max_serv = round(max_serv * 2) / 2.0
        return min(servings, max_serv)

    def _best_recipe(course: str, kcal_share: float) -> tuple[Recipe, float]:
        """Pick (recipe, servings) to minimize band-penalty on protein+carbs for the slot,
        en respectant strictement :
        - pas de main en double sur la semaine (used_recipes)
        - pas de dessert en double dans la journée (desserts_of_day)
        """
        # 1) pool normal : course + meal_types compatibles avec le slot
        pool = _pool_for_course(recipes, slot, course)

        # Appliquer contraintes d’unicité
        if course == "main" and used_recipes is not None:
            pool = [r for r in pool if r.id not in used_recipes]
        if course == "dessert" and desserts_of_day is not None:
            pool = [r for r in pool if r.id not in desserts_of_day]

        # 2) si vide → élargir à TOUTES les recettes de ce course (peu importe meal_types),
        #    mais toujours sans violer les contraintes d’unicité.
        if not pool:
            pool = [r for r in recipes if (r.course_type or "main") == course]
            if course == "main" and used_recipes is not None:
                pool = [r for r in pool if r.id not in used_recipes]
            if course == "dessert" and desserts_of_day is not None:
                pool = [r for r in pool if r.id not in desserts_of_day]

        # 3) si toujours vide → on préfère échouer explicitement plutôt que casser la contrainte
        if not pool:
            raise HTTPException(
                status_code=503,
                detail=f"No {course} candidate left without repeating (slot={slot})."
            )

        # échantillonne 20 candidats max pour rester rapide
        candidates = random.sample(pool, k=min(20, len(pool))) if len(pool) > 20 else pool

        best: Optional[tuple[Recipe, float]] = None
        best_pen = 1e9

        before = _day_macros(idx, base_meals)

        for r in candidates:
            per = recipe_per_portion(r, 1.0)
            servings = _servings_to_hit_kcal(r, slot_total * kcal_share)
            servings = _fit_fat(servings, per.fat_g)
            if servings < MIN_SV:
                continue

            prot_after  = before["protein"] + per.protein_g * servings
            carbs_after = before["carbs"]   + per.carbs_g   * servings

            pen = 1.5 * _band_penalty(prot_after, target_prot_slot) + 1.0 * _band_penalty(carbs_after, target_carbs_slot)
            pen += 0.0001 * (per.fat_g * servings)  # tie-breaker: plus “lean” légèrement favorisé

            if pen < best_pen:
                best_pen = pen
                best = (r, servings)

        # Comme on a déjà garanti un pool non vide, best ne devrait pas être None.
        # Par sécurité, on garde un tout petit fallback sur le 1er élément du pool.
        if best is None:
            r = pool[0]
            per = recipe_per_portion(r, 1.0)
            sv = _fit_fat(_servings_to_hit_kcal(r, slot_total * kcal_share), per.fat_g)
            return r, max(MIN_SV, sv)

        return best


    if "main" in intra:
        r_main, servings_main = _best_recipe("main", intra["main"])
        per_main = recipe_per_portion(r_main, 1.0)
        if servings_main >= MIN_SV:
            items.append(MealItem(recipe_id=r_main.id, servings=servings_main, scale=servings_main, course_type="main"))
            day_fat += per_main.fat_g * servings_main

    if "dessert" in intra:
        r_des, servings_des = _best_recipe("dessert", intra["dessert"])
        per_des = recipe_per_portion(r_des, 1.0)
        if servings_des >= MIN_SV:
            items.append(MealItem(recipe_id=r_des.id, servings=servings_des, scale=servings_des, course_type="dessert"))
            day_fat += per_des.fat_g * servings_des

    if used_recipes is not None and r_main is not None:
        used_recipes.add(r_main.id)
    if desserts_of_day is not None and r_des is not None:
        desserts_of_day.add(r_des.id)

    return Meal(slot=slot, items=items), day_fat

def generate_week(
    kcal_target_per_day: int | None = None,
    allow_repeat: bool = True,
    *,
    fat_limit_g_per_day: Optional[float] = None,
    targets_override: Optional[dict] = None,
) -> WeekPlan:
    idx = _recipes_idx()
    recipes = list(idx.values())

    # --- lecture des flags d'unicité depuis la config
    use_main_week  = CFG["uniqueness"]["mains"]["per_week"]     # plats uniques sur la semaine
    use_des_day    = CFG["uniqueness"]["desserts"]["per_day"]   # desserts uniques sur la journée
    # (Les deux autres flags - mains.per_day et desserts.per_week - nécessitent
    #  d'étendre _compose_meal & _boost_protein_by_swaps : à faire dans un patch séparé.)

    # --- cible kcal/jour (priorité à l'override)
    if kcal_target_per_day is None:
        if targets_override and "kcal_per_day" in targets_override:
            kcal_target_per_day = int(float(targets_override["kcal_per_day"]))
        else:
            kcal_target_per_day = int(load_targets().get("kcal_per_day", 2000))

    days: List[DayPlan] = []

    # set d'unicité "plats de la semaine" (si activé)
    used_mains_week: Optional[Set[str]] = set() if use_main_week else None

    for di in range(7):
        meals: List[Meal] = []
        day_fat_total = 0.0

        # set d'unicité "desserts du jour" (si activé)
        desserts_of_day: Optional[Set[str]] = set() if use_des_day else None

        # --- BREAKFAST
        m, day_fat_total = _compose_meal(
            recipes, "breakfast", kcal_target_per_day, allow_repeat,
            idx=idx,
            day_fat_so_far=day_fat_total,
            fat_limit_g_per_day=fat_limit_g_per_day,
            meals_so_far=meals,
            targets_override=targets_override,
            used_recipes=used_mains_week,          # unicité plats semaine
            desserts_of_day=desserts_of_day        # unicité desserts jour
        )
        meals.append(m)

        # --- LUNCH
        m, day_fat_total = _compose_meal(
            recipes, "lunch", kcal_target_per_day, allow_repeat,
            idx=idx,
            day_fat_so_far=day_fat_total,
            fat_limit_g_per_day=fat_limit_g_per_day,
            meals_so_far=meals,
            targets_override=targets_override,
            used_recipes=used_mains_week,
            desserts_of_day=desserts_of_day
        )
        meals.append(m)

        # --- DINNER
        m, day_fat_total = _compose_meal(
            recipes, "dinner", kcal_target_per_day, allow_repeat,
            idx=idx,
            day_fat_so_far=day_fat_total,
            fat_limit_g_per_day=fat_limit_g_per_day,
            meals_so_far=meals,
            targets_override=targets_override,
            used_recipes=used_mains_week,
            desserts_of_day=desserts_of_day
        )
        meals.append(m)

        # --- Normalisation douce énergie
        _normalize_day_energy(idx, meals, kcal_target_per_day)

        # --- Bandes jour
        T = _macro_targets_per_day(targets_override)
        targets_day = {
            "kcal": kcal_target_per_day,
            "protein": T["protein"],
            "carbs": T["carbs"],
            "fat": T["fat"],
        }
        _enforce_bands(idx, meals, targets_day)

        # --- Swaps protéinés si nécessaire (en respectant les contraintes d’unicité)
        _boost_protein_by_swaps(
            idx, recipes, meals, targets_day,
            used_recipes=used_mains_week,
            desserts_of_day=desserts_of_day,   # évite doublon dessert jour pendant les swaps
            max_swaps=CFG["optimizer"].get("max_swaps_per_day", 6)
        )

        # --- Re-passe bandes
        _enforce_bands(idx, meals, targets_day)

        # --- Normalisation douce des plafonds
        _normalize_day_macros(idx, meals, kcal_target_per_day, T["protein"], T["carbs"], T["fat"])

        days.append(DayPlan(date_index=di, meals=meals))

    plan = WeekPlan(plan_id=f"wk_{uuid.uuid4().hex[:8]}", days=days)
    PLANS[plan.plan_id] = plan
    return plan


def _normalize_day_energy(idx: Dict[str, Recipe], meals: List[Meal], kcal_target_per_day: int):
    for _ in range(2):
        cur = _day_energy(idx, meals)
        if cur <= 1:
            break
        fac = kcal_target_per_day / cur
        if 0.95 <= fac <= 1.05:
            break
        _scale_day_servings(meals, fac)

def swap_recipe(plan_id: str, body) -> WeekPlan:
    plan = PLANS.get(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    day = plan.days[body.day_index]
    target_meal = next((m for m in day.meals if m.slot == body.slot), None)
    if not target_meal:
        raise HTTPException(status_code=400, detail="Invalid slot")

    idx = _recipes_idx()
    if body.item_index is not None and target_meal.items and 0 <= body.item_index < len(target_meal.items):
        target_item = target_meal.items[body.item_index]
    elif body.course_type and target_meal.items:
        target_item = next((i for i in target_meal.items if i.course_type == body.course_type), None)
        if target_item is None:
            target_item = target_meal.items[0]
    else:
        target_item = target_meal.items[0] if target_meal.items else None

    kcal_target_per_day = load_targets().get("kcal_per_day", 2000)

    if target_item:
        target_item.recipe_id = body.to_recipe_id
        slot_total = kcal_target_per_day * SLOT_RATIOS.get(target_meal.slot, 1/3)
        intra = INTRA_RATIOS.get(target_meal.slot, {"main": 1.0})
        part = intra.get(target_item.course_type or "main", 1.0)
        r = idx[target_item.recipe_id]
        target_item.servings = _servings_to_hit_kcal(r, slot_total * part)
        target_item.scale = target_item.servings
    else:
        target_meal.recipe_id = body.to_recipe_id
        base = recipe_per_portion(idx[target_meal.recipe_id], 1.0).energy_kcal or 1.0
        slot_target = kcal_target_per_day * SLOT_RATIOS.get(target_meal.slot, 1/3)
        sv = clamp(slot_target / base, 0.6, 2.5)
        target_meal.servings = round(sv, 2)
        target_meal.scale = target_meal.servings

    _normalize_day_energy(idx, day.meals, kcal_target_per_day)
    day_targets = {
        "kcal": kcal_target_per_day,
        **{k: v for k, v in _macro_targets_per_day().items() if k in ("protein", "carbs", "fat")},
    }
    # reconstruire le set des plats utilisés sur la semaine (mains uniquement)
    idx_rec = _recipes_idx()
    used_recipes: Set[str] = set()
    for d in PLANS[plan_id].days:
        for m in d.meals:
            if not m.items:
                continue
            for it in m.items:
                if (it.course_type or "main") == "main":
                    used_recipes.add(it.recipe_id)
     # NEW: set des desserts déjà présents sur ce jour
    desserts_of_day: Set[str] = set()
    for m in day.meals:
        if not m.items:
            continue
        for it in m.items:
            if (it.course_type or "main") == "dessert":
                desserts_of_day.add(it.recipe_id)
    _enforce_bands(idx, day.meals, day_targets)
    _boost_protein_by_swaps(
        idx, list(idx_rec.values()), day.meals, day_targets,
        used_recipes=used_recipes,
        desserts_of_day=desserts_of_day,   # <-- NEW
        max_swaps=3
    )
    _enforce_bands(idx, day.meals, day_targets)
    return plan

def move_meal(plan_id: str, body) -> WeekPlan:
    plan = PLANS.get(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    try:
        src_meals = plan.days[body.from_day_index].meals
        dst_meals = plan.days[body.to_day_index].meals
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid day_index")

    src = next((m for m in src_meals if m.slot == body.from_slot), None)
    dst = next((m for m in dst_meals if m.slot == body.to_slot), None)
    if not src or not dst:
        raise HTTPException(status_code=400, detail="Invalid slot")

    if getattr(body, "item_index", None) is not None and src.items:
        idx_item = body.item_index
        if not (0 <= idx_item < len(src.items)):
            raise HTTPException(status_code=400, detail="Invalid item_index")
        item = src.items.pop(idx_item)
        dst.items.append(item)
    else:
        src.recipe_id, dst.recipe_id = dst.recipe_id, src.recipe_id
        src.scale, dst.scale = dst.scale, src.scale
        src.items, dst.items = dst.items, src.items

    return plan

# ---------- évaluation ----------

def evaluate_plan(plan: WeekPlan) -> Tuple[List[float], dict, float]:
    idx = _recipes_idx()
    day_kcal: List[float] = []
    weekly = dict(kcal=0.0, protein=0.0, carbs=0.0, fat=0.0, fiber=0.0, sugars=0.0, sodium=0.0)

    for d in plan.days:
        kc = 0.0
        for m in d.meals:
            if m.items:
                for it in m.items:
                    r = idx.get(it.recipe_id)
                    if not r:
                        continue
                    per = recipe_per_portion(r, 1.0)
                    factor = (it.servings or it.scale or 1.0)
                    kc += per.energy_kcal * factor
                    weekly["kcal"]   += per.energy_kcal * factor
                    weekly["protein"]+= per.protein_g * factor
                    weekly["carbs"]  += per.carbs_g * factor
                    weekly["fat"]    += per.fat_g * factor
                    weekly["fiber"]  += per.fiber_g * factor
                    weekly["sugars"] += per.sugars_g * factor
                    weekly["sodium"] += per.sodium_mg * factor
            else:
                r = idx.get(m.recipe_id)
                if not r:
                    continue
                per = recipe_per_portion(r, 1.0)
                factor = (m.servings or m.scale or 1.0)
                kc += per.energy_kcal * factor
                weekly["kcal"]   += per.energy_kcal * factor
                weekly["protein"]+= per.protein_g * factor
                weekly["carbs"]  += per.carbs_g * factor
                weekly["fat"]    += per.fat_g * factor
                weekly["fiber"]  += per.fiber_g * factor
                weekly["sugars"] += per.sugars_g * factor
                weekly["sodium"] += per.sodium_mg * factor
        day_kcal.append(kc)

    target = (load_targets().get("kcal_per_day", 2000)) * 7
    compliance = max(0.0, 1.0 - abs(weekly["kcal"] - target) / max(target, 1.0))
    return day_kcal, weekly, compliance

# ---------- équivalents ----------

def equivalents(base_recipe_id: str, k: int = 5, allow_scaling: bool = True):
    idx = _recipes_idx()
    if base_recipe_id not in idx:
        raise HTTPException(status_code=404, detail="Recipe not found")
    base = idx[base_recipe_id]
    base_n = recipe_per_portion(base, 1.0)

    def vec(n): return (n.energy_kcal, n.protein_g, n.carbs_g, n.fat_g)

    vx = vec(base_n)
    out = []

    for rid, r in idx.items():
        if rid == base_recipe_id:
            continue
        rn = recipe_per_portion(r, 1.0)
        scale = 1.0
        if allow_scaling and rn.energy_kcal > 0:
            scale = max(0.8, min(1.25, vx[0] / rn.energy_kcal))
            rn = recipe_per_portion(r, scale)

        vy = vec(rn)
        d = math.sqrt(
            0.4 * (vx[0] - vy[0]) ** 2 +
            0.3 * (vx[1] - vy[1]) ** 2 +
            0.2 * (vx[2] - vy[2]) ** 2 +
            0.1 * (vx[3] - vy[3]) ** 2
        )

        if (base.meal_types or []) and (r.meal_types or []) and set(base.meal_types) & set(r.meal_types):
            d -= 50.0

        out.append({"recipe_id": rid, "scale": round(scale, 2), "distance": round(d, 3)})

    out.sort(key=lambda x: x["distance"])
    return out[:k]

def evaluate_nutrients(plan: "WeekPlan"):
    weekly = {k: 0.0 for k in NUT_META.keys()}
    idx = _recipes_idx()

    for d in plan.days:
        for m in d.meals:
            if m.items:
                for it in m.items:
                    rec = idx.get(it.recipe_id)
                    if not rec:
                        continue
                    per = recipe_per_portion(rec, 1.0)
                    factor = (it.servings or it.scale or 1.0)
                    for k in weekly.keys():
                        weekly[k] += float(getattr(per, k, 0.0)) * factor
            else:
                rec = idx.get(m.recipe_id)
                if not rec:
                    continue
                per = recipe_per_portion(rec, 1.0)
                factor = (m.servings or m.scale or 1.0)
                for k in weekly.keys():
                    weekly[k] += float(getattr(per, k, 0.0)) * factor

    t = load_targets() or {}
    targets_week = {}
    for k, (unit, target_key) in NUT_META.items():
        if target_key and target_key.endswith("_per_day"):
            v = t.get(target_key)
            targets_week[k] = float(v) * 7.0 if v is not None else None
        else:
            targets_week[k] = None

    epa_dha_target = t.get("omega3_epa_dha_g_per_week")
    weekly_epa_dha = (weekly.get("omega3_epa_g", 0.0) + weekly.get("omega3_dha_g", 0.0))
    targets_week["omega3_epa_dha_g"] = float(epa_dha_target) if epa_dha_target is not None else None

    diffs_week = {}
    for k, total in weekly.items():
        tgt = targets_week.get(k)
        diffs_week[k] = (total - tgt) if (tgt is not None) else None
    diffs_week["omega3_epa_dha_g"] = (weekly_epa_dha - targets_week["omega3_epa_dha_g"]) if (targets_week["omega3_epa_dha_g"] is not None) else None

    units = {k: meta[0] for k, meta in NUT_META.items()}
    units["omega3_epa_dha_g"] = "g"

    return {
        "totals_week": {**weekly, "omega3_epa_dha_g": weekly_epa_dha},
        "targets_week": targets_week,
        "diffs_week": diffs_week,
        "units": units,
    }
