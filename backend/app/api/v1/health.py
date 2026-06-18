"""Health check endpoint."""

import os
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter

router = APIRouter()

VERSION = "7"


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "video-to-recipe", "version": VERSION}


@router.get("/debug/blog")
async def debug_blog(url: str):
    """Debug: test ScraperAPI blog fetch directly."""
    key = os.environ.get("SCRAPERAPI_KEY")
    result = {"url": url, "scraperapi_key_set": bool(key)}

    if key:
        params = {"api_key": key, "url": url}
        fetch_url = f"https://api.scraperapi.com?{urlencode(params)}"
        result["fetch_url_prefix"] = fetch_url[:60] + "..."
    else:
        fetch_url = url

    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=60) as client:
            resp = await client.get(fetch_url, headers={"User-Agent": "Mozilla/5.0"})
            result["status_code"] = resp.status_code
            result["content_length"] = len(resp.text)
            result["body_preview"] = resp.text[:300]
    except Exception as e:
        result["error"] = str(e)

    return result
