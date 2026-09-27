import { useEffect, useRef } from 'react';
import { Animated, ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';

import { HitResult } from './HitResult';
import { HitRecoveryCountdown } from './HitRecoveryCountdown';
import { HitTimer } from './HitTimer';
import { RewardedHitButton } from './RewardedHitButton';
import type { RewardedHitAdController } from '@/game/ads/rewardedHitAd.types';
import { FRAGMENT_ANGLES, TARGET_RING_SIZE } from '@/game/egg/constants';
import { GamePhase, Grade } from '@/game/egg/types';
import { useTranslation } from '@/game/localization/LocalizationProvider';

type EggStageProps = {
  phase: GamePhase;
  hasStartedEgg: boolean;
  hasHits: boolean;
  isEnergyHydrated: boolean;
  nextRecoveryAt: number | null;
  rewardedAd: RewardedHitAdController;
  canStartRewardedAd: boolean;
  onReloadRewardedAd: () => void;
  onShowRewardedAd: () => void;
  ringSize: number;
  showGuideRing: boolean;
  targetDurationMs: number;
  elapsedMs: number;
  isHitTimerActive: boolean;
  countdown: number | null;
  eggImage: ImageSourcePropType;
  lastGrade: Grade | null;
  lastDamage: number;
  lastHardBonus: number;
  exactHit: boolean;
  onPress: () => void;
  eggTranslateX: Animated.Value;
  eggTranslateY: Animated.Value;
  eggScaleX: Animated.Value;
  eggScaleY: Animated.Value;
  stageTranslateX: Animated.Value;
  stageTranslateY: Animated.Value;
  countdownScale: Animated.Value;
  shockwaveScale: Animated.Value;
  shockwaveOpacity: Animated.Value;
  fragmentProgress: Animated.Value;
  resultScale: Animated.Value;
  resultOpacity: Animated.Value;
  highlightStart: boolean;
  exactFreeze: boolean;
  showFreePlayHint: boolean;
};

export function EggStage({
  phase,
  hasStartedEgg,
  hasHits,
  isEnergyHydrated,
  nextRecoveryAt,
  rewardedAd,
  canStartRewardedAd,
  onReloadRewardedAd,
  onShowRewardedAd,
  ringSize,
  showGuideRing,
  targetDurationMs,
  elapsedMs,
  isHitTimerActive,
  countdown,
  eggImage,
  lastGrade,
  lastDamage,
  lastHardBonus,
  exactHit,
  onPress,
  eggTranslateX,
  eggTranslateY,
  eggScaleX,
  eggScaleY,
  stageTranslateX,
  stageTranslateY,
  countdownScale,
  shockwaveScale,
  shockwaveOpacity,
  fragmentProgress,
  resultScale,
  resultOpacity,
  highlightStart,
  exactFreeze,
  showFreePlayHint,
}: EggStageProps) {
  const startPulse = useRef(new Animated.Value(1)).current;
  const { t } = useTranslation();

  useEffect(() => {
    if (!highlightStart) {
      startPulse.stopAnimation();
      startPulse.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(startPulse, {
          toValue: 1.04,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(startPulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [highlightStart, startPulse]);

  if (phase === 'eggBroken') return null;

  const showTargetRing = showGuideRing && (phase === 'hold' || phase === 'running');
  const showGrowingRing = phase === 'running';
  const showHitTimer =
    isHitTimerActive &&
    (phase === 'running' || phase === 'impact' || phase === 'result');

  return (
    <Animated.View
      style={[
        styles.stageWrapper,
        exactFreeze && styles.exactFreezeStage,
        { transform: [{ translateX: stageTranslateX }, { translateY: stageTranslateY }] },
      ]}>
      <Pressable onPress={onPress} style={styles.gameStage}>
        {showTargetRing && (
          <View
            pointerEvents="none"
            style={[
              styles.targetRing,
              {
                width: TARGET_RING_SIZE,
                height: TARGET_RING_SIZE,
                borderRadius: TARGET_RING_SIZE / 2,
              },
            ]}
          />
        )}

        {showGrowingRing && (
          <View
            pointerEvents="none"
            style={[
              styles.growingRing,
              { width: ringSize, height: ringSize, borderRadius: ringSize / 2 },
            ]}
          />
        )}

        <HitTimer
          elapsedMs={elapsedMs}
          targetDurationMs={targetDurationMs}
          visible={showHitTimer}
        />

        <Animated.View
          pointerEvents="none"
          style={[
            styles.shockwave,
            { opacity: shockwaveOpacity, transform: [{ scale: shockwaveScale }] },
          ]}
        />

        <Animated.View
          style={[
            styles.eggImageWrapper,
            {
              transform: [
                { translateX: eggTranslateX },
                { translateY: eggTranslateY },
                { scaleX: eggScaleX },
                { scaleY: eggScaleY },
              ],
            },
          ]}>
          <Animated.Image source={eggImage} resizeMode="contain" style={styles.eggImage} />
        </Animated.View>

        {(phase === 'impact' || phase === 'result') &&
          FRAGMENT_ANGLES.map((angle, index) => {
            const radians = (angle * Math.PI) / 180;
            const distance = 80 + (index % 2) * 22;
            const x = Math.cos(radians) * distance;
            const y = Math.sin(radians) * distance;

            return (
              <Animated.View
                key={angle}
                pointerEvents="none"
                style={[
                  styles.fragment,
                  {
                    opacity: fragmentProgress.interpolate({
                      inputRange: [0, 0.65, 1],
                      outputRange: [1, 0.8, 0],
                    }),
                    transform: [
                      {
                        translateX: fragmentProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, x],
                        }),
                      },
                      {
                        translateY: fragmentProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, y],
                        }),
                      },
                      {
                        rotate: fragmentProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', `${130 + index * 35}deg`],
                        }),
                      },
                    ],
                  },
                ]}
              />
            );
          })}

        {phase === 'ready' && (
          <Animated.View
            style={[
              styles.stageMessage,
              highlightStart && styles.startHighlight,
              { transform: [{ scale: startPulse }] },
            ]}>
            {!isEnergyHydrated ? (
              <Text style={styles.tapTitle}>{t('game.checkingHits')}</Text>
            ) : hasHits ? (
              <>
                <Text style={styles.tapTitle}>
                  {hasStartedEgg ? t('game.tapForNextHit') : t('game.tapToStart')}
                </Text>
                <Text style={styles.tapSubtitle}>{t('game.aimHint')}</Text>
              </>
            ) : (
              <>
                <Text style={styles.tapModeTitle}>{t('game.tapTheEgg')}</Text>
                <Text style={styles.tapModeSubtitle}>{t('game.oneTapDamage')}</Text>
                <View style={styles.nextHitRow}>
                  <Text style={styles.noHitsSubtitle}>{t('game.nextPerfectStop')}</Text>
                  {nextRecoveryAt !== null && (
                    <HitRecoveryCountdown
                      recoveryAt={nextRecoveryAt}
                      style={styles.noHitsCountdown}
                    />
                  )}
                </View>
                <View style={styles.rewardedButtonWrapper}>
                  <RewardedHitButton
                    ad={rewardedAd}
                    canInteract={canStartRewardedAd}
                    onReload={onReloadRewardedAd}
                    onShow={onShowRewardedAd}
                  />
                </View>
              </>
            )}
            {highlightStart ? (
              <Text style={styles.startHere}>{t('game.startHere')}</Text>
            ) : null}
          </Animated.View>
        )}

        {phase === 'countdown' && (
          <Animated.Text
            style={[styles.countdown, { transform: [{ scale: countdownScale }] }]}>
            {countdown}
          </Animated.Text>
        )}
        {phase === 'go' && <Text style={styles.goText}>{t('game.go')}</Text>}
        {phase === 'hold' && <Text style={styles.readyText}>{t('game.ready')}</Text>}
        {phase === 'running' && (
          <Text style={styles.strikeHint}>{t('game.tap')}</Text>
        )}

        {exactFreeze ? (
          <View pointerEvents="none" style={styles.exactPrompt}>
            <Text style={styles.exactNow}>{t('game.now')}</Text>
            <Text style={styles.exactTap}>{t('game.tapScreen')}</Text>
          </View>
        ) : null}

        {showFreePlayHint && phase === 'ready' ? (
          <View pointerEvents="none" style={styles.freePlayHint}>
            <Text style={styles.freePlayHintText}>{t('game.crackEgg')}</Text>
          </View>
        ) : null}

        <HitResult
          visible={phase === 'result'}
          grade={lastGrade}
          damage={lastDamage}
          hardBonus={lastHardBonus}
          exactHit={exactHit}
          scale={resultScale}
          opacity={resultOpacity}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stageWrapper: { flex: 1 },
  exactFreezeStage: { position: 'relative', zIndex: 300 },
  gameStage: {
    flex: 1,
    minHeight: 410,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetRing: {
    position: 'absolute',
    borderWidth: 2.5,
    borderColor: '#C8A683',
    opacity: 0.74,
    zIndex: 4,
  },
  growingRing: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#F0A84A',
    shadowColor: '#F0A84A',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 5,
  },
  shockwave: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 10,
    borderColor: '#FFD277',
    zIndex: 1,
  },
  eggImageWrapper: {
    width: 214,
    height: 270,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  eggImage: { width: '100%', height: '100%' },
  fragment: {
    position: 'absolute',
    width: 13,
    height: 9,
    borderRadius: 4,
    backgroundColor: '#E7CAA1',
    borderWidth: 1,
    borderColor: '#CAAC83',
    zIndex: 8,
  },
  stageMessage: { position: 'absolute', bottom: 18, alignItems: 'center' },
  startHighlight: {
    shadowColor: '#F0A84A',
    shadowOpacity: 0.9,
    shadowRadius: 14,
  },
  startHere: {
    position: 'absolute',
    top: -24,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
    color: '#D7862F',
  },
  tapTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#6C594A',
  },
  tapSubtitle: { marginTop: 6, fontSize: 12, fontWeight: '600', color: '#A09285' },
  tapModeTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2.5,
    color: '#7A593B',
  },
  tapModeSubtitle: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: '#B27C3F',
  },
  nextHitRow: { marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  noHitsSubtitle: { fontSize: 12, fontWeight: '700', color: '#A09285' },
  noHitsCountdown: { fontSize: 12, fontWeight: '900', color: '#B27C3F' },
  rewardedButtonWrapper: { marginTop: 14 },
  countdown: {
    position: 'absolute',
    zIndex: 10,
    fontSize: 96,
    fontWeight: '900',
    color: '#4D4036',
  },
  goText: {
    position: 'absolute',
    zIndex: 10,
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: 4,
    color: '#F0A84A',
  },
  readyText: {
    position: 'absolute',
    bottom: 22,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 3,
    color: '#AA998A',
  },
  strikeHint: {
    position: 'absolute',
    bottom: 20,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 3,
    color: '#C19768',
    opacity: 0.8,
  },
  exactPrompt: {
    position: 'absolute',
    bottom: 22,
    zIndex: 10,
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 24,
    borderRadius: 18,
    backgroundColor: '#FFFDF7',
    borderWidth: 2,
    borderColor: '#D99A52',
    shadowColor: '#4D3828',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 3,
  },
  exactNow: {
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: 0.4,
    color: '#D7862F',
  },
  exactTap: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.2,
    color: '#4D3828',
  },
  freePlayHint: {
    position: 'absolute',
    top: 18,
    zIndex: 9,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 18,
    backgroundColor: '#FFFDF7',
    borderWidth: 2,
    borderColor: '#D99A52',
    shadowColor: '#4D3828',
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 3,
  },
  freePlayHintText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#4D3828',
  },
});
