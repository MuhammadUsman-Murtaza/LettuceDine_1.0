import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { API_URL, getSession } from '@/utils/api';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * ORDERS SCREEN (Clean Refactor)
 * Displays customer's order history and real-time status.
 */
export default function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { customerId } = await getSession();
      if (!customerId) return;
      const response = await fetch(`${API_URL}/customers/${customerId}/orders`);
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      console.error("Orders Fetch Failed", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const renderOrder = ({ item }) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => router.push(`/(customer)/review?orderId=${item.order_id}&restaurantId=${item.restaurant_id}`)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.resInfo}>
          <Text style={styles.resName}>{item.restaurant_name}</Text>
          <Text style={styles.orderDate}>{new Date(item.order_date).toLocaleDateString()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        <Text style={styles.orderSummary}>Total Amount: <Text style={styles.amount}>Rs. {item.total_amount}</Text></Text>
        <Text style={styles.addressText} numberOfLines={1}>Delivered to: {item.street}</Text>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.actionLink}>View Details & Review</Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.greenForest} />
      </View>
    </TouchableOpacity>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return '#F0FFF4';
      case 'cancelled': return '#FFF5F5';
      case 'preparing': return '#E6FFFA';
      case 'out_for_delivery': return '#EBF8FF';
      default: return '#F7FAFC';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.greenFresh} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.order_id.toString()}
          renderItem={renderOrder}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="receipt-outline" size={80} color={Colors.grayBg} />
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptySubtitle}>Hungry? Start exploring the best restaurants nearby!</Text>
              <TouchableOpacity style={styles.orderBtn} onPress={() => router.push('/(customer)/(tabs)/')}>
                <Text style={styles.orderBtnText}>Order Now</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  header: { padding: Spacing.screenMargin, paddingBottom: 10 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: Colors.black },

  list: { padding: Spacing.screenMargin, paddingBottom: 100 },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.grayBg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  resInfo: { flex: 1 },
  resName: { fontSize: 17, fontWeight: '800', color: Colors.black },
  orderDate: { fontSize: 12, color: Colors.gray, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800', color: Colors.black },

  cardBody: { marginBottom: 15 },
  orderSummary: { fontSize: 14, color: Colors.gray },
  amount: { fontWeight: '800', color: Colors.black },
  addressText: { fontSize: 13, color: Colors.gray, marginTop: 4 },

  cardFooter: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    borderTopWidth: 1, borderColor: Colors.grayBg, paddingTop: 12 
  },
  actionLink: { fontSize: 13, fontWeight: '700', color: Colors.greenForest },

  emptyWrap: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: Colors.black, marginTop: 20 },
  emptySubtitle: { textAlign: 'center', color: Colors.gray, marginTop: 8, lineHeight: 20 },
  orderBtn: { backgroundColor: Colors.black, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 15, marginTop: 30 },
  orderBtnText: { color: '#fff', fontWeight: '800' }
});
