-- Update book_game to insert a booking_confirmed notification
CREATE OR REPLACE FUNCTION public.book_game(p_game_id uuid, p_user_id uuid)
RETURNS public.bookings AS $$
DECLARE
  v_game public.games;
  v_confirmed int;
  v_booking public.bookings;
  v_waitlist_pos int;
  v_club public.clubs;
BEGIN
  -- Lock the game row to prevent race conditions
  SELECT * INTO v_game
  FROM public.games WHERE id = p_game_id FOR UPDATE;

  IF v_game IS NULL THEN
    RAISE EXCEPTION 'Game not found';
  END IF;

  -- Check club membership if members-only
  SELECT * INTO v_club FROM public.clubs WHERE id = v_game.club_id;
  IF v_club.members_only THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_id = v_club.id AND user_id = p_user_id AND status = 'approved'
    ) AND NOT EXISTS (
      SELECT 1 FROM public.club_admins
      WHERE club_id = v_club.id AND user_id = p_user_id
    ) THEN
      RAISE EXCEPTION 'This club requires membership to book games';
    END IF;
  END IF;

  -- Check if already booked
  IF EXISTS (SELECT 1 FROM public.bookings WHERE game_id = p_game_id AND user_id = p_user_id AND status != 'cancelled') THEN
    RAISE EXCEPTION 'Already booked for this game';
  END IF;

  v_confirmed := public.game_confirmed_count(p_game_id);

  IF v_confirmed < v_game.max_spots THEN
    INSERT INTO public.bookings (game_id, user_id, status)
    VALUES (p_game_id, p_user_id, 'confirmed')
    RETURNING * INTO v_booking;

    -- Notify user of confirmed booking
    INSERT INTO public.notifications (user_id, title, body, type, reference_id)
    VALUES (
      p_user_id,
      'Booking confirmed',
      v_game.title || ' on ' || to_char(v_game.date_time AT TIME ZONE 'Australia/Perth', 'Dy DD Mon at HH12:MI AM') ||
        CASE WHEN v_game.location IS NOT NULL THEN ' at ' || v_game.location ELSE '' END ||
        CASE WHEN v_game.fee_amount > 0 THEN ' — Fee: $' || v_game.fee_amount::text ELSE ' — Free' END,
      'booking_confirmed',
      p_game_id
    );
  ELSE
    SELECT coalesce(max(waitlist_position), 0) + 1 INTO v_waitlist_pos
    FROM public.bookings WHERE game_id = p_game_id AND status = 'waitlisted';

    INSERT INTO public.bookings (game_id, user_id, status, waitlist_position)
    VALUES (p_game_id, p_user_id, 'waitlisted', v_waitlist_pos)
    RETURNING * INTO v_booking;
  END IF;

  RETURN v_booking;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Update cancel_booking to notify the cancelling user with refund info
CREATE OR REPLACE FUNCTION public.cancel_booking(p_booking_id uuid, p_user_id uuid)
RETURNS void AS $$
DECLARE
  v_game_id uuid;
  v_was_confirmed boolean;
  v_next_waitlist public.bookings;
  v_game public.games;
  v_within_24hr boolean;
BEGIN
  -- Get booking details and cancel it
  UPDATE public.bookings
  SET status = 'cancelled', updated_at = now()
  WHERE id = p_booking_id AND user_id = p_user_id AND status != 'cancelled'
  RETURNING game_id, (status = 'confirmed') INTO v_game_id, v_was_confirmed;

  IF v_game_id IS NULL THEN
    RAISE EXCEPTION 'Booking not found or already cancelled';
  END IF;

  -- Get game details for notification
  SELECT * INTO v_game FROM public.games WHERE id = v_game_id;

  -- Check if cancellation is within 24 hours of game time
  v_within_24hr := (v_game.date_time - now()) < interval '24 hours';

  -- Notify cancelling user
  INSERT INTO public.notifications (user_id, title, body, type, reference_id)
  VALUES (
    p_user_id,
    'Booking cancelled',
    'You cancelled ' || v_game.title ||
      CASE
        WHEN v_game.fee_amount > 0 AND v_within_24hr THEN
          '. This cancellation is within 24 hours of the game — no refund is available.'
        WHEN v_game.fee_amount > 0 AND NOT v_within_24hr THEN
          '. This cancellation is more than 24 hours before the game — you are eligible for a refund.'
        ELSE
          '.'
      END,
    'booking_cancelled',
    v_game_id
  );

  -- If a confirmed spot opened, promote first waitlisted person
  IF v_was_confirmed THEN
    UPDATE public.bookings
    SET status = 'confirmed', waitlist_position = NULL, updated_at = now(), promoted_at = now()
    WHERE id = (
      SELECT id FROM public.bookings
      WHERE game_id = v_game_id AND status = 'waitlisted'
      ORDER BY waitlist_position ASC
      LIMIT 1
    )
    RETURNING * INTO v_next_waitlist;

    -- Create notification for promoted user
    IF v_next_waitlist IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, body, type, reference_id)
      VALUES (
        v_next_waitlist.user_id,
        'You''re in! A spot opened up',
        'A spot opened up for ' || v_game.title || ' on ' ||
          to_char(v_game.date_time AT TIME ZONE 'Australia/Perth', 'Dy DD Mon at HH12:MI AM') ||
          CASE WHEN v_game.location IS NOT NULL THEN ' at ' || v_game.location ELSE '' END ||
          CASE WHEN v_game.fee_amount > 0 THEN '. Complete payment within 24 hours to secure your spot.' ELSE '.' END,
        'waitlist_promoted',
        v_game_id
      );
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
