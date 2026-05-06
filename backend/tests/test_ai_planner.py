"""
tests/test_ai_planner.py — TC-22..TC-24

Exercises the LangGraph node functions and the refine retry loop without
calling Gemini. ``generate_plan_node`` is monkeypatched per test.
"""

from __future__ import annotations

import json

import pytest

from ai import nodes


@pytest.fixture
def anyio_backend():
    return "asyncio"


# Helper trip dict matching the agent's expected shape
def _trip():
    return {
        "destination": "Lisboa",
        "country": "Portugal",
        "start_date": "2026-05-10",
        "end_date": "2026-05-11",
        "budget": 1000,
        "currency": "EUR",
        "status": "planning",
    }


# ── TC-22 ─────────────────────────────────────────────────────────────────────
def test_tc22_prompt_includes_weather_and_country():
    state = {
        "trip": _trip(),
        "weather": {"current": {"weather": [{"description": "sunny"}]}},
        "country_info": {"name": {"common": "Portugal"}, "capital": ["Lisbon"]},
        "saved_places": [{"name": "Belém Tower", "category": "tourist_attraction"}],
        "preferences": "vegetarian",
    }
    out = nodes.build_prompt_node(state)
    prompt = out["prompt"]

    assert "Lisboa" in prompt and "Portugal" in prompt
    assert "sunny" in prompt          # weather context propagated
    assert "Belém Tower" in prompt    # saved place propagated
    assert "vegetarian" in prompt     # user preferences propagated
    assert "2026-05-10" in prompt and "2026-05-11" in prompt


# ── TC-23 ─────────────────────────────────────────────────────────────────────
def test_tc23_parser_extracts_structured_plan_from_llm_json():
    valid_llm_output = json.dumps(
        {
            "days": [
                {
                    "date": "2026-05-10",
                    "activities": [
                        {"time": "09:00", "title": "Walk", "description": "Alfama"}
                    ],
                },
                {
                    "date": "2026-05-11",
                    "activities": [
                        {"time": "10:00", "title": "Museum", "description": "Gulbenkian"}
                    ],
                },
            ]
        }
    )
    state = {"raw_plan": valid_llm_output}
    out = nodes.parse_plan_node(state)
    assert out["error"] is None
    assert len(out["structured_plan"]) == 2
    assert out["structured_plan"][0]["date"] == "2026-05-10"


def test_tc23_parser_rejects_non_json():
    out = nodes.parse_plan_node({"raw_plan": "I am not JSON"})
    assert out["error"]
    assert out["structured_plan"] == []


def test_tc23_validator_catches_day_count_mismatch():
    state = {
        "trip": _trip(),  # 2 days
        "structured_plan": [{"date": "2026-05-10", "activities": [{"title": "x"}]}],
    }
    out = nodes.validate_plan_node(state)
    assert "Expected 2 days" in (out["error"] or "")


def test_tc23_validator_passes_for_correct_plan():
    state = {
        "trip": _trip(),
        "structured_plan": [
            {"date": "2026-05-10", "activities": [{"title": "x"}]},
            {"date": "2026-05-11", "activities": [{"title": "y"}]},
        ],
    }
    out = nodes.validate_plan_node(state)
    assert out["error"] is None


# ── TC-24 ─────────────────────────────────────────────────────────────────────
@pytest.mark.anyio
async def test_tc24_refine_retries_once_on_invalid_output(monkeypatch):
    """Simulate: first LLM call returns invalid plan (1 day), refine fixes it."""
    valid_two_days = json.dumps(
        {
            "days": [
                {"date": "2026-05-10", "activities": [{"title": "x"}]},
                {"date": "2026-05-11", "activities": [{"title": "y"}]},
            ]
        }
    )
    bad_one_day = json.dumps(
        {"days": [{"date": "2026-05-10", "activities": [{"title": "x"}]}]}
    )

    calls = {"n": 0}

    async def fake_generate(state):
        calls["n"] += 1
        return {"raw_plan": bad_one_day if calls["n"] == 1 else valid_two_days}

    monkeypatch.setattr(nodes, "generate_plan_node", fake_generate)

    # Drive the pipeline manually (mirrors what LangGraph does):
    state = {"trip": _trip(), "saved_places": [], "preferences": ""}
    state.update(await nodes.gather_context_node(state) if False else {"attempts": 0})
    state.update(nodes.build_prompt_node(state))
    state.update(await fake_generate(state))           # 1st generate
    state.update(nodes.parse_plan_node(state))
    state.update(nodes.validate_plan_node(state))
    assert state["error"], "first attempt should be invalid"
    decision = nodes.should_retry(state)
    assert decision == "refine"

    state.update(await nodes.refine_plan_node(state))  # refine -> 2nd generate
    state.update(nodes.parse_plan_node(state))
    state.update(nodes.validate_plan_node(state))

    assert state["error"] is None
    assert state["attempts"] == 1
    assert len(state["structured_plan"]) == 2
    assert nodes.should_retry(state) == "end"


def test_tc24_should_retry_caps_at_one_attempt():
    """After one retry, even invalid output ends the graph."""
    state = {"error": "still bad", "attempts": 1}
    assert nodes.should_retry(state) == "end"