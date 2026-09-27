import { useCallback, useEffect, useRef, useState } from 'react';

import {
  loadOnboardingState,
  saveOnboardingCompleted,
  saveOnboardingStarted,
} from '@/game/onboarding/storage';

export type OnboardingStatus =
  | 'loading'
  | 'candidate'
  | 'active'
  | 'completed';

export function useOnboarding() {
  const [status, setStatus] = useState<OnboardingStatus>('loading');
  const mountedRef = useRef(true);
  const isBeginningRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    void loadOnboardingState().then((state) => {
      if (!mountedRef.current) return;
      setStatus(
        state === null ? 'candidate' : state.completed ? 'completed' : 'active'
      );
    });

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const beginOnboarding = useCallback(async () => {
    if (status !== 'candidate' || isBeginningRef.current) return false;

    isBeginningRef.current = true;
    const didSave = await saveOnboardingStarted();
    isBeginningRef.current = false;

    if (mountedRef.current) {
      setStatus((current) => (current === 'candidate' ? 'active' : current));
    }
    return didSave;
  }, [status]);

  const completeOnboarding = useCallback(async () => {
    if (mountedRef.current) setStatus('completed');
    return saveOnboardingCompleted();
  }, []);

  return {
    status,
    isActive: status === 'active',
    isResolved: status === 'active' || status === 'completed',
    beginOnboarding,
    completeOnboarding,
  };
}
