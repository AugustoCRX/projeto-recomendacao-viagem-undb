"""
tests/test_trips.py — TC-08..TC-17

Trips CRUD + ownership scoping, plus the places & itinerary integration tests.
"""

from datetime import date, timedelta


_TRIP = {
    "name": "Lisboa em maio",
    "destination": "Lisboa",
    "country": "Portugal",
    "start_date": "2026-05-10",
    "end_date": "2026-05-15",
    "budget": 3000,
    "currency": "EUR",
}


def _create_trip(client, headers, **overrides):
    payload = {**_TRIP, **overrides}
    r = client.post("/api/v1/trips", json=payload, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()


# ── TC-08 ─────────────────────────────────────────────────────────────────────
def test_tc08_create_trip_valid(client, auth_headers):
    trip = _create_trip(client, auth_headers)
    assert trip["destination"] == "Lisboa"
    assert trip["status"] == "planning"
    assert trip["id"]


# ── TC-09 ─────────────────────────────────────────────────────────────────────
def test_tc09_create_trip_invalid_dates(client, auth_headers):
    r = client.post(
        "/api/v1/trips",
        json={**_TRIP, "start_date": "2026-05-15", "end_date": "2026-05-10"},
        headers=auth_headers,
    )
    assert r.status_code == 422


# ── TC-10 ─────────────────────────────────────────────────────────────────────
def test_tc10_list_trips_scoped_to_user(client, register_user):
    _, token_a = register_user(email="a@example.com")
    _, token_b = register_user(email="b@example.com")
    ha = {"Authorization": f"Bearer {token_a}"}
    hb = {"Authorization": f"Bearer {token_b}"}
    _create_trip(client, ha, name="Trip A")
    _create_trip(client, hb, name="Trip B")

    list_a = client.get("/api/v1/trips", headers=ha).json()
    list_b = client.get("/api/v1/trips", headers=hb).json()
    assert {t["name"] for t in list_a} == {"Trip A"}
    assert {t["name"] for t in list_b} == {"Trip B"}


# ── TC-11 ─────────────────────────────────────────────────────────────────────
def test_tc11_get_trip_by_id_owner_only(client, register_user):
    _, ta = register_user(email="owner@example.com")
    _, tb = register_user(email="stranger@example.com")
    ha = {"Authorization": f"Bearer {ta}"}
    hb = {"Authorization": f"Bearer {tb}"}
    trip = _create_trip(client, ha)

    assert client.get(f"/api/v1/trips/{trip['id']}", headers=ha).status_code == 200
    assert client.get(f"/api/v1/trips/{trip['id']}", headers=hb).status_code == 404


# ── TC-12 ─────────────────────────────────────────────────────────────────────
def test_tc12_status_transitions(client, auth_headers):
    trip = _create_trip(client, auth_headers)
    tid = trip["id"]
    for new_status in ("confirmed", "ongoing", "completed"):
        r = client.put(
            f"/api/v1/trips/{tid}",
            json={"status": new_status},
            headers=auth_headers,
        )
        assert r.status_code == 200
        assert r.json()["status"] == new_status


# ── TC-13 ─────────────────────────────────────────────────────────────────────
def test_tc13_delete_trip_cascades(client, auth_headers, db_session):
    from models.itinerary import ItineraryItem
    from models.place import Place
    from models.trip import Trip

    trip = _create_trip(client, auth_headers)
    tid = trip["id"]

    client.post(
        "/api/v1/places",
        json={"trip_id": tid, "name": "Belém Tower", "category": "tourist_attraction"},
        headers=auth_headers,
    )
    client.post(
        "/api/v1/itinerary",
        json={"trip_id": tid, "date": "2026-05-10", "title": "Walk", "order": 0},
        headers=auth_headers,
    )

    r = client.delete(f"/api/v1/trips/{tid}", headers=auth_headers)
    assert r.status_code == 204

    db_session.expire_all()
    assert db_session.query(Trip).count() == 0
    assert db_session.query(Place).count() == 0
    assert db_session.query(ItineraryItem).count() == 0


# ── TC-14 ─────────────────────────────────────────────────────────────────────
def test_tc14_save_place_to_owned_trip(client, auth_headers):
    trip = _create_trip(client, auth_headers)
    r = client.post(
        "/api/v1/places",
        json={"trip_id": trip["id"], "name": "Castelo de São Jorge"},
        headers=auth_headers,
    )
    assert r.status_code == 201
    assert r.json()["name"] == "Castelo de São Jorge"


# ── TC-15 ─────────────────────────────────────────────────────────────────────
def test_tc15_save_place_to_other_users_trip(client, register_user):
    _, ta = register_user(email="a2@example.com")
    _, tb = register_user(email="b2@example.com")
    ha = {"Authorization": f"Bearer {ta}"}
    hb = {"Authorization": f"Bearer {tb}"}

    trip = _create_trip(client, ha)
    r = client.post(
        "/api/v1/places",
        json={"trip_id": trip["id"], "name": "Sneaky"},
        headers=hb,
    )
    # ownership-blind: 404 (we don't leak existence to other users)
    assert r.status_code == 404


# ── TC-16 ─────────────────────────────────────────────────────────────────────
def test_tc16_create_itinerary_item_within_range(client, auth_headers):
    trip = _create_trip(client, auth_headers)
    r = client.post(
        "/api/v1/itinerary",
        json={
            "trip_id": trip["id"],
            "date": "2026-05-12",
            "time": "09:30",
            "title": "Tram 28",
            "order": 0,
        },
        headers=auth_headers,
    )
    assert r.status_code == 201
    body = r.json()
    assert body["date"] == "2026-05-12"
    assert body["time"] == "09:30"


# ── TC-17 ─────────────────────────────────────────────────────────────────────
def test_tc17_itinerary_grouped_by_day_ordered(client, auth_headers):
    trip = _create_trip(client, auth_headers)
    tid = trip["id"]

    # Insert out of order on purpose
    items = [
        {"date": "2026-05-12", "time": "14:00", "title": "Belém", "order": 1},
        {"date": "2026-05-10", "time": "09:00", "title": "Alfama", "order": 0},
        {"date": "2026-05-12", "time": "09:00", "title": "Tram", "order": 0},
        {"date": "2026-05-10", "time": "20:00", "title": "Dinner", "order": 1},
    ]
    for it in items:
        client.post("/api/v1/itinerary", json={"trip_id": tid, **it}, headers=auth_headers)

    r = client.get(f"/api/v1/itinerary/{tid}", headers=auth_headers)
    assert r.status_code == 200
    days = r.json()
    assert [d["day_number"] for d in days] == [1, 2]
    assert [d["date"] for d in days] == ["2026-05-10", "2026-05-12"]
    # order field drives intra-day sort
    assert [a["title"] for a in days[0]["activities"]] == ["Alfama", "Dinner"]
    assert [a["title"] for a in days[1]["activities"]] == ["Tram", "Belém"]


# ── TC-26 (schema integrity) ──────────────────────────────────────────────────
def test_tc26_schema_integrity(db_engine):
    """``Base.metadata.create_all`` must produce the same tables as schema.sql."""
    from sqlalchemy import inspect

    expected = {"users", "trips", "places", "itinerary_items"}
    actual = set(inspect(db_engine).get_table_names())
    missing = expected - actual
    assert not missing, f"missing tables: {missing}"
