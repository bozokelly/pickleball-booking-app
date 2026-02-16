'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { MapPin, Clock, Users, DollarSign } from 'lucide-react';
import { Game } from '@/types/database';
import { Badge, Card } from '@/components/ui';
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
      <Card className="hover:shadow-md transition-shadow">
        <div className="flex gap-4">
          {/* Date box */}
          <div className="flex flex-col items-center justify-center bg-primary/10 rounded-xl px-3 py-2 min-w-[60px]">
            <span className="text-xs font-semibold text-primary uppercase">
              {format(dateTime, 'MMM')}
            </span>
            <span className="text-2xl font-bold text-primary">
              {format(dateTime, 'd')}
            </span>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-text-primary truncate">{game.title}</h3>
            {game.club && (
              <p className="text-sm text-text-secondary truncate">{game.club.name}</p>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-text-secondary">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {format(dateTime, 'h:mm a')} ({game.duration_minutes}min)
              </span>
              {game.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[150px]">{game.location}</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {isFull ? 'Full' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
              </span>
              {game.fee_amount > 0 && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  {game.fee_amount.toFixed(2)}
                </span>
              )}
            </div>

            <div className="flex gap-2 mt-2">
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
      </Card>
    </Link>
  );
}
