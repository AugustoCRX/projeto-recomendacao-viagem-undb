"""services/country.py — REST Countries proxy. Keyless, cached 24h."""

from typing import Any

import httpx
from fastapi import HTTPException

from services import cache

_BASE = "https://restcountries.com/v3.1/name"
_TTL = 24 * 60 * 60


async def get_country(name: str) -> dict[str, Any]:
    key = f"country:{name.lower()}"
    cached = cache.get(key)
    if cached is not None:
        return cached

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(f"{_BASE}/{name}")
        except httpx.HTTPError as ex:
            raise HTTPException(status_code=502, detail=f"REST Countries error: {ex}")

    if resp.status_code == 404:
        raise HTTPException(status_code=404, detail=f"Country '{name}' not found")
    if resp.status_code >= 400:
        raise HTTPException(status_code=502, detail="REST Countries upstream error")

    data = resp.json()[0] if isinstance(resp.json(), list) else resp.json()
    cache.set(key, data, _TTL)
    return data
