// src/api/ingredients.ts
// Réutilisation des types existants depuis ton module de types central
import type {
  Ingredient,
  IngredientNew,
  IngredientCiqual,
  CiqualFull,
} from '../types'; // <- adapte le chemin si nécessaire

type ApiOptions = {
  authToken?: string | null;
  signal?: AbortSignal;
};

async function apiFetch<T>(url: string, init?: RequestInit, opts?: ApiOptions): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  };
  if (opts?.authToken) headers["Authorization"] = `Bearer ${opts.authToken}`;
  const res = await fetch(url, { ...init, headers, signal: opts?.signal });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }
  return (await res.json()) as T;
}

/** Liste paginée (retour: sous-ensemble compatible Ingredient) */
export async function listIngredients(params?: {
  q?: string;
  limit?: number;
  offset?: number;
  authToken?: string | null;
  signal?: AbortSignal;
}): Promise<Pick<Ingredient, "id" | "name" | "category" | "labels" | "allergens">[]> {
  const sp = new URLSearchParams();
  if (params?.q) sp.set("q", params.q);
  if (params?.limit) sp.set("limit", String(params.limit));
  if (params?.offset) sp.set("offset", String(params.offset));
  const url = `/api/ingredients${sp.toString() ? `?${sp.toString()}` : ""}`;
  return apiFetch(url, undefined, { authToken: params?.authToken ?? null, signal: params?.signal });
}

/** Détail (retour: Ingredient complet) */
export async function getIngredient(id: string, opts?: ApiOptions): Promise<Ingredient> {
  return apiFetch<Ingredient>(`/api/ingredients/${id}`, undefined, {
    authToken: opts?.authToken ?? null,
    signal: opts?.signal,
  });
}

/** Création (payload: IngredientNew, retour: Ingredient) */
export async function createIngredient(
  body: IngredientNew,
  opts?: ApiOptions
): Promise<Ingredient> {
  return apiFetch<Ingredient>(
    `/api/ingredients`,
    { method: "POST", body: JSON.stringify(body ?? {}) },
    { authToken: opts?.authToken ?? null, signal: opts?.signal }
  );
}

/** Mise à jour partielle (retour: Ingredient) */
export async function updateIngredient(
  id: string,
  body: Partial<Ingredient>,
  opts?: ApiOptions
): Promise<Ingredient> {
  return apiFetch<Ingredient>(
    `/api/ingredients/${id}`,
    { method: "PATCH", body: JSON.stringify(body ?? {}) },
    { authToken: opts?.authToken ?? null, signal: opts?.signal }
  );
}

/** Suppression */
export async function deleteIngredient(
  id: string,
  opts?: ApiOptions
): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>(
    `/api/ingredients/${id}`,
    { method: "DELETE" },
    { authToken: opts?.authToken ?? null, signal: opts?.signal }
  );
}

/** (Optionnel) Recherche CIQUAL */
export async function searchCiqual(params: {
  q: string;
  full?: boolean;
  limit?: number;
  authToken?: string | null;
  signal?: AbortSignal;
}): Promise<IngredientCiqual[] | CiqualFull[]> {
  const sp = new URLSearchParams();
  sp.set("q", params.q);
  if (params.full) sp.set("full", "true");
  if (params.limit) sp.set("limit", String(params.limit));
  const url = `/api/ingredients/ciqual/search?${sp.toString()}`;
  return apiFetch(url, undefined, {
    authToken: params.authToken ?? null,
    signal: params.signal,
  });
}
