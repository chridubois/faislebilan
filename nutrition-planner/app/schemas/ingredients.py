from pydantic import BaseModel, Field
from typing import List, Optional

# Ton ingrédient "app"
class Ingredient(BaseModel):
    id: str
    name: str
    category: Optional[str] = None
    labels: List[str] = Field(default_factory=list)
    allergens: List[str] = Field(default_factory=list)
    ciqual_code: Optional[str] = None

# Référentiel CIQUAL (DTO minimal pour l’UI)
class IngredientCiqual(BaseModel):
    ciqual_code: str
    name_fr: str
    grp_name_fr: Optional[str] = None
    subgrp_name_fr: Optional[str] = None
    energy_kcal: Optional[float] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
