export type AdsReadiness =
  | 'consentPending'
  | 'adsReady'
  | 'adsUnavailable';

export type AdsConsentController = {
  readiness: AdsReadiness;
  privacyOptionsRequired: boolean;
  isPrivacyOptionsBusy: boolean;
  showPrivacyOptions: () => Promise<boolean>;
};
