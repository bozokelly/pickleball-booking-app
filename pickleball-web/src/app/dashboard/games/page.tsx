'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useGameStore } from '@/stores/gameStore';
import { useClubStore } from '@/stores/clubStore';
import { ClubMap } from '@/components/club/ClubMap';
import { Card, Badge } from '@/components/ui';
import { Club, Game } from '@/types/database';
import { SKILL_LEVEL_COLORS, SKILL_LEVEL_LABELS, GAME_FORMAT_LABELS } from '@/constants/theme';
import { Loader2, MapPin, Users, ChevronDown, ChevronUp, Clock, Search, X } from 'lucide-react';

export default function GamesPage() {
  const { games, loading: gamesLoading, fetchUpcomingGames } = useGameStore();
  const { clubs, loading: clubsLoading, fetchClubs } = useClubStore();
  const [searchText, setSearchText] = useState('');
  const [expandedClubs, setExpandedClubs] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchUpcomingGames().catch(() => {});
    fetchClubs().catch(() => {});
  }, [fetchUpcomingGames, fetchClubs]);

  // Group games by club
  const gamesByClub = useMemo(() => {
    const map: Record<string, Game[]> = {};
    for (const game of games) {
      if (!game.club_id) continue;
      if (!map[game.club_id]) map[game.club_id] = [];
      map[game.club_id].push(game);
    }
    // Sort each club's games by date ascending
    for (const clubId in map) {
      map[clubId].sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());
    }
    return map;
  }, [games]);

  // Filter clubs by search text — show all clubs (including those with no games)
  const filteredClubs = useMemo(() => {
    let result = [...clubs];
    if (searchText) {
      const search = searchText.toLowerCase();
      result = result.filter((club) =>
        club.name.toLowerCase().includes(search) ||
        club.location?.toLowerCase().includes(search)
      );
    }
    // Sort: clubs with games first, then alphabetical
    result.sort((a, b) => {
      const aHasGames = (gamesByClub[a.id]?.length || 0) > 0 ? 0 : 1;
      const bHasGames = (gamesByClub[b.id]?.length || 0) > 0 ? 0 : 1;
      if (aHasGames !== bHasGames) return aHasGames - bHasGames;
      return a.name.localeCompare(b.name);
    });
    return result;
  }, [clubs, gamesByClub, searchText]);

  const toggleClub = (clubId: string) => {
    setExpandedClubs((prev) => {
      const next = new Set(prev);
      if (next.has(clubId)) next.delete(clubId);
      else next.add(clubId);
      return next;
    });
  };

  const loading = gamesLoading || clubsLoading;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Find a Game</h1>

      <ClubMap clubs={filteredClubs} />

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
        <input
          type="text"
          placeholder="Search clubs by name or location..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        {searchText && (
          <button
            onClick={() => setSearchText('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {loading && clubs.length === 0 ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredClubs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-secondary">No clubs found</p>
          <p className="text-sm text-text-tertiary mt-1">Try adjusting your search</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredClubs.map((club) => {
            const clubGames = gamesByClub[club.id] || [];
            const isExpanded = expandedClubs.has(club.id);
            const previewGames = clubGames.slice(0, 3);

            return (
              <div key={club.id}>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleClub(club.id)}
                      className="flex-shrink-0 p-1 rounded-lg hover:bg-background transition-colors text-text-tertiary hover:text-text-primary"
                    >
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-text-primary truncate">{club.name}</h3>
                        <Badge
                          label={club.members_only ? 'Members Only' : 'Open'}
                          color={club.members_only ? '#FF9500' : '#34C759'}
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                        {club.location && (
                          <p className="text-sm text-text-secondary flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {club.location}
                          </p>
                        )}
                        <p className="text-sm text-text-secondary flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" /> {clubGames.length > 0 ? `${clubGames.length} upcoming ${clubGames.length === 1 ? 'game' : 'games'}` : 'No upcoming games'}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/club/${club.id}`}
                      className="flex-shrink-0 text-sm font-medium text-primary hover:underline"
                    >
                      View Club
                    </Link>
                  </div>
                </Card>

                {/* Expandable upcoming games preview */}
                {isExpanded && (
                  <div className="mt-2 ml-6 space-y-2">
                    {previewGames.map((game) => (
                      <CompactGameRow key={game.id} game={game} />
                    ))}
                    {clubGames.length > 3 && (
                      <Link
                        href={`/dashboard/club/${club.id}`}
                        className="block text-center text-sm text-primary hover:underline py-1"
                      >
                        +{clubGames.length - 3} more — View Club
                      </Link>
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

function CompactGameRow({ game }: { game: Game }) {
  const dt = new Date(game.date_time);
  const spotsLeft = game.max_spots - (game.confirmed_count || 0);

  return (
    <Link href={`/dashboard/game/${game.id}`}>
      <Card className="px-4 py-3 hover:border-primary/30 transition-colors cursor-pointer">
        <div className="flex items-center gap-3">
          {/* Date box */}
          <div className="flex flex-col items-center justify-center bg-primary/10 rounded-lg px-2 py-1 min-w-[48px]">
            <span className="text-[10px] font-semibold text-primary uppercase">{format(dt, 'MMM')}</span>
            <span className="text-lg font-bold text-primary leading-tight">{format(dt, 'd')}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-text-primary truncate">{game.title}</h4>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
              <span className="text-xs text-text-secondary flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(dt, 'h:mm a')}
              </span>
              {game.location && (
                <span className="text-xs text-text-secondary flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate max-w-[120px]">{game.location}</span>
                </span>
              )}
              <span className="text-xs text-text-secondary">
                {spotsLeft <= 0 ? 'Full' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''}`}
              </span>
            </div>
            <div className="flex gap-1.5 mt-1">
              <Badge label={SKILL_LEVEL_LABELS[game.skill_level]} color={SKILL_LEVEL_COLORS[game.skill_level]} />
              <Badge label={GAME_FORMAT_LABELS[game.game_format]} color="#5856D6" />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
