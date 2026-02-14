'use client';

import { useEffect, useState, useMemo } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { GameCard } from '@/components/game/GameCard';
import { GameFilters } from '@/components/game/GameFilters';
import { SkillLevel, GameFormat } from '@/types/database';
import { Loader2 } from 'lucide-react';

export default function GamesPage() {
  const { games, loading, fetchUpcomingGames } = useGameStore();
  const [searchText, setSearchText] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<SkillLevel | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<GameFormat | null>(null);

  useEffect(() => {
    fetchUpcomingGames().catch(() => {});
  }, [fetchUpcomingGames]);

  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      if (searchText) {
        const search = searchText.toLowerCase();
        const matchesSearch =
          game.title.toLowerCase().includes(search) ||
          game.club?.name?.toLowerCase().includes(search) ||
          game.location?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }
      if (selectedSkill && game.skill_level !== selectedSkill) return false;
      if (selectedFormat && game.game_format !== selectedFormat) return false;
      return true;
    });
  }, [games, searchText, selectedSkill, selectedFormat]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Find a Game</h1>

      <GameFilters
        searchText={searchText}
        onSearchChange={setSearchText}
        selectedSkill={selectedSkill}
        onSkillChange={setSelectedSkill}
        selectedFormat={selectedFormat}
        onFormatChange={setSelectedFormat}
      />

      {loading && games.length === 0 ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-secondary">No games found</p>
          <p className="text-sm text-text-tertiary mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}
