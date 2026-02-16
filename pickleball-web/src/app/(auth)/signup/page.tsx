'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { Button, Input, Card } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { Mail, Lock, User } from 'lucide-react';

export default function SignupPage() {
  const { signUp, loading } = useAuthStore();
  const { showToast } = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    try {
      await signUp(email, password, fullName);
      showToast('Check your email to confirm your account', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign up failed';
      showToast(message, 'error');
    }
  };

  return (
    <div>
      {/* Branding */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-primary">Pickleball</h1>
        <p className="text-xs text-text-tertiary tracking-wide">BOOKING</p>
      </div>

      {/* Tab toggle */}
      <div className="flex bg-background rounded-xl p-1 mb-6">
        <Link href="/login" className="flex-1 text-center py-2.5 rounded-lg text-text-tertiary font-medium text-sm hover:text-text-secondary transition-colors">
          Sign In
        </Link>
        <div className="flex-1 text-center py-2.5 rounded-lg bg-white text-primary font-semibold text-sm shadow-sm">
          Create Account
        </div>
      </div>

      <Card className="p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-text-primary">Create Account</h2>
          <p className="text-text-secondary mt-1 text-sm">Join the pickleball community</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            icon={<User className="h-5 w-5" />}
            autoComplete="name"
          />
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
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="h-5 w-5" />}
            autoComplete="new-password"
          />
          <Input
            label="Confirm Password"
            isPassword
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={<Lock className="h-5 w-5" />}
            autoComplete="new-password"
          />

          <Button type="submit" loading={loading} className="w-full">
            Create Account
          </Button>
        </form>
      </Card>
    </div>
  );
}
