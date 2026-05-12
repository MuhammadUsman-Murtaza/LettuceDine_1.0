import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

/**
 * ROOT LAYOUT (Clean Refactor)
 * Handles global state and stack navigation.
 */
export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade_from_bottom',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="splash" />
        <Stack.Screen name="login" options={{ presentation: 'modal' }} />
        <Stack.Screen name="register" options={{ presentation: 'modal' }} />
        <Stack.Screen name="(customer)" />
        <Stack.Screen name="(vendor)" />
      </Stack>
    </>
  );
}
