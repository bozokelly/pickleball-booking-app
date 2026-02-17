'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { Button, Input, Card } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { Mail, Lock, User, CheckCircle } from 'lucide-react';

export default function SignupPage() {
  const { signUp, loading } = useAuthStore();
  const { showToast } = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sent, setSent] = useState(false);

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
      setSent(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign up failed';
      showToast(message, 'error');
    }
  };

  if (sent) {
    return (
      <div>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-primary">Book a Dink</h1>
        </div>
        <Card className="p-8 text-center">
          <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text-primary mb-2">Check Your Email</h2>
          <p className="text-text-secondary text-sm mb-1">
            We&apos;ve sent a confirmation link to
          </p>
          <p className="text-text-primary font-medium mb-6">{email}</p>
          <p className="text-text-tertiary text-xs mb-6">
            Click the link in the email to activate your account, then come back and sign in.
          </p>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              Back to Sign In
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* Branding */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-primary">Book a Dink</h1>
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
