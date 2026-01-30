# Video a Receta (Video to Recipe - Spanish)

Convert cooking videos from TikTok, Instagram, and YouTube into formatted recipes - **targeting Spanish-speaking markets**.

## Strategic Direction

**Why Spanish-first:**
- Main competitor (cooking.guru) is English-only with no i18n
- Massive Spanish-speaking food TikTok audience (Robe Grill 19M, Erik Dominguez 5M+)
- Lower SEO competition for Spanish keywords
- One site serves Mexico, Spain, US Hispanic, all of Latin America

**Multi-language future:**
Once i18n is baked in, adding German/Portuguese/French is just:
1. A translation JSON file
2. A language param to the API (Claude handles output language)

---

## Tech Stack

- **Frontend:** Next.js (App Router)
- **Backend:** FastAPI + Python
- **AI:** Claude Haiku for recipe parsing
- **Transcription:** YouTube transcript API (later: Whisper for TikTok/IG)

---

## Current State

MVP built with:
- YouTube URL input → transcript extraction → Claude parsing → structured recipe display
- Copy to clipboard functionality
- Caching (SQLite)

**What needs to change for Spanish:**
1. Add i18n to frontend (next-intl or simple translation object)
2. Translate ~25 UI strings
3. Update Claude prompt to output Spanish
4. Spanish SEO meta tags
5. Domain decision (videoareceta.com? recetadevideo.com?)

---

## Files Overview

```
frontend/
  src/
    app/
      page.tsx          # Main page (needs translation)
      layout.tsx        # Meta tags (needs Spanish SEO)
    components/
      recipe-converter.tsx  # Form + loading states (needs translation)
      recipe-card.tsx       # Recipe display (needs translation)

backend/
  app/
    services/
      recipe_parser.py  # Claude prompt (needs Spanish output)
      youtube.py        # Transcript extraction
    api/v1/
      recipes.py        # API endpoints
```

---

## Translation Inventory

**page.tsx:**
- "Video to Recipe" → "Video a Receta"
- "Paste a YouTube cooking video URL and get a formatted recipe with ingredients and instructions." → "Pega la URL de un video de cocina de YouTube y obtén una receta formateada con ingredientes e instrucciones."
- "Supports YouTube videos with English captions" → "Compatible con videos de YouTube con subtítulos"

**recipe-converter.tsx:**
- "Please enter a YouTube URL" → "Por favor ingresa una URL de YouTube"
- "Paste YouTube video URL..." → "Pega la URL del video de YouTube..."
- "Get Recipe" → "Obtener Receta"
- "Converting..." → "Convirtiendo..."
- "Extracting recipe from video..." → "Extrayendo receta del video..."
- "Failed to convert video" → "Error al convertir el video"
- "Something went wrong" → "Algo salió mal"

**recipe-card.tsx:**
- "Prep Time" / "Prep:" → "Preparación:"
- "Cook Time" / "Cook:" → "Cocción:"
- "Servings:" → "Porciones:"
- "Ingredients" → "Ingredientes"
- "Instructions" → "Instrucciones"
- "Copy" → "Copiar"
- "Copied!" → "¡Copiado!"
- "Loaded from cache" → "Cargado desde caché"
- "Watch original video →" → "Ver video original →"

---

## SEO Strategy

**Target keywords (Spanish):**
- "convertir video a receta"
- "video de TikTok a receta"
- "extraer receta de video"
- "video de cocina a texto"
- "receta de video de YouTube"

**Meta tags to update:**
```html
<html lang="es">
<title>Video a Receta - Convierte Videos de Cocina en Recetas</title>
<meta name="description" content="Convierte videos de cocina de YouTube, TikTok e Instagram en recetas estructuradas con ingredientes y pasos. Gratis y sin registro.">
```

---

## Domain Ideas

- videoareceta.com
- recetadevideo.com
- videoreceta.com
- mirecetavideo.com

Check availability before deciding.

---

## Next Steps

1. [ ] Set up i18n in Next.js (simple approach: translation object)
2. [ ] Translate all UI strings to Spanish
3. [ ] Update Claude prompt for Spanish output
4. [ ] Update meta tags and SEO
5. [ ] Pick and register domain
6. [ ] Deploy and test
7. [ ] Later: Add TikTok/Instagram support
8. [ ] Later: Add more languages

---

## Monetization (same as before)

- Freemium: 5 free conversions/month, then $5/month
- Or: Free + affiliate links for ingredients/cookware
- Or: Free + premium features (PDF export, nutritional data)
