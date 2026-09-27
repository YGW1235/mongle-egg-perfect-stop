import { useLocales } from 'expo-localization';
import { I18n, type TranslateOptions } from 'i18n-js';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type PropsWithChildren,
} from 'react';

import { useGameSettings } from '@/hooks/useGameSettings';

import type { SupportedLocale, Translate, TranslationKey } from './types';
import { en } from './translations/en';
import { ko } from './translations/ko';

type LocalizationContextValue = {
  locale: SupportedLocale;
  t: Translate;
};

const LocalizationContext = createContext<LocalizationContextValue | null>(null);

function resolveSystemLocale(languageCode: string | null | undefined): SupportedLocale {
  return languageCode?.toLowerCase() === 'ko' ? 'ko' : 'en';
}

export function LocalizationProvider({ children }: PropsWithChildren) {
  const locales = useLocales();
  const { settings, isHydrated } = useGameSettings();
  const systemLocale = resolveSystemLocale(locales[0]?.languageCode);
  const locale =
    settings.languagePreference === 'system'
      ? systemLocale
      : settings.languagePreference;
  const i18n = useMemo(() => {
    const instance = new I18n(
      { en, ko },
      {
        defaultLocale: 'en',
        defaultSeparator: '|',
        enableFallback: true,
        locale: 'en',
      }
    );
    instance.missingTranslation.register('safe', (_currentI18n, scope) => {
      const missingKey = Array.isArray(scope) ? scope.join('.') : String(scope);
      if (__DEV__) console.warn(`Missing translation: ${missingKey}`);
      return '';
    });
    instance.missingBehavior = 'safe';
    return instance;
  }, []);

  i18n.locale = locale;

  const t = useCallback(
    (key: TranslationKey, options?: TranslateOptions) =>
      i18n.translate<string>(key, options),
    [i18n, locale]
  );
  const value = useMemo(() => ({ locale, t }), [locale, t]);

  if (!isHydrated) return null;

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useTranslation(): LocalizationContextValue {
  const context = useContext(LocalizationContext);
  if (context === null) {
    throw new Error('useTranslation must be used inside LocalizationProvider.');
  }
  return context;
}
