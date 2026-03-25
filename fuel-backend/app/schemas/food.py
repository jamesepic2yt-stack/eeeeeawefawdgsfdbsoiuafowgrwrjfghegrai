from pydantic import BaseModel


class FoodSearchResult(BaseModel):
    id: int | None = None
    name: str
    brand: str | None = None
    calories: float
    protein_g: float
    fat_g: float
    carbs_g: float
    serving_size: float | None = None
    serving_unit: str | None = None
    barcode: str | None = None
    source: str  # usda, openfoodfacts, nutritionix, custom
    external_id: str | None = None
    category: str | None = None

    model_config = {"from_attributes": True}


class BarcodeResult(BaseModel):
    found: bool
    product: FoodSearchResult | None = None
    barcode: str


class FoodComponent(BaseModel):
    name: str
    estimated_portion: str
    calories: float
    protein_g: float
    fat_g: float
    carbs_g: float
    confidence: float  # 0.0 - 1.0


class VisionAnalysisResult(BaseModel):
    success: bool
    description: str
    components: list[FoodComponent]
    total_calories: float
    total_protein_g: float
    total_fat_g: float
    total_carbs_g: float
    meal_type_suggestion: str | None = None
