import { Stack } from 'expo-router';
import { colors, typography } from '@/constants/theme';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.white },
        headerTitleStyle: { ...typography.headline, color: colors.textPrimary },
        headerShadowVisible: false,
        headerTintColor: colors.primary,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Admin Panel' }} />
      <Stack.Screen name="create-club" options={{ title: 'Create Club' }} />
      <Stack.Screen name="create-game" options={{ title: 'Create Game' }} />
      <Stack.Screen name="club/[id]/members" options={{ title: 'Members' }} />
      <Stack.Screen name="club/[id]/settings" options={{ title: 'Club Settings' }} />
    </Stack>
  );
}
