-- Migration 020: Add structured address and game-settings columns to clubs.
--
-- win_condition and default_court_count were added to the iOS app's SELECT query
-- but were never in a migration (added directly via the dashboard on the BookadinkV2
-- Supabase project). venue_name, street_address, suburb, state, postcode, country
-- are the structured address fields replacing the legacy `location` column (dropped
-- in migration 019).
--
-- All additions use IF NOT EXISTS so this is safe to re-run.

ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS win_condition TEXT DEFAULT 'first_to_11_by2',
  ADD COLUMN IF NOT EXISTS default_court_count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS venue_name TEXT,
  ADD COLUMN IF NOT EXISTS street_address TEXT,
  ADD COLUMN IF NOT EXISTS suburb TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS postcode TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT;
