import { messages as enMessages } from "../messages/en";
import { messages as ruMessages } from "../messages/ru";
import { messages as kzMessages } from "../messages/kz";

export type Language = "en" | "ru" | "kz";

const messagesMap = {
  en: enMessages,
  ru: ruMessages,
  kz: kzMessages,
};

export const getLanguage = (): Language => {
  if (typeof window === "undefined") return "en";
  const savedLanguage = localStorage.getItem("language") as Language;
  if (savedLanguage && (savedLanguage === "en" || savedLanguage === "ru" || savedLanguage === "kz")) {
    return savedLanguage;
  }
  return "en";
};

export const setLanguage = (language: Language) => {
  localStorage.setItem("language", language);
};

export const getMessages = (language?: Language) => {
  const currentLanguage = language ?? getLanguage();
  return messagesMap[currentLanguage];
};

export const languageNames: Record<Language, string> = {
  en: "English",
  ru: "Русский",
  kz: "Қазақша",
};
