import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Modal, Alert, ActivityIndicator, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { API_URL, getSession, logout } from '@/utils/api';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * PROFILE & ADDRESS MANAGER (Clean Refactor)
 * Handles account viewing, logouts, and full Address CRUD.
 */
export default function ProfileScreen() {
  const [customer, setCustomer] = useState<any>(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  // New Address Form State
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [label, setLabel] = useState('home');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { customerId } = await getSession();
    if (!customerId) {
      router.replace('/login');
      return;
    }

    try {
      const [pRes, aRes] = await Promise.all([
        fetch(`${API_URL}/customers/${customerId}`),
        fetch(`${API_URL}/customers/${customerId}/addresses`)
      ]);
      const pData = await pRes.json();
      const aData = await aRes.json();
      setCustomer(pData);
      setAddresses(aData);
    } catch (err) {
      console.error("Profile Load Error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async () => {
    if (!street || !city) {
      Alert.alert("Error", "Please enter at least Street and City");
      return;
    }
    const { customerId } = await getSession();
    try {
      const res = await fetch(`${API_URL}/customers/${customerId}/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ street, city, province, label })
      });
      if (res.ok) {
        setModalVisible(false);
        setStreet(''); setCity(''); setProvince('');
        loadProfile(); // Refresh list
      }
    } catch (err) {
      Alert.alert("Error", "Failed to add address");
    }
  };

  const handleDeleteAddress = async (id: number) => {
    const { customerId } = await getSession();
    try {
      const res = await fetch(`${API_URL}/customers/${customerId}/addresses/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) loadProfile();
    } catch (err) {
      Alert.alert("Error", "Could not delete address");
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color={Colors.greenFresh}/></View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* User Info Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{customer?.first_name?.[0]}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{customer?.first_name} {customer?.last_name}</Text>
            <Text style={styles.userEmail}>{customer?.email}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={Colors.danger} />
          </TouchableOpacity>
        </View>

        {/* Addresses Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Saved Addresses</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addBtnText}>Add New</Text>
          </TouchableOpacity>
        </View>

        {addresses.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No addresses saved yet.</Text>
          </View>
        ) : (
          addresses.map((addr: any) => (
            <View key={addr.address_id} style={styles.addressCard}>
              <View style={styles.addrIcon}>
                <Ionicons name={addr.label === 'work' ? "briefcase" : "home"} size={20} color={Colors.greenFresh} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.addrLabel}>{addr.label.toUpperCase()}</Text>
                <Text style={styles.addrStreet}>{addr.street}</Text>
                <Text style={styles.addrCity}>{addr.city}, {addr.province}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteAddress(addr.address_id)}>
                <Ionicons name="trash-outline" size={20} color={Colors.gray} />
              </TouchableOpacity>
            </View>
          ))
        )}

      </ScrollView>

      {/* Add Address Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Address</Text>
            
            <TextInput style={styles.input} placeholder="Street Address" value={street} onChangeText={setStreet} />
            <TextInput style={styles.input} placeholder="City" value={city} onChangeText={setCity} />
            <TextInput style={styles.input} placeholder="Province/Zip" value={province} onChangeText={setProvince} />
            
            <View style={styles.labelRow}>
              {['home', 'work', 'other'].map(l => (
                <TouchableOpacity 
                  key={l}
                  style={[styles.labelChip, label === l && styles.activeChip]}
                  onPress={() => setLabel(l)}
                >
                  <Text style={[styles.chipText, label === l && styles.activeChipText]}>{l.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddAddress}>
                <Text style={styles.saveBtnText}>Save Address</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: Spacing.screenMargin, paddingBottom: 100 },

  profileCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  avatar: { 
    width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.greenFresh, 
    justifyContent: 'center', alignItems: 'center' 
  },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  profileInfo: { marginLeft: 15, flex: 1 },
  userName: { fontSize: 18, fontWeight: '800', color: Colors.black },
  userEmail: { fontSize: 14, color: Colors.gray, marginTop: 2 },
  logoutBtn: { padding: 10 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.black },
  addBtn: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.black, 
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 5 
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  addressCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.grayBg,
  },
  addrIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0FFF4', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  addrLabel: { fontSize: 10, fontWeight: '900', color: Colors.greenForest, marginBottom: 2 },
  addrStreet: { fontSize: 15, fontWeight: '700', color: Colors.black },
  addrCity: { fontSize: 13, color: Colors.gray },

  emptyCard: { padding: 40, alignItems: 'center', backgroundColor: Colors.white, borderRadius: 16, borderStyle: 'dashed', borderWidth: 2, borderColor: Colors.grayBg },
  emptyText: { color: Colors.gray },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, paddingBottom: 50 },
  modalTitle: { fontSize: 20, fontWeight: '900', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: Colors.offWhite, padding: 15, borderRadius: 12, marginBottom: 12, fontSize: 15 },
  labelRow: { flexDirection: 'row', gap: 10, marginBottom: 25, justifyContent: 'center' },
  labelChip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.offWhite },
  activeChip: { backgroundColor: Colors.greenFresh },
  chipText: { fontSize: 12, fontWeight: '700', color: Colors.gray },
  activeChipText: { color: '#fff' },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 16, alignItems: 'center' },
  cancelBtnText: { color: Colors.gray, fontWeight: '700' },
  saveBtn: { flex: 2, backgroundColor: Colors.black, padding: 16, borderRadius: 15, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '800' }
});
