import { Recipe, SavedRecipe, RecipeTag, RecipeNote, RECIPE_TAGS } from "@/types/recipe";
import {
  fetchSavedRecipes,
  createSavedRecipe,
  updateSavedRecipe,
  deleteSavedRecipe,
  syncNotionRecipes,
  SavedRecipeAPI,
} from "./api-recipes";

const STORAGE_KEY = "video-to-recipe-saved-recipes";
const MIGRATED_KEY = "video-to-recipe-migrated-to-cloud";

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// -- Serialization helpers: SavedRecipe <-> API format --

function toAPI(
  recipe: SavedRecipe
): Omit<SavedRecipeAPI, "id" | "notionPageId" | "notionSynced" | "savedAt" | "updatedAt"> {
  return {
    recipeId: recipe.id || null,
    sourceUrl: recipe.youtubeUrl || null,
    sourceType: (recipe as Record<string, unknown>).platform === "blog" ? "blog" : "video",
    title: recipe.title,
    ingredients: JSON.stringify(recipe.ingredients),
    instructions: JSON.stringify(recipe.instructions),
    prepTime: recipe.prepTime || null,
    cookTime: recipe.cookTime || null,
    servings: recipe.servings || null,
    tags: JSON.stringify(recipe.tags || []),
    notes: JSON.stringify(recipe.notes || []),
    userEdits: recipe.userEdits ? JSON.stringify(recipe.userEdits) : null,
    collectionIds: recipe.collectionIds ? JSON.stringify(recipe.collectionIds) : null,
  };
}

function fromAPI(api: SavedRecipeAPI): SavedRecipe {
  const tags = safeParseJSON<string[]>(api.tags, []).filter((t): t is RecipeTag =>
    RECIPE_TAGS.includes(t as RecipeTag)
  );
  return {
    id: api.recipeId || api.id,
    youtubeUrl: api.sourceUrl || "",
    videoId: api.recipeId || api.id,
    videoTitle: null,
    channelName: null,
    creatorUsername: null,
    creatorUrl: null,
    platform: api.sourceType === "blog" ? "blog" : "youtube",
    title: api.title,
    ingredients: safeParseJSON(api.ingredients, []),
    instructions: safeParseJSON(api.instructions, []),
    prepTime: api.prepTime,
    cookTime: api.cookTime,
    servings: api.servings,
    cached: true,
    tags,
    notes: safeParseJSON<RecipeNote[]>(api.notes, []),
    collectionIds: safeParseJSON<string[]>(api.collectionIds, []),
    userEdits: api.userEdits ? safeParseJSON(api.userEdits, undefined) : undefined,
    savedAt: api.savedAt,
    // Stash the server-side ID so we can update/delete by it
    _cloudId: api.id,
    notionSynced: api.notionSynced,
  } as SavedRecipe & { _cloudId: string; notionSynced: boolean };
}

function safeParseJSON<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

// -- One-time migration from localStorage --

export async function migrateFromLocalStorage(): Promise<void> {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(MIGRATED_KEY)) return;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(MIGRATED_KEY, "true");
      return;
    }

    const recipes = JSON.parse(stored) as SavedRecipe[];
    if (recipes.length === 0) {
      localStorage.setItem(MIGRATED_KEY, "true");
      return;
    }

    // Batch-create all recipes in the backend
    for (const recipe of recipes) {
      try {
        await createSavedRecipe(toAPI(recipe));
      } catch {
        // Skip duplicates or failures — best effort
      }
    }

    // Clear localStorage recipes and mark as migrated
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(MIGRATED_KEY, "true");
  } catch {
    // Don't block the app if migration fails
  }
}

// -- Notion two-way sync --

export async function syncFromNotion(): Promise<void> {
  try {
    await syncNotionRecipes();
    invalidateCache();
  } catch {
    // Notion sync is best-effort — don't block the page
  }
}

// -- Cloud-backed CRUD (same API surface as before) --

// In-memory cache to avoid refetching on every call within a page lifecycle
let _cache: (SavedRecipe & { _cloudId: string })[] | null = null;

async function getCache(): Promise<(SavedRecipe & { _cloudId: string })[]> {
  if (_cache) return _cache;
  const apiRecipes = await fetchSavedRecipes();
  _cache = apiRecipes.map(fromAPI) as (SavedRecipe & { _cloudId: string })[];
  return _cache;
}

function invalidateCache() {
  _cache = null;
}

export async function getSavedRecipes(): Promise<SavedRecipe[]> {
  try {
    return await getCache();
  } catch {
    return [];
  }
}

export async function saveRecipe(recipe: Recipe): Promise<SavedRecipe> {
  // Don't save duplicates
  const existing = (await getCache()).find(
    (r) => r.videoId === recipe.videoId || r.youtubeUrl === recipe.youtubeUrl
  );
  if (existing) return existing;

  const aiTags = (recipe.tags || []).filter((t): t is RecipeTag =>
    RECIPE_TAGS.includes(t as RecipeTag)
  );

  const saved: SavedRecipe = {
    ...recipe,
    tags: aiTags,
    notes: [],
    savedAt: new Date().toISOString(),
  };

  const created = await createSavedRecipe(toAPI(saved));
  invalidateCache();
  return fromAPI(created);
}

export async function updateRecipe(
  videoId: string,
  updates: Partial<SavedRecipe>
): Promise<SavedRecipe | null> {
  const recipes = await getCache();
  const recipe = recipes.find((r) => r.videoId === videoId);
  if (!recipe) return null;

  const merged = { ...recipe, ...updates };
  const apiUpdates: Record<string, string | null> = {};
  if (updates.tags !== undefined) apiUpdates.tags = JSON.stringify(merged.tags);
  if (updates.notes !== undefined) apiUpdates.notes = JSON.stringify(merged.notes);
  if (updates.userEdits !== undefined)
    apiUpdates.userEdits = merged.userEdits ? JSON.stringify(merged.userEdits) : null;
  if (updates.collectionIds !== undefined)
    apiUpdates.collectionIds = merged.collectionIds
      ? JSON.stringify(merged.collectionIds)
      : null;
  if (updates.title !== undefined) apiUpdates.title = merged.title;
  if (updates.ingredients !== undefined)
    apiUpdates.ingredients = JSON.stringify(merged.ingredients);
  if (updates.instructions !== undefined)
    apiUpdates.instructions = JSON.stringify(merged.instructions);

  const updated = await updateSavedRecipe(recipe._cloudId, apiUpdates);
  invalidateCache();
  return fromAPI(updated);
}

export async function removeRecipe(videoId: string): Promise<void> {
  const recipes = await getCache();
  const recipe = recipes.find((r) => r.videoId === videoId);
  if (!recipe) return;

  await deleteSavedRecipe(recipe._cloudId);
  invalidateCache();
}

export async function isRecipeSaved(videoId: string): Promise<boolean> {
  const recipes = await getCache();
  return recipes.some((r) => r.videoId === videoId);
}

export async function getSavedRecipe(videoId: string): Promise<SavedRecipe | null> {
  const recipes = await getCache();
  return recipes.find((r) => r.videoId === videoId) || null;
}

// Tag management
export async function addTagToRecipe(
  videoId: string,
  tag: RecipeTag
): Promise<SavedRecipe | null> {
  const recipe = await getSavedRecipe(videoId);
  if (!recipe) return null;

  if (!recipe.tags.includes(tag)) {
    return updateRecipe(videoId, { tags: [...recipe.tags, tag] });
  }
  return recipe;
}

export async function removeTagFromRecipe(
  videoId: string,
  tag: RecipeTag
): Promise<SavedRecipe | null> {
  const recipe = await getSavedRecipe(videoId);
  if (!recipe) return null;

  return updateRecipe(videoId, { tags: recipe.tags.filter((t) => t !== tag) });
}

// Note management
export async function addNoteToRecipe(
  videoId: string,
  text: string
): Promise<SavedRecipe | null> {
  const recipe = await getSavedRecipe(videoId);
  if (!recipe) return null;

  const newNote: RecipeNote = {
    id: generateId(),
    text,
    createdAt: new Date().toISOString(),
  };

  return updateRecipe(videoId, { notes: [...recipe.notes, newNote] });
}

export async function updateNoteOnRecipe(
  videoId: string,
  noteId: string,
  text: string
): Promise<SavedRecipe | null> {
  const recipe = await getSavedRecipe(videoId);
  if (!recipe) return null;

  const notes = recipe.notes.map((n) => (n.id === noteId ? { ...n, text } : n));
  return updateRecipe(videoId, { notes });
}

export async function removeNoteFromRecipe(
  videoId: string,
  noteId: string
): Promise<SavedRecipe | null> {
  const recipe = await getSavedRecipe(videoId);
  if (!recipe) return null;

  return updateRecipe(videoId, { notes: recipe.notes.filter((n) => n.id !== noteId) });
}

// User edits
export async function saveRecipeEdits(
  videoId: string,
  edits: SavedRecipe["userEdits"]
): Promise<SavedRecipe | null> {
  return updateRecipe(videoId, { userEdits: edits });
}

export async function clearRecipeEdits(videoId: string): Promise<SavedRecipe | null> {
  return updateRecipe(videoId, { userEdits: undefined });
}

// Collection management
export async function addRecipeToCollection(
  videoId: string,
  collectionId: string
): Promise<SavedRecipe | null> {
  const recipe = await getSavedRecipe(videoId);
  if (!recipe) return null;

  const collectionIds = recipe.collectionIds || [];
  if (!collectionIds.includes(collectionId)) {
    return updateRecipe(videoId, { collectionIds: [...collectionIds, collectionId] });
  }
  return recipe;
}

export async function removeRecipeFromCollection(
  videoId: string,
  collectionId: string
): Promise<SavedRecipe | null> {
  const recipe = await getSavedRecipe(videoId);
  if (!recipe) return null;

  const collectionIds = (recipe.collectionIds || []).filter((id) => id !== collectionId);
  return updateRecipe(videoId, { collectionIds });
}

export async function getRecipesInCollection(collectionId: string): Promise<SavedRecipe[]> {
  const recipes = await getSavedRecipes();
  return recipes.filter((r) => r.collectionIds?.includes(collectionId));
}
