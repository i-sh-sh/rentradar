import uuid
from datetime import datetime, date
from typing import Any

from sqlalchemy import String, Integer, Numeric, Boolean, Date, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class Apartment(Base):
    __tablename__ = "apartments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    yad2_id: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True)
    source: Mapped[str] = mapped_column(String(32), default="yad2")
    url: Mapped[str | None] = mapped_column(Text, nullable=True)
    title: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    price_nis: Mapped[int | None] = mapped_column(Integer, nullable=True)
    rooms: Mapped[float | None] = mapped_column(Numeric(4, 1), nullable=True)
    floor: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_floors: Mapped[int | None] = mapped_column(Integer, nullable=True)
    size_sqm: Mapped[int | None] = mapped_column(Integer, nullable=True)

    city: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    neighborhood: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    street: Mapped[str | None] = mapped_column(String(256), nullable=True)
    street_number: Mapped[str | None] = mapped_column(String(32), nullable=True)
    lat: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)
    lng: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)

    features: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    images: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)

    entry_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    agent_or_owner: Mapped[str | None] = mapped_column(String(16), nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)

    scraped_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    listed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    price_history: Mapped[list["PriceHistory"]] = relationship("PriceHistory", back_populates="apartment", cascade="all, delete-orphan")
    saved: Mapped["SavedApartment | None"] = relationship("SavedApartment", back_populates="apartment", uselist=False)


class PriceHistory(Base):
    __tablename__ = "price_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    apartment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("apartments.id", ondelete="CASCADE"))
    price_nis: Mapped[int] = mapped_column(Integer)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    apartment: Mapped["Apartment"] = relationship("Apartment", back_populates="price_history")


class SavedApartment(Base):
    __tablename__ = "saved_apartments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    apartment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("apartments.id", ondelete="CASCADE"), unique=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    tags: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    saved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    apartment: Mapped["Apartment"] = relationship("Apartment", back_populates="saved")


class ScrapeJob(Base):
    __tablename__ = "scrape_jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    status: Mapped[str] = mapped_column(String(32), default="running")
    search_params: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    listings_found: Mapped[int | None] = mapped_column(Integer, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
