"""Health check endpoint."""

import os

from fastapi import APIRouter

router = APIRouter()

VERSION = "6"


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "video-to-recipe",
        "version": VERSION,
        "scraperapi_key_set": bool(os.environ.get("SCRAPERAPI_KEY")),
    }


@router.get("/debug/transcript/{video_id}")
async def debug_transcript(video_id: str):
    """Debug: test youtube-transcript-api directly and return error details."""
    import traceback

    key = os.environ.get("SCRAPERAPI_KEY")
    result = {"video_id": video_id, "scraperapi_key_set": bool(key)}

    try:
        from youtube_transcript_api import YouTubeTranscriptApi

        http_client = None
        if key:
            import requests
            import warnings
            from urllib3.exceptions import InsecureRequestWarning
            proxy_url = f"http://scraperapi:{key}@proxy-server.scraperapi.com:8001"
            result["proxy_url_prefix"] = proxy_url[:40] + "..."
            http_client = requests.Session()
            http_client.proxies = {"http": proxy_url, "https": proxy_url}
            http_client.verify = False
            warnings.filterwarnings("ignore", category=InsecureRequestWarning)

        api = YouTubeTranscriptApi(http_client=http_client)
        snippets = api.fetch(video_id, languages=["es", "es-419", "en", "en-US"])
        parts = [s.text if hasattr(s, "text") else s.get("text", "") for s in snippets]
        transcript = " ".join(p for p in parts if p).strip()
        result["success"] = True
        result["transcript_length"] = len(transcript)
        result["transcript_preview"] = transcript[:200]
    except Exception as e:
        result["success"] = False
        result["error_type"] = type(e).__name__
        result["error_message"] = str(e)[:1000]
        result["traceback"] = traceback.format_exc()[-2000:]

    return result
