import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function GatewayScreen() {
  const router = useRouter();

  React.useEffect(() => {
    checkLogin();
  }, []);

  const checkLogin = async () => {
    const role = await AsyncStorage.getItem('ROLE');
    if (role === 'vendor') {
      router.replace('/(vendor)/dashboard');
    } else if (role === 'customer') {
      router.replace('/(customer)/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>LettuceDine 🥬</Text>
        <Text style={styles.tagline}>Select your portal to continue</Text>
      </View>

      <View style={styles.optionsContainer}>
        {/* Customer Portal */}
        <TouchableOpacity 
          style={styles.optionCard} 
          onPress={() => router.replace('/(customer)/(tabs)')}
        >
          <View style={[styles.iconWrap, { backgroundColor: Colors.greenMint }]}>
            <Ionicons name="fast-food" size={40} color={Colors.greenFresh} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.optionTitle}>Customer Portal</Text>
            <Text style={styles.optionDesc}>Order from local favorites</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={Colors.grayLight} />
        </TouchableOpacity>

        {/* Vendor Portal */}
        <TouchableOpacity 
          style={[styles.optionCard, { marginTop: 20 }]} 
          onPress={() => router.replace('/(vendor)/dashboard')}
        >
          <View style={[styles.iconWrap, { backgroundColor: '#FFF9E6' }]}>
            <Ionicons name="briefcase" size={40} color="#FFD700" />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.optionTitle}>Vendor Portal</Text>
            <Text style={styles.optionDesc}>Manage your shop & orders</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={Colors.grayLight} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 30, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 50 },
  brand: { fontSize: 36, fontWeight: '900', color: Colors.black },
  tagline: { fontSize: 16, color: Colors.gray, marginTop: 8 },
  optionsContainer: { width: '100%' },
  optionCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.grayBg,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05, shadowRadius: 15,
  },
  iconWrap: { width: 70, height: 70, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  textWrap: { flex: 1, marginLeft: 20 },
  optionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.black },
  optionDesc: { fontSize: 13, color: Colors.gray, marginTop: 4 },
});
