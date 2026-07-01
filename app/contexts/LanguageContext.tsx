"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getLanguage, setLanguage as setLanguageUtil, getMessages, Language } from "../lib/language";
import { Messages } from "../types/messages";

interface LanguageContextType {
  language: Language;
  messages: Messages;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [language, setLanguageState] = useState<Language>("ru");
  const [messages, setMessages] = useState(getMessages("ru"));

  useEffect(() => {
  const currentLanguage = getLanguage();

  setLanguageState(currentLanguage);
  setMessages(getMessages(currentLanguage));

  setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
   setLanguageUtil(lang);
   setLanguageState(lang);
   setMessages(getMessages(lang));
  };

  if (!mounted) {
  return null;
  }
  return (
    <LanguageContext.Provider value={{ language, messages, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
