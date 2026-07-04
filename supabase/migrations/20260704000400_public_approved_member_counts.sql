-- Public social-proof counts without exposing club_members rows or profile PII.

CREATE OR REPLACE FUNCTION public.public_club_member_count(p_club_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.club_members cm
  WHERE cm.club_id = p_club_id
    AND cm.status::text = 'approved';
$$;

REVOKE ALL ON FUNCTION public.public_club_member_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_club_member_count(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.public_club_member_counts(p_club_ids uuid[])
RETURNS TABLE(club_id uuid, member_count integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cm.club_id,
    COUNT(*)::integer AS member_count
  FROM public.club_members cm
  WHERE cm.club_id = ANY(p_club_ids)
    AND cm.status::text = 'approved'
  GROUP BY cm.club_id;
$$;

REVOKE ALL ON FUNCTION public.public_club_member_counts(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_club_member_counts(uuid[]) TO anon, authenticated;
