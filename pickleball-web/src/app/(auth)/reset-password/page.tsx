'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { Button, Input, Card } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { Lock, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword } = useAuthStore();
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      showToast('Please enter a new password', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    setLoading(true);
    try {
      await updatePassword(password);
      setDone(true);
      showToast('Password updated successfully', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update password';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <Card className="p-8 text-center">
        <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-text-primary mb-2">Password Updated</h1>
        <p className="text-text-secondary text-sm mb-6">Your password has been successfully changed.</p>
        <Button onClick={() => router.replace('/dashboard')} className="w-full">
          Go to Dashboard
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-8">
      <Link href="/login" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to login
      </Link>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Set New Password</h1>
        <p className="text-text-secondary mt-2 text-sm">Enter your new password below</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="New Password"
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
          Update Password
        </Button>
      </form>
    </Card>
  );
}
