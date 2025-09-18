# app/utils/models.py
from __future__ import annotations
from typing import List, Optional, Literal, Dict
from pydantic import BaseModel, Field, ConfigDict, AliasChoices, model_validator

# ---------- Types ----------
MealSlot = Literal["breakfast", "lunch", "dinner"]                 # slots affichés
RecipeMealType = Literal["breakfast", "lunch", "dinner", "snack"]  # tags de dispo
CourseType = Literal["main", "dessert", "side", "drink", "breakfast_item", "snack_item"]

# ---- Domain ----
class Nutrients(BaseModel):
    energy_kcal: float = 0
    protein_g: float = 0
    carbs_g: float = 0
    fat_g: float = 0
    fiber_g: float = 0
    sugars_g: float = 0
    sodium_mg: float = 0

    # minéraux
    calcium_mg: float = 0
    iron_mg: float = 0
    magnesium_mg: float = 0
    zinc_mg: float = 0
    potassium_mg: float = 0
    iodine_ug: float = 0
    selenium_ug: float = 0

    # vitamines
    vitamin_a_ug_rae: float = 0
    vitamin_d_ug: float = 0
    vitamin_e_mg: float = 0
    vitamin_c_mg: float = 0
    vitamin_b1_mg: float = 0
    vitamin_b2_mg: float = 0
    vitamin_b3_mg: float = 0
    vitamin_b6_mg: float = 0
    vitamin_b9_ug_dfe: float = 0
    vitamin_b12_ug: float = 0

    # oméga-3
    omega3_ala_g: float = 0
    omega3_epa_g: float = 0
    omega3_dha_g: float = 0

    # -------- Helpers --------
    def scaled(self, servings: float | None) -> "Nutrients":
        """Retourne une copie mise à l'échelle par le nb de portions (None -> 1.0)."""
        factor = float(servings or 1.0)
        data = self.model_dump()
        return Nutrients(**{k: float(v or 0) * factor for k, v in data.items()})

    @staticmethod
    def sum(items: List["Nutrients"]) -> "Nutrients":
        if not items:
            return Nutrients()
        keys = items[0].model_dump().keys()
        agg: Dict[str, float] = {k: 0.0 for k in keys}
        for n in items:
            for k, v in n.model_dump().items():
                agg[k] += float(v or 0)
        return Nutrients(**agg)


class Ingredient(BaseModel):
    id: str
    name: str
    # on stocke à plat dans le JSON, mais on remontera en Nutrients au calcul


class RecipeIngredient(BaseModel):
    ingredient_id: str
    quantity_g: float


class Recipe(BaseModel):
    """
    Recette telle que chargée depuis app/data/recipes.json.
    """
    id: str
    name: str
    meal_types: List[RecipeMealType]          # ex: ["lunch","dinner"]
    portions: int = 1
    dish_family: Optional[str] = None
    cuisine: Optional[str] = None
    time_min: Optional[int] = None
    ingredients: List["RecipeIngredient"]
    photo_url: Optional[str] = None

    # NEW: distingue plat/dessert etc. (utilisé par la composition des repas)
    # laissé optionnel pour compat avec les anciennes données; défaut "main" côté loader/service
    course_type: Optional[CourseType] = None


# -------- Nouveau: un repas contient plusieurs items (plat, dessert, …) --------
class MealItem(BaseModel):
    """
    Un composant d’un repas : référence recette + portions consommées.
    On référence par ID pour rester léger au transport; le service résout vers la recette.
    """
    model_config = ConfigDict(populate_by_name=True)

    recipe_id: str = Field(validation_alias=AliasChoices("recipe_id", "recipeId"))
    # nb de portions "recette" à consommer (ex: 1.0 = 1 portion telle que définie par la recette)
    servings: float = Field(default=1.0, ge=0)
    # compat : certains écrans utilisaient 'scale' (miroir de servings)
    scale: Optional[float] = Field(default=None, ge=0)
    # hint (pas obligatoire) copié depuis la recette pour le front / logique de swap
    course_type: Optional[CourseType] = None


class Meal(BaseModel):
    """
    Nouveau format: un slot contient une liste d'items (ex: plat + dessert).
    Rétro-compatibilité: accepte aussi l'ancien format (recipe_id au niveau Meal).
    """
    model_config = ConfigDict(populate_by_name=True)

    slot: MealSlot

    # Nouveau
    items: List[MealItem] = Field(default_factory=list)

    # Legacy (accepté en entrée; auto-converti vers items[] par le validator)
    recipe_id: Optional[str] = None
    servings: Optional[float] = Field(default=None, ge=0)
    scale: Optional[float] = Field(default=None, ge=0)

    # Calculés côté service: somme macro+micro de tous les items (plat + dessert)
    total_nutrients: Optional[Nutrients] = None

    @model_validator(mode="before")
    @classmethod
    def _coerce_legacy(cls, data: Dict) -> Dict:
        """
        Ancien format -> enveloppe en items=[{recipe_id, servings/scale}].
        """
        if isinstance(data, dict) and "items" not in data and data.get("recipe_id"):
            item = {
                "recipe_id": data.get("recipe_id"),
                "servings": data.get("servings", data.get("scale", 1.0)),
                "scale": data.get("scale"),
            }
            new_data = dict(data)
            new_data["items"] = [item]
            return new_data
        return data


class DayPlan(BaseModel):
    date_index: int
    meals: List[Meal]


class WeekPlan(BaseModel):
    plan_id: str
    days: List[DayPlan]


# ---- Requests / Responses ----
class GenerateRequest(BaseModel):
    kcal_target_per_day: int = Field(2000, ge=800, le=4000)
    policies: List[str] = []
    allow_repeat: bool = True
    # impose main+dessert pour lunch/dinner dans le générateur
    enforce_main_and_dessert: bool = True


class SwapRequest(BaseModel):
    day_index: int
    slot: MealSlot
    to_recipe_id: str
    # cible quel item remplacer (si None => backend choisit selon course_type)
    item_index: Optional[int] = Field(default=None, ge=0)
    # hint pour remplacer plat par plat / dessert par dessert
    course_type: Optional[CourseType] = None
    # compat: certains écrans envoyaient scale; mirror de servings
    scale: float = 1.0


class MoveRequest(BaseModel):
    from_day_index: int
    from_slot: MealSlot
    to_day_index: int
    to_slot: MealSlot
    # déplacer un item précis si multi-items
    item_index: Optional[int] = Field(default=None, ge=0)


class EvaluateResponse(BaseModel):
    day_kcal: List[float]
    week_totals: Nutrients
    compliance: float
