import type { Grade } from '@/game/egg/types';

export type HitSoundJudgment = Grade | 'EXACT';
export type EggCrackSoundKind = 'light' | 'heavy';
export type CountdownSoundValue = 3 | 2 | 1 | 'GO';

export type GameAudioController = {
  playHit: (judgment: HitSoundJudgment) => void;
  playEggCrack: (kind: EggCrackSoundKind) => void;
  playEggBreak: () => void;
  playHatchRise: () => void;
  playCollectionNew: () => void;
  playCollectionDuplicate: () => void;
  playCountdown: (value: CountdownSoundValue) => void;
  playUiClick: () => void;
  pauseBgmForAd: () => void;
  resumeBgmAfterAd: () => void;
};
