import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, Platform, KeyboardAvoidingView, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { API_URL } from '@/utils/api';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

/**
 * REGISTRATION SCREEN (Clean Refactor)
 * Comprehensive sign-up for Customers and Vendors.
 */
export default function RegisterScreen() {
  const router = useRouter();
  const [role, setRole] = useState<'customer' | 'vendor'>('customer');
  
  // Account Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Customer Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  // Vendor Fields
  const [vendorName, setVendorName] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  const [city, setCity] = useState('');
  const [streetAddress, setStreetAddress] = useState('');

  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !phone) {
      Alert.alert("Missing Fields", "Please fill in all account details.");
      return;
    }

    setLoading(true);
    try {
      const endpoint = role === 'customer' ? '/customers' : '/auth/register/vendor';
      const body = role === 'customer' 
        ? { first_name: firstName, last_name: lastName, email, phone_number: phone, password_hash: password }
        : { name: vendorName, cuisine_type: cuisineType, phone_number: phone, city, street_address: streetAddress, email, password_hash: password };

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        Alert.alert('Registration Failed', data.error || 'Something went wrong');
      } else {
        Alert.alert('Welcome!', 'Account created successfully. Please log in.');
        router.replace('/login');
      }
    } catch (err) {
      Alert.alert('Error', 'Could not connect to the server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={Colors.black} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Join LettuceDine 🥬</Text>
            <Text style={styles.subtitle}>Create your account to get started</Text>
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity style={[styles.tab, role === 'customer' && styles.activeTab]} onPress={() => setRole('customer')}>
              <Text style={[styles.tabText, role === 'customer' && styles.activeTabText]}>Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, role === 'vendor' && styles.activeTab]} onPress={() => setRole('vendor')}>
              <Text style={[styles.tabText, role === 'vendor' && styles.activeTabText]}>Vendor</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            {role === 'customer' ? (
              <View style={styles.row}>
                <TextInput style={[styles.input, {flex: 1}]} placeholder="First Name" value={firstName} onChangeText={setFirstName} />
                <TextInput style={[styles.input, {flex: 1}]} placeholder="Last Name" value={lastName} onChangeText={setLastName} />
              </View>
            ) : (
              <>
                <TextInput style={styles.input} placeholder="Restaurant Name" value={vendorName} onChangeText={setVendorName} />
                <TextInput style={styles.input} placeholder="Cuisine (e.g. Desi, Italian)" value={cuisineType} onChangeText={setCuisineType} />
              </>
            )}

            <TextInput style={styles.input} placeholder="Email Address" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
            <TextInput style={styles.input} placeholder="Phone Number" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />

            {role === 'vendor' && (
              <View style={styles.row}>
                <TextInput style={[styles.input, {flex: 1}]} placeholder="City" value={city} onChangeText={setCity} />
                <TextInput style={[styles.input, {flex: 2}]} placeholder="Street Address" value={streetAddress} onChangeText={setStreetAddress} />
              </View>
            )}

            <TouchableOpacity style={styles.submitBtn} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Create Account</Text>}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Re-using styles from Login with minor additions
import { Ionicons } from '@expo/vector-icons';
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.offWhite },
  scroll: { padding: 30, paddingTop: 30 },
  backBtn: { marginBottom: 20 },
  header: { marginBottom: 30 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.black },
  subtitle: { fontSize: 14, color: Colors.gray, marginTop: 5 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 15, padding: 4, marginBottom: 25 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  activeTab: { backgroundColor: Colors.greenForest },
  tabText: { fontWeight: '700', color: Colors.gray },
  activeTabText: { color: Colors.black },
  form: { gap: 15 },
  row: { flexDirection: 'row', gap: 10 },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: Colors.grayBg, fontSize: 15 },
  submitBtn: { backgroundColor: Colors.black, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 15 },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 }
});
