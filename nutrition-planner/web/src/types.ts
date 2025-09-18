// ------------------ Slots & Course types ------------------
export type MealSlot = 'breakfast' | 'lunch' | 'dinner';


export type MealType = 'breakfast' | 'lunch' | 'dinner'
export type CourseType = 'starter' | 'main' | 'dessert' | 'side'
export type Unit = 'g' | 'ml' | 'l' | 'cl' | 'kg' | 'unité'

// ------------------ Recettes ------------------
export type RecipeIngredient = {
  ingredient_id: string;
  quantity_g: number;
  state?: string | null;
};

export type Recipe = {
  id: string;
  name: string;
  meal_types: MealSlot[];        // ex: ['lunch','dinner']
  portions: number;              // nb de portions que la recette produit
  dish_family?: string;
  cuisine?: string;
  time_min?: number;
  image?: string;
  ingredients: RecipeIngredient[];
  // NEW: utile pour composer lunch/dinner en plat + dessert
  course_type?: CourseType | null; // défaut "main" côté back si absent
  description?: string | null;
  servings?: number | null;   // nb de portions "recette" à consommer (optionnel)
  created_at: string;
  updated_at: string;
};

// ---- Create-recipe payload types (match FastAPI) ----
export type IngredientNew = {
  name: string
  ciqual_code?: string | null
  category?: string | null
  labels?: string[]
  allergens?: string[]
}

export type NewRecipeItem = {
  ingredient_id?: string | null
  ingredient_new?: IngredientNew | null
  quantity: number            // <-- not quantity_g
  unit: string
}

export type NewRecipe = {
  name: string
  image?: string | null
  meal_types: MealType[]
  course_type: CourseType
  servings: number            // <-- your UI "portions" will map to this
  dish_family?: string | null
  cuisine?: string | null
  time_min?: number | null
  items: NewRecipeItem[]
  description?: string | null
}

// ------------------ Plan (multi-items) ------------------
export type MealItem = {
  recipe_id: string;
  servings?: number | null;      // nb de portions "recette" à consommer
  scale?: number | null;         // compat (miroir éventuel de servings)
  course_type?: CourseType | null;
};

export type Meal = {
  slot: MealSlot;

  // Nouveau format: un repas contient 1..N items (ex: main + dessert)
  items?: MealItem[];

  // Legacy: un seul recipe_id au niveau du Meal (toujours accepté par l’API)
  recipe_id?: string;
  servings?: number | null;
  scale?: number | null;
};

export type DayPlan = { date_index: number; meals: Meal[] };
export type WeekPlan = { plan_id: string; days: DayPlan[] };

// ------------------ Évaluation & cibles ------------------
export type EvaluateResponse = {
  day_kcal: number[];
  week_totals: {
    energy_kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    sugars_g: number;
    sodium_mg: number;
  };
  compliance: number;            // 0..1 vs cible kcal hebdo
};

export type Targets = {
  profile_id: string;
  kcal_per_day: number;
  protein_g_per_day: number;
  carbs_g_per_day: number;
  fat_g_per_day: number;
  fiber_g_per_day: number;
  sugars_g_per_day: number;
  sodium_mg_per_day: number;

  calcium_mg_per_day: number;
  iron_mg_per_day: number;
  magnesium_mg_per_day: number;
  zinc_mg_per_day: number;
  potassium_mg_per_day: number;
  iodine_ug_per_day: number;
  selenium_ug_per_day: number;

  vitamin_a_ug_rae_per_day: number;
  vitamin_d_ug_per_day: number;
  vitamin_e_mg_per_day: number;
  vitamin_c_mg_per_day: number;
  vitamin_b1_mg_per_day: number;
  vitamin_b2_mg_per_day: number;
  vitamin_b3_mg_per_day: number;
  vitamin_b6_mg_per_day: number;
  vitamin_b9_ug_dfe_per_day: number;
  vitamin_b12_ug_per_day: number;

  omega3_ala_g_per_day: number;
  omega3_dha_g_per_day: number;
  omega3_epa_g_per_day: number;
};

// ------------------ Macros (UI) ------------------
export type Macro = {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

// days[i][slot] = Macro ; totals[i] = Macro du jour
export type PlanMacros = {
  days: Record<MealSlot, Macro | null>[];
  totals: Macro[];
};

// ------------------ /menu/:id/nutrients ------------------
export type NutriSummary = {
  totals_week: Record<string, number>;
  targets_week: Record<string, number | null>;
  diffs_week: Record<string, number | null>;
  units: Record<string, string>;
};

// ------------------ (Optionnel) Types de payloads API actions ------------------
// Utile si tu veux typer les fetch POST dans le front.
export type SwapBody = {
  day_index: number;
  slot: MealSlot;
  to_recipe_id: string;
  item_index?: number;           // cible l’item (plat/dessert) si présent
  course_type?: CourseType | null;
};

export type MoveBody = {
  from_day_index: number;
  from_slot: MealSlot;
  to_day_index: number;
  to_slot: MealSlot;
  item_index?: number;           // déplace un item précis si multi-items
};

export type IngredientState = {
  portion_ref?: { amount: number; unit: string } | null;
  nutrients: Record<
    string,
    { value: number; unit?: string; per?: '100g' | '1g' | 'portion' | 'unit' } | number
  >;
  portion_weight_g?: number; // parfois présent
};

export type Ingredient = {
  id: string;
  name: string;
  category?: string | null;
  labels?: string[] | null;
  allergens?: string[] | null;
  ciqual_code?: string | null;
};

export type IngredientCiqual = {
  ciqual_code: string
  name_fr: string
  grp_name_fr?: string | null
  subgrp_name_fr?: string | null
  energy_kcal?: number | null
  protein_g?: number | null
  carbs_g?: number | null
  fat_g?: number | null
}

export type CiqualFull = {
  alim_code: string
  alim_nom_fr: string
  alim_grp_nom_fr?: string | null
  alim_ssgrp_nom_fr?: string | null
} & Record<string, string | number | null | undefined>

export type LabeledRef = { ingredient_id: string; label: string };

export type Profile = {
  profile_id: string;
  first_name: string;
  birth_date: string;
  gender: 'male' | 'female';
  height_cm: number;
  weight_kg: number;
  goal: string;
  sport_frequency: string;
  job_activity: 'sedentary' | 'light' | 'moderate' | 'heavy';
  conditions: string[];
  food_budget_level: 'low' | 'medium' | 'high';
  max_time_per_meal_min: number;
  allergies: LabeledRef[];
  dislikes: LabeledRef[];
};

export type NutritionItem = {
  ingredient_id?: string | null
  ciqual_code?: string | null
  quantity: number
  unit: Unit | string
}

export type NutritionResponse = {
  totals: Record<string, number>;
  per_serving?: Record<string, number>;
  per_item: Array<Record<string, unknown>>;
  missing: number[];
};

export type RecipeItem = {
  recipe_id: string
  ingredient_id: string
  ingredient_name?: string | null
  ciqual_code?: string | null
  quantity: number
  unit: string
}

export type NutResponse = {
  totals: Record<string, number>
  per_serving?: Record<string, number>
}

export type ReplaceRecipeItemInput = {
  ingredient_id?: string | null
  ciqual_code?: string | null
  ingredient_new?: { name: string; ciqual_code?: string | null } | null
  quantity: number
  unit: string
}

/** Patch autorisant null pour effacer des valeurs */
export type RecipePatch = {
  name?: string | null
  description?: string | null
  image?: string | null
  course_type?: CourseType | null
  meal_types?: MealType[] | null
  servings?: number | null
  time_min?: number | null
  dish_family?: string | null
  cuisine?: string | null
}

export type RecipeListItem = Pick<
  Recipe,
  'id' | 'name' | 'course_type' | 'meal_types' | 'servings' | 'image' | 'dish_family' | 'cuisine' | 'time_min' | 'created_at'
>
