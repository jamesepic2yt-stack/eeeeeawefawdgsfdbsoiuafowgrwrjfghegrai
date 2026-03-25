"""Unified search service that aggregates results from multiple food data sources.

Combines USDA FoodData Central, OpenFoodFacts, and Nutritionix into a single
search interface with deduplication and relevance ranking.
"""

import asyncio
from app.schemas.food import FoodSearchResult
from app.services.usda import search_usda
from app.services.openfoodfacts import search_openfoodfacts
from app.services.nutritionix import search_nutritionix


def _deduplicate_results(results: list[FoodSearchResult]) -> list[FoodSearchResult]:
    """Remove duplicate entries based on name + brand similarity."""
    seen: set[str] = set()
    unique: list[FoodSearchResult] = []

    for item in results:
        key = f"{item.name.lower().strip()}|{(item.brand or '').lower().strip()}"
        if key not in seen:
            seen.add(key)
            unique.append(item)

    return unique


def _rank_results(results: list[FoodSearchResult], query: str) -> list[FoodSearchResult]:
    """Rank search results by relevance to the query."""
    query_lower = query.lower().strip()
    query_words = set(query_lower.split())

    def score(item: FoodSearchResult) -> float:
        name_lower = item.name.lower()
        s = 0.0

        # Exact match bonus
        if query_lower == name_lower:
            s += 100

        # Starts with query
        if name_lower.startswith(query_lower):
            s += 50

        # Word overlap
        name_words = set(name_lower.split())
        overlap = len(query_words & name_words)
        s += overlap * 20

        # Contains query as substring
        if query_lower in name_lower:
            s += 30

        # Brand match
        if item.brand and query_lower in item.brand.lower():
            s += 15

        # Prefer items with complete nutrition data
        if item.calories > 0 and item.protein_g > 0:
            s += 10

        # Source priority: nutritionix (restaurant) > usda > openfoodfacts
        source_scores = {"nutritionix": 5, "usda": 3, "openfoodfacts": 1}
        s += source_scores.get(item.source, 0)

        return s

    return sorted(results, key=score, reverse=True)


async def unified_search(query: str, limit: int = 50) -> list[FoodSearchResult]:
    """Search all food data sources concurrently and return ranked, deduplicated results."""
    # Fire all searches in parallel
    usda_task = asyncio.create_task(search_usda(query, page_size=25))
    off_task = asyncio.create_task(search_openfoodfacts(query, page_size=15))
    nutritionix_task = asyncio.create_task(search_nutritionix(query))

    usda_results, off_results, nutritionix_results = await asyncio.gather(
        usda_task, off_task, nutritionix_task
    )

    # Merge all results
    all_results = nutritionix_results + usda_results + off_results

    # Deduplicate and rank
    unique = _deduplicate_results(all_results)
    ranked = _rank_results(unique, query)

    return ranked[:limit]
