#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Génère des CSV pour Supabase:
 - nutrients.csv        → public.nutrients(code,name,unit)
 - nutrient_values.csv  → public.nutrient_values(ingredient_id,nutrient_code,value)

Entrées:
 - Un CSV source: export de staging.ciqual_raw (avec "alim_code" + colonnes nutriments)
 - Option A: un mapping CSV "ingredient_id,alim_code"
 - Option B: un UUID namespace pour fabriquer des UUID déterministes depuis alim_code
             (et optionnellement produire ingredients.csv)

Exemples d'usage:

# A) Avec mapping explicite
python make_supabase_csvs.py \
  --source ./ciqual_raw.csv \
  --mapping ./mapping.csv \
  --out-dir ./out

# B) Sans mapping, UUID déterministe + export ingredients.csv
python make_supabase_csvs.py \
  --source ./ciqual_raw.csv \
  --uuid-namespace 12345678-1234-5678-1234-567812345678 \
  --emit-ingredients \
  --out-dir ./out
"""

import argparse
import os
import re
import uuid
from typing import Optional

import pandas as pd

# Colonnes non-nutriments (identité)
META_COLS = {
    "alim_grp_code",
    "alim_ssgrp_code",
    "alim_ssssgrp_code",
    "alim_grp_nom_fr",
    "alim_ssgrp_nom_fr",
    "alim_ssssgrp_nom_fr",
    "alim_code",
    "alim_nom_fr",
    "alim_nom_sci",
}

# Détection d'unité via le suffixe
UNIT_PATTERNS = [
    (re.compile(r"_g_100g$"), "g"),
    (re.compile(r"_mg_100g$"), "mg"),
    (re.compile(r"_ug_100g$"), "µg"),
    (re.compile(r"_kcal_100g$"), "kcal"),
    (re.compile(r"_kj_100g$"), "kJ"),
]

def unit_from_column(col: str) -> str:
    for pat, unit in UNIT_PATTERNS:
        if pat.search(col):
            return unit
    return ""  # si inconnu

def pretty_name(col: str) -> str:
    # Nom “propre” minimal pour public.nutrients.name
    KNOWN = {
        "protein_625_g_100g": "Protéines",
        "protein_jones_g_100g": "Protéines (Jones)",
        "carbs_g_100g": "Glucides",
        "fat_g_100g": "Lipides",
        "fiber_g_100g": "Fibres alimentaires",
        "sugars_g_100g": "Sucres",
        "salt_g_100g": "Sel",
        "energy_reg_kcal_100g": "Énergie (kcal)",
        "energy_reg_kj_100g": "Énergie (kJ)",
        "energy_jones_kcal_100g": "Énergie (Jones, kcal)",
        "energy_jones_kj_100g": "Énergie (Jones, kJ)",
        "vitamin_c_mg_100g": "Vitamine C",
        "vitamin_b12_ug_100g": "Vitamine B12",
        "cholesterol_mg_100g": "Cholestérol",
    }
    if col in KNOWN:
        return KNOWN[col]
    name = re.sub(r"_100g$", "", col)
    name = name.replace("_", " ")
    name = name.replace("vitamin", "vitamine").replace("beta carotene", "β-carotène")
    name = name.replace("ag ", "AG ")
    return name[:1].upper() + name[1:]

def to_numeric_safe(x) -> Optional[float]:
    # Convertit '<0.1', '≈0,5', '~1' → float ; sinon None
    if pd.isna(x):
        return None
    if isinstance(x, (int, float)):
        return float(x)
    s = str(x).strip().replace(",", ".")
    s = re.sub(r"^[<≈~]\s*", "", s)
    try:
        return float(s)
    except ValueError:
        return None

def sniff_read_csv(path: str, encoding: Optional[str], delimiter: Optional[str]) -> pd.DataFrame:
    encodings = [encoding] if encoding else ["utf-8", "utf-8-sig", "latin1", "cp1252"]
    if delimiter:
        for enc in encodings:
            try:
                return pd.read_csv(path, sep=delimiter, encoding=enc)
            except Exception:
                continue
        raise RuntimeError("Impossible de lire le CSV avec l'encodage/délimiteur spécifiés.")
    for enc in encodings:
        try:
            return pd.read_csv(path, sep=None, engine="python", encoding=enc)
        except Exception:
            continue
    raise RuntimeError("Impossible de lire le CSV avec les encodages testés.")

def make_uuid_deterministic(namespace: uuid.UUID, alim_code: str) -> uuid.UUID:
    # uuid5 stable basé sur alim_code (str)
    return uuid.uuid5(namespace, str(alim_code))

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", required=True, help="CSV source (export staging.ciqual_raw)")
    ap.add_argument("--out-dir", default="./out")
    ap.add_argument("--encoding", default=None)
    ap.add_argument("--delimiter", default=None)

    # Mode A: mapping explicite
    ap.add_argument("--mapping", default=None, help="CSV mapping avec colonnes: ingredient_id,alim_code")

    # Mode B: génération d'UUID déterministes
    ap.add_argument("--uuid-namespace", default=None, help="UUID namespace (ex: 123e4567-e89b-12d3-a456-426614174000)")
    ap.add_argument("--emit-ingredients", action="store_true", help="Si défini avec --uuid-namespace, exporte aussi ingredients.csv")

    args = ap.parse_args()
    os.makedirs(args.out_dir, exist_ok=True)

    # Lire source
    df = sniff_read_csv(args.source, args.encoding, args.delimiter)

    # Contrôles
    if "alim_code" not in df.columns:
        raise ValueError("Le CSV source doit contenir la colonne 'alim_code'.")

    # Identifier colonnes nutriments = toutes sauf META_COLS
    nutrient_cols = [c for c in df.columns if c not in META_COLS]

    # ---------- nutrients.csv ----------
    nutrients_df = pd.DataFrame({
        "code": nutrient_cols,
        "name": [pretty_name(c) for c in nutrient_cols],
        "unit": [unit_from_column(c) for c in nutrient_cols],
    }).drop_duplicates(subset=["code"]).sort_values("code")

    nutrients_path = os.path.join(args.out_dir, "nutrients.csv")
    nutrients_df.to_csv(nutrients_path, index=False)
    print(f"[OK] nutrients.csv → {nutrients_path} ({len(nutrients_df)} nutriments)")

    # ---------- Préparation des IDs ingrédients ----------
    if args.mapping:
        map_df = sniff_read_csv(args.mapping, None, None)
        required_cols = {"ingredient_id", "alim_code"}
        if not required_cols.issubset(set(map_df.columns)):
            raise ValueError("Le mapping doit contenir les colonnes: ingredient_id, alim_code")
        map_df = map_df[["ingredient_id", "alim_code"]].dropna().drop_duplicates()
        # Jointure pour récupérer ingredient_id par alim_code
        id_map = map_df.set_index("alim_code")["ingredient_id"]
        mode = "mapping"
    elif args.uuid_namespace:
        try:
            ns = uuid.UUID(args.uuid_namespace)
        except ValueError:
            raise ValueError("--uuid-namespace doit être un UUID valide")
        # Génère des UUID déterministes pour tous les alim_code présents
        unique_alims = df[["alim_code", "alim_nom_fr"]].drop_duplicates()
        unique_alims["ingredient_id"] = unique_alims["alim_code"].astype(str).map(lambda x: str(make_uuid_deterministic(ns, x)))
        id_map = unique_alims.set_index("alim_code")["ingredient_id"]
        mode = "uuid5"
        if args.emit_ingredients:
            ingredients_csv = os.path.join(args.out_dir, "ingredients.csv")
            # Export minimal pour peupler public.ingredients si nécessaire
            # Adapter les colonnes si ton schéma a d'autres champs requis
            unique_alims[["ingredient_id", "alim_code", "alim_nom_fr"]].rename(
                columns={"ingredient_id": "id", "alim_nom_fr": "name"}
            ).to_csv(ingredients_csv, index=False)
            print(f"[OK] ingredients.csv → {ingredients_csv} ({len(unique_alims)} lignes)")
    else:
        raise ValueError("Tu dois fournir soit --mapping, soit --uuid-namespace.")

    # ---------- nutrient_values.csv ----------
    long_df = df[["alim_code"] + nutrient_cols].melt(
        id_vars=["alim_code"],
        var_name="nutrient_code",
        value_name="value"
    )

    # Conversion numérique; valeur NOT NULL attendue par la table
    long_df["value"] = long_df["value"].map(to_numeric_safe)
    long_df = long_df.dropna(subset=["value"])

    # Appliquer mapping vers ingredient_id
    long_df["ingredient_id"] = long_df["alim_code"].map(id_map)

    # Enlever les lignes sans correspondance d'ID
    missing = long_df["ingredient_id"].isna().sum()
    if missing > 0:
        print(f"[WARN] {missing} lignes sans ingredient_id (alim_code non mappé) → ignorées.")
        long_df = long_df.dropna(subset=["ingredient_id"])

    out_values = long_df[["ingredient_id", "nutrient_code", "value"]]

    values_path = os.path.join(args.out_dir, "nutrient_values.csv")
    out_values.to_csv(values_path, index=False)
    print(f"[OK] nutrient_values.csv → {values_path} ({len(out_values):,} lignes)  [mode={mode}]")

if __name__ == "__main__":
    main()
