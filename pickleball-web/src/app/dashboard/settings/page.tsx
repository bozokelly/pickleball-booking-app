'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/stores/authStore';
import { Bell, Moon, Globe, Trash2 } from 'lucide-react';

const LOCAL_SETTINGS_KEY = 'bookadink-web-settings-v1';
const DEFAULT_LOCAL_SETTINGS = {
  gameReminders: true,
  clubAnnouncements: true,
};

export default function SettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { profile, updateProfile, deleteAccount } = useAuthStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [gameReminders, setGameReminders] = useState(DEFAULT_LOCAL_SETTINGS.gameReminders);
  const [clubAnnouncements, setClubAnnouncements] = useState(DEFAULT_LOCAL_SETTINGS.clubAnnouncements);

  useEffect(() => {
    if (profile) {
      setEmailNotifications(profile.email_notifications_enabled);
    }
  }, [profile]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(LOCAL_SETTINGS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<typeof DEFAULT_LOCAL_SETTINGS>;
      if (typeof parsed.gameReminders === 'boolean') {
        setGameReminders(parsed.gameReminders);
      }
      if (typeof parsed.clubAnnouncements === 'boolean') {
        setClubAnnouncements(parsed.clubAnnouncements);
      }
    } catch {
      // Ignore malformed local settings and keep defaults.
    }
  }, []);

  const saveLocalSettings = (next: Partial<typeof DEFAULT_LOCAL_SETTINGS>) => {
    const merged = {
      gameReminders: next.gameReminders ?? gameReminders,
      clubAnnouncements: next.clubAnnouncements ?? clubAnnouncements,
    };
    setGameReminders(merged.gameReminders);
    setClubAnnouncements(merged.clubAnnouncements);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(merged));
    }
  };

  const handleEmailToggle = async () => {
    if (!profile || savingEmail) return;
    const next = !emailNotifications;
    setEmailNotifications(next);
    setSavingEmail(true);
    try {
      await updateProfile({ email_notifications_enabled: next });
    } catch (err: unknown) {
      setEmailNotifications(!next);
      const message = err instanceof Error ? err.message : 'Failed to update notification preference';
      showToast(message, 'error');
    } finally {
      setSavingEmail(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      router.push('/login');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete account';
      showToast(message, 'error');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Settings</h1>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-text-primary">Notifications</h3>
        </div>
        <div className="space-y-3">
          <SettingRow
            label="Email notifications"
            description="Receive email updates for bookings and messages"
            checked={emailNotifications}
            onToggle={handleEmailToggle}
            disabled={savingEmail || !profile}
          />
          <SettingRow
            label="Game reminders"
            description="Get notified before your upcoming games (saved on this browser)"
            checked={gameReminders}
            onToggle={() => saveLocalSettings({ gameReminders: !gameReminders })}
          />
          <SettingRow
            label="Club announcements"
            description="Updates from clubs you belong to (saved on this browser)"
            checked={clubAnnouncements}
            onToggle={() => saveLocalSettings({ clubAnnouncements: !clubAnnouncements })}
          />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Moon className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-text-primary">Appearance</h3>
        </div>
        <p className="text-sm text-text-tertiary">Theme and display options coming soon.</p>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-text-primary">Region</h3>
        </div>
        <p className="text-sm text-text-tertiary">Region and language settings coming soon.</p>
      </Card>

      <Card className="p-6 border-error/30">
        <h3 className="text-sm font-semibold text-error mb-2">Danger Zone</h3>
        <p className="text-sm text-text-secondary mb-4">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        <Button
          variant="danger"
          size="sm"
          icon={<Trash2 className="h-4 w-4" />}
          loading={deleting}
          onClick={() => setShowDeleteDialog(true)}
        >
          Delete Account
        </Button>
      </Card>

      <ConfirmDialog
        open={showDeleteDialog}
        title="Delete Account"
        message="Are you sure you want to permanently delete your account? All your bookings, memberships, and data will be removed. This action cannot be undone."
        confirmLabel="Delete My Account"
        variant="danger"
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  );
}

function SettingRow({
  label,
  description,
  checked,
  onToggle,
  disabled = false,
}: {
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-xs text-text-tertiary">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={onToggle}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-border'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}
