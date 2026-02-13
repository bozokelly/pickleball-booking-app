'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export default function RootPage() {
  const router = useRouter();
  const { session, initialized, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!initialized) return;
    if (session) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [initialized, session, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
    </div>
  );
}
