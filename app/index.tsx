import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EggHeader } from '@/components/egg-game/EggHeader';
import { EggInfo } from '@/components/egg-game/EggInfo';
import { EggReward } from '@/components/egg-game/EggReward';
import { EggStage } from '@/components/egg-game/EggStage';
import { DropSimulatorModal } from '@/components/egg-game/DropSimulatorModal';
import { GraphicsTestPanel } from '@/components/egg-game/GraphicsTestPanel';
import { HitRewardToast } from '@/components/egg-game/HitRewardToast';
import { HitResultActions } from '@/components/egg-game/HitResult';
import { OnboardingOverlay } from '@/components/egg-game/OnboardingOverlay';
import { ShopComingSoonModal } from '@/components/egg-game/ShopComingSoonModal';
import { MONGLE } from '@/game/collection/creatures';
import { getCollectedCreature } from '@/game/collection/storage';
import type { CollectCreatureOnceResult } from '@/game/collection/storage';
import type { CreatureDefinition } from '@/game/collection/types';
import { useRewardedHitAd } from '@/game/ads/rewardedHitAd';
import { useGameAudio } from '@/game/audio/useGameAudio';
import {
  ImpactFeedbackStyle,
  NotificationFeedbackType,
  playImpact,
  playNotification,
} from '@/game/haptics';
import { CREAM_EGG_IMAGES } from '@/game/egg/assets';
import {
  AUTO_MISS_AFTER_MS,
  COUNTDOWN_INTERVAL_MS,
  DAMAGE,
  EXACT_HIT_DAMAGE,
  GO_DISPLAY_MS,
  HATCH_ENTRY_DELAY_MS,
  MAX_EGG_HP,
  QUICK_HOLD_MS,
  RESULT_DELAY_MS,
  START_RING_SIZE,
  TAP_MODE_DAMAGE,
  TARGET_RING_SIZE,
  ZERO_HOLD_MS,
} from '@/game/egg/constants';
import { rollCreamEggCreatureWithLegendaryProtection } from '@/game/egg/drop';
import {
  getCrackLevel,
  getGrade,
  getImpactPower,
  randomTargetDuration,
  rollHardModeBonus,
} from '@/game/egg/logic';
import { hasExistingOnboardingProgress } from '@/game/onboarding/storage';
import { useTranslation } from '@/game/localization/LocalizationProvider';
import type { OnboardingPhase } from '@/game/onboarding/types';
import {
  createPendingEggReward,
  flushActiveEggHpSaves,
  loadActiveEgg,
  queueActiveEggHpSave,
  resetActiveEgg,
  savePendingEggReward,
} from '@/game/egg/storage';
import { CrackLevel, GamePhase, Grade } from '@/game/egg/types';
import { useCollection } from '@/hooks/useCollection';
import { useGameSettings } from '@/hooks/useGameSettings';
import { useHitEnergy } from '@/hooks/useHitEnergy';
import { useOnboarding } from '@/hooks/useOnboarding';

type HatchRewardState = {
  creature: CreatureDefinition;
  isNew: boolean;
  shouldCollect: boolean;
};

type RewardCommit = Promise<CollectCreatureOnceResult | null>;

type LethalRewardOperation = {
  reward: HatchRewardState;
  rewardCommit: RewardCommit;
};

const TEST_HATCH_REWARD: HatchRewardState = {
  creature: MONGLE,
  isNew: true,
  shouldCollect: false,
};

const GUIDED_RESULT_DISPLAY_MS = 900;

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const {
    pauseBgmForAd,
    playCountdown,
    playEggBreak,
    playEggCrack,
    playHit,
    playUiClick,
    resumeBgmAfterAd,
  } = useGameAudio();
  const {
    collection,
    collectCreatureOnce,
    isHydrated: isCollectionHydrated,
    uniqueCollectedCount,
  } = useCollection();
  const {
    hits,
    maxHits,
    isHydrated: isEnergyHydrated,
    nextRecoveryAt,
    consumeHit,
    grantHit,
  } = useHitEnergy();
  const {
    status: onboardingStatus,
    isActive: isOnboardingActive,
    isResolved: isOnboardingResolved,
    beginOnboarding,
    completeOnboarding,
  } = useOnboarding();
  const { settings, isHydrated: isSettingsHydrated } = useGameSettings();
  const [phase, setPhase] = useState<GamePhase>('ready');
  const [eggHp, setEggHp] = useState(MAX_EGG_HP);
  const [isActiveEggHydrated, setIsActiveEggHydrated] = useState(false);
  const [ringSize, setRingSize] = useState(START_RING_SIZE);
  const [displayTargetDurationMs, setDisplayTargetDurationMs] = useState(0);
  const [displayElapsedMs, setDisplayElapsedMs] = useState(0);
  const [isHitTimerActive, setIsHitTimerActive] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [lastGrade, setLastGrade] = useState<Grade | null>(null);
  const [lastDamage, setLastDamage] = useState(0);
  const [lastHardBonus, setLastHardBonus] = useState(0);
  const [exactHit, setExactHit] = useState(false);
  const [hasStartedEgg, setHasStartedEgg] = useState(false);
  const [hatchReward, setHatchReward] = useState<HatchRewardState>(TEST_HATCH_REWARD);
  const [hitRewardToastTrigger, setHitRewardToastTrigger] = useState(0);
  const [dropSimulatorVisible, setDropSimulatorVisible] = useState(false);
  const [isShopModalVisible, setIsShopModalVisible] = useState(false);
  const [showFreePlayHint, setShowFreePlayHint] = useState(false);
  const [onboardingPhase, setOnboardingPhaseState] =
    useState<OnboardingPhase>('inactive');

  const startTimeRef = useRef(0);
  const eggHpRef = useRef(MAX_EGG_HP);
  const targetDurationRef = useRef(randomTargetDuration());
  const animationFrameRef = useRef<number | null>(null);
  const resolvedRef = useRef(false);
  const energyConsumedRef = useRef(false);
  const sequenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const breakTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tutorialTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hitHapticTimeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onboardingCandidateResolvedRef = useRef(false);
  const onboardingPhaseRef = useRef<OnboardingPhase>('inactive');
  const isCompletingOnboardingRef = useRef(false);
  const tapModeLethalRef = useRef(false);
  const screenMountedRef = useRef(true);

  const eggTranslateX = useRef(new Animated.Value(0)).current;
  const eggTranslateY = useRef(new Animated.Value(0)).current;
  const eggScaleX = useRef(new Animated.Value(1)).current;
  const eggScaleY = useRef(new Animated.Value(1)).current;
  const stageTranslateX = useRef(new Animated.Value(0)).current;
  const stageTranslateY = useRef(new Animated.Value(0)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const resultScale = useRef(new Animated.Value(1)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const countdownScale = useRef(new Animated.Value(1)).current;
  const shockwaveScale = useRef(new Animated.Value(0.4)).current;
  const shockwaveOpacity = useRef(new Animated.Value(0)).current;
  const fragmentProgress = useRef(new Animated.Value(0)).current;

  const setOnboardingPhase = useCallback((nextPhase: OnboardingPhase) => {
    onboardingPhaseRef.current = nextPhase;
    setOnboardingPhaseState(nextPhase);
  }, []);

  const applyEggHp = useCallback((nextHp: number) => {
    eggHpRef.current = nextHp;
    setEggHp(nextHp);
  }, []);

  const handleEarnedAdReward = useCallback(async () => {
    const didGrant = await grantHit();
    if (!didGrant) return;

    playNotification(NotificationFeedbackType.Success);
    setHitRewardToastTrigger((trigger) => trigger + 1);
  }, [grantHit]);

  const rewardedAd = useRewardedHitAd({
    onEarnedReward: handleEarnedAdReward,
    onAdWillShow: pauseBgmForAd,
    onAdDismissed: resumeBgmAfterAd,
  });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const activeEgg = await loadActiveEgg();
      if (cancelled) return;

      if (activeEgg.pendingReward !== null) {
        const { creatureId, transactionId } = activeEgg.pendingReward;
        const recovery = await collectCreatureOnce(creatureId, transactionId);
        if (cancelled) return;
        if (!recovery.persisted) {
          if (__DEV__) console.warn('Pending egg reward recovery could not be persisted.');
          return;
        }

        const didReset = await resetActiveEgg();
        if (cancelled) return;
        if (!didReset) {
          if (__DEV__) console.warn('Recovered egg reward, but fresh egg reset failed.');
          return;
        }

        applyEggHp(MAX_EGG_HP);
        setIsActiveEggHydrated(true);
        return;
      }

      applyEggHp(activeEgg.hp);
      setIsActiveEggHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [applyEggHp, collectCreatureOnce]);

  useEffect(() => {
    if (
      onboardingStatus !== 'candidate' ||
      onboardingCandidateResolvedRef.current ||
      !isActiveEggHydrated ||
      !isCollectionHydrated ||
      !isEnergyHydrated
    ) {
      return;
    }

    onboardingCandidateResolvedRef.current = true;
    const hasExistingProgress = hasExistingOnboardingProgress({
      uniqueCollectedCount,
      eggHp,
      maxEggHp: MAX_EGG_HP,
      hits,
      maxHits,
    });
    if (hasExistingProgress) {
      void completeOnboarding();
    } else {
      void beginOnboarding();
    }
  }, [
    beginOnboarding,
    completeOnboarding,
    eggHp,
    hits,
    isActiveEggHydrated,
    isCollectionHydrated,
    isEnergyHydrated,
    maxHits,
    onboardingStatus,
    uniqueCollectedCount,
  ]);

  useEffect(() => {
    if (isOnboardingActive && onboardingPhaseRef.current === 'inactive') {
      setOnboardingPhase('start-highlight');
      return;
    }
    if (
      onboardingStatus === 'completed' &&
      onboardingPhaseRef.current === 'inactive'
    ) {
      setOnboardingPhase('completed');
    }
  }, [isOnboardingActive, onboardingStatus, setOnboardingPhase]);

  useEffect(() => {
    if (onboardingPhase !== 'free-play') {
      setShowFreePlayHint(false);
      return;
    }

    setShowFreePlayHint(true);
    const timeout = setTimeout(() => setShowFreePlayHint(false), 1_500);
    return () => clearTimeout(timeout);
  }, [onboardingPhase]);

  useEffect(() => {
    screenMountedRef.current = true;
    return () => {
      screenMountedRef.current = false;
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
      if (sequenceTimeoutRef.current !== null) clearTimeout(sequenceTimeoutRef.current);
      if (breakTimeoutRef.current !== null) clearTimeout(breakTimeoutRef.current);
      if (tutorialTimeoutRef.current !== null) clearTimeout(tutorialTimeoutRef.current);
      hitHapticTimeoutRefs.current.forEach(clearTimeout);
      hitHapticTimeoutRefs.current = [];
    };
  }, []);

  const animateCountdown = () => {
    countdownScale.setValue(0.45);
    Animated.spring(countdownScale, {
      toValue: 1,
      tension: 160,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const animateEggImpact = (grade: Grade) => {
    const power = getImpactPower(grade);
    eggTranslateX.setValue(0);
    eggTranslateY.setValue(0);
    eggScaleX.setValue(1);
    eggScaleY.setValue(1);

    Animated.parallel([
      Animated.sequence([
        Animated.parallel([
          Animated.timing(eggScaleX, {
            toValue: 1 + 0.12 * power,
            duration: 55,
            useNativeDriver: true,
          }),
          Animated.timing(eggScaleY, {
            toValue: 1 - 0.1 * power,
            duration: 55,
            useNativeDriver: true,
          }),
          Animated.timing(eggTranslateY, {
            toValue: 8 * power,
            duration: 55,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.spring(eggScaleX, {
            toValue: 1,
            tension: 210,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.spring(eggScaleY, {
            toValue: 1,
            tension: 210,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.spring(eggTranslateY, {
            toValue: -5 * power,
            tension: 180,
            friction: 5,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(eggTranslateY, {
          toValue: 0,
          tension: 160,
          friction: 6,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(eggTranslateX, {
          toValue: -8 * power,
          duration: 45,
          useNativeDriver: true,
        }),
        Animated.timing(eggTranslateX, {
          toValue: 8 * power,
          duration: 55,
          useNativeDriver: true,
        }),
        Animated.timing(eggTranslateX, {
          toValue: -4 * power,
          duration: 45,
          useNativeDriver: true,
        }),
        Animated.timing(eggTranslateX, {
          toValue: 0,
          duration: 55,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const animateScreenShake = (grade: Grade) => {
    const distance = 10 * getImpactPower(grade);
    stageTranslateX.setValue(0);
    stageTranslateY.setValue(0);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(stageTranslateX, {
          toValue: -distance,
          duration: 35,
          useNativeDriver: true,
        }),
        Animated.timing(stageTranslateY, {
          toValue: distance * 0.3,
          duration: 35,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(stageTranslateX, {
          toValue: distance,
          duration: 40,
          useNativeDriver: true,
        }),
        Animated.timing(stageTranslateY, {
          toValue: -distance * 0.25,
          duration: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(stageTranslateX, {
          toValue: 0,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(stageTranslateY, {
          toValue: 0,
          duration: 60,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const animateShockwave = (grade: Grade) => {
    const power = getImpactPower(grade);
    shockwaveScale.setValue(0.4);
    shockwaveOpacity.setValue(0.4 + 0.5 * power);
    Animated.parallel([
      Animated.timing(shockwaveScale, {
        toValue: 1.15 + 0.25 * power,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(shockwaveOpacity, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateFragments = () => {
    fragmentProgress.setValue(0);
    Animated.timing(fragmentProgress, {
      toValue: 1,
      duration: 380,
      useNativeDriver: true,
    }).start();
  };

  const playFlash = (grade: Grade, isExact: boolean) => {
    const power = getImpactPower(grade);
    flashOpacity.setValue(isExact ? 0.95 : 0.18 + 0.48 * power);
    Animated.timing(flashOpacity, {
      toValue: 0,
      duration: isExact ? 300 : 210,
      useNativeDriver: true,
    }).start();
  };

  const animateResult = (isExact: boolean) => {
    resultScale.setValue(isExact ? 0.25 : 0.55);
    resultOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(resultScale, {
        toValue: 1,
        tension: isExact ? 210 : 150,
        friction: isExact ? 4 : 5,
        useNativeDriver: true,
      }),
      Animated.timing(resultOpacity, {
        toValue: 1,
        duration: 130,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const playHitHaptic = (grade: Grade, isExact: boolean) => {
    if (isExact) {
      playNotification(NotificationFeedbackType.Success);
      hitHapticTimeoutRefs.current.push(
        setTimeout(() => playImpact(ImpactFeedbackStyle.Heavy), 85),
        setTimeout(() => playImpact(ImpactFeedbackStyle.Heavy), 170)
      );
      return;
    }
    if (grade === 'PERFECT') {
      playNotification(NotificationFeedbackType.Success);
      return;
    }
    if (grade === 'EXCELLENT') {
      playImpact(ImpactFeedbackStyle.Heavy);
      return;
    }
    if (grade === 'GREAT') {
      playImpact(ImpactFeedbackStyle.Medium);
      return;
    }
    if (grade === 'GOOD') {
      playImpact(ImpactFeedbackStyle.Light);
      return;
    }
    playNotification(NotificationFeedbackType.Error);
  };

  const runImpactEffects = (grade: Grade, isExact: boolean) => {
    animateEggImpact(grade);
    animateScreenShake(grade);
    animateShockwave(grade);
    animateFragments();
    playFlash(grade, isExact);
    playHitHaptic(grade, isExact);
  };

  const playResolvedHitSounds = (grade: Grade, isExact: boolean, isLethal: boolean) => {
    playHit(isExact ? 'EXACT' : grade);
    if (isLethal) {
      playEggBreak();
      return;
    }
    playEggCrack(grade === 'MISS' || grade === 'GOOD' ? 'light' : 'heavy');
  };

  const createLethalRewardOperation = (): LethalRewardOperation => {
    const creature = rollCreamEggCreatureWithLegendaryProtection(
      new Set(Object.keys(collection))
    );
    const reward: HatchRewardState = {
      creature,
      isNew: getCollectedCreature(collection, creature.id) === undefined,
      shouldCollect: true,
    };
    const pendingReward = createPendingEggReward(creature.id);
    const rewardCommit = flushActiveEggHpSaves().then(async () => {
      const didSavePending = await savePendingEggReward(pendingReward);
      if (!didSavePending) {
        if (__DEV__) console.warn('Pending egg reward save failed; collection was not changed.');
        return null;
      }
      return collectCreatureOnce(
        pendingReward.creatureId,
        pendingReward.transactionId
      );
    });

    return { reward, rewardCommit };
  };

  const scheduleHatch = (reward: HatchRewardState, rewardCommit?: RewardCommit) => {
    setHatchReward(reward);
    breakTimeoutRef.current = setTimeout(() => {
      void (async () => {
        if (reward.shouldCollect) {
          const commit = await rewardCommit;
          if (commit === null || commit === undefined || !commit.persisted) {
            if (__DEV__) console.warn('Hatch blocked because the egg reward was not persisted.');
            return;
          }
          if (!screenMountedRef.current) return;
          setHatchReward({ ...reward, isNew: commit.isNew });
        }
        if (screenMountedRef.current) setPhase('eggBroken');
      })();
    }, HATCH_ENTRY_DELAY_MS);
  };

  const resolveHit = (elapsedMs: number) => {
    if (resolvedRef.current) return;
    const isGuidedExact = onboardingPhaseRef.current === 'exact-freeze';
    if (!energyConsumedRef.current) {
      if (!consumeHit()) {
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        setPhase('ready');
        return;
      }
      energyConsumedRef.current = true;
    }
    resolvedRef.current = true;
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const target = targetDurationRef.current;
    const grade = getGrade(Math.abs(elapsedMs - target));
    const isExact = Math.round(elapsedMs) === target;
    const baseDamage = isExact ? EXACT_HIT_DAMAGE : DAMAGE[grade];
    const hardBonus =
      isSettingsHydrated &&
      !isOnboardingActive &&
      settings.guideRingEnabled === false
        ? rollHardModeBonus()
        : 0;
    const damage = baseDamage + hardBonus;
    const nextHp = Math.max(0, eggHp - damage);
    const lethalOperation = nextHp <= 0 ? createLethalRewardOperation() : null;
    const lethalReward = lethalOperation?.reward ?? null;
    const rewardCommit = lethalOperation?.rewardCommit;

    applyEggHp(nextHp);
    if (!lethalReward) queueActiveEggHpSave(nextHp);
    setLastGrade(grade);
    setLastDamage(damage);
    setLastHardBonus(hardBonus);
    setExactHit(isExact);
    setDisplayElapsedMs(elapsedMs);
    setPhase('impact');
    if (isGuidedExact) {
      setOnboardingPhase(lethalReward ? 'free-play' : 'guided-strike');
    }
    playResolvedHitSounds(grade, isExact, lethalReward !== null);
    runImpactEffects(grade, isExact);

    sequenceTimeoutRef.current = setTimeout(() => {
      setPhase('result');
      animateResult(isExact);
      if (lethalReward) scheduleHatch(lethalReward, rewardCommit);
      if (isGuidedExact && !lethalReward) {
        tutorialTimeoutRef.current = setTimeout(() => {
          setOnboardingPhase('resources');
          tutorialTimeoutRef.current = null;
        }, GUIDED_RESULT_DISPLAY_MS);
      }
    }, RESULT_DELAY_MS);
  };

  const beginRing = (isGuidedStrike = false) => {
    setRingSize(START_RING_SIZE);
    setDisplayElapsedMs(0);
    setIsHitTimerActive(true);
    setPhase('running');
    if (isGuidedStrike) setOnboardingPhase('guided-strike');
    resolvedRef.current = false;
    energyConsumedRef.current = false;
    targetDurationRef.current = randomTargetDuration();
    setDisplayTargetDurationMs(targetDurationRef.current);
    startTimeRef.current = performance.now();
    playImpact(ImpactFeedbackStyle.Light);

    const updateRing = () => {
      const elapsed = performance.now() - startTimeRef.current;
      const targetDuration = targetDurationRef.current;
      if (isGuidedStrike && elapsed >= targetDuration) {
        setRingSize(TARGET_RING_SIZE);
        setDisplayElapsedMs(targetDuration);
        animationFrameRef.current = null;
        setOnboardingPhase('exact-freeze');
        return;
      }
      const progress = elapsed / targetDuration;
      setRingSize(START_RING_SIZE + (TARGET_RING_SIZE - START_RING_SIZE) * progress);
      setDisplayElapsedMs(elapsed);
      if (elapsed >= targetDuration + AUTO_MISS_AFTER_MS) {
        resolveHit(elapsed);
        return;
      }
      animationFrameRef.current = requestAnimationFrame(updateRing);
    };
    animationFrameRef.current = requestAnimationFrame(updateRing);
  };

  const beginQuickRound = () => {
    setPhase('hold');
    setRingSize(START_RING_SIZE);
    sequenceTimeoutRef.current = setTimeout(beginRing, QUICK_HOLD_MS);
  };

  const runCountdown = (value: number, isGuidedStrike = false) => {
    setCountdown(value);
    if (value === 3 || value === 2 || value === 1) playCountdown(value);
    animateCountdown();
    playImpact(ImpactFeedbackStyle.Light);
    if (value <= 1) {
      sequenceTimeoutRef.current = setTimeout(() => {
        setCountdown(null);
        setPhase('go');
        playCountdown('GO');
        playImpact(ImpactFeedbackStyle.Medium);
        sequenceTimeoutRef.current = setTimeout(() => {
          setPhase('hold');
          setRingSize(START_RING_SIZE);
          sequenceTimeoutRef.current = setTimeout(
            () => beginRing(isGuidedStrike),
            ZERO_HOLD_MS
          );
        }, GO_DISPLAY_MS);
      }, COUNTDOWN_INTERVAL_MS);
      return;
    }
    sequenceTimeoutRef.current = setTimeout(
      () => runCountdown(value - 1, isGuidedStrike),
      COUNTDOWN_INTERVAL_MS
    );
  };

  const startRound = () => {
    if (
      !isActiveEggHydrated ||
      !isCollectionHydrated ||
      !isEnergyHydrated ||
      !isSettingsHydrated ||
      !isOnboardingResolved ||
      hits <= 0 ||
      rewardedAd.isShowing
    ) {
      return;
    }
    setLastGrade(null);
    setLastDamage(0);
    setLastHardBonus(0);
    setExactHit(false);
    setRingSize(START_RING_SIZE);
    if (
      onboardingPhaseRef.current === 'start-highlight' ||
      (isOnboardingActive && onboardingPhaseRef.current === 'inactive')
    ) {
      setOnboardingPhase('rules');
      return;
    }
    if (!hasStartedEgg) {
      setHasStartedEgg(true);
      setPhase('countdown');
      runCountdown(3);
      return;
    }
    beginQuickRound();
  };

  const continueRulesTutorial = () => {
    if (onboardingPhaseRef.current !== 'rules') return;
    setHasStartedEgg(true);
    setOnboardingPhase('guided-countdown');
    setPhase('countdown');
    runCountdown(3, true);
  };

  const resolveTapModeHit = () => {
    const onboardingAllowsTapMode =
      onboardingPhaseRef.current === 'free-play' ||
      onboardingPhaseRef.current === 'completed';
    if (
      !isActiveEggHydrated ||
      !isEnergyHydrated ||
      !isOnboardingResolved ||
      !onboardingAllowsTapMode ||
      hits !== 0 ||
      phase !== 'ready' ||
      rewardedAd.isShowing ||
      tapModeLethalRef.current
    ) {
      return;
    }

    const currentHp = eggHpRef.current;
    if (currentHp <= 0) return;

    const nextHp = Math.max(0, currentHp - TAP_MODE_DAMAGE);
    if (nextHp === 0) tapModeLethalRef.current = true;

    applyEggHp(nextHp);
    setIsHitTimerActive(false);
    playUiClick();
    animateEggImpact('MISS');

    if (nextHp > 0) {
      queueActiveEggHpSave(nextHp);
      return;
    }

    const lethalOperation = createLethalRewardOperation();
    setLastGrade(null);
    setLastDamage(0);
    setLastHardBonus(0);
    setExactHit(false);
    setPhase('impact');
    playEggBreak();
    sequenceTimeoutRef.current = setTimeout(() => {
      setPhase('result');
      scheduleHatch(lethalOperation.reward, lethalOperation.rewardCommit);
    }, RESULT_DELAY_MS);
  };

  const handleGameTap = () => {
    if (onboardingPhaseRef.current === 'exact-freeze') {
      resolveHit(targetDurationRef.current);
      return;
    }
    if (
      onboardingPhaseRef.current === 'guided-countdown' ||
      onboardingPhaseRef.current === 'guided-strike'
    ) {
      return;
    }
    if (phase === 'ready' && hits === 0) {
      resolveTapModeHit();
      return;
    }
    if (phase === 'ready') {
      startRound();
      return;
    }
    if (phase === 'running') resolveHit(performance.now() - startTimeRef.current);
  };

  const nextHit = () => {
    if (eggHp <= 0) return;
    setLastGrade(null);
    setLastDamage(0);
    setLastHardBonus(0);
    setExactHit(false);
    setRingSize(START_RING_SIZE);
    setIsHitTimerActive(false);
    setPhase('ready');
  };

  const continueFromResources = () => {
    if (onboardingPhaseRef.current !== 'resources') return;
    setOnboardingPhase('free-play');
    nextHit();
  };

  const cancelCurrentSequence = () => {
    setIsHitTimerActive(false);
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (sequenceTimeoutRef.current !== null) {
      clearTimeout(sequenceTimeoutRef.current);
      sequenceTimeoutRef.current = null;
    }
    if (breakTimeoutRef.current !== null) {
      clearTimeout(breakTimeoutRef.current);
      breakTimeoutRef.current = null;
    }
    if (tutorialTimeoutRef.current !== null) {
      clearTimeout(tutorialTimeoutRef.current);
      tutorialTimeoutRef.current = null;
    }
    hitHapticTimeoutRefs.current.forEach(clearTimeout);
    hitHapticTimeoutRefs.current = [];
    resolvedRef.current = true;
  };

  const devHit = (grade: Grade) => {
    cancelCurrentSequence();
    const damage = DAMAGE[grade];
    const nextHp = Math.max(0, eggHp - damage);
    applyEggHp(nextHp);
    setLastGrade(grade);
    setLastDamage(damage);
    setLastHardBonus(0);
    setExactHit(false);
    setPhase('impact');
    playResolvedHitSounds(grade, false, nextHp <= 0);
    runImpactEffects(grade, false);
    sequenceTimeoutRef.current = setTimeout(() => {
      setPhase('result');
      animateResult(false);
      if (nextHp <= 0) scheduleHatch(TEST_HATCH_REWARD);
    }, RESULT_DELAY_MS);
  };

  const devExactHit = () => {
    cancelCurrentSequence();
    const nextHp = Math.max(0, eggHp - EXACT_HIT_DAMAGE);
    applyEggHp(nextHp);
    setLastGrade('PERFECT');
    setLastDamage(EXACT_HIT_DAMAGE);
    setLastHardBonus(0);
    setExactHit(true);
    setPhase('impact');
    playResolvedHitSounds('PERFECT', true, nextHp <= 0);
    runImpactEffects('PERFECT', true);
    sequenceTimeoutRef.current = setTimeout(() => {
      setPhase('result');
      animateResult(true);
      if (nextHp <= 0) scheduleHatch(TEST_HATCH_REWARD);
    }, RESULT_DELAY_MS);
  };

  const devSetCrackLevel = (level: Exclude<CrackLevel, 4>) => {
    cancelCurrentSequence();
    let hp = MAX_EGG_HP;
    if (level === 1) hp = Math.round(MAX_EGG_HP * 0.7);
    if (level === 2) hp = Math.round(MAX_EGG_HP * 0.44);
    if (level === 3) hp = Math.round(MAX_EGG_HP * 0.18);
    applyEggHp(hp);
    setLastGrade(null);
    setLastDamage(0);
    setLastHardBonus(0);
    setExactHit(false);
    setPhase('ready');
  };

  const devHatchCreature = (creature: CreatureDefinition) => {
    cancelCurrentSequence();
    applyEggHp(0);
    setLastGrade('PERFECT');
    setLastDamage(999);
    setLastHardBonus(0);
    setExactHit(false);
    playEggBreak();
    animateEggImpact('PERFECT');
    animateScreenShake('PERFECT');
    animateShockwave('PERFECT');
    animateFragments();
    playFlash('PERFECT', false);
    setPhase('impact');
    sequenceTimeoutRef.current = setTimeout(
      () =>
        scheduleHatch({
          creature,
          isNew: true,
          shouldCollect: false,
        }),
      RESULT_DELAY_MS
    );
  };

  const devBreakEgg = () => {
    devHatchCreature(MONGLE);
  };

  const resetPrototype = () => {
    cancelCurrentSequence();
    energyConsumedRef.current = false;
    tapModeLethalRef.current = false;
    applyEggHp(MAX_EGG_HP);
    setRingSize(START_RING_SIZE);
    setCountdown(null);
    setLastGrade(null);
    setLastDamage(0);
    setLastHardBonus(0);
    setExactHit(false);
    setHasStartedEgg(false);
    setHatchReward(TEST_HATCH_REWARD);
    [
      eggTranslateX,
      eggTranslateY,
      eggScaleX,
      eggScaleY,
      stageTranslateX,
      stageTranslateY,
      flashOpacity,
      resultScale,
      resultOpacity,
      countdownScale,
      shockwaveScale,
      shockwaveOpacity,
      fragmentProgress,
    ].forEach((value) => value.stopAnimation());
    eggTranslateX.setValue(0);
    eggTranslateY.setValue(0);
    eggScaleX.setValue(1);
    eggScaleY.setValue(1);
    stageTranslateX.setValue(0);
    stageTranslateY.setValue(0);
    flashOpacity.setValue(0);
    resultScale.setValue(1);
    resultOpacity.setValue(0);
    countdownScale.setValue(1);
    shockwaveScale.setValue(0.4);
    shockwaveOpacity.setValue(0);
    fragmentProgress.setValue(0);
    setPhase('ready');
  };

  const resetRewardedEgg = () => {
    const shouldPersistFreshEgg = hatchReward.shouldCollect;
    resetPrototype();
    if (shouldPersistFreshEgg) {
      void resetActiveEgg();
    }
  };

  const handleHatchRevealComplete = useCallback(() => {
    if (
      onboardingPhaseRef.current === 'free-play' &&
      hatchReward.shouldCollect
    ) {
      setOnboardingPhase('hatch-rarity');
    }
  }, [hatchReward.shouldCollect, setOnboardingPhase]);

  const continueFromRarity = useCallback(() => {
    if (onboardingPhaseRef.current === 'hatch-rarity') {
      setOnboardingPhase('collection-guide');
    }
  }, [setOnboardingPhase]);

  const handlePressCollection = () => {
    if (onboardingPhaseRef.current === 'collection-guide') {
      if (isCompletingOnboardingRef.current) return;
      isCompletingOnboardingRef.current = true;
      void (async () => {
        await completeOnboarding();
        setOnboardingPhase('completed');
        playUiClick();
        router.push('/collection');
      })();
      return;
    }
    if (
      !isOnboardingActive ||
      onboardingPhaseRef.current === 'free-play' ||
      onboardingPhaseRef.current === 'completed'
    ) {
      playUiClick();
      router.push('/collection');
    }
  };

  const handlePressSettings = () => {
    if (
      onboardingStatus === 'completed' &&
      onboardingPhaseRef.current === 'completed'
    ) {
      playUiClick();
      router.push('/settings');
    }
  };

  const handlePressShop = () => {
    if (
      onboardingStatus === 'completed' &&
      onboardingPhaseRef.current === 'completed'
    ) {
      playUiClick();
      setIsShopModalVisible(true);
    }
  };

  const closeShopModal = () => {
    playUiClick();
    setIsShopModalVisible(false);
  };

  const crackLevel =
    eggHp <= 0 && phase !== 'eggBroken' ? 3 : getCrackLevel(eggHp, MAX_EGG_HP);
  const canContinue = eggHp > 0;
  const isGameplayHydrated =
    isActiveEggHydrated &&
    isCollectionHydrated &&
    isEnergyHydrated &&
    isSettingsHydrated &&
    isOnboardingResolved;
  const isTutorialModal =
    onboardingPhase === 'rules' ||
    onboardingPhase === 'guided-countdown' ||
    onboardingPhase === 'guided-strike' ||
    onboardingPhase === 'exact-freeze' ||
    onboardingPhase === 'resources' ||
    onboardingPhase === 'hatch-rarity' ||
    onboardingPhase === 'collection-guide';
  const shouldHighlightStart =
    isOnboardingActive &&
    (onboardingPhase === 'inactive' || onboardingPhase === 'start-highlight');
  const isExactFreeze = onboardingPhase === 'exact-freeze';
  const canPressCollection =
    !isOnboardingActive ||
    onboardingPhase === 'completed' ||
    onboardingPhase === 'collection-guide' ||
    (onboardingPhase === 'free-play' && phase !== 'eggBroken');
  const canResetReward =
    !hatchReward.shouldCollect ||
    !isOnboardingActive ||
    onboardingPhase === 'completed';
  const canUseResultActions =
    !isOnboardingActive ||
    onboardingPhase === 'free-play' ||
    onboardingPhase === 'completed';
  const showSettings =
    onboardingStatus === 'completed' && onboardingPhase === 'completed';
  const canStartRewardedAd =
    isActiveEggHydrated &&
    isEnergyHydrated &&
    hits < maxHits &&
    !rewardedAd.isShowing &&
    !isTutorialModal &&
    (phase === 'ready' || phase === 'result');
  const showRewardedAd = () => {
    if (canStartRewardedAd) {
      playUiClick();
      rewardedAd.showRewardedAd();
    }
  };
  const reloadRewardedAd = () => {
    if (canStartRewardedAd) {
      playUiClick();
      rewardedAd.reload();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={isExactFreeze ? 'light-content' : 'dark-content'}
        backgroundColor={isExactFreeze ? '#7C756E' : '#F8F3EA'}
      />
      <Animated.View pointerEvents="none" style={[styles.flash, { opacity: flashOpacity }]} />
      {isExactFreeze ? (
        <View pointerEvents="none" style={styles.exactFreezeScrim} />
      ) : null}
      <HitRewardToast trigger={hitRewardToastTrigger} />
      <EggHeader
        hitsLeft={hits}
        maxHits={maxHits}
        isEnergyHydrated={isGameplayHydrated}
        nextRecoveryAt={nextRecoveryAt}
        rewardedAd={rewardedAd}
        canStartRewardedAd={canStartRewardedAd}
        onReloadRewardedAd={reloadRewardedAd}
        onShowRewardedAd={showRewardedAd}
        collectionCount={uniqueCollectedCount}
        canPressCollection={canPressCollection}
        highlightCollection={onboardingPhase === 'collection-guide'}
        highlightHits={onboardingPhase === 'resources'}
        onPressCollection={handlePressCollection}
        onPressShop={handlePressShop}
        onPressSettings={handlePressSettings}
        showShop={showSettings}
        showSettings={showSettings}
      />
      <EggInfo
        hp={eggHp}
        maxHp={MAX_EGG_HP}
        highlightHp={onboardingPhase === 'resources'}
      />
      <EggStage
        phase={phase}
        hasStartedEgg={hasStartedEgg}
        hasHits={hits > 0}
        isEnergyHydrated={isGameplayHydrated}
        nextRecoveryAt={nextRecoveryAt}
        rewardedAd={rewardedAd}
        canStartRewardedAd={canStartRewardedAd}
        onReloadRewardedAd={reloadRewardedAd}
        onShowRewardedAd={showRewardedAd}
        ringSize={ringSize}
        showGuideRing={
          isOnboardingActive || !isSettingsHydrated || settings.guideRingEnabled
        }
        targetDurationMs={displayTargetDurationMs}
        elapsedMs={displayElapsedMs}
        isHitTimerActive={isHitTimerActive}
        countdown={countdown}
        eggImage={CREAM_EGG_IMAGES[crackLevel]}
        lastGrade={lastGrade}
        lastDamage={lastDamage}
        lastHardBonus={lastHardBonus}
        exactHit={exactHit}
        onPress={handleGameTap}
        eggTranslateX={eggTranslateX}
        eggTranslateY={eggTranslateY}
        eggScaleX={eggScaleX}
        eggScaleY={eggScaleY}
        stageTranslateX={stageTranslateX}
        stageTranslateY={stageTranslateY}
        countdownScale={countdownScale}
        shockwaveScale={shockwaveScale}
        shockwaveOpacity={shockwaveOpacity}
        fragmentProgress={fragmentProgress}
        resultScale={resultScale}
        resultOpacity={resultOpacity}
        highlightStart={shouldHighlightStart && hits > 0}
        exactFreeze={isExactFreeze}
        showFreePlayHint={showFreePlayHint}
      />
      <HitResultActions
        visible={phase === 'result' && canUseResultActions}
        canContinue={canContinue}
        onNextHit={() => {
          playUiClick();
          nextHit();
        }}
      />
      <EggReward
        visible={phase === 'eggBroken'}
        closedEggImage={CREAM_EGG_IMAGES[3]}
        brokenEggImage={CREAM_EGG_IMAGES[4]}
        creature={hatchReward.creature}
        isNew={hatchReward.isNew}
        canReset={canResetReward}
        showRarityTutorial={onboardingPhase === 'hatch-rarity'}
        onRarityContinue={continueFromRarity}
        onRevealComplete={handleHatchRevealComplete}
        onReset={() => {
          playUiClick();
          resetRewardedEgg();
        }}
      />
      {onboardingPhase === 'rules' ? (
        <OnboardingOverlay phase="rules" onContinue={continueRulesTutorial} />
      ) : null}
      {onboardingPhase === 'resources' ? (
        <OnboardingOverlay phase="resources" onContinue={continueFromResources} />
      ) : null}
      {onboardingPhase === 'collection-guide' ? (
        <OnboardingOverlay phase="collection-guide" />
      ) : null}
      {isExactFreeze ? (
        <Pressable
          accessibilityLabel={t('game.tapScreen')}
          accessibilityRole="button"
          onPress={handleGameTap}
          style={styles.exactFreezeTapLayer}
        />
      ) : null}
      <GraphicsTestPanel
        visible={__DEV__}
        onHit={devHit}
        onExactHit={devExactHit}
        onSetCrackLevel={devSetCrackLevel}
        onBreak={devBreakEgg}
        onHatch={devHatchCreature}
        onOpenDropSimulator={() => setDropSimulatorVisible(true)}
        onReset={resetPrototype}
      />
      <DropSimulatorModal
        onClose={() => setDropSimulatorVisible(false)}
        visible={__DEV__ && dropSimulatorVisible}
      />
      <ShopComingSoonModal
        onClose={closeShopModal}
        visible={isShopModalVisible}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F3EA', paddingHorizontal: 20 },
  flash: { ...StyleSheet.absoluteFillObject, backgroundColor: '#FFFFFF', zIndex: 100 },
  exactFreezeScrim: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 299,
    backgroundColor: 'rgba(35, 25, 20, 0.58)',
  },
  exactFreezeTapLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 301,
  },
});
