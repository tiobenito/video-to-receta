"""Recipe conversion endpoints.

Supports:
- YouTube videos
- TikTok videos
- Blog/recipe website URLs
"""

import logging
import uuid
from hashlib import md5

from fastapi import APIRouter, HTTPException

from app.models.recipe import ConvertRequest, ErrorResponse, RecipeResponse
from app.services.blog_scraper import BlogScrapeError, extract_recipe_from_blog
from app.services.recipe_parser import RecipeParseError, parse_recipe
from app.services.video_platform import (
    InvalidURLError,
    Platform,
    UnsupportedPlatformError,
    VideoError,
    detect_url_type,
    extract_video_info,
)
from app.services.whisper import WhisperError, transcribe_from_url

logger = logging.getLogger(__name__)

# Minimum transcript length (chars) to consider useful for recipe extraction.
# Below this, the audio is likely music/silence and Claude will hallucinate.
MIN_TRANSCRIPT_LENGTH = 50

router = APIRouter()


@router.post(
    "/convert",
    response_model=RecipeResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid URL or video not found"},
        422: {"model": ErrorResponse, "description": "Could not extract recipe"},
        500: {"model": ErrorResponse, "description": "Server error"},
    },
)
async def convert_video_to_recipe(request: ConvertRequest):
    """
    Convert a cooking video or blog URL to a structured recipe.

    Supports:
    - YouTube videos (youtube.com, youtu.be)
    - TikTok videos (tiktok.com, vm.tiktok.com)
    - Blog/recipe websites (allrecipes.com, etc.)

    For videos: Uses Whisper for transcription, then Claude to extract the recipe.
    For blogs: Uses recipe-scrapers for structured data, falls back to Claude.
    """
    url = str(request.url)
    url_type = detect_url_type(url)

    if url_type == "blog":
        return await _convert_blog(url)

    return await _convert_video(url)


async def _convert_blog(url: str) -> RecipeResponse:
    """Extract a recipe from a blog URL."""
    try:
        recipe_data = await extract_recipe_from_blog(url)
    except BlogScrapeError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RecipeParseError as e:
        raise HTTPException(status_code=422, detail=str(e))

    video_id = f"blog_{md5(url.encode()).hexdigest()[:12]}"

    return RecipeResponse(
        id=str(uuid.uuid4()),
        youtubeUrl=url,
        videoId=video_id,
        platform="blog",
        title=recipe_data["title"],
        ingredients=recipe_data["ingredients"],
        instructions=recipe_data["instructions"],
        prepTime=recipe_data.get("prepTime"),
        cookTime=recipe_data.get("cookTime"),
        servings=recipe_data.get("servings"),
        tags=recipe_data.get("tags", []),
        cached=False,
    )


async def _convert_video(url: str) -> RecipeResponse:
    """Extract a recipe from a video URL (YouTube/TikTok)."""
    try:
        video_info = extract_video_info(url)
    except UnsupportedPlatformError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except InvalidURLError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except VideoError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # TikTok: try page scraping first. Many TikTok cooking videos are
    # visual-only (music + cuts, no narration), so Whisper produces garbage
    # and Claude hallucinates a recipe. The page description often has the
    # actual recipe text.
    if video_info.platform == Platform.TIKTOK:
        try:
            recipe_data = await extract_recipe_from_blog(url)
            # Only accept if we got actual content — TikTok pages are JS-heavy
            # so the scraper often returns empty/garbage that Claude can't use.
            if recipe_data.get("ingredients") and recipe_data.get("instructions"):
                logger.info("TikTok recipe extracted via page scraping (skipped audio)")
                return _build_response(url, video_info, recipe_data)
            logger.info("TikTok page scraping returned empty recipe, falling back to audio")
        except (BlogScrapeError, RecipeParseError):
            logger.info("TikTok page scraping failed, falling back to audio transcription")

    # Audio transcription pipeline (primary for YouTube, fallback for TikTok)
    try:
        transcript = transcribe_from_url(video_info.download_url, video_info.video_id)
    except WhisperError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Guard against garbage transcripts (music-only videos, background noise).
    # Without this, Claude hallucinates a recipe from nonsense text.
    if len(transcript.strip()) < MIN_TRANSCRIPT_LENGTH:
        logger.warning(
            "Transcript too short (%d chars) for %s — likely no narration",
            len(transcript.strip()),
            url,
        )
        raise HTTPException(
            status_code=422,
            detail=(
                "El video no contiene suficiente narración para extraer una receta. "
                "Intenta con un video donde el chef explique los pasos."
            ),
        )

    # Parse recipe from transcript
    try:
        recipe_data = await parse_recipe(transcript)
    except RecipeParseError as e:
        raise HTTPException(status_code=422, detail=str(e))

    return _build_response(url, video_info, recipe_data)


def _build_response(url: str, video_info, recipe_data: dict) -> RecipeResponse:
    """Build a RecipeResponse from video info and parsed recipe data."""
    return RecipeResponse(
        id=str(uuid.uuid4()),
        youtubeUrl=url,
        videoId=video_info.video_id,
        creatorUsername=video_info.creator_username,
        creatorUrl=video_info.creator_url,
        platform=video_info.platform.value,
        title=recipe_data["title"],
        ingredients=recipe_data["ingredients"],
        instructions=recipe_data["instructions"],
        prepTime=recipe_data.get("prepTime"),
        cookTime=recipe_data.get("cookTime"),
        servings=recipe_data.get("servings"),
        tags=recipe_data.get("tags", []),
        cached=False,
    )
