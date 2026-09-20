import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

type ServiceTileProps = {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  onPress: () => void;
};

export function ServiceTile({ title, subtitle, icon, tint, onPress }: ServiceTileProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
      <View style={[styles.iconBox, { backgroundColor: `${tint}18` }]}>
        <Ionicons name={icon} size={21} color={tint} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text numberOfLines={2} style={styles.subtitle}>{subtitle}</Text> : null}
      <Ionicons name="arrow-forward" size={15} color={colors.muted} style={styles.arrow} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, minHeight: 132, padding: spacing.md, width: '47.5%' },
  pressed: { backgroundColor: '#F8FCFA', opacity: 0.85 },
  iconBox: { alignItems: 'center', borderRadius: 11, height: 38, justifyContent: 'center', width: 38 },
  title: { color: colors.ink, fontSize: 14, fontWeight: '800', marginTop: spacing.sm },
  subtitle: { color: colors.muted, fontSize: 11, lineHeight: 15, marginTop: 4 },
  arrow: { alignSelf: 'flex-end', marginTop: spacing.sm },
});