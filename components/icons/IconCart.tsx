import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

export const IconCart = ({ size = 24, color = Colors.greenForest }) => (
  <View style={{
    width: size,
    height: size,
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    <Ionicons name="cart" size={size} color={color} />
  </View>
);
