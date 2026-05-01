import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Platform, SafeAreaView,
  TouchableOpacity, ScrollView, Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { IconPhone } from '@/components/icons/IconPhone';
import { IconChat } from '@/components/icons/IconChat';

const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

const STATUS_STEPS = [
  { key: 'Pending',     label: 'Confirmed',   emoji: '✅' },
  { key: 'Preparing',  label: 'Preparing',   emoji: '👨‍🍳' },
  { key: 'On the Way', label: 'On the Way',  emoji: '🚴' },
  { key: 'Delivered',  label: 'Delivered',   emoji: '🎉' },
];

interface OrderDetail {
  order_id: number;
  order_date: string;
  total_amount: number;
  status: string;
  special_instructions: string | null;
  restaurant_name: string;
  street: string;
  city: string;
  payment_method: string;
  driver_name: string | null;
  vehicle_type: string | null;
  items: Array<{ item_name: string; quantity: number; unit_price: number; line_total: number }>;
}

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`${BASE_URL}/orders/${id}`);
        const data = await res.json();
        setOrder(data);
        const stepIdx = STATUS_STEPS.findIndex(s => s.key === data.status);
        Animated.timing(progressAnim, {
          toValue: stepIdx >= 0 ? stepIdx / (STATUS_STEPS.length - 1) : 0,
          duration: 800,
          useNativeDriver: false,
        }).start();
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchOrder();
    const interval = setInterval(fetchOrder, 15000); // poll every 15s
    return () => clearInterval(interval);
  }, [id]);

  const activeStepIdx = order ? STATUS_STEPS.findIndex(s => s.key === order.status) : -1;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📦 Order #{id}</Text>
        <View style={{ width: 36 }} />
      </View>

      {!order ? (
        <View style={styles.center}><Text style={styles.loadText}>Loading order…</Text></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Status Stepper */}
          <View style={styles.stepperCard}>
            <Text style={styles.stepperTitle}>Order Status</Text>
            <View style={styles.stepperTrack}>
              {STATUS_STEPS.map((step, i) => {
                const done = i <= activeStepIdx;
                const active = i === activeStepIdx;
                return (
                  <View key={step.key} style={styles.stepWrapper}>
                    <View style={[styles.stepCircle, done && styles.stepCircleDone, active && styles.stepCircleActive]}>
                      <Text style={styles.stepEmoji}>{step.emoji}</Text>
                    </View>
                    <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>{step.label}</Text>
                    {i < STATUS_STEPS.length - 1 && (
                      <View style={styles.stepLineWrap}>
                        <View style={styles.stepLineBase} />
                        {i < activeStepIdx && <View style={styles.stepLineFill} />}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Driver Card */}
          {order.driver_name && (
            <View style={styles.driverCard}>
              <View style={styles.driverAvatarWrap}>
                <Text style={styles.driverAvatar}>🚴</Text>
              </View>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{order.driver_name}</Text>
                <Text style={styles.driverVehicle}>{order.vehicle_type ?? 'Motorcycle'}</Text>
              </View>
              <View style={styles.driverActions}>
                <TouchableOpacity style={styles.driverBtn}>
                  <IconPhone size={20} color={Colors.greenForest} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.driverBtn}>
                  <IconChat size={20} color={Colors.greenForest} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Order Info */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>🏢 {order.restaurant_name}</Text>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={15} color={Colors.gray} />
              <Text style={styles.infoText}>{[order.street, order.city].filter(Boolean).join(', ')}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="card-outline" size={15} color={Colors.gray} />
              <Text style={styles.infoText}>{order.payment_method}</Text>
            </View>
            {order.special_instructions && (
              <View style={styles.infoRow}>
                <Ionicons name="document-text-outline" size={15} color={Colors.gray} />
                <Text style={styles.infoText}>{order.special_instructions}</Text>
              </View>
            )}
          </View>

          {/* Items */}
          {order.items?.length > 0 && (
            <View style={styles.itemsCard}>
              <Text style={styles.itemsTitle}>🛒 Your Order</Text>
              {order.items.map((item, i) => (
                <View key={i} style={styles.itemRow}>
                  <Text style={styles.itemName}>{item.item_name}</Text>
                  <Text style={styles.itemQty}>{item.quantity}×</Text>
                  <Text style={styles.itemPrice}>PKR {Number(item.line_total).toLocaleString()}</Text>
                </View>
              ))}
              <View style={styles.itemDivider} />
              <View style={styles.itemRow}>
                <Text style={styles.totalLabel}>Total Paid</Text>
                <Text style={styles.totalVal}>PKR {Number(order.total_amount).toLocaleString()}</Text>
              </View>
            </View>
          )}

          {/* Delivered CTA */}
          {order.status === 'Delivered' && (
            <TouchableOpacity style={styles.reviewCta} onPress={() => router.push({ pathname: '/review', params: { orderId: id, restaurantName: order.restaurant_name } } as any)}>
              <Text style={styles.reviewCtaText}>⭐ Rate Your Experience</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.offWhite },
  header: { backgroundColor: Colors.greenForest, flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'android' ? 40 : 12, paddingBottom: 16, paddingHorizontal: 16, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: Colors.black, textAlign: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadText: { color: Colors.gray, fontSize: 15 },
  scroll: { padding: 16, paddingBottom: 40 },

  stepperCard: { backgroundColor: Colors.white, borderRadius: 18, padding: 20, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  stepperTitle: { fontSize: 15, fontWeight: '700', color: Colors.black, marginBottom: 20 },
  stepperTrack: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  stepWrapper: { flex: 1, alignItems: 'center' },
  stepCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.grayBg, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  stepCircleDone: { backgroundColor: Colors.greenLight },
  stepCircleActive: { backgroundColor: Colors.greenForest },
  stepEmoji: { fontSize: 18 },
  stepLabel: { fontSize: 10, color: Colors.gray, textAlign: 'center', lineHeight: 13 },
  stepLabelDone: { color: Colors.greenForest, fontWeight: '600' },
  stepLineWrap: { position: 'absolute', top: 21, left: '50%', right: '-50%', height: 3 },
  stepLineBase: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.grayBg, borderRadius: 2 },
  stepLineFill: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.greenFresh, borderRadius: 2 },

  driverCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  driverAvatarWrap: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.greenLight, alignItems: 'center', justifyContent: 'center' },
  driverAvatar: { fontSize: 26 },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 15, fontWeight: '700', color: Colors.black },
  driverVehicle: { fontSize: 12, color: Colors.gray },
  driverActions: { flexDirection: 'row', gap: 10 },
  driverBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.greenLight, alignItems: 'center', justifyContent: 'center' },

  infoCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  infoTitle: { fontSize: 15, fontWeight: '700', color: Colors.black, marginBottom: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  infoText: { fontSize: 13, color: Colors.charcoal, flex: 1 },

  itemsCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  itemsTitle: { fontSize: 15, fontWeight: '700', color: Colors.black, marginBottom: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  itemName: { flex: 1, fontSize: 13, color: Colors.charcoal },
  itemQty: { fontSize: 13, color: Colors.gray, marginRight: 10 },
  itemPrice: { fontSize: 13, fontWeight: '600', color: Colors.black },
  itemDivider: { height: 1, backgroundColor: Colors.grayBg, marginVertical: 8 },
  totalLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.black },
  totalVal: { fontSize: 15, fontWeight: '700', color: Colors.greenForest },

  reviewCta: { backgroundColor: Colors.greenForest, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  reviewCtaText: { color: Colors.black, fontSize: 16, fontWeight: '700' },
});
