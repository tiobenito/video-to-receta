const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export interface SavedRecipeAPI {
  id: string;
  recipeId: string | null;
  sourceUrl: string | null;
  sourceType: string;
  title: string;
  ingredients: string; // JSON string
  instructions: string; // JSON string
  prepTime: string | null;
  cookTime: string | null;
  servings: string | null;
  tags: string | null; // JSON array
  notes: string | null; // JSON array
  userEdits: string | null; // JSON
  collectionIds: string | null; // JSON array
  notionPageId: string | null;
  notionSynced: boolean;
  savedAt: string;
  updatedAt: string;
}

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "API error");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function fetchSavedRecipes(): Promise<SavedRecipeAPI[]> {
  return apiFetch<SavedRecipeAPI[]>("/api/v1/saved-recipes");
}

export async function fetchSavedRecipe(id: string): Promise<SavedRecipeAPI> {
  return apiFetch<SavedRecipeAPI>(`/api/v1/saved-recipes/${id}`);
}

export async function createSavedRecipe(
  data: Omit<SavedRecipeAPI, "id" | "notionPageId" | "notionSynced" | "savedAt" | "updatedAt">
): Promise<SavedRecipeAPI> {
  return apiFetch<SavedRecipeAPI>("/api/v1/saved-recipes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateSavedRecipe(
  id: string,
  data: Partial<Pick<SavedRecipeAPI, "title" | "ingredients" | "instructions" | "prepTime" | "cookTime" | "servings" | "tags" | "notes" | "userEdits" | "collectionIds">>
): Promise<SavedRecipeAPI> {
  return apiFetch<SavedRecipeAPI>(`/api/v1/saved-recipes/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteSavedRecipe(id: string): Promise<void> {
  await apiFetch<void>(`/api/v1/saved-recipes/${id}`, { method: "DELETE" });
}

export async function syncNotionRecipes(): Promise<{ imported: number }> {
  return apiFetch<{ imported: number }>("/api/v1/saved-recipes/sync-notion", {
    method: "POST",
  });
}
