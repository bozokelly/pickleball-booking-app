import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() validates the JWT against Supabase, and may silently refresh
  // an expiring token, writing new cookies into supabaseResponse. Those
  // updated cookies MUST be forwarded on every response — including redirects —
  // so the browser and subsequent middleware requests see the refreshed token.
  const { data: { user } } = await supabase.auth.getUser();
  const { pathname, search } = request.nextUrl;
  const requestedPath = `${pathname}${search || ''}`;

  if (process.env.NODE_ENV === 'development') {
    console.log('[middleware]', pathname, user ? 'authenticated' : 'anonymous');
  }

  // Helper: build a redirect that carries over any cookie updates from getUser().
  function redirectWithCookies(destination: URL | string): NextResponse {
    const url = typeof destination === 'string' ? new URL(destination, request.url) : destination;
    const res = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => res.cookies.set(cookie));
    return res;
  }

  // Protect all /dashboard routes — redirect unauthenticated users to login.
  if (!user && pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', requestedPath);
    return redirectWithCookies(url);
  }

  // Redirect authenticated users away from /login and /signup.
  // Guard: next must not be a login/signup path — otherwise an authenticated
  // user on /login?next=/login would loop forever.
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const next = request.nextUrl.searchParams.get('next');
    const isNextSafe = next && next.startsWith('/') && !next.startsWith('//') &&
                       !next.startsWith('/login') && !next.startsWith('/signup');
    const safeNext = isNextSafe ? next : '/dashboard';
    return redirectWithCookies(new URL(safeNext, request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
