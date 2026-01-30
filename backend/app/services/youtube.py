"""YouTube transcript extraction service."""

import re
from xml.etree.ElementTree import ParseError
from urllib.parse import parse_qs, urlparse

from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    NoTranscriptFound,
    TranscriptsDisabled,
    VideoUnavailable,
)


class YouTubeError(Exception):
    """Base exception for YouTube service errors."""

    pass


class VideoNotFoundError(YouTubeError):
    """Video not found or unavailable."""

    pass


class TranscriptNotAvailableError(YouTubeError):
    """No transcript available for this video."""

    pass


def extract_video_id(url: str) -> str:
    """
    Extract video ID from various YouTube URL formats.

    Supports:
    - https://www.youtube.com/watch?v=VIDEO_ID
    - https://youtu.be/VIDEO_ID
    - https://www.youtube.com/embed/VIDEO_ID
    - https://www.youtube.com/v/VIDEO_ID
    - https://www.youtube.com/shorts/VIDEO_ID
    """
    # Handle youtu.be short links
    if "youtu.be" in url:
        parsed = urlparse(url)
        video_id = parsed.path.lstrip("/")
        # Remove any query params from the video ID
        if "?" in video_id:
            video_id = video_id.split("?")[0]
        return video_id

    # Handle youtube.com URLs
    parsed = urlparse(url)

    # /watch?v=VIDEO_ID format
    if "watch" in parsed.path:
        query_params = parse_qs(parsed.query)
        if "v" in query_params:
            return query_params["v"][0]

    # /embed/VIDEO_ID, /v/VIDEO_ID, /shorts/VIDEO_ID format
    path_patterns = [
        r"/embed/([a-zA-Z0-9_-]{11})",
        r"/v/([a-zA-Z0-9_-]{11})",
        r"/shorts/([a-zA-Z0-9_-]{11})",
    ]
    for pattern in path_patterns:
        match = re.search(pattern, parsed.path)
        if match:
            return match.group(1)

    raise YouTubeError(f"Could not extract video ID from URL: {url}")


def get_transcript(video_id: str) -> str:
    """
    Fetch transcript for a YouTube video.

    Args:
        video_id: YouTube video ID

    Returns:
        Full transcript as a single string

    Raises:
        VideoNotFoundError: If video doesn't exist
        TranscriptNotAvailableError: If no transcript is available
    """
    try:
        # youtube-transcript-api v1.x API
        ytt_api = YouTubeTranscriptApi()
        transcript = ytt_api.fetch(video_id)

        # Combine all transcript segments into one string
        # v1.x uses .text attribute instead of ['text']
        full_transcript = " ".join(segment.text for segment in transcript)

        return full_transcript

    except VideoUnavailable:
        raise VideoNotFoundError(f"Video {video_id} is unavailable or doesn't exist")

    except (NoTranscriptFound, TranscriptsDisabled):
        raise TranscriptNotAvailableError(
            f"No transcript available for video {video_id}. "
            "The video may not have captions enabled."
        )

    except ParseError:
        raise TranscriptNotAvailableError(
            f"Could not parse transcript for video {video_id}. "
            "YouTube may have returned an invalid response. Try again."
        )

    except Exception as e:
        raise YouTubeError(f"Failed to fetch transcript: {str(e)}")


def get_video_info(video_id: str) -> dict:
    """
    Get basic video metadata.

    Note: For MVP, we're just returning the video ID.
    Full metadata would require YouTube Data API.
    """
    return {
        "video_id": video_id,
        "title": None,  # Would need YouTube Data API
        "channel": None,  # Would need YouTube Data API
    }
