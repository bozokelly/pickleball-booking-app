import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Button, Input } from '@/components/ui';
import { useClubStore } from '@/stores/clubStore';
import { colors, typography, spacing } from '@/constants/theme';

export default function CreateClubScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [managerName, setManagerName] = useState('');
  const [loading, setLoading] = useState(false);
  const { createClub } = useClubStore();

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Club name is required.');
      return;
    }
    setLoading(true);
    try {
      await createClub({
        name: name.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        contact_email: contactEmail.trim() || null,
        contact_phone: contactPhone.trim() || null,
        website: website.trim() || null,
        manager_name: managerName.trim() || null,
      });
      Alert.alert('Success', 'Club created! You can now create games for this club.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>New Club</Text>
        <Text style={styles.subheading}>
          Create a club to organize and host pickleball games.
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

        <Button
          title="Create Club"
          onPress={handleCreate}
          loading={loading}
          size="lg"
          style={styles.button}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
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
  button: { marginTop: spacing.lg },
});
