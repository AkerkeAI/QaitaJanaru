import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

type EmptyStateProps = { icon?: keyof typeof Ionicons.glyphMap; message: string };

export function EmptyState({ icon = 'information-circle-outline', message }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={22} color={colors.muted} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: spacing.lg },
  message: { color: colors.muted, fontSize: 14, marginTop: spacing.sm, textAlign: 'center' },
});
