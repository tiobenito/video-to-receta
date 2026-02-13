"""Saved recipe CRUD endpoints — backed by Notion as primary database."""

from fastapi import APIRouter, HTTPException

from app.models.saved_recipe import (
    SavedRecipeCreate,
    SavedRecipeResponse,
    SavedRecipeUpdate,
)
from app.services import notion_db

router = APIRouter()


@router.get("", response_model=list[SavedRecipeResponse])
async def list_saved_recipes():
    """List all saved recipes from Notion, newest first."""
    return await notion_db.list_recipes()


@router.get("/{recipe_id}", response_model=SavedRecipeResponse)
async def get_saved_recipe(recipe_id: str):
    """Get a single saved recipe by Notion page ID."""
    recipe = await notion_db.get_recipe(recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Saved recipe not found")
    return recipe


@router.post("", response_model=SavedRecipeResponse, status_code=201)
async def create_saved_recipe(data: SavedRecipeCreate):
    """Save a recipe to Notion."""
    return await notion_db.create_recipe(data.model_dump())


@router.put("/{recipe_id}", response_model=SavedRecipeResponse)
async def update_saved_recipe(recipe_id: str, data: SavedRecipeUpdate):
    """Update a saved recipe in Notion."""
    result = await notion_db.update_recipe(recipe_id, data.model_dump(exclude_unset=True))
    if not result:
        raise HTTPException(status_code=404, detail="Saved recipe not found")
    return result


@router.delete("/{recipe_id}", status_code=204)
async def delete_saved_recipe(recipe_id: str):
    """Archive a recipe in Notion (soft delete)."""
    await notion_db.delete_recipe(recipe_id)
