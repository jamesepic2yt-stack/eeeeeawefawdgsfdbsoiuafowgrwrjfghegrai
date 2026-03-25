"""Nutritionix API integration for restaurant and branded food data.

Provides access to restaurant menu items and natural language food parsing.
Docs: https://developer.nutritionix.com/docs/v2
"""

import os
import httpx
from app.schemas.food import FoodSearchResult

NUTRITIONIX_APP_ID = os.getenv("NUTRITIONIX_APP_ID", "")
NUTRITIONIX_API_KEY = os.getenv("NUTRITIONIX_API_KEY", "")
NUTRITIONIX_BASE_URL = "https://trackapi.nutritionix.com/v2"


def _parse_nutritionix_food(item: dict) -> FoodSearchResult:
    """Parse a Nutritionix food item into our unified schema."""
    return FoodSearchResult(
        name=item.get("food_name", "Unknown"),
        brand=item.get("brand_name"),
        calories=float(item.get("nf_calories", 0)),
        protein_g=float(item.get("nf_protein", 0)),
        fat_g=float(item.get("nf_total_fat", 0)),
        carbs_g=float(item.get("nf_total_carbohydrate", 0)),
        serving_size=float(item.get("serving_weight_grams", 0)) if item.get("serving_weight_grams") else None,
        serving_unit=item.get("serving_unit", "serving"),
        barcode=item.get("upc"),
        source="nutritionix",
        external_id=item.get("nix_item_id") or item.get("tag_id"),
        category="restaurant" if item.get("brand_name") else "common",
    )


async def search_nutritionix(query: str) -> list[FoodSearchResult]:
    """Search Nutritionix for restaurant and branded food items.

    Falls back gracefully if API keys are not configured.
    """
    if not NUTRITIONIX_APP_ID or not NUTRITIONIX_API_KEY:
        return []

    headers = {
        "x-app-id": NUTRITIONIX_APP_ID,
        "x-app-key": NUTRITIONIX_API_KEY,
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=8.0) as client:
        results: list[FoodSearchResult] = []

        # Search instant endpoint (branded + common)
        try:
            response = await client.get(
                f"{NUTRITIONIX_BASE_URL}/search/instant",
                params={"query": query},
                headers=headers,
            )
            response.raise_for_status()
            data = response.json()

            # Process branded items (restaurant/packaged)
            for item in data.get("branded", [])[:10]:
                results.append(_parse_nutritionix_food(item))

            # Process common items
            for item in data.get("common", [])[:5]:
                results.append(_parse_nutritionix_food(item))

        except (httpx.HTTPError, Exception):
            pass

        return results


async def parse_natural_language(text: str) -> list[FoodSearchResult]:
    """Use Nutritionix natural language endpoint to parse food descriptions.

    Example: "1 chipotle burrito bowl with rice and chicken"
    """
    if not NUTRITIONIX_APP_ID or not NUTRITIONIX_API_KEY:
        return []

    headers = {
        "x-app-id": NUTRITIONIX_APP_ID,
        "x-app-key": NUTRITIONIX_API_KEY,
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.post(
                f"{NUTRITIONIX_BASE_URL}/natural/nutrients",
                json={"query": text},
                headers=headers,
            )
            response.raise_for_status()
            data = response.json()
            return [_parse_nutritionix_food(f) for f in data.get("foods", [])]
        except (httpx.HTTPError, Exception):
            return []
