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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
