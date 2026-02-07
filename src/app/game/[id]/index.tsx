import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Button, Card, Badge } from '@/components/ui';
import { ParticipantList } from '@/components/game/ParticipantList';
import { useGameStore } from '@/stores/gameStore';
import { addGameToCalendar } from '@/utils/calendar';
import { processBookingPayment } from '@/utils/payments';
import { scheduleGameReminder, cancelGameReminder } from '@/utils/reminders';
import { supabase } from '@/lib/supabase';
import { Game, Booking } from '@/types/database';
import {
  colors,
  typography,
  spacing,
  SKILL_LEVEL_COLORS,
  SKILL_LEVEL_LABELS,
  GAME_FORMAT_LABELS,
} from '@/constants/theme';

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { fetchGameById, bookGame, cancelBooking } = useGameStore();
  const [game, setGame] = useState<Game | null>(null);
  const [participants, setParticipants] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadGame = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await fetchGameById(id);
      setGame(data);

      // Fetch participants with profiles
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*, profile:profiles(full_name, avatar_url, dupr_rating)')
        .eq('game_id', id)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: true });

      setParticipants(bookings || []);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGame();
  }, [id]);

  const handleBook = async () => {
    if (!game) return;
    setActionLoading(true);
    try {
      const booking = await bookGame(game.id);

      // Handle payment if game has a fee and user got confirmed
      if (game.fee_amount > 0 && booking.status === 'confirmed') {
        const paymentResult = await processBookingPayment(booking.id);
        if (!paymentResult.success) {
          // Payment cancelled — cancel the booking
          await cancelBooking(booking.id);
          Alert.alert('Booking Cancelled', 'Payment was not completed.');
          await loadGame();
          return;
        }
      }

      // Schedule reminder for confirmed bookings
      if (booking.status === 'confirmed') {
        await scheduleGameReminder(booking.id, game);
      }

      await loadGame();
      const msg =
        booking.status === 'waitlisted'
          ? 'You have been added to the waitlist. We\'ll notify you if a spot opens up.'
          : 'You\'re confirmed for this game!';
      Alert.alert(booking.status === 'waitlisted' ? 'Waitlisted' : 'Booked!', msg);
    } catch (error: any) {
      Alert.alert('Booking Failed', error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!game?.user_booking) return;
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel?', [
      { text: 'Keep Booking', style: 'cancel' },
      {
        text: 'Cancel Booking',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          try {
            await cancelGameReminder(game.user_booking!.id);
            await cancelBooking(game.user_booking!.id);
            await loadGame();
            Alert.alert('Cancelled', 'Your booking has been cancelled.');
          } catch (error: any) {
            Alert.alert('Error', error.message);
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleAddToCalendar = async () => {
    if (!game) return;
    const success = await addGameToCalendar(game);
    if (success) {
      Alert.alert('Added', 'Event added to your calendar.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!game) {
    return (
      <View style={styles.loader}>
        <Text style={styles.errorText}>Game not found</Text>
      </View>
    );
  }

  const dateTime = new Date(game.date_time);
  const spotsLeft = game.max_spots - (game.confirmed_count || 0);
  const isFull = spotsLeft <= 0;
  const userBooking = game.user_booking;
  const isBooked = userBooking && userBooking.status !== 'cancelled';

  return (
    <>
      <Stack.Screen options={{ title: game.title }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{game.title}</Text>
          <Text style={styles.clubName}>{game.club?.name}</Text>
        </View>

        {/* Tags */}
        <View style={styles.tags}>
          <Badge
            label={SKILL_LEVEL_LABELS[game.skill_level] || game.skill_level}
            color={SKILL_LEVEL_COLORS[game.skill_level]}
          />
          <Badge
            label={GAME_FORMAT_LABELS[game.game_format] || game.game_format}
            color={colors.info}
          />
          {game.fee_amount > 0 && (
            <Badge label={`$${game.fee_amount} ${game.fee_currency}`} color={colors.warning} />
          )}
        </View>

        {/* Details Card */}
        <Card style={styles.detailsCard}>
          <DetailRow icon="calendar-outline" label="Date" value={format(dateTime, 'EEEE, MMMM d, yyyy')} />
          <DetailRow icon="time-outline" label="Time" value={`${format(dateTime, 'h:mm a')} (${game.duration_minutes} min)`} />
          {game.location && <DetailRow icon="location-outline" label="Location" value={game.location} />}
          <DetailRow
            icon="people-outline"
            label="Spots"
            value={`${game.confirmed_count || 0} / ${game.max_spots} filled`}
            valueColor={isFull ? colors.warning : colors.success}
          />
          {game.fee_amount > 0 && (
            <DetailRow icon="cash-outline" label="Fee" value={`$${game.fee_amount} ${game.fee_currency}`} />
          )}
        </Card>

        {/* Description */}
        {game.description && (
          <Card style={styles.descCard}>
            <Text style={styles.descTitle}>About</Text>
            <Text style={styles.descText}>{game.description}</Text>
          </Card>
        )}

        {game.notes && (
          <Card style={styles.descCard}>
            <Text style={styles.descTitle}>Notes</Text>
            <Text style={styles.descText}>{game.notes}</Text>
          </Card>
        )}

        {/* Participant List */}
        <ParticipantList bookings={participants} maxSpots={game.max_spots} />

        {/* Booking Status */}
        {isBooked && (
          <Card style={[styles.statusCard, userBooking.status === 'waitlisted' && styles.waitlistCard]}>
            <Ionicons
              name={userBooking.status === 'confirmed' ? 'checkmark-circle' : 'time'}
              size={24}
              color={userBooking.status === 'confirmed' ? colors.success : colors.warning}
            />
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>
                {userBooking.status === 'confirmed' ? 'You\'re Booked!' : 'On Waitlist'}
              </Text>
              <Text style={styles.statusSubtext}>
                {userBooking.status === 'waitlisted'
                  ? `Position #${userBooking.waitlist_position}`
                  : 'You\'re confirmed for this game'}
              </Text>
            </View>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {!isBooked ? (
            <Button
              title={isFull ? 'Join Waitlist' : game.fee_amount > 0 ? `Book ($${game.fee_amount})` : 'Book This Game'}
              onPress={handleBook}
              loading={actionLoading}
              size="lg"
            />
          ) : (
            <>
              <View style={styles.actionRow}>
                <Button
                  title="Add to Calendar"
                  onPress={handleAddToCalendar}
                  variant="secondary"
                  size="md"
                  icon={<Ionicons name="calendar-outline" size={18} color={colors.primary} />}
                  style={styles.actionRowButton}
                />
                <Button
                  title="Game Chat"
                  onPress={() => router.push(`/game/${id}/chat`)}
                  variant="secondary"
                  size="md"
                  icon={<Ionicons name="chatbubbles-outline" size={18} color={colors.primary} />}
                  style={styles.actionRowButton}
                />
              </View>
              <Button
                title="Cancel Booking"
                onPress={handleCancel}
                variant="ghost"
                loading={actionLoading}
                textStyle={{ color: colors.error }}
              />
            </>
          )}
        </View>
      </ScrollView>
    </>
  );
}

function DetailRow({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={detailStyles.row}>
      <Ionicons name={icon} size={20} color={colors.textSecondary} />
      <View style={detailStyles.textWrapper}>
        <Text style={detailStyles.label}>{label}</Text>
        <Text style={[detailStyles.value, valueColor ? { color: valueColor } : undefined]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  textWrapper: { flex: 1 },
  label: { ...typography.footnote, color: colors.textTertiary },
  value: { ...typography.body, color: colors.textPrimary, marginTop: 2 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { ...typography.body, color: colors.textSecondary },
  header: { marginBottom: spacing.md },
  title: { ...typography.largeTitle, color: colors.textPrimary },
  clubName: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  tags: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  detailsCard: { marginBottom: spacing.md },
  descCard: { marginBottom: spacing.md },
  descTitle: { ...typography.headline, color: colors.textPrimary, marginBottom: spacing.sm },
  descText: { ...typography.body, color: colors.textSecondary, lineHeight: 24 },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: '#F0FFF4',
  },
  waitlistCard: { backgroundColor: '#FFF8E1' },
  statusInfo: { flex: 1 },
  statusTitle: { ...typography.headline, color: colors.textPrimary },
  statusSubtext: { ...typography.subheadline, color: colors.textSecondary, marginTop: 2 },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  actionRowButton: { flex: 1 },
});
