import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, Image, StyleSheet, TouchableOpacity,
  ActivityIndicator, TextInput, ScrollView, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { API_URL } from '@/utils/api';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { SafeAreaView } from 'react-native-safe-area-context';



/**
 * HOME SCREEN (Clean Refactor)
 * Premium feed of restaurants with search and categories.
 */
export default function HomeScreen() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [showCityModal, setShowCityModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const response = await fetch(`${API_URL}/restaurants`);
      const data = await response.json();
      setRestaurants(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Home Fetch Failed", error);
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  const cities = ['All Cities', ...new Set(restaurants.map(r => r.city).filter(Boolean))];

  const filtered = (restaurants || []).filter(r => {
    const matchesSearch = r.name?.toLowerCase().includes(search.toLowerCase()) ||
                         r.cuisine_type?.toLowerCase().includes(search.toLowerCase());
    const matchesCity = selectedCity === 'All Cities' || r.city === selectedCity;
    return matchesSearch && matchesCity;
  });

  const renderRestaurant = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => router.push(`/(customer)/restaurant/${item.restaurant_id}`)}
      activeOpacity={0.9}
    >
      <Image 
        source={{ uri: `https://source.unsplash.com/800x450/?restaurant,food,${item.cuisine_type}` }} 
        style={styles.cardImage} 
      />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating || 'New'}</Text>
          </View>
        </View>
        <Text style={styles.cardSubtitle}>{item.cuisine_type} • {item.city}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.affordability}>{"$".repeat(item.affordability)}</Text>
          <View style={styles.deliveryBadge}>
            <Text style={styles.deliveryText}>Free Delivery</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Delivering to</Text>
          <TouchableOpacity style={styles.locationRow} onPress={() => setShowCityModal(true)}>
            <Text style={styles.locationText}>{selectedCity === 'All Cities' ? 'Select City' : selectedCity}</Text>
            <Ionicons name="chevron-down" size={16} color={Colors.greenFresh} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/(customer)/(tabs)/profile')}>
          <Ionicons name="person-circle-outline" size={32} color={Colors.black} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={Colors.gray} style={{ marginRight: 10 }} />
        <TextInput 
          placeholder="Search restaurants, cuisines..." 
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.greenFresh} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.restaurant_id.toString()}
          renderItem={renderRestaurant}
          contentContainerStyle={styles.list}
          ListHeaderComponent={() => (
            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>Featured in {selectedCity}</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="restaurant-outline" size={60} color={Colors.grayBg} />
              <Text style={styles.emptyText}>No restaurants found in {selectedCity}</Text>
            </View>
          }
        />
      )}

      {/* City Selection Modal */}
      <Modal visible={showCityModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select City</Text>
              <TouchableOpacity onPress={() => setShowCityModal(false)}>
                <Ionicons name="close" size={24} color={Colors.black} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {cities.map((city) => (
                <TouchableOpacity 
                  key={city} 
                  style={[styles.cityOption, selectedCity === city && styles.citySelected]}
                  onPress={() => {
                    setSelectedCity(city);
                    setShowCityModal(false);
                  }}
                >
                  <Text style={[styles.cityText, selectedCity === city && styles.cityTextSelected]}>{city}</Text>
                  {selectedCity === city && <Ionicons name="checkmark-circle" size={20} color={Colors.greenFresh} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  header: { 
    paddingHorizontal: Spacing.screenMargin, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: 15
  },
  welcomeText: { fontSize: 13, color: Colors.gray, fontWeight: '600' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 16, fontWeight: '800', color: Colors.black },
  profileBtn: { padding: 5 },
  
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.screenMargin,
    paddingHorizontal: 15,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.grayBg,
    marginBottom: 20
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.black },

  list: { paddingBottom: 100 },
  listHeader: { paddingHorizontal: Spacing.screenMargin, marginBottom: 15 },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: Colors.black },
  
  card: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.screenMargin,
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 5,
  },
  cardImage: { width: '100%', height: 180, backgroundColor: Colors.grayBg },
  cardContent: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: Colors.black },
  ratingBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    backgroundColor: '#FFFBE6', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8 
  },
  ratingText: { fontSize: 13, fontWeight: '700', color: '#B8860B' },
  cardSubtitle: { fontSize: 14, color: Colors.gray, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  affordability: { fontSize: 14, fontWeight: '700', color: Colors.greenFresh },
  deliveryBadge: { backgroundColor: '#E6FFFA', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  deliveryText: { fontSize: 12, color: Colors.greenForest, fontWeight: '700' },

  emptyWrap: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyText: { textAlign: 'center', marginTop: 15, color: Colors.gray, fontSize: 15 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: Colors.black },
  cityOption: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 18, 
    borderBottomWidth: 1, 
    borderColor: Colors.grayBg 
  },
  citySelected: { marginHorizontal: -20, paddingHorizontal: 20 },
  cityText: { fontSize: 16, color: Colors.black, fontWeight: '600' },
  cityTextSelected: { color: Colors.greenFresh, fontWeight: '800' }
});
