import React, { createContext, useContext, useEffect, useState } from 'react';
import { i18n, Language, loadLanguage, saveLanguage, setLanguage } from '../localization';

export type { Language } from '../localization';

type LanguageContextValue = { language: Language; setAppLanguage: (language: Language) => Promise<void>; t: (key: string, options?: Record<string, unknown>) => string; ready: boolean };
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ru');
  const [ready, setReady] = useState(false);

  useEffect(() => { void loadLanguage().then((stored) => { setLanguage(stored); setLanguageState(stored); setReady(true); }); }, []);

  const setAppLanguage = async (next: Language) => { setLanguage(next); setLanguageState(next); await saveLanguage(next); };
  const t = (key: string, options?: Record<string, unknown>) => i18n.t(key, options);

  return <LanguageContext.Provider value={{ language, setAppLanguage, t, ready }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}
