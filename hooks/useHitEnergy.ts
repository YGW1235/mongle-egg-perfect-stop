import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import {
  HIT_RECOVERY_INTERVAL_MS,
  INITIAL_HIT_ENERGY_STATE,
  MAX_HITS,
} from '@/game/energy/constants';
import {
  consumeStoredHit,
  grantStoredHit,
  loadHitEnergy,
  refreshStoredHitEnergy,
} from '@/game/energy/storage';
import { consumeHitEnergyState } from '@/game/energy/logic';
import type { HitEnergyState } from '@/game/energy/types';

export function useHitEnergy() {
  const [energy, setEnergy] = useState<HitEnergyState>(INITIAL_HIT_ENERGY_STATE);
  const [isHydrated, setIsHydrated] = useState(false);
  const energyRef = useRef<HitEnergyState>(INITIAL_HIT_ENERGY_STATE);
  const hydratedRef = useRef(false);
  const mountedRef = useRef(true);

  const applyEnergy = useCallback((nextEnergy: HitEnergyState) => {
    energyRef.current = nextEnergy;
    if (mountedRef.current) setEnergy(nextEnergy);
  }, []);

  const refreshEnergy = useCallback(async () => {
    const nextEnergy = await refreshStoredHitEnergy();
    applyEnergy(nextEnergy);
    return nextEnergy;
  }, [applyEnergy]);

  useEffect(() => {
    mountedRef.current = true;

    void loadHitEnergy().then((storedEnergy) => {
      if (!mountedRef.current) return;
      applyEnergy(storedEnergy);
      hydratedRef.current = true;
      setIsHydrated(true);
    });

    return () => {
      mountedRef.current = false;
      hydratedRef.current = false;
    };
  }, [applyEnergy]);

  useEffect(() => {
    if (!isHydrated) return;

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') void refreshEnergy();
    });

    return () => subscription.remove();
  }, [isHydrated, refreshEnergy]);

  const nextRecoveryAt = useMemo(() => {
    if (energy.recoveryAnchorAt === null) return null;
    return Date.parse(energy.recoveryAnchorAt) + HIT_RECOVERY_INTERVAL_MS;
  }, [energy.recoveryAnchorAt]);

  useEffect(() => {
    if (!isHydrated || nextRecoveryAt === null) return;

    const delayMs = Math.max(0, nextRecoveryAt - Date.now()) + 50;
    const timeout = setTimeout(() => void refreshEnergy(), delayMs);
    return () => clearTimeout(timeout);
  }, [isHydrated, nextRecoveryAt, refreshEnergy]);

  const consumeHit = useCallback((): boolean => {
    if (!hydratedRef.current) return false;

    const consumedAt = Date.now();
    const optimisticResult = consumeHitEnergyState(energyRef.current, consumedAt);
    if (!optimisticResult.consumed) {
      applyEnergy(optimisticResult.state);
      return false;
    }

    applyEnergy(optimisticResult.state);
    void consumeStoredHit(consumedAt).then((storedResult) => applyEnergy(storedResult.state));
    return true;
  }, [applyEnergy]);

  const grantHit = useCallback(async (): Promise<boolean> => {
    if (!hydratedRef.current) return false;

    const result = await grantStoredHit();
    applyEnergy(result.state);
    return result.granted;
  }, [applyEnergy]);

  return {
    hits: energy.hits,
    maxHits: MAX_HITS,
    isHydrated,
    nextRecoveryAt,
    nextRecoveryMs:
      nextRecoveryAt === null ? null : Math.max(0, nextRecoveryAt - Date.now()),
    consumeHit,
    grantHit,
    refreshEnergy,
  };
}
