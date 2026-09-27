import {
  Pressable,
  StyleSheet,
  Text,
  type GestureResponderEvent,
} from 'react-native';

import type { RewardedHitAdController } from '@/game/ads/rewardedHitAd.types';
import { useTranslation } from '@/game/localization/LocalizationProvider';

type RewardedHitButtonProps = {
  ad: RewardedHitAdController;
  canInteract: boolean;
  compact?: boolean;
  onReload: () => void;
  onShow: () => void;
};

export function RewardedHitButton({
  ad,
  canInteract,
  compact = false,
  onReload,
  onShow,
}: RewardedHitButtonProps) {
  const { t } = useTranslation();
  const isUnavailable = !ad.isSupported || ad.error !== null;
  const isDisabled =
    !canInteract ||
    !ad.isSupported ||
    ad.readiness !== 'adsReady' ||
    ad.isLoading ||
    ad.isShowing ||
    (!ad.isLoaded && !isUnavailable);

  let label = compact ? t('ads.compactWatch') : t('ads.watch');
  if (!ad.isSupported) {
    label = compact ? t('ads.compactUnavailable') : t('ads.unavailable');
  }
  else if (ad.readiness === 'consentPending') {
    label = compact ? t('ads.compactPreparing') : t('ads.preparing');
  }
  else if (ad.readiness === 'adsUnavailable') {
    label = compact ? t('ads.compactUnavailable') : t('ads.unavailable');
  }
  else if (ad.isShowing) {
    label = compact ? t('ads.compactPlaying') : t('ads.playing');
  }
  else if (ad.isLoading) {
    label = compact ? t('ads.compactLoading') : t('ads.loading');
  }
  else if (ad.error !== null) {
    label = compact ? t('ads.compactRetry') : t('ads.retry');
  }

  const handlePress = (event: GestureResponderEvent) => {
    event.stopPropagation();
    if (isDisabled) return;
    if (ad.error !== null) onReload();
    else onShow();
  };

  return (
    <Pressable
      accessibilityLabel={compact ? t('ads.accessibility') : label}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      onPress={handlePress}
      style={({ pressed }) => [
        compact ? styles.compactButton : styles.prominentButton,
        isDisabled && styles.disabledButton,
        pressed && !isDisabled && styles.pressedButton,
      ]}>
      <Text style={compact ? styles.compactText : styles.prominentText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  compactButton: {
    width: 88,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: '#FFE4A3',
    borderWidth: 1,
    borderColor: '#E8B954',
  },
  prominentButton: {
    minWidth: 190,
    height: 46,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
    backgroundColor: '#F0A84A',
    borderWidth: 1,
    borderColor: '#D99135',
    elevation: 3,
  },
  compactText: {
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: '#6B4B2D',
  },
  prominentText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: '#553A24',
  },
  disabledButton: { opacity: 0.48, elevation: 0 },
  pressedButton: { opacity: 0.84, transform: [{ scale: 0.97 }] },
});
