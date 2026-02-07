-- ============================================
-- Pickleball Booking App - Initial Schema
-- ============================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  phone text,
  date_of_birth date,
  dupr_rating numeric(3,2) check (dupr_rating >= 1.0 and dupr_rating <= 8.0),
  avatar_url text,
  push_token text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- CLUBS
-- ============================================
create table public.clubs (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  location text,
  image_url text,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================
-- CLUB ADMINS (many-to-many)
-- ============================================
create table public.club_admins (
  club_id uuid references public.clubs(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'admin' check (role in ('owner', 'admin')),
  created_at timestamptz default now() not null,
  primary key (club_id, user_id)
);

-- ============================================
-- GAMES
-- ============================================
create type skill_level as enum ('all', 'beginner', 'intermediate', 'advanced', 'pro');
create type game_format as enum ('singles', 'doubles', 'mixed_doubles', 'round_robin', 'open_play');
create type game_status as enum ('upcoming', 'in_progress', 'completed', 'cancelled');

create table public.games (
  id uuid default uuid_generate_v4() primary key,
  club_id uuid references public.clubs(id) on delete cascade not null,
  title text not null,
  description text,
  date_time timestamptz not null,
  duration_minutes int default 90 not null,
  skill_level skill_level default 'all' not null,
  game_format game_format default 'open_play' not null,
  max_spots int not null check (max_spots > 0),
  fee_amount numeric(10,2) default 0,
  fee_currency text default 'USD',
  location text,
  status game_status default 'upcoming' not null,
  notes text,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Index for querying upcoming games
create index idx_games_date_time on public.games(date_time) where status = 'upcoming';
create index idx_games_club_id on public.games(club_id);

-- ============================================
-- BOOKINGS
-- ============================================
create type booking_status as enum ('confirmed', 'waitlisted', 'cancelled');

create table public.bookings (
  id uuid default uuid_generate_v4() primary key,
  game_id uuid references public.games(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status booking_status default 'confirmed' not null,
  waitlist_position int,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(game_id, user_id)
);

create index idx_bookings_game_id on public.bookings(game_id);
create index idx_bookings_user_id on public.bookings(user_id);

-- ============================================
-- NOTIFICATIONS
-- ============================================
create type notification_type as enum (
  'booking_confirmed',
  'waitlist_promoted',
  'game_cancelled',
  'game_reminder',
  'game_updated'
);

create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  body text not null,
  type notification_type not null,
  reference_id uuid,
  read boolean default false not null,
  created_at timestamptz default now() not null
);

create index idx_notifications_user_id on public.notifications(user_id) where read = false;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Count confirmed spots for a game
create or replace function public.game_confirmed_count(game_id uuid)
returns int as $$
  select count(*)::int from public.bookings
  where bookings.game_id = $1 and status = 'confirmed';
$$ language sql stable;

-- Book a spot or join waitlist (atomic operation)
create or replace function public.book_game(p_game_id uuid, p_user_id uuid)
returns public.bookings as $$
declare
  v_max_spots int;
  v_confirmed int;
  v_booking public.bookings;
  v_waitlist_pos int;
begin
  -- Lock the game row to prevent race conditions
  select max_spots into v_max_spots
  from public.games where id = p_game_id for update;

  if v_max_spots is null then
    raise exception 'Game not found';
  end if;

  -- Check if already booked
  if exists (select 1 from public.bookings where game_id = p_game_id and user_id = p_user_id and status != 'cancelled') then
    raise exception 'Already booked for this game';
  end if;

  v_confirmed := public.game_confirmed_count(p_game_id);

  if v_confirmed < v_max_spots then
    -- Spot available: confirm booking
    insert into public.bookings (game_id, user_id, status)
    values (p_game_id, p_user_id, 'confirmed')
    returning * into v_booking;
  else
    -- Full: add to waitlist
    select coalesce(max(waitlist_position), 0) + 1 into v_waitlist_pos
    from public.bookings where game_id = p_game_id and status = 'waitlisted';

    insert into public.bookings (game_id, user_id, status, waitlist_position)
    values (p_game_id, p_user_id, 'waitlisted', v_waitlist_pos)
    returning * into v_booking;
  end if;

  return v_booking;
end;
$$ language plpgsql security definer;

-- Cancel booking and promote waitlist
create or replace function public.cancel_booking(p_booking_id uuid, p_user_id uuid)
returns void as $$
declare
  v_game_id uuid;
  v_was_confirmed boolean;
  v_next_waitlist public.bookings;
begin
  -- Get booking details and cancel it
  update public.bookings
  set status = 'cancelled', updated_at = now()
  where id = p_booking_id and user_id = p_user_id and status != 'cancelled'
  returning game_id, (status = 'confirmed') into v_game_id, v_was_confirmed;

  if v_game_id is null then
    raise exception 'Booking not found or already cancelled';
  end if;

  -- If a confirmed spot opened, promote first waitlisted person
  if v_was_confirmed then
    update public.bookings
    set status = 'confirmed', waitlist_position = null, updated_at = now()
    where id = (
      select id from public.bookings
      where game_id = v_game_id and status = 'waitlisted'
      order by waitlist_position asc
      limit 1
    )
    returning * into v_next_waitlist;

    -- Create notification for promoted user
    if v_next_waitlist is not null then
      insert into public.notifications (user_id, title, body, type, reference_id)
      values (
        v_next_waitlist.user_id,
        'You''re in!',
        'A spot opened up and you''ve been moved from the waitlist.',
        'waitlist_promoted',
        v_game_id
      );
    end if;
  end if;
end;
$$ language plpgsql security definer;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table public.profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.club_admins enable row level security;
alter table public.games enable row level security;
alter table public.bookings enable row level security;
alter table public.notifications enable row level security;

-- Profiles: users can read all profiles, update only their own
create policy "Profiles are viewable by everyone" on public.profiles
  for select using (true);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Clubs: readable by everyone, writable by admins
create policy "Clubs are viewable by everyone" on public.clubs
  for select using (true);
create policy "Club creators can insert" on public.clubs
  for insert with check (auth.uid() = created_by);
create policy "Club admins can update" on public.clubs
  for update using (
    exists (select 1 from public.club_admins where club_id = id and user_id = auth.uid())
  );

-- Club admins: readable by everyone, manageable by club owner
create policy "Club admins are viewable by everyone" on public.club_admins
  for select using (true);
create policy "Club owners can manage admins" on public.club_admins
  for all using (
    exists (select 1 from public.club_admins ca where ca.club_id = club_admins.club_id and ca.user_id = auth.uid() and ca.role = 'owner')
  );

-- Games: readable by everyone, writable by club admins
create policy "Games are viewable by everyone" on public.games
  for select using (true);
create policy "Club admins can create games" on public.games
  for insert with check (
    exists (select 1 from public.club_admins where club_id = games.club_id and user_id = auth.uid())
  );
create policy "Club admins can update games" on public.games
  for update using (
    exists (select 1 from public.club_admins where club_id = games.club_id and user_id = auth.uid())
  );

-- Bookings: users can see their own and game participants
create policy "Users can view bookings for games" on public.bookings
  for select using (true);
create policy "Users can insert own bookings" on public.bookings
  for insert with check (auth.uid() = user_id);
create policy "Users can update own bookings" on public.bookings
  for update using (auth.uid() = user_id);

-- Notifications: users can only see their own
create policy "Users can view own notifications" on public.notifications
  for select using (auth.uid() = user_id);
create policy "Users can update own notifications" on public.notifications
  for update using (auth.uid() = user_id);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_clubs_updated_at before update on public.clubs
  for each row execute function public.set_updated_at();
create trigger set_games_updated_at before update on public.games
  for each row execute function public.set_updated_at();
create trigger set_bookings_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();
