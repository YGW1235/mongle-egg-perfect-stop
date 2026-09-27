import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { RARITY_COLORS } from '@/game/collection/creatures';
import type { CreatureDefinition } from '@/game/collection/types';
import { useGameAudio } from '@/game/audio/useGameAudio';
import { HATCH_RARITY_STYLES } from '@/game/egg/hatchStyles';
import {
  ImpactFeedbackStyle,
  NotificationFeedbackType,
  playImpact,
  playNotification,
} from '@/game/haptics';
import {
  translateCreatureDescription,
  translateRarity,
} from '@/game/localization/format';
import { useTranslation } from '@/game/localization/LocalizationProvider';

type EggRewardProps = {
  visible: boolean;
  closedEggImage: ImageSourcePropType;
  brokenEggImage: ImageSourcePropType;
  creature: CreatureDefinition;
  isNew: boolean;
  onReset: () => void;
  canReset: boolean;
  showRarityTutorial: boolean;
  onRarityContinue: () => void;
  onRevealComplete: () => void;
};

const HATCH_TIMELINE = {
  breakImpact: 90,
  eggOpens: 220,
  glow: 400,
  creature: 520,
  sparkle: 900,
  newLabel: 1050,
  identity: 1180,
  details: 1350,
  complete: 1530,
} as const;

const SPARKLES = [
  { symbol: '✦', x: -76, y: -52, size: 15, delay: 0.02 },
  { symbol: '•', x: -92, y: 2, size: 18, delay: 0.08 },
  { symbol: '✦', x: -54, y: -88, size: 11, delay: 0.15 },
  { symbol: '✦', x: 72, y: -58, size: 14, delay: 0.04 },
  { symbol: '•', x: 91, y: -4, size: 19, delay: 0.18 },
  { symbol: '✦', x: 48, y: -94, size: 10, delay: 0.11 },
  { symbol: '◇', x: -112, y: -42, size: 13, delay: 0.2 },
  { symbol: '✦', x: 108, y: -50, size: 12, delay: 0.24 },
  { symbol: '◇', x: -34, y: -116, size: 11, delay: 0.28 },
  { symbol: '✦', x: 36, y: -120, size: 14, delay: 0.32 },
] as const;

export function EggReward({
  visible,
  closedEggImage,
  brokenEggImage,
  creature,
  isNew,
  onReset,
  canReset,
  showRarityTutorial,
  onRarityContinue,
  onRevealComplete,
}: EggRewardProps) {
  const [showBrokenEgg, setShowBrokenEgg] = useState(false);
  const [canContinue, setCanContinue] = useState(false);
  const hatchStyle = HATCH_RARITY_STYLES[creature.rarity];
  const onRevealCompleteRef = useRef(onRevealComplete);
  const isNewRef = useRef(isNew);
  const { playCollectionDuplicate, playCollectionNew, playHatchRise } = useGameAudio();
  const { t } = useTranslation();

  useEffect(() => {
    onRevealCompleteRef.current = onRevealComplete;
  }, [onRevealComplete]);

  useEffect(() => {
    isNewRef.current = isNew;
  }, [isNew]);

  const sceneTranslateX = useRef(new Animated.Value(0)).current;
  const sceneTranslateY = useRef(new Animated.Value(0)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const shockwaveScale = useRef(new Animated.Value(0.45)).current;
  const shockwaveOpacity = useRef(new Animated.Value(0)).current;
  const eggTranslateY = useRef(new Animated.Value(0)).current;
  const eggScaleX = useRef(new Animated.Value(1)).current;
  const eggScaleY = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.5)).current;
  const creatureOpacity = useRef(new Animated.Value(0)).current;
  const creatureTranslateY = useRef(new Animated.Value(58)).current;
  const creatureScale = useRef(new Animated.Value(0.62)).current;
  const sparkleProgress = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.9)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const newOpacity = useRef(new Animated.Value(0)).current;
  const newScale = useRef(new Animated.Value(0.7)).current;
  const identityOpacity = useRef(new Animated.Value(0)).current;
  const identityTranslateY = useRef(new Animated.Value(10)).current;
  const detailsOpacity = useRef(new Animated.Value(0)).current;
  const detailsTranslateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    const values = [
      sceneTranslateX,
      sceneTranslateY,
      flashOpacity,
      shockwaveScale,
      shockwaveOpacity,
      eggTranslateY,
      eggScaleX,
      eggScaleY,
      glowOpacity,
      glowScale,
      creatureOpacity,
      creatureTranslateY,
      creatureScale,
      sparkleProgress,
      titleOpacity,
      titleScale,
      cardOpacity,
      newOpacity,
      newScale,
      identityOpacity,
      identityTranslateY,
      detailsOpacity,
      detailsTranslateY,
    ];

    const resetAnimation = () => {
      values.forEach((value) => value.stopAnimation());
      sceneTranslateX.setValue(0);
      sceneTranslateY.setValue(0);
      flashOpacity.setValue(0);
      shockwaveScale.setValue(0.45);
      shockwaveOpacity.setValue(0);
      eggTranslateY.setValue(0);
      eggScaleX.setValue(1);
      eggScaleY.setValue(1);
      glowOpacity.setValue(0);
      glowScale.setValue(0.5);
      creatureOpacity.setValue(0);
      creatureTranslateY.setValue(58);
      creatureScale.setValue(0.62);
      sparkleProgress.setValue(0);
      titleOpacity.setValue(0);
      titleScale.setValue(0.9);
      cardOpacity.setValue(0);
      newOpacity.setValue(0);
      newScale.setValue(0.7);
      identityOpacity.setValue(0);
      identityTranslateY.setValue(10);
      detailsOpacity.setValue(0);
      detailsTranslateY.setValue(8);
    };

    resetAnimation();
    setShowBrokenEgg(false);
    setCanContinue(false);

    if (!visible) return resetAnimation;

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const schedule = (callback: () => void, delay: number) => {
      timeouts.push(setTimeout(callback, delay));
    };
    const revealDelay = hatchStyle.revealDelayMs;
    const creatureRevealAt = HATCH_TIMELINE.creature + revealDelay;

    schedule(() => {
      playImpact(ImpactFeedbackStyle.Heavy);
      flashOpacity.setValue(hatchStyle.breakFlashOpacity);
      shockwaveOpacity.setValue(0.88);

      Animated.parallel([
        Animated.sequence([
          Animated.timing(sceneTranslateX, {
            toValue: -10,
            duration: 38,
            useNativeDriver: true,
          }),
          Animated.timing(sceneTranslateX, {
            toValue: 9,
            duration: 44,
            useNativeDriver: true,
          }),
          Animated.timing(sceneTranslateX, {
            toValue: -4,
            duration: 42,
            useNativeDriver: true,
          }),
          Animated.timing(sceneTranslateX, {
            toValue: 0,
            duration: 54,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(sceneTranslateY, {
            toValue: 4,
            duration: 42,
            useNativeDriver: true,
          }),
          Animated.timing(sceneTranslateY, {
            toValue: -3,
            duration: 48,
            useNativeDriver: true,
          }),
          Animated.timing(sceneTranslateY, {
            toValue: 0,
            duration: 70,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(flashOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(shockwaveScale, {
          toValue: 1.5,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(shockwaveOpacity, {
          toValue: 0,
          duration: 310,
          useNativeDriver: true,
        }),
      ]).start();
    }, HATCH_TIMELINE.breakImpact);

    schedule(() => {
      setShowBrokenEgg(true);
      Animated.parallel([
        Animated.sequence([
          Animated.timing(eggScaleX, {
            toValue: 1.08,
            duration: 70,
            useNativeDriver: true,
          }),
          Animated.spring(eggScaleX, {
            toValue: 0.97,
            tension: 210,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.spring(eggScaleX, {
            toValue: 1,
            tension: 170,
            friction: 7,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(eggScaleY, {
            toValue: 0.92,
            duration: 70,
            useNativeDriver: true,
          }),
          Animated.spring(eggScaleY, {
            toValue: 1.05,
            tension: 210,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.spring(eggScaleY, {
            toValue: 1,
            tension: 170,
            friction: 7,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(eggTranslateY, {
            toValue: 7,
            duration: 70,
            useNativeDriver: true,
          }),
          Animated.spring(eggTranslateY, {
            toValue: -8,
            tension: 190,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.spring(eggTranslateY, {
            toValue: 0,
            tension: 160,
            friction: 7,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(titleScale, {
          toValue: 1,
          tension: 170,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    }, HATCH_TIMELINE.eggOpens);

    schedule(() => {
      const glowScaleAnimation = hatchStyle.glowPulse
        ? Animated.sequence([
            Animated.timing(glowScale, {
              toValue: 1.08,
              duration: 170,
              useNativeDriver: true,
            }),
            Animated.timing(glowScale, {
              toValue: 0.92,
              duration: 90,
              useNativeDriver: true,
            }),
            Animated.timing(glowScale, {
              toValue: hatchStyle.glowPeakScale,
              duration: 360,
              useNativeDriver: true,
            }),
          ])
        : Animated.timing(glowScale, {
            toValue: hatchStyle.glowPeakScale,
            duration: 620,
            useNativeDriver: true,
          });

      Animated.parallel([
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: hatchStyle.glowPeakOpacity,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: hatchStyle.glowRestOpacity,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        glowScaleAnimation,
      ]).start();
    }, HATCH_TIMELINE.glow);

    if (hatchStyle.revealFlashOpacity > 0) {
      schedule(() => {
        flashOpacity.setValue(hatchStyle.revealFlashOpacity);
        Animated.timing(flashOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }).start();
      }, creatureRevealAt - 90);
    }

    schedule(() => {
      playHatchRise();
      if (hatchStyle.revealImpact === 'medium') {
        playImpact(ImpactFeedbackStyle.Medium);
      }
      if (hatchStyle.revealImpact === 'heavy') {
        playImpact(ImpactFeedbackStyle.Heavy);
      }
      Animated.parallel([
        Animated.timing(creatureOpacity, {
          toValue: 1,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.spring(creatureTranslateY, {
            toValue: -16,
            tension: 88,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.spring(creatureTranslateY, {
            toValue: 0,
            tension: 135,
            friction: 7,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.spring(creatureScale, {
            toValue: hatchStyle.creatureOvershootScale,
            tension: 95,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.spring(creatureScale, {
            toValue: 1,
            tension: 140,
            friction: 7,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }, creatureRevealAt);

    schedule(() => {
      Animated.timing(sparkleProgress, {
        toValue: 1,
        duration: 430,
        useNativeDriver: true,
      }).start();
    }, HATCH_TIMELINE.sparkle + revealDelay);

    schedule(() => {
      if (isNewRef.current) {
        playCollectionNew();
      } else {
        playCollectionDuplicate();
      }
      playNotification(NotificationFeedbackType.Success);
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.timing(newOpacity, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.spring(newScale, {
          toValue: 1,
          tension: 190,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    }, HATCH_TIMELINE.newLabel + revealDelay);

    schedule(() => {
      Animated.parallel([
        Animated.timing(identityOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(identityTranslateY, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }, HATCH_TIMELINE.identity + revealDelay);

    schedule(() => {
      Animated.parallel([
        Animated.timing(detailsOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(detailsTranslateY, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }, HATCH_TIMELINE.details + revealDelay);

    schedule(() => {
      setCanContinue(true);
      onRevealCompleteRef.current();
    }, HATCH_TIMELINE.complete + revealDelay);

    return () => {
      timeouts.forEach(clearTimeout);
      resetAnimation();
    };
  }, [
    cardOpacity,
    creatureOpacity,
    creatureScale,
    creatureTranslateY,
    detailsOpacity,
    detailsTranslateY,
    eggScaleX,
    eggScaleY,
    eggTranslateY,
    flashOpacity,
    glowOpacity,
    glowScale,
    hatchStyle,
    identityOpacity,
    identityTranslateY,
    newOpacity,
    newScale,
    playCollectionDuplicate,
    playCollectionNew,
    playHatchRise,
    sceneTranslateX,
    sceneTranslateY,
    shockwaveOpacity,
    shockwaveScale,
    sparkleProgress,
    titleOpacity,
    titleScale,
    visible,
  ]);

  if (!visible) return null;

  return (
    <View
      style={[
        styles.rewardScreen,
        showRarityTutorial && styles.tutorialRewardScreen,
      ]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.hatchFlash,
          { backgroundColor: hatchStyle.flashColor, opacity: flashOpacity },
        ]}
      />

      <Animated.View
        style={[
          styles.rewardContent,
          { transform: [{ translateX: sceneTranslateX }, { translateY: sceneTranslateY }] },
        ]}>
        {showRarityTutorial ? (
          <Pressable accessibilityRole="none" onPress={() => {}} style={styles.rarityScrim} />
        ) : null}
        <Animated.Text
          style={[styles.brokenTitle, { opacity: titleOpacity, transform: [{ scale: titleScale }] }]}>
          EGG CRACKED!
        </Animated.Text>

        <View style={styles.hatchStage}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.shockwave,
              {
                borderColor: hatchStyle.shockwaveColor,
                opacity: shockwaveOpacity,
                transform: [{ scale: shockwaveScale }],
              },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.glow,
              {
                backgroundColor: hatchStyle.glowColor,
                shadowColor: hatchStyle.glowShadowColor,
                opacity: glowOpacity,
                transform: [{ scale: glowScale }],
              },
            ]}
          />

          <Animated.View
            pointerEvents="none"
            style={[
              styles.creatureWrapper,
              {
                opacity: creatureOpacity,
                transform: [
                  { translateY: creatureTranslateY },
                  { scale: creatureScale },
                ],
              },
            ]}>
            <Image source={creature.image} resizeMode="contain" style={styles.creatureImage} />
          </Animated.View>

          {SPARKLES.slice(0, hatchStyle.sparkleCount).map((sparkle, index) => {
            const peak = Math.min(0.58 + sparkle.delay, 0.82);
            return (
              <Animated.Text
                key={`${sparkle.symbol}-${index}`}
                pointerEvents="none"
                style={[
                  styles.sparkle,
                  {
                    fontSize: sparkle.size,
                    color: hatchStyle.sparkleColor,
                    opacity: sparkleProgress.interpolate({
                      inputRange: [0, sparkle.delay, peak, 1],
                      outputRange: [0, 0, 1, 0],
                    }),
                    transform: [
                      {
                        translateX: sparkleProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, sparkle.x * hatchStyle.sparkleDistanceMultiplier],
                        }),
                      },
                      {
                        translateY: sparkleProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, sparkle.y * hatchStyle.sparkleDistanceMultiplier],
                        }),
                      },
                      {
                        scale: sparkleProgress.interpolate({
                          inputRange: [0, peak, 1],
                          outputRange: [0.5, 1.15, 0.75],
                        }),
                      },
                    ],
                  },
                ]}>
                {sparkle.symbol}
              </Animated.Text>
            );
          })}

          <Animated.View
            style={[
              styles.eggImageWrapper,
              {
                transform: [
                  { translateY: eggTranslateY },
                  { scaleX: eggScaleX },
                  { scaleY: eggScaleY },
                ],
              },
            ]}>
            <Animated.Image
              source={showBrokenEgg ? brokenEggImage : closedEggImage}
              resizeMode="contain"
              style={styles.eggImage}
            />
          </Animated.View>
        </View>

        <Animated.View
          style={[
            styles.creatureCard,
            showRarityTutorial && styles.rarityTarget,
            { opacity: cardOpacity },
          ]}>
          <Animated.Text
            style={[styles.newLabel, { opacity: newOpacity, transform: [{ scale: newScale }] }]}>
            {isNew ? t('hatch.new') : t('hatch.duplicate')}
          </Animated.Text>
          <Animated.View
            style={{
              opacity: identityOpacity,
              transform: [{ translateY: identityTranslateY }],
              alignItems: 'center',
            }}>
            <Text style={styles.creatureName}>{creature.name}</Text>
            <Text style={[styles.creatureRarity, { color: RARITY_COLORS[creature.rarity] }]}>
              {translateRarity(t, creature.rarity)}
            </Text>
          </Animated.View>
          <Animated.Text
            style={[
              styles.creatureDescription,
              { opacity: detailsOpacity, transform: [{ translateY: detailsTranslateY }] },
            ]}>
            {translateCreatureDescription(t, creature.id, creature.description)}
          </Animated.Text>
        </Animated.View>

        <Animated.View
          pointerEvents={canContinue && canReset ? 'auto' : 'none'}
          style={[styles.buttonWrapper, { opacity: detailsOpacity }]}>
          <Pressable
            disabled={!canContinue || !canReset}
            onPress={onReset}
            style={styles.mainButton}>
            <Text style={styles.mainButtonText}>{t('hatch.nextEgg')}</Text>
          </Pressable>
        </Animated.View>

        {showRarityTutorial ? (
          <View style={styles.rarityCard}>
            <Text style={styles.tutorialEyebrow}>{t('hatch.rarityTitle')}</Text>
            <Text style={styles.rarityTitle}>{t('hatch.rarityBody')}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={onRarityContinue}
              style={({ pressed }) => [
                styles.tutorialAction,
                pressed && styles.tutorialActionPressed,
              ]}>
              <Text style={styles.tutorialActionText}>{t('common.continue')}</Text>
            </Pressable>
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  rewardScreen: {
    flex: 1,
  },
  tutorialRewardScreen: { zIndex: 301 },
  rarityScrim: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 6,
    backgroundColor: 'rgba(35, 25, 20, 0.5)',
  },
  rarityCard: {
    position: 'absolute',
    top: 10,
    zIndex: 8,
    width: '88%',
    maxWidth: 390,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: '#FFFDF7',
    borderWidth: 2,
    borderColor: '#D99A52',
    shadowColor: '#4D3828',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },
  tutorialEyebrow: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: '#B87332',
  },
  rarityTitle: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
    color: '#4D3828',
  },
  tutorialAction: {
    width: '100%',
    height: 58,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#F0A84A',
  },
  tutorialActionPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  tutorialActionText: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.2,
    color: '#553A24',
  },
  hatchFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFF5D8',
    zIndex: 100,
  },
  rewardContent: {
    flex: 1,
    width: '100%',
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brokenTitle: {
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#4D4036',
  },
  hatchStage: {
    width: 280,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shockwave: {
    position: 'absolute',
    bottom: 5,
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 10,
    borderColor: '#FFD277',
    zIndex: 0,
  },
  glow: {
    position: 'absolute',
    bottom: 35,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#FFD978',
    shadowColor: '#F0A84A',
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 2,
    zIndex: 1,
  },
  creatureWrapper: {
    position: 'absolute',
    top: 52,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  creatureImage: { width: 150, height: 150 },
  sparkle: {
    position: 'absolute',
    top: 92,
    left: 134,
    color: '#F0A84A',
    zIndex: 5,
  },
  eggImageWrapper: {
    position: 'absolute',
    bottom: 0,
    width: 190,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  eggImage: { width: '100%', height: '100%' },
  creatureCard: {
    width: '82%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderRadius: 26,
    backgroundColor: '#FFF9F1',
    borderWidth: 2,
    borderColor: '#ECDCC9',
  },
  rarityTarget: {
    zIndex: 7,
    borderWidth: 3,
    borderColor: '#F6B75A',
    shadowColor: '#F6B75A',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  newLabel: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
    overflow: 'hidden',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#FFFFFF',
    backgroundColor: '#F0A84A',
  },
  creatureName: { marginTop: 8, fontSize: 23, fontWeight: '900', color: '#4D4036' },
  creatureRarity: {
    marginTop: 4,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#7BAA88',
  },
  creatureDescription: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    color: '#8A7B6E',
  },
  buttonWrapper: { width: '100%' },
  mainButton: {
    width: '100%',
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: '#F0A84A',
    elevation: 4,
  },
  mainButtonText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: '#553A24',
  },
});
