import { Stack } from 'expo-router';
import React from 'react';

export default function VendorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="order-details" options={{ presentation: 'card' }} />
      <Stack.Screen name="menu-manager" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
