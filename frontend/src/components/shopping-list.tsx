"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingList as ShoppingListType, GroupedShoppingItem } from "@/types/shopping";
import {
  getShoppingList,
  toggleGroupedItem,
  removeGroupedItems,
  clearCheckedItems,
  clearAllItems,
  getRecipesInShoppingList,
  toggleRecipeVisibility,
  removeRecipeFromList,
  getGroupedItems,
  addManualItem,
} from "@/lib/shopping-storage";
import { t } from "@/lib/translations";

export function ShoppingList() {
  const [list, setList] = useState<ShoppingListType>({ items: [], hiddenRecipeIds: [], updatedAt: "" });
  const [recipes, setRecipes] = useState<{ id: string; title: string; itemCount: number }[]>([]);
  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    const currentList = getShoppingList();
    setList(currentList);
    setRecipes(getRecipesInShoppingList());
  }, []);

  const refreshList = () => {
    const currentList = getShoppingList();
    setList(currentList);
    setRecipes(getRecipesInShoppingList());
  };

  const handleToggleItem = (item: GroupedShoppingItem) => {
    toggleGroupedItem(item.itemIds, !item.checked);
    refreshList();
  };

  const handleRemoveItem = (item: GroupedShoppingItem) => {
    removeGroupedItems(item.itemIds);
    refreshList();
  };

  const handleToggleRecipe = (recipeId: string) => {
    toggleRecipeVisibility(recipeId);
    refreshList();
  };

  const handleRemoveRecipe = (recipeId: string) => {
    removeRecipeFromList(recipeId);
    refreshList();
  };

  const handleClearChecked = () => {
    clearCheckedItems();
    refreshList();
  };

  const handleClearAll = () => {
    clearAllItems();
    refreshList();
  };

  const handleAddManualItem = () => {
    if (!newItem.trim()) return;
    addManualItem(newItem.trim());
    setNewItem("");
    refreshList();
  };

  const { unchecked, checked } = getGroupedItems(list);

  if (list.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        {/* Manual add even when empty */}
        <div className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddManualItem()}
              placeholder="Agregar articulo manualmente..."
              className="flex-1 px-4 py-3 rounded-lg border border-[var(--border-warm)] bg-white text-[var(--text-body)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--teal)]"
            />
            <Button
              onClick={handleAddManualItem}
              disabled={!newItem.trim()}
              className="bg-[var(--teal)] hover:bg-[var(--teal-dark)] text-white px-6"
            >
              +
            </Button>
          </div>
        </div>

        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--cream-dark)] flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              <path d="M9 14l2 2 4-4"/>
            </svg>
          </div>
          <p className="text-lg text-[var(--text-muted)] mb-2">
            {t("emptyShoppingList")}
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            {t("emptyShoppingHint")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Recipe filter section */}
      {recipes.length > 0 && (
        <div className="mb-6 p-4 bg-[var(--card-white)] rounded-lg shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">
            Comprando para:
          </h3>
          <div className="flex flex-wrap gap-2">
            {recipes.map((recipe) => {
              const isHidden = list.hiddenRecipeIds.includes(recipe.id);
              return (
                <div
                  key={recipe.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
                    isHidden
                      ? "bg-[var(--cream-dark)] text-[var(--text-muted)] line-through opacity-60"
                      : "bg-[var(--teal)]/10 text-[var(--teal)]"
                  }`}
                >
                  <button
                    onClick={() => handleToggleRecipe(recipe.id)}
                    className="flex items-center gap-2"
                  >
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        isHidden
                          ? "border-[var(--border-warm)]"
                          : "border-[var(--teal)] bg-[var(--teal)]"
                      }`}
                    >
                      {!isHidden && (
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                    </div>
                    <span className="max-w-[150px] truncate">{recipe.title}</span>
                  </button>
                  <button
                    onClick={() => handleRemoveRecipe(recipe.id)}
                    className="p-0.5 hover:text-red-500 transition-colors"
                    title="Eliminar receta de la lista"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual add item */}
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddManualItem()}
            placeholder="Agregar articulo manualmente..."
            className="flex-1 px-4 py-2 rounded-lg border border-[var(--border-warm)] bg-white text-[var(--text-body)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--teal)]"
          />
          <Button
            onClick={handleAddManualItem}
            disabled={!newItem.trim()}
            className="bg-[var(--teal)] hover:bg-[var(--teal-dark)] text-white"
          >
            +
          </Button>
        </div>
      </div>

      {/* Actions bar */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-[var(--text-muted)]">
          {unchecked.length} {t("itemsCount")}
        </span>
        <div className="flex gap-2">
          {checked.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearChecked}
              className="text-xs border-[var(--border-warm)] hover:bg-[var(--cream-dark)]"
            >
              {t("clearChecked")}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            className="text-xs border-[var(--border-warm)] hover:bg-[var(--cream-dark)]"
          >
            {t("clearAll")}
          </Button>
        </div>
      </div>

      {/* Unchecked items */}
      {unchecked.length > 0 && (
        <div className="bg-[var(--card-white)] rounded-lg shadow-sm overflow-hidden mb-6">
          {unchecked.map((item, idx) => (
            <div
              key={item.itemKey}
              className={`flex items-center gap-3 px-4 py-3 ${
                idx !== unchecked.length - 1 ? "border-b border-[var(--border-warm)]" : ""
              }`}
            >
              <button
                onClick={() => handleToggleItem(item)}
                className="w-5 h-5 rounded border-2 border-[var(--border-warm)] flex items-center justify-center hover:border-[var(--teal)] transition-colors flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  {item.totalAmount && (
                    <span className="text-[var(--teal)] font-medium whitespace-nowrap">
                      {item.totalAmount}
                    </span>
                  )}
                  <span className="text-[var(--text-body)]">{item.displayName}</span>
                </div>
                {item.recipes.length > 0 && (
                  <div className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                    {item.recipes.map((r) => r.title).join(", ")}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleRemoveItem(item)}
                className="p-1 text-[var(--text-muted)] hover:text-red-500 transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Checked items */}
      {checked.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
            Completados ({checked.length})
          </h3>
          <div className="bg-[var(--cream-dark)] rounded-lg overflow-hidden opacity-60">
            {checked.map((item, idx) => (
              <div
                key={item.itemKey}
                className={`flex items-center gap-3 px-4 py-2 ${
                  idx !== checked.length - 1 ? "border-b border-[var(--border-warm)]" : ""
                }`}
              >
                <button
                  onClick={() => handleToggleItem(item)}
                  className="w-5 h-5 rounded border-2 border-[var(--teal)] bg-[var(--teal)] flex items-center justify-center flex-shrink-0"
                >
                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </button>
                <span className="flex-1 text-[var(--text-muted)] line-through">
                  {item.totalAmount && `${item.totalAmount} `}{item.displayName}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
