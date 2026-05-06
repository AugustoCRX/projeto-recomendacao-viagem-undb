"""views/places.py — save/list/remove user-curated places per trip."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from deps import get_current_user, get_db
from models.place import Place
from models.trip import Trip
from models.user import User
from schemas.place import PlaceCreate, PlaceResponse

router = APIRouter()


@router.post(
    "",
    response_model=PlaceResponse,
    status_code=201,
    summary="Save a place to a trip",
    description="Trip ownership is enforced — saving a place to someone else's trip returns 404.",
    responses={201: {"description": "Place saved"}, 404: {"description": "Trip not found"}},
)
def create_place(
    payload: PlaceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PlaceResponse:
    trip = (
        db.query(Trip)
        .filter(Trip.id == payload.trip_id, Trip.user_id == current_user.id)
        .first()
    )
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    place = Place(user_id=current_user.id, **payload.model_dump())
    db.add(place)
    db.commit()
    db.refresh(place)
    return PlaceResponse.model_validate(place)


@router.get(
    "/{trip_id}",
    response_model=list[PlaceResponse],
    summary="List places saved for a trip",
    responses={404: {"description": "Trip not found"}},
)
def list_places(
    trip_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[PlaceResponse]:
    trip = (
        db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    )
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    rows = (
        db.query(Place)
        .filter(Place.trip_id == trip_id)
        .order_by(Place.saved_at.desc())
        .all()
    )
    return [PlaceResponse.model_validate(p) for p in rows]


@router.delete(
    "/{place_id}",
    status_code=204,
    summary="Remove a saved place",
    responses={204: {"description": "Place removed"}, 404: {"description": "Place not found"}},
)
def delete_place(
    place_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    place = (
        db.query(Place).filter(Place.id == place_id, Place.user_id == current_user.id).first()
    )
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")
    db.delete(place)
    db.commit()
    return None
