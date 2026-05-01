import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { IconRestaurant } from '@/components/icons/IconRestaurant';
import { IconStar } from '@/components/icons/IconStar';
import { IconLocationPin } from '@/components/icons/IconLocationPin';

interface RestaurantCardProps {
  restaurant: any; // Keep 'any' for now since we don't have the full restaurant type definition
  onPress: () => void;
}

export const RestaurantCard = ({ restaurant, onPress }: RestaurantCardProps) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imagePlaceholder}>
        <IconRestaurant size={40} color={Colors.white} />
      </View>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>{restaurant.name}</Text>
          <View style={styles.ratingBadge}>
            <IconStar size={12} active={true} />
            <Text style={styles.ratingText}>{restaurant.rating || 'N/A'}</Text>
          </View>
        </View>
        <View style={styles.locationRow}>
          <IconLocationPin size={14} color={Colors.gray} />
          <Text style={styles.locationText} numberOfLines={1}>
            {restaurant.city}, {restaurant.street}
          </Text>
        </View>
        <View style={styles.footerRow}>
          <Text style={styles.affordability}>{restaurant.affordability}</Text>
          <Text style={styles.time}>🕐 25-30 min</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.large,
    marginBottom: Spacing.large,
    ...Spacing.shadow.card,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    height: 120,
    backgroundColor: Colors.greenMint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.large,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.small,
  },
  title: {
    ...Typography.cardTitle,
    flex: 1,
    marginRight: Spacing.small,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.greenLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Spacing.borderRadius.small,
  },
  ratingText: {
    ...Typography.caption,
    color: Colors.greenForest,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.medium,
  },
  locationText: {
    ...Typography.caption,
    marginLeft: 4,
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.small,
    borderTopWidth: 1,
    borderTopColor: Colors.grayBg,
  },
  affordability: {
    ...Typography.body,
    color: Colors.greenFresh,
    fontWeight: 'bold',
  },
  time: {
    ...Typography.caption,
    fontWeight: '500',
  },
});
