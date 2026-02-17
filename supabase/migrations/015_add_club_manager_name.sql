-- Add manager_name column to clubs table
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS manager_name TEXT;
