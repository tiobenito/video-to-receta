"""Pydantic models for recipe API."""

from pydantic import BaseModel, HttpUrl, field_validator


class Ingredient(BaseModel):
    amount: str = ""
    item: str

    @field_validator("amount", mode="before")
    @classmethod
    def convert_none_to_empty(cls, v):
        """Convert None to empty string for ingredients without amounts."""
        return "" if v is None else str(v)


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
    creatorUsername: str | None = None
    creatorUrl: str | None = None
    platform: str | None = None  # "youtube" or "tiktok"
    title: str
    ingredients: list[Ingredient]
    instructions: list[Instruction]
    prepTime: str | None = None
    cookTime: str | None = None
    servings: str | None = None
    tags: list[str] = []  # AI-suggested tags
    cached: bool = False


class ErrorResponse(BaseModel):
    error: str
    detail: str | None = None
