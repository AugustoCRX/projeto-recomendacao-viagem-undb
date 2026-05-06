"""services/images.py — Unsplash search proxy. Cached 1h."""

from typing import Any

import httpx
from fastapi import HTTPException

from core.config import UNSPLASH_ACCESS_KEY
from services import cache

_BASE = "https://api.unsplash.com/search/photos"
_TTL = 60 * 60


async def search_images(query: str, per_page: int = 10) -> dict[str, Any]:
    key_str = str(UNSPLASH_ACCESS_KEY)
    if not key_str:
        raise HTTPException(status_code=503, detail="UNSPLASH_ACCESS_KEY not configured")

    cache_key = f"images:{query.lower()}:{per_page}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(
                _BASE,
                params={"query": query, "per_page": per_page},
                headers={"Authorization": f"Client-ID {key_str}"},
            )
        except httpx.HTTPError as ex:
            raise HTTPException(status_code=502, detail=f"Unsplash error: {ex}")

    if resp.status_code >= 400:
        raise HTTPException(status_code=502, detail="Unsplash upstream error")

    body = resp.json()
    results = [
        {
            "id": p.get("id"),
            "url": p.get("urls", {}).get("regular"),
            "thumb": p.get("urls", {}).get("thumb"),
            "alt": p.get("alt_description"),
            "author": p.get("user", {}).get("name"),
            "author_url": p.get("user", {}).get("links", {}).get("html"),
        }
        for p in body.get("results", [])
    ]
    data = {"total": body.get("total", 0), "results": results}
    cache.set(cache_key, data, _TTL)
    return data
