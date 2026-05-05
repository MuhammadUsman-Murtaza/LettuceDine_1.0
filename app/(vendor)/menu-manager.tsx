import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Modal, TextInput, ScrollView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '@/utils/api';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * MENU MANAGER
 * Vendors can add, edit, and delete items for a specific restaurant.
 */
export default function MenuManager() {
  const { restaurantId, restaurantName } = useLocalSearchParams();
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form, setForm] = useState({ food_item: '', description: '', price: '' });
  const router = useRouter();

  useEffect(() => {
    fetchMenu();
  }, [restaurantId]);

  const fetchMenu = async () => {
    try {
      const response = await fetch(`${API_URL}/restaurants/${restaurantId}/menu`);
      const data = await response.json();
      setMenu(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch Menu Error", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.food_item || !form.price) {
      Alert.alert("Missing Info", "Name and Price are required");
      return;
    }

    const url = editingItem 
      ? `${API_URL}/menu/${editingItem.menu_id}`
      : `${API_URL}/restaurants/${restaurantId}/menu`;
    
    try {
      const response = await fetch(url, {
        method: editingItem ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, price: parseFloat(form.price) })
      });
      if (response.ok) {
        Alert.alert("Success", `Item ${editingItem ? 'updated' : 'added'}!`);
        setShowModal(false);
        setEditingItem(null);
        setForm({ food_item: '', description: '', price: '' });
        fetchMenu();
      }
    } catch (error) {
      Alert.alert("Error", "Failed to save menu item");
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert("Delete Item", "Are you sure you want to remove this item?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          await fetch(`${API_URL}/menu/${id}`, { method: 'DELETE' });
          fetchMenu();
        } catch (error) {
          Alert.alert("Error", "Failed to delete item");
        }
      }}
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName}>{item.food_item || item.beverages || item.desserts || item.starter}</Text>
        <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
        <Text style={styles.itemPrice}>Rs. {item.price}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={() => {
            setEditingItem(item);
            setForm({ 
              food_item: item.food_item || item.beverages || item.desserts || item.starter, 
              description: item.description, 
              price: item.price.toString() 
            });
            setShowModal(true);
          }}
        >
          <Ionicons name="create-outline" size={20} color={Colors.black} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item.menu_id)}>
          <Ionicons name="trash-outline" size={20} color={Colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Menu Manager</Text>
          <Text style={styles.headerSub}>{restaurantName}</Text>
        </View>
        <TouchableOpacity onPress={() => setShowModal(true)}>
          <Ionicons name="add-circle" size={32} color={Colors.greenFresh} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.greenFresh} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={menu}
          keyExtractor={(item) => item.menu_id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="fast-food-outline" size={60} color={Colors.grayBg} />
              <Text style={styles.emptyText}>Your menu is empty.{"\n"}Add some delicious items to get started!</Text>
            </View>
          }
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingItem ? 'Edit Item' : 'New Menu Item'}</Text>
              <TouchableOpacity onPress={() => { setShowModal(false); setEditingItem(null); }}>
                <Ionicons name="close" size={24} color={Colors.black} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Item Name</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g. Classic Beef Burger"
                value={form.food_item}
                onChangeText={(val) => setForm({...form, food_item: val})}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput 
                style={[styles.input, { height: 100, textAlignVertical: 'top' }]} 
                placeholder="Describe the ingredients or taste..."
                multiline
                value={form.description}
                onChangeText={(val) => setForm({...form, description: val})}
              />

              <Text style={styles.label}>Price (Rs.)</Text>
              <TextInput 
                style={styles.input} 
                placeholder="0.00"
                keyboardType="numeric"
                value={form.price}
                onChangeText={(val) => setForm({...form, price: val})}
              />

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>{editingItem ? 'Update Item' : 'Add to Menu'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    padding: Spacing.screenMargin, borderBottomWidth: 1, borderColor: Colors.grayBg 
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: Colors.black },
  headerSub: { fontSize: 13, color: Colors.gray, fontWeight: '600' },
  backBtn: { padding: 5 },

  list: { padding: Spacing.screenMargin, paddingBottom: 100 },
  itemCard: {
    backgroundColor: Colors.white, borderRadius: 20, padding: 16, marginBottom: 15,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.grayBg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2
  },
  itemName: { fontSize: 17, fontWeight: '800', color: Colors.black },
  itemDesc: { fontSize: 13, color: Colors.gray, marginTop: 4, marginBottom: 8 },
  itemPrice: { fontSize: 16, fontWeight: '800', color: Colors.greenForest },
  actions: { flexDirection: 'row', gap: 10, marginLeft: 10 },
  actionBtn: { backgroundColor: Colors.offWhite, padding: 10, borderRadius: 10 },
  deleteBtn: { backgroundColor: '#FFF5F5' },

  emptyWrap: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyText: { textAlign: 'center', marginTop: 15, color: Colors.gray, fontSize: 14, lineHeight: 20 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: Colors.black },
  label: { fontSize: 14, fontWeight: '700', color: Colors.gray, marginBottom: 8, marginTop: 15 },
  input: { 
    backgroundColor: Colors.offWhite, borderRadius: 12, padding: 15, fontSize: 16, 
    borderWidth: 1, borderColor: Colors.grayBg 
  },
  saveBtn: { backgroundColor: Colors.greenFresh, padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 30, marginBottom: 20 },
  saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: '800' }
});
