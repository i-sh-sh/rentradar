import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.apartment import SavedApartmentOut, SavedCreate, SavedUpdate
from app.services import apartment_service

router = APIRouter(prefix="/saved", tags=["saved"])


@router.post("/{apartment_id}", response_model=SavedApartmentOut)
async def save_apartment(
    apartment_id: uuid.UUID,
    data: SavedCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    apt = await apartment_service.get_apartment(db, apartment_id)
    if not apt:
        raise HTTPException(404, "Apartment not found")
    saved = await apartment_service.save_apartment(db, apartment_id, data.notes, data.tags, data.rating)
    return SavedApartmentOut.model_validate(saved)


@router.patch("/{apartment_id}", response_model=SavedApartmentOut)
async def update_saved(
    apartment_id: uuid.UUID,
    data: SavedUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    saved = await apartment_service.save_apartment(db, apartment_id, data.notes, data.tags, data.rating)
    return SavedApartmentOut.model_validate(saved)


@router.delete("/{apartment_id}", status_code=204)
async def unsave_apartment(
    apartment_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    removed = await apartment_service.unsave_apartment(db, apartment_id)
    if not removed:
        raise HTTPException(404, "Not saved")
