import AsyncStorage from '@react-native-async-storage/async-storage';

export const ONBOARDING_STORAGE_KEY = 'egg-crack-onboarding-v1';

export type OnboardingState = {
  completed: boolean;
};

export type OnboardingProgressSnapshot = {
  uniqueCollectedCount: number;
  eggHp: number;
  maxEggHp: number;
  hits: number;
  maxHits: number;
};

export function hasExistingOnboardingProgress({
  uniqueCollectedCount,
  eggHp,
  maxEggHp,
  hits,
  maxHits,
}: OnboardingProgressSnapshot): boolean {
  return uniqueCollectedCount > 0 || eggHp < maxEggHp || hits < maxHits;
}

function isOnboardingState(value: unknown): value is OnboardingState {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as Record<string, unknown>).completed === 'boolean'
  );
}

export async function loadOnboardingState(): Promise<OnboardingState | null> {
  try {
    const stored = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (stored === null) return null;

    const parsed: unknown = JSON.parse(stored);
    if (isOnboardingState(parsed)) return parsed;

    if (__DEV__) console.warn('Repairing invalid onboarding state as completed.');
    const repairedState = { completed: true };
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(repairedState));
    return repairedState;
  } catch (error: unknown) {
    console.warn('Failed to load onboarding state.', error);
    return { completed: true };
  }
}

export async function saveOnboardingCompleted(): Promise<boolean> {
  try {
    await AsyncStorage.setItem(
      ONBOARDING_STORAGE_KEY,
      JSON.stringify({ completed: true } satisfies OnboardingState)
    );
    return true;
  } catch (error: unknown) {
    console.warn('Failed to complete onboarding.', error);
    return false;
  }
}

export async function saveOnboardingStarted(): Promise<boolean> {
  try {
    await AsyncStorage.setItem(
      ONBOARDING_STORAGE_KEY,
      JSON.stringify({ completed: false } satisfies OnboardingState)
    );
    return true;
  } catch (error: unknown) {
    console.warn('Failed to start onboarding.', error);
    return false;
  }
}
