import AsyncStorage from '@react-native-async-storage/async-storage';

import { getCreatureById } from '@/game/collection/creatures';

import { MAX_EGG_HP } from './constants';

export const ACTIVE_EGG_STORAGE_KEY = 'egg-crack-active-egg-v1';
export const ACTIVE_EGG_BALANCE_VERSION = 3;

const PREVIOUS_BALANCE_VERSION = 2;
const LEGACY_MAX_EGG_HP = 500;
const PREVIOUS_MAX_EGG_HP = 10_000;
const LEGACY_HP_SCALE = 200;
const PREVIOUS_HP_SCALE = 10;

export type PendingEggReward = {
  transactionId: string;
  creatureId: string;
  createdAt: string;
};

export type ActiveEggState = {
  balanceVersion: typeof ACTIVE_EGG_BALANCE_VERSION;
  eggId: 'cream';
  hp: number;
  updatedAt: string;
  pendingReward: PendingEggReward | null;
};

export type ActiveEggNormalizationResult = {
  state: ActiveEggState;
  shouldRepair: boolean;
};

let activeEggMutationQueue: Promise<void> = Promise.resolve();
let rewardTransactionSequence = 0;
let queuedActiveEggHp: { hp: number; nowMs: number } | null = null;
let activeEggHpWriteWorker: Promise<void> | null = null;

function enqueueActiveEggOperation<T>(operation: () => Promise<T>): Promise<T> {
  const result = activeEggMutationQueue.then(operation);
  activeEggMutationQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidHp(hp: unknown): hp is number {
  return (
    typeof hp === 'number' &&
    Number.isFinite(hp) &&
    Number.isInteger(hp) &&
    hp >= 0 &&
    hp <= MAX_EGG_HP
  );
}

function isValidLegacyHp(hp: unknown): hp is number {
  return (
    typeof hp === 'number' &&
    Number.isFinite(hp) &&
    Number.isInteger(hp) &&
    hp >= 0 &&
    hp <= LEGACY_MAX_EGG_HP
  );
}

function isValidPreviousHp(hp: unknown): hp is number {
  return (
    typeof hp === 'number' &&
    Number.isFinite(hp) &&
    Number.isInteger(hp) &&
    hp >= 0 &&
    hp <= PREVIOUS_MAX_EGG_HP
  );
}

function normalizeVersionedHp(
  balanceVersion: unknown,
  hp: unknown
): { hp: number; migrated: boolean } | null {
  if (balanceVersion === undefined && isValidLegacyHp(hp)) {
    return {
      hp: Math.min(MAX_EGG_HP, Math.max(0, hp * LEGACY_HP_SCALE)),
      migrated: true,
    };
  }
  if (balanceVersion === PREVIOUS_BALANCE_VERSION && isValidPreviousHp(hp)) {
    return {
      hp: Math.min(MAX_EGG_HP, Math.max(0, hp * PREVIOUS_HP_SCALE)),
      migrated: true,
    };
  }
  if (balanceVersion === ACTIVE_EGG_BALANCE_VERSION && isValidHp(hp)) {
    return { hp, migrated: false };
  }
  return null;
}

function normalizePendingReward(value: unknown): {
  pendingReward: PendingEggReward | null;
  isValid: boolean;
} {
  if (value === undefined || value === null) {
    return { pendingReward: null, isValid: true };
  }
  if (!isRecord(value)) return { pendingReward: null, isValid: false };

  const { transactionId, creatureId, createdAt } = value;
  if (
    typeof transactionId !== 'string' ||
    transactionId.trim().length === 0 ||
    typeof creatureId !== 'string' ||
    getCreatureById(creatureId) === undefined ||
    typeof createdAt !== 'string' ||
    !Number.isFinite(Date.parse(createdAt))
  ) {
    return { pendingReward: null, isValid: false };
  }

  return {
    pendingReward: { transactionId, creatureId, createdAt },
    isValid: true,
  };
}

export function getFreshActiveEggState(nowMs = Date.now()): ActiveEggState {
  return {
    balanceVersion: ACTIVE_EGG_BALANCE_VERSION,
    eggId: 'cream',
    hp: MAX_EGG_HP,
    updatedAt: new Date(nowMs).toISOString(),
    pendingReward: null,
  };
}

export function createPendingEggReward(
  creatureId: string,
  nowMs = Date.now(),
  randomValue = Math.random()
): PendingEggReward {
  if (getCreatureById(creatureId) === undefined) {
    throw new Error(`Cannot create reward transaction for unknown creature: ${creatureId}`);
  }

  rewardTransactionSequence = (rewardTransactionSequence + 1) % Number.MAX_SAFE_INTEGER;
  const normalizedRandom = Math.min(Math.max(randomValue, 0), 1 - Number.EPSILON);
  const randomToken = Math.floor(normalizedRandom * Number.MAX_SAFE_INTEGER).toString(36);

  return {
    transactionId: `egg-reward-${nowMs.toString(36)}-${rewardTransactionSequence.toString(36)}-${randomToken}`,
    creatureId,
    createdAt: new Date(nowMs).toISOString(),
  };
}

export function normalizeActiveEggState(
  value: unknown,
  nowMs = Date.now()
): ActiveEggNormalizationResult {
  const freshState = getFreshActiveEggState(nowMs);
  if (!isRecord(value)) return { state: freshState, shouldRepair: true };

  const { balanceVersion, eggId, hp, updatedAt } = value;
  const normalizedHp = normalizeVersionedHp(balanceVersion, hp);
  if (
    eggId !== 'cream' ||
    normalizedHp === null ||
    typeof updatedAt !== 'string' ||
    !Number.isFinite(Date.parse(updatedAt))
  ) {
    return { state: freshState, shouldRepair: true };
  }

  const normalizedPending = normalizePendingReward(value.pendingReward);
  if (
    !normalizedPending.isValid ||
    (normalizedHp.hp > 0 && normalizedPending.pendingReward !== null) ||
    (normalizedHp.hp === 0 && normalizedPending.pendingReward === null)
  ) {
    return { state: freshState, shouldRepair: true };
  }

  return {
    state: {
      balanceVersion: ACTIVE_EGG_BALANCE_VERSION,
      eggId,
      hp: normalizedHp.hp,
      updatedAt,
      pendingReward: normalizedPending.pendingReward,
    },
    shouldRepair: normalizedHp.migrated,
  };
}

export function parseActiveEggState(
  serialized: string | null,
  nowMs = Date.now()
): ActiveEggNormalizationResult {
  if (serialized === null) {
    return { state: getFreshActiveEggState(nowMs), shouldRepair: true };
  }

  try {
    const parsed: unknown = JSON.parse(serialized);
    return normalizeActiveEggState(parsed, nowMs);
  } catch {
    return { state: getFreshActiveEggState(nowMs), shouldRepair: true };
  }
}

async function writeActiveEgg(state: ActiveEggState): Promise<boolean> {
  try {
    await AsyncStorage.setItem(ACTIVE_EGG_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error: unknown) {
    console.warn('Failed to save active egg progress.', error);
    return false;
  }
}

export function loadActiveEgg(nowMs = Date.now()): Promise<ActiveEggState> {
  return enqueueActiveEggOperation(async () => {
    try {
      const serialized = await AsyncStorage.getItem(ACTIVE_EGG_STORAGE_KEY);
      const normalized = parseActiveEggState(serialized, nowMs);
      if (normalized.shouldRepair) {
        if (__DEV__ && serialized !== null) {
          console.warn('Migrating or repairing active egg progress.');
        }
        await writeActiveEgg(normalized.state);
      }
      return normalized.state;
    } catch (error: unknown) {
      console.warn('Failed to load active egg progress.', error);
      const freshState = getFreshActiveEggState(nowMs);
      await writeActiveEgg(freshState);
      return freshState;
    }
  });
}

export function saveActiveEggHp(
  hp: number,
  nowMs = Date.now()
): Promise<boolean> {
  return enqueueActiveEggOperation(async () => {
    if (!isValidHp(hp)) {
      console.warn(`Cannot save invalid active egg HP: ${hp}`);
      return false;
    }

    return writeActiveEgg({
      balanceVersion: ACTIVE_EGG_BALANCE_VERSION,
      eggId: 'cream',
      hp,
      updatedAt: new Date(nowMs).toISOString(),
      pendingReward: null,
    });
  });
}

function startActiveEggHpWriteWorker(): void {
  if (activeEggHpWriteWorker !== null || queuedActiveEggHp === null) return;

  activeEggHpWriteWorker = (async () => {
    while (queuedActiveEggHp !== null) {
      const nextWrite = queuedActiveEggHp;
      queuedActiveEggHp = null;
      await saveActiveEggHp(nextWrite.hp, nextWrite.nowMs);
    }
  })().finally(() => {
    activeEggHpWriteWorker = null;
    if (queuedActiveEggHp !== null) startActiveEggHpWriteWorker();
  });
}

export function queueActiveEggHpSave(hp: number, nowMs = Date.now()): void {
  if (!isValidHp(hp)) {
    console.warn(`Cannot queue invalid active egg HP: ${hp}`);
    return;
  }

  queuedActiveEggHp = { hp, nowMs };
  startActiveEggHpWriteWorker();
}

export async function flushActiveEggHpSaves(): Promise<void> {
  while (activeEggHpWriteWorker !== null || queuedActiveEggHp !== null) {
    startActiveEggHpWriteWorker();
    const worker = activeEggHpWriteWorker;
    if (worker !== null) await worker;
  }
}

export function savePendingEggReward(
  pendingReward: PendingEggReward,
  nowMs = Date.now()
): Promise<boolean> {
  return enqueueActiveEggOperation(async () => {
    const normalized = normalizePendingReward(pendingReward);
    if (!normalized.isValid || normalized.pendingReward === null) {
      console.warn('Cannot save invalid pending egg reward.');
      return false;
    }

    return writeActiveEgg({
      balanceVersion: ACTIVE_EGG_BALANCE_VERSION,
      eggId: 'cream',
      hp: 0,
      updatedAt: new Date(nowMs).toISOString(),
      pendingReward: normalized.pendingReward,
    });
  });
}

export function resetActiveEgg(nowMs = Date.now()): Promise<boolean> {
  return saveActiveEggHp(MAX_EGG_HP, nowMs);
}
