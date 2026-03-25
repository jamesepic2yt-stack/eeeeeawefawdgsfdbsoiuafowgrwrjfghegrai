from datetime import datetime
from pydantic import BaseModel


class FoodLogCreate(BaseModel):
    user_id: int
    food_name: str
    brand: str | None = None
    calories: float
    protein_g: float = 0.0
    fat_g: float = 0.0
    carbs_g: float = 0.0
    serving_size: float | None = None
    serving_unit: str | None = None
    servings: float = 1.0
    barcode: str | None = None
    source: str = "manual"  # manual, scan, barcode
    meal_type: str = "snack"  # breakfast, lunch, dinner, snack


class FoodLogResponse(BaseModel):
    id: int
    user_id: int
    food_name: str
    brand: str | None
    calories: float
    protein_g: float
    fat_g: float
    carbs_g: float
    serving_size: float | None
    serving_unit: str | None
    servings: float
    barcode: str | None
    source: str
    meal_type: str
    logged_at: datetime

    model_config = {"from_attributes": True}


class MacroProgress(BaseModel):
    current: float
    target: float
    percentage: float


class DailySummary(BaseModel):
    date: str
    calories: MacroProgress
    protein: MacroProgress
    fat: MacroProgress
    carbs: MacroProgress
    total_logs: int
    logs: list[FoodLogResponse]
