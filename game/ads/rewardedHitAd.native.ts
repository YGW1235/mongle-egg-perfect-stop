import { useCallback, useEffect, useRef, useState } from 'react';
import { AdEventType, RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';

import { IS_REWARDED_TEST_AD, REWARDED_AD_UNIT_ID } from './adUnits';
import { useAdsConsent } from './consent';
import { updateAdsDiagnostics } from './diagnostics';
import type {
  RewardedHitAdController,
  RewardedHitAdOptions,
} from './rewardedHitAd.types';

export function useRewardedHitAd({
  onEarnedReward,
  onAdWillShow,
  onAdDismissed,
}: RewardedHitAdOptions): RewardedHitAdController {
  const { readiness } = useAdsConsent();
  const [loadCycle, setLoadCycle] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isShowing, setIsShowing] = useState(false);
  const [error, setError] = useState<RewardedHitAdController['error']>(null);

  const adRef = useRef<RewardedAd | null>(null);
  const loadedRef = useRef(false);
  const showingRef = useRef(false);
  const rewardGrantedRef = useRef(false);
  const rewardCompletionRef = useRef<Promise<void>>(Promise.resolve());
  const onEarnedRewardRef = useRef(onEarnedReward);
  const onAdWillShowRef = useRef(onAdWillShow);
  const onAdDismissedRef = useRef(onAdDismissed);

  useEffect(() => {
    onEarnedRewardRef.current = onEarnedReward;
  }, [onEarnedReward]);

  useEffect(() => {
    onAdWillShowRef.current = onAdWillShow;
    onAdDismissedRef.current = onAdDismissed;
  }, [onAdDismissed, onAdWillShow]);

  useEffect(() => {
    let disposed = false;
    const unsubscribers: (() => void)[] = [];

    adRef.current = null;
    loadedRef.current = false;
    rewardGrantedRef.current = false;
    rewardCompletionRef.current = Promise.resolve();
    updateAdsDiagnostics({
      isTestRewarded: IS_REWARDED_TEST_AD,
      rewardedState: 'not-created',
    });
    setIsLoaded(false);
    setIsLoading(readiness !== 'adsUnavailable');
    setError(null);

    if (readiness !== 'adsReady') {
      if (readiness === 'adsUnavailable') setError('unavailable');
      return () => {
        disposed = true;
      };
    }

    const rewardedAd = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    });
    adRef.current = rewardedAd;
    updateAdsDiagnostics({ rewardedState: 'created' });

    unsubscribers.push(
      rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
        if (disposed) return;
        loadedRef.current = true;
        setIsLoaded(true);
        setIsLoading(false);
        setError(null);
        updateAdsDiagnostics({ rewardedState: 'loaded' });
      }),
      rewardedAd.addAdEventListener(AdEventType.OPENED, () => {
        if (disposed) return;
        showingRef.current = true;
        setIsShowing(true);
      }),
      rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        if (disposed || rewardGrantedRef.current) return;
        rewardGrantedRef.current = true;
        rewardCompletionRef.current = Promise.resolve(onEarnedRewardRef.current()).catch(
          (rewardError: unknown) => {
            console.warn('Failed to grant rewarded hit.', rewardError);
          }
        );
      }),
      rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
        if (disposed) return;
        loadedRef.current = false;
        showingRef.current = false;
        setIsLoaded(false);
        setIsShowing(false);
        setIsLoading(true);
        onAdDismissedRef.current?.();
        updateAdsDiagnostics({ rewardedState: 'not-created' });
        void rewardCompletionRef.current.then(() => {
          if (!disposed) setLoadCycle((cycle) => cycle + 1);
        });
      }),
      rewardedAd.addAdEventListener(AdEventType.ERROR, (adError) => {
        if (disposed) return;
        const wasShowing = showingRef.current;
        const errorCode = 'code' in adError ? adError.code : null;
        updateAdsDiagnostics({
          rewardedState: 'error',
          rewardedLoadErrorCode:
            typeof errorCode === 'string' || typeof errorCode === 'number'
              ? errorCode
              : null,
          rewardedLoadErrorMessage: adError.message,
        });
        if (__DEV__) {
          console.warn('[RewardedAd] load failed.', {
            code: errorCode,
            message: adError.message,
          });
        }
        console.warn('Rewarded ad unavailable.', adError);
        loadedRef.current = false;
        showingRef.current = false;
        setIsLoaded(false);
        setIsLoading(false);
        setIsShowing(false);
        setError('unavailable');
        if (wasShowing) onAdDismissedRef.current?.();
      })
    );

    if (__DEV__) {
      console.info('[RewardedAd] preload started.', {
        adUnitId: REWARDED_AD_UNIT_ID,
        isTestAd: IS_REWARDED_TEST_AD,
      });
    }
    updateAdsDiagnostics({ rewardedState: 'loading' });
    rewardedAd.load();

    return () => {
      if (showingRef.current) onAdDismissedRef.current?.();
      disposed = true;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      if (adRef.current !== null) adRef.current = null;
      updateAdsDiagnostics({ rewardedState: 'not-created' });
    };
  }, [loadCycle, readiness]);

  const showRewardedAd = useCallback((): boolean => {
    const rewardedAd = adRef.current;
    if (
      readiness !== 'adsReady' ||
      rewardedAd === null ||
      !loadedRef.current ||
      showingRef.current
    ) {
      return false;
    }

    loadedRef.current = false;
    showingRef.current = true;
    setIsLoaded(false);
    setIsShowing(true);
    onAdWillShowRef.current?.();

    try {
      void rewardedAd.show().catch((showError: unknown) => {
        console.warn('Failed to show rewarded ad.', showError);
        showingRef.current = false;
        setIsShowing(false);
        setError('unavailable');
        onAdDismissedRef.current?.();
      });
      return true;
    } catch (showError: unknown) {
      console.warn('Failed to show rewarded ad.', showError);
      showingRef.current = false;
      setIsShowing(false);
      setError('unavailable');
      onAdDismissedRef.current?.();
      return false;
    }
  }, [readiness]);

  const reload = useCallback(() => {
    if (readiness !== 'adsReady' || showingRef.current) return;
    setLoadCycle((cycle) => cycle + 1);
  }, [readiness]);

  return {
    readiness,
    isSupported: true,
    isLoaded,
    isLoading,
    isShowing,
    error,
    showRewardedAd,
    reload,
  };
}
