import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLanguage } from '../contexts/LanguageContext';
import { ScreenContainer } from '../components/ScreenContainer';
import { ServiceTile } from '../components/ServiceTile';
import { colors, spacing } from '../theme';
import { AppStackParamList } from '../../App';

type Service = {
  titleKey: string;
  subtitleKey: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  route: keyof AppStackParamList;
};

const services: Service[] = [
  { titleKey: 'services.map', subtitleKey: 'services.mapSub', icon: 'map-outline', tint: '#1C8B70', route: 'Map' },
  { titleKey: 'services.wasteGuide', subtitleKey: 'services.wasteGuideSub', icon: 'book-outline', tint: '#3C7791', route: 'WasteGuide' },
  { titleKey: 'services.challenges', subtitleKey: 'services.challengesSub', icon: 'flag-outline', tint: '#C58A32', route: 'Challenges' },
  { titleKey: 'services.rankings', subtitleKey: 'services.rankingsSub', icon: 'podium-outline', tint: '#7867A8', route: 'Rankings' },
  { titleKey: 'services.rewards', subtitleKey: 'services.rewardsSub', icon: 'gift-outline', tint: '#C16A55', route: 'Rewards' },
  { titleKey: 'services.quiz', subtitleKey: 'services.quizSub', icon: 'help-circle-outline', tint: '#4D7EAD', route: 'Quiz' },
  { titleKey: 'services.hero', subtitleKey: 'services.heroSub', icon: 'card-outline', tint: '#318D6C', route: 'EcoHero' },
  { titleKey: 'services.settings', subtitleKey: 'services.settingsSub', icon: 'settings-outline', tint: '#66717A', route: 'Settings' },
];

export default function ServicesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { t } = useLanguage();

  const openService = (service: Service) => {
    if (service.route === 'Rankings') {
      navigation.navigate('Rankings');
      return;
    }
    if (service.route === 'Rewards') {
      navigation.navigate('Rewards');
      return;
    }
    if (service.route === 'Settings') {
      navigation.navigate('Settings');
      return;
    }
    navigation.dispatch(CommonActions.navigate({ name: service.route, params: { title: t(service.titleKey), description: t(service.subtitleKey) } }));
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>{t('services.title')}</Text>
      <Text style={styles.subtitle}>{t('services.subtitle')}</Text>
      <View style={styles.grid}>
        {services.map((service) => (
          <ServiceTile
            key={service.titleKey}
            title={t(service.titleKey)}
            subtitle={t(service.subtitleKey)}
            icon={service.icon}
            tint={service.tint}
            onPress={() => openService(service)}
          />
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.ink, fontSize: 30, fontWeight: '800', marginTop: spacing.sm },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: spacing.sm, maxWidth: 300 },
  grid: { columnGap: spacing.md, flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.xl, rowGap: spacing.md },
});
