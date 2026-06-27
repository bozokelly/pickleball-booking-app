import Image from 'next/image';
import Link from 'next/link';
import {
  BarChart3,
  Bell,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Crown,
  MessageCircle,
  Search,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';

const contactEmail = 'bozokelly@gmail.com';
const mailto = (subject: string) => `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}`;

const featureCards = [
  {
    icon: CalendarCheck,
    title: 'Book games fast',
    copy: 'Find open sessions, reserve your spot, and see what is coming up.',
  },
  {
    icon: Zap,
    title: 'Smart waitlists',
    copy: 'Players can join the queue and clubs can keep games full.',
  },
  {
    icon: MessageCircle,
    title: 'Club chat',
    copy: 'Keep members connected around real clubs, sessions, and updates.',
  },
  {
    icon: Bell,
    title: 'Announcements',
    copy: 'Send timely reminders, changes, and club news to the right players.',
  },
  {
    icon: CreditCard,
    title: 'Payments & credits',
    copy: 'Support paid bookings, credits, and cleaner club reconciliation.',
  },
  {
    icon: Trophy,
    title: 'Profiles & results',
    copy: 'Show player profiles, DUPR context, results, and session history.',
  },
];

const playerBenefits = [
  'Discover games and courts near you',
  'Join waitlists and never miss a spot',
  'Chat with your club and fellow players',
  'Track results and climb leaderboards',
  'Secure payments in one tap',
];

const clubBenefits = [
  'Simplify bookings and court management',
  'Automate waitlists and notifications',
  'Engage members with in-app chat',
  'Announce events and updates instantly',
  'Grow your club and delight members',
];

const clubOutcomeCards = [
  {
    icon: CalendarCheck,
    title: 'Fill sessions with less chasing',
    copy: 'Publish games, control capacity, move players through waitlists, and keep everyone pointed at the same source of truth.',
  },
  {
    icon: CreditCard,
    title: 'Make paid sessions cleaner',
    copy: 'Support Stripe-powered bookings, player credits, cash/card status, and cleaner reconciliation for club admins.',
  },
  {
    icon: BarChart3,
    title: 'See what your club should run next',
    copy: 'Use session patterns, fill rates, demand signals, and member activity to make better scheduling calls.',
  },
];

const adminBeforeAfter = [
  ['Manual group chats', 'One booking page per session'],
  ['Screenshots and spreadsheets', 'Live player, waitlist and cancellation lists'],
  ['Guessing what times work', 'Analytics for demand, fill and operations'],
  ['Payment follow-up after the fact', 'Payment status, credits and admin actions in the flow'],
];

const clubToolkit = [
  'Recurring weekly games and special events',
  'Member approvals, roles and contact context',
  'Waitlist promotion and attendance workflows',
  'Club announcements, chat, posts and images',
  'DUPR-aware sessions, results and live scoring',
  'Settings for images, courts, rules and visibility',
];

const showcase = [
  {
    title: 'Find & join games',
    image: '/images/app/home-next-game.png',
    alt: 'Book a Dink home screen showing the next game and pinned clubs',
  },
  {
    title: 'Manage sessions',
    image: '/images/app/manage-club.png',
    alt: 'Club management screen showing games, members, analytics and settings',
  },
  {
    title: 'Track live play',
    image: '/images/app/live-session.png',
    alt: 'Live DUPR King of the Court session screen with courts and score entry',
  },
  {
    title: 'Pay and manage players',
    image: '/images/app/manage-players.png',
    alt: 'Manage players screen showing confirmed, waitlisted and cancelled players',
  },
];

const steps = [
  { icon: Search, title: 'Publish', copy: 'Create sessions, set details, and make games discoverable.' },
  { icon: CalendarCheck, title: 'Fill', copy: 'Let players book instantly or join a managed waitlist.' },
  { icon: MessageCircle, title: 'Run', copy: 'Send updates, manage players, chat, score, and keep the night moving.' },
  { icon: CreditCard, title: 'Reconcile', copy: 'Track payments, credits, attendance, and results after play.' },
];

const pricing = [
  {
    name: 'Free',
    price: '$0',
    tagline: 'A simple way to bring your club online.',
    description: 'For small clubs getting started.',
    limits: ['Up to 3 active sessions', 'Up to 20 club members'],
    tone: 'bg-white',
    points: [
      'Club profile and discovery',
      'Create and manage sessions',
      'Player bookings and waitlists',
      'Automatic waitlist promotion',
      'Member-only and priority booking controls',
      'Session reminders and announcements',
      'Club chat, posts, and reviews',
      'Venue, owner, and admin tools',
      'Manual payments only — no in-app checkout',
    ],
  },
  {
    name: 'Starter',
    price: '$19',
    tagline: 'Start taking payments and reduce manual admin.',
    description: 'For clubs running regular paid sessions.',
    limits: ['Up to 10 active sessions', 'Up to 100 club members'],
    tone: 'bg-[#FFF8EC]',
    points: [
      'Everything in Free',
      'Paid session support',
      'Card and Apple Pay checkout',
      'Club payout onboarding',
      'Payment setup and admin controls',
      'Club credits and cancellation credit workflows',
      'Payment prompts for promoted waitlisted players',
      'Higher session and member capacity',
    ],
  },
  {
    name: 'Pro',
    price: '$49',
    tagline: 'Built for clubs ready to scale with confidence.',
    description: 'For growing clubs that need advanced operations.',
    limits: ['Unlimited active sessions', 'Unlimited club members'],
    tone: 'bg-[#F2FFE1]',
    featured: true,
    points: [
      'Everything in Starter',
      'Analytics and reporting',
      'Recurring sessions',
      'Scheduled game publishing',
      'Unlimited sessions and members',
      'Advanced tools for larger clubs',
    ],
  },
];

export default function MarketingHomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#FBF6EC] text-[#101214]">
      <PublicNav />

      <section className="relative border-b border-[#161616]/10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-10%] top-16 h-72 w-72 rounded-full bg-[#C8FF2E]/30 blur-3xl" />
          <div className="absolute right-[-12%] top-36 h-80 w-80 rounded-full bg-[#FF6A3D]/10 blur-3xl" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-[#101214]/10" />
          <div className="absolute inset-0 opacity-[0.055] [background-image:linear-gradient(90deg,#101214_1px,transparent_1px),linear-gradient(#101214_1px,transparent_1px)] [background-size:64px_64px]" />
        </div>

        <div className="relative mx-auto grid min-h-[calc(100vh-76px)] max-w-7xl gap-10 px-5 pb-12 pt-10 sm:px-8 lg:grid-cols-[0.96fr_1.04fr] lg:items-center lg:pb-16 lg:pt-16">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#101214]/10 bg-white/70 px-3 py-1.5 text-sm font-semibold shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4 text-[#72B600]" />
              The all-in-one pickleball app
            </div>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[0.95] tracking-normal text-[#101214] sm:text-6xl lg:text-7xl">
              Pickleball bookings, waitlists, chat and payments, all in one app.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5D6470] sm:text-xl">
              Book a Dink helps players book games, join waitlists, chat with clubs, pay, track results, and stay updated. Clubs get the tools to run sessions without spreadsheet chaos.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={mailto('Book a Dink iPhone beta access')}
                className="inline-flex h-[52px] items-center justify-center rounded-2xl bg-[#101214] px-6 text-base font-semibold text-white shadow-[0_18px_45px_rgba(16,18,20,0.22)] transition hover:-translate-y-0.5 hover:bg-black"
              >
                Download on iPhone
              </a>
              <a
                href={mailto('Book a Dink Android beta access')}
                className="inline-flex h-[52px] items-center justify-center rounded-2xl border border-[#101214]/12 bg-white px-6 text-base font-semibold text-[#101214] shadow-sm transition hover:-translate-y-0.5 hover:border-[#101214]/30"
              >
                Get it on Android
              </a>
              <a
                href="#clubs"
                className="inline-flex h-[52px] items-center justify-center rounded-2xl px-4 text-base font-semibold text-[#101214] transition hover:bg-white/70"
              >
                For clubs
                <ChevronRight className="ml-1 h-4 w-4" />
              </a>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              {[
                ['Players', 'Book, chat, play'],
                ['Clubs', 'Manage every session'],
                ['Payments', 'Powered by Stripe'],
              ].map(([label, copy]) => (
                <div key={label} className="rounded-2xl border border-[#101214]/10 bg-white/65 p-3 shadow-sm backdrop-blur">
                  <p className="text-sm font-semibold text-[#101214]">{label}</p>
                  <p className="mt-1 text-xs leading-4 text-[#727985]">{copy}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto min-h-[650px] w-full max-w-[620px] sm:min-h-[720px] lg:min-h-[760px]">
            <PhoneMockup
              className="absolute left-[8%] top-8 z-20 w-[58%] max-w-[320px] rotate-[-5deg]"
              image="/images/app/home-next-game.png"
              alt="Book a Dink app home screen"
              priority
            />
            <PhoneMockup
              className="absolute right-[3%] top-24 z-30 w-[54%] max-w-[300px] rotate-[6deg]"
              image="/images/app/booking-confirmed.png"
              alt="Booking confirmation screen"
              priority
            />
            <PhoneMockup
              className="absolute bottom-0 left-[23%] z-10 w-[55%] max-w-[310px] rotate-[2deg]"
              image="/images/app/enter-score.png"
              alt="Enter score screen"
              priority
            />
            <div className="absolute bottom-16 right-0 z-40 hidden rounded-3xl border border-[#101214]/10 bg-white/90 p-4 shadow-[0_20px_60px_rgba(16,18,20,0.18)] backdrop-blur sm:block">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#C8FF2E]">
                  <CheckCircle2 className="h-6 w-6 text-[#101214]" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Bookings confirmed</p>
                  <p className="text-xs text-[#727985]">Waitlists, payments and reminders included</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-18">
        <div className="rounded-[2rem] border border-[#101214]/10 bg-white/80 p-4 shadow-[0_20px_80px_rgba(16,18,20,0.07)] backdrop-blur">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {featureCards.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="rounded-3xl border border-[#101214]/8 bg-[#FBF8F0] p-4">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <Icon className="h-5 w-5 text-[#101214]" />
                  </div>
                  <h2 className="text-base font-semibold">{feature.title}</h2>
                  <p className="mt-2 text-sm leading-5 text-[#66707C]">{feature.copy}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="players" className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-14">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#7A8190]">For every court</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-normal sm:text-5xl">Built for players and clubs</h2>
          <p className="mt-4 text-lg leading-8 text-[#66707C]">
            The player experience and the organiser tools belong in the same place. Book a Dink keeps the whole club loop connected.
          </p>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <AudienceCard
            id="players-card"
            eyebrow="For players"
            title="Everything you need before, during and after the game."
            benefits={playerBenefits}
            tint="bg-[#F2FFE1]"
            icon={<Users className="h-6 w-6" />}
          />
          <AudienceCard
            id="clubs"
            eyebrow="For club owners"
            title="A cleaner way to run weekly sessions and growing communities."
            benefits={clubBenefits}
            tint="bg-[#FFF4E8]"
            icon={<Crown className="h-6 w-6" />}
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
          <div className="rounded-[2rem] border border-[#101214]/10 bg-[#101214] p-6 text-white shadow-[0_28px_100px_rgba(16,18,20,0.18)] sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#C8FF2E]">For club operators</p>
            <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">
              Turn club nights into a system, not a scramble.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/62">
              Book a Dink is built around the recurring work club owners actually do: publish sessions, fill courts, manage payments, communicate changes, and learn what members want next.
            </p>
            <div className="mt-8 grid gap-3">
              {adminBeforeAfter.map(([before, after]) => (
                <div key={before} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                  <p className="text-sm text-white/55">{before}</p>
                  <ChevronRight className="hidden h-4 w-4 text-[#C8FF2E] sm:block" />
                  <p className="text-sm font-semibold text-white">{after}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5">
            <div className="grid gap-4 md:grid-cols-3">
              {clubOutcomeCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.title} className="rounded-[1.5rem] border border-[#101214]/10 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F2FFE1]">
                      <Icon className="h-5 w-5 text-[#101214]" />
                    </div>
                    <h3 className="text-lg font-semibold leading-6">{card.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#66707C]">{card.copy}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-5 md:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[2rem] border border-[#101214]/10 bg-[#FFF8EC] p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <ClipboardList className="h-5 w-5 text-[#101214]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7A8190]">Club toolkit</p>
                    <p className="text-sm text-[#66707C]">The workflows clubs ask for as they grow.</p>
                  </div>
                </div>
                <div className="grid gap-2">
                  {clubToolkit.map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl bg-white/75 px-3 py-2.5">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#3BC86A]" />
                      <p className="text-sm font-medium leading-5 text-[#30353B]">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative min-h-[520px] overflow-hidden rounded-[2rem] border border-[#101214]/10 bg-[#F2FFE1] p-5 shadow-sm">
                <div className="relative z-10 max-w-xs">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#66707C]">Admin view</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-normal">Analytics and operations in the same club flow.</h3>
                </div>
                <PhoneMockup
                  className="absolute -bottom-20 left-6 w-[48%] max-w-[230px] rotate-[-7deg]"
                  image="/images/app/club-analytics.png"
                  alt="Club analytics screen"
                />
                <PhoneMockup
                  className="absolute -bottom-10 right-5 w-[50%] max-w-[240px] rotate-[7deg]"
                  image="/images/app/manage-players-menu.png"
                  alt="Manage players payment action menu"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="showcase" className="bg-[#101214] py-16 text-white sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/45">App preview</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-normal sm:text-5xl">See Book a Dink in action</h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-white/60">
              Real mobile screens from booking, club management, live sessions and player operations.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {showcase.map((item) => (
              <div key={item.title} className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-3 shadow-[0_24px_90px_rgba(0,0,0,0.25)]">
                <div className="overflow-hidden rounded-[1.55rem] bg-white">
                  <Image src={item.image} alt={item.alt} width={1179} height={2556} className="h-auto w-full" sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 90vw" />
                </div>
                <p className="px-2 pb-2 pt-4 text-center text-sm font-semibold text-white">{item.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#7A8190]">How it works</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-normal sm:text-5xl">From discovery to the final score.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="rounded-[1.5rem] border border-[#101214]/10 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C8FF2E]">
                      <Icon className="h-5 w-5 text-[#101214]" />
                    </div>
                    <span className="text-sm font-semibold text-[#A6ADB7]">{String(index + 1).padStart(2, '0')}</span>
                  </div>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#66707C]">{step.copy}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="pricing" className="border-y border-[#101214]/10 bg-white/70 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#7A8190]">Club access</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-normal sm:text-5xl">Plans for clubs as they grow.</h2>
            </div>
            <a
              href={mailto('Book a Dink club access')}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#101214] px-6 text-base font-semibold text-white transition hover:bg-black"
            >
              Contact us about club access
            </a>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`flex h-full flex-col rounded-[1.75rem] border p-6 shadow-sm ${
                  plan.featured
                    ? 'border-[#101214]/18 bg-[#F2FFE1] shadow-[0_24px_80px_rgba(114,182,0,0.16)]'
                    : `border-[#101214]/10 ${plan.tone}`
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7A8190]">{plan.name}</p>
                  {plan.featured && (
                    <span className="rounded-full bg-[#101214] px-3 py-1 text-xs font-semibold text-white">Best for growth</span>
                  )}
                </div>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-5xl font-semibold leading-none tracking-normal">{plan.price}</span>
                  <span className="text-base font-semibold text-[#66707C]">/month</span>
                </div>
                <p className="mt-5 text-xl font-semibold leading-7 text-[#101214]">{plan.tagline}</p>
                <p className="mt-3 text-sm leading-6 text-[#66707C]">{plan.description}</p>
                <div className="mt-8 h-px bg-[#101214]/10" />

                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8A929C]">Limits</p>
                  <ul className="mt-3 space-y-2">
                    {plan.limits.map((limit) => (
                      <li key={limit} className="flex gap-2 text-sm font-semibold leading-5 text-[#30353B]">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#3BC86A]" />
                        <span>{limit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8A929C]">Features</p>
                  <ul className="mt-3 space-y-2">
                    {plan.points.map((point) => (
                      <li key={point} className="flex gap-2 text-sm leading-5 text-[#30353B]">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#3BC86A]" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="overflow-hidden rounded-[2rem] border border-[#101214]/10 bg-[#101214] text-white shadow-[0_28px_100px_rgba(16,18,20,0.22)]">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:p-10">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#C8FF2E]">Club owners</p>
              <h2 className="mt-3 max-w-3xl text-4xl font-semibold tracking-normal sm:text-5xl">Run a club? Let&apos;s grow together.</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/62">
                Book a Dink helps clubs save time, manage bookings, engage members, and grow their community.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <a
                href={mailto('I run a pickleball club')}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#C8FF2E] px-6 text-base font-semibold text-[#101214] transition hover:bg-[#D8FF5D]"
              >
                I run a club
              </a>
              <a
                href={mailto('Book a Dink sales enquiry')}
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/15 px-6 text-base font-semibold text-white transition hover:bg-white/10"
              >
                Contact sales
              </a>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function PublicNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#101214]/10 bg-[#FBF6EC]/86 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label="Book a Dink home" className="flex items-center gap-3">
          <Image src="/images/app/bookadink-app-icon.png" alt="" width={44} height={44} className="rounded-xl shadow-sm" priority />
          <div className="leading-tight">
            <p className="text-base font-semibold">Book a Dink</p>
            <p className="text-xs font-medium text-[#737B86]">Pickleball, organised</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-semibold text-[#58616D] lg:flex" aria-label="Public navigation">
          <a href="#features" className="transition hover:text-[#101214]">Features</a>
          <a href="#players" className="transition hover:text-[#101214]">For Players</a>
          <a href="#clubs" className="transition hover:text-[#101214]">For Clubs</a>
          <a href="#pricing" className="transition hover:text-[#101214]">Pricing</a>
          <a href="#contact" className="transition hover:text-[#101214]">Contact</a>
        </nav>
        <a
          href={mailto('Book a Dink club demo')}
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#101214] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
        >
          Book club demo
        </a>
      </div>
    </header>
  );
}

function PhoneMockup({
  image,
  alt,
  className,
  priority = false,
}: {
  image: string;
  alt: string;
  className: string;
  priority?: boolean;
}) {
  return (
    <div className={className}>
      <div className="rounded-[2.4rem] border-[10px] border-[#101214] bg-[#101214] shadow-[0_30px_90px_rgba(16,18,20,0.28)]">
        <div className="overflow-hidden rounded-[1.75rem] bg-white">
          <Image src={image} alt={alt} width={1179} height={2556} priority={priority} className="h-auto w-full" sizes="(min-width: 1024px) 300px, 55vw" />
        </div>
      </div>
    </div>
  );
}

function AudienceCard({
  id,
  eyebrow,
  title,
  benefits,
  tint,
  icon,
}: {
  id: string;
  eyebrow: string;
  title: string;
  benefits: string[];
  tint: string;
  icon: React.ReactNode;
}) {
  return (
    <article id={id} className={`rounded-[2rem] border border-[#101214]/10 p-6 shadow-sm ${tint}`}>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-white shadow-sm">{icon}</div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#69717B]">{eyebrow}</p>
      </div>
      <h3 className="max-w-xl text-3xl font-semibold tracking-normal">{title}</h3>
      <div className="mt-6 grid gap-3">
        {benefits.map((benefit) => (
          <div key={benefit} className="flex items-center gap-3 rounded-2xl border border-[#101214]/8 bg-white/80 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-[#3BC86A]" />
            <p className="text-sm font-semibold text-[#24282D]">{benefit}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-[#101214]/10 bg-[#FBF6EC]">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1.1fr_0.9fr_0.9fr_0.9fr]">
        <div>
          <Link href="/" aria-label="Book a Dink home" className="flex items-center gap-3">
            <Image src="/images/app/bookadink-app-icon.png" alt="" width={44} height={44} className="rounded-xl" />
            <div>
              <p className="font-semibold">Book a Dink</p>
              <p className="text-sm text-[#66707C]">Pickleball, organised</p>
            </div>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-[#66707C]">
            A mobile-first booking, waitlist, chat, payment and club management app for pickleball players and organisers.
          </p>
        </div>

        <FooterGroup
          title="Product"
          links={[
            ['Features', '#features'],
            ['For Players', '#players'],
            ['For Clubs', '#clubs'],
            ['Pricing', '#pricing'],
          ]}
        />
        <FooterGroup
          title="Company"
          links={[
            ['Contact', '#contact'],
            ['Club enquiries', mailto('Book a Dink club enquiry')],
            [contactEmail, `mailto:${contactEmail}`],
          ]}
        />
        <FooterGroup
          title="Support"
          links={[
            ['Privacy Policy', '/privacy'],
            ['Terms of Service', '/terms'],
            ['Account deletion', '/account-deletion'],
          ]}
        />
      </div>
      <div className="border-t border-[#101214]/10 px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-[#66707C] sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {year} Book a Dink. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="transition hover:text-[#101214]">Privacy</Link>
            <Link href="/terms" className="transition hover:text-[#101214]">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterGroup({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8A929C]">{title}</h2>
      <ul className="mt-4 space-y-3">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="text-sm font-medium text-[#4D5662] transition hover:text-[#101214]">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
