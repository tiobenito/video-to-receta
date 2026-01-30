export const translations = {
  es: {
    // Page
    title: "Video a Receta",
    description: "Pega la URL de un video de cocina de YouTube y obtén una receta formateada con ingredientes e instrucciones.",
    footer: "Compatible con videos de YouTube con subtítulos en español",

    // Form
    placeholder: "Pega la URL del video de YouTube...",
    submit: "Obtener Receta",
    submitting: "Convirtiendo...",
    loading: "Extrayendo receta del video...",

    // Errors
    errorEmpty: "Por favor ingresa una URL de YouTube",
    errorConvert: "Error al convertir el video",
    errorGeneric: "Algo salió mal",

    // Recipe card
    prepTime: "Preparación:",
    cookTime: "Cocción:",
    servings: "Porciones:",
    ingredients: "Ingredientes",
    instructions: "Instrucciones",
    copy: "Copiar",
    copied: "¡Copiado!",
    cached: "Cargado desde caché",
    watchVideo: "Ver video original →",
    source: "Fuente:",
  },

  en: {
    // Page
    title: "Video to Recipe",
    description: "Paste a YouTube cooking video URL and get a formatted recipe with ingredients and instructions.",
    footer: "Supports YouTube videos with captions",

    // Form
    placeholder: "Paste YouTube video URL...",
    submit: "Get Recipe",
    submitting: "Converting...",
    loading: "Extracting recipe from video...",

    // Errors
    errorEmpty: "Please enter a YouTube URL",
    errorConvert: "Failed to convert video",
    errorGeneric: "Something went wrong",

    // Recipe card
    prepTime: "Prep:",
    cookTime: "Cook:",
    servings: "Servings:",
    ingredients: "Ingredients",
    instructions: "Instructions",
    copy: "Copy",
    copied: "Copied!",
    cached: "Loaded from cache",
    watchVideo: "Watch original video →",
    source: "Source:",
  },
} as const;

export type Locale = keyof typeof translations;
export type TranslationKey = keyof typeof translations.es;

// Default locale - change this to switch languages
export const defaultLocale: Locale = "es";

export function t(key: TranslationKey, locale: Locale = defaultLocale): string {
  return translations[locale][key];
}
