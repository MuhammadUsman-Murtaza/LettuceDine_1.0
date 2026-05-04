import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import Constants from 'expo-constants';

const debuggerHost = Constants.expoConfig?.hostUri?.split(':').shift();
const BASE_URL = Platform.OS === 'android' ? `http://${debuggerHost}:3000` : 'http://localhost:3000';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}/orders/${id}`)
      .then(res => res.json())
      .then(data => {
        setOrder(data);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} color={Colors.greenFresh} />;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(customer)/(tabs)')} style={styles.backBtn}>
          <Ionicons name="home" size={22} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Status</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.orderId}>Order #{id}</Text>
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>{order?.status?.toUpperCase() || 'PENDING'}</Text>
        </View>
        <Text style={styles.restaurant}>{order?.restaurant_name}</Text>
        <Text style={styles.total}>Total: PKR {order?.total_amount}</Text>
      </View>

      <TouchableOpacity style={styles.refreshBtn} onPress={() => setLoading(true)}>
        <Text style={styles.refreshText}>Refresh Status</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.offWhite },
  header: { padding: 20, backgroundColor: Colors.greenForest, flexDirection: 'row', alignItems: 'center', gap: 15 },
  backBtn: { backgroundColor: 'rgba(0,0,0,0.06)', padding: 8, borderRadius: 10 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  card: { margin: 20, padding: 30, backgroundColor: '#fff', borderRadius: 20, alignItems: 'center', elevation: 5 },
  orderId: { fontSize: 14, color: Colors.gray, fontWeight: '700' },
  statusBox: { backgroundColor: Colors.greenLight, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginVertical: 20 },
  statusText: { fontSize: 20, fontWeight: '900', color: Colors.greenForest },
  restaurant: { fontSize: 18, fontWeight: '700' },
  total: { fontSize: 16, marginTop: 10, color: Colors.gray },
  refreshBtn: { margin: 20, backgroundColor: Colors.black, padding: 18, borderRadius: 15, alignItems: 'center' },
  refreshText: { color: '#fff', fontWeight: 'bold' }
});
