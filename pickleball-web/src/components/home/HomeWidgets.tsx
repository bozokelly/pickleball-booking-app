'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { useAuthStore } from '@/stores/authStore';
import { useMembershipStore } from '@/stores/membershipStore';
import { useClubStore } from '@/stores/clubStore';
import { supabase } from '@/lib/supabase';
import { Club, Game } from '@/types/database';
import { Clock, MapPin, ChevronRight } from 'lucide-react';
import { CLUB_AVATAR_COLORS } from '@/constants/theme';

export default function HomeWidgets({ onClubsLoaded }: { onClubsLoaded?: (clubs: Club[]) => void }) {
  const { profile, session } = useAuthStore();
  const { myMemberships } = useMembershipStore();
  const { myAdminClubs } = useClubStore();
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [totalBooked, setTotalBooked] = useState(0);
  const [upcomingGames, setUpcomingGames] = useState<(Game & { club?: Club; confirmed_count?: number })[]>([]);
  const [myClubs, setMyClubs] = useState<Club[]>([]);

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

  useEffect(() => {
    let isCancelled = false;

    async function loadUpcomingGamesAndClubs() {
      const memberIds = myMemberships
        .filter((m) => m.status === 'approved')
        .map((m) => m.club_id);
      const adminIds = myAdminClubs.map((c) => c.id);
      const allIds = [...new Set([...memberIds, ...adminIds])];

      if (allIds.length === 0) {
        if (!isCancelled) {
          setUpcomingGames([]);
          setMyClubs([]);
          onClubsLoaded?.([]);
        }
        return;
      }

      const now = new Date().toISOString();

      const [gamesResult, clubsResult] = await Promise.all([
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
      ]);

      const clubs = clubsResult.data || [];
      if (!isCancelled) {
        setMyClubs(clubs);
        onClubsLoaded?.(clubs);
      }

      const gameData = gamesResult.data;
      if (!gameData || gameData.length === 0) {
        if (!isCancelled) setUpcomingGames([]);
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

      if (!isCancelled) {
        setUpcomingGames(gameData.map((g) => ({ ...g, confirmed_count: countMap[g.id] || 0 })));
      }
    }

    loadUpcomingGamesAndClubs().catch(() => {
      if (!isCancelled) {
        setUpcomingGames([]);
        setMyClubs([]);
        onClubsLoaded?.([]);
      }
    });

    return () => { isCancelled = true; };
  }, [myMemberships, myAdminClubs]); // eslint-disable-line react-hooks/exhaustive-deps

  const greeting = getGreeting();
  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-bold text-[#1C1C1E] tracking-tight">
          {greeting}, {firstName}
        </h1>
        <p className="text-[#8E8E93] mt-1">Here&apos;s what&apos;s happening across your clubs</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 text-center">
          <p className="text-2xl font-bold text-[#1C1C1E]">
            {profile?.dupr_rating ? profile.dupr_rating.toFixed(2) : '--'}
          </p>
          <p className="text-xs text-[#8E8E93] mt-0.5 font-medium">DUPR</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 text-center">
          <p className="text-2xl font-bold text-[#1C1C1E]">{gamesPlayed}</p>
          <p className="text-xs text-[#8E8E93] mt-0.5 font-medium">Played</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 text-center">
          <p className="text-2xl font-bold text-[#1C1C1E]">{totalBooked}</p>
          <p className="text-xs text-[#8E8E93] mt-0.5 font-medium">Booked</p>
        </div>
      </div>

      {/* Your Clubs — iOS-style club cards */}
      {myClubs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-[#1C1C1E]">Your Clubs</h2>
            <Link href="/dashboard/games" className="text-sm text-[#8E8E93] font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {myClubs.map((club) => {
              const isAdmin = myAdminClubs.some((c) => c.id === club.id);
              const initials = getClubInitials(club.name);
              const logoColor = getClubColor(club.name);
              return (
                <Link key={club.id} href={`/dashboard/club/${club.id}`}>
                  <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] p-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.10)] hover:-translate-y-px transition-all duration-150">
                    <div className="flex items-center gap-4">
                      {/* Club logo — rounded square, iOS app icon style */}
                      {club.image_url ? (
                        <Image
                          src={club.image_url}
                          alt={club.name}
                          width={56}
                          height={56}
                          className="w-14 h-14 rounded-2xl object-cover flex-shrink-0"
                        />
                      ) : (
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-bold text-lg"
                          style={{ backgroundColor: logoColor }}
                        >
                          {initials}
                        </div>
                      )}

                      {/* Club info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#1C1C1E] truncate">{club.name}</p>
                        {club.location && (
                          <p className="text-sm text-[#8E8E93] flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{club.location}</span>
                          </p>
                        )}
                      </div>

                      {/* Role badge + chevron */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="px-3 py-1.5 bg-[#1C1C1E] text-white text-xs font-semibold rounded-full">
                          {isAdmin ? 'Admin' : 'Member'}
                        </span>
                        <ChevronRight className="h-4 w-4 text-[#C6C6C8]" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Games */}
      {upcomingGames.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-[#1C1C1E]">Upcoming Games</h2>
          </div>
          <div className="space-y-2">
            {upcomingGames.map((game) => {
              const isFull = (game.confirmed_count || 0) >= game.max_spots;
              const spotsLeft = game.max_spots - (game.confirmed_count || 0);
              const dateTime = new Date(game.date_time);
              return (
                <Link key={game.id} href={`/dashboard/game/${game.id}`}>
                  <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.10)] hover:-translate-y-px transition-all duration-150">
                    <div className="flex items-center gap-3">
                      {/* Date badge */}
                      <div className="flex flex-col items-center bg-[#1C1C1E] rounded-xl px-3 py-2 min-w-[48px] flex-shrink-0">
                        <span className="text-[9px] font-semibold text-white/60 uppercase tracking-wide">{format(dateTime, 'MMM')}</span>
                        <span className="text-xl font-bold text-white leading-tight">{format(dateTime, 'd')}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#1C1C1E] truncate">{game.title}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                          {game.club && (
                            <span className="text-xs text-[#8E8E93] font-medium">{(game.club as Club).name}</span>
                          )}
                          <span className="text-xs text-[#8E8E93] flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(dateTime, 'h:mm a')}
                          </span>
                          {game.location && (
                            <span className="text-xs text-[#8E8E93] flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate max-w-[120px]">{game.location}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex-shrink-0 flex flex-col items-end gap-1">
                        <span className={`text-xs font-semibold ${isFull ? 'text-[#FF3B30]' : 'text-[#34C759]'}`}>
                          {isFull ? 'Full' : `${spotsLeft} left`}
                        </span>
                        {game.fee_amount > 0 && (
                          <span className="text-xs text-[#1C1C1E] font-medium">${game.fee_amount.toFixed(2)}</span>
                        )}
                        <ChevronRight className="h-4 w-4 text-[#C6C6C8]" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {myClubs.length === 0 && upcomingGames.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#F2F2F7] flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-8 w-8 text-[#AEAEB2]" />
          </div>
          <p className="font-bold text-[#1C1C1E] text-lg mb-1">No clubs yet</p>
          <p className="text-sm text-[#8E8E93] mb-5">Join a club to see upcoming games and connect with local players.</p>
          <div className="flex flex-col gap-2 items-center">
            <Link
              href="/dashboard/games"
              className="px-6 py-3 bg-[#1C1C1E] text-white font-semibold rounded-2xl text-sm w-full max-w-xs text-center"
            >
              Find a Club
            </Link>
            <Link
              href="/dashboard/create-club"
              className="px-6 py-3 bg-white text-[#1C1C1E] font-semibold rounded-2xl text-sm w-full max-w-xs text-center border border-[#E5E5EA]"
            >
              Create a Club
            </Link>
          </div>
        </div>
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

function getClubInitials(name: string): string {
  const words = name.replace(/[^a-zA-Z\s]/g, '').split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return words.slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function getClubColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return CLUB_AVATAR_COLORS[Math.abs(hash) % CLUB_AVATAR_COLORS.length];
}
