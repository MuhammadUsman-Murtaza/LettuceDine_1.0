import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: string;
}

export const FilterChip = ({ label, active, onPress, icon }: FilterChipProps) => {
  return (
    <TouchableOpacity
      style={[styles.chip, active ? styles.activeChip : styles.inactiveChip]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={[styles.label, active ? styles.activeLabel : styles.inactiveLabel]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
  },
  activeChip: {
    backgroundColor: Colors.greenForest,
  },
  inactiveChip: {
    backgroundColor: Colors.grayBg,
  },
  label: {
    ...Typography.body,
    fontWeight: '600',
  },
  activeLabel: {
    color: Colors.white,
  },
  inactiveLabel: {
    color: Colors.charcoal,
  },
  icon: {
    marginRight: 4,
    fontSize: 14,
  },
});
