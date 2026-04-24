-- Migration 019: Drop legacy `location` column from clubs table.
-- The location column was a plain-text fallback added in the initial schema.
-- Structured address fields (venue_name, street_address, suburb, state, postcode, country)
-- were added in migrations 005 and 007 and are now the canonical address source.
-- The games table retains its own `location` column (per-game venue — unrelated).

ALTER TABLE public.clubs DROP COLUMN IF EXISTS location;
