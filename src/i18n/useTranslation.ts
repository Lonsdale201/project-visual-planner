import { useCallback } from 'react';
import { useI18nStore } from './i18nStore';
import type { TranslationKey, Translations } from './keys';
import en from './locales/en';
import hu from './locales/hu';

const localeMap: Record<string, Translations> = { en, hu };

function resolve(obj: unknown, path: string): string | undefined {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : undefined;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key];
    return value != null ? String(value) : `{${key}}`;
  });
}

export type TFunction = (key: TranslationKey, params?: Record<string, string | number>) => string;

export function useT(): TFunction {
  const locale = useI18nStore(s => s.locale);

  return useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      const translations = localeMap[locale] ?? en;
      const value = resolve(translations, key) ?? resolve(en, key) ?? key;
      return interpolate(value, params);
    },
    [locale],
  );
}

/** Non-hook version for use outside components (e.g. exportPdf) */
export function getT(locale: string): TFunction {
  const translations = localeMap[locale] ?? en;
  return (key: TranslationKey, params?: Record<string, string | number>): string => {
    const value = resolve(translations, key) ?? resolve(en, key) ?? key;
    return interpolate(value, params);
  };
}
