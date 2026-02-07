import * as Notifications from 'expo-notifications';
import { supabase } from '@/lib/supabase';
import { Game } from '@/types/database';

/**
 * Schedule a local push notification 1 hour before a game.
 * Stores the notification identifier on the booking for cancellation.
 */
export async function scheduleGameReminder(
  bookingId: string,
  game: Game,
): Promise<void> {
  const gameTime = new Date(game.date_time);
  const reminderTime = new Date(gameTime.getTime() - 60 * 60 * 1000); // 1 hour before

  // Don't schedule if the reminder time has already passed
  if (reminderTime <= new Date()) return;

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Game Starting Soon',
      body: `${game.title} starts in 1 hour${game.location ? ` at ${game.location}` : ''}`,
      data: { gameId: game.id, type: 'game_reminder' },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderTime,
    },
  });

  // Store notification ID on booking so we can cancel it later
  await supabase
    .from('bookings')
    .update({
      reminder_scheduled: true,
      local_notification_id: notificationId,
    })
    .eq('id', bookingId);
}

/**
 * Cancel a previously scheduled game reminder.
 */
export async function cancelGameReminder(bookingId: string): Promise<void> {
  const { data: booking } = await supabase
    .from('bookings')
    .select('local_notification_id')
    .eq('id', bookingId)
    .single();

  if (booking?.local_notification_id) {
    await Notifications.cancelScheduledNotificationAsync(booking.local_notification_id);

    await supabase
      .from('bookings')
      .update({ reminder_scheduled: false, local_notification_id: null })
      .eq('id', bookingId);
  }
}
