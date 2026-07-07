import { create } from 'zustand';
import { NativeModules, Platform } from 'react-native';
import { loadPref, savePref } from '../services/prefs';
import { Language, translations } from './translations';
import type { LocalizedText } from '../types/api';

export type { Language } from './translations';
export { LANGUAGES } from './translations';

const LANG_KEY = 'language';

/** Best-effort device language → one of our supported codes (default ru). */
function detectDeviceLanguage(): Language {
  try {
    const locale =
      Platform.OS === 'ios'
        ? NativeModules.SettingsManager?.settings?.AppleLocale ??
          NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
        : NativeModules.I18nManager?.localeIdentifier;
    const lower = String(locale ?? '').toLowerCase();
    if (lower.startsWith('kk')) return 'kk';
    if (lower.startsWith('en')) return 'en';
    if (lower.startsWith('ru')) return 'ru';
  } catch {
    // ignore
  }
  return 'ru';
}

interface LocaleState {
  language: Language;
  setLanguage: (lang: Language) => void;
  hydrate: () => Promise<void>;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  language: 'ru',
  setLanguage: (lang) => {
    set({ language: lang });
    void savePref(LANG_KEY, lang);
  },
  hydrate: async () => {
    const saved = (await loadPref(LANG_KEY)) as Language | null;
    if (saved && translations[saved]) {
      set({ language: saved });
    } else {
      set({ language: detectDeviceLanguage() });
    }
  },
}));

type Params = Record<string, string | number>;

function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    params[k] != null ? String(params[k]) : `{${k}}`,
  );
}

/** Resolve a key for a specific language with English/key fallback. */
export function translate(
  lang: Language,
  key: string,
  params?: Params,
): string {
  const value =
    translations[lang]?.[key] ?? translations.en[key] ?? key;
  return interpolate(value, params);
}

/**
 * Hook returning a `t(key, params?)` function bound to the current language.
 * Components using it re-render when the language changes.
 */
export function useT(): (key: string, params?: Params) => string {
  const language = useLocaleStore((s) => s.language);
  return (key: string, params?: Params) => translate(language, key, params);
}

/** Pick a route/checkpoint/tip's content string for a given language,
 *  falling back to `ru` then `en` if the requested language isn't filled in
 *  yet (content is translated in the admin panel after `ru` is authored). */
export function pickLocalized(text: LocalizedText, lang: Language): string {
  return text[lang] || text.ru || text.en || text.kk || '';
}

/** Hook variant of {@link pickLocalized} bound to the current app language. */
export function usePickLocalized(): (text: LocalizedText) => string {
  const language = useLocaleStore((s) => s.language);
  return (text: LocalizedText) => pickLocalized(text, language);
}
