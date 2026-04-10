"""
models/trip.py  [M — Model layer]
──────────────────────────────────
SQLAlchemy ORM model for the ``trips`` table.

Table: trips
  id          UUID PK
  user_id     UUID FK → users(id) ON DELETE CASCADE
  name        VARCHAR(255) NOT NULL    -- friendly trip title, e.g. "Aventura em Lisboa"
  destination VARCHAR(255) NOT NULL   -- city/region name used for external API queries
  country     VARCHAR(100)
  start_date  DATE NOT NULL
  end_date    DATE NOT NULL
  budget      NUMERIC(12,2)
  currency    VARCHAR(10) DEFAULT 'BRL'
  status      VARCHAR(20) DEFAULT 'planning'
              CHECK IN ('planning','confirmed','ongoing','completed','cancelled')
  notes       TEXT
  cover_photo TEXT                     -- URL from Unsplash proxy
  created_at  TIMESTAMPTZ DEFAULT now()
  updated_at  TIMESTAMPTZ DEFAULT now()

Indexes:
  - (user_id)
  - (user_id, status)   ← filtered list queries
"""

import uuid

from sqlalchemy import (
    CheckConstraint,
    Column,
    Date,
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

TRIP_STATUSES = ("planning", "confirmed", "ongoing", "completed", "cancelled")


class Trip(Base):
    __tablename__ = "trips"
    __table_args__ = (
        CheckConstraint(
            "status IN ('planning','confirmed','ongoing','completed','cancelled')",
            name="ck_trips_status",
        ),
        Index("ix_trips_user_status", "user_id", "status"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = Column(String(255), nullable=False)
    destination = Column(String(255), nullable=False)
    country = Column(String(100))
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    budget = Column(Numeric(12, 2))
    currency = Column(String(10), nullable=False, default="BRL")
    status = Column(String(20), nullable=False, default="planning")
    notes = Column(Text)
    cover_photo = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Trip id={self.id} destination={self.destination!r} status={self.status!r}>"
