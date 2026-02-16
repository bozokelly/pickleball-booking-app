-- Fix: RLS policies on club_admins that query club_admins cause infinite recursion.
-- Solution: a SECURITY DEFINER function that bypasses RLS to check ownership.

create or replace function public.is_club_owner(p_club_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.club_admins
    where club_id = p_club_id
      and user_id = auth.uid()
      and role = 'owner'
  );
$$;

create or replace function public.is_club_admin(p_club_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.club_admins
    where club_id = p_club_id
      and user_id = auth.uid()
  );
$$;

-- Drop old self-referencing policies on club_admins
drop policy if exists "Club owners can manage admins" on public.club_admins;
drop policy if exists "Club owners can delete admins" on public.club_admins;

-- Recreate using the helper functions (no recursion)
create policy "Club owners can manage admins" on public.club_admins
  for all
  using (public.is_club_owner(club_id))
  with check (public.is_club_owner(club_id));
