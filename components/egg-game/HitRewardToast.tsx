import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

import { useTranslation } from '@/game/localization/LocalizationProvider';

type HitRewardToastProps = {
  trigger: number;
};

export function HitRewardToast({ trigger }: HitRewardToastProps) {
  const { t } = useTranslation();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    opacity.stopAnimation();
    translateY.stopAnimation();
    opacity.setValue(0);
    translateY.setValue(8);

    if (trigger <= 0) return;

    Animated.parallel([
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.delay(650),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.delay(580),
        Animated.timing(translateY, {
          toValue: -6,
          duration: 270,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    return () => {
      opacity.stopAnimation();
      translateY.stopAnimation();
    };
  }, [opacity, translateY, trigger]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.toast, { opacity, transform: [{ translateY }] }]}>
      <Text style={styles.toastText}>{t('ads.reward')}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 82,
    alignSelf: 'center',
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 99,
    backgroundColor: '#FFF3CC',
    borderWidth: 1,
    borderColor: '#E8B954',
    elevation: 6,
    zIndex: 180,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: '#8B5E24',
  },
});
