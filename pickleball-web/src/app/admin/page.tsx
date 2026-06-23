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
import { Card } from '@/components/ui';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Internal Admin - Bookadink',
  description: 'Bookadink internal beta operations command centre.',
};

type SearchParams = Promise<{ q?: string; tab?: string }>;
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
type AdminTab = 'overview' | 'clubs' | 'players' | 'bookings' | 'payments' | 'notifications' | 'compliance' | 'platform' | 'issues';

export default async function AdminPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const query = (params.q || '').trim();
  const activeTab = normalizeTab(params.tab);
  const admin = await requireBusinessAdmin();

  if (!admin.allowed) {
    return <AccessDenied email={admin.email} reason={admin.reason} />;
  }

  const dashboard = await loadAdminDashboard(admin.supabase, query);

  const navItems = [
    { id: 'overview' as const, label: 'Overview', icon: Database },
    { id: 'clubs' as const, label: 'Clubs', icon: Building2 },
    { id: 'players' as const, label: 'Players', icon: Users },
    { id: 'bookings' as const, label: 'Bookings', icon: Ticket },
    { id: 'payments' as const, label: 'Payments', icon: CreditCard },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'compliance' as const, label: 'Compliance', icon: FileText },
    { id: 'platform' as const, label: 'Platform', icon: Server },
    { id: 'issues' as const, label: 'Issues', icon: HeartPulse },
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
          <nav className="mt-5 space-y-1">
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
                  {item.label}
                </a>
              ))}
            </div>
          </header>

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
                  <div className="grid gap-0 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
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
            <Section id="clubs" title="Clubs" icon={<Building2 className="h-5 w-5" />} description={`${dashboard.clubs.length} clubs in this view`}>
              <DataTable
                empty="No clubs matched this view."
                columns={['Club', 'Location', 'Subscription', 'Stripe', 'Members', 'Admins', 'Upcoming', 'Created', 'Last activity']}
                rows={dashboard.clubs.map((club) => [
                  club.name,
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
            <Section id="players" title="Players" icon={<Users className="h-5 w-5" />} description={`${dashboard.players.length} player profiles in this view`}>
              <DataTable
                empty="No players matched this view."
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
            <Section id="bookings" title="Bookings" icon={<Ticket className="h-5 w-5" />} description={`${dashboard.bookings.length} recent bookings in this view`}>
              <DataTable
                empty="No bookings matched this view."
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
            <Section id="payments" title="Payments" icon={<CreditCard className="h-5 w-5" />} description={`${dashboard.payments.length} Stripe-linked booking records`}>
              <div className="mb-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {dashboard.revenue.cards.map((item) => (
                  <RevenueCard key={item.label} item={item} />
                ))}
              </div>
              <DataTable
                empty="No paid or Stripe-linked bookings matched this view."
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
            <Section id="notifications" title="Notifications" icon={<Bell className="h-5 w-5" />} description={dashboard.notificationsConfigured ? `${dashboard.notifications.length} notification records` : 'Notification table not available to this admin view'}>
              <DataTable
                empty={dashboard.notificationsConfigured ? 'No notifications matched this view.' : 'Notification health is unavailable until admin notification RLS is deployed.'}
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
            <Section id="compliance" title="Compliance" icon={<FileText className="h-5 w-5" />} description="Launch-readiness surfaces for privacy, legal, and support signals">
              <div className="grid gap-3 lg:grid-cols-3">
                <ComplianceCard title="Account deletion requests" configured={dashboard.compliance.deletions.configured} rows={dashboard.compliance.deletions.rows} empty="No account deletion request table or pending requests found." />
                <ComplianceCard title="Legal documents" configured={dashboard.compliance.legal.configured} rows={dashboard.compliance.legal.rows} empty="No legal_documents table found. Website pages are still available at /terms and /privacy." />
                <ComplianceCard title="Support signals" configured rows={dashboard.compliance.support.rows} empty="No dedicated support request table found in this first read-only version." />
              </div>
            </Section>
          )}

          {activeTab === 'platform' && (
            <Section id="platform-health" title="Platform Health" icon={<Server className="h-5 w-5" />} description="Read-only service reachability, query timing, schema availability, and load pressure">
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
            <Section id="system-health" title="Warning Issues" icon={<HeartPulse className="h-5 w-5" />} description="Read-only checks for payment, venue, game, and notification data quality">
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

  const [
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
    safeRows('clubs', () => supabase.from('clubs').select('*').order('created_at', { ascending: false }).limit(300), false, 300),
    safeRows('profiles', () =>
      supabase
        .from('profiles')
        .select('id,email,full_name,dupr_rating,created_at,updated_at')
        .order('created_at', { ascending: false })
        .limit(500),
      false,
      500,
    ),
    safeRows('games', () => supabase.from('games').select('*').order('date_time', { ascending: false }).limit(500), false, 500),
    safeRows('bookings', () => supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(600), false, 600),
    safeRows('notifications', () => supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(250), true, 250),
    safeRows('club_members', () => supabase.from('club_members').select('*').limit(1000), true, 1000),
    safeRows('club_admins', () => supabase.from('club_admins').select('*').limit(500), true, 500),
    safeRows('player_credits', () => supabase.from('player_credits').select('*').limit(1000), true, 1000),
    safeRows('club_stripe_accounts', () => supabase.from('club_stripe_accounts').select('*').limit(500), true, 500),
    safeRows('club_subscriptions', () => supabase.from('club_subscriptions').select('*').limit(500), true, 500),
    safeRows('account_deletion_requests', () => supabase.from('account_deletion_requests').select('*').order('created_at', { ascending: false }).limit(100), true, 100),
    safeRows('legal_documents', () => supabase.from('legal_documents').select('*').order('created_at', { ascending: false }).limit(20), true, 20),
    safeRows('club_venues', () => supabase.from('club_venues').select('*').limit(500), true, 500),
    safeCount('clubs', () => supabase.from('clubs').select('id', { count: 'exact', head: true })),
    safeCount('profiles', () => supabase.from('profiles').select('id', { count: 'exact', head: true })),
    safeCount('upcoming games', () =>
      supabase.from('games').select('id', { count: 'exact', head: true }).eq('status', 'upcoming').gte('date_time', nowIso),
    ),
    safeCount('bookings this week', () => supabase.from('bookings').select('id', { count: 'exact', head: true }).gte('created_at', weekStart)),
    safeCount('paid bookings this week', () =>
      supabase.from('bookings').select('id', { count: 'exact', head: true }).gte('created_at', weekStart).eq('fee_paid', true),
    ),
    safeCount('pending payment bookings', () =>
      supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('fee_paid', false)
        .not('stripe_payment_intent_id', 'is', null),
    ),
  ]);

  [
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
  const pendingDeletionRequests = deletionRequests.filter((row) => {
    const status = text(row, 'status');
    return !status || status === 'pending' || status === 'open';
  }).length;
  const stuckPendingPayments = pendingPaymentBookings(bookings);
  const expiredActiveHolds = expiredHolds(bookings, now);
  const upcomingGamesWithNoPlayers = emptyUpcomingGames(games, bookings, now);
  const paidGamesWithoutStripe = paidGamesMissingStripe(games, clubs, stripeAccounts);
  const clubsWithoutLocation = clubsMissingLocation(clubs, venueByClubId);
  const paidBookingRows = bookings.filter((booking) => isPaidBooking(booking));
  const grossPaidCents = paidBookingRows.reduce((sum, booking) => {
    const game = gameById.get(text(booking, 'game_id'));
    return sum + bookingGrossCents(booking, game);
  }, 0);
  const platformRevenueCents = paidBookingRows.reduce((sum, booking) => sum + number(booking, 'platform_fee_cents'), 0);
  const clubPayoutCents = paidBookingRows.reduce((sum, booking) => sum + number(booking, 'club_payout_cents'), 0);
  const revenueTrackedCount = paidBookingRows.filter((booking) => number(booking, 'platform_fee_cents') > 0).length;
  const revenue = {
    scope: `Based on ${formatCount(paidBookingRows.length)} loaded paid booking${paidBookingRows.length === 1 ? '' : 's'}. Stripe fees, refunds, and bank settlement timing are not included.`,
    cards: [
      {
        label: 'Platform revenue',
        value: formatCents(platformRevenueCents),
        detail:
          revenueTrackedCount > 0
            ? 'Known platform_fee_cents recorded on paid bookings.'
            : 'No platform_fee_cents are recorded yet, so true platform take may not be tracked in this table.',
        tone: platformRevenueCents > 0 ? 'good' : 'warn',
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
        value: formatCount(paidBookingRows.length),
        detail: 'Paid or succeeded booking records loaded into this admin view.',
        tone: paidBookingRows.length > 0 ? 'good' : 'neutral',
      },
    ] satisfies { label: string; value: string; detail: string; tone: StatusTone }[],
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
          ? 'This is the recorded platform fee from paid bookings loaded into this view.'
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

  return {
    warnings,
    generatedAt: format(now, 'd MMM yyyy, h:mm a'),
    briefing,
    attention,
    revenue,
    platform,
    metrics,
    clubs: clubRows,
    players: playerRows,
    bookings: bookingRows,
    payments: paymentRows,
    notifications: notificationRows,
    notificationsConfigured: notificationsResult.configured,
    compliance: {
      deletions: {
        configured: deletionRequestsResult.configured,
        rows: deletionRequests.slice(0, 8).map((row) => [
          text(row, 'email') || text(row, 'user_email') || text(row, 'user_id') || 'Unknown account',
          text(row, 'status') || 'pending',
          formatDate(text(row, 'created_at')),
        ]),
      },
      legal: {
        configured: legalDocumentsResult.configured,
        rows: legalDocuments.slice(0, 8).map((row) => [
          text(row, 'document_type') || text(row, 'type') || text(row, 'slug') || 'document',
          text(row, 'version') || text(row, 'last_updated') || 'current',
          formatDate(text(row, 'created_at') || text(row, 'updated_at')),
        ]),
      },
      support: {
        rows: [
          ['Contact email', 'support@bookadink.com', 'active'],
          ['Public privacy page', '/privacy', 'active'],
          ['Public terms page', '/terms', 'active'],
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
        <Link href="/dashboard" className="mt-6 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">
          Return to dashboard
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

function DataTable({ columns, rows, empty }: { columns: string[]; rows: React.ReactNode[][]; empty: string }) {
  return (
    <Panel className="overflow-hidden p-0">
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

function number(row: Row | undefined, key: string): number {
  const raw = value(row, key);
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
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
