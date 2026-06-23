import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export type BusinessAdminRole = 'owner' | 'ops' | 'support';

export type BusinessAdminCheck =
  | {
      allowed: true;
      role: BusinessAdminRole;
      userId: string;
      email: string | null;
      supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
    }
  | {
      allowed: false;
      reason: string;
      email: string | null;
    };

export async function requireBusinessAdmin(): Promise<BusinessAdminCheck> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/admin');
  }

  const { data, error } = await supabase
    .from('business_admins')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    return {
      allowed: false,
      reason:
        error.code === '42P01'
          ? 'The business_admins access table has not been created yet.'
          : 'Your account could not be verified for internal admin access.',
      email: user.email ?? null,
    };
  }

  const role = typeof data?.role === 'string' ? data.role : null;
  if (role !== 'owner' && role !== 'ops' && role !== 'support') {
    return {
      allowed: false,
      reason: 'This account is not approved for the Bookadink internal command centre.',
      email: user.email ?? null,
    };
  }

  return {
    allowed: true,
    role,
    userId: user.id,
    email: user.email ?? null,
    supabase,
  };
}
