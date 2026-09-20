import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { RewardItem } from '../services/mockData';
import { colors, radius, shadows, spacing } from '../theme';
import { useLanguage } from '../contexts/LanguageContext';

type RewardCardProps = { reward: RewardItem };

export function RewardCard({ reward }: RewardCardProps) {
  const { t } = useLanguage();
  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <Ionicons name="gift-outline" size={20} color={colors.primaryDark} />
      </View>
      <Text numberOfLines={2} style={styles.title}>{reward.titleKey ? t(reward.titleKey) : reward.title}</Text>
      <Text style={styles.partner}>{reward.partner}</Text>
      <Text style={styles.points}>{reward.points} pts</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    marginRight: spacing.md,
    minHeight: 158,
    padding: spacing.md,
    width: 154,
    ...shadows.card,
  },
  iconCircle: { alignItems: 'center', backgroundColor: colors.softGreen, borderRadius: 12, height: 38, justifyContent: 'center', width: 38 },
  title: { color: colors.ink, fontSize: 14, fontWeight: '800', lineHeight: 19, marginTop: spacing.md },
  partner: { color: colors.muted, fontSize: 12, marginTop: spacing.xs },
  points: { color: colors.primaryDark, fontSize: 13, fontWeight: '800', marginTop: 'auto' },
});
