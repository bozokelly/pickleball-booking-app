import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, set as setDate } from 'date-fns';
import { Button, Input } from '@/components/ui';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import { supabase } from '@/lib/supabase';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  SKILL_LEVEL_LABELS,
  GAME_FORMAT_LABELS,
} from '@/constants/theme';
import { SkillLevel, GameFormat } from '@/types/database';

const SKILL_LEVELS = Object.keys(SKILL_LEVEL_LABELS) as SkillLevel[];
const GAME_FORMATS = Object.keys(GAME_FORMAT_LABELS) as GameFormat[];

export default function CreateGameScreen() {
  const { clubId } = useLocalSearchParams<{ clubId: string }>();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [gameDate, setGameDate] = useState<Date | null>(null);
  const [gameTime, setGameTime] = useState<Date | null>(null);
  const [duration, setDuration] = useState('90');
  const [maxSpots, setMaxSpots] = useState('8');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('all');
  const [gameFormat, setGameFormat] = useState<GameFormat>('open_play');
  const [location, setLocation] = useState('');
  const [fee, setFee] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || !gameDate || !gameTime) {
      Alert.alert('Error', 'Title, date, and time are required.');
      return;
    }
    if (!clubId) {
      Alert.alert('Error', 'No club selected.');
      return;
    }

    // Combine date and time into a single Date object
    const dateTime = setDate(gameDate, {
      hours: gameTime.getHours(),
      minutes: gameTime.getMinutes(),
      seconds: 0,
      milliseconds: 0,
    });

    setLoading(true);
    try {
      const userId = (await supabase.auth.getUser()).data.user!.id;

      const { error } = await supabase.from('games').insert({
        club_id: clubId,
        title: title.trim(),
        description: description.trim() || null,
        date_time: dateTime.toISOString(),
        duration_minutes: parseInt(duration) || 90,
        max_spots: parseInt(maxSpots) || 8,
        skill_level: skillLevel,
        game_format: gameFormat,
        location: location.trim() || null,
        fee_amount: fee ? parseFloat(fee) : 0,
        notes: notes.trim() || null,
        created_by: userId,
      });

      if (error) throw error;

      Alert.alert('Game Created!', 'Players can now find and book this game.', [
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
        <Input
          label="Game Title"
          placeholder="e.g. Saturday Open Play"
          value={title}
          onChangeText={setTitle}
          icon="tennisball-outline"
        />

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <DateTimePicker
              label="Date"
              value={gameDate}
              onChange={setGameDate}
              mode="date"
              minimumDate={new Date()}
              placeholder="Select date"
              icon="calendar-outline"
            />
          </View>
          <View style={styles.halfInput}>
            <DateTimePicker
              label="Time"
              value={gameTime}
              onChange={setGameTime}
              mode="time"
              placeholder="Select time"
              icon="time-outline"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Input
              label="Duration (min)"
              placeholder="90"
              value={duration}
              onChangeText={setDuration}
              keyboardType="number-pad"
              icon="hourglass-outline"
            />
          </View>
          <View style={styles.halfInput}>
            <Input
              label="Max Spots"
              placeholder="8"
              value={maxSpots}
              onChangeText={setMaxSpots}
              keyboardType="number-pad"
              icon="people-outline"
            />
          </View>
        </View>

        {/* Skill Level Picker */}
        <Text style={styles.pickerLabel}>Skill Level</Text>
        <View style={styles.chipRow}>
          {SKILL_LEVELS.map((level) => (
            <TouchableOpacity
              key={level}
              onPress={() => setSkillLevel(level)}
              style={[styles.chip, skillLevel === level && styles.chipSelected]}
            >
              <Text style={[styles.chipText, skillLevel === level && styles.chipTextSelected]}>
                {SKILL_LEVEL_LABELS[level]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Game Format Picker */}
        <Text style={styles.pickerLabel}>Format</Text>
        <View style={styles.chipRow}>
          {GAME_FORMATS.map((fmt) => (
            <TouchableOpacity
              key={fmt}
              onPress={() => setGameFormat(fmt)}
              style={[styles.chip, gameFormat === fmt && styles.chipSelected]}
            >
              <Text style={[styles.chipText, gameFormat === fmt && styles.chipTextSelected]}>
                {GAME_FORMAT_LABELS[fmt]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Location"
          placeholder="Court name or address"
          value={location}
          onChangeText={setLocation}
          icon="location-outline"
        />

        <Input
          label="Fee (optional)"
          placeholder="0.00"
          value={fee}
          onChangeText={setFee}
          keyboardType="decimal-pad"
          hint="Leave blank for free games. Payment will be required at booking."
          icon="cash-outline"
        />

        <Input
          label="Description"
          placeholder="Additional details about the game..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          style={styles.textArea}
        />

        <Input
          label="Notes"
          placeholder="Any special instructions..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={2}
          style={styles.textArea}
        />

        <Button
          title="Create Game"
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
  row: { flexDirection: 'row', gap: spacing.md },
  halfInput: { flex: 1 },
  pickerLabel: {
    ...typography.subheadline,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: colors.primaryLight + '20',
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.footnote,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  button: { marginTop: spacing.lg },
});
