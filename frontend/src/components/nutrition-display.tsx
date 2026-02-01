"use client";

import { useState, useMemo } from "react";
import { Ingredient } from "@/types/recipe";
import { NutritionEstimate } from "@/types/nutrition";
import { calculatePerServingNutrition } from "@/lib/nutrition-calculator";
import { t } from "@/lib/translations";

interface NutritionDisplayProps {
  ingredients: Ingredient[];
  servings: string | null;
  scaleFactor?: number;
}

export function NutritionDisplay({
  ingredients,
  servings,
  scaleFactor = 1,
}: NutritionDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Parse servings count
  const servingsCount = useMemo(() => {
    if (!servings) return 1;
    const match = servings.match(/(\d+)/);
    return match ? parseInt(match[1]) * scaleFactor : 1;
  }, [servings, scaleFactor]);

  // Calculate per-serving nutrition
  const nutrition = useMemo(() => {
    return calculatePerServingNutrition(ingredients, servingsCount);
  }, [ingredients, servingsCount]);

  // Only show if we have some calories (indicates we matched some ingredients)
  if (nutrition.calories === 0) {
    return null;
  }

  return (
    <div className="border-t border-[var(--border-warm)] pt-4 mt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--gold-dark)] flex items-center gap-2">
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 2v6m0 4v8" />
            <path d="M4 10h16" />
            <path d="M4 18h16" />
          </svg>
          {t("nutrition")}
        </h3>
        <svg
          className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-3">
          <p className="text-xs text-[var(--text-muted)] mb-3">
            {t("perServing")} • {t("estimated")}
          </p>

          <div className="grid grid-cols-5 gap-2">
            <NutritionItem
              label={t("calories")}
              value={nutrition.calories}
              unit="kcal"
            />
            <NutritionItem
              label={t("protein")}
              value={nutrition.protein}
              unit="g"
            />
            <NutritionItem
              label={t("carbs")}
              value={nutrition.carbs}
              unit="g"
            />
            <NutritionItem
              label={t("fat")}
              value={nutrition.fat}
              unit="g"
            />
            <NutritionItem
              label={t("fiber")}
              value={nutrition.fiber}
              unit="g"
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface NutritionItemProps {
  label: string;
  value: number;
  unit: string;
}

function NutritionItem({ label, value, unit }: NutritionItemProps) {
  return (
    <div className="text-center p-2 bg-[var(--cream)] rounded">
      <div className="text-lg font-semibold text-[var(--text-dark)]">
        {value}
        <span className="text-xs text-[var(--text-muted)] ml-0.5">{unit}</span>
      </div>
      <div className="text-xs text-[var(--text-muted)] truncate">{label}</div>
    </div>
  );
}
