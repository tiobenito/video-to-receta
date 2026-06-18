"""Blog recipe extraction service.

Pipeline:
1. Try recipe-scrapers library (structured extraction from 600+ sites)
2. Fall back to Claude Haiku (scrape page text, send to same parse_recipe prompt)

On Railway, direct HTTP requests are blocked by Cloudflare on most recipe sites.
If SCRAPERAPI_KEY is set, all page fetches are routed through ScraperAPI.
"""

import logging
import os
from urllib.parse import urlencode

import httpx
from bs4 import BeautifulSoup

from app.services.recipe_parser import parse_recipe

logger = logging.getLogger(__name__)

_SCRAPERAPI_BASE = "https://api.scraperapi.com"


async def _fetch_html(url: str) -> str | None:
    """Fetch raw HTML for a URL, routing through ScraperAPI if configured."""
    key = os.environ.get("SCRAPERAPI_KEY")
    if key:
        params = {"api_key": key, "url": url}
        fetch_url = f"{_SCRAPERAPI_BASE}?{urlencode(params)}"
        logger.info("Fetching %s via ScraperAPI", url)
    else:
        fetch_url = url

    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=60) as client:
            resp = await client.get(fetch_url, headers={"User-Agent": "Mozilla/5.0"})
            if resp.status_code != 200:
                logger.error("Fetch %s returned HTTP %d: %s", url, resp.status_code, resp.text[:200])
                return None
            if len(resp.text) < 100:
                logger.error("Fetch %s returned near-empty body (%d chars)", url, len(resp.text))
                return None
            logger.info("Fetched %s: %d chars", url, len(resp.text))
            return resp.text
    except Exception as e:
        logger.error("Failed to fetch %s: %s", url, e)
        return None


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
    result = await _try_recipe_scrapers(url)
    if result:
        return result

    # Fall back to scraping page text and sending to Claude
    html = await _fetch_html(url)
    if not html:
        raise BlogScrapeError("No se pudo obtener el contenido de la página.")

    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
        tag.decompose()
    page_text = soup.get_text(separator="\n", strip=True)
    if len(page_text) > 8000:
        page_text = page_text[:8000]
    if len(page_text) < 100:
        raise BlogScrapeError("No se pudo obtener el contenido de la página.")

    return await parse_recipe(page_text)


async def _try_recipe_scrapers(url: str) -> dict | None:
    """Try to extract recipe using recipe-scrapers library."""
    try:
        from recipe_scrapers import scrape_html
    except ImportError:
        logger.warning("recipe-scrapers not installed, skipping structured extraction")
        return None

    try:
        html = await _fetch_html(url)
        if not html:
            return None

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


