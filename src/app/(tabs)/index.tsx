import React, { useEffect, useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GameCard } from '@/components/game/GameCard';
import { GameFilters, GameFilterState } from '@/components/game/GameFilters';
import { Button } from '@/components/ui';
import { useGameStore } from '@/stores/gameStore';
import { useClubStore } from '@/stores/clubStore';
import { useAuthStore } from '@/stores/authStore';
import { colors, typography, spacing } from '@/constants/theme';

export default function HomeScreen() {
  const { games, loading, fetchUpcomingGames } = useGameStore();
  const { fetchMyAdminClubs, myAdminClubs } = useClubStore();
  const { profile } = useAuthStore();

  const [filters, setFilters] = useState<GameFilterState>({
    search: '',
    skillLevel: null,
    gameFormat: null,
  });

  const loadData = useCallback(async () => {
    await Promise.all([fetchUpcomingGames(), fetchMyAdminClubs()]);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Apply client-side filters
  const filteredGames = useMemo(() => {
    let result = games;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.club?.name?.toLowerCase().includes(q) ||
          g.location?.toLowerCase().includes(q) ||
          g.description?.toLowerCase().includes(q),
      );
    }

    if (filters.skillLevel) {
      result = result.filter((g) => g.skill_level === filters.skillLevel);
    }

    if (filters.gameFormat) {
      result = result.filter((g) => g.game_format === filters.gameFormat);
    }

    return result;
  }, [games, filters]);

  const isAdmin = myAdminClubs.length > 0;

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredGames}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GameCard
            game={item}
            onPress={() => router.push(`/game/${item.id}`)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} />
        }
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.greeting}>
                  Hi, {profile?.full_name?.split(' ')[0] || 'there'}
                </Text>
                <Text style={styles.headerSubtitle}>Find your next game</Text>
              </View>
              {isAdmin && (
                <Button
                  title="Admin"
                  variant="secondary"
                  size="sm"
                  icon={<Ionicons name="settings-outline" size={16} color={colors.primary} />}
                  onPress={() => router.push('/admin')}
                />
              )}
            </View>
            <GameFilters filters={filters} onChange={setFilters} />
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : (
            <View style={styles.empty}>
              <Ionicons name="tennisball-outline" size={48} color={colors.textTertiary} />
              <Text style={styles.emptyText}>
                {filters.search || filters.skillLevel || filters.gameFormat
                  ? 'No games match your filters'
                  : 'No upcoming games'}
              </Text>
              <Text style={styles.emptySubtext}>
                {filters.search || filters.skillLevel || filters.gameFormat
                  ? 'Try adjusting your search or filters.'
                  : 'Check back soon or ask a club admin to create one.'}
              </Text>
            </View>
          )
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
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  greeting: {
    ...typography.largeTitle,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  loader: {
    marginTop: spacing.xxl,
  },
  empty: {
    alignItems: 'center',
    marginTop: spacing.xxl * 2,
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.title3,
    color: colors.textSecondary,
  },
  emptySubtext: {
    ...typography.subheadline,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
