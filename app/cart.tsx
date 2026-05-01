import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Platform, SafeAreaView,
  TouchableOpacity, ScrollView, TextInput, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { IconCart } from '@/components/icons/IconCart';
import { IconLocationPin } from '@/components/icons/IconLocationPin';

const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
const CUSTOMER_ID = 1; // TODO: replace with real auth

const PAYMENT_METHODS = ['Cash', 'Card', 'JazzCash', 'EasyPaisa'];

export default function CartScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ restaurantId: string; restaurantName: string; cart: string }>();
  const cartData: { [key: number]: number } = params.cart ? JSON.parse(params.cart) : {};

  const [coupon, setCoupon] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [instructions, setInstructions] = useState('');
  const [placing, setPlacing] = useState(false);

  // Build items list from cart object
  const cartEntries = Object.entries(cartData).map(([menuId, qty]) => ({
    menu_id: parseInt(menuId),
    quantity: qty,
    unit_price: 500, // placeholder; in real use, pass price data too
  }));

  const subtotal = cartEntries.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const deliveryFee = 50;
  const total = subtotal + deliveryFee - couponDiscount;

  const handleApplyCoupon = async () => {
    if (!coupon.trim()) return;
    try {
      const res = await fetch(`${BASE_URL}/coupons/${coupon.trim()}`);
      if (res.ok) {
        const data = await res.json();
        if (subtotal >= (data.min_order_value || 0)) {
          setCouponDiscount(data.discount_amount);
          setCouponApplied(true);
        } else {
          Alert.alert('Coupon Error', `Minimum order value is PKR ${data.min_order_value}`);
        }
      } else {
        Alert.alert('Invalid Coupon', 'This coupon is invalid or expired.');
      }
    } catch {
      Alert.alert('Error', 'Could not validate coupon.');
    }
  };

  const handlePlaceOrder = async () => {
    setPlacing(true);
    try {
      const body = {
        customer_id: CUSTOMER_ID,
        restaurant_id: parseInt(params.restaurantId),
        address_id: 1, // TODO: let user pick address
        special_instructions: instructions,
        coupon_code: couponApplied ? coupon : null,
        payment_method: paymentMethod,
        items: cartEntries,
      };
      const res = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        router.replace({ pathname: '/order/[id]', params: { id: data.order_id } } as any);
      } else {
        Alert.alert('Order Failed', 'Please try again.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not place order.');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.black} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <IconCart size={20} color={Colors.black} />
          <Text style={styles.headerTitle}>Your Cart</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Restaurant name */}
        <View style={styles.restRow}>
          <Text style={styles.restLabel}>From:</Text>
          <Text style={styles.restName}>{params.restaurantName}</Text>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛒 Items</Text>
          {cartEntries.map(item => (
            <View key={item.menu_id} style={styles.itemRow}>
              <View style={styles.itemBadge}><Text style={styles.itemBadgeText}>{item.quantity}×</Text></View>
              <Text style={styles.itemName}>Menu Item #{item.menu_id}</Text>
              <Text style={styles.itemPrice}>PKR {(item.unit_price * item.quantity).toLocaleString()}</Text>
            </View>
          ))}
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Delivery Address</Text>
          <TouchableOpacity style={styles.addressCard}>
            <IconLocationPin size={18} color={Colors.greenForest} />
            <Text style={styles.addressText}>House 12, DHA Phase 5, Karachi</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.gray} />
          </TouchableOpacity>
        </View>

        {/* Coupon */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎟️ Coupon Code</Text>
          <View style={styles.couponRow}>
            <TextInput
              style={styles.couponInput}
              placeholder="Enter coupon code…"
              placeholderTextColor={Colors.grayLight}
              value={coupon}
              onChangeText={setCoupon}
              autoCapitalize="characters"
              editable={!couponApplied}
            />
            <TouchableOpacity
              style={[styles.applyBtn, couponApplied && styles.appliedBtn]}
              onPress={handleApplyCoupon}
              disabled={couponApplied}>
              <Text style={styles.applyBtnText}>{couponApplied ? '✅ Applied' : 'Apply'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💳 Payment Method</Text>
          <View style={styles.paymentRow}>
            {PAYMENT_METHODS.map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.payChip, paymentMethod === m && styles.payChipActive]}
                onPress={() => setPaymentMethod(m)}>
                <Text style={[styles.payChipText, paymentMethod === m && styles.payChipTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Special Instructions</Text>
          <TextInput
            style={styles.instructInput}
            placeholder="Any special requests for the kitchen…"
            placeholderTextColor={Colors.grayLight}
            value={instructions}
            onChangeText={setInstructions}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal</Text><Text style={styles.summaryVal}>PKR {subtotal.toLocaleString()}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Delivery Fee</Text><Text style={styles.summaryVal}>PKR {deliveryFee}</Text></View>
          {couponDiscount > 0 && (
            <View style={styles.summaryRow}><Text style={[styles.summaryLabel, { color: Colors.greenFresh }]}>Discount</Text><Text style={[styles.summaryVal, { color: Colors.greenFresh }]}>– PKR {couponDiscount.toLocaleString()}</Text></View>
          )}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalVal}>PKR {total.toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.placeBtn} onPress={handlePlaceOrder} disabled={placing}>
          <Text style={styles.placeBtnText}>{placing ? 'Placing Order…' : `✅ Place Order  •  PKR ${total.toLocaleString()}`}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.offWhite },
  header: { backgroundColor: Colors.greenForest, flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'android' ? 40 : 12, paddingBottom: 16, paddingHorizontal: 16, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.black },

  scroll: { padding: 16, paddingBottom: 100 },

  restRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, backgroundColor: Colors.greenLight, borderRadius: 12, padding: 12 },
  restLabel: { fontSize: 13, color: Colors.gray },
  restName: { fontSize: 15, fontWeight: '700', color: Colors.greenForest, flex: 1 },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.black, marginBottom: 10 },

  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.white, borderRadius: 12, padding: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  itemBadge: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.greenForest, alignItems: 'center', justifyContent: 'center' },
  itemBadgeText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  itemName: { flex: 1, fontSize: 14, color: Colors.charcoal },
  itemPrice: { fontSize: 14, fontWeight: '700', color: Colors.greenForest },

  addressCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.white, borderRadius: 12, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  addressText: { flex: 1, fontSize: 14, color: Colors.charcoal },

  couponRow: { flexDirection: 'row', gap: 10 },
  couponInput: { flex: 1, backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 14, height: 46, fontSize: 14, color: Colors.black, borderWidth: 1.5, borderColor: Colors.greenMint },
  applyBtn: { backgroundColor: Colors.black, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  appliedBtn: { backgroundColor: Colors.greenFresh },
  applyBtnText: { color: Colors.white, fontSize: 14, fontWeight: '700' },

  paymentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  payChip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: Colors.grayBg, borderWidth: 1.5, borderColor: 'transparent' },
  payChipActive: { backgroundColor: Colors.greenLight, borderColor: Colors.greenForest },
  payChipText: { fontSize: 13, fontWeight: '600', color: Colors.charcoal },
  payChipTextActive: { color: Colors.greenForest },

  instructInput: { backgroundColor: Colors.white, borderRadius: 12, padding: 14, fontSize: 14, color: Colors.black, borderWidth: 1.5, borderColor: Colors.greenMint, textAlignVertical: 'top', minHeight: 80 },

  summaryCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: Colors.black, marginBottom: 14 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 14, color: Colors.gray },
  summaryVal: { fontSize: 14, color: Colors.charcoal, fontWeight: '500' },
  divider: { height: 1, backgroundColor: Colors.grayBg, marginVertical: 10 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: Colors.black },
  totalVal: { fontSize: 16, fontWeight: '700', color: Colors.greenForest },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: Colors.offWhite, borderTopWidth: 1, borderTopColor: Colors.grayBg },
  placeBtn: { backgroundColor: Colors.greenForest, borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowColor: Colors.greenForest, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  placeBtnText: { color: Colors.black, fontSize: 16, fontWeight: '700' },
});
