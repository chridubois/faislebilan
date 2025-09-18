# app/schemas/menu.py
from __future__ import annotations
from typing import List, Dict, Optional, Literal
from pydantic import BaseModel, ConfigDict, Field, AliasChoices, model_validator

# ---------------- Requests ----------------

class GenerateRequest(BaseModel):
    kcal_target_per_day: Optional[int] = None
    allow_repeat: bool = True
    # Optionnel: activer/désactiver la contrainte plat+dessert au niveau générateur
    enforce_main_and_dessert: bool = True
    targets: Optional[Dict[str, float]] = None

class SwapRequest(BaseModel):
    day_index: int
    slot: Literal["breakfast", "lunch", "dinner"]
    to_recipe_id: str
    # Nouveau : préciser quel item on swap dans un repas multi-items
    # Si None : le backend choisit intelligemment (ex: remplacer un dessert par un dessert si possible)
    course_type: Optional[Literal["main", "dessert", "side", "drink", "breakfast_item", "snack_item"]] = None
    # Optionnel : index explicite dans items (prioritaire sur course_type si fourni)
    item_index: Optional[int] = Field(default=None, ge=0)

class MoveRequest(BaseModel):
    from_day_index: int
    to_day_index: int
    from_slot: Literal["breakfast", "lunch", "dinner"]
    to_slot:   Literal["breakfast", "lunch", "dinner"]
    # Si le repas possède plusieurs items, on peut déplacer un item particulier
    item_index: Optional[int] = Field(default=None, ge=0)

# ---------------- Core models ----------------

class IngredientRef(BaseModel):
    """
    Référence à un ingrédient dans une recette.
    On accepte plusieurs variantes de clés venant du JSON source grâce aux AliasChoices.
    """
    model_config = ConfigDict(extra="allow", populate_by_name=True)

    ingredient_id: str = Field(validation_alias=AliasChoices("ingredient_id", "ingredientId"))
    quantity_g: Optional[float] = Field(
        default=None,
        validation_alias=AliasChoices("quantity_g", "quantity", "grams", "qty_g"),
        ge=0
    )
    unit: Optional[str] = Field(default=None, validation_alias=AliasChoices("unit", "uom"))


CourseType = Literal["main", "dessert", "side", "drink", "breakfast_item", "snack_item"]

class Recipe(BaseModel):
    """
    Recette chargée via load_recipes().
    IMPORTANT: on tippe 'ingredients' pour que Pydantic convertisse bien en objets.
    """
    model_config = ConfigDict(extra="allow", populate_by_name=True)

    id: str
    title: Optional[str] = None
    meal_types: Optional[List[str]] = None
    course_type: Optional[CourseType] = Field(default=None)  # sera "main" ou "dessert" le plus souvent
    ingredients: List[IngredientRef] = Field(default_factory=list)


class MealItem(BaseModel):
    """
    Un composant d’un repas (ex: plat, dessert).
    On référence la recette par son id pour rester léger côté schéma.
    """
    model_config = ConfigDict(extra="allow", populate_by_name=True)

    recipe_id: str = Field(validation_alias=AliasChoices("recipe_id", "recipeId"))
    servings: Optional[float] = Field(default=None, ge=0)
    scale: Optional[float] = Field(default=None, ge=0)
    # Optionnel : course_type recopié depuis la recette (utile pour le front/optimiseur)
    course_type: Optional[CourseType] = None


class Meal(BaseModel):
    """
    Nouveau format: un slot contient désormais une liste d'items (plat, dessert, …)
    Rétro-compatibilité: accepte aussi l'ancien format (recipe_id/servings/scale au niveau Meal)
    """
    model_config = ConfigDict(extra="allow", populate_by_name=True)

    slot: Literal["breakfast", "lunch", "dinner"]

    # Nouveau format
    items: List[MealItem] = Field(default_factory=list)

    # Rétro-compat : ancien format
    recipe_id: Optional[str] = None
    servings: Optional[float] = Field(default=None, ge=0)
    scale: Optional[float] = Field(default=None, ge=0)

    # Réponse : totaux nutritionnels calculés (macro+micro), optionnels car côté service
    total_nutrients: Optional[Dict[str, float]] = None

    @model_validator(mode="before")
    @classmethod
    def _coerce_legacy(cls, data: Dict) -> Dict:
        """
        Enveloppe automatiquement l'ancien format en items=[...]
        Ancien: {slot, recipe_id, servings?, scale?}
        Nouveau: {slot, items:[{recipe_id, servings?, scale?}]}
        """
        if isinstance(data, dict):
            if "items" not in data and data.get("recipe_id"):
                item = {
                    "recipe_id": data.get("recipe_id"),
                    "servings": data.get("servings"),
                    "scale": data.get("scale"),
                }
                # On n'écrase pas d'éventuels champs supplémentaires
                new_data = dict(data)
                new_data["items"] = [item]
                # On peut conserver les champs legacy, ils seront ignorés côté service
                return new_data
        return data


class DayPlan(BaseModel):
    date_index: int
    meals: List[Meal]


class WeekPlan(BaseModel):
    plan_id: str
    days: List[DayPlan]

# ---------------- Responses ----------------

class EvaluateResponse(BaseModel):
    day_kcal: List[float]
    week_totals: Dict[str, float]
    compliance: float
