import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { requestPasswordReset } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { colors, radius, spacing } from '../theme';
import { AuthStackParamList } from '../../App';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;
export default function ForgotPasswordScreen({ navigation }: Props) {
  const { t } = useLanguage(); const [email, setEmail] = useState(''); const [message, setMessage] = useState(''); const [loading, setLoading] = useState(false);
  const submit = async () => { setLoading(true); try { await requestPasswordReset(email.trim()); setMessage(t('auth.forgotSoon')); } catch { setMessage(t('auth.forgotSoon')); } finally { setLoading(false); } };
  return <View style={styles.container}><Pressable onPress={() => navigation.goBack()}><Text style={styles.back}>‹ {t('auth.signIn')}</Text></Pressable><Text style={styles.title}>{t('auth.forgotPassword')}</Text><Text style={styles.subtitle}>{t('auth.forgotSoon')}</Text><TextInput autoCapitalize="none" keyboardType="email-address" placeholder={t('auth.email')} placeholderTextColor={colors.muted} style={styles.input} value={email} onChangeText={setEmail} /><Pressable onPress={() => void submit()} disabled={loading || !email} style={styles.button}><Text style={styles.buttonText}>{loading ? t('common.loading') : t('auth.signInAction')}</Text></Pressable>{message ? <Text style={styles.message}>{message}</Text> : null}</View>;
}
const styles = StyleSheet.create({ container: { backgroundColor: colors.background, flex: 1, padding: spacing.xl, paddingTop: 60 }, back: { color: colors.primaryDark, fontSize: 14, fontWeight: '700' }, title: { color: colors.ink, fontSize: 28, fontWeight: '800', marginTop: spacing.xl }, subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: spacing.sm }, input: { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, color: colors.ink, fontSize: 15, marginTop: spacing.xl, padding: 15 }, button: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.md, marginTop: spacing.md, paddingVertical: 16 }, buttonText: { color: colors.card, fontSize: 16, fontWeight: '800' }, message: { color: colors.primaryDark, fontSize: 14, marginTop: spacing.md } });
