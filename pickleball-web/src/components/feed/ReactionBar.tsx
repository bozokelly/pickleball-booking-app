'use client';

import { ReactionType } from '@/types/database';

const REACTION_EMOJIS: Record<ReactionType, string> = {
  like: '👍',
  love: '❤️',
  fire: '🔥',
  laugh: '😂',
};

interface ReactionBarProps {
  counts: Record<ReactionType, number>;
  userReaction: ReactionType | null;
  onToggle: (type: ReactionType) => void;
}

export default function ReactionBar({ counts, userReaction, onToggle }: ReactionBarProps) {
  const types: ReactionType[] = ['like', 'love', 'fire', 'laugh'];

  return (
    <div className="flex gap-1.5">
      {types.map((type) => {
        const count = counts[type] || 0;
        const active = userReaction === type;
        return (
          <button
            key={type}
            onClick={() => onToggle(type)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm transition-colors ${
              active
                ? 'bg-primary/15 ring-1 ring-primary/30'
                : 'bg-background hover:bg-background/80'
            }`}
          >
            <span>{REACTION_EMOJIS[type]}</span>
            {count > 0 && (
              <span className={`text-xs font-medium ${active ? 'text-primary' : 'text-text-secondary'}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
