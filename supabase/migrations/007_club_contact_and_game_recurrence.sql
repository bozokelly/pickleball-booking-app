-- Club contact fields
ALTER TABLE public.clubs
  ADD COLUMN contact_email text,
  ADD COLUMN contact_phone text,
  ADD COLUMN website text;

-- Game visibility and recurrence
ALTER TABLE public.games
  ADD COLUMN visible_from timestamptz,
  ADD COLUMN recurrence_group_id uuid;

CREATE INDEX idx_games_visible_from ON public.games(visible_from) WHERE status = 'upcoming';
CREATE INDEX idx_games_recurrence_group ON public.games(recurrence_group_id) WHERE recurrence_group_id IS NOT NULL;
