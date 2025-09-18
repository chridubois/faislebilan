#!/usr/bin/env python3
import sqlite3
import csv
from rapidfuzz import process, fuzz

DB_PATH = "data/processed/ciqual.sqlite"
THRESHOLD = 85  # mappings sous ce score seront considérés "faibles"

def conn():
    return sqlite3.connect(DB_PATH)

def ensure_table(c):
    c.execute("""
    CREATE TABLE IF NOT EXISTS ingredient_mapping (
      local_label TEXT PRIMARY KEY,
      ciqual_code TEXT NOT NULL,
      ciqual_name TEXT,
      confidence REAL
    )
    """)

def load_ciqual(c):
    # [(code, name)]
    return list(c.execute("SELECT ciqual_code, name_fr FROM ingredient"))

def list_mappings(c, only_low=False, limit=None):
    q = "SELECT local_label, ciqual_code, ciqual_name, confidence FROM ingredient_mapping"
    if only_low:
        q += f" WHERE confidence < {THRESHOLD}"
    q += " ORDER BY confidence ASC, local_label ASC"
    if limit:
        q += f" LIMIT {int(limit)}"
    return list(c.execute(q))

def save_mapping(c, local_label, ciqual_code, ciqual_name, confidence):
    c.execute("""
    INSERT OR REPLACE INTO ingredient_mapping(local_label, ciqual_code, ciqual_name, confidence)
    VALUES (?, ?, ?, ?)
    """, (local_label, ciqual_code, ciqual_name, float(confidence)))

def delete_mapping(c, local_label):
    c.execute("DELETE FROM ingredient_mapping WHERE local_label = ?", (local_label,))

def fuzzy_candidates(label, ciqual_list, n=10):
    # ciqual_list: [(code, name)]
    choices = {name: code for code, name in ciqual_list}
    results = process.extract(label, choices.keys(), scorer=fuzz.WRatio, limit=n)
    # [(code, name, score)]
    return [(choices[name], name, score) for name, score, _ in results]

def search_ciqual(ciqual_list, query, n=10):
    return fuzzy_candidates(query, ciqual_list, n=n)

def pick_new_mapping(c, local_label, ciqual_list):
    print(f"\n🔎 Nouveau mapping pour: '{local_label}'")
    cands = fuzzy_candidates(local_label, ciqual_list, n=10)

    def print_cands(cands):
        for i, (code, name, score) in enumerate(cands, 1):
            print(f"  {i:>2}. {name}  [{code}]  (score {score:.1f})")
        print("   s. rechercher…   m. saisir code manuellement   x. annuler")

    while True:
        print_cands(cands)
        choice = input("Ton choix ? ").strip().lower()

        if choice == "x":
            print("  ↩︎ annulé")
            return None

        if choice == "s":
            q = input("  Rechercher (texte libre) : ").strip()
            if not q:
                continue
            cands = search_ciqual(ciqual_list, q, n=10)
            continue

        if choice == "m":
            code = input("  Saisis un ciqual_code exact : ").strip()
            if not code:
                continue
            # retrouver le label si dispo
            row = next(((c,n) for c,n in ciqual_list if c == code), None)
            if not row:
                confirm = input("  Code inconnu en base. Continuer quand même ? (y/N) ").strip().lower()
                if confirm != "y":
                    continue
                name = "(inconnu)"
            else:
                _, name = row
            return (code, name, 100.0)

        # choix 1..N
        try:
            idx = int(choice)
            if 1 <= idx <= len(cands):
                return cands[idx-1]
        except ValueError:
            pass

        print("  ⚠️ choix invalide, réessaye.")

def export_csv(c, path="data/processed/ingredient_mapping.csv"):
    rows = list(c.execute("SELECT local_label, ciqual_code, ciqual_name, confidence FROM ingredient_mapping ORDER BY local_label"))
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["local_label", "ciqual_code", "ciqual_name", "confidence"])
        w.writerows(rows)
    print(f"✅ exporté → {path}")

def review_loop():
    with conn() as cx:
        c = cx.cursor()
        ensure_table(c)
        ciqual_list = load_ciqual(c)

        while True:
            print("\n=== Ingredient Mapping Review ===")
            print(f"(seuil faible = {THRESHOLD})")
            print("1) Lister mappings (tous)")
            print("2) Lister mappings (score faible)")
            print("3) Éditer un mapping")
            print("4) Supprimer un mapping")
            print("5) Export CSV")
            print("6) Revoir tous les faibles (un par un)")
            print("0) Quitter")
            cmd = input("> ").strip()

            if cmd == "0":
                break

            elif cmd == "1":
                rows = list_mappings(c, only_low=False, limit=None)
                print(f"\n{len(rows)} mapping(s)")
                for ll, code, name, score in rows[:200]:
                    print(f"- {ll}  →  {name} [{code}]  (score {score:.1f})")
                if len(rows) > 200:
                    print(f"... {len(rows)-200} de plus")

            elif cmd == "2":
                rows = list_mappings(c, only_low=True, limit=None)
                print(f"\n{len(rows)} mapping(s) faibles (< {THRESHOLD})")
                for ll, code, name, score in rows[:200]:
                    print(f"- {ll}  →  {name} [{code}]  (score {score:.1f})")
                if len(rows) > 200:
                    print(f"... {len(rows)-200} de plus")

            elif cmd == "3":
                ll = input("  Nom local (exact) à éditer : ").strip()
                if not ll:
                    continue
                res = pick_new_mapping(c, ll, ciqual_list)
                if res:
                    code, name, score = res
                    save_mapping(c, ll, code, name, score)
                    cx.commit()
                    print(f"  ✅ sauvegardé: {ll} → {name} [{code}] (score {score:.1f})")

            elif cmd == "4":
                ll = input("  Nom local (exact) à supprimer : ").strip()
                if not ll:
                    continue
                delete_mapping(c, ll)
                cx.commit()
                print("  🗑️ supprimé")

            elif cmd == "5":
                export_csv(c)

            elif cmd == "6":
                rows = list_mappings(c, only_low=True)
                print(f"\nÀ revoir: {len(rows)} mapping(s)")
                for ll, _, _, _ in rows:
                    print(f"\n— {ll} —")
                    res = pick_new_mapping(c, ll, ciqual_list)
                    if res:
                        code, name, score = res
                        save_mapping(c, ll, code, name, score)
                        cx.commit()
                        print(f"  ✅ {ll} → {name} [{code}] (score {score:.1f})")
                print("\n✅ revue terminée")

            else:
                print("  ⚠️ commande inconnue.")

if __name__ == "__main__":
    review_loop()
