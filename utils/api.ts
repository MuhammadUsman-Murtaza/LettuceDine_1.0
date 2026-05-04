import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

/**
 * SMART CONNECTION HUB
 * Automatically detects the correct backend URL based on the environment.
 */
const getBaseUrl = () => {
  if (Platform.OS === 'web') return 'http://localhost:3000';
  
  // For Android/Physical devices, detect the host machine's IP
  const debuggerHost = Constants.expoConfig?.hostUri?.split(':').shift();
  return debuggerHost ? `http://${debuggerHost}:3000` : 'http://10.0.2.2:3000';
};

export const API_URL = getBaseUrl();

/**
 * AUTH HUB
 * Shared helpers for getting session data
 */
export const getSession = async () => {
  const [role, customerId, vendorId, restaurantId] = await Promise.all([
    AsyncStorage.getItem('ROLE'),
    AsyncStorage.getItem('CUSTOMER_ID'),
    AsyncStorage.getItem('VENDOR_ID'),
    AsyncStorage.getItem('RESTAURANT_ID'),
  ]);
  
  return {
    role: role as 'customer' | 'vendor' | null,
    customerId,
    vendorId,
    restaurantId,
    isAuthenticated: !!role,
  };
};

export const logout = async () => {
  await AsyncStorage.multiRemove(['ROLE', 'CUSTOMER_ID', 'VENDOR_ID', 'RESTAURANT_ID']);
};
