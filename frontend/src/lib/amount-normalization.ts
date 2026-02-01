import { parseAmount, formatFraction } from "./unit-conversion";

// Round up to shopping-friendly amounts
export function normalizeForShopping(amount: string): string {
  const parsed = parseAmount(amount);
  if (!parsed) return amount;

  const { value, unit, rest } = parsed;

  // Handle volume measurements - round to nearest quarter or half
  const volumeUnits = ["cup", "cups", "taza", "tazas", "ml", "l", "liter", "liters", "litro", "litros"];
  if (volumeUnits.includes(unit.toLowerCase())) {
    const rounded = roundToNiceFraction(value);
    return formatAmountString(rounded, unit, rest);
  }

  // Handle weight - round up to nice numbers
  const weightUnits = ["g", "gram", "grams", "gramo", "gramos", "kg", "kilo", "kilos", "kilogram", "kilograms", "oz", "ounce", "ounces", "lb", "lbs", "pound", "pounds"];
  if (weightUnits.includes(unit.toLowerCase())) {
    const rounded = roundWeight(value, unit);
    return formatAmountString(rounded, unit, rest);
  }

  // Handle tablespoons/teaspoons - keep as-is but use nice fractions
  const spoonUnits = ["tbsp", "tablespoon", "tablespoons", "cucharada", "cucharadas", "tsp", "teaspoon", "teaspoons", "cucharadita", "cucharaditas"];
  if (spoonUnits.includes(unit.toLowerCase())) {
    const rounded = roundToNiceFraction(value);
    return formatAmountString(rounded, unit, rest);
  }

  // For counts (no unit or count units), round up to whole numbers
  if (!unit || ["piece", "pieces", "pieza", "piezas", "unidad", "unidades"].includes(unit.toLowerCase())) {
    const rounded = Math.ceil(value);
    return formatAmountString(rounded, unit, rest);
  }

  // Default: use nice fraction formatting
  return formatAmountString(formatFraction(value), unit, rest);
}

function roundToNiceFraction(value: number): number {
  // Round to nearest 1/4
  return Math.ceil(value * 4) / 4;
}

function roundWeight(value: number, unit: string): number {
  const isMetric = ["g", "gram", "grams", "gramo", "gramos", "kg", "kilo", "kilos"].includes(unit.toLowerCase());

  if (isMetric) {
    if (unit.toLowerCase().startsWith("k")) {
      // Kilograms: round to nearest 0.25
      return Math.ceil(value * 4) / 4;
    } else {
      // Grams: round to nearest 25g for small amounts, 50g for larger
      if (value <= 100) {
        return Math.ceil(value / 25) * 25;
      } else {
        return Math.ceil(value / 50) * 50;
      }
    }
  } else {
    // Imperial: round to nearest quarter for lbs, nearest oz for ounces
    if (unit.toLowerCase().startsWith("lb") || unit.toLowerCase() === "pound" || unit.toLowerCase() === "pounds") {
      return Math.ceil(value * 4) / 4;
    } else {
      return Math.ceil(value);
    }
  }
}

function formatAmountString(value: number | string, unit: string, rest: string): string {
  const valueStr = typeof value === "number" ? formatFraction(value) : value;
  let result = valueStr;
  if (unit) {
    result += ` ${unit}`;
  }
  if (rest) {
    result += ` ${rest}`;
  }
  return result.trim();
}
