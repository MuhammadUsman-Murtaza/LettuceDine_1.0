import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, Platform, Alert, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { API_URL, getSession, logout } from '@/utils/api';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * VENDOR DASHBOARD (Clean Refactor)
 * Live order management for restaurant owners.
 */
export default function VendorDashboard() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    initDashboard();
  }, []);

  const initDashboard = async () => {
    const { restaurantId: rid, role } = await getSession();
    if (!rid || role !== 'vendor') {
      router.replace('/login');
      return;
    }
    setRestaurantId(rid);
    fetchOrders(rid);
  };

  const fetchOrders = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/restaurants/${id}/orders`);
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("Dashboard Fetch Error", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        Alert.alert("Status Updated", `Order #${orderId} is now ${newStatus}`);
        if (restaurantId) fetchOrders(restaurantId);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update status");
    }
  };

  const renderOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderId}>Order #{item.order_id}</Text>
          <Text style={styles.orderTime}>{new Date(item.order_date).toLocaleTimeString()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.customerBox}>
        <Ionicons name="person-outline" size={16} color={Colors.gray} />
        <Text style={styles.customerName}>{item.first_name} {item.last_name}</Text>
      </View>
      <View style={styles.addressBox}>
        <Ionicons name="location-outline" size={16} color={Colors.gray} />
        <Text style={styles.addressText}>{item.street}, {item.city}</Text>
      </View>

      <View style={styles.actionRow}>
        <Text style={styles.orderTotal}>Rs. {item.total_amount}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {item.status === 'pending' && (
            <TouchableOpacity style={styles.primaryBtn} onPress={() => updateStatus(item.order_id, 'preparing')}>
              <Text style={styles.btnText}>Accept</Text>
            </TouchableOpacity>
          )}
          {item.status === 'preparing' && (
            <TouchableOpacity style={styles.primaryBtn} onPress={() => updateStatus(item.order_id, 'out_for_delivery')}>
              <Text style={styles.btnText}>Dispatch</Text>
            </TouchableOpacity>
          )}
          {item.status === 'out_for_delivery' && (
            <TouchableOpacity style={styles.primaryBtn} onPress={() => updateStatus(item.order_id, 'delivered')}>
              <Text style={styles.btnText}>Complete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FFF5F5';
      case 'preparing': return '#E6FFFA';
      case 'out_for_delivery': return '#EBF8FF';
      case 'delivered': return '#F0FFF4';
      default: return '#F7FAFC';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Shop Manager</Text>
          <Text style={styles.headerStatus}>Restaurant is Online 🟢</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={async () => { await logout(); router.replace('/login'); }}>
          <Ionicons name="log-out-outline" size={24} color={Colors.danger} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <Text style={styles.tabTitle}>Incoming Orders</Text>
        <TouchableOpacity onPress={() => { setLoading(true); if(restaurantId) fetchOrders(restaurantId); }}>
          <Ionicons name="refresh" size={20} color={Colors.greenFresh} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.greenFresh} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.order_id.toString()}
          renderItem={renderOrder}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="clipboard-outline" size={60} color={Colors.grayBg} />
              <Text style={styles.emptyText}>No orders right now.{"\n"}They'll show up here when customers order!</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    padding: Spacing.screenMargin, backgroundColor: Colors.white,
    borderBottomWidth: 1, borderColor: Colors.grayBg
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: Colors.black },
  headerStatus: { fontSize: 13, color: Colors.greenForest, fontWeight: '700' },
  logoutBtn: { padding: 10 },

  tabContainer: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    padding: Spacing.screenMargin, marginTop: 10 
  },
  tabTitle: { fontSize: 18, fontWeight: '800', color: Colors.black },
  
  list: { paddingHorizontal: Spacing.screenMargin, paddingBottom: 100 },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Colors.grayBg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  orderId: { fontSize: 16, fontWeight: '800', color: Colors.black },
  orderTime: { fontSize: 12, color: Colors.gray },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800', color: Colors.black },

  customerBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  customerName: { fontSize: 14, fontWeight: '700', color: Colors.black },
  addressBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  addressText: { fontSize: 13, color: Colors.gray, flex: 1 },

  actionRow: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    borderTopWidth: 1, borderColor: Colors.grayBg, paddingTop: 12 
  },
  orderTotal: { fontSize: 16, fontWeight: '900', color: Colors.greenForest },
  primaryBtn: { backgroundColor: Colors.black, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
  btnText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  emptyWrap: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyText: { textAlign: 'center', marginTop: 15, color: Colors.gray, fontSize: 14, lineHeight: 20 }
});
