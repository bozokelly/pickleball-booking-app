-- Add geographic coordinates to games for map display
ALTER TABLE public.games
  ADD COLUMN latitude numeric,
  ADD COLUMN longitude numeric;
