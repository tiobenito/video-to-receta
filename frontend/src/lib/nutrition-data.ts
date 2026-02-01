import { NutritionEntry } from "@/types/nutrition";

// Nutrition data per 100g for common ingredients
// Sources: USDA FoodData Central
export const NUTRITION_DATABASE: NutritionEntry[] = [
  // Proteins
  {
    keywords: ["pollo", "chicken", "pechuga", "breast", "muslo", "thigh"],
    per100g: { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
  },
  {
    keywords: ["carne", "beef", "res", "bistec", "steak", "ground beef", "carne molida"],
    per100g: { calories: 250, protein: 26, carbs: 0, fat: 15, fiber: 0 },
  },
  {
    keywords: ["cerdo", "pork", "puerco", "chuleta", "loin"],
    per100g: { calories: 242, protein: 27, carbs: 0, fat: 14, fiber: 0 },
  },
  {
    keywords: ["salmon", "salmon"],
    per100g: { calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0 },
  },
  {
    keywords: ["atun", "tuna"],
    per100g: { calories: 132, protein: 28, carbs: 0, fat: 1, fiber: 0 },
  },
  {
    keywords: ["camaron", "shrimp", "camarones"],
    per100g: { calories: 99, protein: 24, carbs: 0.2, fat: 0.3, fiber: 0 },
  },
  {
    keywords: ["huevo", "egg", "huevos", "eggs"],
    per100g: { calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0 },
  },
  {
    keywords: ["tofu"],
    per100g: { calories: 76, protein: 8, carbs: 1.9, fat: 4.8, fiber: 0.3 },
  },

  // Dairy
  {
    keywords: ["queso", "cheese"],
    per100g: { calories: 402, protein: 25, carbs: 1.3, fat: 33, fiber: 0 },
  },
  {
    keywords: ["leche", "milk"],
    per100g: { calories: 42, protein: 3.4, carbs: 5, fat: 1, fiber: 0 },
  },
  {
    keywords: ["crema", "cream", "sour cream", "crema agria"],
    per100g: { calories: 193, protein: 2.1, carbs: 4.3, fat: 19, fiber: 0 },
  },
  {
    keywords: ["yogurt", "yogur"],
    per100g: { calories: 59, protein: 10, carbs: 3.6, fat: 0.7, fiber: 0 },
  },
  {
    keywords: ["mantequilla", "butter"],
    per100g: { calories: 717, protein: 0.9, carbs: 0.1, fat: 81, fiber: 0 },
  },

  // Grains & Starches
  {
    keywords: ["arroz", "rice"],
    per100g: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4 },
  },
  {
    keywords: ["pasta", "spaghetti", "fideos", "noodles"],
    per100g: { calories: 131, protein: 5, carbs: 25, fat: 1.1, fiber: 1.8 },
  },
  {
    keywords: ["pan", "bread"],
    per100g: { calories: 265, protein: 9, carbs: 49, fat: 3.2, fiber: 2.7 },
  },
  {
    keywords: ["tortilla", "tortillas"],
    per100g: { calories: 218, protein: 5.7, carbs: 44, fat: 2.9, fiber: 3.1 },
  },
  {
    keywords: ["harina", "flour"],
    per100g: { calories: 364, protein: 10, carbs: 76, fat: 1, fiber: 2.7 },
  },
  {
    keywords: ["papa", "potato", "papas", "potatoes", "patata"],
    per100g: { calories: 77, protein: 2, carbs: 17, fat: 0.1, fiber: 2.2 },
  },
  {
    keywords: ["frijol", "bean", "frijoles", "beans", "black beans", "frijoles negros"],
    per100g: { calories: 132, protein: 9, carbs: 24, fat: 0.5, fiber: 8.7 },
  },
  {
    keywords: ["lenteja", "lentil", "lentejas", "lentils"],
    per100g: { calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 7.9 },
  },
  {
    keywords: ["avena", "oats", "oatmeal"],
    per100g: { calories: 389, protein: 17, carbs: 66, fat: 7, fiber: 10.6 },
  },

  // Vegetables
  {
    keywords: ["tomate", "tomato", "jitomate", "tomatoes"],
    per100g: { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2 },
  },
  {
    keywords: ["cebolla", "onion", "cebollas", "onions"],
    per100g: { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7 },
  },
  {
    keywords: ["ajo", "garlic"],
    per100g: { calories: 149, protein: 6.4, carbs: 33, fat: 0.5, fiber: 2.1 },
  },
  {
    keywords: ["zanahoria", "carrot", "zanahorias", "carrots"],
    per100g: { calories: 41, protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8 },
  },
  {
    keywords: ["brocoli", "broccoli"],
    per100g: { calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6 },
  },
  {
    keywords: ["espinaca", "spinach", "espinacas"],
    per100g: { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2 },
  },
  {
    keywords: ["lechuga", "lettuce"],
    per100g: { calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2, fiber: 1.3 },
  },
  {
    keywords: ["pimiento", "pepper", "bell pepper", "chile", "chili"],
    per100g: { calories: 31, protein: 1, carbs: 6, fat: 0.3, fiber: 2.1 },
  },
  {
    keywords: ["calabacin", "zucchini", "calabaza", "squash"],
    per100g: { calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3, fiber: 1 },
  },
  {
    keywords: ["aguacate", "avocado"],
    per100g: { calories: 160, protein: 2, carbs: 8.5, fat: 15, fiber: 6.7 },
  },
  {
    keywords: ["elote", "corn", "maiz"],
    per100g: { calories: 86, protein: 3.3, carbs: 19, fat: 1.4, fiber: 2.7 },
  },
  {
    keywords: ["champiñon", "mushroom", "hongos", "mushrooms"],
    per100g: { calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3, fiber: 1 },
  },

  // Fruits
  {
    keywords: ["manzana", "apple"],
    per100g: { calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4 },
  },
  {
    keywords: ["platano", "banana", "banano"],
    per100g: { calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6 },
  },
  {
    keywords: ["fresa", "strawberry", "fresas", "strawberries"],
    per100g: { calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2 },
  },
  {
    keywords: ["naranja", "orange"],
    per100g: { calories: 47, protein: 0.9, carbs: 12, fat: 0.1, fiber: 2.4 },
  },
  {
    keywords: ["limon", "lemon", "lime", "lima"],
    per100g: { calories: 29, protein: 1.1, carbs: 9.3, fat: 0.3, fiber: 2.8 },
  },
  {
    keywords: ["mango"],
    per100g: { calories: 60, protein: 0.8, carbs: 15, fat: 0.4, fiber: 1.6 },
  },
  {
    keywords: ["piña", "pineapple", "ananas"],
    per100g: { calories: 50, protein: 0.5, carbs: 13, fat: 0.1, fiber: 1.4 },
  },

  // Oils & Fats
  {
    keywords: ["aceite", "oil", "olive oil", "aceite de oliva"],
    per100g: { calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0 },
  },

  // Sweeteners
  {
    keywords: ["azucar", "sugar"],
    per100g: { calories: 387, protein: 0, carbs: 100, fat: 0, fiber: 0 },
  },
  {
    keywords: ["miel", "honey"],
    per100g: { calories: 304, protein: 0.3, carbs: 82, fat: 0, fiber: 0.2 },
  },
  {
    keywords: ["chocolate", "cacao", "cocoa"],
    per100g: { calories: 546, protein: 5, carbs: 60, fat: 31, fiber: 7 },
  },

  // Nuts & Seeds
  {
    keywords: ["almendra", "almond", "almendras", "almonds"],
    per100g: { calories: 579, protein: 21, carbs: 22, fat: 50, fiber: 12.5 },
  },
  {
    keywords: ["nuez", "walnut", "nueces", "walnuts"],
    per100g: { calories: 654, protein: 15, carbs: 14, fat: 65, fiber: 6.7 },
  },
  {
    keywords: ["cacahuate", "peanut", "mani", "peanuts"],
    per100g: { calories: 567, protein: 26, carbs: 16, fat: 49, fiber: 8.5 },
  },

  // Condiments & Sauces
  {
    keywords: ["salsa", "sauce"],
    per100g: { calories: 36, protein: 1.5, carbs: 7.5, fat: 0.2, fiber: 1.8 },
  },
  {
    keywords: ["mayonesa", "mayo", "mayonnaise"],
    per100g: { calories: 680, protein: 1, carbs: 0.6, fat: 75, fiber: 0 },
  },
  {
    keywords: ["mostaza", "mustard"],
    per100g: { calories: 66, protein: 4.4, carbs: 5.8, fat: 3.3, fiber: 3.3 },
  },
  {
    keywords: ["ketchup", "catsup"],
    per100g: { calories: 112, protein: 1.7, carbs: 26, fat: 0.1, fiber: 0.3 },
  },
  {
    keywords: ["soya", "soy sauce", "salsa de soya"],
    per100g: { calories: 53, protein: 8, carbs: 5, fat: 0, fiber: 0.8 },
  },

  // Drinks (per 100ml)
  {
    keywords: ["vino", "wine"],
    per100g: { calories: 83, protein: 0.1, carbs: 2.6, fat: 0, fiber: 0 },
  },
  {
    keywords: ["cerveza", "beer"],
    per100g: { calories: 43, protein: 0.5, carbs: 3.6, fat: 0, fiber: 0 },
  },
];
