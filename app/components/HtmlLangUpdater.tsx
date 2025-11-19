'use client';

import { useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * Component that updates the HTML lang attribute when language changes
 * This is important for accessibility and SEO
 * Note: Must be used inside LanguageProvider
 */
export function HtmlLangUpdater() {
  const { language } = useLanguage();

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return null;
}
