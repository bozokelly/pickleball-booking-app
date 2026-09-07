import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BellRing, CalendarCheck2, MessageCircleMore, Sparkles } from 'lucide-react';
import { WaitlistForm } from '@/components/waitlist/WaitlistForm';

export const metadata: Metadata = {
  title: 'Join the BookaDink waitlist',
  description: 'Join the BookaDink waitlist and be notified when the pickleball booking app is available to download.',
  alternates: { canonical: 'https://www.bookadink.com/waitlist' },
  openGraph: {
    title: 'Join the BookaDink waitlist',
    description: 'Pickleball bookings, waitlists, club chat and payments — all in one app.',
    url: 'https://www.bookadink.com/waitlist',
    images: [{ url: '/images/app/bookadink-app-icon.png', width: 1024, height: 1024 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Join the BookaDink waitlist',
    description: 'Be first to know when BookaDink is ready to download.',
    images: ['/images/app/bookadink-app-icon.png'],
  },
};

const benefits = [
  { icon: CalendarCheck2, text: 'Find games and book your spot in seconds' },
  { icon: BellRing, text: 'Stay on top of waitlists, changes and reminders' },
  { icon: MessageCircleMore, text: 'Keep up with your clubs and pickleball community' },
];

export default function WaitlistPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FBF6EC] text-[#101214]">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-32 top-16 h-96 w-96 rounded-full bg-[#C8FF2E]/38 blur-3xl" />
        <div className="absolute -right-36 top-56 h-[28rem] w-[28rem] rounded-full bg-[#FF6A3D]/14 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.055] [background-image:linear-gradient(90deg,#101214_1px,transparent_1px),linear-gradient(#101214_1px,transparent_1px)] [background-size:64px_64px]" />
      </div>

      <header className="relative z-10 border-b border-[#101214]/10 bg-[#FBF6EC]/82 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="Book a Dink home" className="flex items-center gap-3">
            <Image src="/images/app/bookadink-app-icon.png" alt="" width={44} height={44} className="rounded-xl shadow-sm" priority />
            <div className="leading-tight">
              <p className="text-base font-semibold">Book a Dink</p>
              <p className="text-xs font-medium text-[#737B86]">Pickleball, organised</p>
            </div>
          </Link>
          <Link href="/" className="rounded-xl px-3 py-2 text-sm font-semibold text-[#4D5662] transition hover:bg-white hover:text-[#101214]">
            Back home
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid max-w-7xl gap-12 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.05fr_0.75fr] lg:items-center lg:gap-20 lg:py-24">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#101214]/10 bg-white/75 px-3 py-1.5 text-sm font-semibold shadow-sm backdrop-blur">
            <Sparkles className="h-4 w-4 text-[#72B600]" aria-hidden="true" />
            Be first on court
          </div>
          <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
            Your next game starts with BookaDink.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5D6470] sm:text-xl">
            Book games, join smart waitlists, chat with your club and handle payments in one polished pickleball app.
          </p>

          <div className="mt-9 grid max-w-2xl gap-3">
            {benefits.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-4 rounded-2xl border border-[#101214]/10 bg-white/72 p-4 shadow-sm backdrop-blur">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#C8FF2E]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="text-sm font-semibold leading-6 sm:text-base">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-4 lg:hidden">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#5D7E24]">Launch waitlist</p>
            <h2 className="mt-2 text-3xl font-semibold">Save your place</h2>
          </div>
          <WaitlistForm />
          <p className="mt-4 text-center text-sm text-[#66707C]">Free to join. We’ll only contact you about BookaDink availability.</p>
        </div>
      </section>
    </main>
  );
}
