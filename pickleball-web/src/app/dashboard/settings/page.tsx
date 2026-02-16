'use client';

import { Card } from '@/components/ui';
import { Settings, Bell, Moon, Globe } from 'lucide-react';

export default function SettingsPage() {
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
