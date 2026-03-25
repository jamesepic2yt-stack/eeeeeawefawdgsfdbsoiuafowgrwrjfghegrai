from fastapi import APIRouter, UploadFile, File, HTTPException

from app.schemas.food import FoodSearchResult, BarcodeResult, VisionAnalysisResult
from app.services.search import unified_search
from app.services.openfoodfacts import lookup_barcode
from app.services.vision import analyze_food_image

router = APIRouter(prefix="/api", tags=["food"])


@router.get("/search", response_model=list[FoodSearchResult])
async def search_food(q: str, limit: int = 50):
    """Unified food search across USDA, OpenFoodFacts, and Nutritionix databases.

    Aggregates results from all sources, deduplicates, and ranks by relevance.
    """
    if not q or len(q.strip()) < 2:
        raise HTTPException(status_code=400, detail="Query must be at least 2 characters")

    results = await unified_search(q.strip(), limit=limit)
    return results


@router.get("/barcode/{upc}", response_model=BarcodeResult)
async def barcode_lookup(upc: str):
    """Look up a food product by its barcode/UPC code.

    Searches OpenFoodFacts database for product information.
    Returns nutritional data if the barcode is found.
    """
    if not upc or len(upc) < 6:
        raise HTTPException(status_code=400, detail="Invalid barcode")

    result = await lookup_barcode(upc)
    return result


@router.post("/vision/analyze", response_model=VisionAnalysisResult)
async def analyze_food(image: UploadFile = File(...)):
    """Analyze a food image using AI vision to identify components and estimate macros.

    Accepts JPEG or PNG images. Uses GPT-4 Vision to perform:
    - Food item identification and segmentation
    - Portion size estimation based on visual density
    - Per-component macronutrient estimation
    - Meal type classification
    """
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image (JPEG or PNG)")

    # Read image data (limit to 20MB)
    contents = await image.read()
    if len(contents) > 20 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image too large (max 20MB)")

    result = await analyze_food_image(contents, mime_type=image.content_type)
    return result
