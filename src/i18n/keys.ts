import type en from './locales/en';

// Deep structure type: maps leaf string literals to string, preserves nested shape
type DeepStringify<T> = T extends string
  ? string
  : T extends Record<string, unknown>
    ? { [K in keyof T]: DeepStringify<T[K]> }
    : T;

// Recursive dot-path type extraction from translation shape
type DotPath<T, Prefix extends string = ''> = T extends string
  ? Prefix
  : T extends Record<string, unknown>
    ? {
        [K in keyof T & string]: DotPath<T[K], Prefix extends '' ? K : `${Prefix}.${K}`>;
      }[keyof T & string]
    : never;

type RawTranslations = typeof en;
export type Translations = DeepStringify<RawTranslations>;
export type TranslationKey = DotPath<RawTranslations>;
export type Locale = 'en' | 'hu';
