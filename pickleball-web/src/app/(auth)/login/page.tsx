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
      router.replace('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      showToast(message, 'error');
    }
  };

  return (
    <Card className="p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Welcome Back</h1>
        <p className="text-text-secondary mt-2">Sign in to your account</p>
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

        <div className="text-right">
          <Link href="/forgot-password" className="text-sm text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={loading} className="w-full">
          Sign In
        </Button>
      </form>

      <p className="text-center text-sm text-text-secondary mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-primary font-medium hover:underline">
          Sign Up
        </Link>
      </p>
    </Card>
  );
}
