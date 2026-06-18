"""YouTube transcript fetcher using youtube-transcript-api.

Used as the primary transcript source for YouTube videos on Railway,
where yt-dlp gets blocked by YouTube's bot detection.

If SCRAPERAPI_KEY is set, requests are routed through ScraperAPI's
residential proxy pool so Railway's datacenter IPs don't get blocked.
ScraperAPI acts as an HTTPS-intercepting proxy, so we use a custom
requests session with verify=False to avoid SSL certificate errors.
"""

import logging
import os
import warnings

logger = logging.getLogger(__name__)


def _build_http_client(key: str):
    """Return a requests Session configured for ScraperAPI proxy."""
    import requests
    from urllib3.exceptions import InsecureRequestWarning

    proxy_url = f"http://scraperapi:{key}@proxy-server.scraperapi.com:8001"
    session = requests.Session()
    session.proxies = {"http": proxy_url, "https": proxy_url}
    # ScraperAPI intercepts HTTPS and presents its own cert — verification
    # must be disabled for the proxy to work.
    session.verify = False
    warnings.filterwarnings("ignore", category=InsecureRequestWarning)
    return session


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

        key = os.environ.get("SCRAPERAPI_KEY")
        using_proxy = bool(key)

        if key:
            http_client = _build_http_client(key)
            api = YouTubeTranscriptApi(http_client=http_client)
        else:
            api = YouTubeTranscriptApi()

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
                "scraperapi" if using_proxy else "direct",
            )
            return transcript
        return None

    except Exception as e:
        logger.warning(
            "YouTube transcript API failed (%s): %s — falling back to Whisper",
            type(e).__name__,
            str(e)[:500],
        )
        return None
