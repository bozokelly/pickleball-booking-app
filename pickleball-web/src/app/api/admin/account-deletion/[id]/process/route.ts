import { NextRequest, NextResponse } from 'next/server';
import { requireBusinessAdmin } from '@/lib/adminAccess';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const admin = await requireBusinessAdmin();
  const redirectUrl = new URL('/admin', request.url);
  redirectUrl.searchParams.set('tab', 'compliance');

  if (!admin.allowed) {
    redirectUrl.searchParams.set('deletionAction', 'denied');
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  if (admin.role === 'support') {
    redirectUrl.searchParams.set('deletionAction', 'support_read_only');
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  const { id } = await context.params;
  const requestId = id.trim();
  if (!isUuid(requestId)) {
    redirectUrl.searchParams.set('deletionAction', 'invalid');
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  const supabaseAdmin = createSupabaseAdminClient();
  if (!supabaseAdmin) {
    redirectUrl.searchParams.set('deletionAction', 'missing_service_role');
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  const formData = await request.formData();
  const adminNote = String(formData.get('adminNote') || '').trim();

  const { data, error } = await supabaseAdmin.rpc('process_account_deletion_request', {
    p_request_id: requestId,
  });

  if (error) {
    await recordAdminAction(supabaseAdmin, admin.userId, requestId, 'failed', error.message, adminNote);
    redirectUrl.searchParams.set('deletionAction', 'failed');
    redirectUrl.searchParams.set('message', error.message.slice(0, 160));
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  const { error: metadataError } = await supabaseAdmin
    .from('account_deletion_requests')
    .update({
      reviewed_by: admin.userId,
      ...(adminNote ? { admin_notes: adminNote.slice(0, 1000) } : {}),
    })
    .eq('id', requestId);

  if (metadataError) {
    console.warn('Deletion request processed but metadata update failed', metadataError.message);
  }

  const result = Array.isArray(data) ? data[0] : data;
  const status = typeof result?.out_status === 'string' ? result.out_status : 'completed';
  await recordAdminAction(supabaseAdmin, admin.userId, requestId, status, typeof result?.out_message === 'string' ? result.out_message : '', adminNote);
  redirectUrl.searchParams.set('deletionAction', status);
  return NextResponse.redirect(redirectUrl, { status: 303 });
}

// Phase 4A A5: every processing attempt lands in the admin_actions audit
// trail alongside the existing reviewed_by/admin_notes stamp. Best-effort —
// audit failure never blocks the (already status-gated, idempotent) RPC flow.
async function recordAdminAction(
  supabaseAdmin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  adminUserId: string,
  requestId: string,
  resultStatus: string,
  resultMessage: string,
  adminNote: string,
) {
  const auditStatus = resultStatus === 'completed' ? 'succeeded' : resultStatus === 'failed' ? 'failed' : 'skipped';
  const { error } = await supabaseAdmin.from('admin_actions').insert({
    admin_user_id: adminUserId,
    target_type: 'deletion_request',
    target_id: requestId,
    action: 'process_account_deletion',
    status: auditStatus,
    reason: auditStatus === 'succeeded' ? null : resultStatus,
    note: adminNote ? adminNote.slice(0, 1000) : null,
    metadata: { result_status: resultStatus, ...(resultMessage ? { result_message: resultMessage.slice(0, 500) } : {}) },
  });
  if (error) {
    console.warn('Deletion request processed but admin_actions audit insert failed', error.message);
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
