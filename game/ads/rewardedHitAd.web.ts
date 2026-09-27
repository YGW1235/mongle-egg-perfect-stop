import type {
  RewardedHitAdController,
  RewardedHitAdOptions,
} from './rewardedHitAd.types';

const doNothing = () => {};
const cannotShowAd = () => false;

export function useRewardedHitAd(
  _options: RewardedHitAdOptions
): RewardedHitAdController {
  return {
    readiness: 'adsUnavailable',
    isSupported: false,
    isLoaded: false,
    isLoading: false,
    isShowing: false,
    error: 'unavailable',
    showRewardedAd: cannotShowAd,
    reload: doNothing,
  };
}
