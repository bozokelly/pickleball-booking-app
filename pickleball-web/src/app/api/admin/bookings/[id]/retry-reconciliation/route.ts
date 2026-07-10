import { NextRequest, NextResponse } from 'next/server';
import { requireBusinessAdmin } from '@/lib/adminAccess';

// Phase 4A action A4: retry payment reconciliation for one booking via the
// admin-retry-payment-reconciliation Edge Function (deployed WITH JWT
// verification). The EF re-validates the caller against business_admins
// (owner/ops), reuses the existing confirm/refund primitives with Stripe as
// the source of truth, and writes the admin_actions audit row itself.
// This route never touches payment state directly.

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const admin = await requireBusinessAdmin();
  const redirectUrl = new URL('/admin', request.url);
  redirectUrl.searchParams.set('tab', 'issues');

  if (!admin.allowed) {
    redirectUrl.searchParams.set('adminAction', 'denied');
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  if (admin.role === 'support') {
    redirectUrl.searchParams.set('adminAction', 'support_read_only');
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  const { id } = await context.params;
  const bookingId = id.trim();
  if (!isUuid(bookingId)) {
    redirectUrl.searchParams.set('adminAction', 'invalid');
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || supabaseUrl.includes('placeholder') || !anonKey) {
    redirectUrl.searchParams.set('adminAction', 'missing_service_role');
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  const {
    data: { session },
  } = await admin.supabase.auth.getSession();
  const accessToken = session?.access_token;
  if (!accessToken) {
    redirectUrl.searchParams.set('adminAction', 'denied');
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  let outcome = 'failed';
  let detail = '';
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/admin-retry-payment-reconciliation`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: anonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ booking_id: bookingId }),
    });
    const payload = await response.json().catch(() => ({}));
    outcome = typeof payload?.outcome === 'string' ? payload.outcome : response.ok ? 'skipped' : 'failed';
    detail = typeof payload?.detail === 'string' ? payload.detail : typeof payload?.error === 'string' ? payload.error : '';
  } catch {
    outcome = 'failed';
    detail = 'The reconciliation service could not be reached. Safe to retry.';
  }

  const noticeByOutcome: Record<string, string> = {
    confirmed: 'reconciliation_confirmed',
    refunded: 'reconciliation_refunded',
    refund_recorded: 'reconciliation_refunded',
    skipped: 'reconciliation_skipped',
    failed: 'failed',
  };
  redirectUrl.searchParams.set('adminAction', noticeByOutcome[outcome] || 'failed');
  if (detail) redirectUrl.searchParams.set('adminMessage', detail.slice(0, 200));
  return NextResponse.redirect(redirectUrl, { status: 303 });
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
