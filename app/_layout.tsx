import { Stack } from 'expo-router';

import { AdsConsentProvider } from '@/game/ads/consent';
import { AudioProvider } from '@/game/audio/AudioProvider';
import { LocalizationProvider } from '@/game/localization/LocalizationProvider';
import { GameSettingsProvider } from '@/hooks/useGameSettings';

export default function RootLayout() {
  return (
    <AdsConsentProvider>
      <GameSettingsProvider>
        <LocalizationProvider>
          <AudioProvider>
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            />
          </AudioProvider>
        </LocalizationProvider>
      </GameSettingsProvider>
    </AdsConsentProvider>
  );
}
