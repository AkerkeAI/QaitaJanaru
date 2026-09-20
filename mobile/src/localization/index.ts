import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';
import * as SecureStore from 'expo-secure-store';
import { kk } from './kk';
import { ru } from './ru';

export type Language = 'kk' | 'ru';
const LANGUAGE_KEY = 'qaitajanaru_language';

export const i18n = new I18n({ kk, ru });
i18n.enableFallback = true;
i18n.defaultLocale = 'ru';

export function deviceLanguage(): Language {
  const locale = Localization.getLocales()[0]?.languageCode?.toLowerCase();
  return locale === 'kk' ? 'kk' : 'ru';
}

export async function loadLanguage(): Promise<Language> {
  const stored = await SecureStore.getItemAsync(LANGUAGE_KEY);
  return stored === 'kk' || stored === 'ru' ? stored : deviceLanguage();
}

export async function saveLanguage(language: Language) {
  await SecureStore.setItemAsync(LANGUAGE_KEY, language);
}

export function setLanguage(language: Language) {
  i18n.locale = language;
}

export { kk, ru };
