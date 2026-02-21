'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { Button, Input, Card } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { Mail, Lock, User, Inbox, MousePointerClick, LayoutDashboard, RefreshCw } from 'lucide-react';

const RESEND_COOLDOWN = 60;

export default function SignupPage() {
  const { signUp, resendConfirmation, loading } = useAuthStore();
  const { showToast } = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sent, setSent] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

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

  const handleResend = useCallback(async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    try {
      await resendConfirmation(email);
      setCooldown(RESEND_COOLDOWN);
      showToast('Confirmation email sent!', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to resend';
      showToast(message, 'error');
    } finally {
      setResending(false);
    }
  }, [email, cooldown, resending, resendConfirmation, showToast]);

  if (sent) {
    return (
      <div>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-primary">Book a Dink</h1>
        </div>
        <Card className="p-8">
          {/* Animated mail icon */}
          <div className="flex justify-center mb-5">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center animate-bounce">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-text-primary">Check Your Email</h2>
            <p className="text-text-secondary text-sm mt-2">
              We&apos;ve sent a confirmation link to
            </p>
            <p className="text-text-primary font-semibold mt-1">{email}</p>
          </div>

          {/* Steps */}
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Inbox className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">1. Open your email inbox</p>
                <p className="text-xs text-text-tertiary mt-0.5">Check your spam or junk folder if you don&apos;t see it</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MousePointerClick className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">2. Click the confirmation link</p>
                <p className="text-xs text-text-tertiary mt-0.5">It will say &quot;Confirm your email&quot;</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <LayoutDashboard className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">3. You&apos;re in!</p>
                <p className="text-xs text-text-tertiary mt-0.5">You&apos;ll be signed in and taken straight to your dashboard</p>
              </div>
            </div>
          </div>

          {/* Resend */}
          <div className="border-t border-border/50 pt-4 space-y-3">
            <p className="text-xs text-text-tertiary text-center">Didn&apos;t receive the email?</p>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResend}
              loading={resending}
              disabled={cooldown > 0}
              icon={<RefreshCw className="h-4 w-4" />}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Email'}
            </Button>
            <Link href="/login" className="block">
              <Button variant="ghost" className="w-full text-text-secondary">
                Back to Sign In
              </Button>
            </Link>
          </div>
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
