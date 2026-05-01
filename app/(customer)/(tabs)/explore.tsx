import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, StyleSheet, Platform, 
  ActivityIndicator, TouchableOpacity 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const debuggerHost = Constants.expoConfig?.hostUri?.split(':').shift();
const BASE_URL = Platform.OS === 'android' ? `http://${debuggerHost}:3000` : 'http://localhost:3000';

export default function ExploreScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('CUSTOMER_ID').then(id => {
      if (id) fetchOrders(id);
      else setLoading(false);
    });
  }, []);

  const fetchOrders = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/customers/${id}/orders`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const renderOrder = ({ item }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.resName}>{item.restaurant_name}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.date}>{new Date(item.order_date).toLocaleDateString()}</Text>
      <Text style={styles.amount}>Rs. {item.total_amount}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
      </View>
      {loading ? (
        <ActivityIndicator style={{marginTop: 50}} color={Colors.greenFresh} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item.order_id.toString()}
          renderItem={renderOrder}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No orders yet 🥙</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.offWhite },
  header: { padding: 20, backgroundColor: Colors.greenForest, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.black },
  list: { padding: 20 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 15, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  resName: { fontSize: 16, fontWeight: '700' },
  statusBadge: { backgroundColor: Colors.greenLight, padding: 5, borderRadius: 5 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  date: { fontSize: 12, color: Colors.gray, marginTop: 5 },
  amount: { fontSize: 14, fontWeight: 'bold', marginTop: 5, color: Colors.greenFresh },
  empty: { textAlign: 'center', marginTop: 50, color: Colors.gray }
});
