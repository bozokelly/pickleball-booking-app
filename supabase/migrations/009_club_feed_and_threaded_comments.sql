-- 1. Add club_id to feed_posts (nullable for now, but new posts should always have one)
ALTER TABLE feed_posts ADD COLUMN club_id uuid REFERENCES clubs(id) ON DELETE CASCADE;
CREATE INDEX idx_feed_posts_club_id ON feed_posts(club_id, created_at DESC);

-- 2. Add parent_id to feed_comments for threaded replies
ALTER TABLE feed_comments ADD COLUMN parent_id uuid REFERENCES feed_comments(id) ON DELETE CASCADE;
CREATE INDEX idx_feed_comments_parent_id ON feed_comments(parent_id);

-- 3. Update RLS: users can read posts from clubs they're members of (or public posts without club_id)
DROP POLICY IF EXISTS "Anyone can read posts" ON feed_posts;
CREATE POLICY "Users can read club posts" ON feed_posts FOR SELECT USING (
  club_id IS NULL
  OR EXISTS (
    SELECT 1 FROM club_members cm
    WHERE cm.club_id = feed_posts.club_id
    AND cm.user_id = auth.uid()
    AND cm.status = 'approved'
  )
  OR EXISTS (
    SELECT 1 FROM club_admins ca
    WHERE ca.club_id = feed_posts.club_id
    AND ca.user_id = auth.uid()
  )
);

-- 4. Users can only post to clubs they're members of
DROP POLICY IF EXISTS "Authenticated users can create posts" ON feed_posts;
CREATE POLICY "Members can create club posts" ON feed_posts FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND (
    club_id IS NULL
    OR EXISTS (
      SELECT 1 FROM club_members cm
      WHERE cm.club_id = feed_posts.club_id
      AND cm.user_id = auth.uid()
      AND cm.status = 'approved'
    )
    OR EXISTS (
      SELECT 1 FROM club_admins ca
      WHERE ca.club_id = feed_posts.club_id
      AND ca.user_id = auth.uid()
    )
  )
);
