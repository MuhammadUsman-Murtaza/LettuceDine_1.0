import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, ActivityIndicator, StyleSheet,
  Platform, TextInput, TouchableOpacity, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

const debuggerHost = Constants.expoConfig?.hostUri?.split(':').shift();
const BASE_URL = Platform.OS === 'android' ? `http://${debuggerHost}:3000` : 'http://localhost:3000';

export default function HomeScreen() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchRestaurants = async () => {
    try {
      const res = await fetch(`${BASE_URL}/restaurants`);
      const data = await res.json();
      setRestaurants(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const renderRestaurant = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => router.push({ pathname: '/restaurant/[id]', params: { id: item.restaurant_id } } as any)}
    >
      <View style={styles.cardBanner}>
        <Text style={styles.bannerEmoji}>🍕</Text>
        <View style={styles.ratingPill}>
          <Text style={styles.ratingText}>⭐ {Number(item.rating || 0).toFixed(1)}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardSub}>{item.cuisine_type} • {item.city}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>LettuceDine 🥬</Text>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={Colors.gray} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search food..." 
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{marginTop: 50}} color={Colors.greenFresh} />
      ) : (
        <FlatList
          data={restaurants.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))}
          keyExtractor={item => item.restaurant_id.toString()}
          renderItem={renderRestaurant}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.offWhite },
  header: { padding: 20, backgroundColor: Colors.greenForest, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
  title: { fontSize: 24, fontWeight: '900', color: Colors.black, marginBottom: 15 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, marginLeft: 10 },
  list: { padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 18, marginBottom: 20, overflow: 'hidden', elevation: 4 },
  cardBanner: { height: 100, backgroundColor: Colors.greenLight, padding: 15, flexDirection: 'row', justifyContent: 'space-between' },
  bannerEmoji: { fontSize: 32 },
  ratingPill: { backgroundColor: Colors.greenForest, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, height: 25 },
  ratingText: { fontSize: 12, fontWeight: 'bold' },
  cardBody: { padding: 15 },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  cardSub: { fontSize: 13, color: Colors.gray, marginTop: 4 }
});
