import { Ingredient } from "./recipe";

export interface ShoppingListItem {
  id: string;
  ingredient: Ingredient;
  normalizedAmount: string;
  recipeId: string;
  recipeTitle: string;
  scaleFactor: number;
  checked: boolean;
  addedAt: string;
  isManual?: boolean; // true for manually added items
}

export interface ShoppingList {
  items: ShoppingListItem[];
  hiddenRecipeIds: string[]; // recipes toggled off
  updatedAt: string;
}

// For display: items grouped by ingredient
export interface GroupedShoppingItem {
  itemKey: string; // normalized ingredient name for grouping
  displayName: string;
  totalAmount: string;
  recipes: { id: string; title: string; amount: string }[];
  checked: boolean;
  itemIds: string[]; // original item IDs for this group
}
