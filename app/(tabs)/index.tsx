import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, ActivityIndicator, StyleSheet, Platform 
} from 'react-native';

import Constants from 'expo-constants'

const debuggerHost = Constants.expoConfig?.hostUri?.split(":").shift()
const ANDROID_URL = `http://${debuggerHost}:3000/restaurants`

const RestaurantList = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  // Determine the correct localhost IP based on the platform
  const API_URL = Platform.OS === 'android' 
    ? ANDROID_URL
    : 'http://localhost:3000/restaurants';

  const fetchRestaurants = async () => {
    try {
      const response = await fetch(API_URL);
      const json = await response.json();
      setRestaurants(json);
    } catch (error) {
      console.error("Connection failed. Check your IP/Server!", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  });

  const renderRestaurant = ({ item }) => (
    <View style={styles.card}>
      <View>
        <View>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.cuisine}>{item.cuisine}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.coordText}>
            {/* Accessing GeoJSON coordinates from PostGIS */}
            {item.coords.coordinates[1].toFixed(3)}, {item.coords.coordinates[0].toFixed(3)}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Nearby Eats</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#FF6347" />
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderRestaurant}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8', paddingTop: 50 },
  header: { fontSize: 28, fontWeight: 'bold', marginLeft: 20, marginBottom: 20 },
  listContent: { paddingHorizontal: 20 },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },
  name: { fontSize: 18, fontWeight: '600' },
  cuisine: { color: '#666', marginTop: 4 },
  badge: { backgroundColor: '#eee', padding: 6, borderRadius: 6 },
  coordText: { fontSize: 10, color: '#888', fontFamily: 'monospace' }
});

export default RestaurantList;