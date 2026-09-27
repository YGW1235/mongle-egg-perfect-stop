import type { TranslateOptions } from 'i18n-js';

import type { TranslationKey } from './translations/ko';

export type SupportedLocale = 'ko' | 'en';

export type Translate = (
  key: TranslationKey,
  options?: TranslateOptions
) => string;

export type { TranslationKey };
