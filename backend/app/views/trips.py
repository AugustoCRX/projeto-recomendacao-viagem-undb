"""views/trips.py — CRUD endpoints for /trips, scoped to the authenticated user."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from deps import get_current_user, get_db
from models.trip import Trip
from models.user import User
from schemas.trip import TripCreate, TripResponse, TripUpdate

router = APIRouter()


def _get_owned_trip(db: Session, trip_id: UUID, user_id: UUID) -> Trip:
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == user_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.post(
    "",
    response_model=TripResponse,
    status_code=201,
    summary="Create a trip",
    description=(
        "Creates a trip for the authenticated user. Defaults: status='planning', "
        "currency='BRL'. start_date must be ≤ end_date."
    ),
    responses={
        201: {"description": "Trip created"},
        401: {"description": "Not authenticated"},
        422: {"description": "Validation error"},
    },
)
def create_trip(
    payload: TripCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TripResponse:
    trip = Trip(user_id=current_user.id, **payload.model_dump())
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return TripResponse.model_validate(trip)


@router.get(
    "",
    response_model=list[TripResponse],
    summary="List the authenticated user's trips",
    description="Returns trips owned by the current user, newest first.",
)
def list_trips(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[TripResponse]:
    rows = (
        db.query(Trip)
        .filter(Trip.user_id == current_user.id)
        .order_by(Trip.created_at.desc())
        .all()
    )
    return [TripResponse.model_validate(t) for t in rows]


@router.get(
    "/{trip_id}",
    response_model=TripResponse,
    summary="Get a trip by id",
    responses={404: {"description": "Trip not found or not owned by user"}},
)
def get_trip(
    trip_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TripResponse:
    return TripResponse.model_validate(_get_owned_trip(db, trip_id, current_user.id))


@router.put(
    "/{trip_id}",
    response_model=TripResponse,
    summary="Update a trip",
    description="Partial update. Any subset of fields may be sent.",
    responses={404: {"description": "Trip not found"}, 422: {"description": "Validation error"}},
)
def update_trip(
    trip_id: UUID,
    payload: TripUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TripResponse:
    trip = _get_owned_trip(db, trip_id, current_user.id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(trip, field, value)
    if trip.end_date and trip.start_date and trip.end_date < trip.start_date:
        raise HTTPException(status_code=422, detail="end_date must be ≥ start_date")
    db.commit()
    db.refresh(trip)
    return TripResponse.model_validate(trip)


@router.delete(
    "/{trip_id}",
    status_code=204,
    summary="Delete a trip",
    description="Cascades to places and itinerary items via FK ON DELETE CASCADE.",
    responses={204: {"description": "Trip deleted"}, 404: {"description": "Trip not found"}},
)
def delete_trip(
    trip_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trip = _get_owned_trip(db, trip_id, current_user.id)
    db.delete(trip)
    db.commit()
    return None
