'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { useClubStore } from '@/stores/clubStore';
import { Home, Calendar, User, Shield, Bell, MessageSquare } from 'lucide-react';
import { useNotificationStore } from '@/stores/notificationStore';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/feed', label: 'Feed', icon: MessageSquare },
  { href: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, initialized, initialize } = useAuthStore();
  const { myAdminClubs, fetchMyAdminClubs } = useClubStore();
  const { unreadCount, fetchNotifications } = useNotificationStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (initialized && !session) {
      router.replace('/login');
    }
  }, [initialized, session, router]);

  useEffect(() => {
    if (session) {
      fetchMyAdminClubs().catch(() => {});
      fetchNotifications().catch(() => {});
    }
  }, [session, fetchMyAdminClubs, fetchNotifications]);

  if (!initialized || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const isAdmin = myAdminClubs.length > 0;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-border h-screen sticky top-0">
        <div className="p-6">
          <h1 className="text-xl font-bold text-primary">Pickleball</h1>
          <p className="text-xs text-text-tertiary">Booking</p>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${active ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-background'}`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
                    <Link
              href="/dashboard/admin"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${pathname.startsWith('/dashboard/admin') ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-background'}`}
            >
              <Shield className="h-5 w-5" />
              Admin
            </Link>
        </nav>
        {unreadCount > 0 && (
          <div className="px-6 pb-4">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Bell className="h-4 w-4" />
              <span>{unreadCount} unread</span>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border flex justify-around py-2 z-50">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${active ? 'text-primary' : 'text-text-tertiary'}`}
            >
              <Icon className="h-6 w-6" />
              {label}
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            href="/dashboard/admin"
            className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${pathname.startsWith('/dashboard/admin') ? 'text-primary' : 'text-text-tertiary'}`}
          >
            <Shield className="h-6 w-6" />
            Admin
          </Link>
        )}
      </nav>
    </div>
  );
}
