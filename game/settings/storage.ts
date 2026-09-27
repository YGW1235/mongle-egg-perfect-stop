import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_GAME_SETTINGS, type GameSettings } from './types';

export const GAME_SETTINGS_STORAGE_KEY = 'egg-crack-settings-v1';

let settingsSaveQueue: Promise<void> = Promise.resolve();

function getDefaultSettings(): GameSettings {
  return { ...DEFAULT_GAME_SETTINGS };
}

type NormalizedGameSettings = {
  settings: GameSettings;
  shouldPersist: boolean;
};

function normalizeGameSettings(value: unknown): NormalizedGameSettings | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  const settings = value as Record<string, unknown>;
  const allowedKeys = new Set([
    'hapticsEnabled',
    'sfxEnabled',
    'bgmEnabled',
    'guideRingEnabled',
    'languagePreference',
  ]);
  if (
    Object.keys(settings).some((key) => !allowedKeys.has(key)) ||
    typeof settings.hapticsEnabled !== 'boolean' ||
    typeof settings.sfxEnabled !== 'boolean' ||
    typeof settings.bgmEnabled !== 'boolean' ||
    (settings.guideRingEnabled !== undefined &&
      typeof settings.guideRingEnabled !== 'boolean')
  ) {
    return null;
  }

  const hasGuideRingSetting = typeof settings.guideRingEnabled === 'boolean';
  const hasValidLanguagePreference =
    settings.languagePreference === 'system' ||
    settings.languagePreference === 'ko' ||
    settings.languagePreference === 'en';
  return {
    settings: {
      hapticsEnabled: settings.hapticsEnabled,
      sfxEnabled: settings.sfxEnabled,
      bgmEnabled: settings.bgmEnabled,
      guideRingEnabled:
        typeof settings.guideRingEnabled === 'boolean'
          ? settings.guideRingEnabled
          : true,
      languagePreference:
        settings.languagePreference === 'ko' || settings.languagePreference === 'en'
          ? settings.languagePreference
          : 'system',
    },
    shouldPersist: !hasGuideRingSetting || !hasValidLanguagePreference,
  };
}

async function persistGameSettings(settings: GameSettings): Promise<boolean> {
  try {
    await AsyncStorage.setItem(GAME_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch (error: unknown) {
    console.warn('Failed to save game settings.', error);
    return false;
  }
}

export async function loadGameSettings(): Promise<GameSettings> {
  let stored: string | null;

  try {
    stored = await AsyncStorage.getItem(GAME_SETTINGS_STORAGE_KEY);
  } catch (error: unknown) {
    console.warn('Failed to load game settings.', error);
    return getDefaultSettings();
  }

  if (stored === null) return getDefaultSettings();

  try {
    const parsed: unknown = JSON.parse(stored);
    const normalized = normalizeGameSettings(parsed);
    if (normalized !== null) {
      if (normalized.shouldPersist) {
        await persistGameSettings(normalized.settings);
      }
      return normalized.settings;
    }
  } catch {
    // Invalid JSON is repaired below using the default schema.
  }

  if (__DEV__) console.warn('Repairing invalid game settings with defaults.');
  const defaults = getDefaultSettings();
  await persistGameSettings(defaults);
  return defaults;
}

export function saveGameSettings(settings: GameSettings): Promise<boolean> {
  const operation = settingsSaveQueue.then(() => persistGameSettings(settings));
  settingsSaveQueue = operation.then(
    () => undefined,
    () => undefined
  );
  return operation;
}
