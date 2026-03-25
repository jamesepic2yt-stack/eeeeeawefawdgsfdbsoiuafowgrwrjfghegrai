from datetime import datetime
from pydantic import BaseModel, EmailStr


class DailyTargets(BaseModel):
    target_calories: float = 2000.0
    target_protein_g: float = 150.0
    target_fat_g: float = 65.0
    target_carbs_g: float = 250.0


class UserCreate(BaseModel):
    email: str
    name: str
    targets: DailyTargets | None = None


class UserUpdate(BaseModel):
    name: str | None = None
    email: str | None = None


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    target_calories: float
    target_protein_g: float
    target_fat_g: float
    target_carbs_g: float
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
