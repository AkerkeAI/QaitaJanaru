import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NavigationProp } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { EmptyState } from '../components/EmptyState';
import { getProfile, ProfileResponse } from '../services/api';
import { colors, radius, shadows, spacing } from '../theme';
import { AppStackParamList, RootTabParamList } from '../../App';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

type Props = BottomTabScreenProps<RootTabParamList, 'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);

  useEffect(() => { if (user) void getProfile(user.id).then(setProfile).catch(() => undefined); }, [user]);

  if (!profile) return <Text style={styles.loading}>{t('common.loading')}</Text>;

  const rootNavigation = navigation.getParent<NavigationProp<AppStackParamList>>();
  const personalDetails = [profile.city, profile.user_type, profile.institution].filter((value) => value && value !== 'Unknown');

  return (
    <ScreenContainer>
      <Text style={styles.pageTitle}>{t('profile.title')}</Text>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{profile.full_name.slice(0, 1).toUpperCase()}</Text></View>
        <View style={styles.info}><Text style={styles.name}>{profile.full_name}</Text><Text style={styles.meta}>{personalDetails.join(' · ') || t('profile.detailsNotSet')}</Text></View>
      </View>

      <Pressable onPress={() => rootNavigation?.navigate('Achievements')} style={({ pressed }) => [styles.pointsCard, pressed && styles.pressed]}>
        <View style={styles.pointsCopy}><Text style={styles.label}>{t('profile.points')}</Text><Text style={styles.points}>{profile.eco_points.toLocaleString()}</Text><Text style={styles.progressLabel}>{t('profile.nextLevel')}</Text><View style={styles.progressOuter}><View style={[styles.progressInner, { width: `${profile.level_progress_percent}%` }]} /></View></View>
        <View style={styles.level}><Ionicons name="leaf-outline" size={18} color={colors.primaryDark} /><Text style={styles.levelText}>{t('profile.level')} {profile.level}</Text><Text style={styles.levelHint}>{t('profile.viewAchievements')}</Text></View>
      </Pressable>

      <Text style={styles.sectionTitle}>{t('profile.achievements')}</Text>
      <View style={styles.card}><EmptyState icon="ribbon-outline" message={t('profile.noAchievements')} /></View>

      <Text style={styles.sectionTitle}>{t('profile.stats')}</Text>
      <View style={styles.card}><Stat label={t('profile.items')} value={`${profile.total_scans}`} /><Stat label={t('profile.material')} value={`${profile.analytics.total_recycling_actions}`} /><Stat label={t('profile.co2')} value={t('common.notSet')} /></View>

      <Pressable onPress={() => rootNavigation?.navigate('Activity', { title: t('profile.activity'), description: t('common.noActivity') })} style={styles.menuRow}><Ionicons name="pulse-outline" size={20} color={colors.primaryDark} /><Text style={styles.menuText}>{t('profile.activity')}</Text><Ionicons name="chevron-forward" size={18} color={colors.muted} /></Pressable>
      <Pressable onPress={() => rootNavigation?.navigate('Settings')} style={styles.menuRow}><Ionicons name="settings-outline" size={20} color={colors.primaryDark} /><Text style={styles.menuText}>{t('profile.settings')}</Text><Ionicons name="chevron-forward" size={18} color={colors.muted} /></Pressable>
    </ScreenContainer>
  );
}

function Stat({ label, value }: { label: string; value: string }) { return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }

const styles = StyleSheet.create({
  loading: { color: colors.ink, fontSize: 16, marginTop: 50, textAlign: 'center' },
  pageTitle: { color: colors.ink, fontSize: 30, fontWeight: '800', marginTop: spacing.sm },
  profileHeader: { alignItems: 'center', flexDirection: 'row', marginTop: spacing.xl },
  avatar: { alignItems: 'center', backgroundColor: colors.softGreen, borderColor: '#CBEBDC', borderRadius: 24, borderWidth: 1, height: 78, justifyContent: 'center', width: 78 },
  avatarText: { color: colors.primaryDark, fontSize: 30, fontWeight: '800' },
  info: { flex: 1, marginLeft: spacing.md },
  name: { color: colors.ink, fontSize: 22, fontWeight: '800' },
  meta: { color: colors.muted, fontSize: 13, marginTop: 5 },
  pointsCard: { alignItems: 'center', backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xl, padding: spacing.lg, ...shadows.card },
  pressed: { opacity: 0.84 },
  pointsCopy: { flex: 1, marginRight: spacing.md },
  label: { color: colors.muted, fontSize: 13 },
  points: { color: colors.ink, fontSize: 30, fontWeight: '800', marginTop: 4 },
  progressLabel: { color: colors.muted, fontSize: 11, marginTop: spacing.sm },
  progressOuter: { backgroundColor: '#E8EEF0', borderRadius: 6, height: 7, marginTop: 5, overflow: 'hidden' },
  progressInner: { backgroundColor: colors.primary, borderRadius: 6, height: '100%' },
  level: { alignItems: 'center', backgroundColor: colors.softGreen, borderRadius: radius.sm, gap: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: 9 },
  levelText: { color: colors.primaryDark, fontSize: 12, fontWeight: '800' },
  levelHint: { color: colors.primaryDark, fontSize: 9, marginTop: 4 },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', marginBottom: spacing.md, marginTop: spacing.xl },
  card: { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, padding: spacing.md, ...shadows.card },
  achievement: { backgroundColor: colors.softGreen, borderRadius: radius.sm, color: colors.primaryDark, fontSize: 13, fontWeight: '700', marginBottom: spacing.sm, padding: spacing.sm },
  stat: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  statValue: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  statLabel: { color: colors.muted, fontSize: 13 },
  menuRow: { alignItems: 'center', backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', marginTop: spacing.md, padding: spacing.md },
  menuText: { color: colors.ink, flex: 1, fontSize: 15, fontWeight: '700', marginLeft: spacing.md },
});
