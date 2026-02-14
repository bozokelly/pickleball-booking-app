'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { Card, Button, Badge } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { Club } from '@/types/database';
import { Trophy, CalendarClock, Hash, Search, MapPin, Users } from 'lucide-react';

interface NextGame {
  id: string;
  title: string;
  date_time: string;
  location: string | null;
}

interface MembershipInfo {
  club_id: string;
  status: string;
}

export default function HomeWidgets() {
  const { profile, session } = useAuthStore();
  const { showToast } = useToast();
  const [nextGame, setNextGame] = useState<NextGame | null>(null);
  const [totalBooked, setTotalBooked] = useState(0);
  const [clubSearch, setClubSearch] = useState('');
  const [clubResults, setClubResults] = useState<Club[]>([]);
  const [searchingClubs, setSearchingClubs] = useState(false);
  const [memberships, setMemberships] = useState<MembershipInfo[]>([]);
  const [joiningClub, setJoiningClub] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    const userId = session.user.id;

    // Fetch next upcoming game
    supabase
      .from('bookings')
      .select('game:games(id, title, date_time, location)')
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .then(({ data }) => {
        if (!data) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const upcoming = data
          .map((b: any) => b.game)
          .filter((g: NextGame | null) => g && new Date(g.date_time) > new Date())
          .sort((a: NextGame, b: NextGame) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());
        if (upcoming.length > 0) setNextGame(upcoming[0]);
      });

    // Fetch total bookings count
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .neq('status', 'cancelled')
      .then(({ count }) => {
        setTotalBooked(count || 0);
      });

    // Fetch user's club memberships
    supabase
      .from('club_members')
      .select('club_id, status')
      .eq('user_id', userId)
      .then(({ data }) => {
        setMemberships(data || []);
      });
  }, [session]);

  useEffect(() => {
    if (!clubSearch.trim()) {
      setClubResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearchingClubs(true);
      const { data } = await supabase
        .from('clubs')
        .select('*')
        .or(`name.ilike.%${clubSearch}%,location.ilike.%${clubSearch}%`)
        .limit(5);
      setClubResults(data || []);
      setSearchingClubs(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [clubSearch]);

  const getMembershipStatus = (clubId: string) => {
    return memberships.find((m) => m.club_id === clubId)?.status || null;
  };

  const handleJoinClub = async (clubId: string) => {
    if (!session) return;
    setJoiningClub(clubId);
    try {
      const { error } = await supabase.from('club_members').insert({
        club_id: clubId,
        user_id: session.user.id,
        status: 'pending',
      });
      if (error) throw new Error(error.message);
      setMemberships([...memberships, { club_id: clubId, status: 'pending' }]);
      showToast('Join request sent!', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to join club';
      showToast(message, 'error');
    } finally {
      setJoiningClub(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Stat cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* DUPR Rating */}
        <Card className="p-4 text-center">
          <Trophy className="h-5 w-5 text-warning mx-auto mb-1.5" />
          <p className="text-2xl font-bold text-text-primary">
            {profile?.dupr_rating ? profile.dupr_rating.toFixed(2) : '--'}
          </p>
          <p className="text-xs text-text-tertiary mt-0.5">DUPR Rating</p>
        </Card>

        {/* Next Game */}
        <Card className="p-4 text-center">
          <CalendarClock className="h-5 w-5 text-primary mx-auto mb-1.5" />
          {nextGame ? (
            <Link href={`/dashboard/game/${nextGame.id}`} className="block hover:opacity-80">
              <p className="text-sm font-semibold text-text-primary truncate">{nextGame.title}</p>
              <p className="text-xs text-text-secondary mt-0.5">
                {format(new Date(nextGame.date_time), 'MMM d, h:mm a')}
              </p>
            </Link>
          ) : (
            <>
              <p className="text-sm font-semibold text-text-secondary">None</p>
              <p className="text-xs text-text-tertiary mt-0.5">Next Game</p>
            </>
          )}
        </Card>

        {/* Games Booked */}
        <Card className="p-4 text-center">
          <Hash className="h-5 w-5 text-success mx-auto mb-1.5" />
          <p className="text-2xl font-bold text-text-primary">{totalBooked}</p>
          <p className="text-xs text-text-tertiary mt-0.5">Games Booked</p>
        </Card>
      </div>

      {/* Find a Club */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-text-primary">Find a Club</h3>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input
            type="text"
            value={clubSearch}
            onChange={(e) => setClubSearch(e.target.value)}
            placeholder="Search by name or location..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
          />
        </div>
        {searchingClubs && (
          <div className="flex justify-center py-3">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
          </div>
        )}
        {clubResults.length > 0 && (
          <div className="mt-2 space-y-1">
            {clubResults.map((club) => {
              const status = getMembershipStatus(club.id);
              return (
                <div
                  key={club.id}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-background transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary truncate">{club.name}</p>
                    {club.location && (
                      <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{club.location}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    {status === 'approved' ? (
                      <Badge label="Member" color="#34C759" />
                    ) : status === 'pending' ? (
                      <Badge label="Pending" color="#FF9500" />
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleJoinClub(club.id)}
                        loading={joiningClub === club.id}
                      >
                        Join
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {clubSearch.trim() && !searchingClubs && clubResults.length === 0 && (
          <p className="text-xs text-text-tertiary text-center mt-3">No clubs found</p>
        )}
      </Card>
    </div>
  );
}
