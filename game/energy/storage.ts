import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  HIT_ENERGY_STORAGE_KEY,
  MAX_HITS,
} from './constants';
import {
  consumeHitEnergyState,
  grantHitEnergyState,
  getInitialHitEnergyState,
  reconcileHitEnergy,
} from './logic';
import type {
  ConsumeHitEnergyResult,
  GrantHitEnergyResult,
  HitEnergyState,
} from './types';

let energyMutationQueue: Promise<void> = Promise.resolve();

function enqueueEnergyOperation<T>(operation: () => Promise<T>): Promise<T> {
  const result = energyMutationQueue.then(operation);
  energyMutationQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseHitEnergy(value: string, nowMs: number): HitEnergyState | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;

  const { hits, recoveryAnchorAt } = parsed;
  if (
    typeof hits !== 'number' ||
    !Number.isInteger(hits) ||
    hits < 0 ||
    hits > MAX_HITS
  ) {
    return null;
  }

  if (hits === MAX_HITS) {
    return recoveryAnchorAt === null ? { hits, recoveryAnchorAt } : null;
  }

  if (typeof recoveryAnchorAt !== 'string') return null;
  const anchorMs = Date.parse(recoveryAnchorAt);
  if (!Number.isFinite(anchorMs) || anchorMs > nowMs) return null;

  return { hits, recoveryAnchorAt: new Date(anchorMs).toISOString() };
}

function statesMatch(left: HitEnergyState, right: HitEnergyState): boolean {
  return left.hits === right.hits && left.recoveryAnchorAt === right.recoveryAnchorAt;
}

async function saveHitEnergy(state: HitEnergyState): Promise<void> {
  try {
    await AsyncStorage.setItem(HIT_ENERGY_STORAGE_KEY, JSON.stringify(state));
  } catch (error: unknown) {
    console.warn('Failed to save hit energy.', error);
  }
}

async function readAndReconcileHitEnergy(nowMs: number): Promise<HitEnergyState> {
  try {
    const stored = await AsyncStorage.getItem(HIT_ENERGY_STORAGE_KEY);
    const parsed = stored === null ? null : parseHitEnergy(stored, nowMs);
    const state = parsed ?? getInitialHitEnergyState();
    const reconciled = reconcileHitEnergy(state, nowMs);

    if (stored === null || parsed === null || !statesMatch(state, reconciled)) {
      await saveHitEnergy(reconciled);
    }
    return reconciled;
  } catch (error: unknown) {
    console.warn('Failed to load hit energy.', error);
    return getInitialHitEnergyState();
  }
}

export function loadHitEnergy(nowMs = Date.now()): Promise<HitEnergyState> {
  return enqueueEnergyOperation(() => readAndReconcileHitEnergy(nowMs));
}

export function refreshStoredHitEnergy(nowMs = Date.now()): Promise<HitEnergyState> {
  return enqueueEnergyOperation(() => readAndReconcileHitEnergy(nowMs));
}

export function consumeStoredHit(nowMs = Date.now()): Promise<ConsumeHitEnergyResult> {
  return enqueueEnergyOperation(async () => {
    const current = await readAndReconcileHitEnergy(nowMs);
    const result = consumeHitEnergyState(current, nowMs);
    if (result.consumed) await saveHitEnergy(result.state);
    return result;
  });
}

export function grantStoredHit(nowMs = Date.now()): Promise<GrantHitEnergyResult> {
  return enqueueEnergyOperation(async () => {
    const current = await readAndReconcileHitEnergy(nowMs);
    const result = grantHitEnergyState(current, nowMs);
    if (result.granted) await saveHitEnergy(result.state);
    return result;
  });
}
