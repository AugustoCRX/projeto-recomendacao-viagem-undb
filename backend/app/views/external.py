"""views/external.py — public proxy endpoints for third-party APIs (cached)."""

from fastapi import APIRouter, Query

from services import country as country_svc
from services import exchange as exchange_svc
from services import images as images_svc
from services import places as places_svc
from services import weather as weather_svc

router = APIRouter()


@router.get(
    "/weather",
    summary="Current weather + 5-day forecast for a city",
    description="Calls OpenWeatherMap. Cached 30 minutes per city.",
)
async def weather(city: str = Query(..., min_length=1)):
    return await weather_svc.get_weather(city)


@router.get(
    "/places",
    summary="Search POIs for a city",
    description="OpenStreetMap / Overpass. type ∈ {tourist_attraction, restaurant, lodging}. Cached 24h.",
)
async def places(
    city: str = Query(..., min_length=1),
    type: str = Query("tourist_attraction"),
):
    return await places_svc.search_places(city, type)


@router.get(
    "/country",
    summary="Country information by name",
    description="Calls REST Countries. Cached 24h.",
)
async def country(name: str = Query(..., min_length=1)):
    return await country_svc.get_country(name)


@router.get(
    "/exchange",
    summary="Currency conversion",
    description="ExchangeRate-API (free fallback if no key). Cached 1h.",
)
async def exchange(
    from_: str = Query(..., alias="from", min_length=3, max_length=3),
    to: str = Query(..., min_length=3, max_length=3),
    amount: float = Query(1.0, gt=0),
):
    return await exchange_svc.convert(from_, to, amount)


@router.get(
    "/images",
    summary="Search destination photos on Unsplash",
    description="Cached 1h per query.",
)
async def images(
    query: str = Query(..., min_length=1),
    per_page: int = Query(10, ge=1, le=30),
):
    return await images_svc.search_images(query, per_page)
