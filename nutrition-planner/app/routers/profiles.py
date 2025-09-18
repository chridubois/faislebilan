# app/routers/profiles.py
from __future__ import annotations

from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Header

from app.services.supabase import (
    select as sb_select,
    insert as sb_insert,
    patch as sb_patch,
    delete as sb_delete,
)

router = APIRouter(prefix="/profiles")

# --- petite dépendance locale pour récupérer un éventuel Bearer JWT ---
def get_bearer_token(authorization: Optional[str] = Header(None)) -> Optional[str]:
    if authorization and authorization.lower().startswith("bearer "):
        return authorization.split(" ", 1)[1].strip()
    return None


@router.get("")
def list_profiles(token: Optional[str] = Depends(get_bearer_token)):
    """
    Liste ultra-légère pour l'écran /profiles
    👉 On ne renvoie que id + name (le Front n'a besoin que de name)
    👉 Tri safe par id (évite 400 si created_at n'existe pas)
    """
    ps = (
        "?select="
        "id,external_code,user_id,name,"
        "gender,birth_date,age_years,"
        "weight_kg,height_cm,activity,goal,"
        "food_budget_level,max_time_per_meal_min,created_at"
        "&order=id.asc"
    )
    # public.profiles -> table réelle (schéma public)
    return sb_select("public.profiles", ps, user_jwt=token)


@router.get("/{profile_id}")
def get_profile(profile_id: str, token: Optional[str] = Depends(get_bearer_token)):
    """
    Détail d'un profil (champs utiles pour la fiche)
    ⚠️ Pas de first_name/last_name (non présents dans le schéma)
    """
    ps = (
        "?select="
        "id,external_code,user_id,name,"
        "gender,birth_date,age_years,"
        "weight_kg,height_cm,activity,goal,"
        "food_budget_level,max_time_per_meal_min,created_at"
        f"&id=eq.{profile_id}&limit=1"
    )
    rows = sb_select("public.profiles", ps, user_jwt=token)
    if not rows:
        raise HTTPException(404, "not_found")
    return rows[0]


@router.get("/{profile_id}/targets")
def get_profile_targets(profile_id: str, token: Optional[str] = Depends(get_bearer_token)):
    """
    Cibles nutritionnelles du profil (1 ligne / nutriment)
    """
    ps = (
        "?select=profile_id,nutrient_code,unit,target_value,min_value,max_value,priority"
        f"&profile_id=eq.{profile_id}"
    )
    return sb_select("public.profile_targets", ps, user_jwt=token)


@router.post("")
def create_profile(body: Dict[str, Any], token: Optional[str] = Depends(get_bearer_token)):
    """
    Création simple (le body peut contenir name, gender, birth_date, activity, goal,
    weight_kg, height_cm, external_code, user_id, food_budget_level, max_time_per_meal_min)
    """
    rows = sb_insert("public.profiles", [body], user_jwt=token)
    return rows[0]


@router.patch("/{profile_id}")
def update_profile(
    profile_id: str,
    body: Dict[str, Any],
    token: Optional[str] = Depends(get_bearer_token),
):
    """
    Mise à jour partielle. On filtre aux colonnes attendues pour éviter des 400.
    """
    allowed = {
        "name",
        "gender", "birth_date", "activity", "goal",
        "weight_kg", "height_cm",
        "food_budget_level", "max_time_per_meal_min",
        "external_code", "user_id",
        # on n'expose pas age_years/created_at en écriture
    }
    payload = {k: v for k, v in (body or {}).items() if k in allowed}
    if not payload:
        # Pas d'erreur 400 : on fait un PATCH no-op cohérent
        rows = sb_select("public.profiles", f"?id=eq.{profile_id}&limit=1", user_jwt=token)
        if not rows:
            raise HTTPException(404, "not_found")
        return rows[0]

    rows = sb_patch(
        "public.profiles",
        payload,
        params=f"?id=eq.{profile_id}",
        user_jwt=token,
    )
    if not rows:
        raise HTTPException(404, "not_found")
    return rows[0]


@router.delete("/{profile_id}")
def delete_profile(profile_id: str, token: Optional[str] = Depends(get_bearer_token)):
    """
    Suppression (on purge d'abord les targets si pas de FK ON DELETE CASCADE)
    """
    sb_delete("public.profile_targets", params=f"?profile_id=eq.{profile_id}", user_jwt=token)
    sb_delete("public.profiles",         params=f"?id=eq.{profile_id}",       user_jwt=token)
    return {"ok": True}
