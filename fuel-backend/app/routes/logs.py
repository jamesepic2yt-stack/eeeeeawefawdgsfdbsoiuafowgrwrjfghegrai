from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.food_log import FoodLog
from app.schemas.food_log import FoodLogCreate, FoodLogResponse, DailySummary, MacroProgress

router = APIRouter(prefix="/api/logs", tags=["logs"])


@router.post("", response_model=FoodLogResponse, status_code=201)
async def create_log(payload: FoodLogCreate, db: AsyncSession = Depends(get_db)):
    # Verify user exists
    result = await db.execute(select(User).where(User.id == payload.user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    log = FoodLog(
        user_id=payload.user_id,
        food_name=payload.food_name,
        brand=payload.brand,
        calories=payload.calories * payload.servings,
        protein_g=payload.protein_g * payload.servings,
        fat_g=payload.fat_g * payload.servings,
        carbs_g=payload.carbs_g * payload.servings,
        serving_size=payload.serving_size,
        serving_unit=payload.serving_unit,
        servings=payload.servings,
        barcode=payload.barcode,
        source=payload.source,
        meal_type=payload.meal_type,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


@router.get("", response_model=list[FoodLogResponse])
async def get_logs(
    user_id: int = Query(...),
    log_date: date | None = Query(None, alias="date"),
    meal_type: str | None = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    query = select(FoodLog).where(FoodLog.user_id == user_id)

    if log_date:
        start = datetime.combine(log_date, datetime.min.time())
        end = datetime.combine(log_date, datetime.max.time())
        query = query.where(and_(FoodLog.logged_at >= start, FoodLog.logged_at <= end))

    if meal_type:
        query = query.where(FoodLog.meal_type == meal_type)

    query = query.order_by(FoodLog.logged_at.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    return result.scalars().all()


@router.delete("/{log_id}", status_code=204)
async def delete_log(log_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FoodLog).where(FoodLog.id == log_id))
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")

    await db.delete(log)
    await db.commit()


@router.get("/summary", response_model=DailySummary)
async def daily_summary(
    user_id: int = Query(...),
    summary_date: date | None = Query(None, alias="date"),
    db: AsyncSession = Depends(get_db),
):
    # Get user for targets
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    target_date = summary_date or date.today()
    start = datetime.combine(target_date, datetime.min.time())
    end = datetime.combine(target_date, datetime.max.time())

    # Get all logs for the day
    logs_result = await db.execute(
        select(FoodLog)
        .where(
            and_(
                FoodLog.user_id == user_id,
                FoodLog.logged_at >= start,
                FoodLog.logged_at <= end,
            )
        )
        .order_by(FoodLog.logged_at.desc())
    )
    logs = logs_result.scalars().all()

    # Calculate totals
    total_cal = sum(log.calories for log in logs)
    total_pro = sum(log.protein_g for log in logs)
    total_fat = sum(log.fat_g for log in logs)
    total_carbs = sum(log.carbs_g for log in logs)

    return DailySummary(
        date=target_date.isoformat(),
        calories=MacroProgress(
            current=round(total_cal, 1),
            target=user.target_calories,
            percentage=round(min(total_cal / user.target_calories * 100, 100), 1) if user.target_calories > 0 else 0,
        ),
        protein=MacroProgress(
            current=round(total_pro, 1),
            target=user.target_protein_g,
            percentage=round(min(total_pro / user.target_protein_g * 100, 100), 1) if user.target_protein_g > 0 else 0,
        ),
        fat=MacroProgress(
            current=round(total_fat, 1),
            target=user.target_fat_g,
            percentage=round(min(total_fat / user.target_fat_g * 100, 100), 1) if user.target_fat_g > 0 else 0,
        ),
        carbs=MacroProgress(
            current=round(total_carbs, 1),
            target=user.target_carbs_g,
            percentage=round(min(total_carbs / user.target_carbs_g * 100, 100), 1) if user.target_carbs_g > 0 else 0,
        ),
        total_logs=len(logs),
        logs=[FoodLogResponse.model_validate(log) for log in logs],
    )
