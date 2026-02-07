import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Card, Badge } from '@/components/ui';
import { Game } from '@/types/database';
import {
  colors,
  typography,
  spacing,
  SKILL_LEVEL_COLORS,
  SKILL_LEVEL_LABELS,
  GAME_FORMAT_LABELS,
} from '@/constants/theme';

interface GameCardProps {
  game: Game;
  onPress: () => void;
}

export function GameCard({ game, onPress }: GameCardProps) {
  const dateTime = new Date(game.date_time);
  const spotsLeft = game.max_spots - (game.confirmed_count || 0);
  const isFull = spotsLeft <= 0;

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.dateBox}>
          <Text style={styles.dateMonth}>{format(dateTime, 'MMM')}</Text>
          <Text style={styles.dateDay}>{format(dateTime, 'd')}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.title} numberOfLines={1}>{game.title}</Text>
          <Text style={styles.clubName}>{game.club?.name}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.detailText}>
            {format(dateTime, 'h:mm a')} · {game.duration_minutes} min
          </Text>
        </View>

        {game.location && (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>{game.location}</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.detailText, isFull && styles.fullText]}>
            {isFull ? 'Full (waitlist available)' : `${spotsLeft} of ${game.max_spots} spots left`}
          </Text>
        </View>
      </View>

      <View style={styles.tags}>
        <Badge
          label={SKILL_LEVEL_LABELS[game.skill_level] || game.skill_level}
          color={SKILL_LEVEL_COLORS[game.skill_level] || colors.textSecondary}
        />
        <Badge
          label={GAME_FORMAT_LABELS[game.game_format] || game.game_format}
          color={colors.info}
        />
        {game.fee_amount > 0 && (
          <Badge label={`$${game.fee_amount}`} color={colors.warning} />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dateBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  dateMonth: {
    ...typography.caption2,
    color: colors.white,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dateDay: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    lineHeight: 20,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  clubName: {
    ...typography.subheadline,
    color: colors.textSecondary,
  },
  details: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailText: {
    ...typography.subheadline,
    color: colors.textSecondary,
  },
  fullText: {
    color: colors.warning,
    fontWeight: '500',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
