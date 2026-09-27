import { Grade } from './types';

export const MAX_EGG_HP = 100_000;

export const COUNTDOWN_INTERVAL_MS = 600;
export const GO_DISPLAY_MS = 400;
export const ZERO_HOLD_MS = 650;
export const QUICK_HOLD_MS = 500;
export const RESULT_DELAY_MS = 180;
export const HATCH_ENTRY_DELAY_MS = 240;
export const AUTO_MISS_AFTER_MS = 650;

export const START_RING_SIZE = 60;
export const TARGET_RING_SIZE = 270;

export const EXACT_HIT_DAMAGE = 24_000;
export const TAP_MODE_DAMAGE = 1;
export const HARD_MODE_BONUS_MIN = 1;
export const HARD_MODE_BONUS_MAX = 1_000;

export const DAMAGE: Record<Grade, number> = {
  PERFECT: 20_000,
  EXCELLENT: 16_000,
  GREAT: 12_000,
  GOOD: 7_000,
  MISS: 2_000,
};

export const FRAGMENT_ANGLES = [-145, -100, -45, 15, 65, 135] as const;
