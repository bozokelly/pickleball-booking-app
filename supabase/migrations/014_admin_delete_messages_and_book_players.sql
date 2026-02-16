-- 1. Allow admins to delete club messages
CREATE POLICY "Admins can delete club messages" ON club_messages
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM club_admins
      WHERE club_admins.club_id = club_messages.club_id
      AND club_admins.user_id = auth.uid())
  );

-- 2. RPC for admins to book a player into a game
CREATE OR REPLACE FUNCTION admin_book_player(p_game_id uuid, p_user_id uuid, p_admin_id uuid)
RETURNS public.bookings AS $$
DECLARE
  v_game public.games;
  v_confirmed int;
  v_booking public.bookings;
  v_waitlist_pos int;
BEGIN
  -- Verify admin has access to this game's club
  IF NOT EXISTS (
    SELECT 1 FROM public.games g
    JOIN public.club_admins ca ON ca.club_id = g.club_id
    WHERE g.id = p_game_id AND ca.user_id = p_admin_id
  ) THEN
    RAISE EXCEPTION 'Not authorized to manage this game';
  END IF;

  -- Lock the game row
  SELECT * INTO v_game FROM public.games WHERE id = p_game_id FOR UPDATE;

  -- Check if player already booked
  IF EXISTS (
    SELECT 1 FROM public.bookings
    WHERE game_id = p_game_id AND user_id = p_user_id AND status != 'cancelled'
  ) THEN
    RAISE EXCEPTION 'Player is already booked for this game';
  END IF;

  v_confirmed := public.game_confirmed_count(p_game_id);

  IF v_confirmed < v_game.max_spots THEN
    INSERT INTO public.bookings (game_id, user_id, status, fee_paid)
    VALUES (p_game_id, p_user_id, 'confirmed', true)
    RETURNING * INTO v_booking;
  ELSE
    SELECT COALESCE(MAX(waitlist_position), 0) + 1 INTO v_waitlist_pos
    FROM public.bookings WHERE game_id = p_game_id AND status = 'waitlisted';

    INSERT INTO public.bookings (game_id, user_id, status, waitlist_position)
    VALUES (p_game_id, p_user_id, 'waitlisted', v_waitlist_pos)
    RETURNING * INTO v_booking;
  END IF;

  RETURN v_booking;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
