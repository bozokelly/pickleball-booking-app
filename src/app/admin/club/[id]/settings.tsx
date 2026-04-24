import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Button, Input } from '@/components/ui';
import { useClubStore } from '@/stores/clubStore';
import { colors, typography, spacing } from '@/constants/theme';

export default function ClubSettingsScreen() {
  const { id: clubId } = useLocalSearchParams<{ id: string }>();
  const { myAdminClubs, updateClub } = useClubStore();

  // Find the club from already-loaded admin clubs (avoids an extra fetch)
  const club = myAdminClubs.find((c) => c.id === clubId);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [managerName, setManagerName] = useState('');
  const [membersOnly, setMembersOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const initialized = useRef(false);

  // Seed form from the club record only once on initial mount.
  // Using a ref guard prevents the form from being reactively reset
  // by Zustand store updates that happen during/after a save.
  useEffect(() => {
    if (club && !initialized.current) {
      initialized.current = true;
      setName(club.name ?? '');
      setDescription(club.description ?? '');
      setLocation(club.location ?? '');
      setContactEmail(club.contact_email ?? '');
      setContactPhone(club.contact_phone ?? '');
      setWebsite(club.website ?? '');
      setManagerName(club.manager_name ?? '');
      setMembersOnly(club.members_only ?? false);
    }
  }, [club]);

  const handleSave = async () => {
    if (!clubId) return;
    if (!name.trim()) {
      Alert.alert('Error', 'Club name is required.');
      return;
    }

    setLoading(true);
    try {
      await updateClub(clubId, {
        name: name.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        contact_email: contactEmail.trim() || null,
        contact_phone: contactPhone.trim() || null,
        website: website.trim() || null,
        manager_name: managerName.trim() || null,
        members_only: membersOnly,
      });
      Alert.alert('Saved', 'Club settings updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!club) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>Club not found.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Club Settings' }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>Club Settings</Text>
          <Text style={styles.subheading}>
            Changes here update the canonical club record and are reflected everywhere.
          </Text>

          <Input
            label="Club Name"
            placeholder="e.g. Downtown Pickleball Club"
            value={name}
            onChangeText={setName}
            icon="tennisball-outline"
          />

          <Input
            label="Description"
            placeholder="Tell people about your club..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={styles.textArea}
            icon="document-text-outline"
          />

          {/* ── Address ─────────────────────────────────── */}
          <Text style={styles.sectionLabel}>Address</Text>

          <Input
            label="Location"
            placeholder="e.g. 123 Main St, Springfield"
            value={location}
            onChangeText={setLocation}
            icon="location-outline"
          />

          {/* ── Contact ─────────────────────────────────── */}
          <Text style={styles.sectionLabel}>Contact</Text>

          <Input
            label="Manager Name"
            placeholder="e.g. Jane Smith"
            value={managerName}
            onChangeText={setManagerName}
            icon="person-outline"
          />

          <Input
            label="Contact Email"
            placeholder="e.g. hello@myclubpb.com"
            value={contactEmail}
            onChangeText={setContactEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            icon="mail-outline"
          />

          <Input
            label="Contact Phone"
            placeholder="e.g. +1 555 000 1234"
            value={contactPhone}
            onChangeText={setContactPhone}
            keyboardType="phone-pad"
            icon="call-outline"
          />

          <Input
            label="Website"
            placeholder="e.g. https://myclubpb.com"
            value={website}
            onChangeText={setWebsite}
            keyboardType="url"
            autoCapitalize="none"
            icon="globe-outline"
          />

          {/* ── Access ──────────────────────────────────── */}
          <Text style={styles.sectionLabel}>Access</Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <Text style={styles.toggleLabel}>Members Only</Text>
              <Text style={styles.toggleHint}>
                Require approved membership to book games at this club.
              </Text>
            </View>
            <Switch
              value={membersOnly}
              onValueChange={setMembersOnly}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>

          <Button
            title="Save Settings"
            onPress={handleSave}
            loading={loading}
            size="lg"
            style={styles.button}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { ...typography.body, color: colors.textSecondary },
  heading: { ...typography.title2, color: colors.textPrimary, marginBottom: spacing.xs },
  subheading: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl },
  sectionLabel: {
    ...typography.footnote,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  toggleText: { flex: 1 },
  toggleLabel: { ...typography.headline, color: colors.textPrimary },
  toggleHint: { ...typography.footnote, color: colors.textSecondary, marginTop: 2 },
  button: { marginTop: spacing.lg },
});
