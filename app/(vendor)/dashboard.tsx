import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, StyleSheet, TouchableOpacity, 
  ActivityIndicator, Platform, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const debuggerHost = Constants.expoConfig?.hostUri?.split(":").shift();
const API_URL = Platform.OS === 'android' 
  ? `http://${debuggerHost}:3000`
  : 'http://localhost:3000';

export default function VendorDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // In a real app, this would come from a global Login state/Context
  const currentRestaurantId = 1; 

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/restaurants/${currentRestaurantId}/orders`);
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("Vendor fetch failed", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        Alert.alert("Success", `Order #${orderId} marked as ${newStatus}`);
        fetchOrders();
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update status");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const renderOrderItem = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Order #{item.order_id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.customerName}>{item.first_name} {item.last_name}</Text>
      <Text style={styles.addressText}>{item.street}, {item.city}</Text>
      
      <View style={styles.actionRow}>
        {item.status === 'pending' && (
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => updateStatus(item.order_id, 'preparing')}
          >
            <Text style={styles.actionBtnText}>Accept & Prep</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return Colors.warning;
      case 'preparing': return Colors.greenFresh;
      default: return Colors.gray;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/')}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Shop Manager</Text>
          <Text style={styles.restaurantName}>Online & Receiving Orders</Text>
        </View>
      </View>

      <View style={styles.feedHeader}>
        <Text style={styles.feedTitle}>Incoming Orders</Text>
        <TouchableOpacity onPress={() => { setLoading(true); fetchOrders(); }}>
          <Ionicons name="refresh" size={20} color={Colors.greenFresh} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.greenFresh} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.order_id.toString()}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No orders found.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  header: { 
    paddingHorizontal: Spacing.screenMargin, 
    paddingTop: 10,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerTitleWrap: { marginLeft: 15 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.black },
  restaurantName: { fontSize: 13, color: Colors.greenFresh, fontWeight: '700' },
  feedHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: Spacing.screenMargin,
    marginBottom: 15
  },
  feedTitle: { fontSize: 18, fontWeight: '700', color: Colors.black },
  listContent: { paddingHorizontal: Spacing.screenMargin, paddingBottom: 50 },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.grayBg,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 14, fontWeight: '800', color: Colors.greenFresh },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusText: { fontSize: 10, color: '#fff', fontWeight: 'bold' },
  customerName: { fontSize: 16, fontWeight: '700', marginTop: 10, color: Colors.black },
  addressText: { fontSize: 13, color: Colors.gray, marginTop: 4 },
  actionRow: { marginTop: 15, flexDirection: 'row', justifyContent: 'flex-end' },
  actionBtn: { 
    backgroundColor: Colors.greenForest, 
    paddingHorizontal: 18, 
    paddingVertical: 10, 
    borderRadius: 12 
  },
  actionBtnText: { color: Colors.black, fontSize: 14, fontWeight: '700' },
  emptyText: { textAlign: 'center', marginTop: 50, color: Colors.gray, fontSize: 15 }
});
