"""
services/places.py
──────────────────
OpenStreetMap / Overpass API place lookup — keyless, no quota config needed.

Resilience strategy:
  1. Geocode the input via Nominatim (with addressdetails=1).
  2. Reject country/state-level matches early (bbox too large for Overpass).
  3. Cache the geocoded bbox per city so the three parallel POI requests
     (tourist_attraction + restaurant + lodging) issued by the frontend
     don't each hit Nominatim again.
  4. Acquire a per-city asyncio.Lock around the Overpass call so those same
     three parallel requests don't all blast Overpass at once — Overpass
     bans IPs that send concurrent heavy queries.
  5. Try multiple Overpass mirrors in sequence: the public servers are
     frequently overloaded and a 504/429 on one is usually fine on the next.
  6. On total failure (all mirrors), return an EMPTY LIST (200) rather than
     502, so the UI degrades gracefully instead of showing an error.
"""

import asyncio
from typing import Any, Literal, Optional

import httpx
from fastapi import HTTPException
from loguru import logger

from services import cache

_NOMINATIM = "https://nominatim.openstreetmap.org/search"

# Fallback chain — public Overpass mirrors. Order matters: main first, then
# community mirrors with less aggressive rate-limiting.
_OVERPASS_MIRRORS: list[str] = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.openstreetmap.fr/api/interpreter",
]

_TTL = 24 * 60 * 60
_UA = "SmartTravelPlanner/0.3 (https://github.com/AugustoCRX)"

_MAX_BBOX_DEGREES = 3.0
_NON_CITY_TYPES = {"country", "state", "region", "province"}

PlaceType = Literal["tourist_attraction", "restaurant", "lodging"]
_TYPE_QUERY: dict[str, str] = {
    "tourist_attraction": '["tourism"~"attraction|museum|viewpoint|gallery"]',
    "restaurant": '["amenity"~"restaurant|cafe|bar"]',
    "lodging": '["tourism"~"hotel|hostel|guest_house"]',
}

# Per-city locks for Overpass + Nominatim. Same city + same type sharing one
# lock means parallel calls converge instead of stampeding the upstream.
_locks: dict[str, asyncio.Lock] = {}


def _lock_for(key: str) -> asyncio.Lock:
    lock = _locks.get(key)
    if lock is None:
        lock = asyncio.Lock()
        _locks[key] = lock
    return lock


# ── Nominatim ────────────────────────────────────────────────────────────────
async def _geocode(client: httpx.AsyncClient, city: str) -> dict[str, Any]:
    """Cached city → bbox/addresstype lookup."""
    cache_key = f"geocode:{city.lower()}"
    hit = cache.get(cache_key)
    if hit is not None:
        return hit

    async with _lock_for(cache_key):
        # Re-check after acquiring the lock — another coroutine may have filled it.
        hit = cache.get(cache_key)
        if hit is not None:
            return hit

        try:
            geo = await client.get(
                _NOMINATIM,
                params={"q": city, "format": "json", "limit": 1, "addressdetails": 1},
            )
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"Nominatim error: {e}")

        results = geo.json() if geo.status_code == 200 else []
        if not results:
            raise HTTPException(status_code=404, detail=f"'{city}' not found")

        match = results[0]
        cache.set(cache_key, match, _TTL)
        return match


# ── Overpass ─────────────────────────────────────────────────────────────────
async def _overpass(client: httpx.AsyncClient, ql: str) -> Optional[dict[str, Any]]:
    """Try each mirror in order; return parsed JSON on success, None on total failure."""
    last_status: int | None = None
    last_body: str = ""
    for url in _OVERPASS_MIRRORS:
        try:
            ov = await client.post(url, data={"data": ql})
        except httpx.TimeoutException:
            logger.warning(f"Overpass timeout @ {url}")
            continue
        except httpx.HTTPError as ex:
            logger.warning(f"Overpass network error @ {url}: {ex}")
            continue

        if ov.status_code == 200:
            try:
                return ov.json()
            except ValueError:
                logger.warning(f"Overpass {url} returned non-JSON body: {ov.text[:200]!r}")
                continue

        last_status = ov.status_code
        last_body = ov.text[:300]
        logger.warning(f"Overpass {url} → HTTP {ov.status_code}: {last_body!r}")

    logger.error(f"All Overpass mirrors failed. Last status={last_status} body={last_body!r}")
    return None


# ── public entry point ───────────────────────────────────────────────────────
async def search_places(
    city: str, place_type: str = "tourist_attraction"
) -> list[dict[str, Any]]:
    if place_type not in _TYPE_QUERY:
        raise HTTPException(status_code=422, detail=f"Invalid type '{place_type}'")

    cache_key = f"places:{city.lower()}:{place_type}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    async with httpx.AsyncClient(timeout=30.0, headers={"User-Agent": _UA}) as client:
        match = await _geocode(client, city)

        addr_type = (match.get("addresstype") or match.get("type") or "").lower()
        if addr_type in _NON_CITY_TYPES:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"'{city}' parece ser um {addr_type}, não uma cidade. "
                    "Use o nome de uma cidade ou município "
                    "(ex.: 'Tóquio' em vez de 'Japão')."
                ),
            )

        bbox = match["boundingbox"]  # [south, north, west, east]
        s, n, w, ee = map(float, bbox)
        if abs(n - s) > _MAX_BBOX_DEGREES or abs(ee - w) > _MAX_BBOX_DEGREES:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"A área de '{city}' é grande demais ({abs(n-s):.1f}° × {abs(ee-w):.1f}°) "
                    "para uma busca de pontos turísticos. Tente uma cidade específica."
                ),
            )

        bbox_clause = f"({s},{w},{n},{ee})"
        filt = _TYPE_QUERY[place_type]
        ql = (
            f"[out:json][timeout:20];"
            f"(node{filt}{bbox_clause};way{filt}{bbox_clause};);"
            f"out center 50;"
        )

        # Serialize calls to Overpass per (city, type) — avoids stampeding
        # the same query from concurrent frontend requests.
        async with _lock_for(cache_key):
            # Re-check cache (someone may have filled it while we waited).
            cached = cache.get(cache_key)
            if cached is not None:
                return cached

            payload = await _overpass(client, ql)

    if payload is None:
        # All mirrors failed — degrade gracefully. Short TTL so we retry soon.
        cache.set(cache_key, [], _TTL // 24)
        return []

    elements = payload.get("elements", [])
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

    cache.set(cache_key, out, _TTL)
    return out