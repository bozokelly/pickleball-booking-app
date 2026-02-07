import * as Calendar from 'expo-calendar';
import { Platform, Alert } from 'react-native';
import { Game } from '@/types/database';

async function getDefaultCalendarId(): Promise<string | null> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission Required', 'Calendar access is needed to add events.');
    return null;
  }

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

  if (Platform.OS === 'ios') {
    const defaultCalendar = calendars.find((c) => c.allowsModifications && c.source.name === 'iCloud')
      || calendars.find((c) => c.allowsModifications);
    return defaultCalendar?.id || null;
  }

  // Android: use primary calendar or first available
  const primary = calendars.find((c) => c.isPrimary);
  return primary?.id || calendars[0]?.id || null;
}

export async function addGameToCalendar(game: Game): Promise<boolean> {
  try {
    const calendarId = await getDefaultCalendarId();
    if (!calendarId) return false;

    const startDate = new Date(game.date_time);
    const endDate = new Date(startDate.getTime() + game.duration_minutes * 60 * 1000);

    await Calendar.createEventAsync(calendarId, {
      title: game.title,
      notes: [
        game.description,
        game.club?.name ? `Club: ${game.club.name}` : '',
        game.skill_level !== 'all' ? `Level: ${game.skill_level}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      startDate,
      endDate,
      location: game.location || undefined,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      alarms: [{ relativeOffset: -60 }], // 1 hour before
    });

    return true;
  } catch (error) {
    console.error('Failed to add calendar event:', error);
    return false;
  }
}
