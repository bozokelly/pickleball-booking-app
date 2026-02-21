'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button, Card } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { Phone, Calendar, Trophy, ArrowRight, UserCircle, Mail } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, updateProfile } = useAuthStore();
  const { showToast } = useToast();

  const [phone, setPhone] = useState(profile?.phone || '');
  const [dateOfBirth, setDateOfBirth] = useState(profile?.date_of_birth || '');
  const [duprRating, setDuprRating] = useState('');
  const [emergencyName, setEmergencyName] = useState(profile?.emergency_contact_name || '');
  const [emergencyPhone, setEmergencyPhone] = useState(profile?.emergency_contact_phone || '');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone.trim()) {
      showToast('Phone number is required', 'error');
      return;
    }
    if (!dateOfBirth) {
      showToast('Date of birth is required', 'error');
      return;
    }

    setSaving(true);
    try {
      const updates: Record<string, unknown> = {
        phone: phone.trim(),
        date_of_birth: dateOfBirth,
        email_notifications_enabled: emailNotifications,
      };

      if (duprRating.trim()) {
        const rating = parseFloat(duprRating);
        if (isNaN(rating) || rating < 0 || rating > 8) {
          showToast('DUPR rating must be between 0 and 8', 'error');
          setSaving(false);
          return;
        }
        updates.dupr_rating = rating;
      }

      if (emergencyName.trim()) {
        updates.emergency_contact_name = emergencyName.trim();
      }
      if (emergencyPhone.trim()) {
        updates.emergency_contact_phone = emergencyPhone.trim();
      }

      await updateProfile(updates);
      showToast('Profile complete! Welcome aboard.', 'success');
      router.replace('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save profile';
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Complete Your Profile</h1>
        <p className="text-text-secondary text-sm mt-1">
          Just a few quick details before you get started
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 04XX XXX XXX"
                autoComplete="tel"
                className="w-full pl-11 pr-4 py-3 bg-background/60 border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 text-sm"
              />
            </div>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full pl-11 pr-4 py-3 bg-background/60 border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 text-sm"
              />
            </div>
          </div>

          {/* DUPR Rating (optional) */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              DUPR Rating <span className="text-text-tertiary font-normal">(optional)</span>
            </label>
            <div className="relative">
              <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
              <input
                type="number"
                step="0.001"
                min="0"
                max="8"
                value={duprRating}
                onChange={(e) => setDuprRating(e.target.value)}
                placeholder="e.g. 3.500"
                className="w-full pl-11 pr-4 py-3 bg-background/60 border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 text-sm"
              />
            </div>
            <p className="text-xs text-text-tertiary mt-1">
              Your DUPR rating helps match you with games at your skill level
            </p>
          </div>

          {/* Emergency Contact (optional) */}
          <div className="border-t border-border/50 pt-5">
            <div className="flex items-center gap-2 mb-3">
              <UserCircle className="h-4 w-4 text-text-tertiary" />
              <p className="text-sm font-medium text-text-primary">
                Emergency Contact <span className="text-text-tertiary font-normal">(optional)</span>
              </p>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                placeholder="Contact name"
                autoComplete="off"
                className="w-full px-4 py-3 bg-background/60 border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 text-sm"
              />
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
                <input
                  type="tel"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="Contact phone number"
                  autoComplete="off"
                  className="w-full pl-11 pr-4 py-3 bg-background/60 border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Email Notifications Consent */}
          <div className="border-t border-border/50 pt-5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-text-tertiary" />
                  <p className="text-sm font-medium text-text-primary">Email Notifications</p>
                </div>
                <p className="text-xs text-text-tertiary mt-0.5">
                  Receive email updates for booking confirmations, waitlist promotions, game cancellations, and club messages
                </p>
              </div>
            </label>
          </div>

          <Button
            type="submit"
            loading={saving}
            className="w-full"
            icon={<ArrowRight className="h-4 w-4" />}
          >
            Continue to Dashboard
          </Button>
        </form>
      </Card>
    </div>
  );
}
