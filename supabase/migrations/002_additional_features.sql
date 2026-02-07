-- ============================================
-- Migration 002: Additional Features
-- Club membership, game chat, payments, reminders, storage
-- ============================================

-- ============================================
-- CLUB MEMBERS (membership + join requests)
-- ============================================
create type membership_status as enum ('pending', 'approved', 'rejected');

create table public.club_members (
  id uuid default uuid_generate_v4() primary key,
  club_id uuid references public.clubs(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status membership_status default 'pending' not null,
  requested_at timestamptz default now() not null,
  responded_at timestamptz,
  responded_by uuid references public.profiles(id),
  unique(club_id, user_id)
);

create index idx_club_members_club on public.club_members(club_id);
create index idx_club_members_user on public.club_members(user_id);

alter table public.club_members enable row level security;

create policy "Club members are viewable by club participants" on public.club_members
  for select using (true);
create policy "Users can request membership" on public.club_members
  for insert with check (auth.uid() = user_id);
create policy "Club admins can manage members" on public.club_members
  for update using (
    exists (select 1 from public.club_admins where club_id = club_members.club_id and user_id = auth.uid())
  );

-- Add members_only flag to clubs
alter table public.clubs add column members_only boolean default false not null;

-- ============================================
-- GAME MESSAGES (real-time chat per game)
-- ============================================
create table public.game_messages (
  id uuid default uuid_generate_v4() primary key,
  game_id uuid references public.games(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null check (length(content) > 0 and length(content) <= 1000),
  created_at timestamptz default now() not null
);

create index idx_game_messages_game on public.game_messages(game_id, created_at);

alter table public.game_messages enable row level security;

-- Only game participants (confirmed or waitlisted) can read/write messages
create policy "Game participants can view messages" on public.game_messages
  for select using (
    exists (
      select 1 from public.bookings
      where bookings.game_id = game_messages.game_id
      and bookings.user_id = auth.uid()
      and bookings.status in ('confirmed', 'waitlisted')
    )
  );

create policy "Game participants can send messages" on public.game_messages
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.bookings
      where bookings.game_id = game_messages.game_id
      and bookings.user_id = auth.uid()
      and bookings.status in ('confirmed', 'waitlisted')
    )
  );

-- Enable Supabase Realtime on game_messages
alter publication supabase_realtime add table public.game_messages;

-- ============================================
-- PAYMENTS (fee tracking on bookings)
-- ============================================
alter table public.bookings
  add column fee_paid boolean default false not null,
  add column stripe_payment_intent_id text,
  add column paid_at timestamptz;

-- ============================================
-- STORAGE BUCKETS (avatars + club images)
-- ============================================
-- Run these via Supabase dashboard or CLI:
-- supabase storage create avatars --public
-- supabase storage create club-images --public
--
-- Policies are set via storage API, but for reference:
-- avatars: authenticated users can upload to their own folder (uid/*)
-- club-images: club admins can upload to their club folder (club_id/*)

-- ============================================
-- GAME REMINDERS (local scheduling references)
-- ============================================
alter table public.bookings
  add column reminder_scheduled boolean default false not null,
  add column local_notification_id text;

-- ============================================
-- UPDATE book_game TO HANDLE MEMBERS-ONLY CLUBS
-- ============================================
create or replace function public.book_game(p_game_id uuid, p_user_id uuid)
returns public.bookings as $$
declare
  v_game public.games;
  v_confirmed int;
  v_booking public.bookings;
  v_waitlist_pos int;
  v_club public.clubs;
begin
  -- Lock the game row to prevent race conditions
  select * into v_game
  from public.games where id = p_game_id for update;

  if v_game is null then
    raise exception 'Game not found';
  end if;

  -- Check club membership if members-only
  select * into v_club from public.clubs where id = v_game.club_id;
  if v_club.members_only then
    if not exists (
      select 1 from public.club_members
      where club_id = v_club.id and user_id = p_user_id and status = 'approved'
    ) and not exists (
      select 1 from public.club_admins
      where club_id = v_club.id and user_id = p_user_id
    ) then
      raise exception 'This club requires membership to book games';
    end if;
  end if;

  -- Check if already booked
  if exists (select 1 from public.bookings where game_id = p_game_id and user_id = p_user_id and status != 'cancelled') then
    raise exception 'Already booked for this game';
  end if;

  v_confirmed := public.game_confirmed_count(p_game_id);

  if v_confirmed < v_game.max_spots then
    insert into public.bookings (game_id, user_id, status)
    values (p_game_id, p_user_id, 'confirmed')
    returning * into v_booking;
  else
    select coalesce(max(waitlist_position), 0) + 1 into v_waitlist_pos
    from public.bookings where game_id = p_game_id and status = 'waitlisted';

    insert into public.bookings (game_id, user_id, status, waitlist_position)
    values (p_game_id, p_user_id, 'waitlisted', v_waitlist_pos)
    returning * into v_booking;
  end if;

  return v_booking;
end;
$$ language plpgsql security definer;
