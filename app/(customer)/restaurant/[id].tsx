import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, Image, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/utils/api';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * MENU SCREEN (Clean Refactor)
 * Displays restaurant details and categorical menu items.
 */
export default function MenuScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    loadData();
    updateCartCount();
  }, [id]);

  const loadData = async () => {
    try {
      const [rRes, mRes] = await Promise.all([
        fetch(`${API_URL}/restaurants/${id}`),
        fetch(`${API_URL}/restaurants/${id}/menu`)
      ]);
      setRestaurant(await rRes.json());
      setMenu(await mRes.json());
    } catch (err) {
      console.error("Menu Load Error", err);
    } finally {
      setLoading(false);
    }
  };

  const updateCartCount = async () => {
    const cartStr = await AsyncStorage.getItem('CART');
    if (cartStr) {
      const cart = JSON.parse(cartStr);
      setCartCount(cart.reduce((s, i) => s + i.quantity, 0));
    }
  };

  const addToCart = async (item: any) => {
    const cartStr = await AsyncStorage.getItem('CART');
    let cart = cartStr ? JSON.parse(cartStr) : [];

    // Check if adding from a different restaurant
    if (cart.length > 0 && cart[0].restaurant_id !== parseInt(id as string)) {
      Alert.alert(
        "Replace Cart?",
        "You can only order from one restaurant at a time. Replace your current cart?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Replace", onPress: () => saveToCart(item, true) }
        ]
      );
      return;
    }
    saveToCart(item);
  };

  const saveToCart = async (item: any, replace = false) => {
    let cart = replace ? [] : JSON.parse(await AsyncStorage.getItem('CART') || '[]');
    const existing = cart.find(i => i.menu_id === item.menu_id);

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...item, quantity: 1, restaurant_id: parseInt(id as string) });
    }

    await AsyncStorage.setItem('CART', JSON.stringify(cart));
    updateCartCount();
    Alert.alert("Added!", `${item.food_item || item.beverages} added to cart.`);
  };

  const renderMenuItem = ({ item }) => (
    <View style={styles.menuCard}>
      <View style={styles.menuInfo}>
        <Text style={styles.menuName}>{item.food_item || item.beverages || item.desserts || item.starter}</Text>
        <Text style={styles.menuDesc} numberOfLines={2}>{item.description}</Text>
        <Text style={styles.menuPrice}>Rs. {item.price}</Text>
      </View>
      <TouchableOpacity style={styles.addIconBtn} onPress={() => addToCart(item)}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color={Colors.greenFresh}/></View>
  );

  return (
    <View style={styles.container}>
      <ScrollView stickyHeaderIndices={[1]}>
        
        {/* Banner */}
        <View>
          <Image 
            source={{ uri: `https://source.unsplash.com/1200x600/?restaurant,interior,${restaurant?.cuisine_type}` }} 
            style={styles.banner} 
          />
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Text style={styles.resName}>{restaurant?.name}</Text>
            <TouchableOpacity style={styles.reviewBtn} onPress={() => router.push(`/(customer)/review?restaurantId=${id}`)}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.reviewText}>{restaurant?.rating || 'No ratings'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.resSub}>{restaurant?.cuisine_type} • {restaurant?.city}</Text>
          <View style={styles.resMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color={Colors.gray} />
              <Text style={styles.metaText}>30-45 mins</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="bicycle-outline" size={16} color={Colors.gray} />
              <Text style={styles.metaText}>Rs. 150 Delivery</Text>
            </View>
          </View>
        </View>

        {/* Menu Sections */}
        <View style={styles.menuList}>
          <Text style={styles.sectionTitle}>Full Menu</Text>
          {menu.map((item: any) => (
            <React.Fragment key={item.menu_id}>
              {renderMenuItem({ item })}
            </React.Fragment>
          ))}
        </View>

      </ScrollView>

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <TouchableOpacity style={styles.cartFab} onPress={() => router.push('/(customer)/cart')}>
          <View style={styles.fabLeft}>
            <View style={styles.fabBadge}><Text style={styles.fabBadgeText}>{cartCount}</Text></View>
            <Text style={styles.fabText}>View Cart</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  banner: { width: '100%', height: 250 },
  backBtn: { position: 'absolute', top: 50, left: 20, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8 },
  
  infoCard: { 
    backgroundColor: '#fff', marginTop: -30, borderTopLeftRadius: 32, borderTopRightRadius: 32, 
    padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10
  },
  infoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resName: { fontSize: 26, fontWeight: '900', color: Colors.black },
  reviewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.offWhite, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  reviewText: { fontWeight: '700', fontSize: 14 },
  resSub: { fontSize: 15, color: Colors.gray, marginTop: 4 },
  resMeta: { flexDirection: 'row', gap: 20, marginTop: 15 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: Colors.gray, fontWeight: '600' },

  menuList: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 150 },
  sectionTitle: { fontSize: 20, fontWeight: '900', marginBottom: 20 },
  menuCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, borderBottomWidth: 1, borderColor: Colors.grayBg, paddingBottom: 15 },
  menuInfo: { flex: 1, marginRight: 20 },
  menuName: { fontSize: 17, fontWeight: '700', color: Colors.black, marginBottom: 4 },
  menuDesc: { fontSize: 13, color: Colors.gray, lineHeight: 18, marginBottom: 8 },
  menuPrice: { fontSize: 16, fontWeight: '800', color: Colors.greenForest },
  addIconBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: Colors.black, justifyContent: 'center', alignItems: 'center' },

  cartFab: { 
    position: 'absolute', bottom: 30, left: 20, right: 20, height: 64, backgroundColor: Colors.black, 
    borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10
  },
  fabLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fabBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.greenFresh, justifyContent: 'center', alignItems: 'center' },
  fabBadgeText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  fabText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});
