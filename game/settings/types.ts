export type LanguagePreference = 'system' | 'ko' | 'en';

export type GameSettings = {
  hapticsEnabled: boolean;
  sfxEnabled: boolean;
  bgmEnabled: boolean;
  guideRingEnabled: boolean;
  languagePreference: LanguagePreference;
};

export type GameSettingKey = keyof GameSettings;
export type BooleanGameSettingKey = Exclude<GameSettingKey, 'languagePreference'>;

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  hapticsEnabled: true,
  sfxEnabled: true,
  bgmEnabled: true,
  guideRingEnabled: true,
  languagePreference: 'system',
};
