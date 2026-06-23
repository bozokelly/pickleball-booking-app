'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button, Input, Card } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, loading } = useAuthStore();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    try {
      await signIn(email, password);
      const next = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('next')
        : null;
      const safeNext = next && next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin';
      router.replace(safeNext);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      showToast(message, 'error');
    }
  };

  return (
    <div>
      {/* Branding */}
      <div className="flex justify-center mb-8">
        <Link href="/" aria-label="Go to home page">
          <img src="/images/logo-wide.png" alt="Book a Dink" className="w-64 h-auto object-contain" />
        </Link>
      </div>

      <Card className="p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-text-primary">Internal access</h2>
          <p className="text-text-secondary mt-1 text-sm">Sign in to the Bookadink command centre</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="h-5 w-5" />}
            autoComplete="email"
          />
          <Input
            label="Password"
            isPassword
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="h-5 w-5" />}
            autoComplete="current-password"
          />

          <Button type="submit" loading={loading} className="w-full">
            Sign in to admin
          </Button>
        </form>
      </Card>
    </div>
  );
}
