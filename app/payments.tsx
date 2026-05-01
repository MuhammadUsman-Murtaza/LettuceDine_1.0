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
const CUSTOMER_ID = 1; // Assuming hardcoded for now, like in profile

interface PaymentData {
  history: string[];
  available: string[];
}

export default function PaymentsScreen() {
  const router = useRouter();
  const [data, setData] = useState<PaymentData>({ history: [], available: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}/customers/${CUSTOMER_ID}/payments`)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const renderIcon = (method: string) => {
    if (method.includes('card')) return '💳';
    if (method.includes('paypal')) return '🅿️';
    if (method.includes('cash')) return '💵';
    if (method.includes('crypto')) return '₿';
    return '💰';
  };

  const formatMethod = (method: string) => {
    return method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💳 Payment Methods</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.greenForest} />
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Available Methods</Text>
          <View style={styles.cardGroup}>
            {data.available.map((method, index) => (
              <View key={method} style={[styles.methodCard, index < data.available.length - 1 && styles.borderBottom]}>
                <View style={styles.methodLeft}>
                  <Text style={styles.methodEmoji}>{renderIcon(method)}</Text>
                  <Text style={styles.methodName}>{formatMethod(method)}</Text>
                </View>
                {data.history.includes(method) ? (
                  <View style={styles.badgeWrap}>
                    <Text style={styles.badgeText}>Used Before</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        </View>
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
  content: { padding: Spacing.screenMargin, paddingTop: 24 },
  
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.charcoal, marginBottom: 12 },
  
  cardGroup: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayBg,
  },
  methodLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  methodEmoji: { fontSize: 20 },
  methodName: { fontSize: 15, fontWeight: '600', color: Colors.black },
  
  badgeWrap: {
    backgroundColor: Colors.greenMint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: Colors.greenFresh },
});
