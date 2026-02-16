-- 1. Extend notification type enum
ALTER TYPE notification_type ADD VALUE 'membership_request';
ALTER TYPE notification_type ADD VALUE 'new_game_available';
ALTER TYPE notification_type ADD VALUE 'new_club_message';
ALTER TYPE notification_type ADD VALUE 'club_message_reply';

-- 2. Track email delivery
ALTER TABLE notifications ADD COLUMN email_sent boolean DEFAULT false;

-- 3. Club messages table
CREATE TABLE club_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES club_messages(id) ON DELETE SET NULL,
  subject text NOT NULL,
  body text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_club_messages_club_id ON club_messages(club_id, created_at DESC);
CREATE INDEX idx_club_messages_sender_id ON club_messages(sender_id);

-- 4. RLS for club_messages
ALTER TABLE club_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own messages" ON club_messages FOR SELECT USING (auth.uid() = sender_id);
CREATE POLICY "Admins can read club messages" ON club_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM club_admins WHERE club_admins.club_id = club_messages.club_id AND club_admins.user_id = auth.uid())
);
CREATE POLICY "Users can read replies to their messages" ON club_messages FOR SELECT USING (
  parent_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM club_messages parent WHERE parent.id = club_messages.parent_id AND parent.sender_id = auth.uid()
  )
);
CREATE POLICY "Users can send messages" ON club_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Admins can update read status" ON club_messages FOR UPDATE USING (
  EXISTS (SELECT 1 FROM club_admins WHERE club_admins.club_id = club_messages.club_id AND club_admins.user_id = auth.uid())
);

-- 5. Helper RPCs for bulk notification insertion
CREATE OR REPLACE FUNCTION notify_club_admins(
  p_club_id uuid, p_title text, p_body text, p_type notification_type, p_reference_id uuid DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO notifications (user_id, title, body, type, reference_id)
  SELECT ca.user_id, p_title, p_body, p_type, p_reference_id FROM club_admins ca WHERE ca.club_id = p_club_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION notify_club_members(
  p_club_id uuid, p_title text, p_body text, p_type notification_type, p_reference_id uuid DEFAULT NULL, p_exclude_user_id uuid DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO notifications (user_id, title, body, type, reference_id)
  SELECT cm.user_id, p_title, p_body, p_type, p_reference_id
  FROM club_members cm
  WHERE cm.club_id = p_club_id AND cm.status = 'approved' AND (p_exclude_user_id IS NULL OR cm.user_id != p_exclude_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Enable Realtime on notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
