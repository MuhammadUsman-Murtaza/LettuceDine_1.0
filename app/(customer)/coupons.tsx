import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const debuggerHost = Constants.expoConfig?.hostUri?.split(':').shift();
const BASE_URL = Platform.OS === 'android' ? `http://${debuggerHost}:3000` : 'http://localhost:3000';

export default function CouponsScreen() {
  const router = useRouter();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}/coupons`)
      .then(res => res.json())
      .then(data => {
        setCoupons(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.title}>Coupons & Offers</Text>
      </View>
      
      {loading ? <ActivityIndicator style={{marginTop: 50}} color={Colors.greenFresh} /> : (
        <FlatList
          data={coupons}
          keyExtractor={(item: any) => item.coupon_id.toString()}
          renderItem={({ item }: any) => (
            <View style={styles.card}>
              <Text style={styles.code}>{item.code}</Text>
              <Text style={styles.desc}>PKR {item.discount_amount} OFF</Text>
              <Text style={styles.min}>Min. Order: PKR {item.min_order_value}</Text>
            </View>
          )}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 50, color: Colors.gray}}>No coupons available.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.offWhite },
  header: { padding: 20, backgroundColor: Colors.greenForest, flexDirection: 'row', alignItems: 'center', gap: 15 },
  backBtn: { backgroundColor: 'rgba(0,0,0,0.06)', padding: 8, borderRadius: 10 },
  title: { fontSize: 20, fontWeight: '800' },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 15, marginBottom: 15, borderLeftWidth: 5, borderLeftColor: Colors.greenFresh },
  code: { fontSize: 18, fontWeight: '900', color: Colors.black },
  desc: { fontSize: 16, fontWeight: '700', color: Colors.greenFresh, marginTop: 5 },
  min: { fontSize: 12, color: Colors.gray, marginTop: 5 }
});
