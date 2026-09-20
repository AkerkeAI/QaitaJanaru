import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, shadows, spacing } from '../theme';

type ServiceCardProps = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  onPress: () => void;
};

export function ServiceCard({ title, description, icon, tint, onPress }: ServiceCardProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Ionicons name={icon} size={22} color={tint} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <Ionicons name="arrow-forward" size={16} color={colors.muted} style={styles.arrow} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 148,
    padding: spacing.md,
    ...shadows.card,
  },
  pressed: { opacity: 0.82 },
  title: { color: colors.ink, fontSize: 15, fontWeight: '800', marginTop: spacing.md },
  description: { color: colors.muted, flex: 1, fontSize: 12, lineHeight: 17, marginTop: spacing.xs },
  arrow: { alignSelf: 'flex-end', marginTop: spacing.sm },
});
