import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { API_URL, getSession, logout } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * VENDOR DASHBOARD (Clean Refactor)
 * Live order management for restaurant owners.
 */
export default function VendorDashboard() {
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRest, setNewRest] = useState({ name: '', cuisine_type: '', city: '', street_address: '' });
  const router = useRouter();

  useEffect(() => {
    initDashboard();
  }, []);

  const initDashboard = async () => {
    const { vendorId: vid, role } = await getSession();
    if (!vid || role !== 'vendor') {
      router.replace('/login');
      return;
    }
    setVendorId(vid);
    fetchRestaurants(vid);
  };

  const fetchRestaurants = async (vid: string) => {
    try {
      const response = await fetch(`${API_URL}/vendors/${vid}/restaurants`);
      const data = await response.json();
      setRestaurants(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch Restaurants Error", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (rid: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/restaurants/${rid}/orders`);
      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Dashboard Fetch Error", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRestaurant = async () => {
    if (!vendorId || !newRest.name || !newRest.cuisine_type || !newRest.city) {
      Alert.alert("Missing Info", "Please fill in all required fields");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/restaurants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newRest, vendor_id: vendorId })
      });
      
      if (response.ok) {
        Alert.alert("Success", "Restaurant added successfully!");
        setShowAddModal(false);
        setNewRest({ name: '', cuisine_type: '', city: '', street_address: '' });
        fetchRestaurants(vendorId);
      } else {
        throw new Error("Failed to add restaurant");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to add restaurant");
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

  const renderRestaurant = ({ item }) => (
    <TouchableOpacity 
      style={styles.restCard} 
      onPress={() => {
        setSelectedRestaurant(item);
        fetchOrders(item.restaurant_id);
      }}
    >
      <View>
        <Text style={styles.restName}>{item.name}</Text>
        <Text style={styles.restCuisine}>{item.cuisine_type} • {item.city}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
    </TouchableOpacity>
  );

  const renderOrder = ({ item }) => (
    <TouchableOpacity 
      style={styles.orderCard} 
      onPress={() => router.push(`/(vendor)/order-details?orderId=${item.order_id}`)}
    >
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

      <View style={styles.actionRow}>
        <Text style={styles.orderTotal}>Rs. {item.total_amount}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {item.status === 'pending' && (
            <TouchableOpacity style={styles.primaryBtn} onPress={(e) => { e.stopPropagation(); updateStatus(item.order_id, 'preparing'); }}>
              <Text style={styles.btnText}>Accept</Text>
            </TouchableOpacity>
          )}
          {item.status === 'preparing' && (
            <TouchableOpacity style={styles.primaryBtn} onPress={(e) => { e.stopPropagation(); updateStatus(item.order_id, 'out_for_delivery'); }}>
              <Text style={styles.btnText}>Dispatch</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
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
          <Text style={styles.headerTitle}>
            {selectedRestaurant ? selectedRestaurant.name : 'My Restaurants'}
          </Text>
          <Text style={styles.headerStatus}>
            {selectedRestaurant ? 'Managing Orders' : `${restaurants.length} Active Outlets`}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {selectedRestaurant && (
            <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedRestaurant(null)}>
              <Ionicons name="arrow-back" size={24} color={Colors.black} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.logoutBtn} onPress={async () => { await logout(); router.replace('/login'); }}>
            <Ionicons name="log-out-outline" size={24} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {!selectedRestaurant && (
        <View style={styles.tabContainer}>
          <Text style={styles.tabTitle}>Select a Restaurant</Text>
          <TouchableOpacity onPress={() => setShowAddModal(true)}>
            <Ionicons name="add-circle" size={24} color={Colors.greenFresh} />
          </TouchableOpacity>
        </View>
      )}

      {selectedRestaurant && (
        <View style={styles.tabContainer}>
          <Text style={styles.tabTitle}>Incoming Orders</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={() => router.push(`/(vendor)/menu-manager?restaurantId=${selectedRestaurant.restaurant_id}&restaurantName=${selectedRestaurant.name}`)}>
              <Ionicons name="book-outline" size={22} color={Colors.black} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => fetchOrders(selectedRestaurant.restaurant_id)}>
              <Ionicons name="refresh" size={22} color={Colors.greenFresh} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={Colors.greenFresh} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={selectedRestaurant ? orders : restaurants}
          keyExtractor={(item) => (selectedRestaurant ? item.order_id : item.restaurant_id).toString()}
          renderItem={selectedRestaurant ? renderOrder : renderRestaurant}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons 
                name={selectedRestaurant ? "clipboard-outline" : "restaurant-outline"} 
                size={60} color={Colors.grayBg} 
              />
              <Text style={styles.emptyText}>
                {selectedRestaurant 
                  ? "No orders right now." 
                  : "No restaurants yet.\nClick '+' to add your first one!"}
              </Text>
            </View>
          }
        />
      )}

      {/* Add Restaurant Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Outlet</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={Colors.black} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Restaurant Name</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g. Pizza Hut"
                value={newRest.name}
                onChangeText={(val) => setNewRest({...newRest, name: val})}
              />

              <Text style={styles.inputLabel}>Cuisine Type</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g. Italian, Fast Food"
                value={newRest.cuisine_type}
                onChangeText={(val) => setNewRest({...newRest, cuisine_type: val})}
              />

              <Text style={styles.inputLabel}>City</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g. Karachi"
                value={newRest.city}
                onChangeText={(val) => setNewRest({...newRest, city: val})}
              />

              <Text style={styles.inputLabel}>Street Address</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g. 123 Food Street"
                value={newRest.street_address}
                onChangeText={(val) => setNewRest({...newRest, street_address: val})}
              />

              <TouchableOpacity style={styles.saveBtn} onPress={handleAddRestaurant}>
                <Text style={styles.saveBtnText}>Create Restaurant</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  emptyText: { textAlign: 'center', marginTop: 15, color: Colors.gray, fontSize: 14, lineHeight: 20 },

  restCard: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.grayBg,
  },
  restName: { fontSize: 18, fontWeight: '800', color: Colors.black },
  restCuisine: { fontSize: 14, color: Colors.gray, marginTop: 4 },
  backBtn: { padding: 5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: Colors.black },
  inputLabel: { fontSize: 14, fontWeight: '700', color: Colors.gray, marginBottom: 8, marginTop: 15 },
  input: { 
    backgroundColor: Colors.offWhite, 
    borderRadius: 12, 
    padding: 15, 
    fontSize: 16, 
    borderWidth: 1, 
    borderColor: Colors.grayBg 
  },
  saveBtn: { 
    backgroundColor: Colors.greenFresh, 
    padding: 18, 
    borderRadius: 15, 
    alignItems: 'center', 
    marginTop: 30,
    marginBottom: 20
  },
  saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: '800' }
});
