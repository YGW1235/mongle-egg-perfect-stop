import { HIT_RECOVERY_INTERVAL_MS, INITIAL_HIT_ENERGY_STATE, MAX_HITS } from './constants';
import type {
  ConsumeHitEnergyResult,
  GrantHitEnergyResult,
  HitEnergyState,
} from './types';

export function getInitialHitEnergyState(): HitEnergyState {
  return { ...INITIAL_HIT_ENERGY_STATE };
}

export function reconcileHitEnergy(state: HitEnergyState, nowMs: number): HitEnergyState {
  if (state.hits >= MAX_HITS || state.recoveryAnchorAt === null) {
    return getInitialHitEnergyState();
  }

  const anchorMs = Date.parse(state.recoveryAnchorAt);
  const elapsedMs = Math.max(0, nowMs - anchorMs);
  const recoveredHits = Math.floor(elapsedMs / HIT_RECOVERY_INTERVAL_MS);
  if (recoveredHits <= 0) return state;

  const hits = Math.min(MAX_HITS, state.hits + recoveredHits);
  if (hits >= MAX_HITS) return getInitialHitEnergyState();

  return {
    hits,
    recoveryAnchorAt: new Date(
      anchorMs + recoveredHits * HIT_RECOVERY_INTERVAL_MS
    ).toISOString(),
  };
}

export function consumeHitEnergyState(
  state: HitEnergyState,
  nowMs: number
): ConsumeHitEnergyResult {
  const reconciled = reconcileHitEnergy(state, nowMs);
  if (reconciled.hits <= 0) return { consumed: false, state: reconciled };

  return {
    consumed: true,
    state: {
      hits: reconciled.hits - 1,
      recoveryAnchorAt:
        reconciled.recoveryAnchorAt ?? new Date(nowMs).toISOString(),
    },
  };
}

export function grantHitEnergyState(
  state: HitEnergyState,
  nowMs: number
): GrantHitEnergyResult {
  const reconciled = reconcileHitEnergy(state, nowMs);
  if (reconciled.hits >= MAX_HITS) return { granted: false, state: reconciled };

  const hits = reconciled.hits + 1;
  return {
    granted: true,
    state: {
      hits,
      recoveryAnchorAt: hits >= MAX_HITS ? null : reconciled.recoveryAnchorAt,
    },
  };
}
