import {
  setAudioModeAsync,
  setIsAudioActiveAsync,
  useAudioPlayer,
  type AudioPlayer,
} from 'expo-audio';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';

import { useGameSettings } from '@/hooks/useGameSettings';
import { AUDIO_ASSETS } from './assets';
import type {
  CountdownSoundValue,
  EggCrackSoundKind,
  GameAudioController,
  HitSoundJudgment,
} from './types';

const BGM_VOLUME = 0.35;
const SFX_VOLUME = 0.9;
const COUNTDOWN_SFX_VOLUME = 1.0;

export const GameAudioContext = createContext<GameAudioController | null>(null);

function reportAudioError(action: string, error: unknown) {
  if (__DEV__) console.warn(`[audio] failed to ${action}.`, error);
}

export function AudioProvider({ children }: PropsWithChildren) {
  const { settings, isHydrated } = useGameSettings();
  const bgmPlayer = useAudioPlayer(AUDIO_ASSETS.bgm);
  const hitMissPlayer = useAudioPlayer(AUDIO_ASSETS.hits.MISS);
  const hitGoodPlayer = useAudioPlayer(AUDIO_ASSETS.hits.GOOD);
  const hitGreatPlayer = useAudioPlayer(AUDIO_ASSETS.hits.GREAT);
  const hitExcellentPlayer = useAudioPlayer(AUDIO_ASSETS.hits.EXCELLENT);
  const hitPerfectPlayer = useAudioPlayer(AUDIO_ASSETS.hits.PERFECT);
  const hitExactPlayer = useAudioPlayer(AUDIO_ASSETS.hits.EXACT);
  const crackLightPlayer = useAudioPlayer(AUDIO_ASSETS.eggHatch.crackLight);
  const crackHeavyPlayer = useAudioPlayer(AUDIO_ASSETS.eggHatch.crackHeavy);
  const eggBreakPlayer = useAudioPlayer(AUDIO_ASSETS.eggHatch.eggBreak);
  const hatchRisePlayer = useAudioPlayer(AUDIO_ASSETS.eggHatch.hatchRise);
  const collectionNewPlayer = useAudioPlayer(AUDIO_ASSETS.eggHatch.collectionNew);
  const collectionDuplicatePlayer = useAudioPlayer(
    AUDIO_ASSETS.eggHatch.collectionDuplicate
  );
  const countdown3Player = useAudioPlayer(AUDIO_ASSETS.misc.countdown3);
  const countdown2Player = useAudioPlayer(AUDIO_ASSETS.misc.countdown2);
  const countdown1Player = useAudioPlayer(AUDIO_ASSETS.misc.countdown1);
  const countdownGoPlayer = useAudioPlayer(AUDIO_ASSETS.misc.countdownGo);
  const uiClickPlayer = useAudioPlayer(AUDIO_ASSETS.misc.uiClick);

  const [isAudioModeReady, setIsAudioModeReady] = useState(false);
  const [isAppActive, setIsAppActive] = useState(AppState.currentState === 'active');
  const [isBgmPausedForAd, setIsBgmPausedForAd] = useState(false);
  const isAppActiveRef = useRef(AppState.currentState === 'active');
  const isSfxEnabledRef = useRef(false);

  const sfxPlayers = useMemo(
    () => [
      hitMissPlayer,
      hitGoodPlayer,
      hitGreatPlayer,
      hitExcellentPlayer,
      hitPerfectPlayer,
      hitExactPlayer,
      crackLightPlayer,
      crackHeavyPlayer,
      eggBreakPlayer,
      hatchRisePlayer,
      collectionNewPlayer,
      collectionDuplicatePlayer,
      countdown3Player,
      countdown2Player,
      countdown1Player,
      countdownGoPlayer,
      uiClickPlayer,
    ],
    [
      collectionDuplicatePlayer,
      collectionNewPlayer,
      countdown1Player,
      countdown2Player,
      countdown3Player,
      countdownGoPlayer,
      crackHeavyPlayer,
      crackLightPlayer,
      eggBreakPlayer,
      hatchRisePlayer,
      hitExactPlayer,
      hitExcellentPlayer,
      hitGoodPlayer,
      hitGreatPlayer,
      hitMissPlayer,
      hitPerfectPlayer,
      uiClickPlayer,
    ]
  );

  useEffect(() => {
    bgmPlayer.loop = true;
    bgmPlayer.volume = BGM_VOLUME;
    sfxPlayers.forEach((player) => {
      player.volume = SFX_VOLUME;
    });
    countdown3Player.volume = COUNTDOWN_SFX_VOLUME;
    countdown2Player.volume = COUNTDOWN_SFX_VOLUME;
    countdown1Player.volume = COUNTDOWN_SFX_VOLUME;
    countdownGoPlayer.volume = COUNTDOWN_SFX_VOLUME;
  }, [bgmPlayer, sfxPlayers]);

  useEffect(() => {
    let cancelled = false;

    void setAudioModeAsync({
      playsInSilentMode: false,
      interruptionMode: 'mixWithOthers',
      allowsRecording: false,
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
      allowsBackgroundRecording: false,
    })
      .then(() => setIsAudioActiveAsync(isAppActiveRef.current))
      .then(() => {
        if (!cancelled) setIsAudioModeReady(true);
      })
      .catch((error: unknown) => reportAudioError('initialize', error));

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      const nextIsActive = nextState === 'active';
      isAppActiveRef.current = nextIsActive;

      if (!nextIsActive) {
        setIsAppActive(false);
        bgmPlayer.pause();
        sfxPlayers.forEach((player) => player.pause());
      }

      void setIsAudioActiveAsync(nextIsActive)
        .then(() => {
          if (nextIsActive && isAppActiveRef.current) setIsAppActive(true);
        })
        .catch((error: unknown) => reportAudioError('change app audio state', error));
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [bgmPlayer, sfxPlayers]);

  useEffect(() => {
    isSfxEnabledRef.current = isHydrated && settings.sfxEnabled;
    if (isHydrated && !settings.sfxEnabled) {
      sfxPlayers.forEach((player) => player.pause());
    }
  }, [isHydrated, settings.sfxEnabled, sfxPlayers]);

  useEffect(() => {
    const shouldPlayBgm =
      Platform.OS !== 'web' &&
      isHydrated &&
      settings.bgmEnabled &&
      isAudioModeReady &&
      isAppActive &&
      !isBgmPausedForAd;

    if (!shouldPlayBgm) {
      bgmPlayer.pause();
      return;
    }

    if (!bgmPlayer.playing) {
      try {
        bgmPlayer.play();
      } catch (error: unknown) {
        reportAudioError('play BGM', error);
      }
    }
  }, [
    bgmPlayer,
    isAppActive,
    isAudioModeReady,
    isBgmPausedForAd,
    isHydrated,
    settings.bgmEnabled,
  ]);

  const replaySfx = useCallback((player: AudioPlayer, name: string) => {
    if (!isSfxEnabledRef.current || !isAppActiveRef.current) return;

    void player
      .seekTo(0)
      .then(() => {
        if (!isSfxEnabledRef.current || !isAppActiveRef.current) return;
        player.play();
      })
      .catch((error: unknown) => reportAudioError(`replay ${name}`, error));
  }, []);

  const hitPlayers = useMemo(
    () => ({
      MISS: hitMissPlayer,
      GOOD: hitGoodPlayer,
      GREAT: hitGreatPlayer,
      EXCELLENT: hitExcellentPlayer,
      PERFECT: hitPerfectPlayer,
      EXACT: hitExactPlayer,
    }),
    [
      hitExactPlayer,
      hitExcellentPlayer,
      hitGoodPlayer,
      hitGreatPlayer,
      hitMissPlayer,
      hitPerfectPlayer,
    ]
  );

  const countdownPlayers = useMemo(
    () => ({
      3: countdown3Player,
      2: countdown2Player,
      1: countdown1Player,
      GO: countdownGoPlayer,
    }),
    [countdown1Player, countdown2Player, countdown3Player, countdownGoPlayer]
  );

  const playHit = useCallback(
    (judgment: HitSoundJudgment) => replaySfx(hitPlayers[judgment], `hit ${judgment}`),
    [hitPlayers, replaySfx]
  );
  const playEggCrack = useCallback(
    (kind: EggCrackSoundKind) =>
      replaySfx(kind === 'light' ? crackLightPlayer : crackHeavyPlayer, `${kind} crack`),
    [crackHeavyPlayer, crackLightPlayer, replaySfx]
  );
  const playEggBreak = useCallback(
    () => replaySfx(eggBreakPlayer, 'egg break'),
    [eggBreakPlayer, replaySfx]
  );
  const playHatchRise = useCallback(
    () => replaySfx(hatchRisePlayer, 'hatch rise'),
    [hatchRisePlayer, replaySfx]
  );
  const playCollectionNew = useCallback(
    () => replaySfx(collectionNewPlayer, 'collection new'),
    [collectionNewPlayer, replaySfx]
  );
  const playCollectionDuplicate = useCallback(
    () => replaySfx(collectionDuplicatePlayer, 'collection duplicate'),
    [collectionDuplicatePlayer, replaySfx]
  );
  const playCountdown = useCallback(
    (value: CountdownSoundValue) => replaySfx(countdownPlayers[value], `countdown ${value}`),
    [countdownPlayers, replaySfx]
  );
  const playUiClick = useCallback(
    () => replaySfx(uiClickPlayer, 'UI click'),
    [replaySfx, uiClickPlayer]
  );
  const pauseBgmForAd = useCallback(() => {
    setIsBgmPausedForAd(true);
    bgmPlayer.pause();
  }, [bgmPlayer]);
  const resumeBgmAfterAd = useCallback(() => {
    setIsBgmPausedForAd(false);
  }, []);

  const value = useMemo<GameAudioController>(
    () => ({
      playHit,
      playEggCrack,
      playEggBreak,
      playHatchRise,
      playCollectionNew,
      playCollectionDuplicate,
      playCountdown,
      playUiClick,
      pauseBgmForAd,
      resumeBgmAfterAd,
    }),
    [
      pauseBgmForAd,
      playCollectionDuplicate,
      playCollectionNew,
      playCountdown,
      playEggBreak,
      playEggCrack,
      playHatchRise,
      playHit,
      playUiClick,
      resumeBgmAfterAd,
    ]
  );

  return <GameAudioContext.Provider value={value}>{children}</GameAudioContext.Provider>;
}
