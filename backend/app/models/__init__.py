"""
models/__init__.py  [M — Model layer]
─────────────────────────────────────
Re-exports SQLAlchemy ORM models so callers can ``from models import User``.
Importing every model here also ensures ``Base.metadata`` knows about all
tables before ``create_all`` runs at startup.
"""

from models.itinerary import ItineraryItem
from models.place import PLACE_CATEGORIES, Place
from models.trip import TRIP_STATUSES, Trip
from models.user import User

__all__ = [
    "User",
    "Trip",
    "Place",
    "ItineraryItem",
    "TRIP_STATUSES",
    "PLACE_CATEGORIES",
]
