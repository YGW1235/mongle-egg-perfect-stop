import type { CreatureRarity } from '@/game/collection/types';

import type { SupportedLocale, Translate, TranslationKey } from './types';
import { ko } from './translations/ko';

export function formatInteger(value: number, locale: SupportedLocale): string {
  return new Intl.NumberFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
    maximumFractionDigits: 0,
  }).format(value);
}

export function translateRarity(
  t: Translate,
  rarity: CreatureRarity
): string {
  return t(`rarity.${rarity}` as TranslationKey);
}

export function translateCreatureDescription(
  t: Translate,
  creatureId: string,
  fallback: string
): string {
  const key = `creatures.${creatureId}.description`;
  if (!Object.prototype.hasOwnProperty.call(ko, key)) {
    if (__DEV__) console.warn(`Missing creature description translation: ${key}`);
    return fallback;
  }
  return t(key as TranslationKey);
}
