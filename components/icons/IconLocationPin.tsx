import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

export const IconLocationPin = ({ size = 24, color = Colors.greenFresh }) => (
  <View style={{
    width: size,
    height: size,
    borderRadius: size / 2,
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    <Ionicons name="location" size={size} color={color} />
  </View>
);
