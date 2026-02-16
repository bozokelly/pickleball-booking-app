'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { useNotificationStore } from '@/stores/notificationStore';
import { Card, Button } from '@/components/ui';
import { Notification } from '@/types/database';
import {
  Bell, CheckCircle, Users, Gamepad2, MessageSquare,
  CalendarPlus, ArrowLeft, CheckCheck
} from 'lucide-react';

const typeConfig: Record<string, { icon: typeof Bell; color: string }> = {
  booking_confirmed: { icon: CheckCircle, color: '#34C759' },
  waitlist_promoted: { icon: CalendarPlus, color: '#007AFF' },
  game_cancelled: { icon: Gamepad2, color: '#FF3B30' },
  game_reminder: { icon: Bell, color: '#FF9500' },
  game_updated: { icon: Gamepad2, color: '#5856D6' },
  membership_request: { icon: Users, color: '#FF9500' },
  new_game_available: { icon: CalendarPlus, color: '#34C759' },
  new_club_message: { icon: MessageSquare, color: '#007AFF' },
  club_message_reply: { icon: MessageSquare, color: '#5856D6' },
};

function getNotificationHref(n: Notification): string | null {
  switch (n.type) {
    case 'membership_request':
      return n.reference_id ? `/dashboard/admin/club/${n.reference_id}/members` : null;
    case 'new_game_available':
      return n.reference_id ? `/dashboard/club/${n.reference_id}` : null;
    case 'new_club_message':
      return n.reference_id ? `/dashboard/admin/club/${n.reference_id}/messages` : null;
    case 'club_message_reply':
      return n.reference_id ? `/dashboard/club/${n.reference_id}` : null;
    case 'booking_confirmed':
    case 'waitlist_promoted':
    case 'game_cancelled':
    case 'game_reminder':
    case 'game_updated':
      return n.reference_id ? `/dashboard/game/${n.reference_id}` : null;
    default:
      return null;
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleClick = async (n: Notification) => {
    if (!n.read) await markAsRead(n.id);
    const href = getNotificationHref(n);
    if (href) router.push(href);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-primary hover:underline">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}
            icon={<CheckCheck className="h-4 w-4" />}>
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="p-8 text-center">
          <Bell className="h-10 w-10 text-text-tertiary mx-auto mb-3" />
          <p className="text-text-secondary">No notifications yet</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const config = typeConfig[n.type] || { icon: Bell, color: '#8E8E93' };
            const Icon = config.icon;
            return (
              <Card
                key={n.id}
                className={`p-4 cursor-pointer hover:shadow-sm transition-shadow ${!n.read ? 'bg-primary/[0.03] border-primary/20' : ''}`}
                onClick={() => handleClick(n)}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${config.color}15` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: config.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm ${!n.read ? 'font-semibold' : 'font-medium'} text-text-primary`}>
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-text-secondary mt-0.5">{n.body}</p>
                    <p className="text-xs text-text-tertiary mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
