"""ai/state.py — shared mutable state passed between LangGraph nodes."""

from typing import Any, Optional, TypedDict


class TravelPlanState(TypedDict, total=False):
    trip: dict[str, Any]                   # destination, dates, budget, status
    weather: dict[str, Any]                # from services.weather
    country_info: dict[str, Any]           # from services.country
    saved_places: list[dict[str, Any]]     # user's saved places
    preferences: str                       # free-text user preferences

    raw_plan: str                          # raw LLM JSON string
    structured_plan: list[dict[str, Any]]  # validated days[]
    attempts: int                          # retry counter (max 1 refine)
    error: Optional[str]
