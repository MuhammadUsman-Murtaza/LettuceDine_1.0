import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

export default function PaymentsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.title}>Payment Methods</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.card}>
          <Ionicons name="cash" size={24} color={Colors.greenForest} />
          <Text style={styles.cardText}>Cash on Delivery (Enabled)</Text>
        </View>
        <View style={[styles.card, { opacity: 0.5 }]}>
          <Ionicons name="card" size={24} color={Colors.gray} />
          <Text style={styles.cardText}>Credit Card (Coming Soon)</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.offWhite },
  header: { padding: 20, backgroundColor: Colors.greenForest, flexDirection: 'row', alignItems: 'center', gap: 15 },
  backBtn: { backgroundColor: 'rgba(0,0,0,0.06)', padding: 8, borderRadius: 10 },
  title: { fontSize: 20, fontWeight: '800' },
  content: { padding: 20 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 15, marginBottom: 15, flexDirection: 'row', alignItems: 'center', gap: 15 },
  cardText: { fontSize: 16, fontWeight: '600' }
});
