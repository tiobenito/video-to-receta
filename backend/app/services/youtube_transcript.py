"""YouTube transcript fetcher using youtube-transcript-api.

Used as the primary transcript source for YouTube videos on Railway,
where yt-dlp gets blocked by YouTube's bot detection.
"""

import logging

logger = logging.getLogger(__name__)


def fetch_youtube_transcript(video_id: str) -> str | None:
    """
    Fetch YouTube auto-generated or manual captions via the transcript API.

    Returns the full transcript text, or None if captions are unavailable
    (so the caller can fall back to Whisper audio transcription).

    Args:
        video_id: YouTube video ID (e.g. 'd4N-r3eeWDk')

    Returns:
        Transcript as a single string, or None if unavailable
    """
    try:
        from youtube_transcript_api import YouTubeTranscriptApi

        # Try Spanish first (matching the app's language), then English, then any
        preferred_langs = ["es", "es-419", "es-MX", "es-US", "en", "en-US"]

        api = YouTubeTranscriptApi()
        snippets = api.fetch(video_id, languages=preferred_langs)

        # v1.x returns TranscriptSnippet objects with .text attribute
        parts = []
        for snippet in snippets:
            text = snippet.text if hasattr(snippet, "text") else snippet.get("text", "")
            if text:
                parts.append(text)

        transcript = " ".join(parts).strip()
        if transcript:
            logger.info("YouTube transcript fetched via API (%d chars)", len(transcript))
            return transcript
        return None

    except Exception as e:
        # Broad catch — any failure (TranscriptsDisabled, NoTranscriptFound,
        # VideoUnavailable, network error) should fall back to Whisper
        logger.info("YouTube transcript API unavailable (%s), will try Whisper", type(e).__name__)
        return None
