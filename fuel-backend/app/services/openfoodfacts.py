"""OpenFoodFacts API integration for barcode/UPC lookups.

Free, open-source database with millions of food products.
Docs: https://wiki.openfoodfacts.org/API
"""

import httpx
from app.schemas.food import FoodSearchResult, BarcodeResult

OFF_BASE_URL = "https://world.openfoodfacts.org/api/v2"
OFF_SEARCH_URL = "https://world.openfoodfacts.org/cgi/search.pl"


def _parse_off_product(product: dict) -> FoodSearchResult:
    """Parse an OpenFoodFacts product into our unified schema."""
    nutriments = product.get("nutriments", {})

    # OFF uses per-100g values; also provides per-serving if available
    calories = nutriments.get("energy-kcal_serving") or nutriments.get("energy-kcal_100g", 0)
    protein = nutriments.get("proteins_serving") or nutriments.get("proteins_100g", 0)
    fat = nutriments.get("fat_serving") or nutriments.get("fat_100g", 0)
    carbs = nutriments.get("carbohydrates_serving") or nutriments.get("carbohydrates_100g", 0)

    serving_size_str = product.get("serving_size", "")
    serving_size = None
    serving_unit = None
    if serving_size_str:
        # Try to parse "30g" or "1 cup (240ml)" etc.
        import re
        match = re.match(r"([\d.]+)\s*(\w+)", serving_size_str)
        if match:
            serving_size = float(match.group(1))
            serving_unit = match.group(2)

    return FoodSearchResult(
        name=product.get("product_name") or product.get("product_name_en", "Unknown"),
        brand=product.get("brands"),
        calories=float(calories or 0),
        protein_g=float(protein or 0),
        fat_g=float(fat or 0),
        carbs_g=float(carbs or 0),
        serving_size=serving_size,
        serving_unit=serving_unit,
        barcode=product.get("code"),
        source="openfoodfacts",
        external_id=product.get("code"),
        category=product.get("categories_tags", [None])[0] if product.get("categories_tags") else None,
    )


async def lookup_barcode(barcode: str) -> BarcodeResult:
    """Look up a food product by its barcode/UPC code."""
    async with httpx.AsyncClient(timeout=8.0) as client:
        try:
            response = await client.get(
                f"{OFF_BASE_URL}/product/{barcode}.json",
                headers={"User-Agent": "Fuel-MacroTracker/1.0"},
            )
            response.raise_for_status()
            data = response.json()

            if data.get("status") == 1 and data.get("product"):
                product = _parse_off_product(data["product"])
                return BarcodeResult(found=True, product=product, barcode=barcode)

            return BarcodeResult(found=False, product=None, barcode=barcode)
        except (httpx.HTTPError, Exception):
            return BarcodeResult(found=False, product=None, barcode=barcode)


async def search_openfoodfacts(query: str, page_size: int = 15) -> list[FoodSearchResult]:
    """Search OpenFoodFacts for food products."""
    async with httpx.AsyncClient(timeout=8.0) as client:
        try:
            response = await client.get(
                OFF_SEARCH_URL,
                params={
                    "search_terms": query,
                    "search_simple": 1,
                    "action": "process",
                    "json": 1,
                    "page_size": page_size,
                    "fields": "product_name,brands,nutriments,serving_size,code,categories_tags,product_name_en",
                },
                headers={"User-Agent": "Fuel-MacroTracker/1.0"},
            )
            response.raise_for_status()
            data = response.json()
            products = data.get("products", [])
            return [_parse_off_product(p) for p in products if p.get("product_name")]
        except (httpx.HTTPError, Exception):
            return []
