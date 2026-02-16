-- Add requires_dupr flag to games
ALTER TABLE games ADD COLUMN requires_dupr boolean DEFAULT false;
