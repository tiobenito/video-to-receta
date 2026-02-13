"""Notion two-way sync service for BB Recipe Book.

Push: When a recipe is saved on the site → create in Notion
Pull: When recetario loads → import Notion recipes not yet on site
"""

import json
import logging
import re

from app.core.config import settings
from app.core.database import db

logger = logging.getLogger(__name__)

# Map app tags (Spanish) to Notion BB Recipe Book categories
TAG_TO_NOTION = {
    "entrada": "🫒 Appetizers",
    "plato-fuerte": "🍛 Main Dishes",
    "postre": "🍪 Desserts",
    "salsa": "🥫 Sauces",
    "bebida": "🧉 Drinks",
    "desayuno": "🍳 Breakfast",
    "snack": "🫒 Appetizers",
    "sopa": "🍛 Main Dishes",
    "ensalada": "🥗 Salads",
    "guarnicion": "Side Dish",
    "pan": "Bread",
    "masa": "Bread",
    "mexicana": "Mexican",
    "italiana": "🍛 Main Dishes",
    "asiatica": "Asian",
    "americana": "🍛 Main Dishes",
    "francesa": "🍛 Main Dishes",
    "mediterranea": "🍛 Main Dishes",
    "vegetariana": "Vegetarian",
    "vegana": "Vegetarian",
}

# Reverse map: Notion category → best-fit app tag
NOTION_TO_TAG: dict[str, str] = {
    "🫒 Appetizers": "entrada",
    "🍛 Main Dishes": "plato-fuerte",
    "🍪 Desserts": "postre",
    "🥫 Sauces": "salsa",
    "🧉 Drinks": "bebida",
    "🍳 Breakfast": "desayuno",
    "🥗 Salads": "ensalada",
    "Side Dish": "guarnicion",
    "Bread": "pan",
    "Mexican": "mexicana",
    "Asian": "asiatica",
    "Vegetarian": "vegetariana",
}


NOTION_API_VERSION = "2022-06-28"


def _notion_headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {settings.notion_api_key}",
        "Notion-Version": NOTION_API_VERSION,
        "Content-Type": "application/json",
    }


def _is_configured() -> bool:
    return bool(settings.notion_api_key and settings.notion_database_id)


# ---------------------------------------------------------------------------
# PUSH: Site → Notion
# ---------------------------------------------------------------------------

async def sync_to_notion(saved_recipe_id: str) -> None:
    """
    Push a saved recipe to the Notion BB Recipe Book database.

    Fire-and-forget: on success updates notionPageId, on failure logs and moves on.
    """
    if not _is_configured():
        return

    try:
        import httpx

        recipe = await db.savedrecipe.find_unique(where={"id": saved_recipe_id})
        if not recipe:
            logger.warning(f"Notion push: recipe {saved_recipe_id} not found")
            return

        # Parse stored JSON fields
        ingredients = json.loads(recipe.ingredients) if recipe.ingredients else []
        tags = json.loads(recipe.tags) if recipe.tags else []

        # Map tags to Notion categories (deduplicated)
        categories = list({TAG_TO_NOTION[t] for t in tags if t in TAG_TO_NOTION})

        # Format ingredients as comma-separated list
        ingredient_text = ", ".join(
            f"{ing.get('amount', '')} {ing.get('item', '')}".strip()
            for ing in ingredients
        )

        servings_num = _parse_servings(recipe.servings)
        cooking_time = recipe.cookTime or recipe.prepTime or ""

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.notion.com/v1/pages",
                headers=_notion_headers(),
                json={
                    "parent": {"database_id": settings.notion_database_id},
                    "properties": _build_notion_properties(
                        title=recipe.title,
                        categories=categories,
                        cooking_time=cooking_time,
                        ingredient_text=ingredient_text,
                        source_url=recipe.sourceUrl,
                        servings=servings_num,
                    ),
                },
            )
            resp.raise_for_status()
            page = resp.json()

        await db.savedrecipe.update(
            where={"id": saved_recipe_id},
            data={"notionPageId": page["id"], "notionSynced": True},
        )
        logger.info(f"Pushed recipe '{recipe.title}' to Notion: {page['id']}")

    except Exception as e:
        logger.error(f"Notion push failed for recipe {saved_recipe_id}: {e}")


# ---------------------------------------------------------------------------
# PULL: Notion → Site
# ---------------------------------------------------------------------------

async def pull_from_notion() -> int:
    """
    Pull recipes from the Notion BB Recipe Book that don't exist on the site yet.

    Returns the number of new recipes imported.
    """
    if not _is_configured():
        return 0

    try:
        import httpx

        # Get all Notion page IDs we already track
        existing = await db.savedrecipe.find_many(
            where={"notionPageId": {"not": None}},
        )
        known_page_ids = {r.notionPageId for r in existing}

        # Query the full Notion database
        imported = 0
        has_more = True
        start_cursor = None

        async with httpx.AsyncClient() as client:
            while has_more:
                body: dict = {"page_size": 100}
                if start_cursor:
                    body["start_cursor"] = start_cursor

                resp = await client.post(
                    f"https://api.notion.com/v1/databases/{settings.notion_database_id}/query",
                    headers=_notion_headers(),
                    json=body,
                )
                resp.raise_for_status()
                result = resp.json()

                has_more = result.get("has_more", False)
                start_cursor = result.get("next_cursor")

                for page in result.get("results", []):
                    page_id = page["id"]
                    if page_id in known_page_ids:
                        continue

                    # Parse Notion page into a SavedRecipe
                    recipe_data = _notion_page_to_recipe(page)
                    if not recipe_data:
                        continue

                    await db.savedrecipe.create(data=recipe_data)
                    imported += 1
                    logger.info(f"Pulled recipe '{recipe_data['title']}' from Notion: {page_id}")

        return imported

    except Exception as e:
        logger.error(f"Notion pull failed: {e}")
        return 0


def _notion_page_to_recipe(page: dict) -> dict | None:
    """Convert a Notion database page to a SavedRecipe create dict."""
    props = page.get("properties", {})

    # Title (required)
    title = _get_notion_title(props.get("Name", {}))
    if not title:
        return None

    # Ingredients — stored as rich_text in Notion
    ingredient_text = _get_notion_rich_text(props.get("Ingredients", {}))
    ingredients = _parse_ingredient_text(ingredient_text) if ingredient_text else []

    # Categories → tags
    categories = _get_notion_multi_select(props.get("Category", {}))
    tags = [NOTION_TO_TAG[cat] for cat in categories if cat in NOTION_TO_TAG]

    # Source URL
    source_url = _get_notion_url(props.get("Link", {}))

    # Cooking time
    cooking_time = _get_notion_rich_text(props.get("Cooking Time", {}))

    # Servings
    servings_num = _get_notion_number(props.get("Servings", {}))
    servings = f"{servings_num} porciones" if servings_num else None

    return {
        "recipeId": None,
        "sourceUrl": source_url,
        "sourceType": "blog",  # Notion-sourced recipes are effectively manual/blog
        "title": title,
        "ingredients": json.dumps(ingredients),
        "instructions": json.dumps([]),  # Notion DB doesn't store instructions
        "prepTime": None,
        "cookTime": cooking_time or None,
        "servings": servings,
        "tags": json.dumps(tags) if tags else None,
        "notes": None,
        "userEdits": None,
        "collectionIds": None,
        "notionPageId": page["id"],
        "notionSynced": True,
    }


# ---------------------------------------------------------------------------
# Notion property helpers
# ---------------------------------------------------------------------------

def _build_notion_properties(
    title: str,
    categories: list[str],
    cooking_time: str,
    ingredient_text: str,
    source_url: str | None,
    servings: int | None,
) -> dict:
    """Build the properties dict for a Notion page create."""
    props: dict = {
        "Name": {"title": [{"text": {"content": title}}]},
        "Category": {"multi_select": [{"name": c} for c in categories]} if categories else {"multi_select": []},
        "Attempted?": {"select": {"name": "No"}},
    }
    if cooking_time:
        props["Cooking Time"] = {"rich_text": [{"text": {"content": cooking_time}}]}
    if ingredient_text:
        props["Ingredients"] = {"rich_text": [{"text": {"content": ingredient_text[:2000]}}]}
    if source_url:
        props["Link"] = {"url": source_url}
    if servings is not None:
        props["Servings"] = {"number": servings}
    return props


def _get_notion_title(prop: dict) -> str | None:
    title_arr = prop.get("title", [])
    if title_arr:
        return title_arr[0].get("plain_text", "").strip() or None
    return None


def _get_notion_rich_text(prop: dict) -> str | None:
    rt = prop.get("rich_text", [])
    if rt:
        return "".join(t.get("plain_text", "") for t in rt).strip() or None
    return None


def _get_notion_multi_select(prop: dict) -> list[str]:
    return [item.get("name", "") for item in prop.get("multi_select", [])]


def _get_notion_url(prop: dict) -> str | None:
    return prop.get("url")


def _get_notion_number(prop: dict) -> int | None:
    val = prop.get("number")
    return int(val) if val is not None else None


def _parse_ingredient_text(text: str) -> list[dict]:
    """Parse a comma-separated or newline-separated ingredient string into structured list."""
    # Split by commas or newlines
    items = re.split(r"[,\n]", text)
    ingredients = []
    for item in items:
        item = item.strip()
        if not item:
            continue
        # Try to split amount from item
        match = re.match(r"^([\d½⅓⅔¼¾/.\s]+(?:cups?|tbsp|tsp|oz|g|kg|ml|l|lb|pcs?|cdas?|cdtas?)?)\s+(.+)", item, re.IGNORECASE)
        if match:
            ingredients.append({"amount": match.group(1).strip(), "item": match.group(2).strip()})
        else:
            ingredients.append({"amount": "", "item": item})
    return ingredients


def _parse_servings(servings: str | None) -> int | None:
    """Extract a number from a servings string like '4 porciones' or '6'."""
    if not servings:
        return None
    match = re.search(r"\d+", servings)
    return int(match.group()) if match else None
