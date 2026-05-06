"""services/exchange.py — ExchangeRate-API proxy. Cached 1h."""

from typing import Any

import httpx
from fastapi import HTTPException

from core.config import EXCHANGERATE_API_KEY
from services import cache

_TTL = 60 * 60


async def convert(from_ccy: str, to_ccy: str, amount: float) -> dict[str, Any]:
    key = f"exchange:{from_ccy.upper()}:{to_ccy.upper()}"
    rate_data = cache.get(key)
    if rate_data is None:
        api_key = str(EXCHANGERATE_API_KEY)
        if api_key:
            url = f"https://v6.exchangerate-api.com/v6/{api_key}/pair/{from_ccy}/{to_ccy}"
        else:
            url = f"https://open.er-api.com/v6/latest/{from_ccy}"

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                resp = await client.get(url)
            except httpx.HTTPError as ex:
                raise HTTPException(status_code=502, detail=f"Exchange upstream error: {ex}")

        if resp.status_code >= 400:
            raise HTTPException(status_code=502, detail="Exchange upstream error")

        body = resp.json()
        if api_key:
            rate = body.get("conversion_rate")
        else:
            rate = body.get("rates", {}).get(to_ccy.upper())
        if rate is None:
            raise HTTPException(status_code=404, detail="Currency pair not found")

        rate_data = {"rate": rate, "base": from_ccy.upper(), "target": to_ccy.upper()}
        cache.set(key, rate_data, _TTL)

    return {
        **rate_data,
        "amount": amount,
        "converted": round(amount * float(rate_data["rate"]), 2),
    }
