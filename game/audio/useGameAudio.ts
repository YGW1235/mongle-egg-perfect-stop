import { useContext } from 'react';

import { GameAudioContext } from './AudioProvider';

export function useGameAudio() {
  const context = useContext(GameAudioContext);
  if (context === null) {
    throw new Error('useGameAudio must be used inside AudioProvider.');
  }
  return context;
}
