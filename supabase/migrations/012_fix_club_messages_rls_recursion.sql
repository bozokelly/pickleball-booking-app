-- Fix infinite recursion in club_messages RLS policy
-- The "Users can read replies" policy was querying club_messages from within
-- a club_messages RLS policy, causing infinite recursion.

DROP POLICY "Users can read replies to their messages" ON club_messages;

-- Helper function that bypasses RLS to check parent message ownership
CREATE OR REPLACE FUNCTION public.is_parent_message_sender(p_parent_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.club_messages WHERE id = p_parent_id AND sender_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Recreate the policy using the helper function (no recursion)
CREATE POLICY "Users can read replies to their messages" ON club_messages FOR SELECT USING (
  parent_id IS NOT NULL AND public.is_parent_message_sender(parent_id)
);
