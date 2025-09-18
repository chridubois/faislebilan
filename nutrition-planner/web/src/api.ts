// src/api.ts
import type {
  WeekPlan,
  Recipe,
  EvaluateResponse,
  MealSlot,
  Targets,
  PlanMacros,
  Ingredient,
  SwapBody,
  MoveBody,
  CourseType,
  Profile,
  IngredientCiqual,
  CiqualFull,
  NewRecipe,
  Unit,
  NutritionItem,
  NutritionResponse,
} from './types'

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'

// utilitaire pour fetch+json avec gestion d’erreur
async function j<T>(res: Response): Promise<T> {
  const raw = await res.text().catch(() => '')
  if (!res.ok) {
    console.error('API error', res.status, res.url, raw)
    throw new Error(raw || `API ${res.status} ${res.url}`)
  }
  return raw ? (JSON.parse(raw) as T) : (undefined as unknown as T)
}

/* ------------------- RECIPES ------------------- */

// Liste des recettes (avec filtre optionnel)
export async function listRecipes(q?: string): Promise<Recipe[]> {
  const url = new URL(`${API_BASE}/recipes`, location.origin)
  if (q) url.searchParams.set('q', q)
  return j<Recipe[]>(await fetch(url.toString().replace(location.origin, '')))
}

// Détail d’une recette
export async function getRecipeById(id: string): Promise<Recipe> {
  return j<Recipe>(await fetch(`${API_BASE}/recipes/${id}`))
}

// Items de recette (BDD)
export async function getRecipeItemsBdd(id: string) {
  const r = await fetch(`${API_BASE}/recipes/${id}/items`)
  // si besoin on tolère les 404 côté appelant
  if (!r.ok) throw new Error(await r.text())
  return (await r.json()) as Array<{
    recipe_id: string
    ingredient_id: string
    ingredient_name?: string | null
    ciqual_code?: string | null
    quantity: number
    unit: string
  }>
}

/** PATCH métadonnées d’une recette */
export async function updateRecipeBdd(
  id: string,
  patch: Partial<{
    name: string; description: string | null; image: string | null;
    course_type: string; meal_types: string[]; servings: number;
    time_min: number | null; dish_family: string | null; cuisine: string | null;
  }>
): Promise<Recipe> {
  return j<Recipe>(
    await fetch(`${API_BASE}/recipes/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
  )
}

export type EditRecipeItem = {
  ingredient_id?: string | null;
  ciqual_code?: string | null;
  ingredient_new?: { name: string; ciqual_code?: string } | null;
  quantity: number;
  unit: Unit | string;
};

/** Remplace tous les items d’une recette */
export async function setRecipeItemsBdd(
  id: string,
  items: EditRecipeItem[],
): Promise<{ updated: number }> {
  return j<{ updated: number }>(
    await fetch(`${API_BASE}/recipes/${encodeURIComponent(id)}/items`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })
  )
}

/* Création */
export async function createRecipe(body: NewRecipe): Promise<Recipe> {
  return j<Recipe>(
    await fetch(`${API_BASE}/recipes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  )
}

// Calcul la nutrition d'une reette "ad hoc"
export async function computeNutrition(body: { items: NutritionItem[]; servings?: number }): Promise<NutritionResponse> {
  return j<NutritionResponse>(
    await fetch(`${API_BASE}/nutrition/compute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  )
}

// Nutrition d’une recette BDD
export async function getRecipeNutrition(id: string): Promise<NutritionResponse> {
  const r = await fetch(`/api/recipes/${id}/nutrition`);
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<NutritionResponse>;
}

/* ------------------- INGREDIENTS ------------------- */

export async function listIngredients(): Promise<Ingredient[]> {
  return j<Ingredient[]>(await fetch(`${API_BASE}/ingredients`))
}

export async function getIngredient(id: string): Promise<Ingredient> {
  return j<Ingredient>(await fetch(`${API_BASE}/ingredients/${id}`))
}

/* ------------------- TARGETS / PROFILES ------------------- */

export async function getTargets(): Promise<Targets> {
  const tries = [`${API_BASE}/targets`, `${API_BASE}/profiles/targets`]
  let lastErr: unknown = null
  for (const url of tries) {
    try {
      return await j<Targets>(await fetch(url))
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr))
}

export async function listProfiles(): Promise<Profile[]> {
  return j<Profile[]>(await fetch(`${API_BASE}/profiles`))
}

export async function getProfile(profile_id: string): Promise<Profile> {
  return j<Profile>(await fetch(`${API_BASE}/profiles/${profile_id}`))
}

export async function getTargetsByProfileId(profile_id: string): Promise<Targets> {
  return j<Targets>(await fetch(`${API_BASE}/profiles/${profile_id}/targets`))
}


/* ------------------- PLANNER / MENU ------------------- */

export async function generatePlan(params: { profile_id: string; allow_repeat?: boolean }) {
  const q = new URLSearchParams({ profile_id: params.profile_id })
  return j(await fetch(`${API_BASE}/menu/generate?${q.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ allow_repeat: params.allow_repeat ?? true }),
  }))
}

export async function evaluatePlan(planId: string): Promise<EvaluateResponse> {
  return j<EvaluateResponse>(await fetch(`${API_BASE}/menu/${planId}/evaluate`))
}

export async function getPlanMacros(planId: string): Promise<PlanMacros> {
  return j<PlanMacros>(await fetch(`${API_BASE}/menu/${planId}/macros`))
}

export async function shoppingList(planId: string): Promise<{
  plan_id: string
  items: { ingredient_id: string; name: string; quantity_g: number }[]
}> {
  return j(await fetch(`${API_BASE}/shopping/${planId}`))
}

/* --------- Actions (legacy 1 item / slot) --------- */

export async function swapMeal(
  planId: string,
  dayIndex: number,
  slot: MealSlot,
  toRecipeId: string,
  scale = 1,
): Promise<WeekPlan> {
  return j<WeekPlan>(
    await fetch(`${API_BASE}/menu/${planId}/swap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ day_index: dayIndex, slot, to_recipe_id: toRecipeId, scale }),
    }),
  )
}

export async function moveMeal(
  planId: string,
  fromDay: number,
  fromSlot: MealSlot,
  toDay: number,
  toSlot: MealSlot,
): Promise<WeekPlan> {
  return j<WeekPlan>(
    await fetch(`${API_BASE}/menu/${planId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from_day_index: fromDay,
        from_slot: fromSlot,
        to_day_index: toDay,
        to_slot: toSlot,
      }),
    }),
  )
}

/* --------- Actions (nouveau format multi-items) --------- */

export async function swapItem(
  planId: string,
  dayIndex: number,
  slot: MealSlot,
  toRecipeId: string,
  opts?: { itemIndex?: number | null; courseType?: CourseType | null },
): Promise<WeekPlan> {
  const body: SwapBody = {
    day_index: dayIndex,
    slot,
    to_recipe_id: toRecipeId,
  }
  if (opts?.itemIndex != null) body.item_index = opts.itemIndex
  if (opts?.courseType) body.course_type = opts.courseType

  return j<WeekPlan>(
    await fetch(`${API_BASE}/menu/${planId}/swap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  )
}

export async function moveItem(
  planId: string,
  fromDay: number,
  fromSlot: MealSlot,
  toDay: number,
  toSlot: MealSlot,
  itemIndex: number,
): Promise<WeekPlan> {
  const body: MoveBody = {
    from_day_index: fromDay,
    from_slot: fromSlot,
    to_day_index: toDay,
    to_slot: toSlot,
    item_index: itemIndex,
  }

  return j<WeekPlan>(
    await fetch(`${API_BASE}/menu/${planId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  )
}

/* ------------------- EQUIVALENTS (optionnel) ------------------- */

export async function equivalents(
  recipeId: string,
  k = 5,
  allowScaling = true,
): Promise<{ base_recipe: string; equivalents: { recipe_id: string; scale: number; distance: number }[] }> {
  return j(
    await fetch(`${API_BASE}/recipes/${recipeId}/equivalents?k=${k}&allow_scaling=${allowScaling}`),
  )
}

/* ------------------- CIQUAL ------------------- */

export async function listCiqualIngredients(q?: string): Promise<IngredientCiqual[]> {
  const url = new URL(`${API_BASE}/ciqual/ingredients`, location.origin)
  if (q) url.searchParams.set('q', q)
  return j<IngredientCiqual[]>(await fetch(url.toString().replace(location.origin, '')))
}

export async function searchCiqual(q: string): Promise<{ ciqual_code: string; name_fr: string }[]> {
  const r = await fetch(`${API_BASE}/ciqual/search?q=${encodeURIComponent(q)}`)
  if (r.ok) return j(await r)
  const url = new URL(`${API_BASE}/ciqual/ingredients`, location.origin)
  url.searchParams.set('q', q)
  return j(await fetch(url.toString().replace(location.origin, '')))
}

export async function getCiqualFull(ciqual_code: string): Promise<CiqualFull> {
  return j<CiqualFull>(await fetch(`${API_BASE}/ciqual/ingredients/${ciqual_code}`))
}

/* ------------------- CREATE (staging) ------------------- */

export type NewIngredient = {
  name: string
  ciqual_code: string
  category?: string
  labels?: string[]
  allergens?: string[]
}

export async function createIngredient(payload: NewIngredient): Promise<Ingredient> {
  return j<Ingredient>(
    await fetch(`${API_BASE}/ingredients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  )
}

/* ------------------- Compat (alias) ------------------- */

// pour ne pas casser d’autres imports existants
export const updateRecipe = updateRecipeBdd
export const replaceRecipeItems = (id: string, items: Parameters<typeof setRecipeItemsBdd>[1]) =>
  setRecipeItemsBdd(id, items)
