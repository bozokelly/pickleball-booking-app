import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '@/components/ui';
import { useClubStore } from '@/stores/clubStore';
import { colors, typography, spacing } from '@/constants/theme';

export default function AdminPanelScreen() {
  const { myAdminClubs, fetchMyAdminClubs } = useClubStore();

  useEffect(() => {
    fetchMyAdminClubs();
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={myAdminClubs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Your Clubs</Text>
            <Button
              title="Create Club"
              onPress={() => router.push('/admin/create-club')}
              size="sm"
              icon={<Ionicons name="add" size={18} color={colors.white} />}
            />
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.clubCard}>
            <View style={styles.clubRow}>
              <View style={styles.clubIcon}>
                <Ionicons name="tennisball" size={24} color={colors.primary} />
              </View>
              <View style={styles.clubInfo}>
                <Text style={styles.clubName}>{item.name}</Text>
                {item.location && (
                  <Text style={styles.clubLocation}>{item.location}</Text>
                )}
              </View>
            </View>
            <View style={styles.clubActions}>
              <Button
                title="Create Game"
                size="sm"
                variant="secondary"
                onPress={() => router.push(`/admin/create-game?clubId=${item.id}`)}
              />
              <Button
                title="Members"
                size="sm"
                variant="secondary"
                onPress={() => router.push(`/admin/club/${item.id}/members`)}
              />
              <Button
                title="Settings"
                size="sm"
                variant="ghost"
                onPress={() => router.push(`/admin/club/${item.id}/settings`)}
              />
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="business-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyText}>No clubs yet</Text>
            <Text style={styles.emptySubtext}>Create a club to start hosting games.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...typography.title2, color: colors.textPrimary },
  clubCard: { marginBottom: spacing.sm },
  clubRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  clubIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  clubInfo: { flex: 1 },
  clubName: { ...typography.headline, color: colors.textPrimary },
  clubLocation: { ...typography.subheadline, color: colors.textSecondary, marginTop: 2 },
  clubActions: { flexDirection: 'row', gap: spacing.xs },
  empty: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    gap: spacing.sm,
  },
  emptyText: { ...typography.title3, color: colors.textSecondary },
  emptySubtext: { ...typography.subheadline, color: colors.textTertiary, textAlign: 'center' },
});
