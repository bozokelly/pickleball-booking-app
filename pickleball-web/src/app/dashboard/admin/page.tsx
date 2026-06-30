import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AdminClubListClient } from './AdminClubListClient';
import { getBusinessAdmin } from '@/lib/adminAccess';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ deletionAction?: string; message?: string }>;
type PageProps = { searchParams?: SearchParams };
type Row = Record<string, unknown>;
type StatusTone = 'neutral' | 'good' | 'warn' | 'bad';

type DeletionRequestView = {
  id: string;
  account: string;
  userId: string;
  status: string;
  statusTone: StatusTone;
  requestedAt: string;
  completedAt: string;
  reason: string;
  adminNotes: string;
  errorMessage: string;
  canProcess: boolean;
};

export default async function AdminPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const admin = await getBusinessAdmin();
  const deletionActionNotice = deletionNotice(params.deletionAction, params.message);
  const deletionQueue = admin.allowed
    ? await loadDeletionRequests()
    : {
        configured: false,
        empty: admin.reason,
        requests: [] as DeletionRequestView[],
      };

  return (
    <div className="space-y-8">
      {admin.allowed && (
        <section className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-tertiary">Compliance</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-text-primary">Account deletion requests</h2>
            <p className="mt-1 text-sm leading-5 text-text-secondary">
              Review account deletion requests, resolve club ownership if needed, and process server-side de-identification.
            </p>
          </div>

          {deletionActionNotice && (
            <div className={`rounded-2xl border p-4 ${deletionActionNotice.tone === 'good' ? 'border-green-500/20 bg-green-500/5' : deletionActionNotice.tone === 'warn' ? 'border-yellow-500/20 bg-yellow-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
              <div className="flex items-start gap-3">
                {deletionActionNotice.tone === 'good' ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
                )}
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">{deletionActionNotice.title}</h3>
                  <p className="mt-1 text-sm text-text-secondary">{deletionActionNotice.detail}</p>
                </div>
              </div>
            </div>
          )}

          <DeletionRequestsPanel
            configured={deletionQueue.configured}
            requests={deletionQueue.requests}
            empty={deletionQueue.empty}
            canAction={admin.role !== 'support'}
          />
        </section>
      )}

      <AdminClubListClient />
    </div>
  );
}

async function loadDeletionRequests() {
  const supabaseAdmin = createSupabaseAdminClient();
  if (!supabaseAdmin) {
    return {
      configured: false,
      empty: 'Set SUPABASE_SERVICE_ROLE_KEY for the command centre to view and process deletion requests.',
      requests: [] as DeletionRequestView[],
    };
  }

  const { data, error } = await supabaseAdmin
    .from('account_deletion_requests')
    .select('*')
    .order('requested_at', { ascending: false })
    .limit(100);

  if (error) {
    return {
      configured: false,
      empty: error.message,
      requests: [] as DeletionRequestView[],
    };
  }

  return {
    configured: true,
    empty: 'No account deletion requests found.',
    requests: (data || []).slice(0, 20).map((row) => toDeletionRequestView(toRow(row))),
  };
}

function DeletionRequestsPanel({
  configured,
  requests,
  empty,
  canAction,
}: {
  configured: boolean;
  requests: DeletionRequestView[];
  empty: string;
  canAction: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Deletion queue</h3>
          <p className="mt-1 text-xs leading-4 text-text-secondary">
            Processing de-identifies the profile, clears safe references, revokes sessions, and keeps retained records for audit, payment, and legal needs.
          </p>
        </div>
        <StatusPill label={configured ? 'available' : 'not configured'} tone={configured ? 'good' : 'neutral'} />
      </div>

      {!configured || requests.length === 0 ? (
        <p className="px-4 py-6 text-sm leading-5 text-text-secondary">{empty}</p>
      ) : (
        <div className="divide-y divide-border">
          {requests.map((request) => (
            <div key={request.id} className="grid gap-3 px-4 py-4 xl:grid-cols-[1fr_230px]">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-text-primary">{request.account}</p>
                  <StatusPill label={request.status} tone={request.statusTone} />
                </div>
                <div className="grid gap-x-4 gap-y-1 text-xs leading-5 text-text-secondary sm:grid-cols-2">
                  <p>
                    <span className="font-semibold text-text-primary">Requested:</span> {request.requestedAt}
                  </p>
                  <p>
                    <span className="font-semibold text-text-primary">Completed:</span> {request.completedAt}
                  </p>
                  <p className="sm:col-span-2">
                    <span className="font-semibold text-text-primary">User ID:</span> <Mono value={request.userId} />
                  </p>
                  <p className="sm:col-span-2">
                    <span className="font-semibold text-text-primary">Reason:</span> {request.reason}
                  </p>
                  {request.adminNotes !== '-' && (
                    <p className="sm:col-span-2">
                      <span className="font-semibold text-text-primary">Admin notes:</span> {request.adminNotes}
                    </p>
                  )}
                  {request.errorMessage !== '-' && (
                    <p className="sm:col-span-2 text-red-600">
                      <span className="font-semibold">Latest error:</span> {request.errorMessage}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background p-3">
                {request.canProcess && canAction ? (
                  <form method="post" action={`/api/admin/account-deletion/${request.id}/process`} className="space-y-2">
                    <label className="block text-xs font-semibold text-text-primary">
                      Action note
                      <textarea
                        name="adminNote"
                        maxLength={1000}
                        placeholder="Optional internal note"
                        className="mt-1 min-h-16 w-full resize-y rounded-lg border border-border bg-white px-3 py-2 text-xs font-normal text-text-primary outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                      />
                    </label>
                    <button className="w-full rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-black">
                      Process de-identification
                    </button>
                  </form>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-text-primary">{request.canProcess ? 'Read-only access' : 'No action available'}</p>
                    <p className="text-xs leading-4 text-text-secondary">
                      {request.canProcess
                        ? 'Owner or ops access is required to process deletion requests.'
                        : 'Only pending or admin-review requests can be processed.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusPill({ label, tone }: { label: string; tone: StatusTone }) {
  const classes = {
    neutral: 'bg-background text-text-secondary',
    good: 'bg-green-500/10 text-green-700',
    warn: 'bg-yellow-500/10 text-yellow-700',
    bad: 'bg-red-500/10 text-red-700',
  }[tone];
  return <span className={`inline-flex max-w-full whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${classes}`}>{label}</span>;
}

function Mono({ value }: { value: string }) {
  return (
    <code className="inline-block max-w-full truncate rounded-md border border-border bg-white px-2 py-1 font-mono text-[11px] text-text-secondary" title={value}>
      {value}
    </code>
  );
}

function deletionNotice(rawAction: string | undefined, message: string | undefined): { title: string; detail: string; tone: 'good' | 'warn' | 'bad' } | null {
  if (!rawAction) return null;
  const notices: Record<string, { title: string; detail: string; tone: 'good' | 'warn' | 'bad' }> = {
    completed: {
      title: 'Deletion request processed',
      detail: 'The profile was de-identified, safe references were cleared, sessions were revoked, and retained records remain for audit/legal purposes.',
      tone: 'good',
    },
    requires_admin_review: {
      title: 'Admin review still required',
      detail: 'The user still owns or administers a club. Resolve club ownership before processing the deletion request.',
      tone: 'warn',
    },
    failed: {
      title: 'Deletion processing failed',
      detail: message || 'The processor returned an error. Review the request error message and try again after resolving the issue.',
      tone: 'bad',
    },
    missing_service_role: {
      title: 'Service role key missing',
      detail: 'Set SUPABASE_SERVICE_ROLE_KEY in the website environment before command centre can process deletion requests.',
      tone: 'warn',
    },
    support_read_only: {
      title: 'Read-only admin role',
      detail: 'Support admins can view deletion requests but owner or ops access is required to process them.',
      tone: 'warn',
    },
    denied: {
      title: 'Action denied',
      detail: 'Your account is not approved for this internal admin action.',
      tone: 'bad',
    },
    invalid: {
      title: 'Invalid request',
      detail: 'The deletion request id was invalid.',
      tone: 'bad',
    },
  };
  return notices[rawAction] || null;
}

function toDeletionRequestView(row: Row): DeletionRequestView {
  const status = text(row, 'status') || 'pending';
  return {
    id: text(row, 'id'),
    account: text(row, 'email') || text(row, 'user_email') || text(row, 'user_id') || 'Unknown account',
    userId: text(row, 'user_id') || '-',
    status,
    statusTone: deletionStatusTone(status),
    requestedAt: formatDate(text(row, 'requested_at') || text(row, 'created_at')),
    completedAt: formatDate(text(row, 'completed_at')),
    reason: text(row, 'reason') || '-',
    adminNotes: text(row, 'admin_notes') || '-',
    errorMessage: text(row, 'error_message') || '-',
    canProcess: status === 'pending' || status === 'requires_admin_review',
  };
}

function deletionStatusTone(status: string): StatusTone {
  if (status === 'completed') return 'good';
  if (status === 'failed' || status === 'rejected') return 'bad';
  if (status === 'requires_admin_review' || status === 'processing') return 'warn';
  return 'neutral';
}

function toRow(valueToConvert: unknown): Row {
  return valueToConvert && typeof valueToConvert === 'object' && !Array.isArray(valueToConvert)
    ? (valueToConvert as Row)
    : {};
}

function text(row: Row | undefined, key: string): string {
  const raw = row ? row[key] : undefined;
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'number' || typeof raw === 'boolean') return String(raw);
  return '';
}

function formatDate(raw: string) {
  if (!raw) return '-';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}
