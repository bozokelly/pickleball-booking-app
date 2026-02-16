-- Track when a waitlisted player gets promoted (for payment deadline)
ALTER TABLE bookings ADD COLUMN promoted_at timestamptz DEFAULT NULL;

-- Add payment_deadline_hours to games (configurable per game, default 24h)
ALTER TABLE games ADD COLUMN payment_deadline_hours integer DEFAULT 24;

-- Update cancel_booking to set promoted_at when promoting a waitlisted player
CREATE OR REPLACE FUNCTION public.cancel_booking(p_booking_id uuid, p_user_id uuid)
RETURNS void AS $$
DECLARE
  v_game_id uuid;
  v_was_confirmed boolean;
  v_next_waitlist public.bookings;
BEGIN
  -- Get booking details and cancel it
  UPDATE public.bookings
  SET status = 'cancelled', updated_at = now()
  WHERE id = p_booking_id AND user_id = p_user_id AND status != 'cancelled'
  RETURNING game_id, (status = 'confirmed') INTO v_game_id, v_was_confirmed;

  IF v_game_id IS NULL THEN
    RAISE EXCEPTION 'Booking not found or already cancelled';
  END IF;

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
        'You''re in! Complete payment to confirm',
        'A spot opened up! You have 24 hours to complete payment or your spot will be released.',
        'waitlist_promoted',
        v_game_id
      );
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire unpaid promoted bookings and re-promote next waitlisted
CREATE OR REPLACE FUNCTION public.expire_unpaid_promotions()
RETURNS integer AS $$
DECLARE
  v_expired_booking RECORD;
  v_next_waitlist public.bookings;
  v_count integer := 0;
BEGIN
  FOR v_expired_booking IN
    SELECT b.id, b.game_id, b.user_id, g.payment_deadline_hours
    FROM bookings b
    JOIN games g ON g.id = b.game_id
    WHERE b.status = 'confirmed'
      AND b.promoted_at IS NOT NULL
      AND b.fee_paid = false
      AND g.fee_amount > 0
      AND b.promoted_at + (g.payment_deadline_hours || ' hours')::interval < now()
  LOOP
    -- Cancel the expired booking
    UPDATE bookings SET status = 'cancelled', updated_at = now()
    WHERE id = v_expired_booking.id;

    -- Notify the expired user
    INSERT INTO notifications (user_id, title, body, type, reference_id)
    VALUES (
      v_expired_booking.user_id,
      'Booking expired',
      'Your promoted spot has expired because payment was not completed in time.',
      'game_cancelled',
      v_expired_booking.game_id
    );

    -- Promote next waitlisted player
    UPDATE bookings
    SET status = 'confirmed', waitlist_position = NULL, updated_at = now(), promoted_at = now()
    WHERE id = (
      SELECT id FROM bookings
      WHERE game_id = v_expired_booking.game_id AND status = 'waitlisted'
      ORDER BY waitlist_position ASC
      LIMIT 1
    )
    RETURNING * INTO v_next_waitlist;

    IF v_next_waitlist IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, body, type, reference_id)
      VALUES (
        v_next_waitlist.user_id,
        'You''re in! Complete payment to confirm',
        'A spot opened up! You have 24 hours to complete payment or your spot will be released.',
        'waitlist_promoted',
        v_expired_booking.game_id
      );
    END IF;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable pg_cron extension (if not already enabled) and schedule expiry check every 15 minutes
-- Note: pg_cron must be enabled in the Supabase dashboard under Database > Extensions
-- Once enabled, run this in the SQL editor:
-- SELECT cron.schedule('expire-unpaid-promotions', '*/15 * * * *', $$ SELECT public.expire_unpaid_promotions(); $$);
