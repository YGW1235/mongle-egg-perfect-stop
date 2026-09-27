import AsyncStorage from '@react-native-async-storage/async-storage';

import { CREATURES_BY_ID } from './creatures';
import type { CollectedCreature, CollectionData } from './types';

export const COLLECTION_STORAGE_KEY = 'egg-crack-collection-v1';

export type CollectCreatureOnceResult = {
  collection: CollectionData;
  collected: CollectedCreature | undefined;
  isNew: boolean;
  applied: boolean;
  persisted: boolean;
};

let collectionMutationQueue: Promise<void> = Promise.resolve();

function enqueueCollectionOperation<T>(operation: () => Promise<T>): Promise<T> {
  const result = collectionMutationQueue.then(operation);
  collectionMutationQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeCollectedCreature(
  value: unknown,
  key: string
): CollectedCreature | null {
  if (!isRecord(value)) return null;
  if (
    value.creatureId !== key ||
    typeof value.count !== 'number' ||
    !Number.isInteger(value.count) ||
    value.count < 1 ||
    typeof value.firstDiscoveredAt !== 'string' ||
    Number.isNaN(Date.parse(value.firstDiscoveredAt))
  ) {
    return null;
  }

  const normalized: CollectedCreature = {
    creatureId: key,
    count: value.count,
    firstDiscoveredAt: value.firstDiscoveredAt,
  };
  if (
    typeof value.lastAppliedRewardId === 'string' &&
    value.lastAppliedRewardId.trim().length > 0
  ) {
    normalized.lastAppliedRewardId = value.lastAppliedRewardId;
  }
  return normalized;
}

function parseCollection(value: string): CollectionData {
  const parsed: unknown = JSON.parse(value);
  if (!isRecord(parsed)) return {};

  const collection: CollectionData = {};
  for (const [creatureId, entry] of Object.entries(parsed)) {
    const normalized = normalizeCollectedCreature(entry, creatureId);
    if (CREATURES_BY_ID[creatureId] === undefined || normalized === null) {
      return {};
    }
    collection[creatureId] = normalized;
  }

  return collection;
}

async function readCollection(): Promise<CollectionData> {
  try {
    const stored = await AsyncStorage.getItem(COLLECTION_STORAGE_KEY);
    return stored === null ? {} : parseCollection(stored);
  } catch (error: unknown) {
    console.warn('Failed to load collection data.', error);
    return {};
  }
}

export function loadCollection(): Promise<CollectionData> {
  return enqueueCollectionOperation(readCollection);
}

export async function saveCollection(collection: CollectionData): Promise<boolean> {
  try {
    await AsyncStorage.setItem(COLLECTION_STORAGE_KEY, JSON.stringify(collection));
    return true;
  } catch (error: unknown) {
    console.warn('Failed to save collection data.', error);
    return false;
  }
}

export function collectCreature(creatureId: string): Promise<CollectionData> {
  return enqueueCollectionOperation(async () => {
    const collection = await readCollection();
    if (CREATURES_BY_ID[creatureId] === undefined) {
      console.warn(`Cannot collect unknown creature: ${creatureId}`);
      return collection;
    }
    const existing = collection[creatureId];
    const collected: CollectedCreature = existing
      ? { ...existing, count: existing.count + 1 }
      : {
          creatureId,
          count: 1,
          firstDiscoveredAt: new Date().toISOString(),
        };
    const nextCollection = { ...collection, [creatureId]: collected };

    const didSave = await saveCollection(nextCollection);
    return didSave ? nextCollection : collection;
  });
}

export function collectCreatureOnce(
  creatureId: string,
  transactionId: string
): Promise<CollectCreatureOnceResult> {
  return enqueueCollectionOperation(async () => {
    const collection = await readCollection();
    if (
      CREATURES_BY_ID[creatureId] === undefined ||
      typeof transactionId !== 'string' ||
      transactionId.trim().length === 0
    ) {
      console.warn(`Cannot apply invalid creature reward: ${creatureId}`);
      return {
        collection,
        collected: collection[creatureId],
        isNew: false,
        applied: false,
        persisted: false,
      };
    }

    const existing = collection[creatureId];
    if (existing?.lastAppliedRewardId === transactionId) {
      return {
        collection,
        collected: existing,
        isNew: existing.count === 1,
        applied: false,
        persisted: true,
      };
    }

    const isNew = existing === undefined;
    const collected: CollectedCreature = existing
      ? {
          ...existing,
          count: existing.count + 1,
          lastAppliedRewardId: transactionId,
        }
      : {
          creatureId,
          count: 1,
          firstDiscoveredAt: new Date().toISOString(),
          lastAppliedRewardId: transactionId,
        };
    const nextCollection = { ...collection, [creatureId]: collected };
    const persisted = await saveCollection(nextCollection);

    return {
      collection: persisted ? nextCollection : collection,
      collected: persisted ? collected : existing,
      isNew,
      applied: persisted,
      persisted,
    };
  });
}

export function getCollectedCreature(
  collection: CollectionData,
  creatureId: string
): CollectedCreature | undefined {
  return collection[creatureId];
}

export function getUniqueCollectedCount(collection: CollectionData): number {
  return Object.keys(collection).filter(
    (creatureId) => CREATURES_BY_ID[creatureId] !== undefined
  ).length;
}
