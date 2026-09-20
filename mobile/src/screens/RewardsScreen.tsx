import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mockApi } from '../services/mockApi';
import { ScreenContainer } from '../components/ScreenContainer';
import { useLanguage } from '../contexts/LanguageContext';

export default function RewardsScreen() {
  const { t } = useLanguage();
  const [rewards, setRewards] = useState<any[]>([]);

  useEffect(() => {
    void (async () => {
      const data = await mockApi.getRewards();
      setRewards(data);
    })();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenContainer>
        <Text style={styles.title}>{t('services.rewards')}</Text>
        {rewards.map((reward) => (
          <View key={reward.id} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.name}>{reward.titleKey ? t(reward.titleKey) : reward.title}</Text>
              <Text style={styles.points}>{reward.points} pts</Text>
            </View>
            <Text style={styles.meta}>{reward.category} • {reward.partner}</Text>
          </View>
        ))}
      </ScreenContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F8FC' },
  title: { fontSize: 28, fontWeight: '800', color: '#10231A', marginBottom: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 17, fontWeight: '700', color: '#10231A' },
  points: { fontSize: 15, fontWeight: '700', color: '#1FAF73' },
  meta: { fontSize: 13, color: '#6A7685', marginTop: 8 },
});
