"""YouTube transcript fetcher using youtube-transcript-api.

Used as the primary transcript source for YouTube videos on Railway,
where yt-dlp gets blocked by YouTube's bot detection.

If SCRAPERAPI_KEY is set, requests are routed through ScraperAPI's
residential proxy pool so Railway's datacenter IPs don't get blocked.
"""

import logging
import os

logger = logging.getLogger(__name__)


def _build_proxies() -> dict | None:
    """Return ScraperAPI proxy config if the key is configured, else None."""
    key = os.environ.get("SCRAPERAPI_KEY")
    if not key:
        return None
    proxy_url = f"http://scraperapi:{key}@proxy-server.scraperapi.com:8001"
    return {"http": proxy_url, "https": proxy_url}


def fetch_youtube_transcript(video_id: str) -> str | None:
    """
    Fetch YouTube auto-generated or manual captions via the transcript API.

    Routes through ScraperAPI if SCRAPERAPI_KEY is set (required on Railway
    where direct YouTube caption requests are IP-blocked).

    Returns the full transcript text, or None if captions are unavailable
    (so the caller can fall back to Whisper audio transcription).
    """
    try:
        from youtube_transcript_api import YouTubeTranscriptApi

        preferred_langs = ["es", "es-419", "es-MX", "es-US", "en", "en-US"]

        proxies = _build_proxies()
        api = YouTubeTranscriptApi(proxies=proxies) if proxies else YouTubeTranscriptApi()

        snippets = api.fetch(video_id, languages=preferred_langs)

        parts = []
        for snippet in snippets:
            text = snippet.text if hasattr(snippet, "text") else snippet.get("text", "")
            if text:
                parts.append(text)

        transcript = " ".join(parts).strip()
        if transcript:
            logger.info(
                "YouTube transcript fetched via API (%d chars, proxy=%s)",
                len(transcript),
                "scraperapi" if proxies else "direct",
            )
            return transcript
        return None

    except Exception as e:
        logger.info("YouTube transcript API unavailable (%s), will try Whisper", type(e).__name__)
        return None
