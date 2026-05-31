import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.apartment import ApartmentListOut, ApartmentOut, ApartmentCreate
from app.services import apartment_service

router = APIRouter(prefix="/apartments", tags=["apartments"])


@router.get("", response_model=dict)
async def list_apartments(
    db: Annotated[AsyncSession, Depends(get_db)],
    city: str | None = None,
    neighborhood: str | None = None,
    rooms_min: float | None = None,
    rooms_max: float | None = None,
    price_min: int | None = None,
    price_max: int | None = None,
    size_min: int | None = None,
    size_max: int | None = None,
    agent_or_owner: str | None = None,
    saved_only: bool = False,
    sort_by: str = "created_at",
    sort_dir: str = "desc",
    page: int = 1,
    page_size: int = 40,
):
    apartments, total = await apartment_service.list_apartments(
        db, city=city, neighborhood=neighborhood,
        rooms_min=rooms_min, rooms_max=rooms_max,
        price_min=price_min, price_max=price_max,
        size_min=size_min, size_max=size_max,
        agent_or_owner=agent_or_owner, saved_only=saved_only,
        sort_by=sort_by, sort_dir=sort_dir,
        page=page, page_size=page_size,
    )
    return {
        "items": [ApartmentListOut.model_validate(a) for a in apartments],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/compare", response_model=list[ApartmentOut])
async def compare_apartments(
    db: Annotated[AsyncSession, Depends(get_db)],
    ids: str = Query(..., description="Comma-separated UUIDs"),
):
    id_list = [uuid.UUID(i.strip()) for i in ids.split(",") if i.strip()]
    if len(id_list) < 2 or len(id_list) > 4:
        raise HTTPException(400, "Provide 2–4 apartment IDs to compare")
    apartments = await apartment_service.get_apartments_by_ids(db, id_list)
    return [ApartmentOut.model_validate(a) for a in apartments]


@router.get("/{apartment_id}", response_model=ApartmentOut)
async def get_apartment(
    apartment_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    apt = await apartment_service.get_apartment(db, apartment_id)
    if not apt:
        raise HTTPException(404, "Apartment not found")
    return ApartmentOut.model_validate(apt)


@router.post("", response_model=ApartmentOut, status_code=201)
async def create_apartment(
    data: ApartmentCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    apt = await apartment_service.create_apartment(db, data)
    return ApartmentOut.model_validate(apt)
