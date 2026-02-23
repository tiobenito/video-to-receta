import { Recipe, SavedRecipe, RecipeTag, RecipeNote, RECIPE_TAGS } from "@/types/recipe";

const STORAGE_KEY = "video-to-recipe-saved-recipes";

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function readStorage(): SavedRecipe[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as SavedRecipe[];
  } catch {
    return [];
  }
}

function writeStorage(recipes: SavedRecipe[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
}

export function getSavedRecipes(): SavedRecipe[] {
  return readStorage();
}

export function saveRecipe(recipe: Recipe): SavedRecipe {
  const recipes = readStorage();

  // Don't save duplicates
  const existing = recipes.find(
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

  writeStorage([saved, ...recipes]);
  return saved;
}

export function removeRecipe(videoId: string): void {
  const recipes = readStorage();
  writeStorage(recipes.filter((r) => r.videoId !== videoId));
}

export function isRecipeSaved(videoId: string): boolean {
  return readStorage().some((r) => r.videoId === videoId);
}

export function getSavedRecipe(videoId: string): SavedRecipe | null {
  return readStorage().find((r) => r.videoId === videoId) || null;
}

function updateRecipe(
  videoId: string,
  updates: Partial<SavedRecipe>
): SavedRecipe | null {
  const recipes = readStorage();
  const index = recipes.findIndex((r) => r.videoId === videoId);
  if (index === -1) return null;

  const updated = { ...recipes[index], ...updates };
  recipes[index] = updated;
  writeStorage(recipes);
  return updated;
}

// Tag management
export function addTagToRecipe(
  videoId: string,
  tag: RecipeTag
): SavedRecipe | null {
  const recipe = getSavedRecipe(videoId);
  if (!recipe) return null;

  if (!recipe.tags.includes(tag)) {
    return updateRecipe(videoId, { tags: [...recipe.tags, tag] });
  }
  return recipe;
}

export function removeTagFromRecipe(
  videoId: string,
  tag: RecipeTag
): SavedRecipe | null {
  const recipe = getSavedRecipe(videoId);
  if (!recipe) return null;

  return updateRecipe(videoId, { tags: recipe.tags.filter((t) => t !== tag) });
}

// Note management
export function addNoteToRecipe(
  videoId: string,
  text: string
): SavedRecipe | null {
  const recipe = getSavedRecipe(videoId);
  if (!recipe) return null;

  const newNote: RecipeNote = {
    id: generateId(),
    text,
    createdAt: new Date().toISOString(),
  };

  return updateRecipe(videoId, { notes: [...recipe.notes, newNote] });
}

export function updateNoteOnRecipe(
  videoId: string,
  noteId: string,
  text: string
): SavedRecipe | null {
  const recipe = getSavedRecipe(videoId);
  if (!recipe) return null;

  const notes = recipe.notes.map((n) => (n.id === noteId ? { ...n, text } : n));
  return updateRecipe(videoId, { notes });
}

export function removeNoteFromRecipe(
  videoId: string,
  noteId: string
): SavedRecipe | null {
  const recipe = getSavedRecipe(videoId);
  if (!recipe) return null;

  return updateRecipe(videoId, { notes: recipe.notes.filter((n) => n.id !== noteId) });
}

// User edits
export function saveRecipeEdits(
  videoId: string,
  edits: SavedRecipe["userEdits"]
): SavedRecipe | null {
  return updateRecipe(videoId, { userEdits: edits });
}

export function clearRecipeEdits(videoId: string): SavedRecipe | null {
  return updateRecipe(videoId, { userEdits: undefined });
}

// Collection management
export function addRecipeToCollection(
  videoId: string,
  collectionId: string
): SavedRecipe | null {
  const recipe = getSavedRecipe(videoId);
  if (!recipe) return null;

  const collectionIds = recipe.collectionIds || [];
  if (!collectionIds.includes(collectionId)) {
    return updateRecipe(videoId, { collectionIds: [...collectionIds, collectionId] });
  }
  return recipe;
}

export function removeRecipeFromCollection(
  videoId: string,
  collectionId: string
): SavedRecipe | null {
  const recipe = getSavedRecipe(videoId);
  if (!recipe) return null;

  const collectionIds = (recipe.collectionIds || []).filter((id) => id !== collectionId);
  return updateRecipe(videoId, { collectionIds });
}

export function getRecipesInCollection(collectionId: string): SavedRecipe[] {
  return getSavedRecipes().filter((r) => r.collectionIds?.includes(collectionId));
}
