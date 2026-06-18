"""Health check endpoint."""

import os

from fastapi import APIRouter

router = APIRouter()

VERSION = "2"


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "video-to-recipe",
        "version": VERSION,
        "scraperapi_key_set": bool(os.environ.get("SCRAPERAPI_KEY")),
    }
