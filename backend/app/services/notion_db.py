"""Notion as primary database for saved recipes (BB Recipe Book).

All CRUD operations go directly to the Notion API.
App-specific data (instructions, notes, etc.) is stored as a JSON code block
in the page body, keeping the Notion DB clean for human browsing.
"""

import json
import logging
import re

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

NOTION_API_VERSION = "2022-06-28"
NOTION_BASE = "https://api.notion.com/v1"

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


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {settings.notion_api_key}",
        "Notion-Version": NOTION_API_VERSION,
        "Content-Type": "application/json",
    }


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------

async def list_recipes() -> list[dict]:
    """Query all recipes from the Notion BB Recipe Book, newest first."""
    recipes: list[dict] = []
    has_more = True
    start_cursor = None

    async with httpx.AsyncClient(timeout=30) as client:
        while has_more:
            body: dict = {
                "page_size": 100,
                "sorts": [{"timestamp": "created_time", "direction": "descending"}],
            }
            if start_cursor:
                body["start_cursor"] = start_cursor

            resp = await client.post(
                f"{NOTION_BASE}/databases/{settings.notion_database_id}/query",
                headers=_headers(),
                json=body,
            )
            resp.raise_for_status()
            result = resp.json()

            for page in result.get("results", []):
                recipe = _page_to_response(page)
                if recipe:
                    recipes.append(recipe)

            has_more = result.get("has_more", False)
            start_cursor = result.get("next_cursor")

    return recipes


async def get_recipe(page_id: str) -> dict | None:
    """Get a single recipe by Notion page ID, including body code block."""
    async with httpx.AsyncClient(timeout=15) as client:
        # Fetch page properties
        page_resp = await client.get(
            f"{NOTION_BASE}/pages/{page_id}",
            headers=_headers(),
        )
        if page_resp.status_code == 404:
            return None
        page_resp.raise_for_status()
        page = page_resp.json()

        if page.get("archived", False):
            return None

        # Fetch page body (blocks) for the JSON code block
        blocks_resp = await client.get(
            f"{NOTION_BASE}/blocks/{page_id}/children",
            headers=_headers(),
            params={"page_size": 100},
        )
        blocks_resp.raise_for_status()
        blocks = blocks_resp.json().get("results", [])

    return _page_to_response(page, blocks)


async def create_recipe(data: dict) -> dict:
    """Create a new recipe in Notion. Returns the created page as a response dict."""
    properties = _build_properties(data)
    body_blocks = _build_body_blocks(data)
    code_block = _build_code_block(data)

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            f"{NOTION_BASE}/pages",
            headers=_headers(),
            json={
                "parent": {"database_id": settings.notion_database_id},
                "properties": properties,
                "children": body_blocks + [code_block],
            },
        )
        resp.raise_for_status()
        page = resp.json()

    # Re-fetch to get Notion-normalized blocks (with plain_text etc.)
    return await get_recipe(page["id"])


async def update_recipe(page_id: str, data: dict) -> dict:
    """Update a recipe's Notion properties and code block (merges with existing)."""
    async with httpx.AsyncClient(timeout=15) as client:
        # Update page properties
        properties = _build_properties(data, partial=True)
        if properties:
            resp = await client.patch(
                f"{NOTION_BASE}/pages/{page_id}",
                headers=_headers(),
                json={"properties": properties},
            )
            resp.raise_for_status()

        # Fetch existing blocks to merge code block data
        blocks_resp = await client.get(
            f"{NOTION_BASE}/blocks/{page_id}/children",
            headers=_headers(),
            params={"page_size": 100},
        )
        blocks_resp.raise_for_status()
        blocks = blocks_resp.json().get("results", [])

        # Merge: existing code block data + new updates
        existing_app_data = _parse_code_block(blocks)
        merged_data = {**existing_app_data, **data}
        new_code_block = _build_code_block(merged_data)

        existing_block_id = _find_code_block_id(blocks)
        if existing_block_id:
            await client.patch(
                f"{NOTION_BASE}/blocks/{existing_block_id}",
                headers=_headers(),
                json={"code": new_code_block["code"]},
            )
        else:
            await client.patch(
                f"{NOTION_BASE}/blocks/{page_id}/children",
                headers=_headers(),
                json={"children": [new_code_block]},
            )

        # Re-fetch the full page to return consistent data
        return await get_recipe(page_id)


async def delete_recipe(page_id: str) -> None:
    """Archive a Notion page (soft delete)."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.patch(
            f"{NOTION_BASE}/pages/{page_id}",
            headers=_headers(),
            json={"archived": True},
        )
        resp.raise_for_status()


# ---------------------------------------------------------------------------
# Page ↔ Response conversion
# ---------------------------------------------------------------------------

def _page_to_response(page: dict, blocks: list[dict] | None = None) -> dict | None:
    """Convert a Notion page (+ optional blocks) into SavedRecipeResponse format."""
    props = page.get("properties", {})

    title = _get_title(props.get("Name", {}))
    if not title:
        return None

    # Parse Notion properties
    ingredient_text = _get_rich_text(props.get("Ingredients", {}))
    ingredients = _parse_ingredient_text(ingredient_text) if ingredient_text else []

    categories = _get_multi_select(props.get("Category", {}))
    tags = [NOTION_TO_TAG[cat] for cat in categories if cat in NOTION_TO_TAG]

    source_url = _get_url(props.get("Link", {}))
    cooking_time = _get_rich_text(props.get("Cooking Time", {}))
    servings_num = _get_number(props.get("Servings", {}))
    servings = f"{servings_num} porciones" if servings_num else None

    # Parse code block for app-specific data
    app_data = _parse_code_block(blocks) if blocks else {}

    # If we have blocks but no app data (Notion-native recipe), parse body text
    body_ingredients: list[dict] = []
    body_instructions: list[dict] = []
    if blocks and not app_data:
        body_ingredients, body_instructions = _parse_body_content(blocks)

    # Priority: body-parsed ingredients (have amounts) > property (summary only)
    # Priority: app code block instructions > body-parsed instructions
    final_ingredients = body_ingredients or ingredients
    final_instructions = app_data.get("instructions", []) or body_instructions

    return {
        "id": page["id"],
        "recipeId": app_data.get("recipeId"),
        "sourceUrl": source_url or app_data.get("sourceUrl"),
        "sourceType": app_data.get("sourceType", "blog"),
        "title": title,
        "ingredients": json.dumps(final_ingredients),
        "instructions": json.dumps(final_instructions),
        "prepTime": app_data.get("prepTime"),
        "cookTime": cooking_time or None,
        "servings": servings,
        "tags": json.dumps(tags) if tags else None,
        "notes": json.dumps(app_data.get("notes", [])),
        "userEdits": json.dumps(app_data["userEdits"]) if app_data.get("userEdits") else None,
        "collectionIds": json.dumps(app_data["collectionIds"]) if app_data.get("collectionIds") else None,
        "savedAt": page.get("created_time", ""),
        "updatedAt": page.get("last_edited_time", ""),
    }


# ---------------------------------------------------------------------------
# Build Notion properties for create/update
# ---------------------------------------------------------------------------

def _build_properties(data: dict, partial: bool = False) -> dict:
    """Build Notion page properties from recipe data."""
    props: dict = {}

    if "title" in data:
        props["Name"] = {"title": [{"text": {"content": data["title"]}}]}

    if "tags" in data:
        tags_list = json.loads(data["tags"]) if isinstance(data["tags"], str) else (data["tags"] or [])
        categories = list({TAG_TO_NOTION[t] for t in tags_list if t in TAG_TO_NOTION})
        props["Category"] = {"multi_select": [{"name": c} for c in categories]}

    cook_time = data.get("cookTime") or data.get("prepTime")
    if cook_time:
        props["Cooking Time"] = {"rich_text": [{"text": {"content": cook_time}}]}

    if "ingredients" in data:
        ingredients = json.loads(data["ingredients"]) if isinstance(data["ingredients"], str) else data["ingredients"]
        ingredient_text = ", ".join(
            f"{ing.get('amount', '')} {ing.get('item', '')}".strip()
            for ing in ingredients
        )
        if ingredient_text:
            props["Ingredients"] = {"rich_text": [{"text": {"content": ingredient_text[:2000]}}]}

    if "sourceUrl" in data and data["sourceUrl"]:
        props["Link"] = {"url": data["sourceUrl"]}

    if "servings" in data and data["servings"]:
        servings_num = _parse_servings(data["servings"])
        if servings_num is not None:
            props["Servings"] = {"number": servings_num}

    # Set defaults on create (not partial update)
    if not partial:
        props.setdefault("Attempted?", {"select": {"name": "No"}})

    return props


def _build_body_blocks(data: dict) -> list[dict]:
    """Build human-readable Notion blocks for ingredients and instructions.

    These make the recipe look good when browsing in Notion directly.
    """
    blocks: list[dict] = []

    # Ingredients section
    ingredients_raw = data.get("ingredients")
    if ingredients_raw:
        ingredients = json.loads(ingredients_raw) if isinstance(ingredients_raw, str) else ingredients_raw
        if ingredients:
            blocks.append(_heading_block("Ingredients"))
            for ing in ingredients:
                amount = ing.get("amount", "").strip()
                item = ing.get("item", "").strip()
                text = f"{amount} {item}".strip() if amount else item
                if text:
                    blocks.append(_bulleted_list_block(text))

    # Instructions section
    instructions_raw = data.get("instructions")
    if instructions_raw:
        instructions = json.loads(instructions_raw) if isinstance(instructions_raw, str) else instructions_raw
        if instructions:
            blocks.append(_heading_block("Instructions"))
            for inst in instructions:
                text = inst.get("text", "") if isinstance(inst, dict) else str(inst)
                if text:
                    blocks.append(_numbered_list_block(text))

    return blocks


def _heading_block(text: str) -> dict:
    return {
        "object": "block",
        "type": "heading_2",
        "heading_2": {
            "rich_text": [{"type": "text", "text": {"content": text}}],
        },
    }


def _bulleted_list_block(text: str) -> dict:
    return {
        "object": "block",
        "type": "bulleted_list_item",
        "bulleted_list_item": {
            "rich_text": [{"type": "text", "text": {"content": text}}],
        },
    }


def _numbered_list_block(text: str) -> dict:
    return {
        "object": "block",
        "type": "numbered_list_item",
        "numbered_list_item": {
            "rich_text": [{"type": "text", "text": {"content": text}}],
        },
    }


def _build_code_block(data: dict) -> dict:
    """Build a Notion code block containing app-specific JSON data."""
    app_json = {}

    # instructions
    if "instructions" in data:
        val = data["instructions"]
        app_json["instructions"] = json.loads(val) if isinstance(val, str) else val
    else:
        app_json["instructions"] = []

    # notes
    if "notes" in data:
        val = data["notes"]
        app_json["notes"] = json.loads(val) if isinstance(val, str) else (val or [])
    else:
        app_json["notes"] = []

    # userEdits
    if "userEdits" in data and data["userEdits"]:
        val = data["userEdits"]
        app_json["userEdits"] = json.loads(val) if isinstance(val, str) else val
    else:
        app_json["userEdits"] = None

    # collectionIds
    if "collectionIds" in data and data["collectionIds"]:
        val = data["collectionIds"]
        app_json["collectionIds"] = json.loads(val) if isinstance(val, str) else val
    else:
        app_json["collectionIds"] = None

    # prepTime
    if "prepTime" in data:
        app_json["prepTime"] = data["prepTime"]

    # sourceType
    if "sourceType" in data:
        app_json["sourceType"] = data["sourceType"]

    # recipeId
    if "recipeId" in data:
        app_json["recipeId"] = data["recipeId"]

    return {
        "object": "block",
        "type": "code",
        "code": {
            "rich_text": [{"type": "text", "text": {"content": json.dumps(app_json)}}],
            "language": "json",
        },
    }


def _parse_code_block(blocks: list[dict]) -> dict:
    """Extract app-specific JSON data from the first code block in page body."""
    for block in blocks:
        if block.get("type") == "code":
            rich_text = block.get("code", {}).get("rich_text", [])
            if rich_text:
                text = "".join(t.get("plain_text", "") for t in rich_text)
                try:
                    return json.loads(text)
                except json.JSONDecodeError:
                    continue
    return {}


def _find_code_block_id(blocks: list[dict]) -> str | None:
    """Find the ID of the first code block in page body."""
    for block in blocks:
        if block.get("type") == "code":
            return block.get("id")
    return None


# ---------------------------------------------------------------------------
# Body content parsing (for Notion-native recipes with free-form text)
# ---------------------------------------------------------------------------

_INGREDIENT_HEADINGS = {"ingredients", "ingredientes", "what you need", "what you'll need"}
_INSTRUCTION_HEADINGS = {
    "instructions", "instrucciones", "directions", "steps", "pasos",
    "method", "preparation", "preparación", "how to make", "procedure",
}


def _parse_body_content(blocks: list[dict]) -> tuple[list[dict], list[dict]]:
    """Parse free-form page body blocks into structured ingredients and instructions.

    Looks for heading blocks to identify sections. Falls back to treating
    bulleted/numbered lists as ingredients/instructions respectively.
    """
    # Extract text from each block with its type
    parsed_blocks: list[dict] = []
    for block in blocks:
        btype = block.get("type", "")
        if btype == "code":
            continue  # Skip code blocks (app JSON)

        text = _block_text(block)
        if not text:
            continue

        parsed_blocks.append({"type": btype, "text": text})

    if not parsed_blocks:
        return [], []

    # Strategy 1: Section-based parsing (look for headings)
    sections = _split_into_sections(parsed_blocks)
    if sections:
        ingredients = _extract_section(sections, _INGREDIENT_HEADINGS)
        instructions = _extract_section(sections, _INSTRUCTION_HEADINGS)
        if ingredients or instructions:
            return (
                [{"amount": "", "item": line} for line in ingredients],
                [{"step": i + 1, "text": line} for i, line in enumerate(instructions)],
            )

    # Strategy 2: No headings — treat bullet lists as ingredients, numbered as instructions
    ingredients_lines: list[str] = []
    instructions_lines: list[str] = []
    for pb in parsed_blocks:
        if pb["type"] in ("bulleted_list_item",):
            ingredients_lines.append(pb["text"])
        elif pb["type"] in ("numbered_list_item",):
            instructions_lines.append(pb["text"])

    if ingredients_lines or instructions_lines:
        return (
            [{"amount": "", "item": line} for line in ingredients_lines],
            [{"step": i + 1, "text": line} for i, line in enumerate(instructions_lines)],
        )

    # Strategy 3: Just paragraphs — return all as instructions (best guess)
    all_lines = [pb["text"] for pb in parsed_blocks if pb["type"] not in ("heading_1", "heading_2", "heading_3")]
    if all_lines:
        return (
            [],
            [{"step": i + 1, "text": line} for i, line in enumerate(all_lines)],
        )

    return [], []


def _block_text(block: dict) -> str | None:
    """Extract plain text from any Notion block."""
    btype = block.get("type", "")
    content = block.get(btype, {})

    # Most text blocks have rich_text
    rich_text = content.get("rich_text", [])
    if rich_text:
        return "".join(t.get("plain_text", "") for t in rich_text).strip() or None

    return None


def _split_into_sections(blocks: list[dict]) -> dict[str, list[str]] | None:
    """Split blocks into named sections based on heading blocks.

    Returns {heading_text_lower: [line, line, ...]} or None if no headings found.
    """
    sections: dict[str, list[str]] = {}
    current_heading: str | None = None
    has_headings = False

    for pb in blocks:
        if pb["type"] in ("heading_1", "heading_2", "heading_3"):
            current_heading = pb["text"].lower().strip().rstrip(":")
            has_headings = True
            if current_heading not in sections:
                sections[current_heading] = []
        elif current_heading is not None:
            sections[current_heading].append(pb["text"])

    return sections if has_headings else None


def _extract_section(sections: dict[str, list[str]], heading_names: set[str]) -> list[str]:
    """Find a section matching any of the given heading names."""
    for heading, lines in sections.items():
        if heading in heading_names:
            return lines
    # Fuzzy: check if any heading contains one of the target words
    for heading, lines in sections.items():
        for name in heading_names:
            if name in heading:
                return lines
    return []


# ---------------------------------------------------------------------------
# Notion property helpers
# ---------------------------------------------------------------------------

def _get_title(prop: dict) -> str | None:
    title_arr = prop.get("title", [])
    if title_arr:
        return title_arr[0].get("plain_text", "").strip() or None
    return None


def _get_rich_text(prop: dict) -> str | None:
    rt = prop.get("rich_text", [])
    if rt:
        return "".join(t.get("plain_text", "") for t in rt).strip() or None
    return None


def _get_multi_select(prop: dict) -> list[str]:
    return [item.get("name", "") for item in prop.get("multi_select", [])]


def _get_url(prop: dict) -> str | None:
    return prop.get("url")


def _get_number(prop: dict) -> int | None:
    val = prop.get("number")
    return int(val) if val is not None else None


def _parse_ingredient_text(text: str) -> list[dict]:
    """Parse a comma-separated or newline-separated ingredient string."""
    items = re.split(r"[,\n]", text)
    ingredients = []
    for item in items:
        item = item.strip()
        if not item:
            continue
        match = re.match(
            r"^([\d½⅓⅔¼¾/.\s]+(?:cups?|tbsp|tsp|oz|g|kg|ml|l|lb|pcs?|cdas?|cdtas?)?)\s+(.+)",
            item,
            re.IGNORECASE,
        )
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
