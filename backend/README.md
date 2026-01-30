# Video to Recipe - Backend

FastAPI backend for converting YouTube cooking videos into structured recipes.

## Setup

```bash
poetry install
cp .env.example .env
# Edit .env with your API keys
poetry run prisma generate
poetry run prisma db push
```

## Run

```bash
poetry run uvicorn app.main:app --reload
```

## API Endpoints

- `POST /api/v1/recipes/convert` - Convert YouTube URL to recipe
- `GET /api/v1/recipes/{id}` - Get cached recipe by ID
- `GET /api/v1/health` - Health check
