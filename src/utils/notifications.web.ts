/**
 * Web stub for push notifications.
 * expo-notifications is not available on web.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  console.log('Push notifications are not supported on web');
  return null;
}
