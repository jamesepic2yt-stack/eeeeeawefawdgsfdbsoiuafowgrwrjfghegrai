from datetime import datetime
from sqlalchemy import String, Float, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    # Daily macro targets
    target_calories: Mapped[float] = mapped_column(Float, default=2000.0)
    target_protein_g: Mapped[float] = mapped_column(Float, default=150.0)
    target_fat_g: Mapped[float] = mapped_column(Float, default=65.0)
    target_carbs_g: Mapped[float] = mapped_column(Float, default=250.0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    logs: Mapped[list["FoodLog"]] = relationship(  # noqa: F821
        back_populates="user", cascade="all, delete-orphan"
    )
