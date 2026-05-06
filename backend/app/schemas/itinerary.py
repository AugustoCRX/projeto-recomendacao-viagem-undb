"""schemas/itinerary.py — request/response models for /itinerary endpoints."""

from datetime import date as DateT
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


def _validate_hhmm(v: Optional[str]) -> Optional[str]:
    if v is None or v == "":
        return None
    if len(v) != 5 or v[2] != ":":
        raise ValueError("time must be in HH:mm format")
    hh, mm = v.split(":")
    if not (hh.isdigit() and mm.isdigit() and 0 <= int(hh) <= 23 and 0 <= int(mm) <= 59):
        raise ValueError("time must be a valid HH:mm value")
    return v


class ItemCreate(BaseModel):
    trip_id: UUID
    place_id: Optional[UUID] = None
    date: DateT
    time: Optional[str] = Field(None, max_length=5)
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    order: int = Field(0, ge=0)

    @field_validator("time")
    @classmethod
    def _v_time(cls, v):  # noqa: D401
        return _validate_hhmm(v)


class ItemUpdate(BaseModel):
    place_id: Optional[UUID] = None
    date: Optional[DateT] = None
    time: Optional[str] = Field(None, max_length=5)
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    order: Optional[int] = Field(None, ge=0)

    @field_validator("time")
    @classmethod
    def _v_time(cls, v):  # noqa: D401
        return _validate_hhmm(v)


class ItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    trip_id: UUID
    user_id: UUID
    place_id: Optional[UUID]
    date: DateT
    time: Optional[str]
    title: str
    description: Optional[str]
    order: int
    created_at: datetime
    updated_at: datetime


class DayResponse(BaseModel):
    """Itinerary grouped by date — ``GET /itinerary/{trip_id}`` returns a list of these."""

    date: DateT
    day_number: int
    activities: List[ItemResponse]
