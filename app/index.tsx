import { Redirect } from 'expo-router';

/**
 * BOOT ENTRY
 * Uses <Redirect> (not router.replace in useEffect) so Expo Router's
 * navigator is guaranteed to be mounted before navigation occurs.
 */
export default function Boot() {
  return <Redirect href="/splash" />;
}
