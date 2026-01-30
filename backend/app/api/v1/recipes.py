"""Recipe conversion endpoints."""

import json

from fastapi import APIRouter, HTTPException

from app.core.database import db
from app.models.recipe import ConvertRequest, ErrorResponse, RecipeResponse
from app.services.recipe_parser import RecipeParseError, parse_recipe
from app.services.whisper import WhisperError, transcribe_video
from app.services.youtube import (
    YouTubeError,
    extract_video_id,
)

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
    Convert a YouTube cooking video URL to a structured recipe.

    Uses Whisper for accurate transcription, then Claude to extract the recipe.
    If the recipe has been converted before, returns the cached version.
    """
    url = str(request.url)

    # Check cache first
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
            title=existing.title,
            ingredients=json.loads(existing.ingredients),
            instructions=json.loads(existing.instructions),
            prepTime=existing.prepTime,
            cookTime=existing.cookTime,
            servings=existing.servings,
            cached=True,
        )

    # Extract video ID
    try:
        video_id = extract_video_id(url)
    except YouTubeError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Transcribe with Whisper (primary method)
    try:
        transcript = transcribe_video(video_id)
    except WhisperError as e:
        raise HTTPException(
            status_code=422,
            detail=f"Transcription failed: {str(e)}",
        )

    # Parse recipe from transcript
    try:
        recipe_data = await parse_recipe(transcript)
    except RecipeParseError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Save to database
    recipe = await db.recipe.create(
        data={
            "youtubeUrl": url,
            "videoId": video_id,
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
        title=recipe.title,
        ingredients=recipe_data["ingredients"],
        instructions=recipe_data["instructions"],
        prepTime=recipe.prepTime,
        cookTime=recipe.cookTime,
        servings=recipe.servings,
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
        title=recipe.title,
        ingredients=json.loads(recipe.ingredients),
        instructions=json.loads(recipe.instructions),
        prepTime=recipe.prepTime,
        cookTime=recipe.cookTime,
        servings=recipe.servings,
        cached=True,
    )
