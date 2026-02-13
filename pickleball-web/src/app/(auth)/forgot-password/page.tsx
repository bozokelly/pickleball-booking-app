'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { Button, Input, Card } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuthStore();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast('Please enter your email', 'error');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      showToast('Password reset email sent', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-8">
      <Link href="/login" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to login
      </Link>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Reset Password</h1>
        <p className="text-text-secondary mt-2">
          {sent ? 'Check your email for a reset link' : 'Enter your email to receive a reset link'}
        </p>
      </div>

      {!sent && (
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
          <Button type="submit" loading={loading} className="w-full">
            Send Reset Link
          </Button>
        </form>
      )}

      {sent && (
        <div className="text-center">
          <Button variant="outline" onClick={() => setSent(false)} className="mt-4">
            Send Again
          </Button>
        </div>
      )}
    </Card>
  );
}
