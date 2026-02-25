"""Video platform detection and URL handling service.

Supports:
- YouTube (youtube.com, youtu.be)
- TikTok (tiktok.com, vm.tiktok.com)
"""

import logging
import re
from dataclasses import dataclass
from enum import Enum
from urllib.parse import parse_qs, urlparse

import httpx

logger = logging.getLogger(__name__)


class Platform(Enum):
    YOUTUBE = "youtube"
    TIKTOK = "tiktok"
    UNKNOWN = "unknown"


class VideoError(Exception):
    """Base exception for video service errors."""
    pass


class UnsupportedPlatformError(VideoError):
    """Platform not supported."""
    pass


class InvalidURLError(VideoError):
    """Could not parse the URL."""
    pass


@dataclass
class VideoInfo:
    """Extracted video information."""
    platform: Platform
    video_id: str
    original_url: str
    download_url: str  # URL to use for yt-dlp
    creator_username: str | None = None  # @username for TikTok, channel for YouTube
    creator_url: str | None = None  # Link to creator's profile


def detect_platform(url: str) -> Platform:
    """Detect which platform a URL belongs to."""
    url_lower = url.lower()

    if any(domain in url_lower for domain in ["youtube.com", "youtu.be"]):
        return Platform.YOUTUBE

    if any(domain in url_lower for domain in ["tiktok.com", "vm.tiktok.com"]):
        return Platform.TIKTOK

    return Platform.UNKNOWN


def extract_youtube_id(url: str) -> str:
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
        if "?" in video_id:
            video_id = video_id.split("?")[0]
        return video_id

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

    raise InvalidURLError(f"Could not extract YouTube video ID from: {url}")


def extract_tiktok_info(url: str) -> tuple[str, str | None]:
    """
    Extract video ID and username from TikTok URL formats.

    Supports:
    - https://www.tiktok.com/@user/video/1234567890
    - https://vm.tiktok.com/ABC123/
    - https://www.tiktok.com/t/ABC123/

    Returns:
        Tuple of (video_id, username or None)
    """
    parsed = urlparse(url)
    username = None

    # Extract username from /@username/video/ID format
    username_match = re.search(r"/@([^/]+)", parsed.path)
    if username_match:
        username = username_match.group(1)

    # Standard format: /@user/video/VIDEO_ID
    video_match = re.search(r"/video/(\d+)", parsed.path)
    if video_match:
        return video_match.group(1), username

    # Short URL format: vm.tiktok.com/CODE or tiktok.com/t/CODE
    # These redirect, so we use the full URL as the ID
    if "vm.tiktok.com" in url or "/t/" in parsed.path:
        # Extract the short code
        short_code = parsed.path.strip("/").split("/")[-1]
        if short_code:
            return f"short_{short_code}", username

    raise InvalidURLError(f"Could not extract TikTok video ID from: {url}")


def resolve_tiktok_short_url(url: str) -> str:
    """
    Resolve TikTok short URLs (vm.tiktok.com, /t/) to their canonical form
    by following HTTP redirects.

    TikTok short URLs redirect to the full /@user/video/ID format.
    Without resolving, yt-dlp can silently download the wrong video.

    Returns:
        Canonical URL, or original URL if resolution fails.
    """
    try:
        with httpx.Client(
            follow_redirects=True,
            timeout=10.0,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                ),
            },
        ) as client:
            response = client.head(url)
            resolved = str(response.url)
            if resolved != url:
                logger.info("Resolved TikTok short URL: %s -> %s", url, resolved)
            return resolved
    except Exception as e:
        logger.warning("Failed to resolve TikTok short URL %s: %s", url, e)
        return url


def extract_video_info(url: str) -> VideoInfo:
    """
    Extract video information from any supported platform URL.

    Returns:
        VideoInfo with platform, video_id, download URL, and creator info

    Raises:
        UnsupportedPlatformError: If platform not supported
        InvalidURLError: If URL cannot be parsed
    """
    platform = detect_platform(url)

    if platform == Platform.UNKNOWN:
        raise UnsupportedPlatformError(
            "URL no soportada. Por favor usa un enlace de YouTube o TikTok."
        )

    creator_username = None
    creator_url = None

    if platform == Platform.YOUTUBE:
        video_id = extract_youtube_id(url)
        download_url = f"https://www.youtube.com/watch?v={video_id}"
        # YouTube channel name requires API call, leave as None for now

    elif platform == Platform.TIKTOK:
        video_id, creator_username = extract_tiktok_info(url)
        download_url = url

        # Short URLs (vm.tiktok.com, /t/) rely on redirect chains that can
        # resolve to the wrong video. Resolve to canonical form first.
        if video_id.startswith("short_"):
            resolved_url = resolve_tiktok_short_url(url)
            if resolved_url != url:
                try:
                    video_id, resolved_username = extract_tiktok_info(resolved_url)
                    download_url = resolved_url
                    if resolved_username and not creator_username:
                        creator_username = resolved_username
                except InvalidURLError:
                    # Resolved URL isn't in a parseable format — still use it for download
                    download_url = resolved_url

        if creator_username:
            creator_url = f"https://www.tiktok.com/@{creator_username}"

    return VideoInfo(
        platform=platform,
        video_id=video_id,
        original_url=url,
        download_url=download_url,
        creator_username=creator_username,
        creator_url=creator_url,
    )


def detect_url_type(url: str) -> str:
    """
    Detect whether a URL is a video platform or a blog/website.

    Returns:
        "video" if YouTube or TikTok, "blog" otherwise
    """
    platform = detect_platform(url)
    return "video" if platform != Platform.UNKNOWN else "blog"


def get_platform_display_name(platform: Platform) -> str:
    """Get human-readable platform name."""
    return {
        Platform.YOUTUBE: "YouTube",
        Platform.TIKTOK: "TikTok",
        Platform.UNKNOWN: "Unknown",
    }.get(platform, "Unknown")
