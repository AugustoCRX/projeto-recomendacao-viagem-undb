"""
urls.py
───────
Single mounting point for every view router — the FastAPI analog of Django's
``urls.py``. ``main.py`` includes only this router, keeping the app factory
free of feature-specific imports.
"""

from fastapi import APIRouter

from views import ai, auth, docs, external, itinerary, places, trips

router = APIRouter()
router.include_router(auth.router, prefix="/auth", tags=["Auth"])
router.include_router(trips.router, prefix="/trips", tags=["Trips"])
router.include_router(places.router, prefix="/places", tags=["Places"])
router.include_router(itinerary.router, prefix="/itinerary", tags=["Itinerary"])
router.include_router(external.router, prefix="/external", tags=["External"])
router.include_router(docs.router, prefix="/docs-md", tags=["Docs"])
router.include_router(ai.router, prefix="/ai", tags=["AI Planner"])
