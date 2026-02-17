'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useAuthStore } from '@/stores/authStore';
import { useMembershipStore } from '@/stores/membershipStore';
import { useClubStore } from '@/stores/clubStore';
import { supabase } from '@/lib/supabase';
import { Card, Button } from '@/components/ui';
import { Club, Game } from '@/types/database';
import { Trophy, CheckCircle, Hash, MapPin, Clock, Users } from 'lucide-react';

export default function HomeWidgets({ onClubsLoaded }: { onClubsLoaded?: (clubs: Club[]) => void }) {
  const { profile, session } = useAuthStore();
  const { myMemberships } = useMembershipStore();
  const { myAdminClubs } = useClubStore();
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [totalBooked, setTotalBooked] = useState(0);
  const [upcomingGames, setUpcomingGames] = useState<(Game & { club?: Club; confirmed_count?: number })[]>([]);
  const [myClubs, setMyClubs] = useState<Club[]>([]);

  // Fetch booking stats in parallel
  useEffect(() => {
    if (!session) return;
    const userId = session.user.id;
    const now = new Date().toISOString();

    Promise.all([
      supabase
        .from('bookings')
        .select('id, game:games!inner(date_time)')
        .eq('user_id', userId)
        .eq('status', 'confirmed')
        .lt('game.date_time', now),
      supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .neq('status', 'cancelled'),
    ]).then(([gamesResult, bookedResult]) => {
      setGamesPlayed(gamesResult.data?.length || 0);
      setTotalBooked(bookedResult.count || 0);
    });
  }, [session]);

  // Fetch upcoming games + clubs in a single effect with parallel queries
  useEffect(() => {
    const memberIds = myMemberships
      .filter((m) => m.status === 'approved')
      .map((m) => m.club_id);
    const adminIds = myAdminClubs.map((c) => c.id);
    const allIds = [...new Set([...memberIds, ...adminIds])];

    if (allIds.length === 0) {
      setUpcomingGames([]);
      setMyClubs([]);
      onClubsLoaded?.([]);
      return;
    }

    const now = new Date().toISOString();

    // Fetch games and clubs in parallel
    Promise.all([
      supabase
        .from('games')
        .select('*, club:clubs(*)')
        .in('club_id', allIds)
        .eq('status', 'upcoming')
        .gte('date_time', now)
        .or(`visible_from.is.null,visible_from.lte.${now}`)
        .order('date_time', { ascending: true })
        .limit(5),
      supabase
        .from('clubs')
        .select('*')
        .in('id', allIds)
        .order('name'),
    ]).then(async ([gamesResult, clubsResult]) => {
      // Set clubs
      const clubs = clubsResult.data || [];
      setMyClubs(clubs);
      onClubsLoaded?.(clubs);

      // Set games with booking counts
      const gameData = gamesResult.data;
      if (!gameData || gameData.length === 0) {
        setUpcomingGames([]);
        return;
      }

      const gameIds = gameData.map((g) => g.id);
      const { data: countData } = await supabase
        .from('bookings')
        .select('game_id')
        .in('game_id', gameIds)
        .eq('status', 'confirmed');
      const countMap: Record<string, number> = {};
      (countData || []).forEach((b) => {
        countMap[b.game_id] = (countMap[b.game_id] || 0) + 1;
      });

      setUpcomingGames(gameData.map((g) => ({ ...g, confirmed_count: countMap[g.id] || 0 })));
    });
  }, [myMemberships, myAdminClubs]); // eslint-disable-line react-hooks/exhaustive-deps

  const greeting = getGreeting();

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          {greeting}, {profile?.full_name?.split(' ')[0] || 'there'}
        </h1>
        <p className="text-sm text-text-tertiary mt-0.5">Here&apos;s what&apos;s happening across your clubs</p>
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <Trophy className="h-5 w-5 text-warning mx-auto mb-1.5" />
          <p className="text-2xl font-bold text-text-primary">
            {profile?.dupr_rating ? profile.dupr_rating.toFixed(3) : '--'}
          </p>
          <p className="text-xs text-text-tertiary mt-0.5">DUPR Rating</p>
        </Card>

        <Card className="p-4 text-center">
          <CheckCircle className="h-5 w-5 text-primary mx-auto mb-1.5" />
          <p className="text-2xl font-bold text-text-primary">{gamesPlayed}</p>
          <p className="text-xs text-text-tertiary mt-0.5">Games Played</p>
        </Card>

        <Card className="p-4 text-center">
          <Hash className="h-5 w-5 text-success mx-auto mb-1.5" />
          <p className="text-2xl font-bold text-text-primary">{totalBooked}</p>
          <p className="text-xs text-text-tertiary mt-0.5">Games Booked</p>
        </Card>
      </div>

      {/* Upcoming Games from My Clubs */}
      {upcomingGames.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-3">Upcoming Games</h2>
          <div className="space-y-2">
            {upcomingGames.map((game) => {
              const isFull = (game.confirmed_count || 0) >= game.max_spots;
              return (
                <Card key={game.id} className="p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <Link href={`/dashboard/game/${game.id}`}>
                        <p className="text-base font-semibold text-text-primary truncate hover:text-primary transition-colors">{game.title}</p>
                      </Link>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                        {game.club && (
                          <span className="text-xs text-primary font-medium">{(game.club as Club).name}</span>
                        )}
                        <span className="text-xs text-text-secondary flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(game.date_time), 'EEE, MMM d · h:mm a')}
                        </span>
                        {game.location && (
                          <span className="text-xs text-text-secondary flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate max-w-[150px]">{game.location}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <Link href={`/dashboard/game/${game.id}`} className="flex-shrink-0">
                      <Button size="sm" variant={isFull ? 'outline' : 'primary'}>
                        {isFull ? 'Waitlist' : 'Book'}
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state if no clubs */}
      {myClubs.length === 0 && upcomingGames.length === 0 && (
        <Card className="p-6 text-center">
          <Users className="h-8 w-8 text-text-tertiary mx-auto mb-2" />
          <p className="text-sm text-text-secondary">You haven&apos;t joined any clubs yet</p>
          <div className="flex flex-col items-center gap-1 mt-2">
            <Link href="/dashboard/games" className="text-sm text-primary hover:underline">
              Find a club to join
            </Link>
            <span className="text-xs text-text-tertiary">or</span>
            <Link href="/dashboard/create-club" className="text-sm text-primary hover:underline">
              Create your own club
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
