import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { API_URL, getSession } from '@/utils/api';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * REVIEW SCREEN (Clean Refactor)
 * Allows customers to rate and review their orders.
 */
export default function ReviewScreen() {
  const { orderId, restaurantId } = useLocalSearchParams();
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!comment) {
      Alert.alert("Missing Feedback", "Please write a few words about your meal.");
      return;
    }

    setSubmitting(true);
    const { customerId } = await getSession();

    try {
      const res = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          order_id: orderId,
          restaurant_id: restaurantId,
          rating,
          comment
        })
      });

      if (res.ok) {
        Alert.alert("Thank You!", "Your review has been submitted.");
        router.replace('/(customer)/(tabs)/orders');
      }
    } catch (err) {
      Alert.alert("Error", "Could not submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={28} color={Colors.black} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>How was your meal? 🍕</Text>
            <Text style={styles.subtitle}>Your feedback helps us and the restaurant improve.</Text>
          </View>

          {/* Star Selection */}
          <View style={styles.starContainer}>
            {[1, 2, 3, 4, 5].map((s) => (
              <TouchableOpacity key={s} onPress={() => setRating(s)}>
                <Ionicons 
                  name={s <= rating ? "star" : "star-outline"} 
                  size={48} 
                  color={s <= rating ? "#FFD700" : Colors.grayBg} 
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingLabel}>
            {rating === 5 ? "Loved it!" : rating === 4 ? "Great!" : rating === 3 ? "Okay" : "Not good"}
          </Text>

          {/* Comment Input */}
          <View style={styles.inputWrap}>
            <Text style={styles.label}>Write your review</Text>
            <TextInput
              style={styles.input}
              placeholder="Tell us what you liked or what could be better..."
              placeholderTextColor={Colors.gray}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={comment}
              onChangeText={setComment}
            />
          </View>

          <TouchableOpacity 
            style={[styles.submitBtn, submitting && { opacity: 0.7 }]} 
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.submitBtnText}>{submitting ? "Submitting..." : "Submit Review"}</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  scroll: { padding: 25, paddingTop: 10 },
  closeBtn: { alignSelf: 'flex-end', padding: 5 },
  
  header: { marginTop: 20, marginBottom: 40 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.black, textAlign: 'center' },
  subtitle: { fontSize: 16, color: Colors.gray, textAlign: 'center', marginTop: 10, paddingHorizontal: 20 },

  starContainer: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 15 },
  ratingLabel: { textAlign: 'center', fontSize: 18, fontWeight: '700', color: Colors.greenForest, marginBottom: 40 },

  inputWrap: { marginBottom: 30 },
  label: { fontSize: 14, fontWeight: '700', color: Colors.black, marginBottom: 10 },
  input: {
    backgroundColor: Colors.offWhite,
    borderRadius: 20,
    padding: 20,
    fontSize: 16,
    color: Colors.black,
    borderWidth: 1,
    borderColor: Colors.grayBg,
    minHeight: 150
  },

  submitBtn: {
    backgroundColor: Colors.black,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 8
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});
