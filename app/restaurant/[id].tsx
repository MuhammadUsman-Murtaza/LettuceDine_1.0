import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, ActivityIndicator, StyleSheet,
  Platform, TouchableOpacity, SafeAreaView, ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { IconStar } from '@/components/icons/IconStar';
import { IconChat } from '@/components/icons/IconChat';

const BASE_URL = Platform.OS === 'android'
  ? `http://localhost:3000`
  : 'http://localhost:3000';

interface MenuItem {
  menu_id: number;
  food_item: string | null;
  beverages: string | null;
  desserts: string | null;
  starter: string | null;
  description: string | null;
  price: number;
}

interface Review {
  review_id: number;
  rating: number;
  comment: string;
  date_and_time: string;
  customer_name: string;
}

const CATEGORY_TABS = [
  { key: 'all', label: '🍽️ All' },
  { key: 'food', label: '🥩 Food' },
  { key: 'beverages', label: '🥤 Drinks' },
  { key: 'desserts', label: '🍰 Desserts' },
  { key: 'starter', label: '🥗 Starters' },
];

export default function RestaurantDetailScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const router = useRouter();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [cart, setCart] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [mRes, rRes] = await Promise.all([
          fetch(`${BASE_URL}/restaurants/${id}/menu`),
          fetch(`${BASE_URL}/restaurants/${id}/reviews`),
        ]);
        setMenu(await mRes.json());
        setReviews(await rRes.json());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, [id]);

  const getItemName = (item: MenuItem) =>
    item.food_item || item.beverages || item.desserts || item.starter || 'Menu Item';

  const filteredMenu = menu.filter(item => {
    if (activeTab === 'all') return true;
    if (activeTab === 'food') return !!item.food_item;
    if (activeTab === 'beverages') return !!item.beverages;
    if (activeTab === 'desserts') return !!item.desserts;
    if (activeTab === 'starter') return !!item.starter;
    return true;
  });

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = menu.reduce((sum, item) => sum + (cart[item.menu_id] ?? 0) * item.price, 0);

  const addToCart = (id: number) => setCart(c => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  const removeFromCart = (id: number) => setCart(c => {
    const next = { ...c };
    if ((next[id] ?? 0) > 1) next[id]--;
    else delete next[id];
    return next;
  });

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{name}</Text>
        <TouchableOpacity style={styles.reviewBtn} onPress={() => {}}>
          <IconChat size={22} color={Colors.black} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} size="large" color={Colors.greenFresh} />
      ) : (
        <>
          {/* Category Tabs */}
          <View style={styles.tabsWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
              {CATEGORY_TABS.map(tab => (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                  onPress={() => setActiveTab(tab.key)}>
                  <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <FlatList
            data={filteredMenu}
            keyExtractor={item => item.menu_id.toString()}
            renderItem={({ item }) => {
              const qty = cart[item.menu_id] ?? 0;
              return (
                <View style={styles.menuCard}>
                  <View style={styles.menuIconBox}>
                    <Text style={styles.menuEmoji}>
                      {item.food_item ? '🍛' : item.beverages ? '🥤' : item.desserts ? '🍰' : '🥗'}
                    </Text>
                  </View>
                  <View style={styles.menuInfo}>
                    <Text style={styles.menuName}>{getItemName(item)}</Text>
                    {item.description && <Text style={styles.menuDesc} numberOfLines={2}>{item.description}</Text>}
                    <Text style={styles.menuPrice}>PKR {Number(item.price).toLocaleString()}</Text>
                  </View>
                  <View style={styles.qtyControl}>
                    {qty > 0 ? (
                      <View style={styles.qtyRow}>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(item.menu_id)}>
                          <Ionicons name="remove" size={16} color={Colors.black} />
                        </TouchableOpacity>
                        <Text style={styles.qtyNum}>{qty}</Text>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => addToCart(item.menu_id)}>
                          <Ionicons name="add" size={16} color={Colors.black} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item.menu_id)}>
                        <Ionicons name="add" size={20} color={Colors.black} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            }}
            ListHeaderComponent={
              reviews.length > 0 ? null : undefined
            }
            ListFooterComponent={
              reviews.length > 0 ? (
                <View style={styles.reviewsSection}>
                  <Text style={styles.reviewsTitle}>💬 Reviews</Text>
                  {reviews.slice(0, 3).map(r => (
                    <View key={r.review_id} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        <Text style={styles.reviewerName}>{r.customer_name}</Text>
                        <View style={styles.reviewStars}>
                          {[1, 2, 3, 4, 5].map(i => <IconStar key={i} size={12} active={i <= Math.round(r.rating)} />)}
                        </View>
                      </View>
                      {r.comment ? <Text style={styles.reviewComment}>"{r.comment}"</Text> : null}
                    </View>
                  ))}
                </View>
              ) : <View style={{ height: 120 }} />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          {/* Cart Bar */}
          {cartCount > 0 && (
            <View style={styles.cartBar}>
              <View style={styles.cartInfo}>
                <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cartCount}</Text></View>
                <Text style={styles.cartLabel}>View Cart</Text>
              </View>
              <TouchableOpacity
                style={styles.cartBtn}
                onPress={() => router.push({ pathname: '/cart', params: { restaurantId: id, restaurantName: name, cart: JSON.stringify(cart) } } as any)}>
                <Text style={styles.cartBtnText}>PKR {cartTotal.toLocaleString()} →</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.offWhite },
  header: {
    backgroundColor: Colors.greenForest,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 40 : 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.black },
  reviewBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' },

  tabsWrapper: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.grayBg },
  tabsScroll: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.grayBg },
  tabActive: { backgroundColor: Colors.greenForest },
  tabLabel: { fontSize: 13, fontWeight: '600', color: Colors.charcoal },
  tabLabelActive: { color: Colors.black },

  listContent: { padding: 16 },
  menuCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  menuIconBox: { width: 52, height: 52, borderRadius: 14, backgroundColor: Colors.greenLight, alignItems: 'center', justifyContent: 'center' },
  menuEmoji: { fontSize: 26 },
  menuInfo: { flex: 1 },
  menuName: { fontSize: 15, fontWeight: '700', color: Colors.black, marginBottom: 2 },
  menuDesc: { fontSize: 12, color: Colors.gray, marginBottom: 4 },
  menuPrice: { fontSize: 14, fontWeight: '700', color: Colors.greenForest },
  qtyControl: { alignItems: 'center' },
  addBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.greenForest, alignItems: 'center', justifyContent: 'center' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.greenForest, borderRadius: 20, paddingHorizontal: 6, paddingVertical: 4 },
  qtyBtn: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  qtyNum: { fontSize: 14, fontWeight: '700', color: Colors.black, minWidth: 16, textAlign: 'center' },

  reviewsSection: { paddingTop: 8, paddingBottom: 120 },
  reviewsTitle: { fontSize: 17, fontWeight: '700', color: Colors.black, marginBottom: 12 },
  reviewCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: Colors.greenFresh },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  reviewerName: { fontSize: 14, fontWeight: '600', color: Colors.black },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewComment: { fontSize: 13, color: Colors.charcoal, fontStyle: 'italic' },

  cartBar: { position: 'absolute', bottom: 16, left: 16, right: 16, backgroundColor: Colors.greenForest, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 20, shadowColor: Colors.greenForest, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 10 },
  cartInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cartBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { fontSize: 13, fontWeight: '700', color: Colors.black },
  cartLabel: { fontSize: 15, fontWeight: '600', color: Colors.black },
  cartBtn: { backgroundColor: 'rgba(0,0,0,0.06)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14 },
  cartBtnText: { fontSize: 14, fontWeight: '700', color: Colors.black },
});
