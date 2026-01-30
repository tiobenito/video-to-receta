# Video to Recipe - Build Log

## Overview
Converting YouTube cooking videos into formatted recipes using transcript extraction + Claude Haiku parsing.

**Started:** 2026-01-29
**Status:** MVP Complete - Ready for Testing

---

## Current Status Summary

| Component | Status | Details |
|-----------|--------|---------|
| **Backend Structure** | ✅ Done | Poetry, FastAPI, all folders created |
| **Database Schema** | ✅ Done | Prisma schema with SQLite for dev |
| **YouTube Service** | ✅ Done | Transcript extraction working |
| **Recipe Parser** | ✅ Done | Claude Haiku integration written |
| **API Endpoints** | ✅ Done | All 3 endpoints written |
| **Backend Testing** | ✅ Done | Server starts, imports verified |
| **Frontend Structure** | ✅ Done | Next.js 16 + TypeScript + Tailwind |
| **shadcn/ui** | ✅ Done | button, input, card installed |
| **RecipeConverter** | ✅ Done | URL input with loading states |
| **RecipeCard** | ✅ Done | Recipe display with copy button |
| **Frontend Build** | ✅ Done | Builds successfully |
| **E2E Testing** | ⏳ Pending | Need API key to test full flow |
| **Deployment** | ❌ Not Started | Railway/Vercel not configured |

---

## Tech Stack Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| Backend | Python 3.12 + FastAPI | API server |
| Database | SQLite (dev) / PostgreSQL (prod) | Recipe caching |
| Transcript | youtube-transcript-api | Extract captions |
| Fallback | yt-dlp + Whisper API | Videos without captions |
| AI | Claude Haiku | Parse transcript → recipe |
| Frontend | Next.js 16 + TypeScript | User interface |
| Styling | Tailwind + shadcn/ui | Components |

---

## How to Run

### Backend

```bash
cd backend

# Set your Anthropic API key in .env
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env

# Start the server
poetry run uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### Frontend

```bash
cd frontend

# Start dev server
pnpm dev
```

App available at: http://localhost:3000

---

## Build Checkpoints

### Phase 1: Backend Core - ✅ COMPLETE

- [x] **1.1 Initialize Poetry project**
- [x] **1.2 Create FastAPI app structure**
- [x] **1.3 Set up Prisma schema** (SQLite for dev)
- [x] **1.4 YouTube transcript service**
- [x] **1.5 Recipe parser service**
- [x] **1.6 API endpoints**
- [x] **1.7 Test backend locally** - Server starts, imports verified

### Phase 2: Frontend - ✅ COMPLETE

- [x] **2.1 Initialize Next.js project** - Next.js 16, TypeScript, Tailwind
- [x] **2.2 Install shadcn/ui** - button, input, card components
- [x] **2.3 Build RecipeConverter component** - URL input, loading states, API integration
- [x] **2.4 Build RecipeCard component** - Ingredients, instructions, metadata, copy button
- [x] **2.5 Build CopyButton** - Integrated into RecipeCard
- [ ] **2.6 Build DownloadPdfButton** - Deferred to v1.5
- [x] **2.7 Style and polish homepage** - Clean, minimal design
- [x] **2.8 Test frontend build** - Builds successfully

### Phase 3: Integration & Deployment (Future)

- [ ] **3.1 Test full E2E flow** - Need Anthropic API key
- [ ] **3.2 Deploy backend to Railway**
- [ ] **3.3 Provision PostgreSQL on Railway**
- [ ] **3.4 Deploy frontend to Vercel**
- [ ] **3.5 Test production flow**

---

## Files Created

```
video-to-recipe/
├── BUILD_LOG.md                    ✅
├── CLAUDE.md                       ✅
├── backend/
│   ├── README.md                   ✅
│   ├── pyproject.toml              ✅
│   ├── poetry.lock                 ✅
│   ├── .env                        ✅ (needs API key)
│   ├── .env.example                ✅
│   ├── app/
│   │   ├── __init__.py             ✅
│   │   ├── main.py                 ✅
│   │   ├── api/
│   │   │   ├── __init__.py         ✅
│   │   │   └── v1/
│   │   │       ├── __init__.py     ✅
│   │   │       ├── health.py       ✅
│   │   │       └── recipes.py      ✅
│   │   ├── core/
│   │   │   ├── __init__.py         ✅
│   │   │   ├── config.py           ✅
│   │   │   └── database.py         ✅
│   │   ├── models/
│   │   │   ├── __init__.py         ✅
│   │   │   └── recipe.py           ✅
│   │   └── services/
│   │       ├── __init__.py         ✅
│   │       ├── youtube.py          ✅
│   │       └── recipe_parser.py    ✅
│   └── db/
│       └── prisma/
│           ├── schema.prisma       ✅
│           └── dev.db              ✅
│
└── frontend/
    ├── .env.local                  ✅
    ├── package.json                ✅
    ├── src/
    │   ├── app/
    │   │   ├── globals.css         ✅
    │   │   ├── layout.tsx          ✅
    │   │   └── page.tsx            ✅
    │   ├── components/
    │   │   ├── recipe-card.tsx     ✅
    │   │   ├── recipe-converter.tsx ✅
    │   │   └── ui/                 ✅ (shadcn components)
    │   ├── lib/
    │   │   └── utils.ts            ✅
    │   └── types/
    │       └── recipe.ts           ✅
    └── ...
```

---

## Environment Variables

### Backend (.env)
```
ANTHROPIC_API_KEY=sk-ant-...    # Required
OPENAI_API_KEY=sk-...            # Optional (Whisper fallback)
DEBUG=true
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

---

## API Reference

### POST /api/v1/recipes/convert
Convert YouTube URL to recipe.

**Request:**
```json
{ "url": "https://youtube.com/watch?v=..." }
```

**Response (200):**
```json
{
  "id": "cuid...",
  "youtubeUrl": "https://...",
  "videoId": "abc123",
  "title": "Recipe Name",
  "ingredients": [
    { "amount": "2 cups", "item": "flour" }
  ],
  "instructions": [
    { "step": 1, "text": "Preheat oven..." }
  ],
  "prepTime": "10 minutes",
  "cookTime": "30 minutes",
  "servings": "4 servings",
  "cached": false
}
```

### GET /api/v1/recipes/{id}
Get cached recipe by ID.

### GET /api/v1/health
Health check - returns `{ "status": "healthy" }`

---

## Session Notes

### 2026-01-29 - Session 2: Frontend Build

**What was done:**
1. Fixed circular import issue (created `core/database.py`)
2. Switched to SQLite for local dev (JSON fields → String)
3. Generated Prisma client and created database
4. Verified backend starts successfully
5. Created Next.js 16 frontend with TypeScript + Tailwind
6. Installed shadcn/ui (button, input, card)
7. Built RecipeConverter component with loading states
8. Built RecipeCard component with copy functionality
9. Created clean homepage design
10. Verified frontend builds successfully

**Changes from Session 1:**
- Prisma schema uses SQLite instead of PostgreSQL for easier local dev
- `ingredients` and `instructions` stored as JSON strings (SQLite limitation)
- Added `core/database.py` to avoid circular imports

**Next Steps:**
1. Add your Anthropic API key to `backend/.env`
2. Run backend: `poetry run uvicorn app.main:app --reload`
3. Run frontend: `pnpm dev`
4. Test with a real YouTube cooking video
5. Deploy when ready

### 2026-01-29 - Session 1: Initial Build

**What was done:**
1. Created full backend structure
2. Set up Poetry with all dependencies
3. Created Prisma schema for Recipe model
4. Built YouTube transcript extraction service
5. Built Claude Haiku recipe parsing service
6. Created all 3 API endpoints with caching logic
7. Created Pydantic models for request/response

---

## Known Limitations

1. **YouTube only** - TikTok/Instagram not yet supported
2. **Requires captions** - Whisper fallback not implemented
3. **English/Spanish only** - Limited language support
4. **No video title** - Would need YouTube Data API

---

## Future Enhancements (v1.5+)

- [ ] PDF download button
- [ ] TikTok support
- [ ] Instagram support
- [ ] Whisper fallback for videos without captions
- [ ] Nutritional estimates
- [ ] Recipe scaling
- [ ] Dark mode toggle
