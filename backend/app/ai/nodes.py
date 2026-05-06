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


# (provider, model) that succeeded most recently — short-circuits the fallback loop.
_LIVE_CHOICE: tuple[str, str] | None = None


def _is_model_error(exc: Exception) -> bool:
    """True if the exception looks like a model-name / availability problem
    that *might* be solved by trying a different model."""
    s = repr(exc).lower()
    return any(
        m in s
        for m in (
            "not_found",
            "invalid_argument",
            "unexpected model name",
            "is not found for api version",
            "is not supported",
            "permission_denied",
            # Per-model quota — different models have separate buckets in
            # the Google AI Studio free tier, so it's worth trying the next.
            "resource_exhausted",
            "quota exceeded",
            "429",
        )
    )


def _is_quota_error(exc: Exception) -> bool:
    """Specifically a 429 / RESOURCE_EXHAUSTED — used to surface a friendlier
    client-facing error after all fallbacks are exhausted."""
    s = repr(exc).lower()
    return "resource_exhausted" in s or "429" in s or "quota exceeded" in s


def _build_llm(provider: str, model: str):
    """Factory: return a configured LangChain chat client for the provider.

    Important: every provider here is created with ``max_retries=0`` and a
    short ``timeout``. We want 429/503 errors to surface to our outer fallback
    loop *immediately*, instead of being swallowed by each SDK's internal
    exponential-backoff retry. Otherwise the request hangs for 30-60 s on a
    single provider and never tries the next one.
    """
    from core.config import (
        GOOGLE_API_KEY,
        GROQ_API_KEY,
        OPENROUTER_API_KEY,
    )

    if provider == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI
        key = str(GOOGLE_API_KEY)
        if not key:
            return None
        return ChatGoogleGenerativeAI(
            model=model,
            temperature=0.7,
            google_api_key=key,
            max_retries=0,
            timeout=30,
        )

    if provider == "groq":
        try:
            from langchain_groq import ChatGroq
        except ImportError:
            logger.warning("langchain-groq not installed; skipping groq provider")
            return None
        key = str(GROQ_API_KEY)
        if not key:
            return None
        return ChatGroq(
            model=model,
            temperature=0.7,
            api_key=key,
            max_retries=0,
            timeout=30,
        )

    if provider == "openrouter":
        # OpenRouter implements the OpenAI Chat Completions API.
        try:
            from langchain_openai import ChatOpenAI
        except ImportError:
            logger.warning("langchain-openai not installed; skipping openrouter provider")
            return None
        key = str(OPENROUTER_API_KEY)
        if not key:
            return None
        return ChatOpenAI(
            model=model,
            temperature=0.7,
            api_key=key,
            base_url="https://openrouter.ai/api/v1",
            max_retries=0,
            timeout=30,
        )

    logger.warning(f"Unknown AI provider: {provider!r}")
    return None


def _candidates() -> list[tuple[str, str]]:
    """Build (provider, model) attempt list, deduped, with cached live choice first."""
    from core.config import (
        AI_PROVIDERS,
        GEMINI_FALLBACKS,
        GEMINI_MODEL,
        GROQ_FALLBACKS,
        GROQ_MODEL,
        OPENROUTER_FALLBACKS,
        OPENROUTER_MODEL,
    )

    per_provider: dict[str, list[str]] = {
        "gemini":     [GEMINI_MODEL, *GEMINI_FALLBACKS],
        "groq":       [GROQ_MODEL, *GROQ_FALLBACKS],
        "openrouter": [OPENROUTER_MODEL, *OPENROUTER_FALLBACKS],
    }
    out: list[tuple[str, str]] = []
    if _LIVE_CHOICE:
        out.append(_LIVE_CHOICE)
    for provider in AI_PROVIDERS:
        provider = provider.strip().lower()
        for model in per_provider.get(provider, []):
            pair = (provider, model)
            if pair not in out:
                out.append(pair)
    return out


# ── 3. generate plan (LLM call) ───────────────────────────────────────────────
async def generate_plan_node(state: TravelPlanState) -> dict[str, Any]:
    from langchain_core.messages import HumanMessage

    prompt = state.get("prompt", "")  # type: ignore[arg-type]
    if not prompt:
        return {"error": "prompt was empty before LLM call"}

    global _LIVE_CHOICE
    attempts = _candidates()
    if not attempts:
        return {"error": "no AI provider configured (set GROQ_API_KEY / OPENROUTER_API_KEY / GOOGLE_API_KEY)"}

    last_err: Exception | None = None
    tried: list[str] = []
    for provider, model in attempts:
        llm = _build_llm(provider, model)
        if llm is None:
            continue  # provider not configured — silently skip
        tried.append(f"{provider}:{model}")
        try:
            response = await llm.ainvoke([HumanMessage(content=prompt)])
        except Exception as exc:  # noqa: BLE001 — broad on purpose
            last_err = exc
            if _is_model_error(exc):
                logger.warning(f"{provider}:{model} failed ({exc}); trying next.")
                continue
            return {"error": f"LLM call failed on {provider}:{model}: {exc}"}

        # Success — cache the working pair.
        _LIVE_CHOICE = (provider, model)
        if len(tried) > 1:
            logger.info(f"AI fallback active: settled on {provider}:{model} after {tried[:-1]}")
        content = response.content if hasattr(response, "content") else str(response)
        return {"raw_plan": content}

    if last_err is not None and _is_quota_error(last_err):
        return {
            "error": "quota_exhausted",
            "error_detail": (
                f"Todos os providers de IA esgotaram quota / estão indisponíveis "
                f"(tentados: {tried}). Tente novamente em alguns minutos ou "
                f"configure outra GROQ_API_KEY / OPENROUTER_API_KEY no Render."
            ),
        }
    return {
        "error": (
            f"All AI providers failed (tried {tried or 'none — no key configured'}). "
            f"Last error: {last_err}"
        )
    }


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