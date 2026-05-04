import { Stack } from 'expo-router';
import React from 'react';

export default function CustomerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* The main tab bar */}
      <Stack.Screen name="(tabs)" />
      
      {/* Sub-screens */}
      <Stack.Screen name="cart" options={{ presentation: 'modal' }} />
      <Stack.Screen name="restaurant/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="order/[id]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="coupons" />
      <Stack.Screen name="payments" />
      <Stack.Screen name="review" />
    </Stack>
  );
}
