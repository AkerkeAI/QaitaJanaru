import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mockApi } from '../services/mockApi';
import { ScreenContainer } from '../components/ScreenContainer';
import { useLanguage } from '../contexts/LanguageContext';

export default function RankingsScreen() {
  const { t } = useLanguage();
  const [rankings, setRankings] = useState<any[]>([]);

  useEffect(() => {
    void (async () => {
      const data = await mockApi.getRankings();
      setRankings(data);
    })();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenContainer>
        <Text style={styles.title}>{t('services.rankings')}</Text>
        {rankings.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.badge}>{item.badge}</Text>
            <View style={styles.textBlock}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>{item.city}</Text>
            </View>
            <View style={styles.scoreBlock}>
              <Text style={styles.score}>{item.points}</Text>
              <Text style={styles.rank}>#{item.rank}</Text>
            </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  badge: { fontSize: 26, marginRight: 14 },
  textBlock: { flex: 1 },
  name: { fontSize: 17, fontWeight: '700', color: '#10231A' },
  meta: { fontSize: 13, color: '#6A7685', marginTop: 4 },
  scoreBlock: { alignItems: 'flex-end' },
  score: { fontSize: 18, fontWeight: '700', color: '#1FAF73' },
  rank: { fontSize: 12, color: '#6A7685', marginTop: 4 },
});
