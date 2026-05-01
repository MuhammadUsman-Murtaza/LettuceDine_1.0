import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

export const IconRestaurant = ({ size = 24, color = Colors.greenForest }) => (
  <View style={{
    width: size,
    height: size,
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    <Ionicons name="restaurant" size={size} color={color} />
  </View>
);
