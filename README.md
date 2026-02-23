# Video a Receta

Paste a YouTube or TikTok cooking video URL, get a structured recipe in Spanish.

**Live demo:** [video-to-receta.vercel.app](https://video-to-receta.vercel.app)

## How It Works

1. Paste a cooking video URL (YouTube or TikTok)
2. Audio is extracted and transcribed with **OpenAI Whisper**
3. **Claude Haiku** parses the transcript into a structured recipe
4. You get ingredients, instructions, prep time, and servings — all in Spanish

## Features

- Spanish-first UI with full i18n support
- YouTube + TikTok video support
- Recipe book with localStorage (save, organize, tag recipes)
- Collections and tags for organizing saved recipes
- Unit conversion (metric/imperial)
- Servings scaler
- PDF download
- Copy to clipboard
- Shopping list generator
- Personal notes on recipes
- Edit saved recipes
- Nutrition estimates
- Recipe caching (avoids re-processing the same video)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | FastAPI, Python |
| Transcription | OpenAI Whisper API |
| Recipe Parsing | Claude Haiku (Anthropic) |
| Database | PostgreSQL (production), SQLite (local dev) via Prisma |
| Deployment | Vercel (frontend), Railway (backend) |

## Running Locally

### Backend

```bash
cd backend
cp .env.example .env
# Add your API keys to .env:
#   ANTHROPIC_API_KEY=your-key
#   OPENAI_API_KEY=your-key
#   DATABASE_URL=file:./db/prisma/dev.db
poetry install
poetry run prisma generate --schema=db/prisma/schema.prisma
poetry run prisma db push --schema=db/prisma/schema.prisma
poetry run uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### Requirements

- Python 3.12+
- Node.js 18+
- pnpm
- ffmpeg (for audio extraction from videos)

## API Cost Per Conversion

- **Whisper:** ~$0.05-0.10 (depends on video length)
- **Claude Haiku:** ~$0.001-0.002
- **Total:** ~$0.05-0.12 per conversion

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

Saved recipes are stored in the browser's localStorage — no account required.

## Built With

[Claude Code](https://claude.ai/claude-code)

## License

MIT
