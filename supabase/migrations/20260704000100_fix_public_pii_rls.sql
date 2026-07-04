-- Remove broad public reads from PII-bearing tables and replace them with
-- least-privilege read access for users, club admins, and booked game players.

CREATE OR REPLACE FUNCTION public.pii_fix_user_has_active_booking_for_game(p_game_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.game_id = p_game_id
      AND b.user_id = auth.uid()
      AND b.status::text <> 'cancelled'
  );
$$;

REVOKE ALL ON FUNCTION public.pii_fix_user_has_active_booking_for_game(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pii_fix_user_has_active_booking_for_game(uuid) TO authenticated;

-- profiles ------------------------------------------------------------------
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

DROP POLICY IF EXISTS "PII fix: users can read own profile" ON public.profiles;
CREATE POLICY "PII fix: users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "PII fix: club admins can read connected profiles" ON public.profiles;
CREATE POLICY "PII fix: club admins can read connected profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.club_members cm
      JOIN public.club_admins ca ON ca.club_id = cm.club_id
      WHERE cm.user_id = profiles.id
        AND ca.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.bookings b
      JOIN public.games g ON g.id = b.game_id
      JOIN public.club_admins ca ON ca.club_id = g.club_id
      WHERE b.user_id = profiles.id
        AND ca.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "PII fix: booked players can read fellow player profiles" ON public.profiles;
CREATE POLICY "PII fix: booked players can read fellow player profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.user_id = profiles.id
        AND b.status::text <> 'cancelled'
        AND public.pii_fix_user_has_active_booking_for_game(b.game_id)
    )
  );

-- bookings ------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view bookings for games" ON public.bookings;

DROP POLICY IF EXISTS "PII fix: users can read own bookings" ON public.bookings;
CREATE POLICY "PII fix: users can read own bookings"
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "PII fix: club admins can read club game bookings" ON public.bookings;
CREATE POLICY "PII fix: club admins can read club game bookings"
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.games g
      JOIN public.club_admins ca ON ca.club_id = g.club_id
      WHERE g.id = bookings.game_id
        AND ca.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "PII fix: booked players can read same game bookings" ON public.bookings;
CREATE POLICY "PII fix: booked players can read same game bookings"
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (
    bookings.status::text <> 'cancelled'
    AND public.pii_fix_user_has_active_booking_for_game(bookings.game_id)
  );

-- club_members --------------------------------------------------------------
DROP POLICY IF EXISTS "Public can read club members" ON public.club_members;

DROP POLICY IF EXISTS "PII fix: users can read own memberships" ON public.club_members;
CREATE POLICY "PII fix: users can read own memberships"
  ON public.club_members
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "PII fix: club admins can read club memberships" ON public.club_members;
CREATE POLICY "PII fix: club admins can read club memberships"
  ON public.club_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.club_admins ca
      WHERE ca.club_id = club_members.club_id
        AND ca.user_id = auth.uid()
    )
  );
