-- ============================================
-- Seed 15 Test Players for Scheduler Testing
-- Run in Supabase SQL Editor
-- ============================================

-- First clean up any previous test player data
DELETE FROM public.bookings WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE 'testplayer%@test.com');
DELETE FROM public.profiles WHERE email LIKE 'testplayer%@test.com';
DELETE FROM auth.users WHERE email LIKE 'testplayer%@test.com';

-- Now create fresh test players
DO $$
DECLARE
  target_game_id uuid := 'd5e6b519-13d5-49d7-9b25-b3c8a7406bff';
  player_ids uuid[];
  i int;
  names text[] := ARRAY[
    'Alex Thompson', 'Jordan Rivera', 'Casey Mitchell', 'Riley Anderson',
    'Morgan Chen', 'Taylor Brooks', 'Sam Patel', 'Jamie Garcia',
    'Quinn Foster', 'Drew Nakamura', 'Avery Robinson', 'Blake Sullivan',
    'Reese Kowalski', 'Parker Lindström', 'Hayden Okafor'
  ];
  ratings numeric[] := ARRAY[
    3.2, 4.1, 2.8, 3.9, 4.5, 3.0, 3.7, 4.3, 2.5, 3.5, 4.0, 3.3, 3.8, 4.2, 2.9
  ];
BEGIN
  -- Generate 15 UUIDs
  FOR i IN 1..15 LOOP
    player_ids := array_append(player_ids, gen_random_uuid());
  END LOOP;

  -- Insert into auth.users (trigger auto-creates profile rows)
  FOR i IN 1..15 LOOP
    INSERT INTO auth.users (
      id, instance_id, aud, role, email,
      encrypted_password, email_confirmed_at,
      created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, confirmation_token
    ) VALUES (
      player_ids[i],
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'testplayer' || i || '@test.com',
      crypt('password123', gen_salt('bf')),
      now(),
      now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      false, ''
    );
  END LOOP;

  -- Update the auto-created profiles with names and DUPR ratings
  FOR i IN 1..15 LOOP
    UPDATE public.profiles
    SET full_name = names[i],
        dupr_rating = ratings[i],
        email = 'testplayer' || i || '@test.com'
    WHERE id = player_ids[i];
  END LOOP;

  -- Book all 15 into the game as confirmed
  FOR i IN 1..15 LOOP
    INSERT INTO public.bookings (game_id, user_id, status, fee_paid, reminder_scheduled, created_at, updated_at)
    VALUES (
      target_game_id,
      player_ids[i],
      'confirmed',
      true,
      false,
      now(), now()
    );
  END LOOP;

  -- Update the game's max_spots to at least 16 so everyone fits
  UPDATE public.games
  SET max_spots = GREATEST(max_spots, 16)
  WHERE id = target_game_id;

  RAISE NOTICE 'Created 15 test players and booked them into game %', target_game_id;
END $$;
