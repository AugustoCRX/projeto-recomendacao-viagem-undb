"""
models/itinerary.py  [M — Model layer]
────────────────────────────────────────
SQLAlchemy ORM model for the ``itinerary_items`` table.

Each row is one activity in a day. The frontend groups them by ``date``
to reconstruct the day-by-day view (see views/itinerary.py GET handler).

Table: itinerary_items
  id          UUID PK
  trip_id     UUID FK → trips(id) ON DELETE CASCADE
  user_id     UUID FK → users(id)             ← denormalized for fast auth check
  place_id    UUID FK → places(id) SET NULL   ← optional link to a saved place
  date        DATE NOT NULL                   ← which day this activity belongs to
  time        VARCHAR(5)                      ← "HH:mm" stored as string (no TZ issues)
  title       VARCHAR(255) NOT NULL
  description TEXT
  order       INTEGER DEFAULT 0               ← sort order within the day
  created_at  TIMESTAMPTZ DEFAULT now()
  updated_at  TIMESTAMPTZ DEFAULT now()

Index: (trip_id, date, order)
"""

import uuid

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID

from db import Base


class ItineraryItem(Base):
    __tablename__ = "itinerary_items"
    __table_args__ = (
        Index("ix_itinerary_trip_date_order", "trip_id", "date", "order"),
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
    place_id = Column(
        UUID(as_uuid=True),
        ForeignKey("places.id", ondelete="SET NULL"),
        nullable=True,
    )
    date = Column(Date, nullable=False)
    time = Column(String(5))  # "HH:mm"
    title = Column(String(255), nullable=False)
    description = Column(Text)
    order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<ItineraryItem id={self.id} date={self.date} title={self.title!r}>"
