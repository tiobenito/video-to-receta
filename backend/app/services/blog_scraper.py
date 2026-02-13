"""Blog recipe extraction service.

Pipeline:
1. Try recipe-scrapers library (structured extraction from 600+ sites)
2. Fall back to Claude Haiku (scrape page text, send to same parse_recipe prompt)
"""

import logging

import httpx
from bs4 import BeautifulSoup

from app.services.recipe_parser import parse_recipe

logger = logging.getLogger(__name__)


class BlogScrapeError(Exception):
    """Error scraping recipe from blog."""
    pass


async def extract_recipe_from_blog(url: str) -> dict:
    """
    Extract a recipe from a blog URL.

    Tries recipe-scrapers first for structured data, falls back to Claude.

    Returns:
        Dictionary with recipe data (same shape as parse_recipe output)
    """
    # Try recipe-scrapers first (fast, structured)
    result = _try_recipe_scrapers(url)
    if result:
        return result

    # Fall back to scraping page text and sending to Claude
    page_text = await _fetch_page_text(url)
    if not page_text:
        raise BlogScrapeError("No se pudo obtener el contenido de la página.")

    return await parse_recipe(page_text)


def _try_recipe_scrapers(url: str) -> dict | None:
    """Try to extract recipe using recipe-scrapers library."""
    try:
        from recipe_scrapers import scrape_html
    except ImportError:
        logger.warning("recipe-scrapers not installed, skipping structured extraction")
        return None

    try:
        # Fetch HTML first (recipe-scrapers needs raw HTML)
        import httpx as _httpx
        with _httpx.Client(follow_redirects=True, timeout=15) as client:
            resp = client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            resp.raise_for_status()
            html = resp.text

        scraper = scrape_html(html, org_url=url)

        title = scraper.title()
        if not title:
            return None

        # Build ingredients list
        ingredients = []
        for ing_text in scraper.ingredients():
            # recipe-scrapers returns plain strings; split into amount + item
            parts = ing_text.split(" ", 2)
            if len(parts) >= 3 and _looks_like_amount(parts[0]):
                ingredients.append({"amount": f"{parts[0]} {parts[1]}", "item": parts[2]})
            elif len(parts) >= 2 and _looks_like_amount(parts[0]):
                ingredients.append({"amount": parts[0], "item": " ".join(parts[1:])})
            else:
                ingredients.append({"amount": "", "item": ing_text})

        # Build instructions list
        instructions = []
        for i, step_text in enumerate(scraper.instructions_list(), 1):
            if step_text.strip():
                instructions.append({"step": i, "text": step_text.strip()})

        if not ingredients or not instructions:
            return None

        # Optional fields
        prep_time = None
        cook_time = None
        servings = None

        try:
            pt = scraper.prep_time()
            if pt:
                prep_time = f"{pt} minutos" if isinstance(pt, int) else str(pt)
        except Exception:
            pass

        try:
            ct = scraper.total_time()
            if ct:
                cook_time = f"{ct} minutos" if isinstance(ct, int) else str(ct)
        except Exception:
            pass

        try:
            s = scraper.yields()
            if s:
                servings = str(s)
        except Exception:
            pass

        return {
            "title": title,
            "ingredients": ingredients,
            "instructions": instructions,
            "prepTime": prep_time,
            "cookTime": cook_time,
            "servings": servings,
            "tags": [],  # recipe-scrapers doesn't provide tags
        }

    except Exception as e:
        logger.info(f"recipe-scrapers failed for {url}: {e}")
        return None


def _looks_like_amount(s: str) -> bool:
    """Check if a string looks like a quantity (number, fraction, etc.)."""
    if not s:
        return False
    # Numbers, fractions, unicode fractions
    return any(c.isdigit() or c in "½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞/" for c in s)


async def _fetch_page_text(url: str) -> str | None:
    """Fetch a web page and extract readable text content."""
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=15) as client:
            resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            resp.raise_for_status()
            html = resp.text

        soup = BeautifulSoup(html, "html.parser")

        # Remove script and style elements
        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()

        text = soup.get_text(separator="\n", strip=True)

        # Truncate to ~8000 chars to stay within Claude's sweet spot
        if len(text) > 8000:
            text = text[:8000]

        return text if len(text) > 100 else None

    except Exception as e:
        logger.error(f"Failed to fetch page text from {url}: {e}")
        return None
