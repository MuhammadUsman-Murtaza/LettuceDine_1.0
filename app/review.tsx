import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Platform, SafeAreaView,
  TouchableOpacity, TextInput, Alert, ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { IconStar } from '@/components/icons/IconStar';

const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
const CUSTOMER_ID = 1;

export default function ReviewScreen() {
  const router = useRouter();
  const { orderId, restaurantName, restaurantId } = useLocalSearchParams<{
    orderId: string;
    restaurantName: string;
    restaurantId: string;
  }>();

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const displayRating = hovered || rating;

  const getRatingLabel = (r: number) => {
    if (r === 1) return '😞 Poor';
    if (r === 2) return '😕 Fair';
    if (r === 3) return '😊 Good';
    if (r === 4) return '😄 Great';
    if (r === 5) return '🤩 Excellent!';
    return 'Tap to rate';
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: CUSTOMER_ID,
          order_id: parseInt(orderId),
          restaurant_id: parseInt(restaurantId ?? '1'),
          rating,
          comment: comment.trim() || null,
        }),
      });
      if (res.ok) {
        Alert.alert('Thank you! 🎉', 'Your review has been submitted.', [
          { text: 'OK', onPress: () => router.replace('/' as any) },
        ]);
      } else {
        Alert.alert('Error', 'Could not submit review. Please try again.');
      }
    } catch {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⭐ Write a Review</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Restaurant name card */}
        <View style={styles.restCard}>
          <View style={styles.restIcon}><Text style={{ fontSize: 30 }}>🍽️</Text></View>
          <View>
            <Text style={styles.restLabel}>You dined at</Text>
            <Text style={styles.restName}>{restaurantName}</Text>
          </View>
        </View>

        {/* Star Rating */}
        <View style={styles.ratingSection}>
          <Text style={styles.ratingPrompt}>How was your experience?</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(i => (
              <TouchableOpacity
                key={i}
                onPress={() => setRating(i)}
                onPressIn={() => setHovered(i)}
                onPressOut={() => setHovered(0)}
                style={styles.starBtn}
                activeOpacity={0.8}>
                <Ionicons
                  name={i <= displayRating ? 'star' : 'star-outline'}
                  size={42}
                  color={i <= displayRating ? Colors.greenFresh : Colors.grayLight}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.ratingLabel, { color: rating > 0 ? Colors.greenForest : Colors.gray }]}>
            {getRatingLabel(displayRating)}
          </Text>
        </View>

        {/* Quick Tags */}
        <View style={styles.tagsSection}>
          <Text style={styles.tagsTitle}>Quick Tags (optional)</Text>
          <View style={styles.tagsRow}>
            {['🚀 Fast Delivery', '🍛 Tasty Food', '📦 Good Packaging', '💰 Great Value', '😊 Friendly Driver'].map(tag => {
              const active = comment.includes(tag.split(' ').slice(1).join(' '));
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tag, active && styles.tagActive]}
                  onPress={() => {
                    const word = tag.split(' ').slice(1).join(' ');
                    setComment(prev => prev.includes(word) ? prev.replace(word, '').trim() : (prev + ' ' + word).trim());
                  }}>
                  <Text style={[styles.tagText, active && styles.tagTextActive]}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Comment Box */}
        <View style={styles.commentSection}>
          <Text style={styles.commentTitle}>Your Review</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Tell us more about your experience…"
            placeholderTextColor={Colors.grayLight}
            multiline
            numberOfLines={5}
            value={comment}
            onChangeText={setComment}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{comment.length}/500</Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, (rating === 0 || submitting) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={rating === 0 || submitting}>
          <Text style={styles.submitBtnText}>
            {submitting ? 'Submitting…' : '🚀 Submit Review'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.offWhite },

  header: {
    backgroundColor: Colors.greenForest,
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 40 : 12,
    paddingBottom: 16, paddingHorizontal: 16, gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.black, textAlign: 'center' },

  scroll: { padding: Spacing.screenMargin, paddingBottom: 40 },

  restCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.white, borderRadius: 18,
    padding: 16, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  restIcon: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: Colors.greenLight,
    alignItems: 'center', justifyContent: 'center',
  },
  restLabel: { fontSize: 12, color: Colors.gray, marginBottom: 2 },
  restName: { fontSize: 17, fontWeight: '700', color: Colors.black },

  ratingSection: {
    backgroundColor: Colors.white, borderRadius: 18,
    padding: 20, marginBottom: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  ratingPrompt: { fontSize: 15, fontWeight: '600', color: Colors.charcoal, marginBottom: 16 },
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  starBtn: { padding: 4 },
  ratingLabel: { fontSize: 16, fontWeight: '700' },

  tagsSection: { marginBottom: 16 },
  tagsTitle: { fontSize: 14, fontWeight: '600', color: Colors.charcoal, marginBottom: 10 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1.5, borderColor: Colors.grayBg,
  },
  tagActive: { backgroundColor: Colors.greenLight, borderColor: Colors.greenForest },
  tagText: { fontSize: 13, color: Colors.charcoal, fontWeight: '500' },
  tagTextActive: { color: Colors.greenForest, fontWeight: '700' },

  commentSection: { marginBottom: 24 },
  commentTitle: { fontSize: 14, fontWeight: '600', color: Colors.charcoal, marginBottom: 10 },
  commentInput: {
    backgroundColor: Colors.white, borderRadius: 14,
    padding: 14, fontSize: 14, color: Colors.black,
    borderWidth: 1.5, borderColor: Colors.greenMint,
    minHeight: 120,
  },
  charCount: { fontSize: 11, color: Colors.grayLight, textAlign: 'right', marginTop: 4 },

  submitBtn: {
    backgroundColor: Colors.greenForest, borderRadius: 16,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: Colors.greenForest,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  submitBtnDisabled: { backgroundColor: Colors.grayLight, shadowOpacity: 0 },
  submitBtnText: { color: Colors.black, fontSize: 16, fontWeight: '700' },
});
