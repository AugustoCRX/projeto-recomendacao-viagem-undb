"""views/ai.py — POST /ai/generate-plan, GET /ai/plan/{trip_id}."""

from typing import Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from deps import get_current_user, get_db
from models.itinerary import ItineraryItem
from models.place import Place
from models.trip import Trip
from models.user import User
from schemas.itinerary import ItemResponse

router = APIRouter()


class GeneratePlanRequest(BaseModel):
    trip_id: UUID
    preferences: Optional[str] = Field(None, max_length=1000)
    persist: bool = True  # save plan as ItineraryItems


class GeneratePlanResponse(BaseModel):
    trip_id: UUID
    plan: list[dict[str, Any]]
    saved_items: list[ItemResponse]


def _trip_to_dict(trip: Trip) -> dict[str, Any]:
    return {
        "destination": trip.destination,
        "country": trip.country,
        "start_date": trip.start_date.isoformat(),
        "end_date": trip.end_date.isoformat(),
        "budget": float(trip.budget) if trip.budget is not None else None,
        "currency": trip.currency,
        "status": trip.status,
    }


@router.post(
    "/generate-plan",
    response_model=GeneratePlanResponse,
    summary="Generate an AI-powered itinerary for a trip",
    description=(
        "Runs a LangGraph agent (Google Gemini Flash) that gathers weather + country "
        "context, considers saved places, and produces a day-by-day plan. "
        "If ``persist=true`` (default) the plan is also stored as ItineraryItems."
    ),
    responses={
        200: {"description": "Plan generated"},
        404: {"description": "Trip not found"},
        503: {"description": "AI backend not configured"},
    },
)
async def generate_plan(
    payload: GeneratePlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GeneratePlanResponse:
    trip = (
        db.query(Trip)
        .filter(Trip.id == payload.trip_id, Trip.user_id == current_user.id)
        .first()
    )
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    saved_places = (
        db.query(Place).filter(Place.trip_id == trip.id).order_by(Place.saved_at.desc()).all()
    )

    from ai.agent import get_agent
    from ai.state import TravelPlanState

    initial: TravelPlanState = {
        "trip": _trip_to_dict(trip),
        "saved_places": [
            {"name": p.name, "category": p.category, "address": p.address} for p in saved_places
        ],
        "preferences": payload.preferences or "",
    }
    agent = get_agent()
    try:
        final_state = await agent.ainvoke(initial)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=503, detail=f"AI backend error: {e}")

    if final_state.get("error"):
        raise HTTPException(status_code=422, detail=final_state["error"])

    plan = final_state.get("structured_plan", [])
    saved: list[ItineraryItem] = []
    if payload.persist and plan:
        # Wipe previous AI plan for this trip? Keep simple: just append.
        for day in plan:
            for order, act in enumerate(day.get("activities", [])):
                saved.append(
                    ItineraryItem(
                        trip_id=trip.id,
                        user_id=current_user.id,
                        date=day["date"],
                        time=act.get("time"),
                        title=act.get("title", "Activity"),
                        description=act.get("description"),
                        order=order,
                    )
                )
        db.add_all(saved)
        db.commit()
        for item in saved:
            db.refresh(item)

    return GeneratePlanResponse(
        trip_id=trip.id,
        plan=plan,
        saved_items=[ItemResponse.model_validate(i) for i in saved],
    )


@router.get(
    "/plan/{trip_id}",
    response_model=list[ItemResponse],
    summary="Fetch the latest persisted itinerary for a trip",
    responses={404: {"description": "Trip not found"}},
)
def get_plan(
    trip_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ItemResponse]:
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    rows = (
        db.query(ItineraryItem)
        .filter(ItineraryItem.trip_id == trip_id)
        .order_by(ItineraryItem.date.asc(), ItineraryItem.order.asc())
        .all()
    )
    return [ItemResponse.model_validate(r) for r in rows]
