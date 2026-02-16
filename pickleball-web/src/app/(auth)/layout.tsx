'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session, initialized, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (initialized && session) {
      router.replace('/dashboard');
    }
  }, [initialized, session, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Faint hero image — top-right, almost greyscale with curved gradient fade */}
      <div
        className="absolute top-0 right-0 w-[65%] h-[75%] pointer-events-none"
        aria-hidden="true"
      >
        <img
          src="/images/pickleball-hero.jpg"
          alt=""
          className="w-full h-full object-cover grayscale-[90%] opacity-[0.12]"
        />
        {/* Curved gradient overlay fading to background */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 100% 0%, transparent 30%, var(--color-background) 70%)',
          }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {children}
      </div>
    </div>
  );
}
