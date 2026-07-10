import { NextRequest, NextResponse } from 'next/server';
import { requireBusinessAdmin } from '@/lib/adminAccess';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';

// Phase 4A action A2: mark a flagged issue as reviewed. Append-only — the
// RPC's only write is its own admin_actions row (metadata.issue_key). Available
// to all business admin roles including support.

const TARGET_TYPES = new Set(['booking', 'game', 'club', 'user', 'subscription', 'notification', 'deletion_request']);

export async function POST(request: NextRequest) {
  const admin = await requireBusinessAdmin();
  const formData = await request.formData();
  const returnTab = sanitizeTab(String(formData.get('returnTab') || 'issues'));
  const redirectUrl = new URL('/admin', request.url);
  redirectUrl.searchParams.set('tab', returnTab);

  if (!admin.allowed) {
    redirectUrl.searchParams.set('adminAction', 'denied');
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  const targetType = String(formData.get('targetType') || '').trim();
  const targetId = String(formData.get('targetId') || '').trim();
  const issueKey = String(formData.get('issueKey') || '').trim();
  const note = String(formData.get('note') || '').trim();

  if (!TARGET_TYPES.has(targetType) || !isUuid(targetId) || !issueKey || issueKey.length > 200 || note.length > 2000) {
    redirectUrl.searchParams.set('adminAction', 'invalid');
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  const supabaseAdmin = createSupabaseAdminClient();
  if (!supabaseAdmin) {
    redirectUrl.searchParams.set('adminAction', 'missing_service_role');
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  const { error } = await supabaseAdmin.rpc('admin_mark_issue_reviewed', {
    p_admin_user_id: admin.userId,
    p_target_type: targetType,
    p_target_id: targetId,
    p_issue_key: issueKey,
    p_note: note || null,
  });

  if (error) {
    redirectUrl.searchParams.set('adminAction', 'failed');
    redirectUrl.searchParams.set('adminMessage', error.message.slice(0, 160));
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  redirectUrl.searchParams.set('adminAction', 'marked_reviewed');
  return NextResponse.redirect(redirectUrl, { status: 303 });
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function sanitizeTab(value: string) {
  return /^[a-z-]{1,32}$/.test(value) ? value : 'issues';
}
