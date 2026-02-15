'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format, isPast } from 'date-fns';
import { useClubStore } from '@/stores/clubStore';
import { supabase } from '@/lib/supabase';
import { Game } from '@/types/database';
import { Card, Button, Badge } from '@/components/ui';
import { Plus, MapPin, Users, Pencil, Clock, LayoutGrid, ChevronDown, ChevronUp, CalendarDays } from 'lucide-react';

export default function AdminPage() {
  const { myAdminClubs, fetchMyAdminClubs } = useClubStore();
  const [clubGames, setClubGames] = useState<Record<string, Game[]>>({});
  const [clubMemberCounts, setClubMemberCounts] = useState<Record<string, number>>({});
  const [expandedClubs, setExpandedClubs] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchMyAdminClubs();
  }, [fetchMyAdminClubs]);

  useEffect(() => {
    async function loadGames() {
      for (const club of myAdminClubs) {
        const { data } = await supabase
          .from('games')
          .select('*')
          .eq('club_id', club.id)
          .order('date_time', { ascending: false });
        if (data) {
          setClubGames((prev) => ({ ...prev, [club.id]: data }));
        }
      }
    }
    async function loadMemberCounts() {
      for (const club of myAdminClubs) {
        const { count } = await supabase
          .from('club_members')
          .select('*', { count: 'exact', head: true })
          .eq('club_id', club.id)
          .eq('status', 'approved');
        setClubMemberCounts((prev) => ({ ...prev, [club.id]: count ?? 0 }));
      }
    }
    if (myAdminClubs.length > 0) {
      loadGames();
      loadMemberCounts();
    }
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
            const upcomingGames = games.filter((g) => !isPast(new Date(g.date_time)) && g.status !== 'completed' && g.status !== 'cancelled');
            const pastGames = games.filter((g) => isPast(new Date(g.date_time)) || g.status === 'completed' || g.status === 'cancelled');

            return (
              <div key={club.id}>
                <Card className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                    <div className="flex flex-wrap gap-2 pl-9 sm:pl-0">
                      <Link href={`/dashboard/admin/edit-club/${club.id}`}>
                        <Button variant="outline" size="sm" icon={<Pencil className="h-4 w-4" />}>
                          Edit
                        </Button>
                      </Link>
                      <Link href={`/dashboard/admin/club/${club.id}/members`}>
                        <Button variant="outline" size="sm" icon={<Users className="h-4 w-4" />}>
                          Members
                        </Button>
                      </Link>
                      <Link href={`/dashboard/admin/create-game?clubId=${club.id}`}>
                        <Button variant="secondary" size="sm" icon={<Plus className="h-4 w-4" />}>
                          New Game
                        </Button>
                      </Link>
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
                              <GameRow key={game.id} game={game} />
                            ))}
                          </div>
                        )}

                        {/* Past games */}
                        {pastGames.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider pl-1">Past</p>
                            {pastGames.map((game) => (
                              <GameRow key={game.id} game={game} muted />
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

function GameRow({ game, muted = false }: { game: Game; muted?: boolean }) {
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
