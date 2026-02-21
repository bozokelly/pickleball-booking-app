'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';
import { useClubStore } from '@/stores/clubStore';
import { useMembershipStore } from '@/stores/membershipStore';
import { Home, Search, Calendar, User, Shield, Bell, LogOut, ChevronDown, ChevronUp, Users, MapPin, Settings, HelpCircle, Newspaper, Plus } from 'lucide-react';
import { useNotificationStore } from '@/stores/notificationStore';
import { Club } from '@/types/database';
import { supabase } from '@/lib/supabase';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
  { href: '/dashboard/news', label: 'News', icon: Newspaper },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, profile, initialized, initialize, signOut } = useAuthStore();
  const { myAdminClubs, fetchMyAdminClubs } = useClubStore();
  const { fetchMyMemberships, myMemberships } = useMembershipStore();
  const { unreadCount, fetchNotifications, subscribeToRealtime, unsubscribe } = useNotificationStore();

  const [clubsExpanded, setClubsExpanded] = useState(false);
  const [myClubs, setMyClubs] = useState<Club[]>([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (initialized && !session) {
      router.replace('/login');
    }
  }, [initialized, session, router]);

  // Redirect to onboarding if profile is missing required fields
  useEffect(() => {
    if (initialized && profile && pathname !== '/dashboard/onboarding') {
      if (!profile.phone || !profile.date_of_birth) {
        router.replace('/dashboard/onboarding');
      }
    }
  }, [initialized, profile, pathname, router]);

  useEffect(() => {
    if (session) {
      // Fire all initial data fetches in parallel
      Promise.all([
        fetchMyAdminClubs(),
        fetchNotifications(),
        fetchMyMemberships(),
      ]).catch(() => {});
      subscribeToRealtime().catch(() => {});
    }
    return () => {
      unsubscribe();
    };
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  // Build sidebar clubs list from store data
  useEffect(() => {
    const memberIds = myMemberships
      .filter((m) => m.status === 'approved')
      .map((m) => m.club_id);
    const adminIds = myAdminClubs.map((c) => c.id);
    const allIds = [...new Set([...memberIds, ...adminIds])];
    if (allIds.length === 0) {
      setMyClubs([]);
      return;
    }
    supabase
      .from('clubs')
      .select('*')
      .in('id', allIds)
      .order('name')
      .then(({ data }) => {
        setMyClubs(data || []);
      });
  }, [myMemberships, myAdminClubs]);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const isAdmin = myAdminClubs.length > 0;
  const isClubsActive = pathname === '/dashboard/games' || pathname.startsWith('/dashboard/club/');

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white/80 backdrop-blur-xl border-r border-border/50 h-screen sticky top-0">
        <div className="p-6 pb-4">
          <h1 className="text-xl font-bold text-primary">Book a Dink</h1>
        </div>
        {/* User profile dropdown */}
        <div className="px-3 pb-3 relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-background transition-colors"
          >
            {profile?.avatar_url ? (
              <Image src={profile.avatar_url} alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-primary">
                  {(profile?.full_name || session?.user.email || '?')[0].toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-text-primary truncate">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-[11px] text-text-tertiary truncate">
                {session?.user.email}
              </p>
            </div>
            <ChevronDown className={`h-4 w-4 text-text-tertiary transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          {userMenuOpen && (
            <div className="absolute left-3 right-3 top-full mt-1 bg-white rounded-xl border border-border/50 shadow-lg z-50 py-1 overflow-hidden">
              <Link
                href="/dashboard/profile"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-background transition-colors"
              >
                <User className="h-4 w-4" />
                My Profile
              </Link>
              <Link
                href="/dashboard/settings"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-background transition-colors"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <Link
                href="/dashboard/support"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-background transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
                Support
              </Link>
              <div className="border-t border-border/50 my-1" />
              <button
                onClick={async () => { setUserMenuOpen(false); await signOut(); router.replace('/login'); }}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors w-full"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
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

          {/* Clubs expandable section */}
          <div>
            <button
              onClick={() => setClubsExpanded(!clubsExpanded)}
              className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isClubsActive ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-background'}`}
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5" />
                Clubs
              </div>
              {clubsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {clubsExpanded && (
              <div className="ml-5 mt-1 space-y-0.5">
                <Link
                  href="/dashboard/games"
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${pathname === '/dashboard/games' ? 'text-primary font-medium' : 'text-text-secondary hover:bg-background'}`}
                >
                  <Search className="h-4 w-4" />
                  Find a Club
                </Link>
                <Link
                  href="/dashboard/create-club"
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${pathname === '/dashboard/create-club' ? 'text-primary font-medium' : 'text-text-secondary hover:bg-background'}`}
                >
                  <Plus className="h-4 w-4" />
                  Create a Club
                </Link>
                {myClubs.length > 0 && (
                  <div>
                    <p className="px-3 py-1.5 text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">My Clubs</p>
                    {myClubs.map((club) => (
                      <Link
                        key={club.id}
                        href={`/dashboard/club/${club.id}`}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${pathname === `/dashboard/club/${club.id}` ? 'text-primary font-medium' : 'text-text-secondary hover:bg-background'}`}
                      >
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{club.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notifications */}
          <Link
            href="/dashboard/notifications"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${pathname === '/dashboard/notifications' ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-background'}`}
          >
            <div className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            Notifications
          </Link>

          {/* Admin */}
          {isAdmin && (
            <Link
              href="/dashboard/admin"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${pathname.startsWith('/dashboard/admin') ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-background'}`}
            >
              <Shield className="h-5 w-5" />
              Admin
            </Link>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 pb-20 md:pb-0 overflow-x-hidden">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-border/50 flex justify-around py-2 z-50">
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
        <Link
          href="/dashboard/games"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${pathname === '/dashboard/games' ? 'text-primary' : 'text-text-tertiary'}`}
        >
          <Users className="h-6 w-6" />
          Clubs
        </Link>
        <Link
          href="/dashboard/notifications"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs relative ${pathname === '/dashboard/notifications' ? 'text-primary' : 'text-text-tertiary'}`}
        >
          <div className="relative">
            <Bell className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          Alerts
        </Link>
        <Link
          href="/dashboard/profile"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${pathname === '/dashboard/profile' ? 'text-primary' : 'text-text-tertiary'}`}
        >
          <User className="h-6 w-6" />
          Profile
        </Link>
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
