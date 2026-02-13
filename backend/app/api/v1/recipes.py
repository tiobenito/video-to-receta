"""Recipe conversion endpoints.

Supports:
- YouTube videos
- TikTok videos
- Blog/recipe website URLs
"""

import json

from fastapi import APIRouter, HTTPException

from app.core.database import db
from app.models.recipe import ConvertRequest, ErrorResponse, RecipeResponse
from app.services.recipe_parser import RecipeParseError, parse_recipe
from app.services.whisper import WhisperError, transcribe_from_url
from app.services.video_platform import (
    VideoError,
    UnsupportedPlatformError,
    InvalidURLError,
    extract_video_info,
    Platform,
    detect_url_type,
)
from app.services.blog_scraper import BlogScrapeError, extract_recipe_from_blog

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
    If the recipe has been converted before, returns the cached version.
    """
    url = str(request.url)
    url_type = detect_url_type(url)

    # Check cache first (using youtubeUrl field for all platforms for backwards compat)
    existing = await db.recipe.find_unique(where={"youtubeUrl": url})
    if existing:
        # Increment access count
        await db.recipe.update(
            where={"id": existing.id},
            data={"accessCount": existing.accessCount + 1},
        )
        return RecipeResponse(
            id=existing.id,
            youtubeUrl=existing.youtubeUrl,
            videoId=existing.videoId,
            videoTitle=existing.videoTitle,
            channelName=existing.channelName,
            creatorUsername=getattr(existing, "creatorUsername", None),
            creatorUrl=getattr(existing, "creatorUrl", None),
            platform=getattr(existing, "platform", None),
            title=existing.title,
            ingredients=json.loads(existing.ingredients),
            instructions=json.loads(existing.instructions),
            prepTime=existing.prepTime,
            cookTime=existing.cookTime,
            servings=existing.servings,
            cached=True,
        )

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

    # Generate a stable video_id from the URL for caching
    from hashlib import md5
    video_id = f"blog_{md5(url.encode()).hexdigest()[:12]}"

    recipe = await db.recipe.create(
        data={
            "youtubeUrl": url,
            "videoId": video_id,
            "platform": "blog",
            "title": recipe_data["title"],
            "ingredients": json.dumps(recipe_data["ingredients"]),
            "instructions": json.dumps(recipe_data["instructions"]),
            "prepTime": recipe_data.get("prepTime"),
            "cookTime": recipe_data.get("cookTime"),
            "servings": recipe_data.get("servings"),
        }
    )

    return RecipeResponse(
        id=recipe.id,
        youtubeUrl=url,
        videoId=video_id,
        platform="blog",
        title=recipe.title,
        ingredients=recipe_data["ingredients"],
        instructions=recipe_data["instructions"],
        prepTime=recipe.prepTime,
        cookTime=recipe.cookTime,
        servings=recipe.servings,
        tags=recipe_data.get("tags", []),
        cached=False,
    )


async def _convert_video(url: str) -> RecipeResponse:
    """Extract a recipe from a video URL (YouTube/TikTok)."""
    # Extract video info (platform, video_id, download URL)
    try:
        video_info = extract_video_info(url)
    except UnsupportedPlatformError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except InvalidURLError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except VideoError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Transcribe with Whisper
    try:
        transcript = transcribe_from_url(video_info.download_url, video_info.video_id)
    except WhisperError as e:
        raise HTTPException(
            status_code=422,
            detail=str(e),
        )

    # Parse recipe from transcript
    try:
        recipe_data = await parse_recipe(transcript)
    except RecipeParseError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Save to database (using youtubeUrl field for all platforms for backwards compat)
    recipe = await db.recipe.create(
        data={
            "youtubeUrl": url,
            "videoId": video_info.video_id,
            "creatorUsername": video_info.creator_username,
            "creatorUrl": video_info.creator_url,
            "platform": video_info.platform.value,
            "transcript": transcript,
            "title": recipe_data["title"],
            "ingredients": json.dumps(recipe_data["ingredients"]),
            "instructions": json.dumps(recipe_data["instructions"]),
            "prepTime": recipe_data.get("prepTime"),
            "cookTime": recipe_data.get("cookTime"),
            "servings": recipe_data.get("servings"),
        }
    )

    return RecipeResponse(
        id=recipe.id,
        youtubeUrl=recipe.youtubeUrl,
        videoId=recipe.videoId,
        videoTitle=recipe.videoTitle,
        channelName=recipe.channelName,
        creatorUsername=video_info.creator_username,
        creatorUrl=video_info.creator_url,
        platform=video_info.platform.value,
        title=recipe.title,
        ingredients=recipe_data["ingredients"],
        instructions=recipe_data["instructions"],
        prepTime=recipe.prepTime,
        cookTime=recipe.cookTime,
        servings=recipe.servings,
        tags=recipe_data.get("tags", []),
        cached=False,
    )


@router.get(
    "/{recipe_id}",
    response_model=RecipeResponse,
    responses={404: {"model": ErrorResponse, "description": "Recipe not found"}},
)
async def get_recipe(recipe_id: str):
    """Get a cached recipe by ID."""
    recipe = await db.recipe.find_unique(where={"id": recipe_id})

    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    return RecipeResponse(
        id=recipe.id,
        youtubeUrl=recipe.youtubeUrl,
        videoId=recipe.videoId,
        videoTitle=recipe.videoTitle,
        channelName=recipe.channelName,
        creatorUsername=getattr(recipe, "creatorUsername", None),
        creatorUrl=getattr(recipe, "creatorUrl", None),
        platform=getattr(recipe, "platform", None),
        title=recipe.title,
        ingredients=json.loads(recipe.ingredients),
        instructions=json.loads(recipe.instructions),
        prepTime=recipe.prepTime,
        cookTime=recipe.cookTime,
        servings=recipe.servings,
        cached=True,
    )
