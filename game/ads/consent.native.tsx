import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import mobileAds, {
  AdsConsent,
  AdsConsentDebugGeography,
  AdsConsentPrivacyOptionsRequirementStatus,
  type AdsConsentInfo,
  type AdsConsentInfoOptions,
} from 'react-native-google-mobile-ads';

import { IS_REWARDED_TEST_AD } from './adUnits';
import type { AdsConsentController, AdsReadiness } from './consent.types';
import {
  markAdsConsentProviderRendered,
  updateAdsDiagnostics,
} from './diagnostics';

const AdsConsentContext = createContext<AdsConsentController | null>(null);

let mobileAdsInitialization: Promise<void> | null = null;

function initializeMobileAdsOnce(): Promise<void> {
  if (mobileAdsInitialization === null) {
    if (__DEV__) console.info('[AdsConsent] mobileAds().initialize() called.');
    updateAdsDiagnostics({ mobileAdsInitializationState: 'initializing' });
    mobileAdsInitialization = mobileAds()
      .initialize()
      .then(() => {
        updateAdsDiagnostics({ mobileAdsInitializationState: 'initialized' });
        if (__DEV__) console.info('[AdsConsent] Mobile Ads initialization completed.');
      }, (error: unknown) => {
        updateAdsDiagnostics({ mobileAdsInitializationState: 'error' });
        throw error;
      });
  }
  return mobileAdsInitialization;
}

type ConsentDebugConfig = {
  options: AdsConsentInfoOptions;
  isExplicitEeaDebug: boolean;
};

type ConsentBootstrapResult = {
  consentInfo: AdsConsentInfo | null;
  gatherFailed: boolean;
};

function getErrorDetails(error: unknown): { code: string | number | null; message: string } {
  const errorObject =
    typeof error === 'object' && error !== null
      ? (error as { code?: unknown; message?: unknown })
      : null;
  const code =
    typeof errorObject?.code === 'string' || typeof errorObject?.code === 'number'
      ? errorObject.code
      : null;
  const message =
    typeof errorObject?.message === 'string' ? errorObject.message : String(error);

  return { code, message };
}

function summarizeConsentInfo(consentInfo: AdsConsentInfo) {
  return {
    status: consentInfo.status,
    canRequestAds: consentInfo.canRequestAds,
    privacyOptionsRequirementStatus: consentInfo.privacyOptionsRequirementStatus,
  };
}

function updateConsentInfoDiagnostics(consentInfo: AdsConsentInfo) {
  updateAdsDiagnostics({
    consentStatus: consentInfo.status,
    canRequestAds: consentInfo.canRequestAds,
    privacyOptionsRequirementStatus: consentInfo.privacyOptionsRequirementStatus,
  });
}

function getConsentDebugConfig(): ConsentDebugConfig {
  if (!__DEV__) return { options: {}, isExplicitEeaDebug: false };

  const geography = process.env.EXPO_PUBLIC_UMP_DEBUG_GEOGRAPHY;
  const testDeviceId = process.env.EXPO_PUBLIC_UMP_TEST_DEVICE_ID?.trim();
  if (geography !== 'EEA' || !testDeviceId) {
    return { options: {}, isExplicitEeaDebug: false };
  }

  return {
    options: {
      debugGeography: AdsConsentDebugGeography.EEA,
      testDeviceIdentifiers: [testDeviceId],
    },
    isExplicitEeaDebug: true,
  };
}

async function gatherCurrentConsentInfo(
  options: AdsConsentInfoOptions
): Promise<ConsentBootstrapResult> {
  let gatheredInfo: AdsConsentInfo | null = null;
  let gatherFailed = false;

  try {
    gatheredInfo = await AdsConsent.gatherConsent(options);
    updateConsentInfoDiagnostics(gatheredInfo);
    updateAdsDiagnostics({ gatherConsentState: 'success' });
    if (__DEV__) {
      console.info(
        '[AdsConsent] gatherConsent succeeded.',
        summarizeConsentInfo(gatheredInfo)
      );
    }
  } catch (error: unknown) {
    gatherFailed = true;
    const errorDetails = getErrorDetails(error);
    updateAdsDiagnostics({
      gatherConsentState: 'error',
      gatherConsentFailed: true,
      gatherConsentErrorCode: errorDetails.code,
      gatherConsentErrorMessage: errorDetails.message,
    });
    if (__DEV__) {
      console.warn('[AdsConsent] gatherConsent failed.', errorDetails);
    }
    console.warn('Google UMP consent gathering failed.', error);
  }

  try {
    const consentInfo = await AdsConsent.getConsentInfo();
    updateConsentInfoDiagnostics(consentInfo);
    updateAdsDiagnostics({ getConsentInfoState: 'success' });
    if (__DEV__) {
      console.info(
        '[AdsConsent] getConsentInfo result.',
        summarizeConsentInfo(consentInfo)
      );
    }
    return { consentInfo, gatherFailed };
  } catch (error: unknown) {
    updateAdsDiagnostics({ getConsentInfoState: 'error' });
    if (__DEV__) {
      console.warn('[AdsConsent] getConsentInfo failed.', getErrorDetails(error));
      if (gatheredInfo !== null) {
        console.info(
          '[AdsConsent] using gatherConsent result.',
          summarizeConsentInfo(gatheredInfo)
        );
      }
    }
    return { consentInfo: gatheredInfo, gatherFailed };
  }
}

export function AdsConsentProvider({ children }: PropsWithChildren) {
  markAdsConsentProviderRendered('native');

  const [readiness, setReadiness] = useState<AdsReadiness>('consentPending');
  const [privacyOptionsRequired, setPrivacyOptionsRequired] = useState(false);
  const [isPrivacyOptionsBusy, setIsPrivacyOptionsBusy] = useState(false);
  const mountedRef = useRef(true);
  const privacyOptionsPromiseRef = useRef<Promise<boolean> | null>(null);

  const applyConsentInfo = useCallback(
    async (consentInfo: AdsConsentInfo | null, allowDevTestAdFallback = false) => {
      if (!mountedRef.current) return;

      if (consentInfo !== null) {
        updateConsentInfoDiagnostics(consentInfo);
        setPrivacyOptionsRequired(
          consentInfo.privacyOptionsRequirementStatus ===
            AdsConsentPrivacyOptionsRequirementStatus.REQUIRED
        );
      }

      if (consentInfo?.canRequestAds !== true && !allowDevTestAdFallback) {
        if (__DEV__) {
          console.info('[AdsConsent] Mobile Ads initialization skipped.', {
            canRequestAds: consentInfo?.canRequestAds ?? null,
            allowDevTestAdFallback,
          });
        }
        setReadiness('adsUnavailable');
        return;
      }

      if (__DEV__ && allowDevTestAdFallback) {
        console.info('[AdsConsent] DEV test-ad fallback enabled.');
      }

      try {
        await initializeMobileAdsOnce();
        if (mountedRef.current) setReadiness('adsReady');
      } catch (error: unknown) {
        if (__DEV__) {
          console.warn(
            '[AdsConsent] Mobile Ads initialization failed.',
            getErrorDetails(error)
          );
        }
        console.warn('Google Mobile Ads initialization failed.', error);
        if (mountedRef.current) setReadiness('adsUnavailable');
      }
    },
    []
  );

  useEffect(() => {
    updateAdsDiagnostics({ bootstrapEffectStarted: true });
    mountedRef.current = true;

    const debugConfig = getConsentDebugConfig();
    updateAdsDiagnostics({
      isDev: __DEV__,
      isTestRewarded: IS_REWARDED_TEST_AD,
      isExplicitUmpDebug: debugConfig.isExplicitEeaDebug,
      consentBootstrapStarted: true,
      gatherConsentState: 'pending',
      gatherConsentErrorCode: null,
      gatherConsentErrorMessage: null,
      getConsentInfoState: 'pending',
      gatherConsentFailed: false,
      devFallbackAllowed: false,
    });
    if (__DEV__) {
      console.info('[AdsConsent] consent bootstrap started.', {
        explicitEeaDebug: debugConfig.isExplicitEeaDebug,
        isRewardedTestAd: IS_REWARDED_TEST_AD,
      });
    }

    void gatherCurrentConsentInfo(debugConfig.options)
      .then(({ consentInfo, gatherFailed }) => {
        const allowDevTestAdFallback =
          __DEV__ &&
          IS_REWARDED_TEST_AD &&
          !debugConfig.isExplicitEeaDebug &&
          gatherFailed &&
          consentInfo?.canRequestAds !== true;

        updateAdsDiagnostics({
          isDev: __DEV__,
          isTestRewarded: IS_REWARDED_TEST_AD,
          isExplicitUmpDebug: debugConfig.isExplicitEeaDebug,
          gatherConsentFailed: gatherFailed,
          canRequestAds: consentInfo?.canRequestAds ?? null,
          devFallbackAllowed: allowDevTestAdFallback,
        });

        return applyConsentInfo(consentInfo, allowDevTestAdFallback);
      })
      .catch((error: unknown) => {
        if (__DEV__) {
          console.warn(
            '[AdsConsent] consent bootstrap failed unexpectedly.',
            getErrorDetails(error)
          );
        }
        console.warn('Google UMP consent information is unavailable.', error);
        if (mountedRef.current) setReadiness('adsUnavailable');
      });

    return () => {
      mountedRef.current = false;
    };
  }, [applyConsentInfo]);

  useEffect(() => {
    updateAdsDiagnostics({ consentProviderState: readiness });
  }, [readiness]);

  const showPrivacyOptions = useCallback((): Promise<boolean> => {
    if (!privacyOptionsRequired) return Promise.resolve(false);
    if (privacyOptionsPromiseRef.current !== null) {
      return privacyOptionsPromiseRef.current;
    }

    if (mountedRef.current) setIsPrivacyOptionsBusy(true);
    const operation = AdsConsent.showPrivacyOptionsForm()
      .then(async (formInfo) => {
        let latestInfo = formInfo;
        try {
          latestInfo = await AdsConsent.getConsentInfo();
        } catch (error: unknown) {
          console.warn('Could not refresh Google UMP consent information.', error);
        }
        await applyConsentInfo(latestInfo);
        return true;
      })
      .catch(async (error: unknown) => {
        console.warn('Google privacy options form could not be shown.', error);
        try {
          await applyConsentInfo(await AdsConsent.getConsentInfo());
        } catch (refreshError: unknown) {
          console.warn('Google UMP consent information is unavailable.', refreshError);
        }
        return false;
      })
      .finally(() => {
        privacyOptionsPromiseRef.current = null;
        if (mountedRef.current) setIsPrivacyOptionsBusy(false);
      });

    privacyOptionsPromiseRef.current = operation;
    return operation;
  }, [applyConsentInfo, privacyOptionsRequired]);

  const value = useMemo(
    () => ({
      readiness,
      privacyOptionsRequired,
      isPrivacyOptionsBusy,
      showPrivacyOptions,
    }),
    [isPrivacyOptionsBusy, privacyOptionsRequired, readiness, showPrivacyOptions]
  );

  return <AdsConsentContext.Provider value={value}>{children}</AdsConsentContext.Provider>;
}

export function useAdsConsent(): AdsConsentController {
  const context = useContext(AdsConsentContext);
  if (context === null) {
    throw new Error('useAdsConsent must be used inside AdsConsentProvider.');
  }
  return context;
}
