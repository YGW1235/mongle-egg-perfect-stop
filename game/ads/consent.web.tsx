import { createContext, useContext, type PropsWithChildren } from 'react';

import type { AdsConsentController } from './consent.types';
import { markAdsConsentProviderRendered } from './diagnostics';

const cannotShowPrivacyOptions = async () => false;

const WEB_ADS_CONSENT: AdsConsentController = {
  readiness: 'adsUnavailable',
  privacyOptionsRequired: false,
  isPrivacyOptionsBusy: false,
  showPrivacyOptions: cannotShowPrivacyOptions,
};

const AdsConsentContext = createContext<AdsConsentController>(WEB_ADS_CONSENT);

export function AdsConsentProvider({ children }: PropsWithChildren) {
  markAdsConsentProviderRendered('web');

  return <AdsConsentContext.Provider value={WEB_ADS_CONSENT}>{children}</AdsConsentContext.Provider>;
}

export function useAdsConsent(): AdsConsentController {
  return useContext(AdsConsentContext);
}
