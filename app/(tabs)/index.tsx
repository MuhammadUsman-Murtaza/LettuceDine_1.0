import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, ActivityIndicator, StyleSheet,
  Platform, TextInput, SafeAreaView, TouchableOpacity,
  Animated,
} from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { IconLocationPin } from '@/components/icons/IconLocationPin';

const debuggerHost = Constants.expoConfig?.hostUri?.split(':').shift();
const ANDROID_URL = `http://${debuggerHost}:3000`;
const BASE_URL = Platform.OS === 'android' ? ANDROID_URL : 'http://localhost:3000';

interface Restaurant {
  id: number;
  name: string;
  rating: number | null;
  affordability: string;
  street: string;
  city: string;
  coords: { coordinates: [number, number] } | null;
}

const RestaurantCard = ({ item, onPress, index }: { item: Restaurant; onPress: () => void; index: number }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 400,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, []);

  const stars = Math.round(item.rating ?? 0);

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }}>
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
        {/* Header banner */}
        <View style={styles.cardBanner}>
          <View style={styles.bannerIconWrap}>
            <Text style={styles.bannerEmoji}>🍽️</Text>
          </View>
          <View style={styles.ratingPill}>
            <Text style={styles.ratingPillText}>⭐ {item.rating?.toFixed(1) ?? 'N/A'}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>

          <View style={styles.cardRow}>
            <IconLocationPin size={14} color={Colors.greenFresh} />
            <Text style={styles.cardSub} numberOfLines={1}>
              {[item.street, item.city].filter(Boolean).join(', ') || 'Location unavailable'}
            </Text>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.affordBadge}>
              <Text style={styles.affordText}>{item.affordability || '–'}</Text>
            </View>
            <Text style={styles.etaText}>🕐 25–35 min</Text>
            <View style={styles.orderBtn}>
              <Text style={styles.orderBtnText}>Order →</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filtered, setFiltered] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const headerAnim = useRef(new Animated.Value(0)).current;

  const fetchRestaurants = async () => {
    try {
      const res = await fetch(`${BASE_URL}/restaurants`);
      const data = await res.json();
      setRestaurants(data);
      setFiltered(data);
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
    Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(restaurants.filter(r =>
      r.name.toLowerCase().includes(q) || (r.city ?? '').toLowerCase().includes(q)
    ));
  }, [search, restaurants]);

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      {loading
        ? <ActivityIndicator size="large" color={Colors.greenFresh} />
        : <><Text style={styles.emptyIcon}>🥬</Text><Text style={styles.emptyText}>No restaurants found</Text></>
      }
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Animated Header */}
      <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
        {/* Top Row */}
        <View style={styles.topRow}>
          <View style={styles.locationRow}>
            <IconLocationPin size={18} color={Colors.charcoal} />
            <Text style={styles.locationLabel}>Delivering to</Text>
            <TouchableOpacity style={styles.locationChip}>
              <Text style={styles.locationCity}>Karachi</Text>
              <Ionicons name="chevron-down" size={13} color={Colors.charcoal} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => router.push('/profile' as any)}>
            <Ionicons name="person-circle-outline" size={30} color={Colors.black} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={Colors.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search restaurants or cuisines…"
            placeholderTextColor={Colors.grayLight}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={Colors.gray} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item, index }) => (
          <RestaurantCard
            item={item}
            index={index}
            onPress={() => router.push({ pathname: '/restaurant/[id]', params: { id: item.id, name: item.name } } as any)}
          />
        )}
        ListHeaderComponent={
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔥 Popular Near You</Text>
            <Text style={styles.sectionCount}>{filtered.length} places</Text>
          </View>
        }
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.offWhite },

  // Header
  header: {
    backgroundColor: Colors.greenForest,
    paddingTop: Platform.OS === 'android' ? 40 : 12,
    paddingHorizontal: Spacing.screenMargin,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: Colors.greenForest,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationLabel: { color: Colors.charcoal, fontSize: 12, fontWeight: '500' },
  locationChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.06)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  locationCity: { color: Colors.black, fontSize: 14, fontWeight: '700' },
  profileBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' },

  // Search
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 14, paddingHorizontal: 14, height: 46, gap: 10 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.black },

  // Section
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.screenMargin, paddingTop: 20, paddingBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.black },
  sectionCount: { fontSize: 13, color: Colors.gray },

  listContainer: { paddingHorizontal: Spacing.screenMargin, paddingBottom: 24 },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  cardBanner: {
    height: 90,
    backgroundColor: Colors.greenLight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12,
  },
  bannerIconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  bannerEmoji: { fontSize: 24 },
  ratingPill: { backgroundColor: Colors.greenForest, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  ratingPillText: { color: Colors.black, fontSize: 12, fontWeight: '700' },
  cardBody: { padding: 14 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.black, marginBottom: 6 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  cardSub: { fontSize: 12, color: Colors.gray, flex: 1 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  affordBadge: { backgroundColor: Colors.greenLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  affordText: { fontSize: 12, color: Colors.greenForest, fontWeight: '600' },
  etaText: { fontSize: 12, color: Colors.gray, flex: 1 },
  orderBtn: { backgroundColor: Colors.greenForest, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  orderBtnText: { color: Colors.black, fontSize: 12, fontWeight: '700' },

  // Empty
  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16, color: Colors.gray },
});