import { getRelativeLocaleUrl } from 'astro:i18n';
import es from './es';
import en from './en';

// The site name is one word, used identically in every locale and never
// translated.
export const SITE_NAME = 'Glototeca';

// Must match `i18n` in astro.config.mjs.
export const locales = ['es', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'es';

export type UiKey = keyof typeof es;

const dictionaries: Record<Locale, Record<UiKey, string>> = { es, en };

/** Returns t(key) for one locale. */
export function useTranslations(locale: Locale) {
  return (key: UiKey): string => dictionaries[locale][key];
}

/**
 * Internal link for a locale: base path + locale prefix + path.
 * localePath('es', 'about') -> /Language-Resource-Tracker-/about/
 * localePath('en', 'about') -> /Language-Resource-Tracker-/en/about/
 * Every internal link goes through this; never write a leading "/".
 */
export function localePath(locale: Locale, path = ''): string {
  return getRelativeLocaleUrl(locale, path);
}

/** The other locale, for the language switch. */
export function otherLocale(locale: Locale): Locale {
  return locale === 'es' ? 'en' : 'es';
}
