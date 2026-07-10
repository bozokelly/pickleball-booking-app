import { NextRequest, NextResponse } from 'next/server';
import { requireBusinessAdmin } from '@/lib/adminAccess';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';

// Phase 4A action A3: resolve an expired unpaid pending_payment hold.
// The service-role RPC re-validates the caller via assert_business_admin,
// locks the booking, refuses anything with payment evidence
// (skipped:route_to_reconciliation), cancels via the same stamp as the cron
// forfeit path, and writes its admin_actions row in the same transaction.
// Owner/ops only — support is read-only.

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

  const supabaseAdmin = createSupabaseAdminClient();
  if (!supabaseAdmin) {
    redirectUrl.searchParams.set('adminAction', 'missing_service_role');
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  const formData = await request.formData();
  const reason = String(formData.get('reason') || '').trim().slice(0, 2000);

  const { data, error } = await supabaseAdmin.rpc('admin_resolve_expired_unpaid_hold', {
    p_admin_user_id: admin.userId,
    p_booking_id: bookingId,
    p_reason: reason || null,
  });

  if (error) {
    redirectUrl.searchParams.set('adminAction', 'failed');
    redirectUrl.searchParams.set('adminMessage', error.message.slice(0, 160));
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  const result = Array.isArray(data) ? data[0] : data;
  const status = typeof result?.out_status === 'string' ? result.out_status : 'failed';
  const reasonOut = typeof result?.out_reason === 'string' ? result.out_reason : '';

  if (status === 'succeeded') {
    redirectUrl.searchParams.set('adminAction', 'hold_resolved');
  } else {
    redirectUrl.searchParams.set('adminAction', status === 'skipped' ? 'hold_skipped' : 'failed');
    if (reasonOut) redirectUrl.searchParams.set('adminMessage', reasonOut.slice(0, 160));
  }
  return NextResponse.redirect(redirectUrl, { status: 303 });
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
