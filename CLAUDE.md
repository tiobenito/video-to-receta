# Video a Receta (Video to Recipe - Spanish)

Convert cooking videos from YouTube into formatted recipes - **targeting Spanish-speaking markets**.

**Repo:** https://github.com/tiobenito/video-to-receta

---

## Current Status: MVP COMPLETE ✅

Working features:
- Spanish UI with i18n support (easy to add more languages)
- Whisper transcription for accurate recipe extraction
- Claude Haiku for recipe parsing (outputs in Spanish)
- YouTube video support
- Copy to clipboard
- Recipe caching (SQLite)
- Spanish SEO meta tags

---

## Strategic Direction

**Why Spanish-first:**
- Main competitor (cooking.guru) is English-only with no i18n
- Massive Spanish-speaking food TikTok audience (Robe Grill 19M, Erik Dominguez 5M+)
- Lower SEO competition for Spanish keywords
- One site serves Mexico, Spain, US Hispanic, all of Latin America

**Multi-language future:**
Once deployed, adding German/Portuguese/French is just:
1. Add translations to `frontend/src/lib/translations.ts`
2. Change `defaultLocale` or add URL-based routing

---

## Tech Stack

- **Frontend:** Next.js 16 + TypeScript + Tailwind + shadcn/ui
- **Backend:** FastAPI + Python
- **Transcription:** OpenAI Whisper API (accurate, handles Spanish audio)
- **Recipe Parsing:** Claude Haiku (outputs structured JSON in Spanish)
- **Database:** SQLite (via Prisma) for caching

---

## Running Locally

**Backend:**
```bash
cd backend
cp .env.example .env
# Add your API keys to .env:
#   ANTHROPIC_API_KEY=...
#   OPENAI_API_KEY=...
poetry install
poetry run prisma db push --schema=db/prisma/schema.prisma
poetry run uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
pnpm install
pnpm dev
```

Then open http://localhost:3000

---

## Files Overview

```
frontend/
  src/
    app/
      page.tsx              # Main page (Spanish)
      layout.tsx            # SEO meta tags (Spanish)
    components/
      recipe-converter.tsx  # URL input + loading states
      recipe-card.tsx       # Recipe display + copy button
    lib/
      translations.ts       # i18n strings (es + en)

backend/
  app/
    services/
      whisper.py          # Audio download + Whisper transcription
      recipe_parser.py    # Claude prompt (Spanish output)
      youtube.py          # Video ID extraction
    api/v1/
      recipes.py          # /convert endpoint
```

---

## API Costs Per Conversion

- **Whisper:** ~$0.006/min of audio (typical video = $0.05-0.10)
- **Claude Haiku:** ~$0.001-0.002 per recipe
- **Total:** ~$0.05-0.12 per conversion

---

## Next Steps

1. [ ] Pick and register domain (videoareceta.com? videoreceta.com?)
2. [ ] Deploy (Vercel for frontend, Railway for backend)
3. [ ] Add TikTok/Instagram support
4. [ ] Add more languages
5. [ ] Monetization (freemium or affiliate)

---

## SEO Strategy

**Target keywords (Spanish):**
- "convertir video a receta"
- "video de TikTok a receta"
- "extraer receta de video"
- "video de cocina a texto"
- "receta de video de YouTube"

**Current meta tags:**
```html
<html lang="es">
<title>Video a Receta - Convierte Videos de Cocina en Recetas</title>
<meta name="description" content="Convierte videos de cocina de YouTube, TikTok e Instagram en recetas estructuradas con ingredientes y pasos. Gratis y sin registro.">
```

---

## Monetization Ideas

- **Freemium:** 5 free conversions/month, then $5/month
- **Free + Affiliate:** Links to Amazon for ingredients/cookware
- **Free + Premium:** Pay for PDF export, nutritional data, recipe saving
