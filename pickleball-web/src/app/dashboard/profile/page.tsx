'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button, Input, Card } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { uploadAvatar } from '@/utils/imageUpload';
import { User, LogOut, Camera, Star } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { profile, signOut, updateProfile, loading } = useAuthStore();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [duprRating, setDuprRating] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setDateOfBirth(profile.date_of_birth || '');
      setDuprRating(profile.dupr_rating?.toString() || '');
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        full_name: fullName || null,
        phone: phone || null,
        date_of_birth: dateOfBirth || null,
        dupr_rating: duprRating ? parseFloat(duprRating) : null,
      });
      showToast('Profile updated', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    try {
      const url = await uploadAvatar(file, profile.id);
      await updateProfile({ avatar_url: url });
      showToast('Avatar updated', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to upload avatar';
      showToast(message, 'error');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Profile</h1>

      {/* Avatar */}
      <Card className="flex items-center gap-4 p-6">
        <div className="relative">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <User className="h-10 w-10 text-primary" />
            )}
          </div>
          <label className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer hover:bg-primary-dark transition-colors">
            <Camera className="h-3.5 w-3.5" />
            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </label>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-text-primary">{profile.full_name || 'Player'}</h2>
          <p className="text-sm text-text-secondary">{profile.email}</p>
        </div>
      </Card>

      {/* DUPR Rating */}
      {profile.dupr_rating && (
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-warning" />
            <span className="text-sm font-medium text-text-secondary">DUPR Rating</span>
          </div>
          <p className="text-3xl font-bold text-text-primary mt-1">{profile.dupr_rating.toFixed(2)}</p>
        </Card>
      )}

      {/* Edit form */}
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-text-primary">Personal Info</h3>
        <Input
          label="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your full name"
        />
        <Input
          label="Phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone number"
        />
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Date of Birth</label>
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <Input
          label="DUPR Rating"
          type="number"
          value={duprRating}
          onChange={(e) => setDuprRating(e.target.value)}
          placeholder="e.g. 3.5"
          hint="Your official DUPR rating"
        />
        <Button onClick={handleSave} loading={saving} className="w-full">
          Save Changes
        </Button>
      </Card>

      {/* Sign Out */}
      <Button
        variant="outline"
        onClick={handleSignOut}
        icon={<LogOut className="h-5 w-5" />}
        className="w-full"
      >
        Sign Out
      </Button>
    </div>
  );
}
