-- Internal Bookadink business-admin access.
-- This is intentionally separate from club_admins. Club owners, club admins,
-- players, and members do not gain /admin access unless inserted here.

CREATE TABLE IF NOT EXISTS public.business_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'ops', 'support')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.business_admins ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.business_admins TO authenticated;

DROP POLICY IF EXISTS "Business admins can read own row" ON public.business_admins;
CREATE POLICY "Business admins can read own row"
  ON public.business_admins
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.is_business_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.business_admins
    WHERE user_id = p_user_id
  );
$$;

REVOKE ALL ON FUNCTION public.is_business_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_business_admin(UUID) TO authenticated;

-- Notifications are otherwise user-private. Business admins need read-only
-- visibility for delivery health without using a service-role key.
DROP POLICY IF EXISTS "Business admins can read notifications" ON public.notifications;
CREATE POLICY "Business admins can read notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (public.is_business_admin(auth.uid()));
