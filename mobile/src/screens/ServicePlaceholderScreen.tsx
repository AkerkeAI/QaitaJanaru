import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../components/EmptyState';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppStackParamList } from '../../App';
import { colors, spacing } from '../theme';
import { useLanguage } from '../contexts/LanguageContext';

type Props = NativeStackScreenProps<AppStackParamList, 'Map' | 'WasteGuide' | 'Challenges' | 'Activity' | 'Quiz' | 'EcoHero' | 'Settings'>;

export default function ServicePlaceholderScreen({ route }: Props) {
  const { t } = useLanguage();
  const iconByRoute: Record<string, keyof typeof Ionicons.glyphMap> = {
    Map: 'map-outline', WasteGuide: 'book-outline', Challenges: 'flag-outline', Activity: 'pulse-outline',
    Quiz: 'help-circle-outline', EcoHero: 'card-outline', Settings: 'settings-outline',
  };

  if (!route.params) return null;
  const titleKeys: Record<string, string> = { Map: 'services.map', WasteGuide: 'services.wasteGuide', Challenges: 'services.challenges', Activity: 'profile.activity', Quiz: 'services.quiz', EcoHero: 'services.hero' };
  const subtitleKeys: Record<string, string> = { Map: 'services.mapSub', WasteGuide: 'services.wasteGuideSub', Challenges: 'services.challengesSub', Activity: 'common.noActivity', Quiz: 'services.quizSub', EcoHero: 'services.heroSub' };

  return (
    <ScreenContainer>
      <View style={styles.icon}><Ionicons name={iconByRoute[route.name]} size={28} color={colors.primaryDark} /></View>
      <Text style={styles.title}>{titleKeys[route.name] ? t(titleKeys[route.name]) : route.params.title}</Text>
      <Text style={styles.subtitle}>{subtitleKeys[route.name] ? t(subtitleKeys[route.name]) : route.params.description}</Text>
      <EmptyState message="This service is ready for the next product connection." />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  icon: { alignItems: 'center', backgroundColor: colors.softGreen, borderRadius: 18, height: 64, justifyContent: 'center', marginTop: spacing.sm, width: 64 },
  title: { color: colors.ink, fontSize: 30, fontWeight: '800', marginTop: spacing.lg },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: spacing.sm },
});
