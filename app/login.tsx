import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, Platform, KeyboardAvoidingView, ScrollView, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

export default function LoginScreen() {
  const router = useRouter();
  const [role, setRole] = useState<'customer' | 'vendor'>('customer');
  
  // Customer fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Vendor fields
  const [vendorName, setVendorName] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');

  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const endpoint = role === 'customer' ? '/auth/login/customer' : '/auth/login/vendor';
      const body = role === 'customer' 
        ? { email, password }
        : { name: vendorName, phone_number: vendorPhone };

      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        Alert.alert('Login Failed', data.error || 'Something went wrong');
      } else {
        // Success
        Alert.alert('Success', `Welcome back, ${role === 'customer' ? data.first_name : data.name}!`);
        router.replace('/' as any);
      }
    } catch (err) {
      console.error(err);
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

          {/* Role Switcher */}
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

          {/* Form */}
          <View style={styles.form}>
            {role === 'customer' ? (
              <>
                <View style={styles.inputWrap}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="john@example.com"
                    placeholderTextColor={Colors.grayLight}
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
                    placeholder="Enter your password"
                    placeholderTextColor={Colors.grayLight}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>
              </>
            ) : (
              <>
                <View style={styles.inputWrap}>
                  <Text style={styles.label}>Restaurant Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. The Green Bowl"
                    placeholderTextColor={Colors.grayLight}
                    value={vendorName}
                    onChangeText={setVendorName}
                  />
                </View>
                <View style={styles.inputWrap}>
                  <Text style={styles.label}>Registered Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="+1234567890"
                    placeholderTextColor={Colors.grayLight}
                    keyboardType="phone-pad"
                    value={vendorPhone}
                    onChangeText={setVendorPhone}
                  />
                </View>
              </>
            )}

            <TouchableOpacity 
              style={styles.submitBtn} 
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.submitBtnText}>{loading ? 'Logging in...' : 'Login'}</Text>
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
  scroll: { padding: Spacing.screenMargin, paddingTop: Platform.OS === 'android' ? 60 : 40, paddingBottom: 40 },
  
  header: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '800', color: Colors.black, marginBottom: 8 },
  subtitle: { fontSize: 16, color: Colors.gray },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: Colors.greenForest, // Bright Yellow
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.gray,
  },
  activeTabText: {
    color: Colors.black,
  },

  form: { gap: 20 },
  inputWrap: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.charcoal },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.grayBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    color: Colors.black,
  },

  submitBtn: {
    backgroundColor: Colors.greenForest,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: Colors.greenForest, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  submitBtnText: {
    color: Colors.black,
    fontSize: 16,
    fontWeight: '700',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: { color: Colors.gray, fontSize: 15 },
  footerLink: { color: Colors.greenFresh, fontSize: 15, fontWeight: '700' }, // Sea Blue
});
