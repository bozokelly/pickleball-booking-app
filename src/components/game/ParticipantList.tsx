import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge } from '@/components/ui';
import { Booking } from '@/types/database';
import { colors, typography, spacing } from '@/constants/theme';

interface ParticipantListProps {
  bookings: Booking[];
  maxSpots: number;
}

export function ParticipantList({ bookings, maxSpots }: ParticipantListProps) {
  const confirmed = bookings.filter((b) => b.status === 'confirmed');
  const waitlisted = bookings
    .filter((b) => b.status === 'waitlisted')
    .sort((a, b) => (a.waitlist_position || 0) - (b.waitlist_position || 0));

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Players</Text>
        <Text style={styles.count}>
          {confirmed.length} / {maxSpots}
        </Text>
      </View>

      {/* Confirmed Players */}
      {confirmed.length === 0 ? (
        <Text style={styles.emptyText}>No players yet. Be the first to join!</Text>
      ) : (
        confirmed.map((booking) => (
          <ParticipantRow key={booking.id} booking={booking} />
        ))
      )}

      {/* Empty Spots */}
      {Array.from({ length: maxSpots - confirmed.length }).map((_, i) => (
        <View key={`empty-${i}`} style={styles.row}>
          <View style={styles.emptyAvatar}>
            <Ionicons name="person-add-outline" size={16} color={colors.textTertiary} />
          </View>
          <Text style={styles.emptySpotText}>Open spot</Text>
        </View>
      ))}

      {/* Waitlist */}
      {waitlisted.length > 0 && (
        <>
          <View style={styles.divider} />
          <Text style={styles.waitlistTitle}>Waitlist ({waitlisted.length})</Text>
          {waitlisted.map((booking) => (
            <ParticipantRow
              key={booking.id}
              booking={booking}
              showPosition
            />
          ))}
        </>
      )}
    </Card>
  );
}

function ParticipantRow({
  booking,
  showPosition,
}: {
  booking: Booking;
  showPosition?: boolean;
}) {
  const profile = booking.profile;

  return (
    <View style={styles.row}>
      {showPosition && (
        <Text style={styles.position}>#{booking.waitlist_position}</Text>
      )}
      {profile?.avatar_url ? (
        <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitial}>
            {profile?.full_name?.[0]?.toUpperCase() || '?'}
          </Text>
        </View>
      )}
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{profile?.full_name || 'Unknown Player'}</Text>
        {profile?.dupr_rating && (
          <Text style={styles.playerRating}>DUPR {profile.dupr_rating.toFixed(2)}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: { ...typography.headline, color: colors.textPrimary },
  count: { ...typography.subheadline, color: colors.textSecondary, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { ...typography.footnote, fontWeight: '600', color: colors.primary },
  emptyAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptySpotText: { ...typography.subheadline, color: colors.textTertiary },
  playerInfo: { flex: 1 },
  playerName: { ...typography.subheadline, fontWeight: '500', color: colors.textPrimary },
  playerRating: { ...typography.caption1, color: colors.textSecondary },
  position: {
    ...typography.caption1,
    fontWeight: '600',
    color: colors.warning,
    width: 24,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  waitlistTitle: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.warning,
    marginBottom: spacing.xs,
  },
  emptyText: { ...typography.subheadline, color: colors.textTertiary },
});
