"""
ai/agent.py
───────────
Builds and compiles the LangGraph ``StateGraph`` for travel-plan generation.

Flow:
    gather_context → build_prompt → generate_plan → parse_plan → validate_plan
                                                                       │
                              ┌───── error & attempts<1 ──────┐        │
                              ▼                               │        │
                          refine_plan ──────► parse_plan ─────┘        │
                                                                       ▼
                                                                      END
"""

from functools import lru_cache

from langgraph.graph import END, StateGraph

from ai.nodes import (
    build_prompt_node,
    gather_context_node,
    generate_plan_node,
    parse_plan_node,
    refine_plan_node,
    should_retry,
    validate_plan_node,
)
from ai.state import TravelPlanState


@lru_cache(maxsize=1)
def get_agent():
    g: StateGraph = StateGraph(TravelPlanState)

    g.add_node("gather_context", gather_context_node)
    g.add_node("build_prompt", build_prompt_node)
    g.add_node("generate_plan", generate_plan_node)
    g.add_node("parse_plan", parse_plan_node)
    g.add_node("validate_plan", validate_plan_node)
    g.add_node("refine_plan", refine_plan_node)

    g.set_entry_point("gather_context")
    g.add_edge("gather_context", "build_prompt")
    g.add_edge("build_prompt", "generate_plan")
    g.add_edge("generate_plan", "parse_plan")
    g.add_edge("parse_plan", "validate_plan")
    g.add_conditional_edges(
        "validate_plan",
        should_retry,
        {"refine": "refine_plan", "end": END},
    )
    g.add_edge("refine_plan", "parse_plan")

    return g.compile()
