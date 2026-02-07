import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { Button, Input, Card } from '@/components/ui';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import { useAuthStore } from '@/stores/authStore';
import { pickAndUploadAvatar } from '@/utils/imageUpload';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';

export default function ProfileScreen() {
  const { profile, updateProfile, signOut, loading } = useAuthStore();

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [dob, setDob] = useState<Date | null>(
    profile?.date_of_birth ? parseISO(profile.date_of_birth) : null,
  );
  const [duprRating, setDuprRating] = useState(
    profile?.dupr_rating?.toString() || '',
  );
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleSave = async () => {
    try {
      await updateProfile({
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        date_of_birth: dob ? format(dob, 'yyyy-MM-dd') : null,
        dupr_rating: duprRating ? parseFloat(duprRating) : null,
      });
      setEditing(false);
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleAvatarPress = async () => {
    if (!editing) return;
    setAvatarUploading(true);
    try {
      const url = await pickAndUploadAvatar();
      if (url) {
        await updateProfile({ avatar_url: url });
      }
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar & Name */}
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={handleAvatarPress} disabled={!editing || avatarUploading}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color={colors.white} />
            </View>
          )}
          {editing && (
            <View style={styles.avatarBadge}>
              <Ionicons name="camera" size={14} color={colors.white} />
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.name}>{profile?.full_name || 'Your Name'}</Text>
        <Text style={styles.email}>{profile?.email}</Text>
      </View>

      {/* DUPR Rating Display */}
      {profile?.dupr_rating && (
        <Card style={styles.ratingCard}>
          <Text style={styles.ratingLabel}>DUPR Rating</Text>
          <Text style={styles.ratingValue}>{profile.dupr_rating.toFixed(2)}</Text>
        </Card>
      )}

      {/* Profile Form */}
      <Card style={styles.formCard}>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>Personal Info</Text>
          <TouchableOpacity onPress={() => setEditing(!editing)}>
            <Text style={styles.editLink}>{editing ? 'Cancel' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>

        <Input
          label="Full Name"
          value={fullName}
          onChangeText={setFullName}
          editable={editing}
          icon="person-outline"
        />
        <Input
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          editable={editing}
          keyboardType="phone-pad"
          icon="call-outline"
        />

        {editing ? (
          <DateTimePicker
            label="Date of Birth"
            value={dob}
            onChange={setDob}
            mode="date"
            placeholder="Select your date of birth"
            icon="calendar-outline"
          />
        ) : (
          <Input
            label="Date of Birth"
            value={dob ? format(dob, 'MMMM d, yyyy') : ''}
            editable={false}
            placeholder="Not set"
            icon="calendar-outline"
          />
        )}

        <Input
          label="DUPR Rating"
          value={duprRating}
          onChangeText={setDuprRating}
          editable={editing}
          keyboardType="decimal-pad"
          placeholder="e.g. 3.50"
          hint="Rating between 1.00 and 8.00"
          icon="stats-chart-outline"
        />

        {editing && (
          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={loading}
            style={styles.saveButton}
          />
        )}
      </Card>

      {/* Sign Out */}
      <Button
        title="Sign Out"
        onPress={handleSignOut}
        variant="outline"
        style={styles.signOutButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: spacing.sm,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  name: {
    ...typography.title2,
    color: colors.textPrimary,
  },
  email: {
    ...typography.subheadline,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  ratingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  ratingLabel: {
    ...typography.headline,
    color: colors.textSecondary,
  },
  ratingValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
  },
  formCard: {
    marginBottom: spacing.md,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  formTitle: {
    ...typography.title3,
    color: colors.textPrimary,
  },
  editLink: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  saveButton: {
    marginTop: spacing.sm,
  },
  signOutButton: {
    marginTop: spacing.md,
  },
});
