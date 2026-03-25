from sqlalchemy import String, Float, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class FoodItem(Base):
    """Cached food items from external sources (USDA, OpenFoodFacts, restaurants)."""
    __tablename__ = "food_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    brand: Mapped[str | None] = mapped_column(String(255), nullable=True)

    calories: Mapped[float] = mapped_column(Float, nullable=False)
    protein_g: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    fat_g: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    carbs_g: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    serving_size: Mapped[float | None] = mapped_column(Float, nullable=True)
    serving_unit: Mapped[str | None] = mapped_column(String(50), nullable=True)

    barcode: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    source: Mapped[str] = mapped_column(
        String(30), nullable=False, default="custom"
    )  # usda, openfoodfacts, nutritionix, custom
    external_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    category: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
