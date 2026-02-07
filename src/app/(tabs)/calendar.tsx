import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SectionList, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Calendar as RNCalendar } from 'react-native-calendars';
import { format, isSameDay, parseISO } from 'date-fns';
import { GameCard } from '@/components/game/GameCard';
import { useGameStore } from '@/stores/gameStore';
import { Booking } from '@/types/database';
import { colors, typography, spacing } from '@/constants/theme';

export default function CalendarScreen() {
  const { myBookings, fetchMyBookings, loading } = useGameStore();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    fetchMyBookings();
  }, []);

  // Build marked dates for calendar dots
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    myBookings.forEach((booking) => {
      if (!booking.game) return;
      const dateKey = format(parseISO(booking.game.date_time), 'yyyy-MM-dd');
      marks[dateKey] = {
        marked: true,
        dotColor: booking.status === 'waitlisted' ? colors.warning : colors.primary,
      };
    });
    if (selectedDate) {
      marks[selectedDate] = {
        ...marks[selectedDate],
        selected: true,
        selectedColor: colors.primary,
      };
    }
    return marks;
  }, [myBookings, selectedDate]);

  // Filter bookings for selected date
  const filteredBookings = useMemo(() => {
    if (!selectedDate) return myBookings;
    return myBookings.filter(
      (b) => b.game && isSameDay(parseISO(b.game.date_time), parseISO(selectedDate)),
    );
  }, [myBookings, selectedDate]);

  // Group by date for section list
  const sections = useMemo(() => {
    const groups: Record<string, Booking[]> = {};
    filteredBookings.forEach((booking) => {
      if (!booking.game) return;
      const key = format(parseISO(booking.game.date_time), 'EEEE, MMMM d');
      if (!groups[key]) groups[key] = [];
      groups[key].push(booking);
    });
    return Object.entries(groups).map(([title, data]) => ({ title, data }));
  }, [filteredBookings]);

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            <RNCalendar
              markedDates={markedDates}
              onDayPress={(day) => {
                setSelectedDate(
                  selectedDate === day.dateString ? null : day.dateString,
                );
              }}
              theme={{
                todayTextColor: colors.primary,
                selectedDayBackgroundColor: colors.primary,
                arrowColor: colors.primary,
                textDayFontWeight: '400',
                textMonthFontWeight: '600',
                textDayHeaderFontWeight: '500',
              }}
              style={styles.calendar}
            />
            <Text style={styles.sectionHeader}>
              {selectedDate ? 'Games on this day' : 'All Upcoming Games'}
            </Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.dateHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) =>
          item.game ? (
            <GameCard
              game={item.game}
              onPress={() => router.push(`/game/${item.game!.id}`)}
            />
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchMyBookings} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No games booked yet</Text>
            <Text style={styles.emptySubtext}>
              Book a game from the Home tab to see it here.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  calendar: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sectionHeader: {
    ...typography.title3,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  dateHeader: {
    ...typography.headline,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  empty: {
    alignItems: 'center',
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  emptyText: {
    ...typography.headline,
    color: colors.textSecondary,
  },
  emptySubtext: {
    ...typography.subheadline,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
