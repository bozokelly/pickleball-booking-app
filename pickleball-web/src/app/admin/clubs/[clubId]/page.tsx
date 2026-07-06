import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  FileText,
  Gauge,
  Lock,
  Receipt,
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
  title: 'Club File - Bookadink Admin',
  description: 'Read-only club operations file for Bookadink internal admin.',
};

type PageProps = { params: Promise<{ clubId: string }> };
type Row = Record<string, unknown>;
type StatusTone = 'dark' | 'neutral' | 'info' | 'good' | 'warn' | 'bad';
type QueryWarning = string | null;

type QueryResult = {
  data: Row[];
  warning: QueryWarning;
  configured: boolean;
  label: string;
  limit: number | null;
};

type SingleResult = {
  data: Row | null;
  warning: QueryWarning;
  configured: boolean;
  label: string;
};

type PostgrestRows = {
  data: unknown[] | null;
  error: { code?: string; message: string } | null;
};

type PostgrestSingle = {
  data: unknown | null;
  error: { code?: string; message: string } | null;
};

type OperationalIssue = {
  label: string;
  detail: string;
  tone: StatusTone;
};

export default async function ClubFilePage({ params }: PageProps) {
  const { clubId } = await params;
  const admin = await requireBusinessAdmin();

  if (!admin.allowed) {
    return <AccessDenied email={admin.email} reason={admin.reason} />;
  }

  const file = await loadClubFile(admin.supabase, clubId);

  if (!file.club && !file.clubWarning) {
    notFound();
  }

  if (!file.club) {
    return (
      <main className="min-h-screen bg-[#F5F5F7] px-4 py-6 text-text-primary">
        <div className="mx-auto max-w-3xl">
          <Link href="/admin?tab=clubs" className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to clubs
          </Link>
          <Panel className="mt-4 border-warning/25 bg-warning/5 p-5">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning" />
              <div>
                <h1 className="text-lg font-semibold text-text-primary">Club file unavailable</h1>
                <p className="mt-1 text-sm leading-5 text-text-secondary">{file.clubWarning || 'This club could not be loaded.'}</p>
              </div>
            </div>
          </Panel>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F5F7] text-text-primary">
      <div className="mx-auto w-full max-w-[1440px] px-3 py-3 sm:px-4 lg:px-6">
        <header className="sticky top-0 z-30 -mx-3 border-b border-border bg-[#F5F5F7]/95 px-3 py-3 backdrop-blur-xl sm:-mx-4 sm:px-4 lg:-mx-6 lg:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <Link href="/admin?tab=clubs" className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary">
                <ArrowLeft className="h-4 w-4" />
                Club operations
              </Link>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <StatusPill label="Club file" tone="dark" />
                <StatusPill label="Read-only" tone="neutral" />
                <StatusPill label={admin.role} tone="info" />
                <StatusPill label={file.stripe.label} tone={file.stripe.tone} />
                <StatusPill label={file.subscription.statusLabel} tone={file.subscription.statusTone} />
              </div>
              <h1 className="truncate text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">{file.name}</h1>
              <p className="mt-1 max-w-3xl text-sm text-text-secondary">{file.location}</p>
            </div>
            <div className="rounded-xl border border-border bg-white px-4 py-3 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Last refreshed</p>
              <p className="mt-1 text-sm font-semibold text-text-primary">{file.generatedAt}</p>
            </div>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Club file sections">
            {[
              ['Overview', '#overview'],
              ['Games', '#games'],
              ['Members', '#members'],
              ['Bookings', '#bookings'],
              ['Payments', '#payments'],
              ['Subscription', '#subscription'],
              ['Notifications', '#notifications'],
              ['Issues', '#issues'],
              ['Logs', '#logs'],
            ].map(([label, href]) => (
              <a key={href} href={href} className="whitespace-nowrap rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-text-secondary hover:border-primary hover:text-primary">
                {label}
              </a>
            ))}
          </nav>
        </header>

        {file.warnings.length > 0 && (
          <Panel className="my-4 border-warning/30 bg-warning/5 p-4">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning" />
              <div>
                <h2 className="text-sm font-semibold text-text-primary">Some club-file data could not be loaded</h2>
                <ul className="mt-2 space-y-1 text-sm text-text-secondary">
                  {file.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Panel>
        )}

        <Section id="overview" title="Overview" icon={<Building2 className="h-5 w-5" />} description="Club identity, operational health, payment readiness, and current activity.">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {file.metrics.map((metric) => (
              <MetricCard key={metric.label} metric={metric} />
            ))}
          </div>
          <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_0.8fr]">
            <Panel className="p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">Club snapshot</h3>
                  <p className="mt-1 text-xs text-text-secondary">A compact readout for owner review before drilling into the sections below.</p>
                </div>
                <Gauge className="h-5 w-5 text-text-tertiary" />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {file.snapshot.map((item) => (
                  <InfoRow key={item.label} label={item.label} value={item.value} tone={item.tone} />
                ))}
              </div>
            </Panel>
            <Panel className="overflow-hidden p-0">
              <div className="border-b border-border px-4 py-3">
                <h3 className="text-sm font-semibold text-text-primary">Action signals</h3>
                <p className="mt-0.5 text-xs text-text-secondary">Read-only issues derived from existing club, game, payment, and notification data.</p>
              </div>
              {file.issues.length === 0 ? (
                <p className="px-4 py-6 text-sm text-text-secondary">No club-specific issues found in the loaded preview.</p>
              ) : (
                <div className="divide-y divide-border">
                  {file.issues.slice(0, 5).map((issue) => (
                    <IssueRow key={issue.label} issue={issue} />
                  ))}
                </div>
              )}
            </Panel>
          </div>
        </Section>

        <Section id="games" title="Games" icon={<CalendarDays className="h-5 w-5" />} description="Upcoming and recent club sessions.">
          <div className="grid gap-3 xl:grid-cols-2">
            <DataTable
              caption="Upcoming games"
              note={`Next ${file.upcomingGames.length} club sessions from the loaded preview.`}
              empty="No upcoming games found for this club."
              columns={['Game', 'Date', 'Venue', 'Players', 'Status', 'Fee']}
              rows={file.upcomingGames.map((game) => [
                text(game, 'title') || 'Untitled game',
                formatDate(text(game, 'date_time')),
                gameVenue(game, file.venues),
                `${file.bookingCountsByGameId.get(text(game, 'id')) || 0}/${formatCount(number(game, 'max_spots'))}`,
                <StatusPill key="status" label={text(game, 'status') || 'unknown'} tone={gameTone(game)} />,
                formatGameFee(game),
              ])}
            />
            <DataTable
              caption="Recent games"
              note="Most recent past or completed sessions for this club."
              empty="No recent games found for this club."
              columns={['Game', 'Date', 'Venue', 'Players', 'Status', 'Fee']}
              rows={file.recentGames.map((game) => [
                text(game, 'title') || 'Untitled game',
                formatDate(text(game, 'date_time')),
                gameVenue(game, file.venues),
                `${file.bookingCountsByGameId.get(text(game, 'id')) || 0}/${formatCount(number(game, 'max_spots'))}`,
                <StatusPill key="status" label={text(game, 'status') || 'unknown'} tone={gameTone(game)} />,
                formatGameFee(game),
              ])}
            />
          </div>
        </Section>

        <Section id="members" title="Members" icon={<Users className="h-5 w-5" />} description="Club members and admins. Member rows are capped previews.">
          <DataTable
            caption="Member preview"
            note={`${formatCount(file.members.length)} loaded member rows. Approved member count is used for public/social proof counts.`}
            empty="No club member rows were found for this club."
            columns={['Member', 'Email', 'DUPR', 'Membership', 'Role', 'Joined']}
            rows={file.members.slice(0, 80).map((member) => {
              const profile = file.profileById.get(text(member, 'user_id'));
              return [
                text(profile, 'full_name') || text(profile, 'email') || text(member, 'user_id') || 'Unknown member',
                text(profile, 'email') || '-',
                text(profile, 'dupr_rating') || '-',
                <StatusPill key="status" label={text(member, 'status') || 'unknown'} tone={memberTone(member)} />,
                text(member, 'role') || text(member, 'member_role') || 'member',
                formatDate(text(member, 'created_at') || text(member, 'joined_at')),
              ];
            })}
          />
        </Section>

        <Section id="bookings" title="Bookings" icon={<Ticket className="h-5 w-5" />} description="Club-scoped booking state across the loaded game preview.">
          <DataTable
            caption="Recent bookings"
            note={`${formatCount(file.bookings.length)} loaded booking rows across this club's loaded games.`}
            empty="No bookings were found for the loaded club games."
            columns={['Created', 'Player', 'Game', 'Booking', 'Payment', 'Fee', 'Waitlist']}
            rows={file.bookings.slice(0, 120).map((booking) => {
              const profile = file.profileById.get(text(booking, 'user_id'));
              const game = file.gameById.get(text(booking, 'game_id'));
              const payment = bookingPaymentStatus(booking);
              return [
                formatDate(text(booking, 'created_at')),
                text(profile, 'full_name') || text(profile, 'email') || text(booking, 'user_id') || 'Unknown player',
                text(game, 'title') || 'Unknown game',
                <StatusPill key="booking" label={text(booking, 'status') || 'unknown'} tone={bookingTone(booking)} />,
                <StatusPill key="payment" label={payment.label} tone={payment.tone} />,
                formatBookingFee(booking, game),
                text(booking, 'waitlist_position') || '-',
              ];
            })}
          />
        </Section>

        <Section id="payments" title="Payments" icon={<CreditCard className="h-5 w-5" />} description="Read-only club payment and refund visibility. No payment actions are wired here.">
          <div className="mb-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {file.paymentMetrics.map((metric) => (
              <MetricCard key={metric.label} metric={metric} />
            ))}
          </div>
          <DataTable
            caption="Paid or Stripe-linked bookings"
            note="Payment records are inferred from existing booking fields and Stripe metadata already stored in the database."
            empty="No paid or Stripe-linked bookings were found for this club preview."
            columns={['Created', 'Player', 'Game', 'Amount', 'Payment', 'Refund', 'Intent']}
            rows={file.paymentRows.map((booking) => {
              const profile = file.profileById.get(text(booking, 'user_id'));
              const game = file.gameById.get(text(booking, 'game_id'));
              const payment = bookingPaymentStatus(booking);
              const refund = refundStatus(booking);
              return [
                formatDate(text(booking, 'created_at')),
                text(profile, 'full_name') || text(profile, 'email') || 'Unknown player',
                text(game, 'title') || 'Unknown game',
                formatBookingFee(booking, game),
                <StatusPill key="payment" label={payment.label} tone={payment.tone} />,
                <StatusPill key="refund" label={refund.label} tone={refund.tone} />,
                <Mono key="intent" value={text(booking, 'stripe_payment_intent_id') || '-'} />,
              ];
            })}
          />
        </Section>

        <Section id="subscription" title="Subscription" icon={<Receipt className="h-5 w-5" />} description="Club access plan, subscription state, and Stripe Connect readiness.">
          <div className="grid gap-3 lg:grid-cols-3">
            <InfoPanel title="Club plan" rows={file.subscription.rows} />
            <InfoPanel title="Stripe Connect" rows={file.stripe.rows} />
            <InfoPanel title="Venue/location" rows={file.locationRows} />
          </div>
        </Section>

        <Section id="notifications" title="Notifications" icon={<Bell className="h-5 w-5" />} description="Club-related notifications when a direct reference is available.">
          <DataTable
            caption="Notification preview"
            note={file.notificationsConfigured ? 'Loaded by club/game reference id where notification rows expose reference_id.' : 'Notification rows are not available for this club file.'}
            empty={file.notificationsConfigured ? 'No club-referenced notifications were found.' : 'Notification access is not configured or this schema does not expose a club-scoped reference.'}
            columns={['Created', 'Recipient', 'Type', 'Title', 'Read', 'Delivery']}
            rows={file.notifications.map((notification) => {
              const profile = file.profileById.get(text(notification, 'user_id'));
              const delivery = notificationDelivery(notification);
              return [
                formatDate(text(notification, 'created_at')),
                text(profile, 'full_name') || text(profile, 'email') || text(notification, 'user_id') || '-',
                text(notification, 'type') || '-',
                text(notification, 'title') || '-',
                <StatusPill key="read" label={bool(notification, 'read') ? 'read' : 'unread'} tone={bool(notification, 'read') ? 'neutral' : 'warn'} />,
                <StatusPill key="delivery" label={delivery.label} tone={delivery.tone} />,
              ];
            })}
          />
        </Section>

        <Section id="issues" title="Issues" icon={<AlertTriangle className="h-5 w-5" />} description="Derived warning flags only. No mutation actions are exposed.">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {file.issues.length === 0 ? (
              <Panel className="p-4">
                <CheckCircle2 className="mb-3 h-5 w-5 text-success" />
                <h3 className="text-sm font-semibold text-text-primary">No club issues found</h3>
                <p className="mt-1 text-sm leading-5 text-text-secondary">The loaded club preview has no obvious payment setup, capacity, location, or notification warnings.</p>
              </Panel>
            ) : (
              file.issues.map((issue) => <IssueCard key={issue.label} issue={issue} />)
            )}
          </div>
        </Section>

        <Section id="logs" title="Logs" icon={<FileText className="h-5 w-5" />} description="Operational logs are informational until an audit-log table is wired.">
          <Panel className="p-4">
            <div className="flex gap-3">
              <Server className="mt-0.5 h-5 w-5 flex-shrink-0 text-text-tertiary" />
              <div>
                <h3 className="text-sm font-semibold text-text-primary">No club operational log table is wired yet</h3>
                <p className="mt-1 text-sm leading-5 text-text-secondary">
                  This Club File intentionally avoids inventing log data. A future admin_audit_logs or support_feedback table can populate this section once it exists.
                </p>
              </div>
            </div>
          </Panel>
        </Section>
      </div>
    </main>
  );
}

async function loadClubFile(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabaseServer').createSupabaseServerClient>>,
  clubId: string,
) {
  const now = new Date();
  const warnings: string[] = [];
  const supabaseAdmin = createSupabaseAdminClient();
  const reader = supabaseAdmin || supabase;

  if (!supabaseAdmin) {
    warnings.push('SUPABASE_SERVICE_ROLE_KEY is not configured; Club File reads may be incomplete after RLS hardening.');
  }

  const clubResult = await safeSingle('club', () => reader.from('clubs').select('*').eq('id', clubId).maybeSingle());
  if (clubResult.warning) warnings.push(clubResult.warning);
  if (!clubResult.data) {
    return {
      club: null,
      clubWarning: clubResult.warning,
      warnings,
    };
  }

  const [membersResult, adminsResult, gamesResult, stripeResult, subscriptionResult, venuesResult] = await Promise.all([
    safeRows('club_members', () => reader.from('club_members').select('*').eq('club_id', clubId).limit(500), true, 500),
    safeRows('club_admins', () => reader.from('club_admins').select('*').eq('club_id', clubId).limit(100), true, 100),
    safeRows('games', () => reader.from('games').select('*').eq('club_id', clubId).order('date_time', { ascending: false }).limit(240), false, 240),
    safeRows('club_stripe_accounts', () => reader.from('club_stripe_accounts').select('*').eq('club_id', clubId).limit(1), true, 1),
    safeRows('club_subscriptions', () => reader.from('club_subscriptions').select('*').eq('club_id', clubId).limit(1), true, 1),
    safeRows('club_venues', () => reader.from('club_venues').select('*').eq('club_id', clubId).limit(50), true, 50),
  ]);

  [membersResult, adminsResult, gamesResult, stripeResult, subscriptionResult, venuesResult].forEach((result) => {
    if (result.warning) warnings.push(result.warning);
  });

  const games = gamesResult.data;
  const gameIds = games.map((game) => text(game, 'id')).filter(Boolean);
  const bookingsResult =
    gameIds.length > 0
      ? await safeRows('bookings', () => reader.from('bookings').select('*').in('game_id', gameIds).order('created_at', { ascending: false }).limit(500), true, 500)
      : emptyRows('bookings', true, 500);
  if (bookingsResult.warning) warnings.push(bookingsResult.warning);

  const referenceIds = [clubId, ...gameIds].slice(0, 200);
  const notificationsResult =
    referenceIds.length > 0
      ? await safeRows('notifications', () => reader.from('notifications').select('*').in('reference_id', referenceIds).order('created_at', { ascending: false }).limit(120), true, 120)
      : emptyRows('notifications', true, 120);
  if (notificationsResult.warning) warnings.push(notificationsResult.warning);

  const userIds = unique([
    ...membersResult.data.map((row) => text(row, 'user_id')),
    ...adminsResult.data.map((row) => text(row, 'user_id')),
    ...bookingsResult.data.map((row) => text(row, 'user_id')),
    ...notificationsResult.data.map((row) => text(row, 'user_id')),
  ]);
  const profilesResult =
    userIds.length > 0
      ? await safeRows('profiles', () => reader.from('profiles').select('id,email,full_name,dupr_rating,created_at,updated_at').in('id', userIds).limit(600), true, 600)
      : emptyRows('profiles', true, 600);
  if (profilesResult.warning) warnings.push(profilesResult.warning);

  const club = clubResult.data;
  const members = membersResult.data;
  const admins = adminsResult.data;
  const bookings = bookingsResult.data;
  const notifications = notificationsResult.data;
  const profiles = profilesResult.data;
  const venues = venuesResult.data;
  const stripe = stripeResult.data[0];
  const subscription = subscriptionResult.data[0];
  const profileById = mapByKey(profiles, 'id');
  const gameById = mapByKey(games, 'id');
  const bookingCountsByGameId = countBy(bookings.filter((booking) => text(booking, 'status') !== 'cancelled'), 'game_id');
  const upcomingGames = games
    .filter((game) => isUpcomingGame(game, now))
    .sort((a, b) => new Date(text(a, 'date_time')).getTime() - new Date(text(b, 'date_time')).getTime())
    .slice(0, 8);
  const recentGames = games
    .filter((game) => !isUpcomingGame(game, now))
    .sort((a, b) => new Date(text(b, 'date_time')).getTime() - new Date(text(a, 'date_time')).getTime())
    .slice(0, 8);
  const approvedMembers = members.filter((row) => text(row, 'status') === 'approved');
  const pendingMembers = members.filter((row) => text(row, 'status') === 'pending' || text(row, 'status') === 'requested');
  const confirmedBookings = bookings.filter((booking) => text(booking, 'status') === 'confirmed');
  const pendingPayments = bookings.filter((booking) => text(booking, 'stripe_payment_intent_id') && !bool(booking, 'fee_paid') && text(booking, 'status') !== 'cancelled');
  const paymentRows = bookings.filter((booking) => text(booking, 'stripe_payment_intent_id') || bool(booking, 'fee_paid') || text(booking, 'payment_method') === 'stripe').slice(0, 80);
  const failedPayments = bookings.filter((booking) => {
    const status = text(booking, 'payment_status');
    return status === 'failed' || status === 'requires_payment_method' || status === 'payment_failed';
  });
  const failedRefunds = bookings.filter((booking) => text(booking, 'refund_status') === 'failed');
  const failedNotifications = notifications.filter((notification) => {
    const status = text(notification, 'delivery_status') || text(notification, 'send_status');
    return status === 'failed' || status === 'error';
  });
  const paidBookings = bookings.filter((booking) => isPaidBooking(booking));
  const grossCents = paidBookings.reduce((sum, booking) => sum + bookingGrossCents(booking, gameById.get(text(booking, 'game_id'))), 0);
  const platformFeeCents = paidBookings.reduce((sum, booking) => sum + number(booking, 'platform_fee_cents'), 0);
  const clubPayoutCents = paidBookings.reduce((sum, booking) => sum + number(booking, 'club_payout_cents'), 0);
  const feeChargingGames = games.filter((game) => number(game, 'fee_amount') > 0);
  const hasStripeAccount = Boolean(stripe && text(stripe, 'stripe_account_id'));
  const payoutsReady = Boolean(stripe && bool(stripe, 'payouts_enabled'));
  const location = clubLocation(club, venues);
  const subscriptionPlan = text(club, 'subscription_tier') || text(subscription, 'plan_type') || text(subscription, 'tier') || text(subscription, 'plan') || 'not tracked';
  const subscriptionStatus = text(subscription, 'status') || (subscription ? 'unknown' : 'none');
  const issues: OperationalIssue[] = [
    ...(location === 'Missing location'
      ? [{ label: 'Missing location', detail: 'Club has no structured venue, suburb, address, or location fallback in the loaded data.', tone: 'warn' as StatusTone }]
      : []),
    ...(feeChargingGames.length > 0 && !hasStripeAccount
      ? [{ label: 'Payment setup gap', detail: `${formatCount(feeChargingGames.length)} fee-charging game${feeChargingGames.length === 1 ? '' : 's'} exist, but no Stripe Connect account is recorded.`, tone: 'bad' as StatusTone }]
      : []),
    ...(hasStripeAccount && !payoutsReady
      ? [{ label: 'Stripe onboarding incomplete', detail: 'A Stripe account is recorded, but payouts are not enabled yet.', tone: 'warn' as StatusTone }]
      : []),
    ...(pendingPayments.length > 0
      ? [{ label: 'Pending payments', detail: `${formatCount(pendingPayments.length)} booking${pendingPayments.length === 1 ? '' : 's'} have a Stripe intent but are not marked paid.`, tone: 'warn' as StatusTone }]
      : []),
    ...(failedPayments.length > 0
      ? [{ label: 'Failed payments', detail: `${formatCount(failedPayments.length)} booking${failedPayments.length === 1 ? '' : 's'} have failed payment-style statuses.`, tone: 'bad' as StatusTone }]
      : []),
    ...(failedRefunds.length > 0
      ? [{ label: 'Failed refunds', detail: `${formatCount(failedRefunds.length)} refund record${failedRefunds.length === 1 ? '' : 's'} need manual review.`, tone: 'bad' as StatusTone }]
      : []),
    ...(failedNotifications.length > 0
      ? [{ label: 'Failed notifications', detail: `${formatCount(failedNotifications.length)} club-related notification${failedNotifications.length === 1 ? '' : 's'} show delivery failure.`, tone: 'warn' as StatusTone }]
      : []),
    ...(upcomingGames.length === 0
      ? [{ label: 'No upcoming games', detail: 'The club has no upcoming sessions in the loaded games preview.', tone: 'neutral' as StatusTone }]
      : []),
  ];

  return {
    club,
    clubWarning: null,
    warnings,
    name: text(club, 'name') || 'Untitled club',
    location,
    generatedAt: format(now, 'd MMM yyyy, h:mm a'),
    venues,
    members,
    bookings,
    notifications,
    notificationsConfigured: notificationsResult.configured,
    profileById,
    gameById,
    bookingCountsByGameId,
    upcomingGames,
    recentGames,
    issues,
    paymentRows,
    stripe: {
      label: stripeStatus(stripe),
      tone: stripeTone(stripe),
      rows: [
        ['Status', stripeStatus(stripe), hasStripeAccount ? 'Stripe Connect account is recorded.' : 'No Stripe Connect account is recorded.'],
        ['Payouts', payoutsReady ? 'enabled' : 'not enabled', payoutsReady ? 'Club can receive payouts.' : 'Review before paid sessions are scaled.'],
        ['Account', text(stripe, 'stripe_account_id') || '-', 'Stored Connect account reference if available.'],
        ['Onboarding', bool(stripe, 'onboarding_complete') ? 'complete' : 'not complete', 'Read-only status from club_stripe_accounts.'],
      ],
    },
    subscription: {
      statusLabel: subscriptionStatus,
      statusTone: subscriptionStatusTone(subscriptionStatus),
      rows: [
        ['Plan', subscriptionPlan, 'Plan label from club/subscription records.'],
        ['Status', subscriptionStatus, subscription ? 'Status from club_subscriptions.' : 'No subscription row was found for this club.'],
        ['Source', text(subscription, 'subscription_source') || '-', 'Billing source if tracked.'],
        ['Current period end', formatDate(text(subscription, 'current_period_end')), 'Only shown when the subscription row stores it.'],
      ],
    },
    locationRows: [
      ['Location', location, 'Club location fallback used by admin.'],
      ['Venues', formatCount(venues.length), 'Loaded club_venues rows.'],
      ['Primary venue', venues.length > 0 ? text(venues[0], 'name') || text(venues[0], 'address') || '-' : '-', 'First loaded venue row.'],
      ['Club created', formatDate(text(club, 'created_at')), 'Club record timestamp.'],
    ],
    metrics: [
      { label: 'Approved members', value: formatCount(approvedMembers.length), hint: 'Approved club_members rows', tone: approvedMembers.length > 0 ? 'good' : 'warn' },
      { label: 'Club admins', value: formatCount(admins.length), hint: 'club_admins rows', tone: admins.length > 0 ? 'good' : 'warn' },
      { label: 'Upcoming games', value: formatCount(upcomingGames.length), hint: 'Future non-cancelled sessions', tone: upcomingGames.length > 0 ? 'good' : 'warn' },
      { label: 'Confirmed bookings', value: formatCount(confirmedBookings.length), hint: 'Confirmed bookings in loaded preview', tone: confirmedBookings.length > 0 ? 'good' : 'neutral' },
      { label: 'Pending requests', value: formatCount(pendingMembers.length), hint: 'Pending/requested memberships', tone: pendingMembers.length > 0 ? 'warn' : 'good' },
      { label: 'Issues', value: formatCount(issues.length), hint: 'Derived read-only action flags', tone: issues.some((issue) => issue.tone === 'bad') ? 'bad' : issues.length > 0 ? 'warn' : 'good' },
    ] satisfies { label: string; value: string; hint: string; tone?: StatusTone }[],
    snapshot: [
      { label: 'Plan', value: subscriptionPlan, tone: 'neutral' as StatusTone },
      { label: 'Subscription', value: subscriptionStatus, tone: subscriptionStatusTone(subscriptionStatus) },
      { label: 'Stripe', value: stripeStatus(stripe), tone: stripeTone(stripe) },
      { label: 'Payment mode', value: feeChargingGames.length > 0 ? 'paid games present' : 'manual/free only', tone: feeChargingGames.length > 0 ? 'info' as StatusTone : 'neutral' as StatusTone },
      { label: 'Loaded games', value: formatCount(games.length), tone: gamesResult.data.length >= (gamesResult.limit || Infinity) ? 'warn' as StatusTone : 'neutral' as StatusTone },
      { label: 'Loaded bookings', value: formatCount(bookings.length), tone: bookingsResult.data.length >= (bookingsResult.limit || Infinity) ? 'warn' as StatusTone : 'neutral' as StatusTone },
    ],
    paymentMetrics: [
      { label: 'Gross paid bookings', value: formatCents(grossCents), hint: 'Paid booking value in loaded preview', tone: grossCents > 0 ? 'good' : 'neutral' },
      { label: 'Platform fees', value: formatCents(platformFeeCents), hint: 'platform_fee_cents in loaded preview', tone: platformFeeCents > 0 ? 'good' : 'warn' },
      { label: 'Club payouts', value: formatCents(clubPayoutCents), hint: 'club_payout_cents in loaded preview', tone: clubPayoutCents > 0 ? 'neutral' : 'warn' },
      { label: 'Pending payments', value: formatCount(pendingPayments.length), hint: 'Stripe intent exists, not paid', tone: pendingPayments.length > 0 ? 'warn' : 'good' },
    ] satisfies { label: string; value: string; hint: string; tone?: StatusTone }[],
  };
}

async function safeRows(label: string, run: () => PromiseLike<PostgrestRows>, optional = false, limit: number | null = null): Promise<QueryResult> {
  const result = await run();
  if (result.error) {
    const unavailable = optional && isUnavailableError(result.error);
    return {
      data: [],
      configured: !unavailable,
      warning: unavailable ? null : `${label}: ${result.error.message}`,
      label,
      limit,
    };
  }

  return {
    data: Array.isArray(result.data) ? result.data.map((row) => toRow(row)) : [],
    configured: true,
    warning: null,
    label,
    limit,
  };
}

async function safeSingle(label: string, run: () => PromiseLike<PostgrestSingle>): Promise<SingleResult> {
  const result = await run();
  if (result.error) {
    return {
      data: null,
      configured: !isUnavailableError(result.error),
      warning: `${label}: ${result.error.message}`,
      label,
    };
  }

  return {
    data: result.data ? toRow(result.data) : null,
    configured: true,
    warning: null,
    label,
  };
}

function emptyRows(label: string, configured: boolean, limit: number | null): QueryResult {
  return { data: [], warning: null, configured, label, limit };
}

function isUnavailableError(error: { code?: string; message: string }) {
  const message = error.message.toLowerCase();
  return (
    error.code === '42P01' ||
    error.code === '42703' ||
    error.code === 'PGRST205' ||
    message.includes('does not exist') ||
    message.includes('schema cache') ||
    message.includes('could not find table') ||
    message.includes('could not find the table') ||
    message.includes('could not find the') ||
    message.includes('column')
  );
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
        <Link href="/admin" className="mt-6 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">
          Return to admin
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
    <section id={id} className="scroll-mt-32 pb-5">
      <div className="mb-3 flex flex-col gap-1 border-t border-border pt-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-2 text-text-primary">
          <span className="text-text-secondary">{icon}</span>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        </div>
        {description && <p className="max-w-2xl text-xs text-text-secondary">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-border bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${className}`}>{children}</div>;
}

function MetricCard({ metric }: { metric: { label: string; value: string; hint: string; tone?: StatusTone } }) {
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

function InfoRow({ label, value, tone }: { label: string; value: string; tone: StatusTone }) {
  return (
    <div className="rounded-lg border border-border bg-surface-tint px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-sm font-semibold text-text-primary">{label}</p>
        <StatusPill label={value} tone={tone} />
      </div>
    </div>
  );
}

function InfoPanel({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <Panel className="p-4">
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      <div className="mt-3 space-y-2">
        {rows.map((row) => (
          <div key={`${row[0]}-${row[1]}`} className="rounded-lg border border-border bg-surface-tint px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm font-semibold text-text-primary">{row[0]}</p>
              <p className="truncate text-xs font-semibold text-text-secondary">{row[1]}</p>
            </div>
            <p className="mt-1 text-xs leading-4 text-text-tertiary">{row[2]}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function IssueRow({ issue }: { issue: OperationalIssue }) {
  return (
    <div className="grid gap-2 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-text-primary">{issue.label}</p>
        <p className="mt-1 text-xs leading-4 text-text-secondary">{issue.detail}</p>
      </div>
      <StatusPill label={issue.tone === 'bad' ? 'review' : issue.tone === 'warn' ? 'watch' : 'info'} tone={issue.tone} />
    </div>
  );
}

function IssueCard({ issue }: { issue: OperationalIssue }) {
  const Icon = issue.tone === 'bad' || issue.tone === 'warn' ? AlertTriangle : CheckCircle2;
  const iconClass = issue.tone === 'bad' ? 'text-error' : issue.tone === 'warn' ? 'text-warning' : 'text-text-tertiary';
  return (
    <Panel className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold leading-5 text-text-primary">{issue.label}</p>
          <p className="mt-1 text-xs leading-4 text-text-secondary">{issue.detail}</p>
        </div>
        <Icon className={`h-5 w-5 flex-shrink-0 ${iconClass}`} />
      </div>
    </Panel>
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
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-separate border-spacing-0 text-[13px]">
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
                    <td key={cellIndex} className="max-w-[260px] border-b border-border/80 px-3 py-2.5 text-text-secondary first:pl-4 last:pr-4">
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
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function bool(row: Row | undefined, key: string): boolean {
  return value(row, key) === true;
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function mapByKey(rows: Row[], key: string) {
  const map = new Map<string, Row>();
  rows.forEach((row) => {
    const rowKey = text(row, key);
    if (rowKey) map.set(rowKey, row);
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

function isUpcomingGame(game: Row | undefined, now: Date) {
  const dateTime = text(game, 'date_time');
  if (!dateTime) return false;
  const status = text(game, 'status');
  return status !== 'cancelled' && status !== 'completed' && new Date(dateTime).getTime() >= now.getTime();
}

function clubLocation(club: Row, venues: Row[]) {
  const parts = [text(club, 'venue_name'), text(club, 'suburb'), text(club, 'state'), text(club, 'postcode')].filter(Boolean);
  if (parts.length > 0) return parts.join(', ');
  const venue = venues[0];
  const venueParts = [text(venue, 'name'), text(venue, 'suburb'), text(venue, 'address')].filter(Boolean);
  return venueParts.join(', ') || text(club, 'location') || 'Missing location';
}

function gameVenue(game: Row, venues: Row[]) {
  const parts = [text(game, 'venue_name'), text(game, 'venue'), text(game, 'suburb')].filter(Boolean);
  if (parts.length > 0) return parts.join(', ');
  return clubLocation({}, venues);
}

function stripeStatus(row: Row | undefined) {
  if (!row) return 'not connected';
  if (bool(row, 'payouts_enabled')) return 'payouts enabled';
  if (bool(row, 'onboarding_complete')) return 'onboarded';
  if (text(row, 'stripe_account_id')) return 'onboarding';
  return 'not connected';
}

function stripeTone(row: Row | undefined): StatusTone {
  if (!row) return 'neutral';
  if (bool(row, 'payouts_enabled')) return 'good';
  return 'warn';
}

function bookingPaymentStatus(booking: Row) {
  const explicit = text(booking, 'payment_status');
  if (explicit) {
    return {
      label: explicit,
      tone: explicit === 'paid' || explicit === 'succeeded' ? 'good' : explicit.includes('pending') ? 'warn' : explicit.includes('failed') ? 'bad' : 'neutral',
    } as const;
  }
  if (bool(booking, 'fee_paid')) return { label: 'paid', tone: 'good' } as const;
  if (text(booking, 'stripe_payment_intent_id')) return { label: 'pending_payment', tone: 'warn' } as const;
  return { label: 'not paid', tone: 'neutral' } as const;
}

function bookingTone(booking: Row): StatusTone {
  const status = text(booking, 'status');
  if (status === 'confirmed') return 'good';
  if (status === 'waitlisted' || status === 'pending') return 'warn';
  if (status === 'cancelled') return 'bad';
  return 'neutral';
}

function memberTone(member: Row): StatusTone {
  const status = text(member, 'status');
  if (status === 'approved') return 'good';
  if (status === 'pending' || status === 'requested') return 'warn';
  if (status === 'rejected' || status === 'removed') return 'bad';
  return 'neutral';
}

function gameTone(game: Row): StatusTone {
  const status = text(game, 'status');
  if (status === 'upcoming' || status === 'active' || status === 'published') return 'good';
  if (status === 'draft' || status === 'pending') return 'warn';
  if (status === 'cancelled') return 'bad';
  return 'neutral';
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

function notificationDelivery(notification: Row) {
  const status = text(notification, 'delivery_status') || text(notification, 'send_status');
  if (!status) return { label: 'not tracked', tone: 'neutral' } as const;
  if (status === 'sent' || status === 'delivered' || status === 'success') return { label: status, tone: 'good' } as const;
  if (status === 'failed' || status === 'error') return { label: status, tone: 'bad' } as const;
  return { label: status, tone: 'warn' } as const;
}

function subscriptionStatusTone(status: string): StatusTone {
  if (status === 'active' || status === 'trialing') return 'good';
  if (status === 'canceling' || status === 'cancelling' || status === 'cancel_at_period_end') return 'warn';
  if (status === 'past_due' || status === 'unpaid' || status === 'incomplete') return 'bad';
  return 'neutral';
}

function formatGameFee(game: Row) {
  const fee = number(game, 'fee_amount');
  return fee > 0 ? formatDollars(fee) : '$0.00';
}

function formatBookingFee(booking: Row, game: Row | undefined) {
  const cents = number(booking, 'amount_cents') || number(booking, 'platform_fee_cents') + number(booking, 'club_payout_cents');
  if (cents > 0) return formatCents(cents);
  const gameFee = number(game, 'fee_amount');
  return gameFee > 0 ? formatDollars(gameFee) : '$0.00';
}

function formatDollars(valueToFormat: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(valueToFormat);
}

function formatCents(cents: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(cents / 100);
}

function formatCount(count: number | null) {
  return count === null ? '-' : new Intl.NumberFormat('en-AU').format(count);
}

function formatDate(raw: string) {
  if (!raw) return '-';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '-';
  return format(date, 'd MMM yyyy, h:mm a');
}
