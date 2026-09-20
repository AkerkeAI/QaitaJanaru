import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { EmptyState } from '../components/EmptyState';
import { colors, radius, shadows, spacing } from '../theme';
import { useLanguage } from '../contexts/LanguageContext';

export default function ScanScreen() {
  const { t } = useLanguage();
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  return (
    <ScreenContainer>
      <Text style={styles.title}>{t('scan.title')}</Text>
      <Text style={styles.subtitle}>{t('scan.subtitle')}</Text>

      <View style={styles.cameraCard}>
        {showCamera && permission?.granted ? (
          <CameraView style={styles.camera} facing="back" />
        ) : (
          <>
            <View style={styles.cameraIcon}>
              <Ionicons name="camera-outline" size={30} color={colors.primaryDark} />
            </View>
            <Text style={styles.cameraTitle}>{t('scan.ready')}</Text>
            <Text style={styles.cameraText}>{t('scan.cameraNote')}</Text>
          </>
        )}
      </View>

      <Pressable
        onPress={async () => {
          if (!permission?.granted) {
            await requestPermission();
          }
          setShowCamera(true);
        }}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Ionicons name="camera" size={20} color={colors.card} />
        <Text style={styles.buttonText}>{showCamera ? t('scan.cameraReady') : t('scan.openCamera')}</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>{t('scan.recent')}</Text>
      <EmptyState icon="scan-outline" message={t('scan.empty')} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.ink, fontSize: 30, fontWeight: '800', marginTop: spacing.sm },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: spacing.sm },
  cameraCard: { alignItems: 'center', backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, height: 260, justifyContent: 'center', marginTop: spacing.xl, overflow: 'hidden', padding: spacing.xl, ...shadows.card },
  camera: { ...StyleSheet.absoluteFill },
  cameraIcon: { alignItems: 'center', backgroundColor: colors.softGreen, borderRadius: 18, height: 64, justifyContent: 'center', width: 64 },
  cameraTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', marginTop: spacing.md },
  cameraText: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: spacing.sm, textAlign: 'center' },
  button: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.md, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', marginTop: spacing.md, paddingVertical: 16 },
  pressed: { opacity: 0.82 },
  buttonText: { color: colors.card, fontSize: 16, fontWeight: '800' },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', marginTop: spacing.xl },
});
