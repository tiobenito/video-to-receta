"""Pydantic models for recipe API."""

from pydantic import BaseModel, HttpUrl


class Ingredient(BaseModel):
    amount: str
    item: str


class Instruction(BaseModel):
    step: int
    text: str


class ConvertRequest(BaseModel):
    url: HttpUrl


class RecipeResponse(BaseModel):
    id: str
    youtubeUrl: str
    videoId: str
    videoTitle: str | None = None
    channelName: str | None = None
    title: str
    ingredients: list[Ingredient]
    instructions: list[Instruction]
    prepTime: str | None = None
    cookTime: str | None = None
    servings: str | None = None
    cached: bool = False


class ErrorResponse(BaseModel):
    error: str
    detail: str | None = None
