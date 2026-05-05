import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSession } from './api';

const DEFAULT_CART_KEY = 'CART_GUEST';

export const getCartKey = async () => {
  const { customerId, isAuthenticated } = await getSession();
  return isAuthenticated ? `CART_${customerId}` : DEFAULT_CART_KEY;
};

export const getCart = async () => {
  const key = await getCartKey();
  const cartStr = await AsyncStorage.getItem(key);
  return cartStr ? JSON.parse(cartStr) : [];
};

export const saveCart = async (cart: any[]) => {
  const key = await getCartKey();
  await AsyncStorage.setItem(key, JSON.stringify(cart));
};

export const clearCart = async () => {
  const key = await getCartKey();
  await AsyncStorage.removeItem(key);
  // Also clear legacy/guest cart if needed
  await AsyncStorage.removeItem('CART');
};
