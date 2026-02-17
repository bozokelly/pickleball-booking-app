'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format, isPast } from 'date-fns';
import { useClubStore } from '@/stores/clubStore';
import { supabase } from '@/lib/supabase';
import { Game } from '@/types/database';
import { Card, Button, Badge } from '@/components/ui';
import { Plus, MapPin, Users, Pencil, Clock, LayoutGrid, ChevronDown, ChevronUp, CalendarDays, MessageSquare, MoreHorizontal, Copy } from 'lucide-react';

export default function AdminPage() {
  const { myAdminClubs, fetchMyAdminClubs } = useClubStore();
  const [clubGames, setClubGames] = useState<Record<string, Game[]>>({});
  const [clubMemberCounts, setClubMemberCounts] = useState<Record<string, number>>({});
  const [expandedClubs, setExpandedClubs] = useState<Set<string>>(new Set());
  const [openMenuClubId, setOpenMenuClubId] = useState<string | null>(null);

  useEffect(() => {
    fetchMyAdminClubs();
  }, [fetchMyAdminClubs]);

  useEffect(() => {
    if (myAdminClubs.length === 0) return;
    const clubIds = myAdminClubs.map((c) => c.id);

    // Batch fetch all games and member counts in parallel (no N+1)
    Promise.all([
      supabase
        .from('games')
        .select('*')
        .in('club_id', clubIds)
        .order('date_time', { ascending: false }),
      supabase
        .from('club_members')
        .select('club_id')
        .in('club_id', clubIds)
        .eq('status', 'approved'),
    ]).then(([gamesResult, membersResult]) => {
      // Group games by club_id
      const gameMap: Record<string, Game[]> = {};
      for (const game of gamesResult.data || []) {
        if (!gameMap[game.club_id]) gameMap[game.club_id] = [];
        gameMap[game.club_id].push(game);
      }
      setClubGames(gameMap);

      // Count members by club_id
      const countMap: Record<string, number> = {};
      for (const m of membersResult.data || []) {
        countMap[m.club_id] = (countMap[m.club_id] || 0) + 1;
      }
      setClubMemberCounts(countMap);
    });
  }, [myAdminClubs]);

  const toggleClub = (clubId: string) => {
    setExpandedClubs((prev) => {
      const next = new Set(prev);
      if (next.has(clubId)) {
        next.delete(clubId);
      } else {
        next.add(clubId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Admin Panel</h1>
        <Link href="/dashboard/admin/create-club">
          <Button size="sm" icon={<Plus className="h-4 w-4" />}>
            Create Club
          </Button>
        </Link>
      </div>

      {myAdminClubs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-secondary">You don&apos;t manage any clubs yet</p>
          <Link href="/dashboard/admin/create-club" className="text-primary text-sm hover:underline mt-2 inline-block">
            Create your first club
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {myAdminClubs.map((club) => {
            const games = clubGames[club.id] || [];
            const memberCount = clubMemberCounts[club.id] ?? 0;
            const isExpanded = expandedClubs.has(club.id);
            const isMenuOpen = openMenuClubId === club.id;
            const upcomingGames = games
              .filter((g) => !isPast(new Date(g.date_time)) && g.status !== 'completed' && g.status !== 'cancelled')
              .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());
            const pastGames = games.filter((g) => isPast(new Date(g.date_time)) || g.status === 'completed' || g.status === 'cancelled');

            return (
              <div key={club.id}>
                <Card className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => toggleClub(club.id)}
                        className="flex-shrink-0 p-1 rounded-lg hover:bg-background transition-colors text-text-tertiary hover:text-text-primary"
                      >
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-text-primary truncate">{club.name}</h3>
                          <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-medium text-text-tertiary bg-background px-2 py-0.5 rounded-full">
                            <CalendarDays className="h-3 w-3" />
                            {games.length} {games.length === 1 ? 'game' : 'games'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                          {club.location && (
                            <p className="text-sm text-text-secondary flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" /> {club.location}
                            </p>
                          )}
                          <p className="text-sm text-text-secondary flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" /> {memberCount} {memberCount === 1 ? 'member' : 'members'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="relative flex-shrink-0">
                      <button
                        onClick={() => setOpenMenuClubId(isMenuOpen ? null : club.id)}
                        className="p-2 rounded-lg hover:bg-background transition-colors text-text-tertiary hover:text-text-primary"
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                      {isMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenuClubId(null)} />
                          <div className="absolute right-0 top-10 z-20 bg-surface border border-border rounded-xl shadow-lg py-1 min-w-[160px]">
                            <Link
                              href={`/dashboard/admin/edit-club/${club.id}`}
                              onClick={() => setOpenMenuClubId(null)}
                              className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-text-primary hover:bg-background transition-colors"
                            >
                              <Pencil className="h-4 w-4 text-text-tertiary" /> Edit Club
                            </Link>
                            <Link
                              href={`/dashboard/admin/club/${club.id}/members`}
                              onClick={() => setOpenMenuClubId(null)}
                              className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-text-primary hover:bg-background transition-colors"
                            >
                              <Users className="h-4 w-4 text-text-tertiary" /> Members
                            </Link>
                            <Link
                              href={`/dashboard/admin/club/${club.id}/messages`}
                              onClick={() => setOpenMenuClubId(null)}
                              className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-text-primary hover:bg-background transition-colors"
                            >
                              <MessageSquare className="h-4 w-4 text-text-tertiary" /> Messages
                            </Link>
                            <div className="border-t border-border my-1" />
                            <Link
                              href={`/dashboard/admin/create-game?clubId=${club.id}`}
                              onClick={() => setOpenMenuClubId(null)}
                              className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-primary font-medium hover:bg-background transition-colors"
                            >
                              <Plus className="h-4 w-4" /> New Game
                            </Link>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Collapsible games list */}
                {isExpanded && (
                  <div className="mt-2 ml-6 space-y-3">
                    {games.length === 0 ? (
                      <p className="text-sm text-text-tertiary pl-2 py-2">No games yet</p>
                    ) : (
                      <>
                        {/* Upcoming games */}
                        {upcomingGames.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider pl-1">Upcoming</p>
                            {upcomingGames.map((game) => (
                              <GameRow key={game.id} game={game} clubId={club.id} />
                            ))}
                          </div>
                        )}

                        {/* Past games */}
                        {pastGames.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider pl-1">Past</p>
                            {pastGames.map((game) => (
                              <GameRow key={game.id} game={game} clubId={club.id} muted />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function GameRow({ game, clubId, muted = false }: { game: Game; clubId: string; muted?: boolean }) {
  const dt = new Date(game.date_time);

  return (
    <Card className={`px-4 py-3 ${muted ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-3 gap-y-1">
          <h4 className="font-medium text-text-primary truncate">{game.title}</h4>
          <Badge
            label={game.status}
            color={game.status === 'upcoming' ? '#34C759' : game.status === 'cancelled' ? '#FF3B30' : '#8E8E93'}
          />
          <span className="text-sm text-text-secondary flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {format(dt, 'MMM d, yyyy h:mm a')}
          </span>
          {game.location && (
            <span className="text-sm text-text-secondary flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate max-w-[150px]">{game.location}</span>
            </span>
          )}
          <span className="text-sm text-text-secondary flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {game.max_spots} spots
          </span>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Link href={`/dashboard/admin/create-game?duplicate=${game.id}&clubId=${clubId}`}>
            <Button variant="outline" size="sm" icon={<Copy className="h-4 w-4" />} title="Duplicate game">
              Duplicate
            </Button>
          </Link>
          <Link href={`/dashboard/admin/schedule-game/${game.id}`}>
            <Button variant="outline" size="sm" icon={<LayoutGrid className="h-4 w-4" />}>
              Schedule
            </Button>
          </Link>
          <Link href={`/dashboard/admin/edit-game/${game.id}`}>
            <Button variant="outline" size="sm" icon={<Pencil className="h-4 w-4" />}>
              Edit
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
