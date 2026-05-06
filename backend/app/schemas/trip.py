"""schemas/trip.py — request/response models for /trips endpoints."""

from datetime import date, datetime
from decimal import Decimal
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

TripStatus = Literal["planning", "confirmed", "ongoing", "completed", "cancelled"]


class _TripBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    destination: str = Field(..., min_length=1, max_length=255)
    country: Optional[str] = Field(None, max_length=100)
    start_date: date
    end_date: date
    budget: Optional[Decimal] = Field(None, ge=0)
    currency: str = Field("BRL", max_length=10)
    notes: Optional[str] = None
    cover_photo: Optional[str] = None

    @model_validator(mode="after")
    def _check_dates(self) -> "_TripBase":
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self


class TripCreate(_TripBase):
    status: TripStatus = "planning"


class TripUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    destination: Optional[str] = Field(None, min_length=1, max_length=255)
    country: Optional[str] = Field(None, max_length=100)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[Decimal] = Field(None, ge=0)
    currency: Optional[str] = Field(None, max_length=10)
    status: Optional[TripStatus] = None
    notes: Optional[str] = None
    cover_photo: Optional[str] = None


class TripResponse(_TripBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    status: TripStatus
    created_at: datetime
    updated_at: datetime
