import Image from 'next/image';
import Link from 'next/link';
import {
  Bell,
  Building2,
  CalendarCheck,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Smartphone,
  Sparkles,
  Users,
} from 'lucide-react';

const playerFeatures = [
  {
    icon: MapPin,
    title: 'Find games nearby',
    description: 'Discover club sessions, social hits, and competitive games without chasing group chats.',
  },
  {
    icon: CalendarCheck,
    title: 'Book in seconds',
    description: 'Reserve your spot, join waitlists, and keep your pickleball week organised from your phone.',
  },
  {
    icon: Bell,
    title: 'Never miss the update',
    description: 'Get booking changes, waitlist movement, reminders, and club notices where you already are.',
  },
];

const clubFeatures = [
  'Create sessions and control capacity',
  'Manage members, waitlists, credits, and cancellations',
  'Take paid bookings through Stripe without handling card details',
  'Keep players updated with club posts, chat, and notifications',
];

const launchSignals = [
  { value: 'iOS + Android', label: 'Mobile-first player app' },
  { value: 'Stripe', label: 'Payments for paid bookings' },
  { value: 'Clubs', label: 'Built around real venues and organisers' },
  { value: 'Australia', label: 'Designed for local pickleball communities' },
];

export default function MarketingHomePage() {
  return (
    <main className="min-h-screen bg-[#F5F5F7] text-text-primary">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="Bookadink home" className="flex items-center gap-3">
            <Image src="/images/logo.png" alt="Bookadink" width={42} height={42} className="object-contain" priority />
            <div>
              <p className="text-sm font-semibold leading-tight text-text-primary">Bookadink</p>
              <p className="text-xs text-text-tertiary">Pickleball, organised</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-text-secondary sm:flex">
            <a href="#players" className="transition hover:text-text-primary">Players</a>
            <a href="#clubs" className="transition hover:text-text-primary">Clubs</a>
            <a href="#launch" className="transition hover:text-text-primary">Launch</a>
          </nav>
          <a
            href="mailto:support@bookadink.com?subject=Bookadink%20beta%20interest"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
          >
            Join beta
          </a>
        </div>
      </header>

      <section className="relative overflow-hidden bg-white">
        <Image
          src="/images/pickleball-hero.jpg"
          alt="Pickleball court"
          fill
          priority
          className="object-cover opacity-[0.18]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/88 to-white" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-white/80 px-3 py-1.5 text-xs font-semibold text-text-secondary shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-success" />
              Mobile beta preparing for launch
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
              Pickleball bookings without the admin headache.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-text-secondary">
              Bookadink helps players find games and helps clubs run sessions, waitlists, payments, memberships, chat, and reminders from one clean mobile app.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="mailto:support@bookadink.com?subject=Bookadink%20beta%20access"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-base font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,0.16)] transition hover:bg-black"
              >
                Request beta access
              </a>
              <a
                href="#clubs"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-white px-6 text-base font-semibold text-text-primary shadow-sm transition hover:border-separator"
              >
                For clubs
              </a>
            </div>
          </div>

          <div className="mx-auto w-full max-w-sm lg:max-w-md">
            <div className="rounded-[2.25rem] border border-black/10 bg-[#111113] p-3 shadow-[0_30px_100px_rgba(0,0,0,0.28)]">
              <div className="overflow-hidden rounded-[1.75rem] bg-[#F5F5F7]">
                <div className="flex items-center justify-between bg-white px-5 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">Nearby today</p>
                    <p className="text-lg font-semibold">Perth Pickleball</p>
                  </div>
                  <Smartphone className="h-5 w-5 text-text-tertiary" />
                </div>
                <div className="space-y-3 p-4">
                  {[
                    ['Social doubles', '6:30 PM', '4 spots left'],
                    ['Sunday DUPR', '8:30 AM', 'Waitlist open'],
                    ['Beginner hit', '10:00 AM', '2 spots left'],
                  ].map(([title, time, status]) => (
                    <div key={title} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{title}</p>
                          <p className="mt-1 text-sm text-text-secondary">{time} · Club session</p>
                        </div>
                        <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">{status}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border bg-white px-5 py-4">
                  <p className="text-sm font-semibold">Booked players</p>
                  <div className="mt-3 flex -space-x-2">
                    {['BK', 'RW', 'SM', 'JL'].map((initials) => (
                      <span key={initials} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-primary text-xs font-semibold text-white">
                        {initials}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="launch" className="border-y border-border bg-primary py-8">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 text-center sm:px-6 lg:grid-cols-4">
          {launchSignals.map((item) => (
            <div key={item.label}>
              <p className="text-xl font-semibold text-white">{item.value}</p>
              <p className="mt-1 text-sm text-white/65">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="players" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-text-tertiary">For players</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Find the right game, then just show up.</h2>
          <p className="mt-4 text-base leading-7 text-text-secondary">
            No spreadsheet links, no message-thread chaos, no wondering if your spot is confirmed.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {playerFeatures.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-background">
                <feature.icon className="h-5 w-5 text-text-primary" />
              </div>
              <h3 className="text-base font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-text-secondary">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="clubs" className="border-y border-border bg-white py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-text-tertiary">For clubs</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Run sessions like a proper operation.</h2>
            <p className="mt-4 text-base leading-7 text-text-secondary">
              Bookadink gives organisers the controls clubs naturally need as they grow: capacity, waitlists, paid bookings, memberships, credits, and player communication.
            </p>
            <a
              href="mailto:support@bookadink.com?subject=Bookadink%20club%20demo"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white transition hover:bg-black"
            >
              Ask about club setup
            </a>
          </div>
          <div className="rounded-2xl border border-border bg-[#F9F9F9] p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm">
                <Building2 className="h-5 w-5 text-text-primary" />
              </div>
              <div>
                <p className="font-semibold">Club tools</p>
                <p className="text-sm text-text-secondary">Built for repeated weekly operations</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {clubFeatures.map((feature) => (
                <div key={feature} className="flex gap-3 rounded-xl border border-border bg-white p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                  <p className="text-sm leading-5 text-text-secondary">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <Users className="mb-4 h-6 w-6 text-text-secondary" />
            <h3 className="font-semibold">Membership-aware</h3>
            <p className="mt-2 text-sm leading-6 text-text-secondary">Clubs can manage who joins, who books, and how member activity appears.</p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <MessageCircle className="mb-4 h-6 w-6 text-text-secondary" />
            <h3 className="font-semibold">Community built in</h3>
            <p className="mt-2 text-sm leading-6 text-text-secondary">Club chat, posts, comments, and images keep players connected around real sessions.</p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <CalendarCheck className="mb-4 h-6 w-6 text-text-secondary" />
            <h3 className="font-semibold">Booking-first</h3>
            <p className="mt-2 text-sm leading-6 text-text-secondary">Waitlists, credits, cancellations, and notifications are treated as core flows, not afterthoughts.</p>
          </div>
        </div>
      </section>

      <section className="bg-[#111113] py-16 text-white sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Image src="/images/logo-wide.png" alt="Bookadink" width={220} height={147} className="mx-auto mb-6 h-auto w-44 brightness-0 invert" />
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Preparing for beta across iOS and Android.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/65">
            Interested players, clubs, and organisers can contact Bookadink for early access and launch updates.
          </p>
          <a
            href="mailto:support@bookadink.com?subject=Bookadink%20beta%20interest"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-white px-6 text-base font-semibold text-primary transition hover:bg-background"
          >
            Contact Bookadink
          </a>
        </div>
      </section>

      <footer className="border-t border-border bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <p className="text-sm text-text-tertiary">Bookadink</p>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/terms" className="text-text-secondary transition hover:text-primary">Terms</Link>
            <Link href="/privacy" className="text-text-secondary transition hover:text-primary">Privacy</Link>
            <Link href="/account-deletion" className="text-text-secondary transition hover:text-primary">Account deletion</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
