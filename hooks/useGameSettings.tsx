import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import { setHapticsEnabled } from '@/game/haptics';
import { loadGameSettings, saveGameSettings } from '@/game/settings/storage';
import {
  DEFAULT_GAME_SETTINGS,
  type GameSettingKey,
  type GameSettings,
} from '@/game/settings/types';

type GameSettingsContextValue = {
  settings: GameSettings;
  isHydrated: boolean;
  setSetting: <Key extends GameSettingKey>(
    key: Key,
    value: GameSettings[Key]
  ) => void;
};

const GameSettingsContext = createContext<GameSettingsContextValue | null>(null);

export function GameSettingsProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_GAME_SETTINGS);
  const [isHydrated, setIsHydrated] = useState(false);
  const settingsRef = useRef<GameSettings>(DEFAULT_GAME_SETTINGS);
  const isHydratedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    void loadGameSettings().then((storedSettings) => {
      if (cancelled) return;

      settingsRef.current = storedSettings;
      isHydratedRef.current = true;
      setHapticsEnabled(storedSettings.hapticsEnabled);
      setSettings(storedSettings);
      setIsHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const setSetting = useCallback(<Key extends GameSettingKey,>(
    key: Key,
    value: GameSettings[Key]
  ) => {
    if (!isHydratedRef.current) return;

    const nextSettings = {
      ...settingsRef.current,
      [key]: value,
    };
    settingsRef.current = nextSettings;
    if (key === 'hapticsEnabled') setHapticsEnabled(value as boolean);
    setSettings(nextSettings);
    void saveGameSettings(nextSettings);
  }, []);

  const value = useMemo(
    () => ({ settings, isHydrated, setSetting }),
    [isHydrated, setSetting, settings]
  );

  return (
    <GameSettingsContext.Provider value={value}>
      {children}
    </GameSettingsContext.Provider>
  );
}

export function useGameSettings(): GameSettingsContextValue {
  const context = useContext(GameSettingsContext);
  if (context === null) {
    throw new Error('useGameSettings must be used inside GameSettingsProvider.');
  }
  return context;
}
