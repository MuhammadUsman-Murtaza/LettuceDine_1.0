import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Platform, SafeAreaView,
  ScrollView, TouchableOpacity, ActivityIndicator,
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
  name: string;
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
  { icon: '🎟️', label: 'Coupons & Offers', route: null },
  { icon: '💳', label: 'Payment Methods',  route: null },
  { icon: '🔔', label: 'Notifications',    route: null },
  { icon: '❓', label: 'Help & Support',   route: null },
];

export default function ProfileScreen() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

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

  const initials = customer?.name
    ? customer.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

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
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
          <Text style={styles.heroName}>{customer?.name ?? 'Guest User'}</Text>
          <Text style={styles.heroEmail}>{customer?.email ?? '—'}</Text>

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
            <TouchableOpacity>
              <Text style={styles.sectionAction}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {addresses.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>No addresses saved yet</Text>
            </View>
          ) : (
            addresses.map(addr => (
              <View key={addr.address_id} style={styles.addressCard}>
                <View style={styles.addressIconWrap}>
                  <IconLocationPin size={20} color={Colors.greenForest} />
                </View>
                <View style={styles.addressInfo}>
                  {addr.label && <Text style={styles.addressLabel}>{addr.label}</Text>}
                  <Text style={styles.addressText} numberOfLines={1}>
                    {[addr.street, addr.city, addr.zip_code].filter(Boolean).join(', ')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.grayLight} />
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
        <TouchableOpacity style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* App version */}
        <Text style={styles.version}>LettuceDine v1.0.0 🥬</Text>
      </ScrollView>
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
  avatarRing: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 26, fontWeight: '800', color: Colors.greenForest },
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
    backgroundColor: '#FFEBEE', borderRadius: 16,
    paddingVertical: 14,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: Colors.danger },

  // Version
  version: { textAlign: 'center', color: Colors.grayLight, fontSize: 12, marginTop: 20 },
});
