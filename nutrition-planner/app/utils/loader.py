# app/utils/loader.py
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional

# Ton dossier data est dans racine/app/data
BASE = Path(__file__).resolve().parents[1] / "data"

class _Cache:
    def __init__(self):
        self.data: Dict[str, Any] = {}
        self.mtime: Dict[str, float] = {}

CACHE = _Cache()

def _load(file: str):
    path = BASE / file
    if not path.exists():
        return []
    m = path.stat().st_mtime
    if file in CACHE.data and CACHE.mtime.get(file) == m:
        return CACHE.data[file]
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    CACHE.data[file] = data
    CACHE.mtime[file] = m
    return data

def invalidate_cache(file: Optional[str] = None) -> None:
    """
    Vide le cache disque mémoire.
    - file=None : vide tout
    - file="recipes.json" : vide uniquement cette entrée
    """
    if file is None:
        CACHE.data.clear()
        CACHE.mtime.clear()
    else:
        CACHE.data.pop(file, None)
        CACHE.mtime.pop(file, None)

# -------- Chargements bruts (inchangés) --------

def load_ingredients() -> List[dict]:
    return _load("ingredients.json") or []

def load_recipes() -> List[dict]:
    return _load("recipes.json") or []

def load_targets() -> dict:
    return _load("targets.json") or {}

# -------- Helpers pratiques pour le nouveau schéma --------

def load_recipes_with_defaults() -> List[dict]:
    """
    Retourne les recettes en injectant des valeurs par défaut utiles à la V2:
      - course_type: "main" si absent (rétro-compat)
    Ne fait PAS de validation Pydantic (rapide).
    """
    recs = list(load_recipes() or [])
    for r in recs:
        r.setdefault("course_type", "main")
    return recs

def load_recipes_index(validate: bool = False) -> Dict[str, Any]:
    """
    Index {id -> recette}, avec:
      - injection course_type="main" si manquant
      - option validate=True pour renvoyer des objets Pydantic Recipe
    """
    recs = load_recipes_with_defaults()
    if not validate:
        return {r["id"]: r for r in recs if isinstance(r, dict) and "id" in r}

    # Validation Pydantic (optionnelle pour les services qui le souhaitent)
    from app.models import Recipe  # import local pour éviter les cycles au démarrage
    idx: Dict[str, Any] = {}
    for r in recs:
        try:
            idx[r["id"]] = Recipe.model_validate(r)
        except Exception:
            # En cas d’erreur de validation, on laisse passer la version dict
            idx[r["id"]] = r
    return idx

def load_ingredients_index() -> Dict[str, dict]:
    """Index {ingredient_id -> ingredient_dict} depuis ingredients.json"""
    data = load_ingredients() or []
    return {i["id"]: i for i in data if isinstance(i, dict) and "id" in i}

def load_profiles() -> list[dict]:
    """
    Charge app/data/profiles.json et retourne la liste des profils.
    Le fichier peut être soit un tableau direct, soit un objet { profiles: [...] }.
    """
    data = _load("profiles.json") or []
    if isinstance(data, dict) and "profiles" in data:
        return data.get("profiles") or []
    return data if isinstance(data, list) else []
