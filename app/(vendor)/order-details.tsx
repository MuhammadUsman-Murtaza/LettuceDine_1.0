import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL, getSession } from '@/utils/api';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * VENDOR ORDER DETAILS
 * Dedicated page for managing a single order's items and status.
 */
export default function VendorOrderDetails() {
  const { orderId } = useLocalSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`${API_URL}/orders/${orderId}`);
      const data = await response.json();
      setOrder(data);
    } catch (error) {
      console.error("Order Details Fetch Error", error);
      Alert.alert("Error", "Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        Alert.alert("Status Updated", `Order is now ${newStatus.replace(/_/g, ' ')}`);
        fetchOrderDetails();
      } else {
        const errorData = await response.json();
        Alert.alert("Update Failed", errorData.error || "Server rejected the status update");
      }
    } catch (error) {
      Alert.alert("Network Error", "Could not connect to the server.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FFF5F5';
      case 'preparing': return '#E6FFFA';
      case 'out_for_delivery': return '#EBF8FF';
      case 'delivered': return '#F0FFF4';
      default: return '#F7FAFC';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={Colors.greenFresh} style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  if (!order) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Section */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.orderId}>Order #{order.order_id}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
              <Text style={styles.statusText}>{order.status.replace(/_/g, ' ').toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.orderDate}>{new Date(order.order_date).toLocaleString()}</Text>
        </View>

        {/* Customer Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>
              {order.first_name || 'N/A'} {order.last_name || ''}
            </Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>{order.street || 'N/A'}, {order.city || ''}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{order.phone_number || 'No contact provided'}</Text>
          </View>
        </View>

        {/* Items Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {order.items?.map((item: any) => (
            <View key={item.order_item_id} style={styles.itemRow}>
              <View style={styles.itemQuantity}>
                <Text style={styles.quantityText}>{item.quantity}x</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.item_name}</Text>
                <Text style={styles.itemDesc}>{item.description}</Text>
              </View>
              <Text style={styles.itemPrice}>Rs. {item.line_total}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>Rs. {order.total_amount}</Text>
          </View>
        </View>

        {/* Action Section */}
        <View style={styles.actionContainer}>
          {['pending', 'preparing'].includes(order.status) && (
            <TouchableOpacity 
              style={[styles.primaryAction, { backgroundColor: Colors.danger, marginBottom: 12 }]} 
              onPress={() => {
                Alert.alert(
                  "Cancel Order?",
                  "Are you sure you want to cancel this order?",
                  [
                    { text: "No", style: "cancel" },
                    { text: "Yes, Cancel", style: "destructive", onPress: () => updateStatus('cancelled') }
                  ]
                );
              }}
            >
              <Text style={styles.actionText}>Cancel Order</Text>
            </TouchableOpacity>
          )}

          {order.status === 'pending' && (
            <TouchableOpacity style={styles.primaryAction} onPress={() => updateStatus('preparing')}>
              <Text style={styles.actionText}>Accept & Start Preparing</Text>
            </TouchableOpacity>
          )}
          {order.status === 'preparing' && (
            <TouchableOpacity style={styles.primaryAction} onPress={() => updateStatus('out_for_delivery')}>
              <Text style={styles.actionText}>Mark as Out for Delivery</Text>
            </TouchableOpacity>
          )}
          {order.status === 'out_for_delivery' && (
            <TouchableOpacity style={styles.primaryAction} onPress={() => updateStatus('delivered')}>
              <Text style={styles.actionText}>Mark as Delivered</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    padding: Spacing.screenMargin, borderBottomWidth: 1, borderColor: Colors.grayBg 
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.black },
  backBtn: { padding: 5 },

  scrollContent: { padding: Spacing.screenMargin, paddingBottom: 50 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.black, marginBottom: 15 },
  
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 20, fontWeight: '900', color: Colors.black },
  orderDate: { fontSize: 14, color: Colors.gray, marginTop: 4 },
  
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: '800', color: Colors.black },

  infoBox: { marginBottom: 12 },
  infoLabel: { fontSize: 12, color: Colors.gray, fontWeight: '600', marginBottom: 2 },
  infoValue: { fontSize: 15, color: Colors.black, fontWeight: '700' },

  itemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 15 },
  itemQuantity: { 
    backgroundColor: Colors.grayBg, paddingHorizontal: 8, paddingVertical: 4, 
    borderRadius: 6, marginRight: 12, marginTop: 2 
  },
  quantityText: { fontSize: 13, fontWeight: '800', color: Colors.black },
  itemName: { fontSize: 15, fontWeight: '700', color: Colors.black },
  itemDesc: { fontSize: 12, color: Colors.gray, marginTop: 2 },
  itemPrice: { fontSize: 15, fontWeight: '800', color: Colors.black },

  divider: { height: 1, backgroundColor: Colors.grayBg, marginVertical: 15 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 18, fontWeight: '800', color: Colors.black },
  totalValue: { fontSize: 22, fontWeight: '900', color: Colors.greenForest },

  actionContainer: { marginTop: 20 },
  primaryAction: { 
    backgroundColor: Colors.black, padding: 18, borderRadius: 15, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5
  },
  actionText: { color: Colors.white, fontSize: 16, fontWeight: '800' }
});
