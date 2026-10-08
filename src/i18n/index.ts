import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import tr from './locales/tr.json';
import aliases from './aliases.json';

export const languages = [
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'tr', name: 'Türkçe', dir: 'ltr' },
] as const;
export const futureLanguages = ['de', 'fr', 'es', 'it', 'ar'] as const;
export function resolveLanguage(value?: string) {
  return value?.toLowerCase().split(/[-_]/)[0] === 'tr' ? 'tr' : 'en';
}
export const direction = (locale: string) => (/^(ar|he|fa|ur)(-|$)/i.test(locale) ? 'rtl' : 'ltr');
export function initialLanguage(storage?: Pick<Storage, 'getItem'>, system = 'en') {
  try {
    return resolveLanguage(storage?.getItem('ui_language') || system);
  } catch {
    return resolveLanguage(system);
  }
}
void i18next.use(initReactI18next).init({
  resources: { en: { translation: en }, tr: { translation: tr } },
  lng: initialLanguage(
    typeof localStorage === 'undefined' ? undefined : localStorage,
    typeof navigator === 'undefined' ? 'en' : navigator.language,
  ),
  fallbackLng: 'en',
  supportedLngs: ['en', 'tr'],
  keySeparator: false,
  interpolation: { escapeValue: false },
  initAsync: false,
});
export const t = (key: string, values?: Record<string, unknown>) =>
  String(i18next.t(key, values || {}));
/** Translate only known built-in labels; never pass user-authored content through this function. */
export const label = (value: string) => t((aliases as Record<string, string>)[value] || value);
export async function setLanguage(language: string, storage?: Pick<Storage, 'setItem'>) {
  const locale = resolveLanguage(language);
  try {
    (storage || (typeof localStorage === 'undefined' ? undefined : localStorage))?.setItem(
      'ui_language',
      locale,
    );
  } catch {
    /* DB preference remains authoritative. */
  }
  await i18next.changeLanguage(locale);
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale;
    document.documentElement.dir = direction(locale);
  }
}
export const locale = () => resolveLanguage(i18next.language);
export const number = (value: number) => new Intl.NumberFormat(locale()).format(value);
export function date(value: string) {
  if (!value) return '';
  // Date-only values must never shift a calendar day through timezone conversion.
  const d = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(d.getTime()) ? value : new Intl.DateTimeFormat(locale()).format(d);
}
export const currency = (value: number, code: string) =>
  new Intl.NumberFormat(locale(), { style: 'currency', currency: code }).format(value);
export default i18next;
