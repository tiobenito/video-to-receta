"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Recipe } from "@/types/recipe";
import { useState } from "react";
import { t } from "@/lib/translations";

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const [copied, setCopied] = useState(false);

  const formatRecipeAsText = () => {
    let text = `${recipe.title}\n\n`;

    if (recipe.prepTime || recipe.cookTime || recipe.servings) {
      if (recipe.prepTime) text += `${t("prepTime")} ${recipe.prepTime}\n`;
      if (recipe.cookTime) text += `${t("cookTime")} ${recipe.cookTime}\n`;
      if (recipe.servings) text += `${t("servings")} ${recipe.servings}\n`;
      text += "\n";
    }

    text += `${t("ingredients").toUpperCase()}\n`;
    recipe.ingredients.forEach((ing) => {
      text += `• ${ing.amount} ${ing.item}\n`;
    });
    text += "\n";

    text += `${t("instructions").toUpperCase()}\n`;
    recipe.instructions.forEach((inst) => {
      text += `${inst.step}. ${inst.text}\n`;
    });

    text += `\n${t("source")} ${recipe.youtubeUrl}`;

    return text;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formatRecipeAsText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-2xl">{recipe.title}</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="shrink-0"
          >
            {copied ? t("copied") : t("copy")}
          </Button>
        </div>

        {/* Metadata row */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
          {recipe.prepTime && (
            <span>
              <strong>{t("prepTime")}</strong> {recipe.prepTime}
            </span>
          )}
          {recipe.cookTime && (
            <span>
              <strong>{t("cookTime")}</strong> {recipe.cookTime}
            </span>
          )}
          {recipe.servings && (
            <span>
              <strong>{t("servings")}</strong> {recipe.servings}
            </span>
          )}
        </div>

        {recipe.cached && (
          <span className="text-xs text-muted-foreground">{t("cached")}</span>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Ingredients */}
        <div>
          <h3 className="font-semibold text-lg mb-3">{t("ingredients")}</h3>
          <ul className="space-y-2">
            {recipe.ingredients.map((ing, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="text-muted-foreground">{ing.amount}</span>
                <span>{ing.item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Instructions */}
        <div>
          <h3 className="font-semibold text-lg mb-3">{t("instructions")}</h3>
          <ol className="space-y-3">
            {recipe.instructions.map((inst) => (
              <li key={inst.step} className="flex gap-3">
                <span className="font-medium text-muted-foreground shrink-0">
                  {inst.step}.
                </span>
                <span>{inst.text}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Source link */}
        <div className="pt-4 border-t">
          <a
            href={recipe.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("watchVideo")}
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
