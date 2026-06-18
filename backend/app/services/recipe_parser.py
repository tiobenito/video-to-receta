"""Recipe parsing service using Claude Haiku."""

import json
from typing import Any

import anthropic

from app.core.config import settings

# Available tags for recipe categorization
AVAILABLE_TAGS = [
    "entrada", "plato-fuerte", "postre", "salsa", "bebida", "desayuno",
    "snack", "sopa", "ensalada", "guarnicion", "pan", "masa",
    "mexicana", "italiana", "asiatica", "americana", "francesa", "mediterranea",
    "saludable", "rapida", "vegetariana", "vegana", "sin-gluten", "keto",
    "picante", "dulce", "agridulce", "ahumado",
    "pollo", "carne", "cerdo", "mariscos", "pescado",
    "horno", "parrilla", "sarten", "olla", "freidora", "sin-coccion",
]

RECIPE_EXTRACTION_PROMPT_ES = """Eres un asistente de extracción de recetas. Dado un transcrito de un video de cocina, extrae una receta estructurada.

Devuelve JSON en este formato exacto:
{
  "title": "Nombre de la receta",
  "prepTime": "10 minutos" o null,
  "cookTime": "30 minutos" o null,
  "servings": "4 porciones" o null,
  "ingredients": [
    { "amount": "2 tazas", "item": "harina" },
    { "amount": "1 cdta", "item": "sal" }
  ],
  "instructions": [
    { "step": 1, "text": "Precalienta el horno a 180°C" },
    { "step": 2, "text": "Mezcla los ingredientes secos" }
  ],
  "tags": ["mexicana", "plato-fuerte", "picante"]
}

Etiquetas disponibles (usa SOLO estas, elige 2-5 relevantes):
""" + ", ".join(AVAILABLE_TAGS) + """

Pautas:
- Extrae el título de la receta de cómo el presentador se refiere al platillo
- Si las cantidades no están claras, haz estimaciones razonables y agrega "(estimado)" después
- Si algo se menciona pero la cantidad no está clara, usa "al gusto" o "según sea necesario"
- Combina pasos similares si son repetitivos en el transcrito
- Mantén los pasos de instrucción claros y accionables
- Si el video cubre múltiples recetas, extrae la principal
- IMPORTANTE: Escribe todo en español, incluyendo nombres de ingredientes y pasos
- Para tags: elige 2-5 etiquetas que mejor describan el tipo de platillo, cocina, método de cocción, y proteína principal

Devuelve SOLO el JSON, sin texto adicional ni explicaciones.

Transcrito:
"""

RECIPE_EXTRACTION_PROMPT_EN = """You are a recipe extraction assistant. Given a transcript from a cooking video, extract a structured recipe.

Return JSON in this exact format:
{
  "title": "Recipe name",
  "prepTime": "10 minutes" or null,
  "cookTime": "30 minutes" or null,
  "servings": "4 servings" or null,
  "ingredients": [
    { "amount": "2 cups", "item": "flour" },
    { "amount": "1 tsp", "item": "salt" }
  ],
  "instructions": [
    { "step": 1, "text": "Preheat oven to 350°F" },
    { "step": 2, "text": "Mix dry ingredients" }
  ],
  "tags": ["americana", "plato-fuerte", "horno"]
}

Available tags (use ONLY these, pick 2-5 relevant ones):
""" + ", ".join(AVAILABLE_TAGS) + """

Guidelines:
- Extract the recipe title from how the host refers to the dish
- If quantities are unclear, make reasonable estimates and add "(estimated)" after
- If something is mentioned but amount is unclear, use "to taste" or "as needed"
- Combine similar steps if they're repetitive in the transcript
- Keep instruction steps clear and actionable
- If the video covers multiple recipes, extract the main/primary one
- For tags: pick 2-5 tags that best describe the dish type, cuisine, cooking method, and main protein

Return ONLY the JSON, no additional text or explanation.

Transcript:
"""

# Default to Spanish
RECIPE_EXTRACTION_PROMPT = RECIPE_EXTRACTION_PROMPT_ES


class RecipeParseError(Exception):
    """Error parsing recipe from transcript."""

    pass


async def parse_recipe(transcript: str, language: str = "es") -> dict[str, Any]:
    """
    Parse a transcript into a structured recipe using Claude Haiku.

    Args:
        transcript: The full transcript text from a cooking video
        language: Output language ("es" for Spanish, "en" for English)

    Returns:
        Dictionary with recipe data: title, prepTime, cookTime, servings,
        ingredients (list), instructions (list)

    Raises:
        RecipeParseError: If parsing fails
    """
    if not settings.anthropic_api_key:
        raise RecipeParseError("ANTHROPIC_API_KEY not configured")

    # Select prompt based on language
    prompt = RECIPE_EXTRACTION_PROMPT_ES if language == "es" else RECIPE_EXTRACTION_PROMPT_EN

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    try:
        message = client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=2048,
            messages=[
                {
                    "role": "user",
                    "content": prompt + transcript,
                }
            ],
        )

        response_text = message.content[0].text

        # Parse JSON from response
        # Handle potential markdown code blocks
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0]
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0]

        recipe_data = json.loads(response_text.strip())

        # Validate required fields
        if "title" not in recipe_data:
            raise RecipeParseError("Recipe missing title")
        if "ingredients" not in recipe_data:
            raise RecipeParseError("Recipe missing ingredients")
        if "instructions" not in recipe_data:
            raise RecipeParseError("Recipe missing instructions")

        # Ensure ingredients and instructions are lists
        if not isinstance(recipe_data["ingredients"], list):
            raise RecipeParseError("Ingredients must be a list")
        if not isinstance(recipe_data["instructions"], list):
            raise RecipeParseError("Instructions must be a list")

        # Validate and filter tags
        if "tags" in recipe_data and isinstance(recipe_data["tags"], list):
            recipe_data["tags"] = [t for t in recipe_data["tags"] if t in AVAILABLE_TAGS]
        else:
            recipe_data["tags"] = []

        return recipe_data

    except anthropic.APIError as e:
        raise RecipeParseError(f"Claude API error: {e}")
    except json.JSONDecodeError as e:
        raise RecipeParseError(f"Failed to parse recipe JSON: {e}")
