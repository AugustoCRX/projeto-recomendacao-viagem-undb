"""
services/places.py
──────────────────
OpenStreetMap / Overpass API place lookup — keyless, no quota config needed.

Strategy: use Nominatim to geocode the city (gives bbox), then run an Overpass
query for tourism/restaurant/lodging POIs in that bbox. Cached for 24h.
"""

from typing import Any, Literal

import httpx
from fastapi import HTTPException

from services import cache

_NOMINATIM = "https://nominatim.openstreetmap.org/search"
_OVERPASS = "https://overpass-api.de/api/interpreter"
_TTL = 24 * 60 * 60
_UA = "SmartTravelPlanner/0.2 (https://github.com/AugustoCRX)"

PlaceType = Literal["tourist_attraction", "restaurant", "lodging"]

_TYPE_QUERY: dict[str, str] = {
    "tourist_attraction": '["tourism"~"attraction|museum|viewpoint|gallery"]',
    "restaurant": '["amenity"~"restaurant|cafe|bar"]',
    "lodging": '["tourism"~"hotel|hostel|guest_house"]',
}


async def search_places(city: str, place_type: str = "tourist_attraction") -> list[dict[str, Any]]:
    if place_type not in _TYPE_QUERY:
        raise HTTPException(status_code=422, detail=f"Invalid type '{place_type}'")

    key = f"places:{city.lower()}:{place_type}"
    cached = cache.get(key)
    if cached is not None:
        return cached

    async with httpx.AsyncClient(timeout=15.0, headers={"User-Agent": _UA}) as client:
        # 1. geocode city → bbox
        try:
            geo = await client.get(
                _NOMINATIM,
                params={"q": city, "format": "json", "limit": 1},
            )
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"Nominatim error: {e}")
        results = geo.json()
        if not results:
            raise HTTPException(status_code=404, detail=f"City '{city}' not found")
        bbox = results[0]["boundingbox"]  # [south, north, west, east]
        s, n, w, e = bbox
        bbox_clause = f"({s},{w},{n},{e})"

        # 2. Overpass query
        filt = _TYPE_QUERY[place_type]
        ql = f"""[out:json][timeout:25];
( node{filt}{bbox_clause}; way{filt}{bbox_clause}; );
out center 50;"""
        try:
            ov = await client.post(_OVERPASS, data={"data": ql})
        except httpx.HTTPError as ex:
            raise HTTPException(status_code=502, detail=f"Overpass error: {ex}")

    if ov.status_code >= 400:
        raise HTTPException(status_code=502, detail="Overpass upstream error")

    elements = ov.json().get("elements", [])
    out: list[dict[str, Any]] = []
    for el in elements:
        tags = el.get("tags", {})
        name = tags.get("name")
        if not name:
            continue
        lat = el.get("lat") or el.get("center", {}).get("lat")
        lon = el.get("lon") or el.get("center", {}).get("lon")
        out.append(
            {
                "place_id": f"osm-{el.get('type')}-{el.get('id')}",
                "name": name,
                "lat": lat,
                "lng": lon,
                "address": tags.get("addr:full") or tags.get("addr:street"),
                "category": place_type,
                "tags": tags,
            }
        )

    cache.set(key, out, _TTL)
    return out
