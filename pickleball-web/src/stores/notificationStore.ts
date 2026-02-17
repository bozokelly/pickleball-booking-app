import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Notification } from '@/types/database';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useAuthStore } from './authStore';

interface NotificationState {
  notifications: Notification[]; unreadCount: number; channel: RealtimeChannel | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  subscribeToRealtime: () => Promise<void>;
  unsubscribe: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [], unreadCount: 0, channel: null,

  fetchNotifications: async () => {
    const userId = useAuthStore.getState().session?.user?.id;
    if (!userId) return;
    const { data, error } = await supabase.from('notifications')
      .select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
    if (error) throw new Error(error.message);
    const notifications = data || [];
    set({ notifications, unreadCount: notifications.filter((n) => !n.read).length });
  },

  markAsRead: async (notificationId) => {
    await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
    set((state) => ({
      notifications: state.notifications.map((n) => n.id === notificationId ? { ...n, read: true } : n),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: async () => {
    const userId = useAuthStore.getState().session?.user?.id;
    if (!userId) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
    set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, read: true })), unreadCount: 0 }));
  },

  subscribeToRealtime: async () => {
    try {
      const userId = useAuthStore.getState().session?.user?.id;
      if (!userId) return;

      const existing = get().channel;
      if (existing) {
        try { supabase.removeChannel(existing); } catch { /* ignore */ }
      }

      const channel = supabase
        .channel(`notifications-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            set((state) => ({
              notifications: [newNotification, ...state.notifications],
              unreadCount: state.unreadCount + 1,
            }));
          }
        )
        .subscribe();

      set({ channel });
    } catch {
      // Ignore AbortError from React Strict Mode double-mount
    }
  },

  unsubscribe: () => {
    const channel = get().channel;
    if (channel) {
      try { supabase.removeChannel(channel); } catch { /* ignore */ }
      set({ channel: null });
    }
  },
}));
