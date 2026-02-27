'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';
import { CalendarPlus, Users, MessageCircle } from 'lucide-react';

const features = [
  {
    icon: CalendarPlus,
    title: 'Book Games',
    description: 'Browse upcoming games, reserve your spot, and get added to the waitlist when courts are full.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: Users,
    title: 'Join Clubs',
    description: 'Find and join local pickleball clubs. Request membership and connect with players near you.',
    color: 'text-success',
    bg: 'bg-success/10',
  },
  {
    icon: MessageCircle,
    title: 'Community',
    description: 'Chat with other players, share updates, and stay connected with your pickleball community.',
    color: 'text-info',
    bg: 'bg-info/10',
  },
];

const steps = [
  {
    number: '1',
    title: 'Create your account',
    description: 'Sign up in seconds, no credit card needed.',
  },
  {
    number: '2',
    title: 'Find your club',
    description: 'Browse local clubs, request membership, get approved.',
  },
  {
    number: '3',
    title: 'Book your game',
    description: 'Reserve a spot or join the waitlist — never miss a game.',
  },
];

const stats = [
  { value: '50+', label: 'Clubs' },
  { value: '1,200+', label: 'Players' },
  { value: '5,000+', label: 'Games Booked' },
  { value: 'Free', label: 'to Join' },
];

const testimonials = [
  {
    quote: 'Finally an easy way to book pickleball. My whole club uses it now.',
    name: 'Sarah M.',
    role: 'Club Admin',
  },
  {
    quote: 'The waitlist feature is a game changer. I never miss a spot anymore.',
    name: 'Jake T.',
    role: 'Player',
  },
  {
    quote: 'Set up our club in minutes. The booking management is super clean.',
    name: 'Rachel K.',
    role: 'Club Organizer',
  },
];

export default function LandingPage() {
  const { session, initialized, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="min-h-screen">
      {/* Fixed background logo — stays centred as you scroll */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none select-none z-0" aria-hidden="true">
        <Image
          src="/images/logo-wide.png"
          alt=""
          width={1100}
          height={733}
          className="w-[90vw] max-w-[1100px] h-auto opacity-[0.06]"
        />
      </div>

      {/* Nav */}
      <nav className="relative border-b border-border/50 bg-white/70 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Image src="/images/logo.png" alt="Book a Dink" width={44} height={44} className="object-contain drop-shadow-sm" />
          <div className="flex gap-3">
            {initialized && session ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-5 py-2 bg-success text-white font-semibold rounded-xl text-sm hover:bg-success-dark transition-all duration-150"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-4 py-2 text-primary font-semibold rounded-xl text-sm hover:bg-primary/5 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center px-5 py-2 bg-success text-white font-semibold rounded-xl text-sm hover:bg-success-dark transition-all duration-150 shadow-[0_1px_4px_rgba(46,204,113,0.30)]"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-transparent" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-32 text-center">
          <div className="text-6xl sm:text-7xl mb-6">
            🏓
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-text-primary tracking-tight">
            Book Your Next{' '}
            <span className="text-primary">Pickleball</span>{' '}
            Game
          </h1>
          <p className="mt-4 sm:mt-6 text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto">
            Find games, join clubs, and connect with players in your area. The easiest way to organize and book pickleball.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            {initialized && session ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-success text-white font-semibold rounded-xl text-lg hover:bg-success-dark transition-all duration-150"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center px-8 py-3.5 bg-success text-white font-semibold rounded-xl text-lg hover:bg-success-dark active:scale-[0.98] transition-all duration-150 shadow-[0_2px_12px_rgba(46,204,113,0.35)]"
                >
                  Get Started — It&apos;s Free
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-8 py-3.5 border border-primary/30 text-primary font-semibold rounded-xl text-lg hover:bg-primary/8 transition-all duration-150"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative bg-white/60 border-y border-border/40 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary text-center mb-4">
            How It Works
          </h2>
          <p className="text-text-secondary text-center max-w-xl mx-auto mb-12">
            Get on the court in three easy steps.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center mb-4 shadow-[0_2px_8px_rgba(79,111,163,0.30)]">
                  <span className="text-white font-bold text-lg">{step.number}</span>
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-2">{step.title}</h3>
                <p className="text-sm text-text-secondary">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative bg-primary py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-white/70 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <h2 className="text-2xl sm:text-3xl font-bold text-text-primary text-center mb-4">
          Everything You Need
        </h2>
        <p className="text-text-secondary text-center max-w-xl mx-auto mb-12">
          From booking courts to managing clubs, we&apos;ve got your pickleball life covered.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-2xl p-6 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all border border-border/30"
            >
              <div className={`h-12 w-12 rounded-xl ${feature.bg} flex items-center justify-center mx-auto mb-4`}>
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">{feature.title}</h3>
              <p className="text-sm text-text-secondary">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative bg-white/60 border-y border-border/40 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary text-center mb-4">
            Loved by Players
          </h2>
          <p className="text-text-secondary text-center max-w-xl mx-auto mb-12">
            Join a growing community of pickleball enthusiasts.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)] border border-border/30"
              >
                <p className="text-text-primary text-base leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{t.name}</p>
                  <p className="text-xs text-text-tertiary">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
            Ready to play?
          </h2>
          <p className="text-lg text-text-secondary max-w-xl mx-auto mb-8">
            Join thousands of pickleball players booking games every day.
          </p>
          {initialized && session ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-success text-white font-semibold rounded-xl text-lg hover:bg-success-dark active:scale-[0.98] transition-all duration-150 shadow-[0_2px_12px_rgba(46,204,113,0.35)]"
            >
              Go to Dashboard
            </Link>
          ) : (
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-success text-white font-semibold rounded-xl text-lg hover:bg-success-dark active:scale-[0.98] transition-all duration-150 shadow-[0_2px_12px_rgba(46,204,113,0.35)]"
            >
              Get Started — It&apos;s Free
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <p className="text-center text-sm text-text-tertiary">
          Book a Dink
        </p>
      </footer>
    </div>
  );
}
