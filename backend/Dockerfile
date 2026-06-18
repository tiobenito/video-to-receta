FROM python:3.12-slim

WORKDIR /app

# Install system dependencies (ffmpeg for yt-dlp audio extraction)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install poetry
RUN pip install --no-cache-dir poetry

# Copy dependency files
COPY pyproject.toml ./

# Install dependencies (no dev deps, no virtualenv in container)
RUN poetry config virtualenvs.create false \
    && poetry install --only main --no-root --no-interaction

# Copy application code
COPY . .

EXPOSE 8000

CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
