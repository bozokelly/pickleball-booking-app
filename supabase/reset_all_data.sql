-- ============================================
-- Reset All Data - Run in Supabase SQL Editor
-- Clears all app data + auth users so you can
-- sign up / log in fresh.
-- ============================================

-- 1. Truncate all public tables (CASCADE handles FKs between them)
truncate table public.notifications cascade;
truncate table public.game_messages cascade;
truncate table public.bookings cascade;
truncate table public.games cascade;
truncate table public.club_members cascade;
truncate table public.club_admins cascade;
truncate table public.clubs cascade;
truncate table public.profiles cascade;

-- 2. Delete all auth users (this is what lets you sign up again with the same email)
delete from auth.users;
