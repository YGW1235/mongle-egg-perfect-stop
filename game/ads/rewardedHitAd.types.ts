import type { AdsReadiness } from './consent.types';

export type RewardedHitAdError = 'unavailable' | null;

export type RewardedHitAdOptions = {
  onEarnedReward: () => void | Promise<void>;
  onAdWillShow?: () => void;
  onAdDismissed?: () => void;
};

export type RewardedHitAdController = {
  readiness: AdsReadiness;
  isSupported: boolean;
  isLoaded: boolean;
  isLoading: boolean;
  isShowing: boolean;
  error: RewardedHitAdError;
  showRewardedAd: () => boolean;
  reload: () => void;
};
