"""
ai/nodes.py
───────────
Individual graph node functions. Each takes the full ``TravelPlanState`` and
returns a *partial* state dict — LangGraph merges the result into the running
state. Keeping nodes pure-ish makes the graph easy to test in isolation.
"""

from __future__ import annotations

import asyncio
import json
import re
from datetime import date, timedelta
from typing import Any

from loguru import logger

from ai.state import TravelPlanState
from services import country as country_svc
from services import weather as weather_svc

# ── 1. gather context ─────────────────────────────────────────────────────────
async def gather_context_node(state: TravelPlanState) -> dict[str, Any]:
    trip = state["trip"]
    destination = trip["destination"]
    country_name = trip.get("country") or destination

    async def _safe(coro):
        try:
            return await coro
        except Exception as e:  # noqa: BLE001 — best-effort enrichment
            logger.warning(f"context fetch failed: {e}")
            return {}

    weather, country_info = await asyncio.gather(
        _safe(weather_svc.get_weather(destination)),
        _safe(country_svc.get_country(country_name)),
    )
    return {"weather": weather, "country_info": country_info, "attempts": 0}


# ── 2. build prompt ───────────────────────────────────────────────────────────
def build_prompt_node(state: TravelPlanState) -> dict[str, Any]:
    trip = state["trip"]
    days = (date.fromisoformat(trip["end_date"]) - date.fromisoformat(trip["start_date"])).days + 1

    saved = state.get("saved_places") or []
    saved_block = "\n".join(f"- {p['name']} ({p.get('category','')})" for p in saved) or "(none)"

    weather = state.get("weather") or {}
    weather_summary = (
        weather.get("current", {}).get("weather", [{}])[0].get("description", "n/a")
        if weather else "n/a"
    )

    prompt = f"""You are a travel planning assistant. Build a day-by-day itinerary.

Trip:
- Destination: {trip['destination']} ({trip.get('country','')})
- Dates: {trip['start_date']} → {trip['end_date']} ({days} days)
- Budget: {trip.get('budget','n/a')} {trip.get('currency','')}
- Notes / preferences: {state.get('preferences','none')}

Current weather: {weather_summary}

User-saved places (try to include them):
{saved_block}

Output STRICT JSON only — no prose, no code fences. Format:
{{
  "days": [
    {{
      "date": "YYYY-MM-DD",
      "activities": [
        {{"time":"HH:mm","title":"...","description":"...","place_name":"...optional..."}}
      ]
    }}
  ]
}}
Constraints:
- Exactly {days} day objects, dates must start at {trip['start_date']} and increment by 1.
- 3 to 5 activities per day, ordered chronologically.
- Times in 24h HH:mm.
"""
    return {"raw_plan": "", "structured_plan": [], "prompt": prompt}


# ── 3. generate plan (LLM call) ───────────────────────────────────────────────
async def generate_plan_node(state: TravelPlanState) -> dict[str, Any]:
    # Lazy import so importing this module never requires the LLM dep.
    from langchain_core.messages import HumanMessage
    from langchain_google_genai import ChatGoogleGenerativeAI

    from core.config import GOOGLE_API_KEY

    api_key = str(GOOGLE_API_KEY)
    if not api_key:
        return {"error": "GOOGLE_API_KEY not configured"}

    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        temperature=0.7,
        google_api_key=api_key,
    )
    prompt = state.get("prompt", "")  # type: ignore[arg-type]
    response = await llm.ainvoke([HumanMessage(content=prompt)])
    return {"raw_plan": response.content if hasattr(response, "content") else str(response)}


# ── 4. parse plan ─────────────────────────────────────────────────────────────
_JSON_RE = re.compile(r"\{[\s\S]*\}")


def parse_plan_node(state: TravelPlanState) -> dict[str, Any]:
    raw = state.get("raw_plan") or ""
    match = _JSON_RE.search(raw)
    if not match:
        return {"error": "LLM did not return JSON", "structured_plan": []}
    try:
        data = json.loads(match.group(0))
    except json.JSONDecodeError as e:
        return {"error": f"JSON parse error: {e}", "structured_plan": []}
    return {"structured_plan": data.get("days", []), "error": None}


# ── 5. validate plan ──────────────────────────────────────────────────────────
def validate_plan_node(state: TravelPlanState) -> dict[str, Any]:
    trip = state["trip"]
    plan = state.get("structured_plan") or []
    start = date.fromisoformat(trip["start_date"])
    end = date.fromisoformat(trip["end_date"])
    expected_days = (end - start).days + 1

    if len(plan) != expected_days:
        return {"error": f"Expected {expected_days} days, got {len(plan)}"}
    for i, day in enumerate(plan):
        try:
            actual = date.fromisoformat(day.get("date", ""))
        except ValueError:
            return {"error": f"Day {i+1}: invalid date"}
        if actual != start + timedelta(days=i):
            return {"error": f"Day {i+1}: date mismatch"}
        if not day.get("activities"):
            return {"error": f"Day {i+1}: no activities"}
    return {"error": None}


# ── 6. refine plan (one retry) ────────────────────────────────────────────────
async def refine_plan_node(state: TravelPlanState) -> dict[str, Any]:
    state["attempts"] = state.get("attempts", 0) + 1  # type: ignore[typeddict-item]
    # mutate the prompt with the validation error, then re-call generate
    err = state.get("error", "")
    state["prompt"] = (state.get("prompt", "") +  # type: ignore[typeddict-item]
                       f"\n\nPrevious attempt failed: {err}\nReturn corrected JSON only.")
    out = await generate_plan_node(state)
    return out


def should_retry(state: TravelPlanState) -> str:
    if state.get("error") and state.get("attempts", 0) < 1:
        return "refine"
    return "end"