# Video a Receta

Paste a YouTube or TikTok cooking video URL, get a structured recipe in Spanish.

**[Live demo →](https://video2receta.vercel.app)**

## How It Works

1. Paste a cooking video URL (YouTube, TikTok, or recipe blog)
2. Audio is extracted and transcribed with **OpenAI Whisper**
3. **Claude Haiku** parses the transcript into a structured recipe
4. You get ingredients, instructions, prep time, and servings — all in Spanish

## Features

- Spanish-first UI
- YouTube + TikTok + recipe blog support
- Save recipes locally (localStorage — no account required)
- Collections and tags for organizing saved recipes
- Unit conversion (metric/imperial)
- Servings scaler
- Shopping list generator
- Personal notes on saved recipes
- Edit saved recipes
- Nutrition estimates

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.12 |
| Transcription | OpenAI Whisper API |
| Recipe Parsing | Claude Haiku (Anthropic) |
| Deployment | Vercel (frontend), Railway (backend) |

## Running Locally

### Backend

```bash
cd backend
cp .env.example .env
# Add your API keys to .env:
#   ANTHROPIC_API_KEY=your-key
#   OPENAI_API_KEY=your-key
poetry install
poetry run uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
# Set NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### Requirements

- Python 3.12+
- Node.js 18+, pnpm
- ffmpeg (for audio extraction — `brew install ffmpeg`)

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
```

Saved recipes are stored in the browser's localStorage — no account required.

## Built With

[Claude Code](https://claude.ai/claude-code)

## License

MIT
