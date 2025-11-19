'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations } from '../lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.en) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  // Initialize language from localStorage or browser
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('language') as Language;
    if (stored && (stored === 'en' || stored === 'ko')) {
      setLanguageState(stored);
    } else {
      // Detect browser language
      const browserLang = navigator.language.toLowerCase();
      const detectedLang = browserLang.startsWith('ko') ? 'ko' : 'en';
      setLanguageState(detectedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: keyof typeof translations.en): string => {
    const translation = translations[language][key];

    // Fallback to English if translation is missing
    if (translation === undefined || translation === '') {
      console.warn(`Missing translation for key "${key}" in language "${language}", falling back to English`);
      return translations.en[key];
    }

    return translation;
  };

  // Always provide the context, even during SSR
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
