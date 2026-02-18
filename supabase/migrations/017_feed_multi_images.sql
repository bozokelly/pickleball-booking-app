-- Migration: Add multiple image support to feed posts + link preview cache

-- Add array column for multiple images
ALTER TABLE feed_posts ADD COLUMN image_urls TEXT[] DEFAULT '{}';

-- Migrate existing single images into the array
UPDATE feed_posts SET image_urls = ARRAY[image_url] WHERE image_url IS NOT NULL;

-- Link preview cache table
CREATE TABLE IF NOT EXISTS link_previews (
  url TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  image_url TEXT,
  site_name TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for link_previews
ALTER TABLE link_previews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read link previews" ON link_previews FOR SELECT USING (true);
CREATE POLICY "Service role can insert link previews" ON link_previews FOR INSERT WITH CHECK (true);
