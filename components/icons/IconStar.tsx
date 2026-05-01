import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

export const IconStar = ({ size = 16, active = true }) => (
  <View style={{
    width: size,
    height: size,
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    <Ionicons 
      name={active ? "star" : "star-outline"} 
      size={size} 
      color={active ? Colors.greenFresh : Colors.greenMint} 
    />
  </View>
);
