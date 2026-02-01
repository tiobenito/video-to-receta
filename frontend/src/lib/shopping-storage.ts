import { Ingredient } from "@/types/recipe";
import { ShoppingList, ShoppingListItem, GroupedShoppingItem } from "@/types/shopping";
import { scaleIngredients, parseAmount } from "./unit-conversion";
import { normalizeForShopping } from "./amount-normalization";

const STORAGE_KEY = "video-to-recipe-shopping-list";

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function getShoppingList(): ShoppingList {
  if (typeof window === "undefined") {
    return { items: [], hiddenRecipeIds: [], updatedAt: new Date().toISOString() };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { items: [], hiddenRecipeIds: [], updatedAt: new Date().toISOString() };
    }
    const list = JSON.parse(stored) as ShoppingList;
    // Migration for old format
    if (!list.hiddenRecipeIds) {
      list.hiddenRecipeIds = [];
    }
    return list;
  } catch {
    return { items: [], hiddenRecipeIds: [], updatedAt: new Date().toISOString() };
  }
}

function saveShoppingList(list: ShoppingList): void {
  list.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function addIngredientsToShoppingList(
  ingredients: Ingredient[],
  recipeId: string,
  recipeTitle: string,
  scaleFactor: number = 1
): ShoppingList {
  const list = getShoppingList();

  // Apply scaling before adding
  const scaledIngredients = scaleIngredients(ingredients, scaleFactor);

  const newItems: ShoppingListItem[] = scaledIngredients.map((ing) => ({
    id: generateId(),
    ingredient: ing,
    normalizedAmount: normalizeForShopping(ing.amount),
    recipeId,
    recipeTitle,
    scaleFactor,
    checked: false,
    addedAt: new Date().toISOString(),
  }));

  list.items = [...list.items, ...newItems];
  // Make sure this recipe is visible
  list.hiddenRecipeIds = list.hiddenRecipeIds.filter((id) => id !== recipeId);
  saveShoppingList(list);
  return list;
}

export function addManualItem(itemName: string): ShoppingList {
  const list = getShoppingList();

  const newItem: ShoppingListItem = {
    id: generateId(),
    ingredient: { amount: "", item: itemName },
    normalizedAmount: "",
    recipeId: "__manual__",
    recipeTitle: "",
    scaleFactor: 1,
    checked: false,
    addedAt: new Date().toISOString(),
    isManual: true,
  };

  list.items = [...list.items, newItem];
  saveShoppingList(list);
  return list;
}

export function toggleShoppingItem(itemId: string): ShoppingList {
  const list = getShoppingList();
  const item = list.items.find((i) => i.id === itemId);
  if (item) {
    item.checked = !item.checked;
    saveShoppingList(list);
  }
  return list;
}

export function toggleGroupedItem(itemIds: string[], checked: boolean): ShoppingList {
  const list = getShoppingList();
  itemIds.forEach((id) => {
    const item = list.items.find((i) => i.id === id);
    if (item) {
      item.checked = checked;
    }
  });
  saveShoppingList(list);
  return list;
}

export function removeShoppingItem(itemId: string): ShoppingList {
  const list = getShoppingList();
  list.items = list.items.filter((i) => i.id !== itemId);
  saveShoppingList(list);
  return list;
}

export function removeGroupedItems(itemIds: string[]): ShoppingList {
  const list = getShoppingList();
  list.items = list.items.filter((i) => !itemIds.includes(i.id));
  saveShoppingList(list);
  return list;
}

export function toggleRecipeVisibility(recipeId: string): ShoppingList {
  const list = getShoppingList();
  if (list.hiddenRecipeIds.includes(recipeId)) {
    list.hiddenRecipeIds = list.hiddenRecipeIds.filter((id) => id !== recipeId);
  } else {
    list.hiddenRecipeIds.push(recipeId);
  }
  saveShoppingList(list);
  return list;
}

export function removeRecipeFromList(recipeId: string): ShoppingList {
  const list = getShoppingList();
  list.items = list.items.filter((i) => i.recipeId !== recipeId);
  list.hiddenRecipeIds = list.hiddenRecipeIds.filter((id) => id !== recipeId);
  saveShoppingList(list);
  return list;
}

export function clearCheckedItems(): ShoppingList {
  const list = getShoppingList();
  list.items = list.items.filter((i) => !i.checked);
  saveShoppingList(list);
  return list;
}

export function clearAllItems(): ShoppingList {
  const list: ShoppingList = { items: [], hiddenRecipeIds: [], updatedAt: new Date().toISOString() };
  saveShoppingList(list);
  return list;
}

export function getShoppingItemCount(): number {
  const list = getShoppingList();
  return list.items.filter((i) => !i.checked).length;
}

// Get unique recipes in the shopping list
export function getRecipesInShoppingList(): { id: string; title: string; itemCount: number }[] {
  const list = getShoppingList();
  const recipeMap = new Map<string, { title: string; count: number }>();

  list.items.forEach((item) => {
    if (item.isManual) return;
    const existing = recipeMap.get(item.recipeId);
    if (existing) {
      existing.count++;
    } else {
      recipeMap.set(item.recipeId, { title: item.recipeTitle, count: 1 });
    }
  });

  return Array.from(recipeMap.entries()).map(([id, data]) => ({
    id,
    title: data.title,
    itemCount: data.count,
  }));
}

// Normalize ingredient name for grouping (lowercase, remove common variations)
function normalizeIngredientName(item: string): string {
  return item
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    // Remove common descriptors that shouldn't affect grouping
    .replace(/^(fresh|dried|chopped|minced|sliced|diced)\s+/i, "")
    .replace(/\s+(fresh|dried|chopped|minced|sliced|diced)$/i, "");
}

// Try to combine amounts of the same unit
function combineAmounts(amounts: string[]): string {
  if (amounts.length === 0) return "";
  if (amounts.length === 1) return amounts[0];

  // Try to parse and sum amounts with the same unit
  let totalValue = 0;
  let commonUnit = "";
  let canCombine = true;

  for (const amount of amounts) {
    const parsed = parseAmount(amount);
    if (!parsed) {
      canCombine = false;
      break;
    }

    if (commonUnit === "") {
      commonUnit = parsed.unit;
    } else if (parsed.unit.toLowerCase() !== commonUnit.toLowerCase()) {
      canCombine = false;
      break;
    }

    totalValue += parsed.value;
  }

  if (canCombine && totalValue > 0) {
    // Format nicely
    const formatted = totalValue % 1 === 0 ? totalValue.toString() : totalValue.toFixed(1);
    return commonUnit ? `${formatted} ${commonUnit}` : formatted;
  }

  // Can't combine, show all amounts
  return amounts.join(" + ");
}

// Group items by ingredient for display
export function getGroupedItems(list: ShoppingList): {
  unchecked: GroupedShoppingItem[];
  checked: GroupedShoppingItem[];
} {
  // Filter out hidden recipes
  const visibleItems = list.items.filter(
    (item) => item.isManual || !list.hiddenRecipeIds.includes(item.recipeId)
  );

  // Group by normalized ingredient name
  const groups = new Map<string, {
    items: ShoppingListItem[];
    displayName: string;
  }>();

  visibleItems.forEach((item) => {
    const key = normalizeIngredientName(item.ingredient.item);
    const existing = groups.get(key);

    if (existing) {
      existing.items.push(item);
    } else {
      groups.set(key, {
        items: [item],
        displayName: item.ingredient.item,
      });
    }
  });

  // Convert to grouped items
  const allGrouped: GroupedShoppingItem[] = Array.from(groups.entries()).map(([key, data]) => {
    const amounts = data.items
      .filter((i) => i.normalizedAmount)
      .map((i) => i.normalizedAmount);

    const recipes = data.items
      .filter((i) => !i.isManual)
      .reduce((acc, item) => {
        const existing = acc.find((r) => r.id === item.recipeId);
        if (existing) {
          // Combine amounts from same recipe
          existing.amount = combineAmounts([existing.amount, item.normalizedAmount].filter(Boolean));
        } else {
          acc.push({
            id: item.recipeId,
            title: item.recipeTitle,
            amount: item.normalizedAmount,
          });
        }
        return acc;
      }, [] as { id: string; title: string; amount: string }[]);

    // All items in group checked = group is checked
    const allChecked = data.items.every((i) => i.checked);

    return {
      itemKey: key,
      displayName: data.displayName,
      totalAmount: combineAmounts(amounts),
      recipes,
      checked: allChecked,
      itemIds: data.items.map((i) => i.id),
    };
  });

  return {
    unchecked: allGrouped.filter((g) => !g.checked),
    checked: allGrouped.filter((g) => g.checked),
  };
}
