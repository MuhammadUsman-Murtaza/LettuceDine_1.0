import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { getSession } from '@/utils/api';
import { Colors } from '@/constants/Colors';

/**
 * AUTO-REDIRECTOR (Clean Refactor)
 * Silently determines where to send the user based on their role and session.
 */
export default function EntryPoint() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { role, isAuthenticated } = await getSession();

      if (!isAuthenticated) {
        // No session found, send to login
        router.replace('/login');
        return;
      }

      if (role === 'vendor') {
        router.replace('/(vendor)/dashboard');
      } else {
        router.replace('/(customer)/(tabs)/');
      }
    };

    // Small delay to ensure navigation is ready
    setTimeout(checkSession, 100);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.offWhite }}>
      <ActivityIndicator size="large" color={Colors.greenFresh} />
    </View>
  );
}
