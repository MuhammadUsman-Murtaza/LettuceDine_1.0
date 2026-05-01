import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

export const IconChat = ({ size = 24, color = Colors.greenFresh }) => (
  <View style={{
    width: size,
    height: size,
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    <Ionicons name="chatbubble-ellipses" size={size} color={color} />
  </View>
);
