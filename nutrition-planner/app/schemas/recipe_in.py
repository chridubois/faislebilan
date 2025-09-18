from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from uuid import UUID

class IngredientCreate(BaseModel):
    name: str
    ciqual_code: Optional[str] = None
    category: Optional[str] = None
    labels: List[str] = Field(default_factory=list)
    allergens: List[str] = Field(default_factory=list)

class RecipeItemIn(BaseModel):
    ingredient_id: Optional[str] = None  # UUID existant (si déjà créé)
    ciqual_code: Optional[str] = None
    ingredient_new: Optional[IngredientCreate] = None  # ou à créer à partir de CIQUAL
    quantity: float
    unit: str = "g"
    model_config = ConfigDict(extra="forbid")

class RecipeCreate(BaseModel):
    name: str
    description: Optional[str] = None
    course_type: str = "main"            # 'main' | 'dessert' | 'other'
    meal_types: List[str] = Field(default_factory=list)  # ['breakfast','lunch','dinner']
    servings: int = 1
    items: List[RecipeItemIn]
    time_min: Optional[int] = None
    dish_family: Optional[str] = None
    cuisine: Optional[str] = None
    image: Optional[str] = None
