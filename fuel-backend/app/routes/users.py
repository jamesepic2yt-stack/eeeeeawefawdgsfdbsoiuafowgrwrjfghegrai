from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse, DailyTargets

router = APIRouter(prefix="/api/users", tags=["users"])


@router.post("", response_model=UserResponse, status_code=201)
async def create_user(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check for existing email
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=payload.email,
        name=payload.name,
    )
    if payload.targets:
        user.target_calories = payload.targets.target_calories
        user.target_protein_g = payload.targets.target_protein_g
        user.target_fat_g = payload.targets.target_fat_g
        user.target_carbs_g = payload.targets.target_carbs_g

    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, payload: UserUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.name is not None:
        user.name = payload.name
    if payload.email is not None:
        user.email = payload.email

    await db.commit()
    await db.refresh(user)
    return user


@router.put("/{user_id}/targets", response_model=UserResponse)
async def update_targets(user_id: int, targets: DailyTargets, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.target_calories = targets.target_calories
    user.target_protein_g = targets.target_protein_g
    user.target_fat_g = targets.target_fat_g
    user.target_carbs_g = targets.target_carbs_g

    await db.commit()
    await db.refresh(user)
    return user


@router.get("/{user_id}/targets", response_model=DailyTargets)
async def get_targets(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return DailyTargets(
        target_calories=user.target_calories,
        target_protein_g=user.target_protein_g,
        target_fat_g=user.target_fat_g,
        target_carbs_g=user.target_carbs_g,
    )
