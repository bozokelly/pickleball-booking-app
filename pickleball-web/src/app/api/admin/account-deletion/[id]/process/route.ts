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
  redirectUrl.searchParams.set('deletionAction', status);
  return NextResponse.redirect(redirectUrl, { status: 303 });
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
