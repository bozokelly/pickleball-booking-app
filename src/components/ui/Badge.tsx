import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { borderRadius, typography, spacing } from '@/constants/theme';

interface BadgeProps {
  label: string;
  color: string;
  textColor?: string;
  style?: ViewStyle;
}

export function Badge({ label, color, textColor = '#FFFFFF', style }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: color }, style]}>
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    ...typography.caption2,
    fontWeight: '600',
  },
});
