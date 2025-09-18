// web/src/api/recipes.ts
import { get, post, patch, put, del } from './http'
import type { Recipe, NewRecipe, NutritionResponse, RecipeItem, RecipePatch, RecipeListItem } from '../types'

/** ---- Types ---- */

// Items renvoyés par GET /recipes/{id}/items
export type RecipeBddItem = RecipeItem

// Entrée tolérante (depuis l’UI) : accepte null
export type ReplaceRecipeItemInputLoose = {
  ingredient_id?: string | null
  ciqual_code?: string | null
  ingredient_new?: { name: string; ciqual_code?: string | null } | null
  quantity: number
  unit: string
}

// Payload strict envoyé au backend (sans null)
type ReplaceRecipeItemStrict = {
  ingredient_id?: string
  ciqual_code?: string
  ingredient_new?: { name: string; ciqual_code?: string }
  quantity: number
  unit: string
}

// Patch “avec null” (permet d’effacer les champs)
export type RecipePatchWithNulls = {
  name?: string | null
  description?: string | null
  image?: string | null
  course_type?: Recipe['course_type'] | null
  meal_types?: Recipe['meal_types'] | null
  servings?: number | null
  time_min?: number | null
  dish_family?: string | null
  cuisine?: string | null
}

/** ---- Endpoints ---- */

export function listRecipes(): Promise<RecipeListItem[]> {
  return get<RecipeListItem[]>('/recipes')
}
export function getRecipeById(id: string): Promise<Recipe> {
  return get<Recipe>(`/recipes/${id}`)
}
export function createRecipe(body: NewRecipe): Promise<Recipe> {
  return post<Recipe>('/recipes', body)
}

// Accepte RecipePatch “strict” (depuis ../types) OU une version avec nulls
export function updateRecipe(
  id: string,
  patchBody: RecipePatch | RecipePatchWithNulls
): Promise<Recipe> {
  // `patch` prend un `unknown`, donc on passe l’objet typé directement
  return patch<Recipe>(`/recipes/${id}`, patchBody)
}

export function getRecipeItems(recipeId: string): Promise<RecipeBddItem[]> {
  return get<RecipeBddItem[]>(`/recipes/${recipeId}/items`)
}

// Remplace tous les items — accepte un tableau “loose”, sanitize en “strict”
export function replaceRecipeItems(
  recipeId: string,
  items: ReadonlyArray<ReplaceRecipeItemInputLoose>
): Promise<{ ok: true; count: number }> {
  const sanitized: ReplaceRecipeItemStrict[] = items.map((i) => {
    const out: ReplaceRecipeItemStrict = { quantity: i.quantity, unit: i.unit }
    if (i.ingredient_id ?? undefined) out.ingredient_id = i.ingredient_id as string
    if (i.ciqual_code ?? undefined) out.ciqual_code = i.ciqual_code as string
    if (i.ingredient_new) {
      out.ingredient_new = {
        name: i.ingredient_new.name,
        ...(i.ingredient_new.ciqual_code ? { ciqual_code: i.ingredient_new.ciqual_code } : {}),
      }
    }
    return out
  })
  return put<{ ok: true; count: number }>(`/recipes/${recipeId}/items`, { items: sanitized })
}

export function getRecipeNutrition(id: string): Promise<NutritionResponse> {
  return get<NutritionResponse>(`/recipes/${id}/nutrition`)
}

// Prévisu nutrition (brouillon) — accepte nulls puis nettoie
export function computeNutritionPreview(body: { items: Array<{ ingredient_id?: string | null; ciqual_code?: string | null; quantity: number; unit: string }>; servings?: number }): Promise<NutritionResponse> {
  const cleaned = {
    ...body,
    items: body.items.map((i) => {
      const o: { ingredient_id?: string; ciqual_code?: string; quantity: number; unit: string } = {
        quantity: i.quantity,
        unit: i.unit,
      }
      if (i.ingredient_id ?? undefined) o.ingredient_id = i.ingredient_id as string
      if (i.ciqual_code ?? undefined) o.ciqual_code = i.ciqual_code as string
      return o
    }),
  }
  return post<NutritionResponse>('/nutrition/compute', cleaned)
}

// (garde l’ancien nom si tu as des usages)
export const computeNutrition = computeNutritionPreview

export function deleteRecipe(id: string): Promise<{ ok: true } | { error: string }> {
  return del(`/recipes/${id}`)
}

/** ---- Alias legacy (si nécessaires ailleurs) ---- */
export const getRecipeBdd = getRecipeById
export const getRecipeItemsBdd = getRecipeItems
export const setRecipeItemsBdd = replaceRecipeItems
export const updateRecipeBdd = updateRecipe
