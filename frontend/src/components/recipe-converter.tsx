"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {/* Input form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3">
          <Input
            type="url"
            placeholder={t("placeholder")}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading}>
            {loading ? t("submitting") : t("submit")}
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>

      {/* Loading state */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-muted border-t-primary"></div>
          <p className="mt-4 text-muted-foreground">{t("loading")}</p>
        </div>
      )}

      {/* Recipe result */}
      {recipe && <RecipeCard recipe={recipe} />}
    </div>
  );
}
