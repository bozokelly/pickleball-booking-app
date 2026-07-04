-- Approved club members can view other approved memberships in the same club.
-- This keeps club directories and DUPR/profile joins working without restoring
-- public or platform-wide member visibility.

CREATE OR REPLACE FUNCTION public.pii_fix_user_is_approved_member_of_club(p_club_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.club_members cm
    WHERE cm.club_id = p_club_id
      AND cm.user_id = auth.uid()
      AND cm.status::text = 'approved'
  );
$$;

REVOKE ALL ON FUNCTION public.pii_fix_user_is_approved_member_of_club(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pii_fix_user_is_approved_member_of_club(uuid) TO authenticated;

DROP POLICY IF EXISTS "PII fix: approved members read same club memberships" ON public.club_members;
CREATE POLICY "PII fix: approved members read same club memberships"
  ON public.club_members
  FOR SELECT
  TO authenticated
  USING (
    status::text = 'approved'
    AND public.pii_fix_user_is_approved_member_of_club(club_id)
  );
