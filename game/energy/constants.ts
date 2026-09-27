import type { HitEnergyState } from './types';

export const MAX_HITS = 7;
export const HIT_RECOVERY_INTERVAL_MS = 60 * 60 * 1000;
export const HIT_ENERGY_STORAGE_KEY = 'egg-crack-hit-energy-v1';

export const INITIAL_HIT_ENERGY_STATE: HitEnergyState = {
  hits: MAX_HITS,
  recoveryAnchorAt: null,
};

