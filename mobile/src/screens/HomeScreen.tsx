import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NavigationProp } from '@react-navigation/native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { RewardCard } from '../components/RewardCard';
import { mockApi } from '../services/mockApi';
import { Challenge, RewardItem } from '../services/mockData';
import { getProfile, ProfileResponse } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { colors, radius, shadows, spacing } from '../theme';
import { RootTabParamList, AppStackParamList } from '../../App';

type Props = BottomTabScreenProps<RootTabParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [rewards, setRewards] = useState<RewardItem[]>([]);

  useEffect(() => {
    if (!user) return;
    void Promise.all([getProfile(user.id), mockApi.getChallenges(), mockApi.getRewards()]).then(([profileData, challenges, rewardData]) => {
      setProfile(profileData);
      setChallenge(challenges[0] ?? null);
      setRewards(rewardData.slice(0, 3));
    });
  }, [user]);

  if (!profile || !challenge) {
    return <SafeAreaView style={styles.safeArea}><Text style={styles.loading}>{t('common.loading')}</Text></SafeAreaView>;
  }

  const rootNavigation = navigation.getParent<NavigationProp<AppStackParamList>>();
  const progress = Math.min(challenge.progress / challenge.total, 1);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenContainer>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>{t('home.welcome')}</Text>
            <Text style={styles.title}>{profile.full_name}</Text>
          </View>
          <View style={styles.avatar}><Text style={styles.avatarText}>{profile.full_name.slice(0, 1).toUpperCase()}</Text></View>
        </View>

        <View style={styles.pointsCard}>
          <View style={styles.pointsTop}><Text style={styles.pointsLabel}>{t('profile.points')}</Text><Ionicons name="leaf-outline" size={20} color={colors.primary} /></View>
          <View style={styles.pointsRow}><Text style={styles.pointsValue}>{profile.eco_points.toLocaleString()}</Text><Text style={styles.rank}>{t('profile.level')} {profile.level}</Text></View>
        </View>

        <Pressable onPress={() => navigation.navigate('Scan')} style={({ pressed }) => [styles.scanButton, pressed && styles.pressed]}>
          <View><Text style={styles.scanEyebrow}>{t('home.scanEyebrow')}</Text><Text style={styles.scanTitle}>{t('home.scan')}</Text><Text style={styles.scanText}>{t('home.scanText')}</Text></View>
          <View style={styles.scanIcon}><Ionicons name="scan-outline" size={28} color={colors.primaryDark} /></View>
        </Pressable>

        <SectionHeader title={t('home.currentChallenge')} actionLabel={t('home.viewAll')} onActionPress={() => rootNavigation?.navigate('Challenges', { title: t('services.challenges'), description: t('services.challengesSub') })} />
        <View style={styles.challengeCard}>
          <View style={styles.challengeHeading}><Text style={styles.challengeTitle}>{challenge.titleKey ? t(challenge.titleKey) : challenge.title}</Text><Text style={styles.challengeProgress}>{challenge.progress}/{challenge.total}</Text></View>
          <View style={styles.progressOuter}><View style={[styles.progressInner, { width: `${progress * 100}%` }]} /></View>
          <View style={styles.challengeFooter}><Text style={styles.muted}>{Math.round(progress * 100)}% {t('home.complete')}</Text><Text style={styles.reward}>+{challenge.reward} pts</Text></View>
        </View>

        <SectionHeader title={t('home.rewards')} actionLabel={t('home.seeAll')} onActionPress={() => rootNavigation?.navigate('Rewards')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rewardRow}>
          {rewards.map((reward) => <RewardCard key={reward.id} reward={reward} />)}
        </ScrollView>

        <SectionHeader title={t('home.impact')} />
        <View style={styles.impactCard}>
          <ImpactStat icon="repeat-outline" value={`${profile.total_scans}`} label={t('profile.items')} />
          <ImpactStat icon="scale-outline" value={`${profile.analytics.total_recycling_actions}`} label={t('profile.material')} />
          <ImpactStat icon="cloud-outline" value={t('common.notSet')} label={t('profile.co2')} />
        </View>
      </ScreenContainer>
    </SafeAreaView>
  );
}

function ImpactStat({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string }) {
  return <View style={styles.impactStat}><Ionicons name={icon} size={18} color={colors.primaryDark} /><Text style={styles.impactValue}>{value}</Text><Text style={styles.impactLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  loading: { color: colors.ink, fontSize: 16, fontWeight: '700', marginTop: 50, textAlign: 'center' },
  headerRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  eyebrow: { color: colors.muted, fontSize: 13, marginBottom: 4 },
  title: { color: colors.ink, fontSize: 30, fontWeight: '800' },
  avatar: { alignItems: 'center', backgroundColor: colors.softGreen, borderColor: '#CBEBDC', borderRadius: 18, borderWidth: 1, height: 52, justifyContent: 'center', width: 52 },
  avatarText: { color: colors.primaryDark, fontSize: 20, fontWeight: '800' },
  pointsCard: { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, ...shadows.card },
  pointsTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  pointsLabel: { color: colors.muted, fontSize: 14, fontWeight: '600' },
  pointsRow: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  pointsValue: { color: colors.ink, fontSize: 34, fontWeight: '800' },
  rank: { color: colors.primaryDark, fontSize: 13, fontWeight: '700', marginBottom: 6 },
  scanButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.lg, flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, ...shadows.card },
  pressed: { opacity: 0.84 },
  scanEyebrow: { color: '#DDF8EC', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  scanTitle: { color: colors.card, fontSize: 22, fontWeight: '800', marginTop: 4 },
  scanText: { color: '#E8FFF3', fontSize: 13, marginTop: 4 },
  scanIcon: { alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, height: 58, justifyContent: 'center', width: 58 },
  challengeCard: { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, padding: spacing.md, ...shadows.card },
  challengeHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  challengeTitle: { color: colors.ink, flex: 1, fontSize: 15, fontWeight: '800', marginRight: spacing.sm },
  challengeProgress: { color: colors.primaryDark, fontSize: 13, fontWeight: '800' },
  progressOuter: { backgroundColor: '#E8EEF0', borderRadius: 8, height: 8, marginTop: spacing.md, overflow: 'hidden' },
  progressInner: { backgroundColor: colors.primary, borderRadius: 8, height: '100%' },
  challengeFooter: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  muted: { color: colors.muted, fontSize: 12 },
  reward: { color: colors.primaryDark, fontSize: 12, fontWeight: '800' },
  rewardRow: { paddingBottom: spacing.sm },
  impactCard: { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md, ...shadows.card },
  impactStat: { alignItems: 'center', flex: 1 },
  impactValue: { color: colors.ink, fontSize: 15, fontWeight: '800', marginTop: spacing.sm },
  impactLabel: { color: colors.muted, fontSize: 11, marginTop: 4, textAlign: 'center' },
});
