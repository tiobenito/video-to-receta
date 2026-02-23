# Video a Receta (Video to Recipe - Spanish)

Convert cooking videos from YouTube and TikTok into formatted recipes - **Spanish-first**.

**Repo:** https://github.com/tiobenito/video-to-receta
**Live:** https://video-to-receta.vercel.app

---

## Current Status: DEPLOYED (Demo Mode)

Working features:
- Spanish UI with i18n support
- Whisper transcription for accurate recipe extraction
- Claude Haiku for recipe parsing (outputs in Spanish)
- YouTube + TikTok video support
- Recipe book (localStorage) with tags, notes, collections
- Unit conversion (metric/imperial), servings scaler
- PDF download, copy to clipboard, shopping list
- Recipe caching (PostgreSQL)
- No login required (auth is optional)

---

## Tech Stack

- **Frontend:** Next.js 16 + TypeScript + Tailwind + shadcn/ui (Vercel)
- **Backend:** FastAPI + Python (Railway)
- **Transcription:** OpenAI Whisper API
- **Recipe Parsing:** Claude Haiku (Anthropic)
- **Database:** PostgreSQL (Railway) via Prisma for recipe caching
- **Saved Recipes:** localStorage (browser-only, no account needed)

---

## Running Locally

**Backend:**
```bash
cd backend
cp .env.example .env
# Add your API keys to .env:
#   ANTHROPIC_API_KEY=...
#   OPENAI_API_KEY=...
#   DATABASE_URL=file:./db/prisma/dev.db  (SQLite for local dev)
poetry install
poetry run prisma generate --schema=db/prisma/schema.prisma
poetry run prisma db push --schema=db/prisma/schema.prisma
poetry run uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
cp .env.example .env.local
pnpm install
pnpm dev
```

Then open http://localhost:3000

---

## Architecture

```
Vercel (Frontend)              Railway (Backend)
Next.js 16 + TypeScript        FastAPI + Python
       |                              |
       |  POST /api/v1/recipes/       |
       |         /convert             |
       +----------------------------->+
                                      |
                                Whisper (OpenAI)
                                  + Claude Haiku
                                      |
                                PostgreSQL (cache)
```

Saved recipes live in the browser's localStorage. No account or backend needed for saving.

---

## Key Files

```
frontend/
  src/
    app/
      page.tsx                # Main converter page
      recetario/page.tsx      # Recipe book (saved recipes)
      lista-compras/page.tsx  # Shopping list
    components/
      recipe-converter.tsx    # URL input + loading states
      recipe-card.tsx         # Recipe display + actions
    lib/
      recipe-storage.ts       # localStorage CRUD for saved recipes
      collection-storage.ts   # Collections (localStorage)
      translations.ts         # i18n strings (es + en)

backend/
  app/
    services/
      whisper.py              # Audio download + Whisper transcription
      recipe_parser.py        # Claude Haiku recipe extraction
      youtube.py              # Video ID extraction
      blog_scraper.py         # Recipe blog scraping
    api/v1/
      recipes.py              # POST /convert endpoint
      health.py               # GET /health endpoint
  db/prisma/
    schema.prisma             # PostgreSQL schema (recipe cache)
```

---

## API Costs Per Conversion

- **Whisper:** ~$0.006/min of audio (typical video = $0.05-0.10)
- **Claude Haiku:** ~$0.001-0.002 per recipe
- **Total:** ~$0.05-0.12 per conversion
