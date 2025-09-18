from __future__ import annotations

from typing import Optional, List, Literal
from fastapi import APIRouter, Query, Depends, HTTPException

from app.utils.loader import load_recipes
from app.services.generator import equivalents
from app.services.nutrition import recipe_per_portion
from app.models import Recipe  # on garde tes modèles Pydantic
from pydantic import BaseModel, Field
from app.services.supabase import insert
from app.deps.auth import get_user_token
import uuid
from datetime import datetime

router = APIRouter(prefix="/recipes", tags=["recipes"])

# --------- Schemas minimalistes pour la création ---------

MealType = Literal["breakfast", "lunch", "dinner"]
CourseType = Literal["main", "dessert", "other"]

class IngredientNew(BaseModel):
    name: str
    ciqual_code: Optional[str] = None
    category: Optional[str] = None
    labels: Optional[List[str]] = Field(default_factory=list)
    allergens: Optional[List[str]] = Field(default_factory=list)

class NewRecipeItem(BaseModel):
    ingredient_id: Optional[str] = None               # id d'un ingrédient existant (BDD)
    ingredient_new: Optional[IngredientNew] = None    # si on veut créer un nouvel ingrédient
    quantity_g: float

class NewRecipe(BaseModel):
    name: str
    image: Optional[str] = None
    meal_types: List[MealType]
    course_type: CourseType
    portions: int = 1
    dish_family: Optional[str] = None
    cuisine: Optional[str] = None
    time_min: Optional[int] = None
    items: List[NewRecipeItem]

@router.get("")
def list_recipes(
    q: Optional[str] = Query(None, description="Recherche plein texte sur le nom"),
    course_type: Optional[str] = Query(None, description="main | dessert | ..."),
    meal_type: Optional[str] = Query(None, description="breakfast | lunch | dinner | snack"),
    max_time: Optional[int] = Query(None, ge=1, description="Temps de préparation (min) maximum"),
    cuisine: Optional[str] = Query(None, description="Filtre exact sur la cuisine"),
):
    """
    Liste des recettes avec quelques filtres utiles pour le front/générateur.
    """
    recs = load_recipes() or []

    if q:
        ql = q.lower()
        recs = [r for r in recs if ql in (r.get("name") or "").lower()]

    if course_type:
        ct = course_type.lower()
        recs = [r for r in recs if (r.get("course_type") or "main").lower() == ct]

    if meal_type:
        mt = meal_type.lower()
        recs = [r for r in recs if mt in (r.get("meal_types") or [])]

    if max_time is not None:
        recs = [r for r in recs if isinstance(r.get("time_min"), int) and r["time_min"] <= max_time]

    if cuisine:
        recs = [r for r in recs if (r.get("cuisine") or "").lower() == cuisine.lower()]

    return recs

# ⚠️ IMPORTANT: déclarer /audit AVANT les routes dynamiques /{recipe_id}
@router.get("/audit")
def audit():
    """
    Vue synthétique par portion (triée par kcal).
    Compatible même si 'course_type' manque encore dans certaines recettes (défaut 'main').
    """
    recs = [
        Recipe.model_validate({**r, "course_type": r.get("course_type", "main")})
        for r in (load_recipes() or [])
    ]
    out: List[dict] = []
    for r in recs:
        n = recipe_per_portion(r, 1.0)
        out.append({
            "id": r.id,
            "name": r.name,
            "course_type": getattr(r, "course_type", "main"),
            "kcal_per_portion": round(n.energy_kcal, 1),
            "protein_g": round(n.protein_g, 1),
            "carbs_g": round(n.carbs_g, 1),
            "fat_g": round(n.fat_g, 1),
            "meal_types": r.meal_types,
            "portions": r.portions,
            "time_min": r.time_min,
            "cuisine": r.cuisine,
            "dish_family": r.dish_family,
        })
    out.sort(key=lambda x: x["kcal_per_portion"])
    return out

@router.get("/{recipe_id}")
def get_recipe(recipe_id: str):
    for r in load_recipes() or []:
        if r.get("id") == recipe_id:
            return r
    return {"error": "not_found"}

@router.get("/{recipe_id}/equivalents")
def recipe_equivalents(recipe_id: str, k: int = 5, allow_scaling: bool = True):
    return {"base_recipe": recipe_id, "equivalents": equivalents(recipe_id, k=k, allow_scaling=allow_scaling)}

# --------- POST /recipes ---------

@router.post("", status_code=201)
def create_recipe(body: NewRecipe, token: str | None = Depends(get_user_token)):
    """
    Crée une recette + ses items dans Supabase (staging).
    - Si un item a `ingredient_new`, on crée d'abord l'ingrédient puis on référence son id.
    - Tables attendues : `recipes`, `recipe_items`, `ingredients`.
      (adapte les noms si différents)
    """
    # 1) insérer la recette
    recipe_id = f"rec_{uuid.uuid4().hex[:12]}"
    recipe_row = {
        "id": recipe_id,
        "name": body.name,
        "image": body.image,
        "meal_types": body.meal_types,
        "course_type": body.course_type,
        "portions": body.portions,
        "dish_family": body.dish_family,
        "cuisine": body.cuisine,
        "time_min": body.time_min,
        "created_at": datetime.utcnow().isoformat(),
    }
    try:
        insert("recipes", [recipe_row], user_jwt=token)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"insert recipes failed: {e}")

    # 2) préparer les items (en créant au passage les ingrédients manquants)
    item_rows = []
    for it in body.items:
        ing_id = it.ingredient_id

        if not ing_id and it.ingredient_new:
            ing_id = f"ing_{uuid.uuid4().hex[:12]}"
            ing_row = {
                "id": ing_id,
                "name": it.ingredient_new.name,
                "category": it.ingredient_new.category,
                "labels": it.ingredient_new.labels or [],
                "allergens": it.ingredient_new.allergens or [],
                "ciqual_code": it.ingredient_new.ciqual_code,
                "created_at": datetime.utcnow().isoformat(),
            }
            try:
                insert("ingredients", [ing_row], user_jwt=token)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"insert ingredients failed: {e}")

        if not ing_id:
            raise HTTPException(status_code=400, detail="Chaque item doit avoir un ingredient_id ou ingredient_new")

        item_rows.append({
            "recipe_id": recipe_id,
            "ingredient_id": ing_id,
            "quantity_g": it.quantity_g,
        })

    # 3) insérer les items
    if item_rows:
        try:
            insert("recipe_items", item_rows, user_jwt=token)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"insert recipe_items failed: {e}")

    return {"id": recipe_id, "ok": True}
