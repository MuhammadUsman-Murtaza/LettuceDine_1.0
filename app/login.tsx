import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, Platform, KeyboardAvoidingView, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/utils/api';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

/**
 * LOGIN SCREEN (Clean Refactor)
 * High-performance, unified login for Customers and Vendors.
 */
export default function LoginScreen() {
  const router = useRouter();
  const [role, setRole] = useState<'customer' | 'vendor'>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing Info", "Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const endpoint = role === 'customer' ? '/auth/login/customer' : '/auth/login/vendor';
      
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        Alert.alert('Login Failed', data.error || 'Invalid credentials');
      } else {
        // Success: Store IDs based on role
        await AsyncStorage.setItem('ROLE', role);
        if (role === 'customer') {
          await AsyncStorage.setItem('CUSTOMER_ID', String(data.customer_id));
        } else {
          await AsyncStorage.setItem('VENDOR_ID', String(data.vendor_id));
          await AsyncStorage.setItem('RESTAURANT_ID', String(data.restaurant_id || ''));
        }
        
        router.replace('/'); // Auto-redirector will take them to the right dashboard
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
          
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back! 🥬</Text>
            <Text style={styles.subtitle}>Log in to continue to LettuceDine</Text>
          </View>

          {/* Role Tab Switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, role === 'customer' && styles.activeTab]}
              onPress={() => setRole('customer')}
            >
              <Text style={[styles.tabText, role === 'customer' && styles.activeTabText]}>Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, role === 'vendor' && styles.activeTab]}
              onPress={() => setRole('vendor')}
            >
              <Text style={[styles.tabText, role === 'vendor' && styles.activeTabText]}>Vendor</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputWrap}>
              <Text style={styles.label}>{role === 'customer' ? 'Customer Email' : 'Vendor Email'}</Text>
              <TextInput
                style={styles.input}
                placeholder="email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
            <View style={styles.inputWrap}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Login</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/register' as any)}>
              <Text style={styles.footerLink}>Register here</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.offWhite },
  scroll: { padding: 30, paddingTop: 60 },
  header: { marginBottom: 40 },
  title: { fontSize: 32, fontWeight: '900', color: Colors.black },
  subtitle: { fontSize: 16, color: Colors.gray, marginTop: 5 },
  
  tabContainer: { 
    flexDirection: 'row', backgroundColor: Colors.white, borderRadius: 16, padding: 4, marginBottom: 40,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  activeTab: { backgroundColor: Colors.greenForest },
  tabText: { fontWeight: '700', color: Colors.gray },
  activeTabText: { color: Colors.black },

  form: { gap: 20 },
  inputWrap: { gap: 8 },
  label: { fontSize: 14, fontWeight: '700', color: Colors.black },
  input: { 
    backgroundColor: Colors.white, padding: 16, borderRadius: 15, fontSize: 16, 
    borderWidth: 1, borderColor: Colors.grayBg 
  },
  submitBtn: { 
    backgroundColor: Colors.black, height: 60, borderRadius: 20, 
    justifyContent: 'center', alignItems: 'center', marginTop: 10,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 5
  },
  submitBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40 },
  footerText: { color: Colors.gray, fontSize: 15 },
  footerLink: { color: Colors.greenForest, fontSize: 15, fontWeight: '800' }
});
