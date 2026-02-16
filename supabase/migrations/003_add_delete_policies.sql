-- ============================================
-- Add DELETE RLS policies for games and clubs
-- Without these, delete operations are silently blocked by RLS
-- ============================================

-- Club admins can delete games they manage
create policy "Club admins can delete games" on public.games
  for delete using (
    exists (select 1 from public.club_admins where club_id = games.club_id and user_id = auth.uid())
  );

-- Club owners can delete their clubs
create policy "Club owners can delete clubs" on public.clubs
  for delete using (
    exists (select 1 from public.club_admins where club_id = clubs.id and user_id = auth.uid() and role = 'owner')
  );

-- Club owners can delete admin records (for demoting admins)
create policy "Club owners can delete admins" on public.club_admins
  for delete using (
    exists (select 1 from public.club_admins ca where ca.club_id = club_admins.club_id and ca.user_id = auth.uid() and ca.role = 'owner')
  );

-- Club admins can delete members (for removing members)
create policy "Club admins can delete members" on public.club_members
  for delete using (
    exists (select 1 from public.club_admins where club_id = club_members.club_id and user_id = auth.uid())
  );
