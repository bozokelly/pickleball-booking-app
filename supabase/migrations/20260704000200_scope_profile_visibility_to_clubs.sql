-- Replace platform-wide authenticated profile reads with club-scoped reads.
-- Approved members can see same-club members and players booked into their
-- club games, while existing own-profile/admin/same-game policies remain.

CREATE OR REPLACE FUNCTION public.pii_fix_user_shares_approved_club_with_profile(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.club_members viewer
    JOIN public.club_members target
      ON target.club_id = viewer.club_id
    WHERE viewer.user_id = auth.uid()
      AND viewer.status::text = 'approved'
      AND target.user_id = p_profile_id
      AND target.status::text = 'approved'
  );
$$;

REVOKE ALL ON FUNCTION public.pii_fix_user_shares_approved_club_with_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pii_fix_user_shares_approved_club_with_profile(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.pii_fix_user_can_read_club_game_booking_profile(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.club_members viewer
    JOIN public.games g
      ON g.club_id = viewer.club_id
    JOIN public.bookings b
      ON b.game_id = g.id
    WHERE viewer.user_id = auth.uid()
      AND viewer.status::text = 'approved'
      AND b.user_id = p_profile_id
      AND b.status::text <> 'cancelled'
  );
$$;

REVOKE ALL ON FUNCTION public.pii_fix_user_can_read_club_game_booking_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pii_fix_user_can_read_club_game_booking_profile(uuid) TO authenticated;

DROP POLICY IF EXISTS "PII fix: approved members read same club profiles" ON public.profiles;
CREATE POLICY "PII fix: approved members read same club profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.pii_fix_user_shares_approved_club_with_profile(id));

DROP POLICY IF EXISTS "PII fix: approved members read club game profiles" ON public.profiles;
CREATE POLICY "PII fix: approved members read club game profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.pii_fix_user_can_read_club_game_booking_profile(id));

DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.profiles;
