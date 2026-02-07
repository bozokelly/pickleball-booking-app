import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '@/components/ui';
import { useMembershipStore, ClubMember } from '@/stores/membershipStore';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';

export default function ClubMembersScreen() {
  const { id: clubId } = useLocalSearchParams<{ id: string }>();
  const { members, loading, fetchClubMembers, approveMember, rejectMember } = useMembershipStore();

  useEffect(() => {
    if (clubId) fetchClubMembers(clubId);
  }, [clubId]);

  const pendingMembers = members.filter((m) => m.status === 'pending');
  const approvedMembers = members.filter((m) => m.status === 'approved');

  const handleApprove = async (member: ClubMember) => {
    try {
      await approveMember(member.id);
      fetchClubMembers(clubId!);
      Alert.alert('Approved', `${member.profile?.full_name || 'Member'} has been approved.`);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleReject = (member: ClubMember) => {
    Alert.alert('Reject Request', `Reject ${member.profile?.full_name || 'this member'}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            await rejectMember(member.id);
            fetchClubMembers(clubId!);
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const renderMember = (member: ClubMember, showActions: boolean) => (
    <Card key={member.id} style={styles.memberCard}>
      <View style={styles.memberRow}>
        {member.profile?.avatar_url ? (
          <Image source={{ uri: member.profile.avatar_url }} style={styles.memberAvatar} />
        ) : (
          <View style={styles.memberAvatarPlaceholder}>
            <Ionicons name="person" size={20} color={colors.white} />
          </View>
        )}
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{member.profile?.full_name || 'Unknown'}</Text>
          <Text style={styles.memberEmail}>{member.profile?.email}</Text>
          {member.profile?.dupr_rating && (
            <Text style={styles.memberRating}>DUPR: {member.profile.dupr_rating.toFixed(2)}</Text>
          )}
        </View>
        {showActions && (
          <View style={styles.memberActions}>
            <Button title="Approve" size="sm" onPress={() => handleApprove(member)} />
            <Button title="Reject" size="sm" variant="ghost" textStyle={{ color: colors.error }} onPress={() => handleReject(member)} />
          </View>
        )}
      </View>
    </Card>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Members' }} />
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.list}
        data={[]}
        renderItem={() => null}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => clubId && fetchClubMembers(clubId)} />
        }
        ListHeaderComponent={
          <>
            {pendingMembers.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Pending Requests ({pendingMembers.length})</Text>
                {pendingMembers.map((m) => renderMember(m, true))}
              </>
            )}

            <Text style={styles.sectionTitle}>Approved Members ({approvedMembers.length})</Text>
            {approvedMembers.length === 0 ? (
              <Text style={styles.emptyText}>No approved members yet.</Text>
            ) : (
              approvedMembers.map((m) => renderMember(m, false))
            )}
          </>
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, paddingBottom: spacing.xxl },
  sectionTitle: {
    ...typography.title3,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  memberCard: { marginBottom: spacing.sm },
  memberRow: { flexDirection: 'row', alignItems: 'center' },
  memberAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: spacing.md },
  memberAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  memberInfo: { flex: 1 },
  memberName: { ...typography.headline, color: colors.textPrimary },
  memberEmail: { ...typography.footnote, color: colors.textSecondary },
  memberRating: { ...typography.caption1, color: colors.primary, marginTop: 2 },
  memberActions: { gap: spacing.xs },
  emptyText: { ...typography.body, color: colors.textTertiary },
});
