import { create } from 'zustand';
import type { Locale } from './keys';

interface I18nState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const STORAGE_KEY = 'knitflow:lang';

function loadLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'hu') return 'hu';
  } catch {
    // noop
  }
  return 'en';
}

export const useI18nStore = create<I18nState>(set => ({
  locale: loadLocale(),
  setLocale: (locale: Locale) => {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // noop
    }
    set({ locale });
  },
}));
