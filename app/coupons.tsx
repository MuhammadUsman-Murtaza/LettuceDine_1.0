import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Platform, SafeAreaView,
  FlatList, TouchableOpacity, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

interface Coupon {
  coupon_id: number;
  code: string;
  discount_amount: string;
  expiry_date: string;
  min_order_value: string;
}

export default function CouponsScreen() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}/coupons`)
      .then(res => res.json())
      .then(data => {
        setCoupons(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🎟️ Coupons & Offers</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.greenForest} />
        </View>
      ) : (
        <FlatList
          data={coupons}
          keyExtractor={item => item.coupon_id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No active coupons right now.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={styles.iconWrap}>
                  <Text style={styles.iconEmoji}>💰</Text>
                </View>
                <View>
                  <Text style={styles.codeText}>{item.code}</Text>
                  <Text style={[styles.descText, { color: '#007AFF', fontWeight: '600' }]}>
                    Min. Order: PKR {Number(item.min_order_value).toFixed(2)}
                  </Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.discountText}>PKR {Number(item.discount_amount).toFixed(2)}</Text>
                <Text style={styles.offText}>OFF</Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.offWhite },
  header: { 
    backgroundColor: Colors.greenForest, 
    flexDirection: 'row', alignItems: 'center', 
    paddingTop: Platform.OS === 'android' ? 40 : 12, 
    paddingBottom: 16, paddingHorizontal: 16, gap: 12 
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.black, textAlign: 'center' },
  
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: Spacing.screenMargin, paddingBottom: 40 },
  
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.greenLight, alignItems: 'center', justifyContent: 'center' },
  iconEmoji: { fontSize: 20 },
  codeText: { fontSize: 16, fontWeight: '700', color: Colors.black, textTransform: 'uppercase' },
  descText: { fontSize: 13, color: Colors.gray, marginTop: 4 },
  
  cardRight: { alignItems: 'flex-end' },
  discountText: { fontSize: 22, fontWeight: '800', color: Colors.greenFresh },
  offText: { fontSize: 12, fontWeight: '600', color: Colors.charcoal },

  empty: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: Colors.gray, fontSize: 15 },
});
