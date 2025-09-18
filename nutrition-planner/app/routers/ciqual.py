# app/routers/ciqual.py
from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from app.schemas.ingredients import IngredientCiqual
from app.services.supabase import select, post_rpc
from app.deps.auth import get_user_token

router = APIRouter(prefix="/ciqual", tags=["ciqual"])


def _map_row_to_ingredient_ciqual(d: dict) -> IngredientCiqual:
    """Homogénéise la forme renvoyée, quelle que soit la source (RPC vs SELECT)."""
    return {
        "ciqual_code": d.get("ciqual_code") or str(d.get("alim_code") or ""),
        "name_fr": d.get("name_fr") or d.get("alim_nom_fr"),
        "grp_name_fr": d.get("grp_name_fr") or d.get("alim_grp_nom_fr"),
        "subgrp_name_fr": d.get("subgrp_name_fr") or d.get("alim_ssgrp_nom_fr"),
        "energy_kcal": d.get("energy_kcal"),
        "protein_g": d.get("protein_g"),
        "carbs_g": d.get("carbs_g"),
        "fat_g": d.get("fat_g"),
    }


# ---------- Nouvelle route de recherche ----------
@router.get("/search", response_model=List[IngredientCiqual])
def search_ciqual(
    q: str = Query(""),
    lim: int = Query(50, ge=1, le=200),
    token: str | None = Depends(get_user_token),
):
    """
    Recherche fuzzy (sans accents) via la RPC `search_ciqual`,
    et renvoie EXACTEMENT les colonnes du modèle IngredientCiqual.
    """
    data = post_rpc("search_ciqual", {"q": q, "lim": lim}, user_jwt=token)
    return [_map_row_to_ingredient_ciqual(d) for d in data]


# ---------- Listing / fallback ----------
@router.get("/ingredients", response_model=List[IngredientCiqual])
def list_ciqual_ingredients(
    q: Optional[str] = Query(default=None, description="search by name"),
    token: str | None = Depends(get_user_token),
):
    """
    - si `q` fourni → essaie la RPC (mêmes colonnes), sinon fallback en SELECT simple
    - si pas de `q` → liste alphabétique (SELECT) limitée à 50
    """
    if q:
        try:
            data = post_rpc("search_ciqual", {"q": q, "lim": 50}, user_jwt=token)
            return [_map_row_to_ingredient_ciqual(d) for d in data]
        except Exception:
            # fallback SELECT ilike si la RPC n’est pas dispo
            pass

    params = "?select=ciqual_code,name_fr,grp_name_fr,subgrp_name_fr,energy_kcal,protein_g,carbs_g,fat_g&order=name_fr.asc&limit=50"
    if q:
        params = "?select=ciqual_code,name_fr,grp_name_fr,subgrp_name_fr,energy_kcal,protein_g,carbs_g,fat_g" \
                 f"&name_fr=ilike.*{q}*&order=name_fr.asc&limit=50"
    data = select("ciqual_foods", params, user_jwt=token)
    return [_map_row_to_ingredient_ciqual(d) for d in data]


# ---------- Détail par code (toutes colonnes brutes) ----------
@router.get("/ingredients/{ciqual_code}")
def get_ciqual_full(ciqual_code: str, token: str | None = Depends(get_user_token)):
    rows = post_rpc("ciqual_full_by_code", {"p_code": ciqual_code}, user_jwt=token)
    if not rows:
        return {"error": "not_found"}
    return rows[0]  # renvoie toutes les colonnes de ciqual_raw
