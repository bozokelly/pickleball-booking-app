'use client';

import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { SkillLevel, GameFormat } from '@/types/database';
import { SKILL_LEVEL_LABELS, SKILL_LEVEL_COLORS, GAME_FORMAT_LABELS } from '@/constants/theme';

interface GameFiltersProps {
  searchText: string;
  onSearchChange: (text: string) => void;
  selectedSkill: SkillLevel | null;
  onSkillChange: (skill: SkillLevel | null) => void;
  selectedFormat: GameFormat | null;
  onFormatChange: (format: GameFormat | null) => void;
}

const skillLevels: SkillLevel[] = ['all', 'beginner', 'intermediate', 'advanced', 'pro'];
const gameFormats: GameFormat[] = ['singles', 'doubles', 'mixed_doubles', 'round_robin', 'open_play'];

export function GameFilters({
  searchText,
  onSearchChange,
  selectedSkill,
  onSkillChange,
  selectedFormat,
  onFormatChange,
}: GameFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const hasFilters = selectedSkill !== null || selectedFormat !== null;

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search games, clubs, locations..."
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          {searchText && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${hasFilters ? 'bg-primary/10 border-primary text-primary' : 'bg-surface border-border text-text-secondary hover:bg-background'}`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </button>
      </div>

      {/* Filter chips */}
      {showFilters && (
        <div className="space-y-3 bg-surface rounded-xl border border-border p-4">
          <div>
            <p className="text-xs font-medium text-text-secondary mb-2">Skill Level</p>
            <div className="flex flex-wrap gap-2">
              {skillLevels.map((skill) => (
                <button
                  key={skill}
                  onClick={() => onSkillChange(selectedSkill === skill ? null : skill)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${selectedSkill === skill ? 'text-white' : 'bg-background text-text-secondary hover:bg-border'}`}
                  style={selectedSkill === skill ? { backgroundColor: SKILL_LEVEL_COLORS[skill] } : undefined}
                >
                  {SKILL_LEVEL_LABELS[skill]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary mb-2">Format</p>
            <div className="flex flex-wrap gap-2">
              {gameFormats.map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => onFormatChange(selectedFormat === fmt ? null : fmt)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${selectedFormat === fmt ? 'bg-info text-white' : 'bg-background text-text-secondary hover:bg-border'}`}
                >
                  {GAME_FORMAT_LABELS[fmt]}
                </button>
              ))}
            </div>
          </div>
          {hasFilters && (
            <button
              onClick={() => { onSkillChange(null); onFormatChange(null); }}
              className="text-xs text-error hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
