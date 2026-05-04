import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ScrollView, Alert, TextInput, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, getSession } from '@/utils/api';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * FULL-SCREEN CHECKOUT (Clean Refactor)
 * Handles cart management, coupon application, and order placement.
 */
export default function CartScreen() {
  const router = useRouter();
  const [cart, setCart] = useState<any[]>([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    loadCheckoutData();
  }, []);

  const loadCheckoutData = async () => {
    try {
      const { customerId } = await getSession();
      const [cartStr, addrRes] = await Promise.all([
        AsyncStorage.getItem('CART'),
        fetch(`${API_URL}/customers/${customerId}/addresses`)
      ]);

      const cartData = cartStr ? JSON.parse(cartStr) : [];
      const addrData = await addrRes.json();

      setCart(cartData);
      setAddresses(addrData);
      if (addrData.length > 0) setSelectedAddress(addrData[0]);
    } catch (err) {
      console.error("Checkout Load Error", err);
    } finally {
      setLoading(false);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 150;
  const tax = subtotal * 0.05;
  const total = subtotal + deliveryFee + tax - discount;

  const applyCoupon = async () => {
    try {
      const res = await fetch(`${API_URL}/coupons/${couponCode}`);
      const data = await res.json();
      if (res.ok) {
        setDiscount(parseFloat(data.discount_amount));
        Alert.alert("Success", `Coupon applied! You saved Rs. ${data.discount_amount}`);
      } else {
        Alert.alert("Invalid Coupon", "This code is expired or incorrect.");
      }
    } catch (err) {
      Alert.alert("Error", "Could not validate coupon");
    }
  };

  const placeOrder = async () => {
    if (!selectedAddress) {
      Alert.alert("Error", "Please select a delivery address.");
      return;
    }
    if (cart.length === 0) return;

    setPlacingOrder(true);
    const { customerId } = await getSession();
    
    const orderData = {
      customer_id: customerId,
      restaurant_id: cart[0].restaurant_id,
      delivery_address_id: selectedAddress.address_id,
      special_instructions: instructions,
      payment_method: paymentMethod,
      total_amount: total,
      items: cart.map(item => ({
        menu_id: item.menu_id,
        quantity: item.quantity,
        unit_price: item.price
      }))
    };

    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      if (res.ok) {
        await AsyncStorage.removeItem('CART');
        Alert.alert("Order Placed!", "Your food is on the way.");
        router.replace('/(customer)/(tabs)/orders');
      }
    } catch (err) {
      Alert.alert("Order Failed", "Something went wrong. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color={Colors.greenFresh}/></View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Delivery Address */}
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <View style={styles.addressSection}>
          {addresses.length === 0 ? (
            <TouchableOpacity style={styles.emptyAddress} onPress={() => router.push('/(customer)/(tabs)/profile')}>
              <Text style={styles.emptyAddressText}>+ Add an address to continue</Text>
            </TouchableOpacity>
          ) : (
            addresses.map((addr: any) => (
              <TouchableOpacity 
                key={addr.address_id}
                style={[styles.addrCard, selectedAddress?.address_id === addr.address_id && styles.activeAddr]}
                onPress={() => setSelectedAddress(addr)}
              >
                <Ionicons 
                  name={selectedAddress?.address_id === addr.address_id ? "radio-button-on" : "radio-button-off"} 
                  size={20} color={selectedAddress?.address_id === addr.address_id ? Colors.greenFresh : Colors.gray} 
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.addrLabel}>{addr.label.toUpperCase()}</Text>
                  <Text style={styles.addrText}>{addr.street}, {addr.city}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Order Items Summary */}
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.itemsSection}>
          {cart.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemQty}>{item.quantity}x</Text>
              <Text style={styles.itemName}>{item.food_item || item.beverages || item.desserts}</Text>
              <Text style={styles.itemPrice}>Rs. {item.price * item.quantity}</Text>
            </View>
          ))}
        </View>

        {/* Coupon Section */}
        <View style={styles.couponBar}>
          <TextInput 
            placeholder="Promo Code" 
            style={styles.couponInput} 
            value={couponCode} 
            onChangeText={setCouponCode}
          />
          <TouchableOpacity style={styles.applyBtn} onPress={applyCoupon}>
            <Text style={styles.applyBtnText}>Apply</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Methods */}
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.payRow}>
          {['cash', 'credit_card', 'paypal'].map(m => (
            <TouchableOpacity 
              key={m} 
              style={[styles.payChip, paymentMethod === m && styles.activePay]}
              onPress={() => setPaymentMethod(m)}
            >
              <Text style={[styles.payText, paymentMethod === m && styles.activePayText]}>{m.replace('_',' ').toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bill Details */}
        <View style={styles.billBox}>
          <View style={styles.billRow}><Text style={styles.billLabel}>Subtotal</Text><Text style={styles.billVal}>Rs. {subtotal}</Text></View>
          <View style={styles.billRow}><Text style={styles.billLabel}>Delivery Fee</Text><Text style={styles.billVal}>Rs. {deliveryFee}</Text></View>
          <View style={styles.billRow}><Text style={styles.billLabel}>GST (5%)</Text><Text style={styles.billVal}>Rs. {tax.toFixed(0)}</Text></View>
          {discount > 0 && <View style={styles.billRow}><Text style={styles.promoLabel}>Discount Applied</Text><Text style={styles.promoVal}>- Rs. {discount}</Text></View>}
          <View style={[styles.billRow, { marginTop: 10, borderTopWidth: 1, borderColor: '#eee', paddingTop: 10 }]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalVal}>Rs. {total.toFixed(0)}</Text>
          </View>
        </View>

      </ScrollView>

      {/* Place Order Fixed Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.placeBtn, (placingOrder || cart.length === 0) && { opacity: 0.5 }]} 
          onPress={placeOrder}
          disabled={placingOrder || cart.length === 0}
        >
          <Text style={styles.placeBtnText}>{placingOrder ? "Placing Order..." : `Place Order • Rs. ${total.toFixed(0)}`}</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 20, height: 60 
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  scroll: { padding: 20, paddingBottom: 150 },
  
  sectionTitle: { fontSize: 16, fontWeight: '800', marginTop: 25, marginBottom: 15, color: Colors.black },
  
  addressSection: { gap: 10 },
  addrCard: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.offWhite, 
    padding: 15, borderRadius: 16, borderWidth: 1, borderColor: Colors.grayBg 
  },
  activeAddr: { borderColor: Colors.greenFresh, backgroundColor: '#F0FFF4' },
  addrLabel: { fontSize: 10, fontWeight: '900', color: Colors.greenForest },
  addrText: { fontSize: 14, fontWeight: '600' },
  emptyAddress: { padding: 20, borderStyle: 'dashed', borderWidth: 2, borderColor: Colors.grayBg, borderRadius: 15, alignItems: 'center' },
  emptyAddressText: { color: Colors.greenForest, fontWeight: '700' },

  itemsSection: { backgroundColor: Colors.offWhite, borderRadius: 16, padding: 15 },
  itemRow: { flexDirection: 'row', marginBottom: 10, alignItems: 'center' },
  itemQty: { width: 30, fontWeight: '800', color: Colors.greenFresh },
  itemName: { flex: 1, fontSize: 14, fontWeight: '600' },
  itemPrice: { fontWeight: '700' },

  couponBar: { flexDirection: 'row', marginTop: 20, gap: 10 },
  couponInput: { flex: 1, backgroundColor: Colors.offWhite, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: Colors.grayBg },
  applyBtn: { backgroundColor: Colors.black, paddingHorizontal: 20, justifyContent: 'center', borderRadius: 12 },
  applyBtnText: { color: '#fff', fontWeight: '700' },

  payRow: { flexDirection: 'row', gap: 10 },
  payChip: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.offWhite },
  activePay: { backgroundColor: Colors.greenFresh },
  payText: { fontSize: 12, fontWeight: '700', color: Colors.gray },
  activePayText: { color: '#fff' },

  billBox: { marginTop: 30, backgroundColor: Colors.offWhite, borderRadius: 20, padding: 20 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  billLabel: { color: Colors.gray },
  billVal: { fontWeight: '600' },
  promoLabel: { color: Colors.greenForest, fontWeight: '700' },
  promoVal: { color: Colors.greenForest, fontWeight: '700' },
  totalLabel: { fontSize: 18, fontWeight: '900' },
  totalVal: { fontSize: 18, fontWeight: '900', color: Colors.black },

  footer: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderColor: Colors.grayBg 
  },
  placeBtn: { backgroundColor: Colors.black, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  placeBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});
