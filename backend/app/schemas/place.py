"""schemas/place.py — request/response models for /places endpoints."""

from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

PlaceCategory = Literal["tourist_attraction", "restaurant", "lodging", "other"]


class PlaceCreate(BaseModel):
    trip_id: UUID
    name: str = Field(..., min_length=1, max_length=255)
    address: Optional[str] = None
    lat: Optional[Decimal] = Field(None, ge=-90, le=90)
    lng: Optional[Decimal] = Field(None, ge=-180, le=180)
    category: PlaceCategory = "tourist_attraction"
    place_id: Optional[str] = Field(None, max_length=255)


class PlaceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    trip_id: UUID
    user_id: UUID
    name: str
    address: Optional[str]
    lat: Optional[Decimal]
    lng: Optional[Decimal]
    category: PlaceCategory
    place_id: Optional[str]
    saved_at: datetime
    created_at: datetime
