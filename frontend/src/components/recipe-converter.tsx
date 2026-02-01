"use client";

import { useState } from "react";
import { Recipe, ErrorResponse } from "@/types/recipe";
import { RecipeCard } from "./recipe-card";
import { t } from "@/lib/translations";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export function RecipeConverter() {
  const [url, setUrl] = useState("");
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      setError(t("errorEmpty"));
      return;
    }

    setLoading(true);
    setError(null);
    setRecipe(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/recipes/convert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.detail || t("errorConvert"));
      }

      const data: Recipe = await response.json();
      setRecipe(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-8">
      {/* Input form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            placeholder={t("placeholder")}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            className="flex-1 px-4 py-3 text-[15px] rounded-lg border-2 border-[var(--border-warm)] bg-[var(--card-white)] text-[var(--text-dark)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--teal)] focus:ring-4 focus:ring-[var(--teal)]/10 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-lg font-medium text-white bg-gradient-to-br from-[var(--teal)] to-[var(--teal-dark)] hover:shadow-lg hover:shadow-[var(--teal)]/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {loading ? t("submitting") : t("submit")}
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
            {error}
          </p>
        )}
      </form>

      {/* Loading state */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[var(--cream-dark)] border-t-[var(--teal)]"></div>
          <p className="mt-4 text-[var(--text-muted)]">{t("loading")}</p>
        </div>
      )}

      {/* Recipe result */}
      {recipe && <RecipeCard recipe={recipe} />}
    </div>
  );
}
