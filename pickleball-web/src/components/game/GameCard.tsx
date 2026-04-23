'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { MapPin, Clock, Users, DollarSign } from 'lucide-react';
import { Game } from '@/types/database';
import { Badge } from '@/components/ui';
import { SKILL_LEVEL_COLORS, SKILL_LEVEL_LABELS, GAME_FORMAT_LABELS } from '@/constants/theme';

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  const dateTime = new Date(game.date_time);
  const spotsLeft = game.max_spots - (game.confirmed_count || 0);
  const isFull = spotsLeft <= 0;

  return (
    <Link href={`/dashboard/game/${game.id}`}>
      <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] p-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.10),0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-px transition-all duration-150">
        <div className="flex gap-4">
          {/* Date box — dark iOS-style */}
          <div className="flex flex-col items-center justify-center bg-[#1C1C1E] rounded-2xl px-3 py-2 min-w-[56px]">
            <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wide">
              {format(dateTime, 'MMM')}
            </span>
            <span className="text-2xl font-bold text-white leading-tight">
              {format(dateTime, 'd')}
            </span>
            <span className="text-[10px] font-medium text-white/60 uppercase">
              {format(dateTime, 'EEE')}
            </span>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[#1C1C1E] truncate">{game.title}</h3>
            {game.club && (
              <p className="text-sm text-[#8E8E93] truncate">{game.club.name}</p>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-[#8E8E93]">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                {format(dateTime, 'h:mm a')}
                <span className="text-[#AEAEB2]">· {game.duration_minutes}min</span>
              </span>
              {game.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate max-w-[150px]">{game.location}</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 flex-shrink-0" />
                {isFull ? <span className="text-[#FF3B30] font-medium">Full</span> : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
              </span>
              {game.fee_amount > 0 && (
                <span className="flex items-center gap-1 font-medium text-[#1C1C1E]">
                  <DollarSign className="h-3.5 w-3.5 flex-shrink-0" />
                  {game.fee_amount.toFixed(2)}
                </span>
              )}
            </div>

            <div className="flex gap-2 mt-2.5">
              <Badge
                label={SKILL_LEVEL_LABELS[game.skill_level] || game.skill_level}
                color={SKILL_LEVEL_COLORS[game.skill_level]}
              />
              <Badge
                label={GAME_FORMAT_LABELS[game.game_format] || game.game_format}
                color="#5856D6"
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
