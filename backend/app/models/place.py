"""
models/place.py  [M — Model layer]
───────────────────────────────────
SQLAlchemy ORM model for the ``places`` table.

Table: places
  id        UUID PK
  trip_id   UUID FK → trips(id) ON DELETE CASCADE
  user_id   UUID FK → users(id)   ← denormalized so auth check needs only one query
  name      VARCHAR(255) NOT NULL
  address   TEXT
  lat       NUMERIC(10,7)
  lng       NUMERIC(10,7)
  category  VARCHAR(50)  CHECK IN ('tourist_attraction','restaurant','lodging','other')
  place_id  VARCHAR(255)  ← Google Places ID or OSM node ID (e.g. "osm-12345")
  saved_at  TIMESTAMPTZ DEFAULT now()
  created_at TIMESTAMPTZ DEFAULT now()

Index: (trip_id, saved_at DESC)
"""

import uuid

from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID

from db import Base

PLACE_CATEGORIES = ("tourist_attraction", "restaurant", "lodging", "other")


class Place(Base):
    __tablename__ = "places"
    __table_args__ = (
        CheckConstraint(
            "category IN ('tourist_attraction','restaurant','lodging','other')",
            name="ck_places_category",
        ),
        Index("ix_places_trip_saved", "trip_id", "saved_at"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    trip_id = Column(
        UUID(as_uuid=True),
        ForeignKey("trips.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )
    name = Column(String(255), nullable=False)
    address = Column(Text)
    lat = Column(Numeric(10, 7))
    lng = Column(Numeric(10, 7))
    category = Column(String(50), nullable=False, default="tourist_attraction")
    place_id = Column(String(255))
    saved_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Place id={self.id} name={self.name!r} trip_id={self.trip_id}>"
