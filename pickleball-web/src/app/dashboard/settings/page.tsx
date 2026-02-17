'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/stores/authStore';
import { Bell, Moon, Globe, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { deleteAccount } = useAuthStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      router.push('/auth/login');
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
          <SettingRow label="Email notifications" description="Receive email updates for bookings and messages" defaultOn />
          <SettingRow label="Game reminders" description="Get notified before your upcoming games" defaultOn />
          <SettingRow label="Club announcements" description="Updates from clubs you belong to" defaultOn />
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

function SettingRow({ label, description, defaultOn }: { label: string; description: string; defaultOn?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-xs text-text-tertiary">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={defaultOn}
        className={`relative w-11 h-6 rounded-full transition-colors ${defaultOn ? 'bg-primary' : 'bg-border'}`}
      >
        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${defaultOn ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}
