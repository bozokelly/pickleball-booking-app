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
          label="Location"
          placeholder="e.g. Central Park Courts"
          value={location}
          onChangeText={setLocation}
          icon="location-outline"
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
  textArea: { height: 100, textAlignVertical: 'top' },
  button: { marginTop: spacing.md },
});
