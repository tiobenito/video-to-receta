import { Ingredient } from "@/types/recipe";
import { NutritionEstimate } from "@/types/nutrition";
import { NUTRITION_DATABASE } from "./nutrition-data";
import { parseAmount } from "./unit-conversion";

// Approximate gram equivalents for common units
const UNIT_TO_GRAMS: Record<string, number> = {
  // Weight units - already in grams or easily converted
  g: 1,
  gram: 1,
  grams: 1,
  gramo: 1,
  gramos: 1,
  kg: 1000,
  kilo: 1000,
  kilos: 1000,
  kilogram: 1000,
  kilograms: 1000,
  oz: 28.35,
  ounce: 28.35,
  ounces: 28.35,
  onza: 28.35,
  onzas: 28.35,
  lb: 453.6,
  lbs: 453.6,
  pound: 453.6,
  pounds: 453.6,
  libra: 453.6,
  libras: 453.6,

  // Volume units - rough estimates assuming water-like density
  ml: 1,
  milliliter: 1,
  milliliters: 1,
  l: 1000,
  liter: 1000,
  liters: 1000,
  litro: 1000,
  litros: 1000,
  cup: 240,
  cups: 240,
  taza: 240,
  tazas: 240,
  tbsp: 15,
  tablespoon: 15,
  tablespoons: 15,
  cucharada: 15,
  cucharadas: 15,
  tsp: 5,
  teaspoon: 5,
  teaspoons: 5,
  cucharadita: 5,
  cucharaditas: 5,
  "fl oz": 30,
  "fluid ounce": 30,

  // Count-based units - rough estimates
  piece: 100, // default piece weight
  pieces: 100,
  pieza: 100,
  piezas: 100,
  unidad: 100,
  unidades: 100,
  clove: 3, // garlic clove
  cloves: 3,
  diente: 3,
  dientes: 3,
};

// Estimate grams from an ingredient amount
function estimateGrams(amount: string): number {
  const parsed = parseAmount(amount);
  if (!parsed) return 100; // Default fallback

  const { value, unit } = parsed;
  const unitLower = unit.toLowerCase();

  // Look up unit conversion
  const gramsPerUnit = UNIT_TO_GRAMS[unitLower];
  if (gramsPerUnit) {
    return value * gramsPerUnit;
  }

  // No unit means count - assume ~100g per piece
  if (!unit) {
    return value * 100;
  }

  // Unknown unit - rough fallback
  return value * 100;
}

// Find matching nutrition entry for an ingredient
function findNutritionEntry(itemName: string): typeof NUTRITION_DATABASE[0] | null {
  const itemLower = itemName.toLowerCase();

  for (const entry of NUTRITION_DATABASE) {
    for (const keyword of entry.keywords) {
      if (itemLower.includes(keyword) || keyword.includes(itemLower)) {
        return entry;
      }
    }
  }

  return null;
}

// Calculate nutrition for a single ingredient
function calculateIngredientNutrition(
  ingredient: Ingredient
): NutritionEstimate | null {
  const entry = findNutritionEntry(ingredient.item);
  if (!entry) return null;

  const grams = estimateGrams(ingredient.amount);
  const factor = grams / 100;

  return {
    calories: Math.round(entry.per100g.calories * factor),
    protein: Math.round(entry.per100g.protein * factor * 10) / 10,
    carbs: Math.round(entry.per100g.carbs * factor * 10) / 10,
    fat: Math.round(entry.per100g.fat * factor * 10) / 10,
    fiber: Math.round(entry.per100g.fiber * factor * 10) / 10,
  };
}

// Calculate total nutrition for all ingredients
export function calculateRecipeNutrition(
  ingredients: Ingredient[]
): NutritionEstimate {
  const total: NutritionEstimate = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  };

  let matchedCount = 0;

  for (const ingredient of ingredients) {
    const nutrition = calculateIngredientNutrition(ingredient);
    if (nutrition) {
      total.calories += nutrition.calories;
      total.protein += nutrition.protein;
      total.carbs += nutrition.carbs;
      total.fat += nutrition.fat;
      total.fiber += nutrition.fiber;
      matchedCount++;
    }
  }

  // Round final values
  return {
    calories: Math.round(total.calories),
    protein: Math.round(total.protein),
    carbs: Math.round(total.carbs),
    fat: Math.round(total.fat),
    fiber: Math.round(total.fiber),
  };
}

// Calculate per-serving nutrition
export function calculatePerServingNutrition(
  ingredients: Ingredient[],
  servings: number
): NutritionEstimate {
  const total = calculateRecipeNutrition(ingredients);

  if (servings <= 0) servings = 1;

  return {
    calories: Math.round(total.calories / servings),
    protein: Math.round((total.protein / servings) * 10) / 10,
    carbs: Math.round((total.carbs / servings) * 10) / 10,
    fat: Math.round((total.fat / servings) * 10) / 10,
    fiber: Math.round((total.fiber / servings) * 10) / 10,
  };
}
