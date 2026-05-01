import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Platform, SafeAreaView,
  FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
const CUSTOMER_ID = 1; // TODO: replace with real auth

const STATUS_COLOR: Record<string, string> = {
  Pending:      '#F57C00',
  Preparing:    '#1976D2',
  'On the Way': '#7B1FA2',
  Delivered:    '#2E7D32',
  Cancelled:    '#D32F2F',
};

const STATUS_EMOJI: Record<string, string> = {
  Pending:      '🕐',
  Preparing:    '👨‍🍳',
  'On the Way': '🚴',
  Delivered:    '✅',
  Cancelled:    '❌',
};

interface OrderSummary {
  order_id: number;
  order_date: string;
  total_amount: number;
  status: string;
  restaurant_name: string;
  street: string;
  city: string;
}

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(`${BASE_URL}/customers/${CUSTOMER_ID}/orders`);
        setOrders(await res.json());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch_();
  }, []);

  const renderItem = ({ item }: { item: OrderSummary }) => {
    const statusColor = STATUS_COLOR[item.status] ?? Colors.gray;
    const statusEmoji = STATUS_EMOJI[item.status] ?? '📦';
    const date = new Date(item.order_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
    const isActive = !['Delivered', 'Cancelled'].includes(item.status);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => router.push({ pathname: '/order/[id]', params: { id: item.order_id } } as any)}>
        {/* Top row */}
        <View style={styles.cardTop}>
          <View style={styles.restaurantIcon}>
            <Text style={{ fontSize: 22 }}>🍽️</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.restaurantName} numberOfLines={1}>{item.restaurant_name}</Text>
            <Text style={styles.cardDate}>{date}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusEmoji} {item.status}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Bottom row */}
        <View style={styles.cardBottom}>
          <View style={styles.cardBottomLeft}>
            <Ionicons name="location-outline" size={13} color={Colors.gray} />
            <Text style={styles.cardAddress} numberOfLines={1}>
              {[item.street, item.city].filter(Boolean).join(', ') || 'N/A'}
            </Text>
          </View>
          <Text style={styles.cardTotal}>PKR {Number(item.total_amount).toLocaleString()}</Text>
        </View>

        {/* Active order pulse indicator */}
        {isActive && (
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeText}>Live</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📦 My Orders</Text>
        <Text style={styles.headerSub}>{orders.length} total orders</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} size="large" color={Colors.greenFresh} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item.order_id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptySubtitle}>Your order history will appear here</Text>
              <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/' as any)}>
                <Text style={styles.browseBtnText}>Browse Restaurants →</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.offWhite },

  header: {
    backgroundColor: Colors.greenForest,
    paddingTop: Platform.OS === 'android' ? 44 : 16,
    paddingBottom: 20,
    paddingHorizontal: Spacing.screenMargin,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: Colors.greenForest,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
    marginBottom: 4,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: Colors.black },
  headerSub: { fontSize: 13, color: Colors.charcoal, marginTop: 2 },

  listContent: { padding: Spacing.screenMargin, paddingBottom: 32 },

  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  restaurantIcon: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: Colors.greenLight,
    alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  restaurantName: { fontSize: 15, fontWeight: '700', color: Colors.black },
  cardDate: { fontSize: 12, color: Colors.gray, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700' },

  divider: { height: 1, backgroundColor: Colors.grayBg, marginBottom: 12 },

  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardBottomLeft: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  cardAddress: { fontSize: 12, color: Colors.gray, flex: 1 },
  cardTotal: { fontSize: 15, fontWeight: '700', color: Colors.greenForest },

  activeBadge: {
    position: 'absolute', top: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.greenFresh },
  activeText: { fontSize: 11, fontWeight: '700', color: Colors.greenForest },

  empty: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.black },
  emptySubtitle: { fontSize: 14, color: Colors.gray },
  browseBtn: { marginTop: 12, backgroundColor: Colors.greenForest, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16 },
  browseBtnText: { color: Colors.white, fontSize: 14, fontWeight: '700' },
});
