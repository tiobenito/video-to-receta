"""Pydantic models for saved recipe API."""

from datetime import datetime

from pydantic import BaseModel


class SavedRecipeCreate(BaseModel):
    recipeId: str | None = None
    sourceUrl: str | None = None
    sourceType: str = "video"  # "video" | "blog"
    title: str
    ingredients: str  # JSON string
    instructions: str  # JSON string
    prepTime: str | None = None
    cookTime: str | None = None
    servings: str | None = None
    tags: str | None = None  # JSON array of tag strings
    notes: str | None = None  # JSON array of note objects
    userEdits: str | None = None  # JSON of user overrides
    collectionIds: str | None = None  # JSON array of collection IDs


class SavedRecipeUpdate(BaseModel):
    title: str | None = None
    ingredients: str | None = None
    instructions: str | None = None
    prepTime: str | None = None
    cookTime: str | None = None
    servings: str | None = None
    tags: str | None = None
    notes: str | None = None
    userEdits: str | None = None
    collectionIds: str | None = None


class SavedRecipeResponse(BaseModel):
    id: str
    recipeId: str | None = None
    sourceUrl: str | None = None
    sourceType: str
    title: str
    ingredients: str
    instructions: str
    prepTime: str | None = None
    cookTime: str | None = None
    servings: str | None = None
    tags: str | None = None
    notes: str | None = None
    userEdits: str | None = None
    collectionIds: str | None = None
    notionPageId: str | None = None
    notionSynced: bool = False
    savedAt: datetime
    updatedAt: datetime
