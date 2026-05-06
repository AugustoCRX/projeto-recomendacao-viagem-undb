"""
services/weather.py
───────────────────
OpenWeatherMap proxy — current weather + 5-day forecast in one call.

Both upstream requests run concurrently via ``asyncio.gather``. Result is
cached for 30 minutes (weather rarely changes faster than that, and the free
tier allows 60 req/min — plenty of headroom).
"""

import asyncio
from typing import Any

import httpx
from fastapi import HTTPException

from core.config import OPENWEATHER_API_KEY
from services import cache

_OWM_BASE = "https://api.openweathermap.org/data/2.5"
_TTL = 30 * 60  # 30 min


async def get_weather(city: str) -> dict[str, Any]:
    key = OPENWEATHER_API_KEY
    if not str(key):
        raise HTTPException(status_code=503, detail="OPENWEATHER_API_KEY not configured")

    cached = cache.get(f"weather:{city.lower()}")
    if cached:
        return cached

    params_common = {"q": city, "appid": str(key), "units": "metric", "lang": "pt_br"}
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            current_resp, forecast_resp = await asyncio.gather(
                client.get(f"{_OWM_BASE}/weather", params=params_common),
                client.get(f"{_OWM_BASE}/forecast", params=params_common),
            )
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"Weather upstream error: {e}")

    if current_resp.status_code == 404 or forecast_resp.status_code == 404:
        raise HTTPException(status_code=404, detail=f"City '{city}' not found")
    if current_resp.status_code >= 400:
        raise HTTPException(status_code=502, detail="Weather upstream error")

    data = {"current": current_resp.json(), "forecast": forecast_resp.json()}
    cache.set(f"weather:{city.lower()}", data, _TTL)
    return data
