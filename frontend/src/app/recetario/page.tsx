"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { SavedRecipe, RecipeTag, RECIPE_TAGS } from "@/types/recipe";
import { Collection } from "@/types/collection";
import { RecipeCard } from "@/components/recipe-card";
import { TagBadges } from "@/components/tag-picker";
import { CollectionBadges } from "@/components/collection-picker";
import { Header } from "@/components/header";
import { getSavedRecipes } from "@/lib/recipe-storage";
import { getCollections } from "@/lib/collection-storage";
import { t, translateTag } from "@/lib/translations";

export default function RecetarioPage() {
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<SavedRecipe | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<RecipeTag | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

  useEffect(() => {
    setRecipes(getSavedRecipes());
    setCollections(getCollections());
  }, []);

  // Get all unique tags used in saved recipes
  const usedTags = useMemo(() => {
    const tagSet = new Set<RecipeTag>();
    recipes.forEach((r) => r.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet);
  }, [recipes]);

  // Filter recipes by search query, selected tag, and collection
  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      // Get effective title (user edit or original)
      const effectiveTitle = recipe.userEdits?.title ?? recipe.title;

      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        effectiveTitle.toLowerCase().includes(searchQuery.toLowerCase());

      // Tag filter
      const matchesTag = selectedTag === null || recipe.tags.includes(selectedTag);

      // Collection filter
      const matchesCollection =
        selectedCollection === null ||
        (recipe.collectionIds && recipe.collectionIds.includes(selectedCollection));

      return matchesSearch && matchesTag && matchesCollection;
    });
  }, [recipes, searchQuery, selectedTag, selectedCollection]);

  const handleRemove = (videoId: string) => {
    setRecipes((prev) => prev.filter((r) => r.videoId !== videoId));
    setSelectedRecipe(null);
  };

  const handleUpdate = (updatedRecipe: SavedRecipe) => {
    setRecipes((prev) =>
      prev.map((r) => (r.videoId === updatedRecipe.videoId ? updatedRecipe : r))
    );
    setSelectedRecipe(updatedRecipe);
  };

  const closeModal = () => {
    setSelectedRecipe(null);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTag(null);
    setSelectedCollection(null);
  };

  const hasFilters = searchQuery !== "" || selectedTag !== null || selectedCollection !== null;

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      {/* Top stripe */}
      <div className="page-stripe" />

      {/* Navigation */}
      <Header />

      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-[var(--text-dark)]">
            Mi <span className="text-[var(--teal)]">Recetario</span>
          </h1>
          <p className="text-lg text-[var(--text-muted)]">
            {recipes.length > 0
              ? `${recipes.length} receta${recipes.length !== 1 ? "s" : ""} guardada${recipes.length !== 1 ? "s" : ""}`
              : t("recipeBookDescription")
            }
          </p>
        </div>

        {/* Search and Filter */}
        {recipes.length > 0 && (
          <div className="max-w-3xl mx-auto mb-8">
            {/* Search bar */}
            <div className="relative mb-4">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-[var(--border-warm)] bg-white text-[var(--text-body)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--teal)] focus:ring-1 focus:ring-[var(--teal)]"
              />
            </div>

            {/* Collection filters */}
            {collections.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-sm text-[var(--text-muted)]">{t("collections")}:</span>
                <button
                  onClick={() => setSelectedCollection(null)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedCollection === null
                      ? "bg-[var(--gold)] text-white"
                      : "bg-[var(--cream-dark)] text-[var(--text-muted)] hover:bg-[var(--gold)]/10 hover:text-[var(--gold-dark)]"
                  }`}
                >
                  {t("allRecipes")}
                </button>
                {collections.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={() => setSelectedCollection(collection.id === selectedCollection ? null : collection.id)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                      selectedCollection === collection.id
                        ? "bg-[var(--gold)] text-white"
                        : "bg-[var(--cream-dark)] text-[var(--text-muted)] hover:bg-[var(--gold)]/10 hover:text-[var(--gold-dark)]"
                    }`}
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    {collection.name}
                  </button>
                ))}
              </div>
            )}

            {/* Tag filters */}
            {usedTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-[var(--text-muted)]">{t("filterByTag")}:</span>
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedTag === null
                      ? "bg-[var(--teal)] text-white"
                      : "bg-[var(--cream-dark)] text-[var(--text-muted)] hover:bg-[var(--teal)]/10 hover:text-[var(--teal)]"
                  }`}
                >
                  {t("allRecipes")}
                </button>
                {usedTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedTag === tag
                        ? "bg-[var(--teal)] text-white"
                        : "bg-[var(--cream-dark)] text-[var(--text-muted)] hover:bg-[var(--teal)]/10 hover:text-[var(--teal)]"
                    }`}
                  >
                    {translateTag(tag)}
                  </button>
                ))}
              </div>
            )}

            {/* Clear filters */}
            {hasFilters && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-[var(--text-muted)]">
                  {filteredRecipes.length} resultado{filteredRecipes.length !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={clearFilters}
                  className="text-sm text-[var(--teal)] hover:underline"
                >
                  {t("clearFilters")}
                </button>
              </div>
            )}
          </div>
        )}

        {recipes.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--cream-dark)] flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <p className="text-lg text-[var(--text-muted)] mb-2">
              {t("noSavedRecipes")}
            </p>
            <p className="text-sm text-[var(--text-muted)] mb-6">
              {t("noSavedRecipesHint")}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white bg-gradient-to-br from-[var(--teal)] to-[var(--teal-dark)] hover:shadow-lg hover:shadow-[var(--teal)]/20 hover:-translate-y-0.5 transition-all"
            >
              {t("backToConverter")}
            </Link>
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg text-[var(--text-muted)] mb-4">
              No se encontraron recetas
            </p>
            <button
              onClick={clearFilters}
              className="text-[var(--teal)] hover:underline"
            >
              {t("clearFilters")}
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {filteredRecipes.map((recipe) => {
              const effectiveTitle = recipe.userEdits?.title ?? recipe.title;
              return (
                <button
                  key={recipe.videoId}
                  onClick={() => setSelectedRecipe(recipe)}
                  className="recipe-grid-card text-left"
                >
                  <h3 className="font-serif font-semibold text-[var(--text-dark)] mb-2 line-clamp-2">
                    {effectiveTitle}
                  </h3>
                  {recipe.collectionIds && recipe.collectionIds.length > 0 && (
                    <div className="mb-1">
                      <CollectionBadges collectionIds={recipe.collectionIds} />
                    </div>
                  )}
                  {recipe.tags.length > 0 && (
                    <TagBadges tags={recipe.tags} />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-[var(--text-muted)]">
          <p>{t("footer")}</p>
        </footer>
      </main>

      {/* Modal */}
      {selectedRecipe && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Modal content */}
          <div
            className="relative z-10 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute -top-2 -right-2 z-20 w-8 h-8 rounded-full bg-[var(--card-white)] shadow-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-dark)] transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>

            <RecipeCard
              recipe={selectedRecipe}
              showRemove
              onRemove={() => handleRemove(selectedRecipe.videoId)}
              onUpdate={handleUpdate}
            />
          </div>
        </div>
      )}
    </div>
  );
}
