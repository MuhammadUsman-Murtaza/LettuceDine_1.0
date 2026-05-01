import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Platform, SafeAreaView,
  ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { IconPhone } from '@/components/icons/IconPhone';
import { IconChat } from '@/components/icons/IconChat';
import { IconLocationPin } from '@/components/icons/IconLocationPin';

const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
const CUSTOMER_ID = 1;

interface Customer {
  customer_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_num: string;
}

interface Address {
  address_id: number;
  street: string;
  city: string;
  zip_code: string;
  label: string;
}

const MENU_ITEMS = [
  { icon: '📦', label: 'My Orders',        route: '/explore' as const },
  { icon: '🎟️', label: 'Coupons & Offers', route: '/coupons' as const },
  { icon: '💳', label: 'Payment Methods',  route: '/payments' as const },
];

export default function ProfileScreen() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Address Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [newAddress, setNewAddress] = useState({ street: '', city: '', province: '', zip_code: '', label: 'home' });

  const fetchAddresses = async () => {
    try {
      const res = await fetch(`${BASE_URL}/customers/${CUSTOMER_ID}/addresses`);
      const data = await res.json();
      setAddresses(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.street || !newAddress.city || !newAddress.zip_code) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/customers/${CUSTOMER_ID}/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAddress)
      });
      if (res.ok) {
        fetchAddresses();
        setModalVisible(false);
        setNewAddress({ street: '', city: '', province: '', zip_code: '', label: 'home' });
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to add address');
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (Platform.OS === 'web') {
      const confirm = window.confirm('Are you sure you want to remove this address?');
      if (!confirm) return;
      try {
        const res = await fetch(`${BASE_URL}/customers/${CUSTOMER_ID}/addresses/${id}`, { method: 'DELETE' });
        if (res.ok) setAddresses(prev => prev.filter(a => a.address_id !== id));
      } catch (err) {
        console.error(err);
      }
      return;
    }

    Alert.alert('Delete Address', 'Are you sure you want to remove this address?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const res = await fetch(`${BASE_URL}/customers/${CUSTOMER_ID}/addresses/${id}`, { method: 'DELETE' });
            if (res.ok) {
              setAddresses(prev => prev.filter(a => a.address_id !== id));
            }
          } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to delete address');
          }
        }
      }
    ]);
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirm = window.confirm('Are you sure you want to log out of your account?');
      if (confirm) router.replace('/login' as any);
      return;
    }

    Alert.alert(
      "Log Out",
      "Are you sure you want to log out of your account?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: "destructive",
          onPress: () => {
            // Clears any local auth states here
            router.replace('/login' as any);
          }
        }
      ]
    );
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [cRes, aRes] = await Promise.all([
          fetch(`${BASE_URL}/customers/${CUSTOMER_ID}`),
          fetch(`${BASE_URL}/customers/${CUSTOMER_ID}/addresses`),
        ]);
        if (cRes.ok) setCustomer(await cRes.json());
        if (aRes.ok) setAddresses(await aRes.json());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ marginTop: 80 }} size="large" color={Colors.greenFresh} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero Banner */}
        <View style={styles.hero}>
          <Text style={styles.heroName}>{customer?.first_name} {customer?.last_name}</Text>
          <Text style={styles.heroEmail}>{customer?.email}</Text>

          {/* Contact chips */}
          <View style={styles.contactRow}>
            {customer?.phone_num && (
              <View style={styles.contactChip}>
                <IconPhone size={14} color={Colors.black} />
                <Text style={styles.contactText}>{customer.phone_num}</Text>
              </View>
            )}
            {customer?.email && (
              <View style={styles.contactChip}>
                <IconChat size={14} color={Colors.black} />
                <Text style={styles.contactText}>Chat</Text>
              </View>
            )}
          </View>
        </View>

        {/* Saved Addresses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📍 Saved Addresses</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Text style={styles.sectionAction}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {addresses.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>No addresses saved yet</Text>
            </View>
          ) : (
            addresses.map(addr => (
              <View 
                key={addr.address_id} 
                style={styles.addressCard}
              >
                <View style={styles.addressIconWrap}>
                  <IconLocationPin size={20} color={Colors.greenForest} />
                </View>
                <View style={styles.addressInfo}>
                  {addr.label && <Text style={styles.addressLabel}>{addr.label}</Text>}
                  <Text style={styles.addressText} numberOfLines={1}>
                    {[addr.street, addr.city, addr.zip_code].filter(Boolean).join(', ')}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteAddress(addr.address_id)} style={{ padding: 8 }}>
                  <Ionicons name="trash-outline" size={20} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuCard}>
            {MENU_ITEMS.map((item, i) => (
              <React.Fragment key={item.label}>
                <TouchableOpacity
                  style={styles.menuRow}
                  onPress={() => item.route && router.push(item.route)}
                  activeOpacity={0.7}>
                  <View style={styles.menuIconWrap}>
                    <Text style={styles.menuEmoji}>{item.icon}</Text>
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.grayLight} />
                </TouchableOpacity>
                {i < MENU_ITEMS.length - 1 && <View style={styles.menuDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Log Out */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.white} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* App version */}
        <Text style={styles.version}>LettuceDine v1.0.0 🥬</Text>
      </ScrollView>

      {/* Add Address Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Address</Text>
            
            <View style={styles.inputWrap}>
              <Text style={styles.label}>Label</Text>
              <View style={styles.labelRow}>
                {['home', 'work', 'others'].map(opt => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.labelOption, newAddress.label === opt && styles.labelOptionSelected]}
                    onPress={() => setNewAddress({...newAddress, label: opt})}>
                    <Text style={[styles.labelOptionText, newAddress.label === opt && styles.labelOptionTextSelected]}>
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.inputWrap}>
              <Text style={styles.label}>Street Address *</Text>
              <TextInput style={styles.input} value={newAddress.street} onChangeText={t => setNewAddress({...newAddress, street: t})} />
            </View>
            <View style={styles.inputWrap}>
              <Text style={styles.label}>City *</Text>
              <TextInput style={styles.input} value={newAddress.city} onChangeText={t => setNewAddress({...newAddress, city: t})} />
            </View>
            <View style={styles.row}>
              <View style={[styles.inputWrap, {flex: 1}]}>
                <Text style={styles.label}>Province</Text>
                <TextInput style={styles.input} value={newAddress.province} onChangeText={t => setNewAddress({...newAddress, province: t})} />
              </View>
              <View style={[styles.inputWrap, {flex: 1}]}>
                <Text style={styles.label}>Zip Code *</Text>
                <TextInput style={styles.input} value={newAddress.zip_code} onChangeText={t => setNewAddress({...newAddress, zip_code: t})} />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddAddress}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.offWhite },
  scroll: { paddingBottom: 40 },

  // Hero
  hero: {
    backgroundColor: Colors.greenForest,
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 44 : 20,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: Colors.greenForest,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  heroName: { fontSize: 22, fontWeight: '800', color: Colors.black, marginBottom: 4 },
  heroEmail: { fontSize: 13, color: Colors.charcoal, marginBottom: 14 },
  contactRow: { flexDirection: 'row', gap: 10 },
  contactChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  contactText: { color: Colors.black, fontSize: 12, fontWeight: '500' },

  // Section
  section: { paddingHorizontal: Spacing.screenMargin, paddingTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.black },
  sectionAction: { fontSize: 14, fontWeight: '600', color: Colors.greenFresh },

  // Address
  emptyCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, alignItems: 'center' },
  emptyCardText: { color: Colors.gray, fontSize: 14 },
  addressCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white, borderRadius: 14, padding: 14,
    marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  addressIconWrap: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: Colors.greenLight,
    alignItems: 'center', justifyContent: 'center',
  },
  addressInfo: { flex: 1 },
  addressLabel: { fontSize: 12, fontWeight: '700', color: Colors.greenForest, marginBottom: 2, textTransform: 'capitalize' },
  addressText: { fontSize: 13, color: Colors.charcoal },

  // Menu
  menuCard: {
    backgroundColor: Colors.white, borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  menuIconWrap: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: Colors.greenLight,
    alignItems: 'center', justifyContent: 'center',
  },
  menuEmoji: { fontSize: 18 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.black },
  menuDivider: { height: 1, backgroundColor: Colors.grayBg, marginLeft: 68 },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: Spacing.screenMargin, marginTop: 24,
    backgroundColor: Colors.danger, borderRadius: 50,
    paddingVertical: 14,
  },
  logoutText: { fontSize: 16, fontWeight: '700', color: Colors.white },

  // Version
  version: { textAlign: 'center', color: Colors.grayLight, fontSize: 12, marginTop: 20 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.black, marginBottom: 20 },
  inputWrap: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.charcoal, marginBottom: 6 },
  input: { backgroundColor: Colors.offWhite, borderWidth: 1, borderColor: Colors.grayBg, borderRadius: 12, paddingHorizontal: 16, height: 48, fontSize: 15, color: Colors.black },
  labelRow: { flexDirection: 'row', gap: 10 },
  labelOption: {
    flex: 1, height: 44, borderRadius: 12,
    backgroundColor: '#E3F2FD',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  labelOptionSelected: {
    backgroundColor: '#1E88E5',
    borderColor: '#1565C0',
  },
  labelOptionText: { fontSize: 14, fontWeight: '600', color: '#1E88E5' },
  labelOptionTextSelected: { color: Colors.white },
  row: { flexDirection: 'row', gap: 12 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, height: 52, borderRadius: 16, backgroundColor: Colors.grayBg, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { color: Colors.charcoal, fontSize: 16, fontWeight: '700' },
  saveBtn: { flex: 2, height: 52, borderRadius: 16, backgroundColor: Colors.greenForest, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: Colors.black, fontSize: 16, fontWeight: '700' },
});
