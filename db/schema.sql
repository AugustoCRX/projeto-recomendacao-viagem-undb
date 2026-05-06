-- ============================================================================
--  Smart Travel Planner — PostgreSQL schema
-- ----------------------------------------------------------------------------
--  Target: PostgreSQL 14+ (Supabase). Idempotent: CREATE ... IF NOT EXISTS.
--  Apply with:  psql "$DATABASE_URL" -f db/schema.sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()

-- ── users ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_users_email ON users (email);

-- ── trips ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trips (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(255)  NOT NULL,
    destination VARCHAR(255)  NOT NULL,
    country     VARCHAR(100),
    start_date  DATE          NOT NULL,
    end_date    DATE          NOT NULL,
    budget      NUMERIC(12,2),
    currency    VARCHAR(10)   NOT NULL DEFAULT 'BRL',
    status      VARCHAR(20)   NOT NULL DEFAULT 'planning'
                CHECK (status IN ('planning','confirmed','ongoing','completed','cancelled')),
    notes       TEXT,
    cover_photo TEXT,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT  ck_trips_dates CHECK (end_date >= start_date)
);
CREATE INDEX IF NOT EXISTS ix_trips_user_id      ON trips (user_id);
CREATE INDEX IF NOT EXISTS ix_trips_user_status  ON trips (user_id, status);

-- ── places ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS places (
    id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id    UUID          NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id    UUID          NOT NULL REFERENCES users(id),
    name       VARCHAR(255)  NOT NULL,
    address    TEXT,
    lat        NUMERIC(10,7),
    lng        NUMERIC(10,7),
    category   VARCHAR(50)   NOT NULL DEFAULT 'tourist_attraction'
               CHECK (category IN ('tourist_attraction','restaurant','lodging','other')),
    place_id   VARCHAR(255),
    saved_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_places_trip_id    ON places (trip_id);
CREATE INDEX IF NOT EXISTS ix_places_trip_saved ON places (trip_id, saved_at DESC);

-- ── itinerary_items ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS itinerary_items (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id     UUID          NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id     UUID          NOT NULL REFERENCES users(id),
    place_id    UUID          REFERENCES places(id) ON DELETE SET NULL,
    date        DATE          NOT NULL,
    time        VARCHAR(5),
    title       VARCHAR(255)  NOT NULL,
    description TEXT,
    "order"     INTEGER       NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_itinerary_trip_id          ON itinerary_items (trip_id);
CREATE INDEX IF NOT EXISTS ix_itinerary_trip_date_order  ON itinerary_items (trip_id, date, "order");

-- ── updated_at trigger helper ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated      ON users;
DROP TRIGGER IF EXISTS trg_trips_updated      ON trips;
DROP TRIGGER IF EXISTS trg_itinerary_updated  ON itinerary_items;
CREATE TRIGGER trg_users_updated      BEFORE UPDATE ON users           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_trips_updated      BEFORE UPDATE ON trips           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_itinerary_updated  BEFORE UPDATE ON itinerary_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();
