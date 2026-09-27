import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  collectCreature as collectStoredCreature,
  collectCreatureOnce as collectStoredCreatureOnce,
  getUniqueCollectedCount,
  loadCollection,
} from '@/game/collection/storage';
import type { CollectionData } from '@/game/collection/types';

export function useCollection() {
  const [collection, setCollection] = useState<CollectionData>({});
  const [isHydrated, setIsHydrated] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    void loadCollection().then((storedCollection) => {
      if (!mountedRef.current) return;
      setCollection(storedCollection);
      setIsHydrated(true);
    });

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const collectCreature = useCallback(async (creatureId: string) => {
    const nextCollection = await collectStoredCreature(creatureId);
    if (mountedRef.current) setCollection(nextCollection);
    return nextCollection[creatureId];
  }, []);

  const collectCreatureOnce = useCallback(
    async (creatureId: string, transactionId: string) => {
      const result = await collectStoredCreatureOnce(creatureId, transactionId);
      if (mountedRef.current) setCollection(result.collection);
      return result;
    },
    []
  );

  const uniqueCollectedCount = useMemo(
    () => getUniqueCollectedCount(collection),
    [collection]
  );

  return {
    collection,
    collectCreature,
    collectCreatureOnce,
    isHydrated,
    uniqueCollectedCount,
  };
}
