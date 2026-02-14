'use client';

import { useEffect } from 'react';
import Link from 'next/link';
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

export default function LandingPage() {
  const { session, initialized, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-border/50 bg-white/70 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <span className="text-lg font-bold text-text-primary">Pickleball Booking</span>
          <div className="flex gap-3">
            {initialized && session ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-5 py-2 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark transition-colors"
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
                  className="inline-flex items-center justify-center px-5 py-2 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark transition-all shadow-[0_1px_4px_rgba(0,113,227,0.25)]"
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
                className="inline-flex items-center justify-center px-8 py-3.5 bg-primary text-white font-semibold rounded-xl text-lg hover:bg-primary-dark transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center px-8 py-3.5 bg-primary text-white font-semibold rounded-xl text-lg hover:bg-primary-dark transition-all shadow-[0_2px_8px_rgba(0,113,227,0.3)]"
                >
                  Get Started — It&apos;s Free
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-8 py-3.5 border border-primary/30 text-primary font-semibold rounded-xl text-lg hover:bg-primary/5 transition-all"
                >
                  Sign In
                </Link>
              </>
            )}
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

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <p className="text-center text-sm text-text-tertiary">
          Pickleball Booking
        </p>
      </footer>
    </div>
  );
}
