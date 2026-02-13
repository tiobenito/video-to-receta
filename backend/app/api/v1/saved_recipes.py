"""Saved recipe CRUD endpoints."""

import asyncio

from fastapi import APIRouter, HTTPException

from app.core.database import db
from app.models.saved_recipe import (
    SavedRecipeCreate,
    SavedRecipeResponse,
    SavedRecipeUpdate,
)
from app.services.notion_sync import sync_to_notion, pull_from_notion

router = APIRouter()


@router.post("/sync-notion")
async def sync_notion_recipes():
    """Pull new recipes from the Notion BB Recipe Book into the site."""
    imported = await pull_from_notion()
    return {"imported": imported}


@router.get("", response_model=list[SavedRecipeResponse])
async def list_saved_recipes():
    """List all saved recipes, newest first."""
    recipes = await db.savedrecipe.find_many(order={"savedAt": "desc"})
    return [SavedRecipeResponse(**r.model_dump()) for r in recipes]


@router.get("/{recipe_id}", response_model=SavedRecipeResponse)
async def get_saved_recipe(recipe_id: str):
    """Get a single saved recipe by ID."""
    recipe = await db.savedrecipe.find_unique(where={"id": recipe_id})
    if not recipe:
        raise HTTPException(status_code=404, detail="Saved recipe not found")
    return SavedRecipeResponse(**recipe.model_dump())


@router.post("", response_model=SavedRecipeResponse, status_code=201)
async def create_saved_recipe(data: SavedRecipeCreate):
    """Save a recipe."""
    recipe = await db.savedrecipe.create(data=data.model_dump())

    # Fire-and-forget Notion sync
    asyncio.create_task(sync_to_notion(recipe.id))

    return SavedRecipeResponse(**recipe.model_dump())


@router.put("/{recipe_id}", response_model=SavedRecipeResponse)
async def update_saved_recipe(recipe_id: str, data: SavedRecipeUpdate):
    """Update a saved recipe (tags, notes, edits, etc.)."""
    existing = await db.savedrecipe.find_unique(where={"id": recipe_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Saved recipe not found")

    # Only update fields that were explicitly provided
    update_data = data.model_dump(exclude_unset=True)
    recipe = await db.savedrecipe.update(
        where={"id": recipe_id},
        data=update_data,
    )
    return SavedRecipeResponse(**recipe.model_dump())


@router.delete("/{recipe_id}", status_code=204)
async def delete_saved_recipe(recipe_id: str):
    """Delete a saved recipe."""
    existing = await db.savedrecipe.find_unique(where={"id": recipe_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Saved recipe not found")

    await db.savedrecipe.delete(where={"id": recipe_id})
