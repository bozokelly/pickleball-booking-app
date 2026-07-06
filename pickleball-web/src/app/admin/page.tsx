import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bell,
  Building2,
  CheckCircle2,
  CreditCard,
  Database,
  FileText,
  Gauge,
  HeartPulse,
  Lock,
  Search,
  Server,
  ShieldCheck,
  Ticket,
  Users,
} from 'lucide-react';
import { format } from 'date-fns';
import { requireBusinessAdmin } from '@/lib/adminAccess';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { Card } from '@/components/ui';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Internal Admin - Bookadink',
  description: 'Bookadink internal beta operations command centre.',
};

type SearchParams = Promise<{ q?: string; tab?: string; deletionAction?: string; message?: string }>;
type PageProps = { searchParams?: SearchParams };
type Row = Record<string, unknown>;
type CountValue = number | null;

type QueryResult = {
  data: Row[];
  warning: string | null;
  configured: boolean;
  elapsedMs: number;
  limit: number | null;
  label: string;
};

type CountResult = {
  count: CountValue;
  warning: string | null;
  elapsedMs: number;
  label: string;
};

type PostgrestRows = {
  data: unknown[] | null;
  error: { code?: string; message: string } | null;
};

type PostgrestCount = {
  count: number | null;
  error: { code?: string; message: string } | null;
};

type AdminSummary = {
  active_subscribers?: number;
  total_subscription_rows?: number;
  canceling_subscriptions?: number;
  subscription_mrr_cents?: number;
  subscription_mrr_tracked?: boolean;
  paid_booking_count?: number;
  gross_paid_cents?: number;
  platform_revenue_cents?: number;
  current_month_platform_revenue_cents?: number;
  club_payout_cents?: number;
  revenue_tracked_count?: number;
};

type Metric = {
  label: string;
  value: string;
  hint: string;
  tone?: 'default' | 'good' | 'warn' | 'bad';
};
type StatusTone = 'dark' | 'neutral' | 'info' | 'good' | 'warn' | 'bad';
type HealthTone = 'good' | 'warn' | 'bad';
type PlatformTone = 'good' | 'warn' | 'bad' | 'neutral';
type PlatformItem = { label: string; value: string; detail: string; tone: PlatformTone };
type RevenueCardItem = { label: string; value: string; detail: string; tone: StatusTone };
type SubscriptionRevenueRow = {
  clubName: string;
  plan: string;
  status: string;
  source: string;
  periodEnd: string;
  mrr: string;
  mrrTracked: boolean;
};
type SubscriptionPlanRow = { plan: string; status: string; count: string; tone: StatusTone };
type PaymentHealthItem = { label: string; value: string; detail: string; tone: StatusTone };
type StripeSetupRow = {
  clubName: string;
  plan: string;
  subscriptionStatus: string;
  stripeStatus: string;
  stripeTone: StatusTone;
  detail: string;
};
type PaymentAttentionRow = {
  item: string;
  clubName: string;
  status: string;
  statusTone: StatusTone;
  detail: string;
};
type ComplianceHealthItem = { label: string; value: string; detail: string; tone: StatusTone };
type DeletionRequestView = {
  id: string;
  account: string;
  userId: string;
  status: string;
  statusTone: StatusTone;
  requestedAt: string;
  requestAge: string;
  completedAt: string;
  reason: string;
  adminNotes: string;
  errorMessage: string;
  canProcess: boolean;
};
type AdminTab = 'overview' | 'clubs' | 'players' | 'bookings' | 'payments' | 'notifications' | 'compliance' | 'platform' | 'issues';

export default async function AdminPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const query = (params.q || '').trim();
  const activeTab = normalizeTab(params.tab);
  const deletionActionNotice = deletionNotice(params.deletionAction, params.message);
  const admin = await requireBusinessAdmin();

  if (!admin.allowed) {
    return <AccessDenied email={admin.email} reason={admin.reason} />;
  }

  const dashboard = await loadAdminDashboard(admin.supabase, query);

  const navItems = [
    { id: 'overview' as const, label: 'Business dashboard', shortLabel: 'Dashboard', icon: Database },
    { id: 'clubs' as const, label: 'Club operations', shortLabel: 'Clubs', icon: Building2 },
    { id: 'players' as const, label: 'Players & members', shortLabel: 'Players', icon: Users },
    { id: 'bookings' as const, label: 'Games & bookings', shortLabel: 'Bookings', icon: Ticket },
    { id: 'payments' as const, label: 'Revenue & payments', shortLabel: 'Revenue', icon: CreditCard },
    { id: 'notifications' as const, label: 'Comms & alerts', shortLabel: 'Comms', icon: Bell },
    { id: 'compliance' as const, label: 'Privacy & legal', shortLabel: 'Compliance', icon: FileText },
    { id: 'platform' as const, label: 'System health', shortLabel: 'Health', icon: Server },
    { id: 'issues' as const, label: 'Action queue', shortLabel: 'Issues', icon: HeartPulse },
  ];
  const tabHref = (tab: AdminTab) => `/admin?tab=${tab}${query ? `&q=${encodeURIComponent(query)}` : ''}`;

  return (
    <main className="min-h-screen bg-[#F5F5F7] text-text-primary">
      <div className="mx-auto flex min-h-screen w-full max-w-[1520px] gap-0 px-3 py-3 sm:px-4 lg:px-6">
        <aside className="sticky top-3 hidden h-[calc(100vh-1.5rem)] w-64 flex-shrink-0 flex-col rounded-2xl border border-black/10 bg-[#111113] p-4 text-white shadow-[0_24px_80px_rgba(0,0,0,0.18)] lg:flex print:hidden">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-black text-[#111113]">B</div>
            <div>
              <p className="text-sm font-semibold leading-tight">Bookadink</p>
              <p className="text-xs text-white/50">Internal command</p>
            </div>
          </div>
          <nav className="mt-5 space-y-1" aria-label="Admin sections">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.id}
                  href={tabHref(item.id)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    activeTab === item.id ? 'bg-white text-[#111113]' : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </a>
              );
            })}
          </nav>
          <div className="mt-auto rounded-xl border border-white/10 bg-white/[0.06] p-3">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-success" />
              <span className="text-xs font-semibold uppercase tracking-wide text-white/60">Read-only owner access</span>
            </div>
            <p className="truncate text-sm font-semibold">{admin.email || admin.userId}</p>
            <p className="mt-1 text-xs text-white/45">Refreshed {dashboard.generatedAt}</p>
          </div>
        </aside>

        <div className="min-w-0 flex-1 lg:pl-5">
          <header className="sticky top-0 z-30 -mx-3 mb-4 border-b border-border bg-[#F5F5F7]/95 px-3 py-3 backdrop-blur-xl sm:-mx-4 sm:px-4 lg:-mx-5 lg:px-5 print:static print:bg-white">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <StatusPill label="Internal" tone="dark" />
                  <StatusPill label="Read-only" tone="neutral" />
                  <StatusPill label={admin.role} tone="info" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">Command Centre</h1>
                <p className="mt-1 max-w-3xl text-sm text-text-secondary">
                  Live beta operations across clubs, players, bookings, payments, notifications, compliance, and system health.
                </p>
              </div>
              <form action="/admin" className="flex w-full max-w-2xl items-center gap-2 print:hidden">
                <input type="hidden" name="tab" value={activeTab} />
                <label className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                  <input
                    name="q"
                    defaultValue={query}
                    placeholder="Search clubs, players, bookings, payments..."
                    className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-4 text-sm text-text-primary outline-none shadow-sm transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                  />
                </label>
                <button className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-black">
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">Search</span>
                </button>
              </form>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden print:hidden">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={tabHref(item.id)}
                  className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    activeTab === item.id ? 'border-primary bg-primary text-white' : 'border-border bg-white text-text-secondary'
                  }`}
                >
                  {item.shortLabel}
                </a>
              ))}
            </div>
          </header>

          {query && (
            <Panel className="mb-4 border-info/20 bg-info/5 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-text-primary">Filtered admin view</h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    Showing records that match <span className="font-semibold text-text-primary">"{query}"</span>. Search applies to the loaded admin preview data and the revenue summary RPC when available.
                  </p>
                </div>
                <Link href={`/admin?tab=${activeTab}`} className="text-sm font-semibold text-info hover:text-primary">
                  Clear search
                </Link>
              </div>
            </Panel>
          )}

          {dashboard.warnings.length > 0 && (
            <Panel className="mb-4 border-warning/30 bg-warning/5 p-4">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning" />
                <div>
                  <h2 className="text-sm font-semibold text-text-primary">Some required admin data could not be loaded</h2>
                  <ul className="mt-2 space-y-1 text-sm text-text-secondary">
                    {dashboard.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Panel>
          )}

          {activeTab === 'overview' && (
            <Section id="overview" title="Overview" icon={<Database className="h-5 w-5" />} description="The short version: money, risk, growth, and what needs your attention.">
              <div className="grid gap-3 xl:grid-cols-[1fr_0.9fr]">
                <Panel className="p-4">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary">Overseer brief</h3>
                      <p className="mt-1 text-xs leading-4 text-text-secondary">Plain-English readout of the numbers that matter most today.</p>
                    </div>
                    <Activity className="h-5 w-5 text-text-tertiary" />
                  </div>
                  <div className="space-y-2">
                    {dashboard.briefing.map((item) => (
                      <MeaningRow key={item.label} item={item} />
                    ))}
                  </div>
                </Panel>

                <Panel className="p-0">
                  <div className="border-b border-border px-4 py-3">
                    <h3 className="text-sm font-semibold text-text-primary">Revenue picture</h3>
                    <p className="mt-0.5 text-xs text-text-secondary">{dashboard.revenue.scope}</p>
                  </div>
                  <div className="grid gap-0 divide-y divide-border sm:grid-cols-2 xl:grid-cols-3">
                    {dashboard.revenue.cards.map((item) => (
                      <RevenueCard key={item.label} item={item} />
                    ))}
                  </div>
                </Panel>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-[1.2fr_0.8fr] xl:grid-cols-[1.5fr_0.9fr]">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {dashboard.metrics.map((metric) => (
                    <MetricCard key={metric.label} metric={metric} />
                  ))}
                </div>
                <AttentionQueue items={dashboard.attention} />
              </div>
            </Section>
          )}

          {activeTab === 'clubs' && (
            <Section id="clubs" title="Club operations" icon={<Building2 className="h-5 w-5" />} description={dashboard.tableNotes.clubs}>
              <DataTable
                caption="Club roster"
                note="Sorted by newest clubs first. Member counts are approved memberships only."
                empty={query ? `No clubs matched "${query}".` : 'No clubs are available in this admin preview.'}
                columns={['Club', 'Location', 'Subscription', 'Stripe', 'Members', 'Admins', 'Upcoming', 'Created', 'Last activity']}
                rows={dashboard.clubs.map((club) => [
                  <Link key="club" href={`/admin/clubs/${club.id}`} className="inline-flex max-w-full items-center gap-1.5 font-semibold text-text-primary hover:text-info">
                    <span className="truncate">{club.name}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 flex-shrink-0 text-text-tertiary" />
                  </Link>,
                  club.location,
                  <StatusPill key="tier" label={club.subscriptionTier} tone="neutral" />,
                  <StatusPill key="stripe" label={club.stripeStatus} tone={club.stripeTone} />,
                  club.memberCount,
                  club.adminCount,
                  club.upcomingGames,
                  club.createdAt,
                  club.lastActivity,
                ])}
              />
            </Section>
          )}

          {activeTab === 'players' && (
            <Section id="players" title="Players & members" icon={<Users className="h-5 w-5" />} description={dashboard.tableNotes.players}>
              <DataTable
                caption="Player directory"
                note="Operational view of registered profiles, club memberships, bookings, and credit balances."
                empty={query ? `No players matched "${query}".` : 'No player profiles are available in this admin preview.'}
                columns={['Player', 'Email', 'DUPR', 'Joined clubs', 'Upcoming bookings', 'Credits', 'Created', 'Last active']}
                rows={dashboard.players.map((player) => [
                  player.name,
                  player.email,
                  player.dupr,
                  player.joinedClubs,
                  player.upcomingBookings,
                  player.credits,
                  player.createdAt,
                  player.lastActive,
                ])}
              />
            </Section>
          )}

          {activeTab === 'bookings' && (
            <Section id="bookings" title="Games & bookings" icon={<Ticket className="h-5 w-5" />} description={dashboard.tableNotes.bookings}>
              <DataTable
                caption="Recent booking activity"
                note="Use this to answer who booked, what game it was for, whether payment is settled, and when it happened."
                empty={query ? `No bookings matched "${query}".` : 'No recent booking records are available in this admin preview.'}
                columns={['Game', 'Club', 'Player', 'Game time', 'Booking', 'Payment', 'Fee', 'Credits', 'Waitlist', 'Created']}
                rows={dashboard.bookings.map((booking) => [
                  booking.gameTitle,
                  booking.clubName,
                  booking.playerName,
                  booking.gameTime,
                  <StatusPill key="booking" label={booking.status} tone={booking.bookingTone} />,
                  <StatusPill key="payment" label={booking.paymentStatus} tone={booking.paymentTone} />,
                  booking.fee,
                  booking.credits,
                  booking.waitlist,
                  booking.createdAt,
                ])}
              />
            </Section>
          )}

          {activeTab === 'payments' && (
            <Section id="payments" title="Revenue & payments" icon={<CreditCard className="h-5 w-5" />} description={dashboard.tableNotes.payments}>
              <RevenueAuthorityPanel configured={dashboard.revenue.summaryConfigured} scope={dashboard.revenue.scope} />
              <div className="mb-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {dashboard.revenue.cards.map((item) => (
                  <RevenueCard key={item.label} item={item} />
                ))}
              </div>
              <PaymentHealthPanel items={dashboard.revenue.health} attentionRows={dashboard.revenue.attentionRows} />
              <StripeSetupPanel rows={dashboard.revenue.stripeSetupRows} configured={dashboard.revenue.stripeConfigured} />
              <SubscriptionRevenuePanel
                rows={dashboard.revenue.subscriptionRows}
                planRows={dashboard.revenue.subscriptionPlanRows}
                note={dashboard.revenue.subscriptionNote}
              />
              <DataTable
                caption="Paid booking ledger"
                note="Read-only payment reconciliation view. Refund/payment workflow changes are deliberately out of scope for this phase."
                empty={query ? `No paid or Stripe-linked bookings matched "${query}".` : 'No paid or Stripe-linked booking records are available in this admin preview.'}
                columns={['Created', 'Player', 'Club', 'Payment intent', 'Connected account', 'Amount', 'Payment', 'Refund', 'Booking']}
                rows={dashboard.payments.map((payment) => [
                  payment.createdAt,
                  payment.playerName,
                  payment.clubName,
                  <Mono key="pi" value={payment.paymentIntent} />,
                  <Mono key="acct" value={payment.connectedAccount} />,
                  payment.amount,
                  <StatusPill key="payment" label={payment.paymentStatus} tone={payment.paymentTone} />,
                  <StatusPill key="refund" label={payment.refundStatus} tone={payment.refundTone} />,
                  payment.bookingStatus,
                ])}
              />
            </Section>
          )}

          {activeTab === 'notifications' && (
            <Section id="notifications" title="Comms & alerts" icon={<Bell className="h-5 w-5" />} description={dashboard.tableNotes.notifications}>
              <DataTable
                caption="Notification log"
                note="Delivery status only appears when the underlying notification row tracks it."
                empty={dashboard.notificationsConfigured ? (query ? `No notifications matched "${query}".` : 'No notification records are available in this admin preview.') : 'Notification health is unavailable until admin notification access is configured.'}
                columns={['Created', 'Recipient', 'Type', 'Title', 'Read', 'Email', 'Reference']}
                rows={dashboard.notifications.map((notification) => [
                  notification.createdAt,
                  notification.recipient,
                  <StatusPill key="type" label={notification.type} tone="neutral" />,
                  notification.title,
                  <StatusPill key="read" label={notification.read} tone={notification.readTone} />,
                  <StatusPill key="email" label={notification.email} tone={notification.emailTone} />,
                  <Mono key="ref" value={notification.reference} />,
                ])}
              />
            </Section>
          )}

          {activeTab === 'compliance' && (
            <Section id="compliance" title="Privacy & legal" icon={<FileText className="h-5 w-5" />} description="Launch-readiness surfaces for account deletion, legal documents, and support signals">
              {deletionActionNotice && (
                <Panel className={`mb-3 p-4 ${deletionActionNotice.tone === 'good' ? 'border-success/25 bg-success/5' : deletionActionNotice.tone === 'warn' ? 'border-warning/25 bg-warning/5' : 'border-error/25 bg-error/5'}`}>
                  <div className="flex items-start gap-3">
                    {deletionActionNotice.tone === 'good' ? <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" /> : <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning" />}
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary">{deletionActionNotice.title}</h3>
                      <p className="mt-1 text-sm text-text-secondary">{deletionActionNotice.detail}</p>
                    </div>
                  </div>
                </Panel>
              )}
              <ComplianceHealthPanel items={dashboard.compliance.health} />
              <div className="grid gap-3 xl:grid-cols-[1.5fr_0.8fr_0.8fr]">
                <DeletionRequestsPanel
                  configured={dashboard.compliance.deletions.configured}
                  requests={dashboard.compliance.deletions.requests}
                  empty={dashboard.compliance.deletions.empty}
                  canAction={admin.role !== 'support'}
                />
                <ComplianceCard title="Legal pages & documents" configured={dashboard.compliance.legal.configured} rows={dashboard.compliance.legal.rows} empty="No legal status rows are available." />
                <ComplianceCard title="Support & privacy signals" configured rows={dashboard.compliance.support.rows} empty="No dedicated support request table found in this first read-only version." />
              </div>
            </Section>
          )}

          {activeTab === 'platform' && (
            <Section id="platform-health" title="System health" icon={<Server className="h-5 w-5" />} description="Read-only service reachability, query timing, schema availability, and load pressure">
              <div className="grid gap-3 xl:grid-cols-[0.9fr_1.1fr]">
                <Panel className="p-4">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary">Server and backend status</h3>
                      <p className="mt-1 text-xs leading-4 text-text-secondary">Live CPU, memory, request volume, and cold-start metrics require Vercel/Supabase telemetry access. This panel shows what the app can verify safely from the admin server render.</p>
                    </div>
                    <Gauge className="h-5 w-5 text-text-tertiary" />
                  </div>
                  <div className="space-y-2">
                    {dashboard.platform.status.map((item) => (
                      <StatusRow key={item.label} label={item.label} value={item.value} detail={item.detail} tone={item.tone} />
                    ))}
                  </div>
                </Panel>

                <Panel className="overflow-hidden p-0">
                  <div className="border-b border-border px-4 py-3">
                    <h3 className="text-sm font-semibold text-text-primary">Constraints and load</h3>
                    <p className="mt-0.5 text-xs text-text-secondary">Query timings, loaded rows, and row caps for this admin view.</p>
                  </div>
                  <div className="divide-y divide-border">
                    {dashboard.platform.load.map((item) => (
                      <LoadRow key={item.label} item={item} />
                    ))}
                  </div>
                </Panel>
              </div>
            </Section>
          )}

          {activeTab === 'issues' && (
            <Section id="system-health" title="Action queue" icon={<HeartPulse className="h-5 w-5" />} description="Read-only checks for payment, venue, game, and notification data quality">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {dashboard.health.map((item) => (
                  <HealthCard key={item.label} label={item.label} value={item.value} detail={item.detail} tone={item.tone} />
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>
    </main>
  );
}

async function loadAdminDashboard(supabase: Awaited<ReturnType<typeof import('@/lib/supabaseServer').createSupabaseServerClient>>, query: string) {
  const loadStartedAt = Date.now();
  const now = new Date();
  const weekStart = startOfWeekIso(now);
  const nowIso = now.toISOString();
  const warnings: string[] = [];
  const supabaseAdmin = createSupabaseAdminClient();
  const adminReader = supabaseAdmin || supabase;

  if (!supabaseAdmin) {
    warnings.push('SUPABASE_SERVICE_ROLE_KEY is not configured; protected admin reads may be incomplete after RLS hardening.');
  }

  const [
    adminSummaryResult,
    clubsResult,
    profilesResult,
    gamesResult,
    bookingsResult,
    notificationsResult,
    membersResult,
    adminsResult,
    creditsResult,
    stripeAccountsResult,
    subscriptionsResult,
    deletionRequestsResult,
    legalDocumentsResult,
    venuesResult,
    totalClubs,
    totalPlayers,
    upcomingGames,
    bookingsThisWeek,
    paidBookingsThisWeek,
    pendingPayments,
  ] = await Promise.all([
    supabaseAdmin
      ? safeRows('admin_dashboard_summary', () => supabaseAdmin.rpc('admin_dashboard_summary', { p_search: query || null }), true)
      : unconfiguredRows('admin_dashboard_summary', 'Set SUPABASE_SERVICE_ROLE_KEY for accurate admin revenue totals.', null),
    safeRows('clubs', () => adminReader.from('clubs').select('*').order('created_at', { ascending: false }).limit(300), false, 300),
    safeRows('profiles', () =>
      adminReader
        .from('profiles')
        .select('id,email,full_name,dupr_rating,created_at,updated_at')
        .order('created_at', { ascending: false })
        .limit(500),
      false,
      500,
    ),
    safeRows('games', () => adminReader.from('games').select('*').order('date_time', { ascending: false }).limit(500), false, 500),
    safeRows('bookings', () => adminReader.from('bookings').select('*').order('created_at', { ascending: false }).limit(600), false, 600),
    safeRows('notifications', () => adminReader.from('notifications').select('*').order('created_at', { ascending: false }).limit(250), true, 250),
    safeRows('club_members', () => adminReader.from('club_members').select('*').limit(1000), true, 1000),
    safeRows('club_admins', () => adminReader.from('club_admins').select('*').limit(500), true, 500),
    safeRows('player_credits', () => adminReader.from('player_credits').select('*').limit(1000), true, 1000),
    safeRows('club_stripe_accounts', () => adminReader.from('club_stripe_accounts').select('*').limit(500), true, 500),
    safeRows('club_subscriptions', () => adminReader.from('club_subscriptions').select('*').limit(500), true, 500),
    supabaseAdmin
      ? safeRows('account_deletion_requests', () => supabaseAdmin.from('account_deletion_requests').select('*').order('requested_at', { ascending: false }).limit(100), true, 100)
      : unconfiguredRows('account_deletion_requests', 'Set SUPABASE_SERVICE_ROLE_KEY for the command centre to view and process deletion requests.', 100),
    safeRows('legal_documents', () => adminReader.from('legal_documents').select('*').order('created_at', { ascending: false }).limit(20), true, 20),
    safeRows('club_venues', () => adminReader.from('club_venues').select('*').limit(500), true, 500),
    safeCount('clubs', () => adminReader.from('clubs').select('id', { count: 'exact', head: true })),
    safeCount('profiles', () => adminReader.from('profiles').select('id', { count: 'exact', head: true })),
    safeCount('upcoming games', () =>
      adminReader.from('games').select('id', { count: 'exact', head: true }).eq('status', 'upcoming').gte('date_time', nowIso),
    ),
    safeCount('bookings this week', () => adminReader.from('bookings').select('id', { count: 'exact', head: true }).gte('created_at', weekStart)),
    safeCount('paid bookings this week', () =>
      adminReader.from('bookings').select('id', { count: 'exact', head: true }).gte('created_at', weekStart).eq('fee_paid', true),
    ),
    safeCount('pending payment bookings', () =>
      adminReader
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('fee_paid', false)
        .not('stripe_payment_intent_id', 'is', null),
    ),
  ]);

  [
    adminSummaryResult,
    clubsResult,
    profilesResult,
    gamesResult,
    bookingsResult,
    notificationsResult,
    membersResult,
    adminsResult,
    creditsResult,
    stripeAccountsResult,
    subscriptionsResult,
    deletionRequestsResult,
    legalDocumentsResult,
    venuesResult,
    totalClubs,
    totalPlayers,
    upcomingGames,
    bookingsThisWeek,
    paidBookingsThisWeek,
    pendingPayments,
  ].forEach((result) => {
    if (result.warning) warnings.push(result.warning);
  });

  const clubs = clubsResult.data;
  const profiles = profilesResult.data;
  const games = gamesResult.data;
  const bookings = bookingsResult.data;
  const adminSummary = (adminSummaryResult.data[0] || {}) as AdminSummary;
  const notifications = notificationsResult.data;
  const members = membersResult.data;
  const admins = adminsResult.data;
  const credits = creditsResult.data;
  const stripeAccounts = stripeAccountsResult.data;
  const subscriptions = subscriptionsResult.data;
  const deletionRequests = deletionRequestsResult.data;
  const legalDocuments = legalDocumentsResult.data;
  const venues = venuesResult.data;

  const clubById = mapById(clubs);
  const profileById = mapById(profiles);
  const gameById = mapById(games);
  const subscriptionByClubId = mapByKey(subscriptions, 'club_id');
  const stripeByClubId = mapByKey(stripeAccounts, 'club_id');
  const venueByClubId = groupByKey(venues, 'club_id');
  const approvedMembersByClubId = countBy(members.filter((row) => value(row, 'status') === 'approved'), 'club_id');
  const adminsByClubId = groupByKey(admins, 'club_id');
  const upcomingGamesByClubId = countBy(
    games.filter((game) => isUpcomingGame(game, now)),
    'club_id',
  );
  const bookingsByUserId = groupByKey(bookings, 'user_id');
  const membershipsByUserId = groupByKey(members.filter((row) => value(row, 'status') === 'approved'), 'user_id');
  const creditsByUserId = sumCreditsByUser(credits);

  const normalizedQuery = query.toLowerCase();
  const include = (parts: unknown[]) =>
    !normalizedQuery || parts.some((part) => String(part || '').toLowerCase().includes(normalizedQuery));

  const clubRows = clubs
    .map((club) => {
      const clubId = text(club, 'id');
      const subscription = subscriptionByClubId.get(clubId);
      const stripe = stripeByClubId.get(clubId);
      const clubVenues = venueByClubId.get(clubId) || [];
      const location = clubLocation(club, clubVenues);
      const lastGameActivity = latestDate(games.filter((game) => text(game, 'club_id') === clubId).map((game) => text(game, 'updated_at') || text(game, 'created_at')));
      return {
        id: clubId,
        name: text(club, 'name') || 'Untitled club',
        location,
        subscriptionTier: text(club, 'subscription_tier') || text(subscription, 'plan_type') || text(subscription, 'tier') || 'not tracked',
        stripeStatus: stripeStatus(stripe),
        stripeTone: stripeTone(stripe),
        memberCount: String(approvedMembersByClubId.get(clubId) || 0),
        adminCount: String((adminsByClubId.get(clubId) || []).length),
        upcomingGames: String(upcomingGamesByClubId.get(clubId) || 0),
        createdAt: formatDate(text(club, 'created_at')),
        lastActivity: formatDate(lastGameActivity || text(club, 'updated_at')),
      };
    })
    .filter((club) => include([club.name, club.location, club.subscriptionTier, club.stripeStatus]))
    .slice(0, 80);

  const playerRows = profiles
    .map((profile) => {
      const userId = text(profile, 'id');
      const userBookings = bookingsByUserId.get(userId) || [];
      const upcomingUserBookings = userBookings.filter((booking) => {
        const game = gameById.get(text(booking, 'game_id'));
        return isUpcomingGame(game, now) && text(booking, 'status') !== 'cancelled';
      });
      return {
        name: text(profile, 'full_name') || 'Unnamed player',
        email: text(profile, 'email') || '-',
        dupr: text(profile, 'dupr_rating') || '-',
        joinedClubs: String((membershipsByUserId.get(userId) || []).length),
        upcomingBookings: String(upcomingUserBookings.length),
        credits: formatCents(creditsByUserId.get(userId) || 0),
        createdAt: formatDate(text(profile, 'created_at')),
        lastActive: formatDate(text(profile, 'updated_at')),
      };
    })
    .filter((player) => include([player.name, player.email, player.dupr]))
    .slice(0, 100);

  const bookingRows = bookings
    .map((booking) => {
      const game = gameById.get(text(booking, 'game_id'));
      const club = game ? clubById.get(text(game, 'club_id')) : undefined;
      const profile = profileById.get(text(booking, 'user_id'));
      const payment = bookingPaymentStatus(booking);
      return {
        gameTitle: text(game, 'title') || 'Unknown game',
        clubName: text(club, 'name') || 'Unknown club',
        playerName: text(profile, 'full_name') || text(profile, 'email') || 'Unknown player',
        gameTime: formatDate(text(game, 'date_time')),
        status: text(booking, 'status') || '-',
        bookingTone: bookingTone(booking),
        paymentStatus: payment.label,
        paymentTone: payment.tone,
        fee: formatBookingFee(booking, game),
        credits: formatCents(number(booking, 'credits_applied_cents')),
        waitlist: text(booking, 'waitlist_position') || '-',
        createdAt: formatDate(text(booking, 'created_at')),
      };
    })
    .filter((booking) => include([booking.gameTitle, booking.clubName, booking.playerName, booking.status, booking.paymentStatus]))
    .slice(0, 120);

  const paymentRows = bookings
    .filter((booking) => text(booking, 'stripe_payment_intent_id') || bool(booking, 'fee_paid') || text(booking, 'payment_method') === 'stripe')
    .map((booking) => {
      const game = gameById.get(text(booking, 'game_id'));
      const club = game ? clubById.get(text(game, 'club_id')) : undefined;
      const profile = profileById.get(text(booking, 'user_id'));
      const stripe = club ? stripeByClubId.get(text(club, 'id')) : undefined;
      const payment = bookingPaymentStatus(booking);
      const refund = refundStatus(booking);
      return {
        createdAt: formatDate(text(booking, 'created_at')),
        playerName: text(profile, 'full_name') || text(profile, 'email') || 'Unknown player',
        clubName: text(club, 'name') || 'Unknown club',
        paymentIntent: text(booking, 'stripe_payment_intent_id') || '-',
        connectedAccount: text(stripe, 'stripe_account_id') || text(booking, 'stripe_account_id') || '-',
        amount: formatPaymentAmount(booking, game),
        paymentStatus: payment.label,
        paymentTone: payment.tone,
        refundStatus: refund.label,
        refundTone: refund.tone,
        bookingStatus: text(booking, 'status') || '-',
      };
    })
    .filter((payment) => include([payment.playerName, payment.clubName, payment.paymentIntent, payment.connectedAccount, payment.paymentStatus]))
    .slice(0, 80);

  const notificationRows = notifications
    .map((notification) => {
      const profile = profileById.get(text(notification, 'user_id'));
      const emailSent = value(notification, 'email_sent');
      return {
        createdAt: formatDate(text(notification, 'created_at')),
        recipient: text(profile, 'full_name') || text(profile, 'email') || text(notification, 'user_id') || '-',
        type: text(notification, 'type') || '-',
        title: text(notification, 'title') || '-',
        read: bool(notification, 'read') ? 'read' : 'unread',
        readTone: (bool(notification, 'read') ? 'neutral' : 'warn') as StatusTone,
        email: typeof emailSent === 'boolean' ? (emailSent ? 'sent' : 'not sent') : 'not tracked',
        emailTone: (typeof emailSent === 'boolean' ? (emailSent ? 'good' : 'neutral') : 'neutral') as StatusTone,
        reference: text(notification, 'reference_id') || '-',
      };
    })
    .filter((notification) => include([notification.recipient, notification.type, notification.title, notification.reference]))
    .slice(0, 120);

  const activeClubs = new Set(games.filter((game) => isUpcomingGame(game, now)).map((game) => text(game, 'club_id')).filter(Boolean)).size;
  const failedNotifications = notifications.filter((notification) => {
    const status = text(notification, 'delivery_status') || text(notification, 'send_status');
    return status === 'failed' || status === 'error';
  }).length;
  const pendingDeletionRequests = deletionRequests.filter((row) => isOpenDeletionStatus(text(row, 'status'))).length;
  const failedDeletionRequests = deletionRequests.filter((row) => text(row, 'status') === 'failed').length;
  const completedDeletionRequests = deletionRequests.filter((row) => text(row, 'status') === 'completed').length;
  const actionDeletionRequests = deletionRequests.filter((row) => {
    const status = text(row, 'status') || 'pending';
    return status === 'pending' || status === 'requires_admin_review' || status === 'failed';
  }).length;
  const stuckPendingPayments = pendingPaymentBookings(bookings);
  const expiredActiveHolds = expiredHolds(bookings, now);
  const upcomingGamesWithNoPlayers = emptyUpcomingGames(games, bookings, now);
  const paidGamesWithoutStripe = paidGamesMissingStripe(games, clubs, stripeAccounts);
  const clubsWithoutLocation = clubsMissingLocation(clubs, venueByClubId);
  const paidBookingRows = bookings.filter((booking) => isPaidBooking(booking));
  const monthStart = startOfMonth(now);
  const currentMonthPaidBookingRows = paidBookingRows.filter((booking) => bookingPaidAt(booking) >= monthStart.getTime());
  const grossPaidCentsSample = paidBookingRows.reduce((sum, booking) => {
    const game = gameById.get(text(booking, 'game_id'));
    return sum + bookingGrossCents(booking, game);
  }, 0);
  const platformRevenueCentsSample = paidBookingRows.reduce((sum, booking) => sum + number(booking, 'platform_fee_cents'), 0);
  const currentMonthPlatformRevenueCentsSample = currentMonthPaidBookingRows.reduce((sum, booking) => sum + number(booking, 'platform_fee_cents'), 0);
  const clubPayoutCentsSample = paidBookingRows.reduce((sum, booking) => sum + number(booking, 'club_payout_cents'), 0);
  const revenueTrackedCountSample = paidBookingRows.filter((booking) => number(booking, 'platform_fee_cents') > 0).length;
  const subscriptionRows = subscriptions
    .map((subscription) => {
      const club = clubById.get(text(subscription, 'club_id'));
      const plan = normalizedSubscriptionPlan(subscription, club);
      const status = text(subscription, 'status') || 'unknown';
      const mrrCents = subscriptionMonthlyCents(subscription);
      return {
        clubName: text(club, 'name') || 'Unknown club',
        plan,
        status,
        source: text(subscription, 'subscription_source') || 'not tracked',
        periodEnd: formatDate(text(subscription, 'current_period_end')),
        mrr: mrrCents > 0 ? formatCents(mrrCents) : 'Not tracked',
        mrrTracked: mrrCents > 0,
      } satisfies SubscriptionRevenueRow;
    })
    .filter((subscription) => include([subscription.clubName, subscription.plan, subscription.status, subscription.source]));
  const activeSubscriptionRows = subscriptionRows.filter((subscription) => isActiveSubscriptionStatus(subscription.status));
  const cancelingSubscriptionRows = subscriptionRows.filter((subscription) => isCancelingSubscriptionStatus(subscription.status));
  const feeChargingClubIds = new Set(games.filter((game) => number(game, 'fee_amount') > 0).map((game) => text(game, 'club_id')).filter(Boolean));
  const stripeConnectedCount = stripeAccounts.filter((row) => text(row, 'stripe_account_id')).length;
  const stripePayoutReadyCount = stripeAccounts.filter((row) => bool(row, 'payouts_enabled')).length;
  const failedPaymentBookings = bookings.filter((booking) => {
    const status = text(booking, 'payment_status');
    return status === 'failed' || status === 'requires_payment_method' || status === 'payment_failed';
  });
  const failedRefundBookings = bookings.filter((booking) => text(booking, 'refund_status') === 'failed');
  const refundedBookings = bookings.filter((booking) => {
    const status = text(booking, 'refund_status');
    return status === 'succeeded' || status === 'refunded';
  });
  const stripeSetupRows = clubs
    .map((club) => {
      const clubId = text(club, 'id');
      const subscription = subscriptionByClubId.get(clubId);
      const stripe = stripeByClubId.get(clubId);
      const hasFeeChargingGames = feeChargingClubIds.has(clubId);
      const status = stripeStatus(stripe);
      const payoutsReady = Boolean(stripe && bool(stripe, 'payouts_enabled'));
      const hasStripeAccount = Boolean(stripe && text(stripe, 'stripe_account_id'));
      const stripeStatusTone: StatusTone = payoutsReady ? 'good' : hasFeeChargingGames && !hasStripeAccount ? 'bad' : hasStripeAccount ? 'warn' : 'neutral';
      return {
        clubName: text(club, 'name') || 'Untitled club',
        plan: text(club, 'subscription_tier') || text(subscription, 'plan_type') || text(subscription, 'tier') || 'not tracked',
        subscriptionStatus: text(subscription, 'status') || (subscription ? 'unknown' : 'none'),
        stripeStatus: status,
        stripeTone: stripeStatusTone,
        detail: payoutsReady
          ? 'Stripe Connect is ready for paid games and payouts.'
          : hasFeeChargingGames && !hasStripeAccount
            ? 'Fee-charging games exist but no Stripe Connect account is recorded.'
            : hasStripeAccount
              ? 'Stripe account exists, but onboarding or payout readiness is incomplete.'
              : 'No Stripe account recorded. Fine for manual/free clubs; review before paid sessions.',
      } satisfies StripeSetupRow;
    })
    .filter((row) => include([row.clubName, row.plan, row.subscriptionStatus, row.stripeStatus]))
    .sort((a, b) => {
      const priority = (tone: StatusTone) => (tone === 'bad' ? 0 : tone === 'warn' ? 1 : tone === 'good' ? 2 : 3);
      return priority(a.stripeTone) - priority(b.stripeTone) || a.clubName.localeCompare(b.clubName);
    })
    .slice(0, 12);
  const attentionRowForBooking = (booking: Row, item: string, tone: StatusTone, detailPrefix: string): PaymentAttentionRow => {
    const game = gameById.get(text(booking, 'game_id'));
    const club = game ? clubById.get(text(game, 'club_id')) : undefined;
    const profile = profileById.get(text(booking, 'user_id'));
    const payment = bookingPaymentStatus(booking);
    return {
      item,
      clubName: text(club, 'name') || 'Unknown club',
      status: item.includes('Refund') ? refundStatus(booking).label : payment.label,
      statusTone: tone,
      detail: `${detailPrefix}: ${text(profile, 'full_name') || text(profile, 'email') || 'Unknown player'} · ${text(game, 'title') || 'Unknown game'} · ${formatPaymentAmount(booking, game)}`,
    };
  };
  const paymentAttentionRows: PaymentAttentionRow[] = [
    ...stuckPendingPayments.slice(0, 4).map((booking) => attentionRowForBooking(booking, 'Pending payment', 'warn', 'Checkout may be abandoned, delayed, or mismatched')),
    ...failedPaymentBookings.slice(0, 4).map((booking) => attentionRowForBooking(booking, 'Failed payment', 'bad', 'Payment status indicates failure')),
    ...failedRefundBookings.slice(0, 4).map((booking) => attentionRowForBooking(booking, 'Refund failed', 'bad', 'Refund status needs manual review')),
    ...paidGamesWithoutStripe.slice(0, 4).map((game) => {
      const club = clubById.get(text(game, 'club_id'));
      return {
        item: 'Payment setup gap',
        clubName: text(club, 'name') || 'Unknown club',
        status: 'stripe missing',
        statusTone: 'bad' as StatusTone,
        detail: `${text(game, 'title') || 'Untitled game'} charges ${formatDollars(number(game, 'fee_amount'))} but the club is not payout-ready.`,
      };
    }),
  ].slice(0, 10);
  const subscriptionMrrCentsSample = subscriptions.reduce((sum, subscription) => {
    const status = text(subscription, 'status') || 'unknown';
    return isActiveSubscriptionStatus(status) ? sum + subscriptionMonthlyCents(subscription) : sum;
  }, 0);
  const subscriptionMrrCents = summaryNumber(adminSummary.subscription_mrr_cents, subscriptionMrrCentsSample);
  const subscriptionMrrTracked = typeof adminSummary.subscription_mrr_tracked === 'boolean' ? adminSummary.subscription_mrr_tracked : subscriptionMrrCents > 0;
  const activeSubscriberCount = summaryNumber(adminSummary.active_subscribers, activeSubscriptionRows.length);
  const totalSubscriptionRows = summaryNumber(adminSummary.total_subscription_rows, subscriptionRows.length);
  const cancelingSubscriptionCount = summaryNumber(adminSummary.canceling_subscriptions, cancelingSubscriptionRows.length);
  const paidBookingCount = summaryNumber(adminSummary.paid_booking_count, paidBookingRows.length);
  const grossPaidCents = summaryNumber(adminSummary.gross_paid_cents, grossPaidCentsSample);
  const platformRevenueCents = summaryNumber(adminSummary.platform_revenue_cents, platformRevenueCentsSample);
  const currentMonthPlatformRevenueCents = summaryNumber(adminSummary.current_month_platform_revenue_cents, currentMonthPlatformRevenueCentsSample);
  const clubPayoutCents = summaryNumber(adminSummary.club_payout_cents, clubPayoutCentsSample);
  const revenueTrackedCount = summaryNumber(adminSummary.revenue_tracked_count, revenueTrackedCountSample);
  const subscriptionPlanRows = planBreakdown(subscriptionRows);
  const revenue = {
    summaryConfigured: adminSummaryResult.configured,
    stripeConfigured: stripeAccountsResult.configured,
    scope: adminSummaryResult.configured
      ? 'Revenue totals are calculated by the server across the full dataset. Tables below remain capped previews.'
      : `Subscriptions are counted from club_subscriptions. Game processing fees use platform_fee_cents on ${formatCount(paidBookingRows.length)} loaded booking${paidBookingRows.length === 1 ? '' : 's'}.`,
    subscriptionRows,
    subscriptionPlanRows,
    stripeSetupRows,
    attentionRows: paymentAttentionRows,
    subscriptionNote: subscriptionMrrTracked
      ? 'Subscription MRR is calculated from stored monthly price fields on active subscriptions.'
      : 'Subscription count and plan mix are visible, but MRR is not calculable until plan price/currency fields are stored or Stripe prices are queried.',
    health: [
      {
        label: 'Payout-ready clubs',
        value: `${formatCount(stripePayoutReadyCount)}/${formatCount(stripeConnectedCount)}`,
        detail: 'Stripe accounts with payouts enabled out of clubs with a recorded Stripe account.',
        tone: stripeConnectedCount === 0 ? 'neutral' : stripePayoutReadyCount === stripeConnectedCount ? 'good' : 'warn',
      },
      {
        label: 'Payment setup gaps',
        value: formatCount(paidGamesWithoutStripe.length),
        detail: 'Fee-charging games where the club is not connected for payouts.',
        tone: paidGamesWithoutStripe.length > 0 ? 'bad' : 'good',
      },
      {
        label: 'Pending payments',
        value: formatCount(stuckPendingPayments.length),
        detail: 'Bookings with a Stripe intent but no paid flag.',
        tone: stuckPendingPayments.length > 0 ? 'warn' : 'good',
      },
      {
        label: 'Failed payments',
        value: formatCount(failedPaymentBookings.length),
        detail: 'Bookings with failed payment-style statuses in the loaded preview.',
        tone: failedPaymentBookings.length > 0 ? 'bad' : 'good',
      },
      {
        label: 'Refunded bookings',
        value: formatCount(refundedBookings.length),
        detail: 'Bookings marked refunded/succeeded in refund status.',
        tone: refundedBookings.length > 0 ? 'neutral' : 'good',
      },
      {
        label: 'Failed refunds',
        value: formatCount(failedRefundBookings.length),
        detail: 'Refund records that need manual review.',
        tone: failedRefundBookings.length > 0 ? 'bad' : 'good',
      },
      {
        label: 'Credit ledger rows',
        value: formatCount(credits.length),
        detail: 'Loaded player credit records. This is a preview, not a mutation surface.',
        tone: credits.length > 0 ? 'neutral' : 'good',
      },
    ] satisfies PaymentHealthItem[],
    cards: [
      {
        label: 'Active subscribers',
        value: formatCount(activeSubscriberCount),
        detail: `${formatCount(totalSubscriptionRows)} total subscription row${totalSubscriptionRows === 1 ? '' : 's'}, ${formatCount(cancelingSubscriptionCount)} canceling.`,
        tone: activeSubscriberCount > 0 ? 'good' : 'neutral',
      },
      {
        label: 'Subscription MRR',
        value: subscriptionMrrTracked ? formatCents(subscriptionMrrCents) : 'Not tracked',
        detail: subscriptionMrrTracked
          ? 'Monthly recurring subscription value from active subscription price fields.'
          : 'club_subscriptions does not currently expose amount, price, currency, or interval fields.',
        tone: subscriptionMrrTracked ? 'good' : 'warn',
      },
      {
        label: 'Game processing fees',
        value: formatCents(platformRevenueCents),
        detail:
          revenueTrackedCount > 0
            ? 'Known platform_fee_cents recorded on paid bookings.'
            : 'No platform_fee_cents are recorded yet, so true platform take may not be tracked in this table.',
        tone: platformRevenueCents > 0 ? 'good' : 'warn',
      },
      {
        label: 'This month game fees',
        value: formatCents(currentMonthPlatformRevenueCents),
        detail: adminSummaryResult.configured
          ? 'Current calendar month platform fees from all paid bookings.'
          : `${formatCount(currentMonthPaidBookingRows.length)} loaded paid booking${currentMonthPaidBookingRows.length === 1 ? '' : 's'} in the current month.`,
        tone: currentMonthPlatformRevenueCents > 0 ? 'good' : 'neutral',
      },
      {
        label: 'Gross paid bookings',
        value: formatCents(grossPaidCents),
        detail: 'Total paid booking value before club payout and processing costs.',
        tone: grossPaidCents > 0 ? 'good' : 'neutral',
      },
      {
        label: 'Club payouts',
        value: formatCents(clubPayoutCents),
        detail: 'Known club_payout_cents attached to paid bookings.',
        tone: clubPayoutCents > 0 ? 'neutral' : 'warn',
      },
      {
        label: 'Paid booking count',
        value: formatCount(paidBookingCount),
        detail: adminSummaryResult.configured ? 'Paid or succeeded booking records across the full dataset.' : 'Paid or succeeded booking records loaded into this admin view.',
        tone: paidBookingCount > 0 ? 'good' : 'neutral',
      },
    ] satisfies RevenueCardItem[],
  };

  const metrics: Metric[] = [
    { label: 'Total clubs', value: formatCount(totalClubs.count ?? clubs.length), hint: 'All clubs visible to admin' },
    { label: 'Active clubs', value: formatCount(activeClubs), hint: 'Clubs with upcoming games', tone: activeClubs > 0 ? 'good' : 'warn' },
    { label: 'Total players', value: formatCount(totalPlayers.count ?? profiles.length), hint: 'Registered player profiles' },
    { label: 'Upcoming games', value: formatCount(upcomingGames.count ?? games.filter((game) => isUpcomingGame(game, now)).length), hint: 'Future active sessions' },
    { label: 'Bookings this week', value: formatCount(bookingsThisWeek.count), hint: 'Created since week start' },
    { label: 'Paid bookings this week', value: formatCount(paidBookingsThisWeek.count), hint: 'fee_paid bookings', tone: 'good' },
    { label: 'Pending payments', value: formatCount(pendingPayments.count), hint: 'Stripe intent exists, not paid', tone: (pendingPayments.count || 0) > 0 ? 'warn' : 'good' },
    {
      label: 'Compliance queue',
      value: deletionRequestsResult.configured ? formatCount(pendingDeletionRequests) : 'Not configured',
      hint: 'Pending account deletion requests',
      tone: pendingDeletionRequests > 0 ? 'warn' : 'default',
    },
  ];

  const health: { label: string; value: string; detail: string; tone: HealthTone }[] = [
    {
      label: 'Stuck pending payments',
      value: formatCount(stuckPendingPayments.length),
      detail: 'Bookings with a Stripe intent but no paid flag.',
      tone: stuckPendingPayments.length > 0 ? 'warn' : 'good',
    },
    {
      label: 'Expired active holds',
      value: formatCount(expiredActiveHolds.length),
      detail: 'Active booking holds past expiry.',
      tone: expiredActiveHolds.length > 0 ? 'bad' : 'good',
    },
    {
      label: 'Upcoming games with zero players',
      value: formatCount(upcomingGamesWithNoPlayers.length),
      detail: 'Future games with no confirmed bookings.',
      tone: upcomingGamesWithNoPlayers.length > 0 ? 'warn' : 'good',
    },
    {
      label: 'Paid games missing Stripe account',
      value: formatCount(paidGamesWithoutStripe.length),
      detail: 'Fee-charging games whose club has no connected account row.',
      tone: paidGamesWithoutStripe.length > 0 ? 'bad' : 'good',
    },
    {
      label: 'Clubs missing venue/location',
      value: formatCount(clubsWithoutLocation.length),
      detail: 'Clubs without structured address or venue fallback.',
      tone: clubsWithoutLocation.length > 0 ? 'warn' : 'good',
    },
    {
      label: 'Invalid capacity games',
      value: formatCount(games.filter((game) => number(game, 'max_spots') <= 0).length),
      detail: 'Games with zero or invalid max spots.',
      tone: games.some((game) => number(game, 'max_spots') <= 0) ? 'bad' : 'good',
    },
    {
      label: 'Failed notifications',
      value: notificationsResult.configured ? formatCount(failedNotifications) : 'Not configured',
      detail: 'Delivery failures if delivery status is tracked.',
      tone: failedNotifications > 0 ? 'bad' : 'good',
    },
  ];
  const attention: { label: string; value: string; detail: string; tone: StatusTone; href: string }[] = [
    {
      label: 'Pending payments',
      value: formatCount(stuckPendingPayments.length),
      detail: 'Stripe intents that have not resolved as paid.',
      tone: stuckPendingPayments.length > 0 ? 'warn' : 'good',
      href: '/admin?tab=payments',
    },
    {
      label: 'Payment setup gaps',
      value: formatCount(paidGamesWithoutStripe.length),
      detail: 'Fee-charging games where club payout setup needs attention.',
      tone: paidGamesWithoutStripe.length > 0 ? 'bad' : 'good',
      href: '/admin?tab=issues',
    },
    {
      label: 'Compliance requests',
      value: deletionRequestsResult.configured ? formatCount(pendingDeletionRequests) : 'Not configured',
      detail: deletionRequestsResult.configured ? 'Open account deletion requests.' : 'Optional deletion-request table not deployed.',
      tone: pendingDeletionRequests > 0 ? 'warn' : 'neutral',
      href: '/admin?tab=compliance',
    },
    {
      label: 'Failed notifications',
      value: notificationsResult.configured ? formatCount(failedNotifications) : 'Not configured',
      detail: notificationsResult.configured ? 'Delivery errors if notification status is tracked.' : 'Notification health is not exposed to this view.',
      tone: failedNotifications > 0 ? 'bad' : 'neutral',
      href: '/admin?tab=notifications',
    },
  ];
  const rowResults = [
    clubsResult,
    profilesResult,
    gamesResult,
    bookingsResult,
    notificationsResult,
    membersResult,
    adminsResult,
    creditsResult,
    stripeAccountsResult,
    subscriptionsResult,
    deletionRequestsResult,
    legalDocumentsResult,
    venuesResult,
  ];
  const countResults = [totalClubs, totalPlayers, upcomingGames, bookingsThisWeek, paidBookingsThisWeek, pendingPayments];
  const optionalTables = [notificationsResult, membersResult, adminsResult, creditsResult, stripeAccountsResult, subscriptionsResult, deletionRequestsResult, legalDocumentsResult, venuesResult];
  const configuredOptionalTables = optionalTables.filter((result) => result.configured).length;
  const slowestQuery = [...rowResults, ...countResults].sort((a, b) => b.elapsedMs - a.elapsedMs)[0];
  const cappedLoads = rowResults.filter((result) => result.limit !== null && result.data.length >= result.limit);
  const nearCappedLoads = rowResults.filter((result) => result.limit !== null && result.data.length / result.limit >= 0.8 && result.data.length < result.limit);
  const platformWarningCount = warnings.length + cappedLoads.length + nearCappedLoads.length;
  const loadElapsedMs = Date.now() - loadStartedAt;
  const platform: { status: PlatformItem[]; load: PlatformItem[] } = {
    status: [
      {
        label: 'Admin server render',
        value: `${loadElapsedMs}ms`,
        detail: 'Time to read data and compose this command-centre view.',
        tone: loadElapsedMs > 3500 ? 'warn' : 'good',
      },
      {
        label: 'Supabase database',
        value: warnings.length > 0 ? 'Degraded' : 'Connected',
        detail: warnings.length > 0 ? `${warnings.length} required read warning${warnings.length === 1 ? '' : 's'}.` : 'Required read checks completed successfully.',
        tone: warnings.length > 0 ? 'warn' : 'good',
      },
      {
        label: 'Slowest query',
        value: slowestQuery ? `${slowestQuery.elapsedMs}ms` : '-',
        detail: slowestQuery ? slowestQuery.label : 'No query timing captured.',
        tone: slowestQuery && slowestQuery.elapsedMs > 1500 ? 'warn' : 'good',
      },
      {
        label: 'Optional admin surfaces',
        value: `${configuredOptionalTables}/${optionalTables.length}`,
        detail: 'Notifications, memberships, credits, Stripe, compliance, legal, and venue tables visible to this admin view.',
        tone: configuredOptionalTables === optionalTables.length ? 'good' : 'neutral',
      },
      {
        label: 'Provider CPU/RAM/load',
        value: 'Not wired',
        detail: 'Connect Vercel/Supabase metrics APIs or log drains for live infrastructure load.',
        tone: 'neutral',
      },
    ],
    load: [
      ...rowResults.map((result) => {
        const loadRatio = result.limit ? result.data.length / result.limit : 0;
        return {
          label: result.label,
          value: result.configured ? `${formatCount(result.data.length)}${result.limit ? `/${formatCount(result.limit)}` : ''}` : 'Not configured',
          detail: result.warning || `${result.elapsedMs}ms query${result.limit ? `, ${Math.round(loadRatio * 100)}% of row cap` : ''}`,
          tone: result.warning ? 'warn' : result.limit && result.data.length >= result.limit ? 'bad' : loadRatio >= 0.8 ? 'warn' : 'good',
        } satisfies PlatformItem;
      }),
      {
        label: 'Warnings detected',
        value: formatCount(platformWarningCount),
        detail: platformWarningCount > 0 ? 'Required read warnings or row-cap pressure need review.' : 'No required read warnings or row-cap pressure detected.',
        tone: platformWarningCount > 0 ? 'warn' : 'good',
      },
    ],
  };
  const briefing = [
    {
      label: 'What Bookadink has made',
      value: formatCents(platformRevenueCents),
      detail:
        revenueTrackedCount > 0
          ? `Game processing fees are tracked. Subscription MRR is ${subscriptionMrrTracked ? formatCents(subscriptionMrrCents) : 'not tracked until plan prices are stored'}.`
          : 'Platform fee fields are not populated yet, so revenue may be understated until fee capture is written consistently.',
      tone: platformRevenueCents > 0 ? 'good' : 'warn',
      href: '/admin?tab=payments',
    },
    {
      label: 'Money that needs attention',
      value: formatCount(stuckPendingPayments.length),
      detail: 'Pending Stripe intents can mean abandoned checkout, webhook delay, or booking/payment state mismatch.',
      tone: stuckPendingPayments.length > 0 ? 'warn' : 'good',
      href: '/admin?tab=payments',
    },
    {
      label: 'Launch blocker to watch',
      value: formatCount(paidGamesWithoutStripe.length),
      detail: 'Fee-charging games without connected payout setup can create payment or reconciliation pain.',
      tone: paidGamesWithoutStripe.length > 0 ? 'bad' : 'good',
      href: '/admin?tab=issues',
    },
    {
      label: 'Marketplace health',
      value: `${formatCount(activeClubs)} active clubs`,
      detail: `${formatCount(upcomingGames.count ?? games.filter((game) => isUpcomingGame(game, now)).length)} upcoming games are the supply players can actually book.`,
      tone: activeClubs > 0 ? 'good' : 'warn',
      href: '/admin?tab=clubs',
    },
    {
      label: 'Operational warning level',
      value: formatCount(platformWarningCount + failedNotifications + expiredActiveHolds.length),
      detail: 'Combines platform warnings, failed notification signals, and expired active holds.',
      tone: platformWarningCount + failedNotifications + expiredActiveHolds.length > 0 ? 'warn' : 'good',
      href: '/admin?tab=issues',
    },
  ] satisfies { label: string; value: string; detail: string; tone: StatusTone; href: string }[];
  const previewDescription = (visible: number, loaded: number, limit: number | null, label: string) =>
    `${formatCount(visible)} shown from ${formatCount(loaded)} loaded ${label}.${limit ? ` Source read cap: ${formatCount(limit)}.` : ''}`;
  const tableNotes = {
    clubs: previewDescription(clubRows.length, clubs.length, clubsResult.limit, 'club records'),
    players: previewDescription(playerRows.length, profiles.length, profilesResult.limit, 'profile records'),
    bookings: previewDescription(bookingRows.length, bookings.length, bookingsResult.limit, 'booking records'),
    payments: `${formatCount(paymentRows.length)} Stripe-linked or paid bookings shown from ${formatCount(bookings.length)} loaded booking records.${bookingsResult.limit ? ` Booking source read cap: ${formatCount(bookingsResult.limit)}.` : ''}`,
    notifications: notificationsResult.configured
      ? previewDescription(notificationRows.length, notifications.length, notificationsResult.limit, 'notification records')
      : 'Notification table is not available to this admin view.',
  };
  const legalDocumentRows = legalDocuments.slice(0, 6).map((row) => [
    text(row, 'document_type') || text(row, 'type') || text(row, 'slug') || 'document',
    text(row, 'version') || text(row, 'last_updated') || 'current',
    formatDate(text(row, 'created_at') || text(row, 'updated_at')),
  ]);
  const complianceHealth: ComplianceHealthItem[] = [
    {
      label: 'Deletion requests needing action',
      value: deletionRequestsResult.configured ? formatCount(actionDeletionRequests) : 'Not configured',
      detail: deletionRequestsResult.configured ? 'Pending, admin-review, or failed requests that need owner attention.' : 'Service-role deletion queue is not available to this view.',
      tone: actionDeletionRequests > 0 ? 'warn' : deletionRequestsResult.configured ? 'good' : 'neutral',
    },
    {
      label: 'Completed deletion requests',
      value: deletionRequestsResult.configured ? formatCount(completedDeletionRequests) : 'Not configured',
      detail: 'Completed requests remain visible here as an audit/status signal.',
      tone: completedDeletionRequests > 0 ? 'neutral' : 'good',
    },
    {
      label: 'Failed deletion processing',
      value: deletionRequestsResult.configured ? formatCount(failedDeletionRequests) : 'Not configured',
      detail: 'Failures need manual review before retrying the existing processor.',
      tone: failedDeletionRequests > 0 ? 'bad' : deletionRequestsResult.configured ? 'good' : 'neutral',
    },
    {
      label: 'Public legal pages',
      value: 'Active',
      detail: '/terms, /privacy, and /account-deletion are static public routes in the website build.',
      tone: 'good',
    },
    {
      label: 'Legal document library',
      value: legalDocumentsResult.configured ? `${formatCount(legalDocuments.length)} row${legalDocuments.length === 1 ? '' : 's'}` : 'Static pages only',
      detail: legalDocumentsResult.configured ? 'legal_documents rows are visible to the command centre.' : 'No legal_documents table is wired; static pages are the source of truth.',
      tone: legalDocumentsResult.configured ? 'neutral' : 'warn',
    },
  ];

  return {
    warnings,
    generatedAt: format(now, 'd MMM yyyy, h:mm a'),
    briefing,
    attention,
    revenue,
    tableNotes,
    platform,
    metrics,
    clubs: clubRows,
    players: playerRows,
    bookings: bookingRows,
    payments: paymentRows,
    notifications: notificationRows,
    notificationsConfigured: notificationsResult.configured,
    compliance: {
      health: complianceHealth,
      deletions: {
        configured: deletionRequestsResult.configured,
        empty: deletionRequestsResult.configured ? 'No account deletion requests found.' : deletionRequestsResult.warning || 'Deletion requests are not configured for this command centre.',
        requests: deletionRequests.slice(0, 20).map((row) => toDeletionRequestView(row, now)),
      },
      legal: {
        configured: true,
        rows: [
          ['Terms of Service', '/terms', 'static public page active'],
          ['Privacy Policy', '/privacy', 'static public page active'],
          ['Account deletion instructions', '/account-deletion', 'canonical public deletion URL active'],
          ...(legalDocumentsResult.configured
            ? legalDocumentRows
            : [['Legal document table', 'not configured', 'static legal pages remain active; no admin document library is wired']]),
        ],
      },
      support: {
        rows: [
          ['Contact email', 'support@bookadink.com', 'active'],
          ['Support inbox', 'manual review', 'no support ticket table is wired in this admin phase'],
          ['Deletion processor', deletionRequestsResult.configured ? 'available' : 'not configured', deletionRequestsResult.configured ? 'owner/ops can process from this queue' : 'requires service-role configuration'],
        ],
      },
    },
    health,
  };
}

async function safeRows(label: string, run: () => PromiseLike<PostgrestRows>, optional = false, limit: number | null = null): Promise<QueryResult> {
  const startedAt = Date.now();
  const result = await run();
  const elapsedMs = Date.now() - startedAt;
  if (result.error) {
    const missing = isMissingTableError(result.error);
    return {
      data: [],
      configured: !(optional && missing) && !missing,
      warning: optional && missing ? null : `${label}: ${result.error.message}`,
      elapsedMs,
      limit,
      label,
    };
  }

  return {
    data: Array.isArray(result.data) ? result.data.map((row) => toRow(row)) : [],
    configured: true,
    warning: null,
    elapsedMs,
    limit,
    label,
  };
}

function unconfiguredRows(label: string, warning: string | null, limit: number | null = null): QueryResult {
  return { data: [], configured: false, warning, elapsedMs: 0, limit, label };
}

function isMissingTableError(error: { code?: string; message: string }) {
  const message = error.message.toLowerCase();
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    message.includes('does not exist') ||
    message.includes('schema cache') ||
    message.includes('could not find table') ||
    message.includes('could not find the table')
  );
}

async function safeCount(label: string, run: () => PromiseLike<PostgrestCount>): Promise<CountResult> {
  const startedAt = Date.now();
  const result = await run();
  return {
    count: result.error ? null : result.count,
    warning: result.error ? `${label}: ${result.error.message}` : null,
    elapsedMs: Date.now() - startedAt,
    label,
  };
}

function normalizeTab(raw: string | undefined): AdminTab {
  const allowed: AdminTab[] = ['overview', 'clubs', 'players', 'bookings', 'payments', 'notifications', 'compliance', 'platform', 'issues'];
  return allowed.includes(raw as AdminTab) ? (raw as AdminTab) : 'overview';
}

function deletionNotice(
  rawAction: string | undefined,
  rawMessage: string | undefined,
): { title: string; detail: string; tone: 'good' | 'warn' | 'bad' } | null {
  if (!rawAction) return null;
  const message = rawMessage || '';
  const notices: Record<string, { title: string; detail: string; tone: 'good' | 'warn' | 'bad' }> = {
    completed: {
      title: 'Deletion request processed',
      detail:
        'The profile was de-identified, safe references were cleared, sessions were revoked, and retained records remain for audit/legal purposes.',
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

function AccessDenied({ email, reason }: { email: string | null; reason: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="max-w-lg p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error/10 text-error">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary">Access denied</h1>
        <p className="mt-3 text-sm text-text-secondary">{reason}</p>
        {email && <p className="mt-2 text-xs text-text-tertiary">Signed in as {email}</p>}
        <Link href="/" className="mt-6 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">
          Return home
        </Link>
      </Card>
    </main>
  );
}

function Section({
  id,
  title,
  icon,
  description,
  children,
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 pb-5">
      <div className="mb-3 flex flex-col gap-1 border-t border-border pt-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-2 text-text-primary">
          <span className="text-text-secondary">{icon}</span>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        </div>
        {description && <p className="text-xs text-text-secondary">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-border bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${className}`}>{children}</div>;
}

function MetricCard({ metric }: { metric: Metric }) {
  const toneClass =
    metric.tone === 'good'
      ? 'border-success/25 bg-success/5'
      : metric.tone === 'warn'
        ? 'border-warning/25 bg-warning/5'
        : metric.tone === 'bad'
          ? 'border-error/25 bg-error/5'
          : '';

  return (
    <Panel className={`p-4 ${toneClass}`}>
      <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">{metric.label}</p>
      <p className="mt-2 truncate text-2xl font-semibold leading-none text-text-primary">{metric.value}</p>
      <p className="mt-2 min-h-8 text-xs leading-4 text-text-secondary">{metric.hint}</p>
    </Panel>
  );
}

function AttentionQueue({ items }: { items: { label: string; value: string; detail: string; tone: StatusTone; href: string }[] }) {
  return (
    <Panel className="p-0">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Attention queue</h3>
            <p className="mt-0.5 text-xs text-text-secondary">Items worth checking before launch traffic grows.</p>
          </div>
          <Activity className="h-5 w-5 text-text-tertiary" />
        </div>
      </div>
      <div className="divide-y divide-border">
        {items.map((item) => (
          <a key={item.label} href={item.href} className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-surface-tint">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text-primary">{item.label}</p>
              <p className="mt-0.5 truncate text-xs text-text-secondary">{item.detail}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill label={item.value} tone={item.tone} />
              <ArrowUpRight className="h-3.5 w-3.5 text-text-tertiary" />
            </div>
          </a>
        ))}
      </div>
    </Panel>
  );
}

function MeaningRow({ item }: { item: { label: string; value: string; detail: string; tone: StatusTone; href: string } }) {
  return (
    <a href={item.href} className="grid gap-2 rounded-lg border border-border bg-surface-tint px-3 py-2.5 transition hover:bg-white sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-text-primary">{item.label}</p>
        <p className="mt-1 text-xs leading-4 text-text-secondary">{item.detail}</p>
      </div>
      <div className="flex items-center gap-2 sm:justify-end">
        <StatusPill label={item.value} tone={item.tone} />
        <ArrowUpRight className="h-3.5 w-3.5 text-text-tertiary" />
      </div>
    </a>
  );
}

function RevenueCard({ item }: { item: { label: string; value: string; detail: string; tone: StatusTone } }) {
  const toneClass =
    item.tone === 'good'
      ? 'border-success/25 bg-success/5'
      : item.tone === 'warn'
        ? 'border-warning/25 bg-warning/5'
        : item.tone === 'bad'
          ? 'border-error/25 bg-error/5'
          : 'bg-white';

  return (
    <div className={`min-h-32 p-4 ${toneClass}`}>
      <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">{item.label}</p>
      <p className="mt-2 truncate text-2xl font-semibold leading-none text-text-primary">{item.value}</p>
      <p className="mt-2 text-xs leading-4 text-text-secondary">{item.detail}</p>
    </div>
  );
}

function RevenueAuthorityPanel({ configured, scope }: { configured: boolean; scope: string }) {
  return (
    <Panel className={`mb-3 p-4 ${configured ? 'border-success/20 bg-success/5' : 'border-warning/25 bg-warning/5'}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Revenue source of truth</h3>
          <p className="mt-1 text-sm leading-5 text-text-secondary">{scope}</p>
        </div>
        <StatusPill label={configured ? 'Server-authoritative totals' : 'Preview totals only'} tone={configured ? 'good' : 'warn'} />
      </div>
    </Panel>
  );
}

function PaymentHealthPanel({ items, attentionRows }: { items: PaymentHealthItem[]; attentionRows: PaymentAttentionRow[] }) {
  return (
    <div className="mb-3 grid gap-3 xl:grid-cols-[0.9fr_1.1fr]">
      <Panel className="overflow-hidden p-0">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-text-primary">Payment health</h3>
          <p className="mt-0.5 text-xs text-text-secondary">Read-only counters from Stripe, booking, refund, and credit fields already loaded by the command centre.</p>
        </div>
        <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-1 xl:divide-x-0 xl:divide-y">
          {items.map((item) => (
            <div key={item.label} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text-primary">{item.label}</p>
                  <p className="mt-1 text-xs leading-4 text-text-secondary">{item.detail}</p>
                </div>
                <StatusPill label={item.value} tone={item.tone} />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="overflow-hidden p-0">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-text-primary">Payment items needing attention</h3>
          <p className="mt-0.5 text-xs text-text-secondary">No buttons here yet. This is a triage list for follow-up in Stripe, Supabase, or club ops.</p>
        </div>
        {attentionRows.length === 0 ? (
          <p className="px-4 py-6 text-sm text-text-secondary">No payment setup, refund, or pending-payment issues were found in the loaded preview.</p>
        ) : (
          <div className="divide-y divide-border">
            {attentionRows.map((row, index) => (
              <div key={`${row.item}-${row.clubName}-${index}`} className="grid gap-2 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text-primary">{row.item}</p>
                  <p className="mt-1 text-xs leading-4 text-text-secondary">
                    <span className="font-semibold text-text-primary">{row.clubName}</span> · {row.detail}
                  </p>
                </div>
                <StatusPill label={row.status} tone={row.statusTone} />
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function StripeSetupPanel({ rows, configured }: { rows: StripeSetupRow[]; configured: boolean }) {
  return (
    <Panel className="mb-3 overflow-hidden p-0">
      <div className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Club payment setup</h3>
          <p className="mt-0.5 text-xs text-text-secondary">Stripe Connect readiness by club, shown alongside plan and subscription status where available.</p>
        </div>
        <StatusPill label={configured ? `${formatCount(rows.length)} shown` : 'not configured'} tone={configured ? 'neutral' : 'warn'} />
      </div>
      {!configured ? (
        <p className="px-4 py-6 text-sm text-text-secondary">Stripe account data is not available to this admin view.</p>
      ) : rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-text-secondary">No clubs matched the current payment setup view.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-separate border-spacing-0 text-[13px]">
            <thead>
              <tr>
                {['Club', 'Plan', 'Subscription', 'Stripe', 'Operational note'].map((column) => (
                  <th key={column} className="border-b border-border bg-[#FAFAFB] px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-text-tertiary first:pl-4 last:pr-4">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {rows.map((row) => (
                <tr key={`${row.clubName}-${row.plan}`} className="align-top transition odd:bg-white even:bg-[#FCFCFD] hover:bg-surface-tint">
                  <td className="max-w-[240px] border-b border-border/80 px-3 py-2.5 text-text-secondary first:pl-4">
                    <span className="block truncate" title={row.clubName}>{row.clubName}</span>
                  </td>
                  <td className="border-b border-border/80 px-3 py-2.5 text-text-secondary">
                    <StatusPill label={row.plan} tone="neutral" />
                  </td>
                  <td className="border-b border-border/80 px-3 py-2.5 text-text-secondary">
                    <StatusPill label={row.subscriptionStatus} tone={subscriptionStatusTone(row.subscriptionStatus)} />
                  </td>
                  <td className="border-b border-border/80 px-3 py-2.5 text-text-secondary">
                    <StatusPill label={row.stripeStatus} tone={row.stripeTone} />
                  </td>
                  <td className="border-b border-border/80 px-3 py-2.5 text-text-secondary last:pr-4">{row.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function SubscriptionRevenuePanel({
  rows,
  planRows,
  note,
}: {
  rows: SubscriptionRevenueRow[];
  planRows: SubscriptionPlanRow[];
  note: string;
}) {
  return (
    <div className="mb-3 grid gap-3 xl:grid-cols-[0.7fr_1.3fr]">
      <Panel className="overflow-hidden p-0">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-text-primary">Subscription plan mix</h3>
          <p className="mt-0.5 text-xs text-text-secondary">{note}</p>
        </div>
        <div className="divide-y divide-border">
          {planRows.length === 0 ? (
            <p className="px-4 py-6 text-sm text-text-secondary">No club subscription rows matched this view.</p>
          ) : (
            planRows.map((row) => (
              <div key={`${row.plan}-${row.status}`} className="grid grid-cols-[1fr_auto] gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text-primary">{row.plan}</p>
                  <p className="mt-0.5 text-xs text-text-secondary">{row.status}</p>
                </div>
                <StatusPill label={row.count} tone={row.tone} />
              </div>
            ))
          )}
        </div>
      </Panel>

      <Panel className="overflow-hidden p-0">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-text-primary">Club subscriptions</h3>
          <p className="mt-0.5 text-xs text-text-secondary">Which clubs are subscribed, their plan, status, billing source, and tracked MRR.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-0 text-[13px]">
            <thead>
              <tr>
                {['Club', 'Plan', 'Status', 'Source', 'Period end', 'MRR'].map((column) => (
                  <th key={column} className="border-b border-border bg-[#FAFAFB] px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-text-tertiary first:pl-4 last:pr-4">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-text-secondary">
                    No club subscription rows matched this view.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={`${row.clubName}-${row.plan}-${row.status}`} className="align-top transition odd:bg-white even:bg-[#FCFCFD] hover:bg-surface-tint">
                    <td className="max-w-[220px] border-b border-border/80 px-3 py-2.5 text-text-secondary first:pl-4">
                      <span className="block truncate" title={row.clubName}>{row.clubName}</span>
                    </td>
                    <td className="border-b border-border/80 px-3 py-2.5 text-text-secondary">
                      <StatusPill label={row.plan} tone="neutral" />
                    </td>
                    <td className="border-b border-border/80 px-3 py-2.5 text-text-secondary">
                      <StatusPill label={row.status} tone={subscriptionStatusTone(row.status)} />
                    </td>
                    <td className="border-b border-border/80 px-3 py-2.5 text-text-secondary">{row.source}</td>
                    <td className="border-b border-border/80 px-3 py-2.5 text-text-secondary">{row.periodEnd}</td>
                    <td className="border-b border-border/80 px-3 py-2.5 text-text-secondary last:pr-4">
                      <StatusPill label={row.mrr} tone={row.mrrTracked ? 'good' : 'warn'} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function DataTable({
  columns,
  rows,
  empty,
  caption,
  note,
}: {
  columns: string[];
  rows: React.ReactNode[][];
  empty: string;
  caption?: string;
  note?: string;
}) {
  return (
    <Panel className="overflow-hidden p-0">
      {(caption || note) && (
        <div className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {caption && <h3 className="text-sm font-semibold text-text-primary">{caption}</h3>}
            {note && <p className="mt-1 text-xs leading-4 text-text-secondary">{note}</p>}
          </div>
          <StatusPill label={`${formatCount(rows.length)} shown`} tone="neutral" />
        </div>
      )}
      <div className="overflow-x-auto print:overflow-visible">
        <table className="w-full min-w-[980px] border-separate border-spacing-0 text-[13px] print:min-w-0">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column} className="border-b border-border bg-[#FAFAFB] px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-text-tertiary first:pl-4 last:pr-4">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-text-secondary">
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={index} className="align-top transition odd:bg-white even:bg-[#FCFCFD] hover:bg-surface-tint">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="max-w-[240px] border-b border-border/80 px-3 py-2.5 text-text-secondary first:pl-4 last:pr-4">
                      {typeof cell === 'string' ? <span className="block truncate" title={cell}>{cell}</span> : cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function ComplianceHealthPanel({ items }: { items: ComplianceHealthItem[] }) {
  return (
    <div className="mb-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => (
        <Panel key={item.label} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">{item.label}</p>
              <p className="mt-2 truncate text-2xl font-semibold leading-none text-text-primary">{item.value}</p>
            </div>
            <StatusPill label={item.tone === 'bad' ? 'review' : item.tone === 'warn' ? 'watch' : item.tone === 'good' ? 'ok' : 'info'} tone={item.tone} />
          </div>
          <p className="mt-3 text-xs leading-4 text-text-secondary">{item.detail}</p>
        </Panel>
      ))}
    </div>
  );
}

function ComplianceCard({ title, configured, rows, empty }: { title: string; configured: boolean; rows: string[][]; empty: string }) {
  return (
    <Panel className="p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        <StatusPill label={configured ? 'available' : 'not configured'} tone={configured ? 'good' : 'neutral'} />
      </div>
      {rows.length === 0 ? (
        <p className="min-h-12 text-sm leading-5 text-text-secondary">{empty}</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, index) => (
            <div key={index} className="rounded-lg border border-border bg-surface-tint px-3 py-2">
              <p className="truncate text-sm font-medium text-text-primary">{row[0]}</p>
              <p className="mt-1 text-xs text-text-secondary">{row[1]}</p>
              <p className="mt-1 text-xs text-text-tertiary">{row[2]}</p>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
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
    <Panel className="overflow-hidden p-0">
      <div className="border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Account deletion requests</h3>
            <p className="mt-1 text-xs leading-4 text-text-secondary">
              Review user requests, resolve club ownership when required, then run the service-role de-identification processor.
            </p>
          </div>
          <StatusPill label={configured ? 'available' : 'not configured'} tone={configured ? 'good' : 'neutral'} />
        </div>
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
                    <span className="font-semibold text-text-primary">Age:</span> {request.requestAge}
                  </p>
                  <p>
                    <span className="font-semibold text-text-primary">Completed:</span> {request.completedAt}
                  </p>
                  <p>
                    <span className="font-semibold text-text-primary">Action:</span> {request.canProcess ? 'owner/ops review available' : 'read-only status record'}
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
                    <p className="sm:col-span-2 text-error">
                      <span className="font-semibold">Latest error:</span> {request.errorMessage}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-surface-tint p-3">
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
                    <p className="text-[11px] leading-4 text-text-tertiary">
                      Does not hard-delete Auth. Retained records stay for audit, payments, and legal needs.
                    </p>
                  </form>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-text-primary">
                      {request.canProcess ? 'Read-only access' : 'No action available'}
                    </p>
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
    </Panel>
  );
}

function HealthCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: HealthTone }) {
  const Icon = tone === 'good' ? CheckCircle2 : AlertTriangle;
  const toneClass = tone === 'good' ? 'text-success' : tone === 'warn' ? 'text-warning' : 'text-error';
  return (
    <Panel className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold leading-5 text-text-primary">{label}</p>
          <p className="mt-1 text-xs leading-4 text-text-secondary">{detail}</p>
        </div>
        <Icon className={`h-5 w-5 flex-shrink-0 ${toneClass}`} />
      </div>
      <p className="mt-4 text-2xl font-semibold leading-none text-text-primary">{value}</p>
    </Panel>
  );
}

function StatusRow({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: PlatformTone }) {
  return (
    <div className="rounded-lg border border-border bg-surface-tint px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-sm font-semibold text-text-primary">{label}</p>
        <StatusPill label={value} tone={platformToneToStatus(tone)} />
      </div>
      <p className="mt-1 text-xs leading-4 text-text-secondary">{detail}</p>
    </div>
  );
}

function LoadRow({ item }: { item: PlatformItem }) {
  const indicatorClass = {
    good: 'bg-success',
    warn: 'bg-warning',
    bad: 'bg-error',
    neutral: 'bg-disabled',
  }[item.tone];

  return (
    <div className="grid gap-2 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`h-2 w-2 flex-shrink-0 rounded-full ${indicatorClass}`} />
          <p className="truncate text-sm font-semibold text-text-primary">{item.label}</p>
        </div>
        <p className="mt-1 truncate text-xs text-text-secondary">{item.detail}</p>
      </div>
      <StatusPill label={item.value} tone={platformToneToStatus(item.tone)} />
    </div>
  );
}

function platformToneToStatus(tone: PlatformTone): StatusTone {
  if (tone === 'bad') return 'bad';
  if (tone === 'warn') return 'warn';
  if (tone === 'good') return 'good';
  return 'neutral';
}

function StatusPill({ label, tone }: { label: string; tone: StatusTone }) {
  const classes = {
    dark: 'bg-primary text-white',
    neutral: 'bg-background text-text-secondary',
    info: 'bg-info/10 text-info',
    good: 'bg-success/10 text-success',
    warn: 'bg-warning/10 text-warning',
    bad: 'bg-error/10 text-error',
  }[tone];
  return <span className={`inline-flex max-w-full whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${classes}`}>{label}</span>;
}

function Mono({ value }: { value: string }) {
  return (
    <code className="block max-w-[180px] truncate rounded-md border border-border bg-background px-2 py-1 font-mono text-[11px] text-text-secondary" title={value}>
      {value}
    </code>
  );
}

function toRow(valueToConvert: unknown): Row {
  return valueToConvert && typeof valueToConvert === 'object' && !Array.isArray(valueToConvert)
    ? (valueToConvert as Row)
    : {};
}

function value(row: Row | undefined, key: string): unknown {
  return row ? row[key] : undefined;
}

function text(row: Row | undefined, key: string): string {
  const raw = value(row, key);
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'number' || typeof raw === 'boolean') return String(raw);
  return '';
}

function toDeletionRequestView(row: Row, now: Date): DeletionRequestView {
  const status = text(row, 'status') || 'pending';
  const requestedAtRaw = text(row, 'requested_at') || text(row, 'created_at');
  return {
    id: text(row, 'id'),
    account: text(row, 'email') || text(row, 'user_email') || text(row, 'user_id') || 'Unknown account',
    userId: text(row, 'user_id') || '-',
    status,
    statusTone: deletionStatusTone(status),
    requestedAt: formatDate(requestedAtRaw),
    requestAge: requestAgeLabel(requestedAtRaw, now),
    completedAt: formatDate(text(row, 'completed_at')),
    reason: text(row, 'reason') || '-',
    adminNotes: text(row, 'admin_notes') || '-',
    errorMessage: text(row, 'latest_error') || text(row, 'error_message') || '-',
    canProcess: status === 'pending' || status === 'requires_admin_review',
  };
}

function requestAgeLabel(raw: string, now: Date) {
  if (!raw) return '-';
  const timestamp = new Date(raw).getTime();
  if (!Number.isFinite(timestamp)) return '-';
  const days = Math.max(0, Math.floor((now.getTime() - timestamp) / (24 * 60 * 60 * 1000)));
  if (days === 0) return 'today';
  if (days === 1) return '1 day';
  return `${days} days`;
}

function isOpenDeletionStatus(status: string) {
  return (
    !status ||
    status === 'pending' ||
    status === 'processing' ||
    status === 'requires_admin_review' ||
    status === 'failed' ||
    status === 'open'
  );
}

function deletionStatusTone(status: string): StatusTone {
  if (status === 'completed') return 'good';
  if (status === 'failed' || status === 'rejected') return 'bad';
  if (status === 'requires_admin_review' || status === 'processing') return 'warn';
  return 'neutral';
}

function number(row: Row | undefined, key: string): number {
  const raw = value(row, key);
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function summaryNumber(valueToRead: unknown, fallback: number): number {
  if (typeof valueToRead === 'number' && Number.isFinite(valueToRead)) return valueToRead;
  if (typeof valueToRead === 'string') {
    const parsed = Number(valueToRead);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function bool(row: Row | undefined, key: string): boolean {
  return value(row, key) === true;
}

function mapById(rows: Row[]) {
  return mapByKey(rows, 'id');
}

function mapByKey(rows: Row[], key: string) {
  const map = new Map<string, Row>();
  rows.forEach((row) => {
    const rowKey = text(row, key);
    if (rowKey) map.set(rowKey, row);
  });
  return map;
}

function groupByKey(rows: Row[], key: string) {
  const map = new Map<string, Row[]>();
  rows.forEach((row) => {
    const rowKey = text(row, key);
    if (!rowKey) return;
    const group = map.get(rowKey) || [];
    group.push(row);
    map.set(rowKey, group);
  });
  return map;
}

function countBy(rows: Row[], key: string) {
  const map = new Map<string, number>();
  rows.forEach((row) => {
    const rowKey = text(row, key);
    if (rowKey) map.set(rowKey, (map.get(rowKey) || 0) + 1);
  });
  return map;
}

function sumCreditsByUser(rows: Row[]) {
  const map = new Map<string, number>();
  rows.forEach((row) => {
    const userId = text(row, 'user_id');
    if (!userId) return;
    map.set(userId, (map.get(userId) || 0) + number(row, 'amount_cents'));
  });
  return map;
}

function startOfWeekIso(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString();
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isUpcomingGame(game: Row | undefined, now: Date) {
  const dateTime = text(game, 'date_time');
  if (!dateTime) return false;
  const status = text(game, 'status');
  return status !== 'cancelled' && status !== 'completed' && new Date(dateTime).getTime() >= now.getTime();
}

function clubLocation(club: Row, venues: Row[]) {
  const parts = [
    text(club, 'venue_name'),
    text(club, 'suburb'),
    text(club, 'state'),
    text(club, 'postcode'),
  ].filter(Boolean);
  if (parts.length > 0) return parts.join(', ');
  const venue = venues[0];
  const venueParts = [text(venue, 'name'), text(venue, 'suburb'), text(venue, 'address')].filter(Boolean);
  return venueParts.join(', ') || text(club, 'location') || 'Missing location';
}

function stripeStatus(row: Row | undefined) {
  if (!row) return 'not connected';
  if (bool(row, 'payouts_enabled')) return 'payouts enabled';
  if (bool(row, 'onboarding_complete')) return 'onboarded';
  if (text(row, 'stripe_account_id')) return 'onboarding';
  return 'not connected';
}

function stripeTone(row: Row | undefined): 'neutral' | 'good' | 'warn' {
  if (!row) return 'neutral';
  if (bool(row, 'payouts_enabled')) return 'good';
  return 'warn';
}

function bookingPaymentStatus(booking: Row) {
  const explicit = text(booking, 'payment_status');
  if (explicit) {
    return {
      label: explicit,
      tone: explicit === 'paid' || explicit === 'succeeded' ? 'good' : explicit.includes('pending') ? 'warn' : 'neutral',
    } as const;
  }
  if (bool(booking, 'fee_paid')) return { label: 'paid', tone: 'good' } as const;
  if (text(booking, 'stripe_payment_intent_id')) return { label: 'pending_payment', tone: 'warn' } as const;
  return { label: 'not paid', tone: 'neutral' } as const;
}

function isPaidBooking(booking: Row) {
  const status = text(booking, 'payment_status');
  return bool(booking, 'fee_paid') || status === 'paid' || status === 'succeeded';
}

function bookingPaidAt(booking: Row) {
  const raw = text(booking, 'paid_at') || text(booking, 'charge_captured_at') || text(booking, 'created_at');
  const timestamp = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function bookingGrossCents(booking: Row, game: Row | undefined) {
  const amount = number(booking, 'amount_cents');
  if (amount > 0) return amount;
  const splitAmount = number(booking, 'platform_fee_cents') + number(booking, 'club_payout_cents');
  if (splitAmount > 0) return splitAmount;
  const gameFee = number(game, 'fee_amount');
  return gameFee > 0 ? Math.round(gameFee * 100) : 0;
}

function refundStatus(booking: Row) {
  const status = text(booking, 'refund_status');
  if (!status) return { label: 'not tracked', tone: 'neutral' } as const;
  if (status === 'succeeded' || status === 'refunded') return { label: status, tone: 'good' } as const;
  if (status === 'failed') return { label: status, tone: 'bad' } as const;
  return { label: status, tone: 'warn' } as const;
}

function bookingTone(booking: Row): 'neutral' | 'good' | 'warn' | 'bad' {
  const status = text(booking, 'status');
  if (status === 'confirmed') return 'good';
  if (status === 'waitlisted') return 'warn';
  if (status === 'cancelled') return 'bad';
  return 'neutral';
}

function formatBookingFee(booking: Row, game: Row | undefined) {
  const cents = number(booking, 'amount_cents') || number(booking, 'platform_fee_cents') + number(booking, 'club_payout_cents');
  if (cents > 0) return formatCents(cents);
  const gameFee = number(game, 'fee_amount');
  return gameFee > 0 ? formatDollars(gameFee) : '$0.00';
}

function formatPaymentAmount(booking: Row, game: Row | undefined) {
  const cents = number(booking, 'amount_cents') || number(booking, 'platform_fee_cents') + number(booking, 'club_payout_cents');
  if (cents > 0) return formatCents(cents);
  return formatBookingFee(booking, game);
}

function normalizedSubscriptionPlan(subscription: Row, club: Row | undefined) {
  return text(subscription, 'plan_type') || text(subscription, 'tier') || text(subscription, 'plan') || text(club, 'subscription_tier') || 'unknown';
}

function subscriptionMonthlyCents(subscription: Row) {
  const directMonthly = number(subscription, 'monthly_amount_cents') || number(subscription, 'mrr_cents') || number(subscription, 'monthly_price_cents');
  if (directMonthly > 0) return directMonthly;

  const amount = number(subscription, 'price_cents') || number(subscription, 'amount_cents') || number(subscription, 'unit_amount_cents');
  if (amount <= 0) return 0;

  const interval = text(subscription, 'billing_interval') || text(subscription, 'interval');
  if (interval === 'year' || interval === 'annual' || interval === 'yearly') return Math.round(amount / 12);
  return amount;
}

function isActiveSubscriptionStatus(status: string) {
  return status === 'active' || status === 'trialing';
}

function isCancelingSubscriptionStatus(status: string) {
  return status === 'canceling' || status === 'cancelling' || status === 'cancel_at_period_end';
}

function subscriptionStatusTone(status: string): StatusTone {
  if (isActiveSubscriptionStatus(status)) return 'good';
  if (isCancelingSubscriptionStatus(status)) return 'warn';
  if (status === 'past_due' || status === 'unpaid' || status === 'incomplete') return 'bad';
  return 'neutral';
}

function planBreakdown(rows: SubscriptionRevenueRow[]) {
  const groups = new Map<string, { plan: string; status: string; count: number; tone: StatusTone }>();
  rows.forEach((row) => {
    const key = `${row.plan}::${row.status}`;
    const existing = groups.get(key) || { plan: row.plan, status: row.status, count: 0, tone: subscriptionStatusTone(row.status) };
    existing.count += 1;
    groups.set(key, existing);
  });
  return Array.from(groups.values())
    .sort((a, b) => b.count - a.count || a.plan.localeCompare(b.plan) || a.status.localeCompare(b.status))
    .map((row) => ({
      plan: row.plan,
      status: row.status,
      count: formatCount(row.count),
      tone: row.tone,
    })) satisfies SubscriptionPlanRow[];
}

function formatDollars(valueToFormat: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(valueToFormat);
}

function formatCents(cents: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(cents / 100);
}

function formatCount(count: CountValue | number) {
  return count === null ? '-' : new Intl.NumberFormat('en-AU').format(count);
}

function formatDate(raw: string) {
  if (!raw) return '-';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '-';
  return format(date, 'd MMM yyyy, h:mm a');
}

function latestDate(values: string[]) {
  return values
    .filter(Boolean)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
}

function pendingPaymentBookings(bookings: Row[]) {
  return bookings.filter((booking) => text(booking, 'stripe_payment_intent_id') && !bool(booking, 'fee_paid') && text(booking, 'status') !== 'cancelled');
}

function expiredHolds(bookings: Row[], now: Date) {
  return bookings.filter((booking) => {
    const expiresAt = text(booking, 'hold_expires_at');
    return expiresAt && text(booking, 'status') !== 'cancelled' && new Date(expiresAt).getTime() < now.getTime();
  });
}

function emptyUpcomingGames(games: Row[], bookings: Row[], now: Date) {
  const confirmedByGame = countBy(bookings.filter((booking) => text(booking, 'status') === 'confirmed'), 'game_id');
  return games.filter((game) => isUpcomingGame(game, now) && (confirmedByGame.get(text(game, 'id')) || 0) === 0);
}

function paidGamesMissingStripe(games: Row[], clubs: Row[], stripeAccounts: Row[]) {
  const clubIdsWithStripe = new Set(stripeAccounts.map((row) => text(row, 'club_id')).filter(Boolean));
  const existingClubIds = new Set(clubs.map((club) => text(club, 'id')).filter(Boolean));
  return games.filter((game) => number(game, 'fee_amount') > 0 && existingClubIds.has(text(game, 'club_id')) && !clubIdsWithStripe.has(text(game, 'club_id')));
}

function clubsMissingLocation(clubs: Row[], venuesByClubId: Map<string, Row[]>) {
  return clubs.filter((club) => clubLocation(club, venuesByClubId.get(text(club, 'id')) || []) === 'Missing location');
}
