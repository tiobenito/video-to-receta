import { Ingredient } from "@/types/recipe";

export type UnitSystem = "metric" | "imperial";

// Conversion factors
const conversions: Record<string, { to: string; factor: number; system: UnitSystem }> = {
  // Volume - Imperial to Metric
  cup: { to: "ml", factor: 236.588, system: "imperial" },
  cups: { to: "ml", factor: 236.588, system: "imperial" },
  tbsp: { to: "ml", factor: 14.787, system: "imperial" },
  tablespoon: { to: "ml", factor: 14.787, system: "imperial" },
  tablespoons: { to: "ml", factor: 14.787, system: "imperial" },
  tsp: { to: "ml", factor: 4.929, system: "imperial" },
  teaspoon: { to: "ml", factor: 4.929, system: "imperial" },
  teaspoons: { to: "ml", factor: 4.929, system: "imperial" },
  "fl oz": { to: "ml", factor: 29.574, system: "imperial" },
  "fluid ounce": { to: "ml", factor: 29.574, system: "imperial" },
  "fluid ounces": { to: "ml", factor: 29.574, system: "imperial" },
  quart: { to: "l", factor: 0.946, system: "imperial" },
  quarts: { to: "l", factor: 0.946, system: "imperial" },
  gallon: { to: "l", factor: 3.785, system: "imperial" },
  gallons: { to: "l", factor: 3.785, system: "imperial" },
  pint: { to: "ml", factor: 473.176, system: "imperial" },
  pints: { to: "ml", factor: 473.176, system: "imperial" },

  // Volume - Metric to Imperial
  ml: { to: "fl oz", factor: 0.034, system: "metric" },
  milliliter: { to: "fl oz", factor: 0.034, system: "metric" },
  milliliters: { to: "fl oz", factor: 0.034, system: "metric" },
  l: { to: "quarts", factor: 1.057, system: "metric" },
  liter: { to: "quarts", factor: 1.057, system: "metric" },
  liters: { to: "quarts", factor: 1.057, system: "metric" },
  litro: { to: "quarts", factor: 1.057, system: "metric" },
  litros: { to: "quarts", factor: 1.057, system: "metric" },

  // Weight - Imperial to Metric
  oz: { to: "g", factor: 28.35, system: "imperial" },
  ounce: { to: "g", factor: 28.35, system: "imperial" },
  ounces: { to: "g", factor: 28.35, system: "imperial" },
  lb: { to: "kg", factor: 0.454, system: "imperial" },
  lbs: { to: "kg", factor: 0.454, system: "imperial" },
  pound: { to: "kg", factor: 0.454, system: "imperial" },
  pounds: { to: "kg", factor: 0.454, system: "imperial" },

  // Weight - Metric to Imperial
  g: { to: "oz", factor: 0.035, system: "metric" },
  gram: { to: "oz", factor: 0.035, system: "metric" },
  grams: { to: "oz", factor: 0.035, system: "metric" },
  gramo: { to: "oz", factor: 0.035, system: "metric" },
  gramos: { to: "oz", factor: 0.035, system: "metric" },
  kg: { to: "lbs", factor: 2.205, system: "metric" },
  kilogram: { to: "lbs", factor: 2.205, system: "metric" },
  kilograms: { to: "lbs", factor: 2.205, system: "metric" },
  kilo: { to: "lbs", factor: 2.205, system: "metric" },
  kilos: { to: "lbs", factor: 2.205, system: "metric" },

  // Temperature (handled separately)
};

// Spanish unit aliases
const spanishAliases: Record<string, string> = {
  taza: "cup",
  tazas: "cups",
  cucharada: "tbsp",
  cucharadas: "tbsp",
  cucharadita: "tsp",
  cucharaditas: "tsp",
  onza: "oz",
  onzas: "oz",
  libra: "lb",
  libras: "lbs",
};

export function parseAmount(amount: string): { value: number; unit: string; rest: string } | null {
  // Handle fractions like "1/2", "1 1/2"
  const fractionRegex = /^(\d+\s+)?(\d+)\/(\d+)\s*(.*)$/;
  const decimalRegex = /^(\d+(?:\.\d+)?)\s*(.*)$/;

  let value: number;
  let rest: string;

  const fractionMatch = amount.match(fractionRegex);
  if (fractionMatch) {
    const whole = fractionMatch[1] ? parseInt(fractionMatch[1]) : 0;
    const numerator = parseInt(fractionMatch[2]);
    const denominator = parseInt(fractionMatch[3]);
    value = whole + numerator / denominator;
    rest = fractionMatch[4].trim();
  } else {
    const decimalMatch = amount.match(decimalRegex);
    if (decimalMatch) {
      value = parseFloat(decimalMatch[1]);
      rest = decimalMatch[2].trim();
    } else {
      return null;
    }
  }

  // Extract unit from rest
  const unitMatch = rest.match(/^(\S+)(.*)$/);
  if (!unitMatch) {
    return { value, unit: "", rest };
  }

  let unit = unitMatch[1].toLowerCase();
  const remaining = unitMatch[2].trim();

  // Check Spanish aliases
  if (spanishAliases[unit]) {
    unit = spanishAliases[unit];
  }

  return { value, unit, rest: remaining };
}

function formatNumber(n: number): string {
  // Round to reasonable precision
  if (n >= 100) {
    return Math.round(n).toString();
  } else if (n >= 10) {
    return (Math.round(n * 10) / 10).toString();
  } else {
    return (Math.round(n * 100) / 100).toString();
  }
}

export function convertIngredient(
  ingredient: Ingredient,
  targetSystem: UnitSystem
): Ingredient {
  const parsed = parseAmount(ingredient.amount);
  if (!parsed || !parsed.unit) {
    return ingredient;
  }

  const conversion = conversions[parsed.unit];
  if (!conversion) {
    return ingredient;
  }

  // Only convert if we're going to a different system
  if (
    (targetSystem === "metric" && conversion.system === "metric") ||
    (targetSystem === "imperial" && conversion.system === "imperial")
  ) {
    return ingredient;
  }

  const convertedValue = parsed.value * conversion.factor;
  const newAmount = `${formatNumber(convertedValue)} ${conversion.to}${parsed.rest ? " " + parsed.rest : ""}`;

  return {
    ...ingredient,
    amount: newAmount,
  };
}

export function convertIngredients(
  ingredients: Ingredient[],
  targetSystem: UnitSystem
): Ingredient[] {
  return ingredients.map((ing) => convertIngredient(ing, targetSystem));
}

// Common fractions for nice display
const NICE_FRACTIONS: { value: number; display: string }[] = [
  { value: 0.125, display: "1/8" },
  { value: 0.25, display: "1/4" },
  { value: 0.333, display: "1/3" },
  { value: 0.375, display: "3/8" },
  { value: 0.5, display: "1/2" },
  { value: 0.667, display: "2/3" },
  { value: 0.75, display: "3/4" },
  { value: 0.875, display: "7/8" },
];

export function formatFraction(value: number): string {
  if (value <= 0) return "";

  const whole = Math.floor(value);
  const decimal = value - whole;

  // If very close to a whole number, return it
  if (decimal < 0.05) {
    return whole.toString();
  }

  // Find closest nice fraction
  let closestFraction = "";
  let closestDiff = 1;

  for (const frac of NICE_FRACTIONS) {
    const diff = Math.abs(decimal - frac.value);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestFraction = frac.display;
    }
  }

  // If decimal is close enough to a fraction (within 0.05), use it
  if (closestDiff < 0.05) {
    if (whole > 0) {
      return `${whole} ${closestFraction}`;
    }
    return closestFraction;
  }

  // Otherwise, round to reasonable precision
  if (value >= 10) {
    return Math.round(value).toString();
  }
  return (Math.round(value * 10) / 10).toString();
}

export function scaleIngredients(
  ingredients: Ingredient[],
  scaleFactor: number
): Ingredient[] {
  return ingredients.map((ing) => {
    const parsed = parseAmount(ing.amount);
    if (!parsed) return ing;

    const scaledValue = parsed.value * scaleFactor;
    const formattedValue = formatFraction(scaledValue);

    // Reconstruct the amount string
    let newAmount = formattedValue;
    if (parsed.unit) {
      newAmount += ` ${parsed.unit}`;
    }
    if (parsed.rest) {
      newAmount += ` ${parsed.rest}`;
    }

    return {
      ...ing,
      amount: newAmount.trim(),
    };
  });
}
