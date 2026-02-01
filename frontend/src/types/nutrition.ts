export interface NutritionEstimate {
  calories: number;
  protein: number;  // grams
  carbs: number;    // grams
  fat: number;      // grams
  fiber: number;    // grams
}

export interface NutritionEntry {
  keywords: string[];
  per100g: NutritionEstimate;
}
