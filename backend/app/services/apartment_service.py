import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.apartment import Apartment, PriceHistory, SavedApartment, ScrapeJob
from app.schemas.apartment import ApartmentCreate, ScrapeRequest
from app.scraper.yad2_client import fetch_listings


async def list_apartments(
    db: AsyncSession,
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
) -> tuple[list[Apartment], int]:
    filters = [Apartment.is_active == True]

    if city:
        filters.append(Apartment.city.ilike(f"%{city}%"))
    if neighborhood:
        filters.append(Apartment.neighborhood.ilike(f"%{neighborhood}%"))
    if rooms_min is not None:
        filters.append(Apartment.rooms >= rooms_min)
    if rooms_max is not None:
        filters.append(Apartment.rooms <= rooms_max)
    if price_min is not None:
        filters.append(Apartment.price_nis >= price_min)
    if price_max is not None:
        filters.append(Apartment.price_nis <= price_max)
    if size_min is not None:
        filters.append(Apartment.size_sqm >= size_min)
    if size_max is not None:
        filters.append(Apartment.size_sqm <= size_max)
    if agent_or_owner:
        filters.append(Apartment.agent_or_owner == agent_or_owner)
    if saved_only:
        filters.append(Apartment.saved != None)

    sort_col = getattr(Apartment, sort_by, Apartment.created_at)
    order = sort_col.desc() if sort_dir == "desc" else sort_col.asc()

    count_q = select(func.count()).select_from(Apartment).where(and_(*filters))
    count_result = await db.execute(count_q)
    total = count_result.scalar_one()

    q = (
        select(Apartment)
        .where(and_(*filters))
        .options(selectinload(Apartment.saved))
        .order_by(order)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(q)
    return result.scalars().all(), total


async def get_apartment(db: AsyncSession, apartment_id: uuid.UUID) -> Apartment | None:
    q = (
        select(Apartment)
        .where(Apartment.id == apartment_id)
        .options(
            selectinload(Apartment.price_history),
            selectinload(Apartment.saved),
        )
    )
    result = await db.execute(q)
    return result.scalar_one_or_none()


async def get_apartments_by_ids(db: AsyncSession, ids: list[uuid.UUID]) -> list[Apartment]:
    q = (
        select(Apartment)
        .where(Apartment.id.in_(ids))
        .options(
            selectinload(Apartment.price_history),
            selectinload(Apartment.saved),
        )
    )
    result = await db.execute(q)
    return result.scalars().all()


async def create_apartment(db: AsyncSession, data: ApartmentCreate) -> Apartment:
    apt = Apartment(**data.model_dump())
    db.add(apt)
    await db.commit()
    await db.refresh(apt)
    return apt


async def upsert_from_scrape(db: AsyncSession, raw: dict[str, Any]) -> Apartment:
    yad2_id = raw.get("yad2_id")
    existing = None
    if yad2_id:
        result = await db.execute(select(Apartment).where(Apartment.yad2_id == yad2_id))
        existing = result.scalar_one_or_none()

    if existing:
        old_price = existing.price_nis
        new_price = raw.get("price_nis")
        for k, v in raw.items():
            setattr(existing, k, v)
        existing.updated_at = datetime.utcnow()

        if new_price and old_price != new_price:
            db.add(PriceHistory(apartment_id=existing.id, price_nis=new_price))

        await db.commit()
        return existing
    else:
        apt = Apartment(**{k: v for k, v in raw.items() if hasattr(Apartment, k)})
        db.add(apt)
        await db.flush()
        if apt.price_nis:
            db.add(PriceHistory(apartment_id=apt.id, price_nis=apt.price_nis))
        await db.commit()
        return apt


async def save_apartment(db: AsyncSession, apartment_id: uuid.UUID, notes: str | None, tags: list[str] | None, rating: int | None) -> SavedApartment:
    result = await db.execute(select(SavedApartment).where(SavedApartment.apartment_id == apartment_id))
    saved = result.scalar_one_or_none()
    if saved:
        saved.notes = notes
        saved.tags = tags
        saved.rating = rating
    else:
        saved = SavedApartment(apartment_id=apartment_id, notes=notes, tags=tags, rating=rating)
        db.add(saved)
    await db.commit()
    await db.refresh(saved)
    return saved


async def unsave_apartment(db: AsyncSession, apartment_id: uuid.UUID) -> bool:
    result = await db.execute(select(SavedApartment).where(SavedApartment.apartment_id == apartment_id))
    saved = result.scalar_one_or_none()
    if saved:
        await db.delete(saved)
        await db.commit()
        return True
    return False


async def run_scrape_job(db: AsyncSession, req: ScrapeRequest) -> ScrapeJob:
    job = ScrapeJob(
        status="running",
        search_params=req.model_dump(),
        started_at=datetime.utcnow(),
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    try:
        listings = await fetch_listings(
            city=req.city,
            neighborhood=req.neighborhood,
            rooms_min=req.rooms_min,
            rooms_max=req.rooms_max,
            price_min=req.price_min,
            price_max=req.price_max,
            max_pages=req.max_pages,
        )
        for raw in listings:
            await upsert_from_scrape(db, raw)

        job.status = "done"
        job.listings_found = len(listings)
        job.finished_at = datetime.utcnow()
    except Exception as e:
        job.status = "failed"
        job.error = str(e)
        job.finished_at = datetime.utcnow()

    await db.commit()
    await db.refresh(job)
    return job
