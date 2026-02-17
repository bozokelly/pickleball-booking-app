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
    <div>
      {/* Branding */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-primary">Book a Dink</h1>
      </div>

      {/* Tab toggle */}
      <div className="flex bg-background rounded-xl p-1 mb-6">
        <div className="flex-1 text-center py-2.5 rounded-lg bg-white text-primary font-semibold text-sm shadow-sm">
          Sign In
        </div>
        <Link href="/signup" className="flex-1 text-center py-2.5 rounded-lg text-text-tertiary font-medium text-sm hover:text-text-secondary transition-colors">
          Create Account
        </Link>
      </div>

      <Card className="p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-text-primary">Welcome Back</h2>
          <p className="text-text-secondary mt-1 text-sm">Sign in to your account</p>
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
      </Card>
    </div>
  );
}
