"""views/itinerary.py — itinerary item CRUD with day-grouped GET."""

from itertools import groupby
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from deps import get_current_user, get_db
from models.itinerary import ItineraryItem
from models.trip import Trip
from models.user import User
from schemas.itinerary import DayResponse, ItemCreate, ItemResponse, ItemUpdate

router = APIRouter()


def _check_trip_ownership(db: Session, trip_id: UUID, user_id: UUID) -> Trip:
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == user_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.post(
    "",
    response_model=ItemResponse,
    status_code=201,
    summary="Add an activity to a trip's itinerary",
    responses={201: {"description": "Activity added"}, 404: {"description": "Trip not found"}},
)
def create_item(
    payload: ItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ItemResponse:
    _check_trip_ownership(db, payload.trip_id, current_user.id)
    item = ItineraryItem(user_id=current_user.id, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return ItemResponse.model_validate(item)


@router.get(
    "/{trip_id}",
    response_model=list[DayResponse],
    summary="Get a trip's itinerary grouped by day",
    description="Returns an array of days, each with ``date``, ``day_number`` (1-indexed), and ``activities``.",
    responses={404: {"description": "Trip not found"}},
)
def list_by_day(
    trip_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[DayResponse]:
    _check_trip_ownership(db, trip_id, current_user.id)
    rows = (
        db.query(ItineraryItem)
        .filter(ItineraryItem.trip_id == trip_id)
        .order_by(ItineraryItem.date.asc(), ItineraryItem.order.asc())
        .all()
    )
    out: list[DayResponse] = []
    for idx, (day, items) in enumerate(groupby(rows, key=lambda r: r.date), start=1):
        out.append(
            DayResponse(
                date=day,
                day_number=idx,
                activities=[ItemResponse.model_validate(i) for i in items],
            )
        )
    return out


@router.put(
    "/{item_id}",
    response_model=ItemResponse,
    summary="Update an itinerary activity",
    responses={404: {"description": "Activity not found"}},
)
def update_item(
    item_id: UUID,
    payload: ItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ItemResponse:
    item = (
        db.query(ItineraryItem)
        .filter(ItineraryItem.id == item_id, ItineraryItem.user_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Activity not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return ItemResponse.model_validate(item)


@router.delete(
    "/{item_id}",
    status_code=204,
    summary="Delete an itinerary activity",
    responses={204: {"description": "Activity removed"}, 404: {"description": "Activity not found"}},
)
def delete_item(
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = (
        db.query(ItineraryItem)
        .filter(ItineraryItem.id == item_id, ItineraryItem.user_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Activity not found")
    db.delete(item)
    db.commit()
    return None
