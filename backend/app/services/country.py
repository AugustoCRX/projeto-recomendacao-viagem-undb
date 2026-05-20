"""services/country.py — REST Countries proxy. Keyless, cached 24h."""

from typing import Any

import httpx
from fastapi import HTTPException

from services import cache

_BASE = "https://restcountries.com/v3.1/name"
_TTL = 24 * 60 * 60

# Mapeamento PT → EN para países que a REST Countries não reconhece em português
_PT_TO_EN: dict[str, str] = {
    "alemanha": "germany",
    "japão": "japan",
    "japao": "japan",
    "frança": "france",
    "franca": "france",
    "espanha": "spain",
    "itália": "italy",
    "italia": "italy",
    "grécia": "greece",
    "grecia": "greece",
    "turquia": "turkey",
    "polônia": "poland",
    "polonia": "poland",
    "áustria": "austria",
    "austria": "austria",
    "suíça": "switzerland",
    "suica": "switzerland",
    "países baixos": "netherlands",
    "paises baixos": "netherlands",
    "holanda": "netherlands",
    "bélgica": "belgium",
    "belgica": "belgium",
    "suécia": "sweden",
    "suecia": "sweden",
    "noruega": "norway",
    "dinamarca": "denmark",
    "finlândia": "finland",
    "finlandia": "finland",
    "islândia": "iceland",
    "islandia": "iceland",
    "irlanda": "ireland",
    "reino unido": "united kingdom",
    "grã-bretanha": "united kingdom",
    "gra-bretanha": "united kingdom",
    "estados unidos": "united states",
    "eua": "united states",
    "canadá": "canada",
    "canada": "canada",
    "austrália": "australia",
    "australia": "australia",
    "nova zelândia": "new zealand",
    "nova zelandia": "new zealand",
    "índia": "india",
    "india": "india",
    "coreia do sul": "south korea",
    "coreia do norte": "north korea",
    "tailândia": "thailand",
    "tailandia": "thailand",
    "vietnã": "vietnam",
    "vietna": "vietnam",
    "indonésia": "indonesia",
    "indonesia": "indonesia",
    "filipinas": "philippines",
    "singapura": "singapore",
    "malásia": "malaysia",
    "malasia": "malaysia",
    "rússia": "russia",
    "russia": "russia",
    "ucrânia": "ukraine",
    "ucrania": "ukraine",
    "república tcheca": "czech republic",
    "republica tcheca": "czech republic",
    "hungria": "hungary",
    "romênia": "romania",
    "romenia": "romania",
    "bulgária": "bulgaria",
    "bulgaria": "bulgaria",
    "croácia": "croatia",
    "croacia": "croatia",
    "sérvia": "serbia",
    "servia": "serbia",
    "egito": "egypt",
    "marrocos": "morocco",
    "áfrica do sul": "south africa",
    "africa do sul": "south africa",
    "quênia": "kenya",
    "quenia": "kenya",
    "nigéria": "nigeria",
    "nigeria": "nigeria",
    "etiópia": "ethiopia",
    "etiopia": "ethiopia",
    "tanzânia": "tanzania",
    "tanzania": "tanzania",
    "emirados árabes unidos": "united arab emirates",
    "emirados arabes unidos": "united arab emirates",
    "arábia saudita": "saudi arabia",
    "arabia saudita": "saudi arabia",
    "irã": "iran",
    "ira": "iran",
    "iraque": "iraq",
    "paquistão": "pakistan",
    "paquistao": "pakistan",
    "camboja": "cambodia",
    "mianmar": "myanmar",
    "colômbia": "colombia",
    "colombia": "colombia",
}


async def _fetch(client: httpx.AsyncClient, name: str) -> dict[str, Any] | None:
    resp = await client.get(f"{_BASE}/{name}")
    if resp.status_code == 404:
        return None
    if resp.status_code >= 400:
        raise HTTPException(status_code=502, detail="REST Countries upstream error")
    data = resp.json()
    return data[0] if isinstance(data, list) else data


async def get_country(name: str) -> dict[str, Any]:
    key = f"country:{name.lower()}"
    cached = cache.get(key)
    if cached is not None:
        return cached

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            en_name = _PT_TO_EN.get(name.lower().strip())
            data = await _fetch(client, en_name if en_name else name)
        except httpx.HTTPError as ex:
            raise HTTPException(status_code=502, detail=f"REST Countries error: {ex}")

    if data is None:
        raise HTTPException(status_code=404, detail=f"Country '{name}' not found")

    cache.set(key, data, _TTL)
    return data
