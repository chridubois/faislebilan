# scripts/map_ingredients.py
import json
import sqlite3
import re
import unicodedata
from typing import List, Tuple, Dict, Optional
from rapidfuzz import fuzz

DB_PATH = "data/processed/ciqual.sqlite"
RECIPES_RAW = "data/raw/recipes.json"
OUTPUT = "data/processed/recipes_mapped.json"
SEED_OVERRIDES_CSV = "data/raw/ingredient_overrides.csv"  # optionnel

# Seuils
AUTO_OK = 90          # au-dessus -> auto
ASK_IF_BETWEEN = 80   # 80..90 -> demander confirmation
TOPN = 12

# Vocabulaire à exclure très fortement (plats composés, préparations)
HARD_EXCLUDE = [
    "soupe", "potage", "velouté",
    "sandwich", "burger", "wrap", "kebab", "tacos", "croque",
    "couscous", "tajine", "paella", "paupiette", "gratin",
    "pizza", "quiche", "tourte", "lasagne", "bolognaise", "carbonara",
    "salade", "préemballée", "preemballee", "à réchauffer", "a rechauffer",
    "garniture", "garnitures", "fait maison",
]

# Règles anti-collisions spécifiques
ANTI_COLLISIONS = [
    # si local contient "oeuf", rejetter les candidats contenant "boeuf"
    (re.compile(r"\boeuf\b", re.I), re.compile(r"\bboeuf\b", re.I)),
]

# Canonicalisations des libellés d’entrée
CANONICAL = {
    "epinards": "épinard",
    "oeuf": "œuf",
    "huile olive": "huile d'olive",
    "huile d olive": "huile d'olive",
    "tomate concassee": "tomate concassée",
    "lait coco": "lait de coco",
    "lait amande": "boisson aux amandes",
    "flocons avoine": "flocon d'avoine",
    "beurre cacahuete": "beurre de cacahuète",
    "mais": "maïs",
    "yaourt": "yaourt nature",
    "granola": "muesli croustillant",
    "spaghetti": "spaghetti",
    "champignons": "champignon",
}

def strip_accents(s: str) -> str:
    s = unicodedata.normalize("NFKD", s)
    return "".join(c for c in s if not unicodedata.combining(c))

def normalize(s: str) -> str:
    s0 = s.strip().lower()
    s1 = strip_accents(s0)
    s1 = re.sub(r"[’']", " ", s1)
    s1 = re.sub(r"[^a-z0-9]+", " ", s1)
    s1 = re.sub(r"\s+", " ", s1).strip()
    # singularisation légère
    s1 = re.sub(r"s\b", "", s1)
    return s1

def canonicalize(s: str) -> str:
    n = normalize(s)
    return CANONICAL.get(n, n)

# ---------------- DB ----------------

def conn():
    return sqlite3.connect(DB_PATH)

def ensure_mapping_table(c):
    c.execute("""
    CREATE TABLE IF NOT EXISTS ingredient_mapping (
      local_label TEXT PRIMARY KEY,
      ciqual_code TEXT NOT NULL,
      ciqual_name TEXT,
      confidence REAL
    )
    """)

def get_existing_mapping(c, local_label):
    return c.execute(
        "SELECT ciqual_code, ciqual_name, confidence FROM ingredient_mapping WHERE local_label = ?",
        (local_label,)
    ).fetchone()

def save_mapping(c, local_label, code, name, score):
    c.execute("""
    INSERT OR REPLACE INTO ingredient_mapping(local_label, ciqual_code, ciqual_name, confidence)
    VALUES (?, ?, ?, ?)
    """, (local_label, code, name, float(score)))

def load_ciqual_candidates(c) -> List[Tuple[str, str]]:
    # Si ta table ingredient a une colonne is_prepared (0/1), utilise-la
    has_col = c.execute("PRAGMA table_info(ingredient)").fetchall()
    has_is_prepared = any(r[1] == "is_prepared" for r in has_col)
    if has_is_prepared:
        rows = list(c.execute("""
            SELECT ciqual_code, name_fr
            FROM ingredient
            WHERE IFNULL(is_prepared,0) = 0
        """))
    else:
        # Fallback : filtre textuel grossier
        not_like = " AND ".join([f"name_fr NOT LIKE '%{kw}%'" for kw in HARD_EXCLUDE])
        rows = list(c.execute(f"""
            SELECT ciqual_code, name_fr
            FROM ingredient
            WHERE 1=1 AND {not_like}
        """))
    return rows

def load_seed_overrides() -> Dict[str, str]:
    """
    CSV optionnel : local_label,ciqual_code
    """
    import os, csv
    path = SEED_OVERRIDES_CSV
    if not os.path.exists(path):
        return {}
    out: Dict[str,str] = {}
    with open(path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            local = row.get("local_label") or ""
            code = row.get("ciqual_code") or ""
            if local and code:
                out[local] = code
    return out

# ------------- Scoring -------------

def is_hard_excluded(name: str) -> bool:
    n = normalize(name)
    return any(kw in n.split() for kw in [normalize(k) for k in HARD_EXCLUDE])

def violates_anti_collision(local: str, cand: str) -> bool:
    for pat_local, pat_bad in ANTI_COLLISIONS:
        if pat_local.search(local) and pat_bad.search(cand):
            return True
    return False

def composite_score(local: str, cand: str) -> float:
    l = canonicalize(local)
    c = canonicalize(cand)
    # hard exclusions: renvoyer 0 direct
    if is_hard_excluded(c) or violates_anti_collision(l, c):
        return 0.0
    # base
    w = fuzz.WRatio(l, c)
    t = fuzz.token_set_ratio(l, c)
    score = 0.65 * w + 0.35 * t
    # bonus si tous les tokens locaux sont dans le candidat
    lt = set(l.split())
    ct = set(c.split())
    if lt and lt.issubset(ct):
        score += 8
    return max(0.0, min(100.0, score))

def rank_candidates(local_label: str, ciqual_list: List[Tuple[str, str]], topn=TOPN):
    scored = []
    for code, name in ciqual_list:
        s = composite_score(local_label, name)
        if s <= 0:
            continue
        scored.append((code, name, s))
    scored.sort(key=lambda x: x[2], reverse=True)
    return scored[:topn]

# ---------- Interaction ----------

def pick_interactive(local: str, candidates: List[Tuple[str,str,float]], c, ciqual_all):
    print(f"\n[CHOIX] {local} — aucun match sûr")
    for i,(code,name,sc) in enumerate(candidates,1):
        print(f"  {i}. {name} [{code}]  score={sc:.1f}")
    print("  s. rechercher un terme   m. saisir un ciqual_code   x. ignorer")

    while True:
        ch = input("Ton choix ? ").strip().lower()
        if ch == "x":
            return None
        if ch == "s":
            q = input("  Terme à rechercher: ").strip()
            if not q:
                continue
            # recherche libre sur l’ensemble
            found = rank_candidates(q, ciqual_all, topn=TOPN)
            for i,(code,name,sc) in enumerate(found,1):
                print(f"  {i}. {name} [{code}]  score={sc:.1f}")
            sub = input("  Choix (1..N) ou Entrée pour annuler: ").strip()
            if sub.isdigit():
                k = int(sub)
                if 1 <= k <= len(found):
                    return found[k-1]
            continue
        if ch == "m":
            code = input("  ciqual_code exact: ").strip()
            if code:
                row = next(((c_,n_) for c_,n_ in ciqual_all if c_ == code), None)
                name = row[1] if row else "(inconnu)"
                return (code, name, 100.0 if row else 80.0)
            continue
        if ch.isdigit():
            k = int(ch)
            if 1 <= k <= len(candidates):
                return candidates[k-1]
        print("  ⚠️ choix invalide.")

# ---------- Main ----------

def main():
    seed = load_seed_overrides()  # {"pain complet": "xxxxx", ...}

    with conn() as cx:
        c = cx.cursor()
        ensure_mapping_table(c)
        ciqual = load_ciqual_candidates(c)
        ciqual_all = list(c.execute("SELECT ciqual_code, name_fr FROM ingredient"))

        # charge recettes
        with open(RECIPES_RAW, "r", encoding="utf-8") as f:
            recipes = json.load(f)

        mapped_recipes = []

        for recipe in recipes:
            new_ings = []
            for ing in recipe["ingredients"]:
                local = ing["ingredient_name"]

                # 0) mapping déjà validé ?
                exist = get_existing_mapping(c, local)
                if exist:
                    code, name, sc = exist
                    print(f"✅ {local} → {name} [{code}] (déjà mappé, score={sc:.1f})")
                    new_ings.append({**ing, "ciqual_code": code, "ciqual_name": name, "confidence": sc})
                    continue

                # 1) seed override (CSV)
                if local in seed:
                    code = seed[local]
                    row = next(((c_,n_) for c_,n_ in ciqual_all if c_ == code), None)
                    name = row[1] if row else "(inconnu)"
                    sc = 100.0 if row else 85.0
                    print(f"[SEED] {local} → {name} [{code}]")
                    save_mapping(c, local, code, name, sc)
                    new_ings.append({**ing, "ciqual_code": code, "ciqual_name": name, "confidence": sc})
                    continue

                # 2) ranking
                cand = rank_candidates(local, ciqual, topn=TOPN)
                if not cand:
                    # fallback: recherche libre
                    cand = rank_candidates(local, ciqual_all, topn=TOPN)

                if not cand:
                    print(f"🚫 Aucun candidat pour {local}")
                    new_ings.append({**ing, "ciqual_code": None, "ciqual_name": None, "confidence": 0})
                    continue

                best_code, best_name, best_sc = cand[0]

                if best_sc >= AUTO_OK:
                    print(f"[AUTO] {local} → {best_name} [{best_code}] score={best_sc:.1f}")
                    save_mapping(c, local, best_code, best_name, best_sc)
                    new_ings.append({**ing, "ciqual_code": best_code, "ciqual_name": best_name, "confidence": best_sc})
                elif best_sc < ASK_IF_BETWEEN:
                    pick = pick_interactive(local, cand, c, ciqual_all)
                    if pick is None:
                        new_ings.append({**ing, "ciqual_code": None, "ciqual_name": None, "confidence": 0})
                    else:
                        code, name, sc = pick
                        save_mapping(c, local, code, name, sc)
                        new_ings.append({**ing, "ciqual_code": code, "ciqual_name": name, "confidence": sc})
                else:
                    # confirmer
                    print(f"[CONFIRM] {local} → {best_name} [{best_code}] score={best_sc:.1f}")
                    yn = input("  Confirmer ? (Y/n) ").strip().lower()
                    if yn in ("", "y", "o", "oui"):
                        save_mapping(c, local, best_code, best_name, best_sc)
                        new_ings.append({**ing, "ciqual_code": best_code, "ciqual_name": best_name, "confidence": best_sc})
                    else:
                        pick = pick_interactive(local, cand, c, ciqual_all)
                        if pick is None:
                            new_ings.append({**ing, "ciqual_code": None, "ciqual_name": None, "confidence": 0})
                        else:
                            code, name, sc = pick
                            save_mapping(c, local, code, name, sc)
                            new_ings.append({**ing, "ciqual_code": code, "ciqual_name": name, "confidence": sc})

            recipe["ingredients_mapped"] = new_ings
            mapped_recipes.append(recipe)

        with open(OUTPUT, "w", encoding="utf-8") as f:
            json.dump(mapped_recipes, f, indent=2, ensure_ascii=False)

        cx.commit()
        print(f"\n✅ Recettes enrichies → {OUTPUT}")
        print("ℹ️ Les choix sont mémorisés dans ingredient_mapping.")

if __name__ == "__main__":
    main()
