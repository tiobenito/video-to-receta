import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import health, recipes
from app.core.database import db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect()
    yield
    await db.disconnect()


app = FastAPI(
    title="Video to Recipe API",
    description="Convert YouTube cooking videos into structured recipes",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS - allow frontend to call API
cors_origins = [
    "http://localhost:3000",
]

# Add production frontend URL from env
frontend_url = os.environ.get("FRONTEND_URL", "")
if frontend_url:
    cors_origins.append(frontend_url)

# Allow all Vercel preview deployments
cors_origins.append("https://*.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(recipes.router, prefix="/api/v1/recipes", tags=["recipes"])


@app.get("/")
async def root():
    return {"message": "Video to Recipe API", "docs": "/docs"}
