# app/routers/ingredients.py
from __future__ import annotations
import unicodedata
from uuid import UUID
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from requests import HTTPError as RequestsHTTPError

from app.services.supabase import (
    select as sb_select,
    insert as sb_insert,
    patch as sb_patch,
    delete as sb_delete,
)

router = APIRouter(prefix="/ingredients")

def get_bearer_token(authorization: Optional[str] = Header(None)) -> Optional[str]:
    if authorization and authorization.lower().startswith("bearer "):
        return authorization.split(" ", 1)[1].strip()
    return None

def _strip_accents_lower(s: str) -> str:
    """Normalise en minuscule et retire les accents (NFD)."""
    nf = unicodedata.normalize("NFD", s)
    return "".join(c for c in nf if unicodedata.category(c) != "Mn").lower()

@router.get("")
def list_ingredients(
    token: Optional[str] = Depends(get_bearer_token),
    q: Optional[str] = Query(None, description="Recherche ILIKE sur name"),
    ciqual_code: Optional[str] = Query(None, description="Filtre exact sur ciqual_code"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    filters = []
    if q:
        filters.append(f"name=ilike.*{q}*")
    if ciqual_code:
        filters.append(f"ciqual_code=eq.{ciqual_code}")

    select_cols = "id,name,category,labels,allergens,ciqual_code"
    params = f"?select={select_cols}&order=name.asc&limit={limit}&offset={offset}"
    if filters:
        params += "&" + "&".join(filters)
    return sb_select("public.ingredients", params, user_jwt=token)


@router.get("/{ingredient_id}")
def get_ingredient(
    ingredient_id: UUID,
    token: Optional[str] = Depends(get_bearer_token),
):
    """
    Détail d'un ingrédient.
    `states` peut être un JSONB mappant `Record<string, IngredientState>` côté front.
    """
    rows = sb_select("public.ingredients", f"?select=*&id=eq.{ingredient_id}&limit=1", user_jwt=token)
    if not rows:
        raise HTTPException(404, "not_found")
    return rows[0]


@router.post("")
def create_ingredient(body: Dict[str, Any], token: Optional[str] = Depends(get_bearer_token)):
    """
    Création idempotente :
    - `ciqual_code` OBLIGATOIRE (clé fonctionnelle).
    - Si `name` est vide, on le déduit depuis la vue `ciqual_foods`.
    - Si l'ingrédient existe déjà (conflit 409), on renvoie l'existant.
    """
    allowed = {"name", "ciqual_code", "category", "labels", "allergens"}
    payload = {k: v for k, v in (body or {}).items() if k in allowed}

    ciqual_code = payload.get("ciqual_code")
    if not ciqual_code:
        raise HTTPException(400, "ciqual_code_required")

    # Auto-remplir name depuis la vue CIQUAL si absent
    if not payload.get("name"):
        try:
            ciqual = sb_select(
                "public.ciqual_foods",
                f"?select=name_fr&ciqual_code=eq.{ciqual_code}&limit=1",
                user_jwt=token,
            )
            if ciqual and ciqual[0].get("name_fr"):
                payload["name"] = ciqual[0]["name_fr"]
        except Exception:
            # Pas bloquant : si la vue n'est pas accessible on continue sans name
            pass

    # Tentative d'insertion
    try:
        rows = sb_insert("public.ingredients", [payload], user_jwt=token)
        return rows[0]
    except HTTPException as e:
        # Le wrapper peut convertir la 409 en HTTPException FastAPI
        if e.status_code == 409:
            existing = sb_select(
                "public.ingredients",
                f"?select=*&ciqual_code=eq.{ciqual_code}&limit=1",
                user_jwt=token,
            )
            if existing:
                return existing[0]
            raise
        raise
    except RequestsHTTPError as re:  # si le wrapper relaie l'erreur requests
        if getattr(re.response, "status_code", None) == 409:
            existing = sb_select(
                "public.ingredients",
                f"?select=*&ciqual_code=eq.{ciqual_code}&limit=1",
                user_jwt=token,
            )
            if existing:
                return existing[0]
        raise


@router.patch("/{ingredient_id}")
def update_ingredient(
    ingredient_id: UUID,
    body: Dict[str, Any],
    token: Optional[str] = Depends(get_bearer_token),
):
    """
    Mise à jour partielle (filtrée).
    Compatible avec `Ingredient` (mais on n'autorise pas tout en écriture).
    """
    allowed = {
        "name", "category", "labels", "allergens",
        "ciqual_code", "states"  # si tu veux permettre l'édition des états JSONB
    }
    payload = {k: v for k, v in (body or {}).items() if k in allowed}
    if not payload:
        rows = sb_select("public.ingredients", f"?id=eq.{ingredient_id}&limit=1", user_jwt=token)
        if not rows:
            raise HTTPException(404, "not_found")
        return rows[0]

    rows = sb_patch("public.ingredients", payload, params=f"?id=eq.{ingredient_id}", user_jwt=token)
    if not rows:
        raise HTTPException(404, "not_found")
    return rows[0]


@router.delete("/{ingredient_id}")
def delete_ingredient(ingredient_id: UUID, token: Optional[str] = Depends(get_bearer_token)):
    """
    Suppression.
    Attention aux FK (ex: recipe_items) -> ON DELETE RESTRICT/CASCADE selon ton modèle.
    """
    sb_delete("public.ingredients", params=f"?id=eq.{ingredient_id}", user_jwt=token)
    return {"ok": True}


# -------- Optionnel : recherche CIQUAL (utile pour autocompletion) --------
@router.get("/ciqual/search")
def search_ciqual(
    token: Optional[str] = Depends(get_bearer_token),
    q: str = Query(..., min_length=2),
    limit: int = Query(20, ge=1, le=100),
    full: bool = Query(False, description="Retourne toutes les colonnes de la vue"),
):
    """
    Recherche dans la vue materialized `public.ciqual_foods`.
    Colonnes dispo: ciqual_code, name_fr, grp_name_fr, subgrp_name_fr,
                    energy_kcal, protein_g, carbs_g, fat_g,
                    name_fr_norm, grp_name_fr_norm, subgrp_name_fr_norm
    """
    table = "public.ciqual_foods"

    # Normalise la requête pour matcher 'name_fr_norm'
    norm_q = _strip_accents_lower(q)

    if full:
        params = (
            f"?select=*"
            f"&name_fr_norm=ilike.*{norm_q}*"
            f"&order=name_fr.asc"
            f"&limit={limit}"
        )
        return sb_select(table, params, user_jwt=token)

    # Retour "léger" pour l'autocomplete
    params = (
        "?select="
        "ciqual_code,"
        "name_fr,"
        "grp_name_fr,"
        "subgrp_name_fr"
        f"&name_fr_norm=ilike.*{norm_q}*"
        f"&order=name_fr.asc"
        f"&limit={limit}"
    )
    rows = sb_select(table, params, user_jwt=token)
    return rows or []
