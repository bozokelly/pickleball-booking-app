'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';
import { Button, Input, Card } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { uploadAvatar } from '@/utils/imageUpload';
import { supabase } from '@/lib/supabase';
import { Club } from '@/types/database';
import { User, LogOut, Camera, Star, Users, MapPin, Shield, Lock, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { profile, signOut, updateProfile, updatePassword, loading } = useAuthStore();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [duprRating, setDuprRating] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [myClubs, setMyClubs] = useState<Club[]>([]);

  // Password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setDateOfBirth(profile.date_of_birth || '');
      setDuprRating(profile.dupr_rating?.toString() || '');
      setEmergencyName(profile.emergency_contact_name || '');
      setEmergencyPhone(profile.emergency_contact_phone || '');

      // Fetch clubs: both member and admin clubs
      async function loadClubs() {
        const [memberResult, adminResult] = await Promise.all([
          supabase
            .from('club_members')
            .select('club_id')
            .eq('user_id', profile!.id)
            .eq('status', 'approved'),
          supabase
            .from('club_admins')
            .select('club_id')
            .eq('user_id', profile!.id),
        ]);

        const memberIds = (memberResult.data || []).map((r) => r.club_id);
        const adminIds = (adminResult.data || []).map((r) => r.club_id);
        const allIds = [...new Set([...memberIds, ...adminIds])];

        if (allIds.length === 0) {
          setMyClubs([]);
          return;
        }

        const { data } = await supabase
          .from('clubs')
          .select('*')
          .in('id', allIds)
          .order('name');
        setMyClubs(data || []);
      }
      loadClubs();
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
        emergency_contact_name: emergencyName || null,
        emergency_contact_phone: emergencyPhone || null,
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
    if (!file || !profile || uploadingAvatar) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadAvatar(file, profile.id);
      await updateProfile({ avatar_url: url });
      showToast('Avatar updated', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to upload avatar';
      showToast(message, 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      showToast('Please fill in both password fields', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    setChangingPassword(true);
    try {
      await updatePassword(newPassword);
      showToast('Password updated successfully', 'success');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update password';
      showToast(message, 'error');
    } finally {
      setChangingPassword(false);
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
              <Image src={profile.avatar_url} alt="" width={80} height={80} className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <User className="h-10 w-10 text-primary" />
            )}
          </div>
          <label className={`absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center transition-colors ${uploadingAvatar ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:bg-primary-dark'}`}>
            {uploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" disabled={uploadingAvatar} />
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
          <p className="text-3xl font-bold text-text-primary mt-1">{profile.dupr_rating.toFixed(3)}</p>
        </Card>
      )}

      {/* My Clubs */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-text-primary">My Clubs</h3>
        </div>
        {myClubs.length === 0 ? (
          <p className="text-sm text-text-secondary">You haven&apos;t joined any clubs yet. Find one from the Home page!</p>
        ) : (
          <div className="space-y-2">
            {myClubs.map((club) => (
              <Link key={club.id} href={`/dashboard/club/${club.id}`}>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-background hover:bg-primary/5 transition-colors cursor-pointer">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {club.image_url ? (
                      <Image src={club.image_url} alt="" width={40} height={40} className="h-10 w-10 rounded-xl object-cover" />
                    ) : (
                      <Users className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{club.name}</p>
                    {club.location && (
                      <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{club.location}</span>
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Personal Info */}
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
          placeholder="e.g. 3.500"
          hint="Your official DUPR rating"
        />
        <Button onClick={handleSave} loading={saving} className="w-full">
          Save Changes
        </Button>
      </Card>

      {/* Emergency Contact */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-semibold text-text-primary">Emergency Contact</h3>
        </div>
        <p className="text-xs text-text-tertiary">This information will be available to club admins in case of an emergency.</p>
        <Input
          label="Contact Name"
          value={emergencyName}
          onChange={(e) => setEmergencyName(e.target.value)}
          placeholder="e.g. John Smith"
        />
        <Input
          label="Contact Phone"
          type="tel"
          value={emergencyPhone}
          onChange={(e) => setEmergencyPhone(e.target.value)}
          placeholder="Phone number"
        />
        <Button onClick={handleSave} loading={saving} className="w-full">
          Save Emergency Contact
        </Button>
      </Card>

      {/* Change Password */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-text-tertiary" />
          <h3 className="text-lg font-semibold text-text-primary">Change Password</h3>
        </div>
        <Input
          label="New Password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter new password"
        />
        <Input
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
        />
        <Button onClick={handleChangePassword} loading={changingPassword} className="w-full">
          Update Password
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
