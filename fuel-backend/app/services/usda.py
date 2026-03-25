"""USDA FoodData Central API integration.

Uses the free FoodData Central API to search branded and SR Legacy food items.
Docs: https://fdc.nal.usda.gov/api-guide.html
"""

import os
import httpx
from app.schemas.food import FoodSearchResult

USDA_API_KEY = os.getenv("USDA_API_KEY", "DEMO_KEY")
USDA_BASE_URL = "https://api.nal.usda.gov/fdc/v1"


def _extract_nutrient(nutrients: list[dict], nutrient_id: int) -> float:
    """Extract a nutrient value by its USDA nutrient ID."""
    for n in nutrients:
        nid = n.get("nutrientId") or n.get("nutrientNumber")
        if nid == nutrient_id:
            return float(n.get("value", 0))
    return 0.0


def _parse_usda_food(item: dict) -> FoodSearchResult:
    """Parse a USDA API food item into our unified schema."""
    nutrients = item.get("foodNutrients", [])

    # USDA nutrient IDs: 1008=Energy(kcal), 1003=Protein, 1004=Fat, 1005=Carbs
    calories = _extract_nutrient(nutrients, 1008)
    protein = _extract_nutrient(nutrients, 1003)
    fat = _extract_nutrient(nutrients, 1004)
    carbs = _extract_nutrient(nutrients, 1005)

    serving_size = item.get("servingSize")
    serving_unit = item.get("servingSizeUnit", "g")

    return FoodSearchResult(
        name=item.get("description", "Unknown"),
        brand=item.get("brandOwner") or item.get("brandName"),
        calories=calories,
        protein_g=protein,
        fat_g=fat,
        carbs_g=carbs,
        serving_size=float(serving_size) if serving_size else None,
        serving_unit=serving_unit if serving_size else None,
        barcode=item.get("gtinUpc"),
        source="usda",
        external_id=str(item.get("fdcId", "")),
        category=item.get("foodCategory") or item.get("brandedFoodCategory"),
    )


async def search_usda(query: str, page_size: int = 25) -> list[FoodSearchResult]:
    """Search USDA FoodData Central for foods matching the query."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(
                f"{USDA_BASE_URL}/foods/search",
                params={
                    "api_key": USDA_API_KEY,
                    "query": query,
                    "pageSize": page_size,
                    "dataType": "Branded,SR Legacy,Foundation",
                    "sortBy": "dataType.keyword",
                    "sortOrder": "asc",
                },
            )
            response.raise_for_status()
            data = response.json()
            foods = data.get("foods", [])
            return [_parse_usda_food(f) for f in foods]
        except (httpx.HTTPError, Exception):
            return []


async def get_usda_food_by_id(fdc_id: str) -> FoodSearchResult | None:
    """Get a specific food item by its FDC ID."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(
                f"{USDA_BASE_URL}/food/{fdc_id}",
                params={"api_key": USDA_API_KEY},
            )
            response.raise_for_status()
            return _parse_usda_food(response.json())
        except (httpx.HTTPError, Exception):
            return None
