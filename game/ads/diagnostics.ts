import { useSyncExternalStore } from 'react';

import type { AdsReadiness } from './consent.types';

export type AdsDiagnosticRequestState = 'pending' | 'success' | 'error';
export type MobileAdsInitializationState =
  | 'not-started'
  | 'initializing'
  | 'initialized'
  | 'error';
export type RewardedAdDiagnosticState =
  | 'not-created'
  | 'created'
  | 'loading'
  | 'loaded'
  | 'error';

export type AdsDiagnosticsSnapshot = {
  isDev: boolean;
  consentImplementation: 'native' | 'web' | null;
  providerMounted: boolean;
  bootstrapEffectStarted: boolean;
  isTestRewarded: boolean | null;
  isExplicitUmpDebug: boolean | null;
  consentBootstrapStarted: boolean;
  gatherConsentState: AdsDiagnosticRequestState;
  gatherConsentErrorCode: string | number | null;
  gatherConsentErrorMessage: string | null;
  getConsentInfoState: AdsDiagnosticRequestState;
  consentStatus: string | null;
  canRequestAds: boolean | null;
  privacyOptionsRequirementStatus: string | null;
  gatherConsentFailed: boolean;
  devFallbackAllowed: boolean;
  mobileAdsInitializationState: MobileAdsInitializationState;
  consentProviderState: AdsReadiness;
  rewardedState: RewardedAdDiagnosticState;
  rewardedLoadErrorCode: string | number | null;
  rewardedLoadErrorMessage: string | null;
};

const listeners = new Set<() => void>();

let snapshot: AdsDiagnosticsSnapshot = {
  isDev: __DEV__,
  consentImplementation: null,
  providerMounted: false,
  bootstrapEffectStarted: false,
  isTestRewarded: null,
  isExplicitUmpDebug: null,
  consentBootstrapStarted: false,
  gatherConsentState: 'pending',
  gatherConsentErrorCode: null,
  gatherConsentErrorMessage: null,
  getConsentInfoState: 'pending',
  consentStatus: null,
  canRequestAds: null,
  privacyOptionsRequirementStatus: null,
  gatherConsentFailed: false,
  devFallbackAllowed: false,
  mobileAdsInitializationState: 'not-started',
  consentProviderState: 'consentPending',
  rewardedState: 'not-created',
  rewardedLoadErrorCode: null,
  rewardedLoadErrorMessage: null,
};

export function markAdsConsentProviderRendered(
  consentImplementation: 'native' | 'web'
) {
  if (!__DEV__) return;

  snapshot = {
    ...snapshot,
    consentImplementation,
    providerMounted: true,
  };
}

export function updateAdsDiagnostics(patch: Partial<AdsDiagnosticsSnapshot>) {
  if (!__DEV__) return;

  snapshot = { ...snapshot, ...patch };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  if (!__DEV__) return () => {};

  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return snapshot;
}

export function useAdsDiagnostics() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
