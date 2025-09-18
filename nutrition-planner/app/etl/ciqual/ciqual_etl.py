# app/etl/ciqual/ciqual_etl.py
from __future__ import annotations
import os
import re
import unicodedata
import pandas as pd
import sqlalchemy as sa

RAW_XLS = "data/raw/ciqual/Table Ciqual 2020_FR_2020 07 07.xls"
DB_URL  = "sqlite:///data/processed/ciqual.sqlite"

# ---------- helpers ----------

def slugify(s: str) -> str:
    """normalise un en-tête FR en snake_case ASCII (conserve n° en 'n_')."""
    s = unicodedata.normalize("NFKD", s)
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    s = s.strip().lower()
    s = s.replace("n°", "n_").replace("°", "")
    # virgules -> espace, slash -> '_', % -> 'pct'
    s = s.replace(",", " ").replace("/", "_").replace("%", "pct")
    # remplace tout non alnum par underscore
    s = re.sub(r"[^a-z0-9]+", "_", s)
    s = re.sub(r"_+", "_", s).strip("_")
    return s

_unit_pat = re.compile(r"\(([^)]+)\s*/\s*100\s*g\)", re.IGNORECASE)

def unit_from_header(label: str) -> str | None:
    """extrait l'unité depuis le libellé d'origine: '(kJ/100 g)', '(g/100 g)', etc."""
    m = _unit_pat.search(label)
    if not m:
        return None
    u = m.group(1).strip()
    # uniformise
    if u.lower() in {"kj", "kilojoules"}: return "kJ"
    if u.lower() in {"kcal", "kilocalories"}: return "kcal"
    if u.lower() in {"g", "grammes", "gramme"}: return "g"
    if u.lower() in {"mg", "milligrammes", "milligramme"}: return "mg"
    if u.lower() in {"µg", "ug", "microgrammes", "microgramme"}: return "µg"
    return u

# ---------- ETL ----------

def main():
    if not os.path.exists(RAW_XLS):
        raise SystemExit(f"Fichier introuvable: {RAW_XLS}")

    # 1) read
    df_raw = pd.read_excel(RAW_XLS)

    # 2) conserve mapping "original header" -> "normalized"
    orig_cols = list(df_raw.columns)
    norm_cols = [slugify(c) for c in orig_cols]
    rename_map = dict(zip(orig_cols, norm_cols))
    inv_rename_map = dict(zip(norm_cols, orig_cols))  # pour retrouver le libellé d'origine

    df = df_raw.rename(columns=rename_map)

    # 3) colonnes "meta" (présentes dans ton fichier)
    # codes & libellés
    meta_cols = [
        "alim_grp_code",
        "alim_ssgrp_code",
        "alim_ssssgrp_code",
        "alim_grp_nom_fr",
        "alim_ssgrp_nom_fr",
        "alim_ssssgrp_nom_fr",
        "alim_code",
        "alim_nom_fr",
        "alim_nom_sci",
    ]
    missing_meta = [c for c in meta_cols if c not in df.columns]
    if missing_meta:
        raise SystemExit(f"Colonnes meta manquantes dans le XLS après normalisation: {missing_meta}")

    # 4) colonnes nutriments = le reste
    nutrient_cols = [c for c in df.columns if c not in meta_cols]

    # 5) staging: ingrédients
    ingredients = (
        df[meta_cols]
        .drop_duplicates(subset=["alim_code"])
        .rename(columns={
            "alim_code": "ciqual_code",
            "alim_nom_fr": "name_fr",
        })
    )
    ingredients["category_label"] = (
        df["alim_ssssgrp_nom_fr"]
        .fillna(df["alim_ssgrp_nom_fr"])
        .fillna(df["alim_grp_nom_fr"])
    )
    ingredients["source_version"] = "CIQUAL_2020"
    ingredients["source_url"] = "https://ciqual.anses.fr/"

    # 6) staging: nutriments (catalogue)
    # on crée un "code" technique = nom normalisé; "label" = libellé d'origine;
    # "unit" = extraite depuis le libellé d'origine
    nut_rows = []
    for col_norm in nutrient_cols:
        label_orig = inv_rename_map.get(col_norm, col_norm)
        unit = unit_from_header(label_orig)
        nut_rows.append({"code": col_norm, "label": label_orig, "unit": unit})
    nutrients = pd.DataFrame(nut_rows).drop_duplicates(subset=["code"])

    # 7) staging: valeurs longues (ingredient_nutrient)
    long = df.melt(
        id_vars=meta_cols,
        value_vars=nutrient_cols,
        var_name="nutrient_code",
        value_name="per_100g_value",
    ).rename(columns={"alim_code": "ciqual_code"})

    long["per_100g_value"] = pd.to_numeric(long["per_100g_value"], errors="coerce").fillna(0.0)

    # déduplique pour éviter les conflits PK
    long = (
        long.groupby(["ciqual_code", "nutrient_code"], as_index=False)
            .agg({"per_100g_value": "mean"})
    )

    # 8) write DB
    os.makedirs("data/processed", exist_ok=True)
    engine = sa.create_engine(DB_URL)

    with engine.begin() as conn:
        # staging
        ingredients.to_sql("stg_ingredient", conn, if_exists="replace", index=False)
        nutrients.to_sql("stg_nutrient",   conn, if_exists="replace", index=False)
        long.to_sql("stg_values",          conn, if_exists="replace", index=False)

        # DDL (un statement par appel)
        conn.exec_driver_sql("DROP TABLE IF EXISTS ingredient")
        conn.exec_driver_sql("""
        CREATE TABLE ingredient (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ciqual_code TEXT UNIQUE,
          name_fr TEXT,
          category_label TEXT,
          source_version TEXT,
          source_url TEXT
        )
        """)

        conn.exec_driver_sql("DROP TABLE IF EXISTS nutrient")
        conn.exec_driver_sql("""
        CREATE TABLE nutrient (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          code TEXT UNIQUE,
          label TEXT,
          unit TEXT
        )
        """)

        conn.exec_driver_sql("DROP TABLE IF EXISTS ingredient_nutrient")
        conn.exec_driver_sql("""
        CREATE TABLE ingredient_nutrient (
          ingredient_id INTEGER,
          nutrient_id INTEGER,
          per_100g_value REAL,
          PRIMARY KEY (ingredient_id, nutrient_id),
          FOREIGN KEY (ingredient_id) REFERENCES ingredient(id),
          FOREIGN KEY (nutrient_id) REFERENCES nutrient(id)
        )
        """)

        # Inserts
        conn.exec_driver_sql("""
        INSERT INTO ingredient (ciqual_code, name_fr, category_label, source_version, source_url)
        SELECT
          ciqual_code,
          name_fr,
          COALESCE(alim_ssssgrp_nom_fr, alim_ssgrp_nom_fr, alim_grp_nom_fr) AS category_label,
          source_version,
          source_url
        FROM stg_ingredient
        """)

        conn.exec_driver_sql("""
        INSERT OR IGNORE INTO nutrient (code, label, unit)
        SELECT code, label, unit
        FROM stg_nutrient
        """)

        conn.exec_driver_sql("""
        INSERT INTO ingredient_nutrient (ingredient_id, nutrient_id, per_100g_value)
        SELECT i.id, n.id, v.per_100g_value
        FROM stg_values v
        JOIN ingredient i ON i.ciqual_code = v.ciqual_code
        JOIN nutrient   n ON n.code = v.nutrient_code
        """)

    print("✅ CIQUAL import terminé → data/processed/ciqual.sqlite")

if __name__ == "__main__":
    main()
