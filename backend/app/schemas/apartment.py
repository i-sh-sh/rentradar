import uuid
from datetime import datetime, date
from typing import Any

from pydantic import BaseModel, computed_field


class PriceHistoryOut(BaseModel):
    id: uuid.UUID
    price_nis: int
    recorded_at: datetime

    model_config = {"from_attributes": True}


class SavedApartmentOut(BaseModel):
    id: uuid.UUID
    notes: str | None = None
    tags: list[str] | None = None
    rating: int | None = None
    saved_at: datetime

    model_config = {"from_attributes": True}


class ApartmentOut(BaseModel):
    id: uuid.UUID
    yad2_id: str | None = None
    source: str
    url: str | None = None
    title: str | None = None
    description: str | None = None
    price_nis: int | None = None
    rooms: float | None = None
    floor: int | None = None
    total_floors: int | None = None
    size_sqm: int | None = None
    city: str | None = None
    neighborhood: str | None = None
    street: str | None = None
    street_number: str | None = None
    lat: float | None = None
    lng: float | None = None
    features: dict[str, Any] | None = None
    images: list[str] | None = None
    entry_date: date | None = None
    agent_or_owner: str | None = None
    contact_phone: str | None = None
    scraped_at: datetime | None = None
    listed_at: datetime | None = None
    created_at: datetime
    is_active: bool
    price_history: list[PriceHistoryOut] = []
    saved: SavedApartmentOut | None = None

    @computed_field
    @property
    def price_per_sqm(self) -> float | None:
        if self.price_nis and self.size_sqm and self.size_sqm > 0:
            return round(self.price_nis / self.size_sqm, 1)
        return None

    model_config = {"from_attributes": True}


class ApartmentListOut(BaseModel):
    id: uuid.UUID
    yad2_id: str | None = None
    url: str | None = None
    title: str | None = None
    price_nis: int | None = None
    rooms: float | None = None
    floor: int | None = None
    total_floors: int | None = None
    size_sqm: int | None = None
    city: str | None = None
    neighborhood: str | None = None
    street: str | None = None
    lat: float | None = None
    lng: float | None = None
    features: dict[str, Any] | None = None
    images: list[str] | None = None
    entry_date: date | None = None
    agent_or_owner: str | None = None
    created_at: datetime
    is_active: bool
    saved: SavedApartmentOut | None = None

    @computed_field
    @property
    def price_per_sqm(self) -> float | None:
        if self.price_nis and self.size_sqm and self.size_sqm > 0:
            return round(self.price_nis / self.size_sqm, 1)
        return None

    model_config = {"from_attributes": True}


class ApartmentCreate(BaseModel):
    yad2_id: str | None = None
    source: str = "manual"
    url: str | None = None
    title: str | None = None
    description: str | None = None
    price_nis: int | None = None
    rooms: float | None = None
    floor: int | None = None
    total_floors: int | None = None
    size_sqm: int | None = None
    city: str | None = None
    neighborhood: str | None = None
    street: str | None = None
    street_number: str | None = None
    lat: float | None = None
    lng: float | None = None
    features: dict[str, Any] | None = None
    images: list[str] | None = None
    entry_date: date | None = None
    agent_or_owner: str | None = None
    contact_phone: str | None = None


class SavedCreate(BaseModel):
    notes: str | None = None
    tags: list[str] | None = None
    rating: int | None = None


class SavedUpdate(BaseModel):
    notes: str | None = None
    tags: list[str] | None = None
    rating: int | None = None


class ScrapeJobOut(BaseModel):
    id: uuid.UUID
    status: str
    search_params: dict[str, Any] | None = None
    listings_found: int | None = None
    started_at: datetime
    finished_at: datetime | None = None
    error: str | None = None

    model_config = {"from_attributes": True}


class ScrapeRequest(BaseModel):
    city: str = "תל אביב יפו"
    neighborhood: str | None = None
    rooms_min: float | None = None
    rooms_max: float | None = None
    price_min: int | None = None
    price_max: int | None = None
    max_pages: int = 5
