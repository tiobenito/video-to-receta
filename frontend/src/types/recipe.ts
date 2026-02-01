export interface Ingredient {
  amount: string;
  item: string;
}

export interface Instruction {
  step: number;
  text: string;
}

export interface Recipe {
  id: string;
  youtubeUrl: string;
  videoId: string;
  videoTitle: string | null;
  channelName: string | null;
  creatorUsername: string | null;
  creatorUrl: string | null;
  platform: "youtube" | "tiktok" | null;
  title: string;
  ingredients: Ingredient[];
  instructions: Instruction[];
  prepTime: string | null;
  cookTime: string | null;
  servings: string | null;
  tags?: string[];  // AI-suggested tags from backend
  cached: boolean;
}

// Available recipe tags/categories (must match backend AVAILABLE_TAGS)
export const RECIPE_TAGS = [
  // Dish type
  "entrada",
  "plato-fuerte",
  "postre",
  "salsa",
  "bebida",
  "desayuno",
  "snack",
  "sopa",
  "ensalada",
  "guarnicion",
  "pan",
  "masa",
  // Cuisine
  "mexicana",
  "italiana",
  "asiatica",
  "americana",
  "francesa",
  "mediterranea",
  // Diet
  "saludable",
  "rapida",
  "vegetariana",
  "vegana",
  "sin-gluten",
  "keto",
  // Flavor profile
  "picante",
  "dulce",
  "agridulce",
  "ahumado",
  // Protein
  "pollo",
  "carne",
  "cerdo",
  "mariscos",
  "pescado",
  // Cooking method
  "horno",
  "parrilla",
  "sarten",
  "olla",
  "freidora",
  "sin-coccion",
] as const;

export type RecipeTag = (typeof RECIPE_TAGS)[number];

// User's personal note on a recipe
export interface RecipeNote {
  id: string;
  text: string;
  createdAt: string;
}

// Extended recipe with user-specific data (stored in localStorage)
export interface SavedRecipe extends Recipe {
  tags: RecipeTag[];
  notes: RecipeNote[];
  collectionIds?: string[];
  // User edits override original values
  userEdits?: {
    title?: string;
    ingredients?: Ingredient[];
    instructions?: Instruction[];
    prepTime?: string | null;
    cookTime?: string | null;
    servings?: string | null;
  };
  savedAt: string;
}

export interface ConvertRequest {
  url: string;
}

export interface ErrorResponse {
  detail: string;
}
