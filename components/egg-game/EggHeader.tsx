import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { HitRecoveryCountdown } from './HitRecoveryCountdown';
import { RewardedHitButton } from './RewardedHitButton';
import type { RewardedHitAdController } from '@/game/ads/rewardedHitAd.types';
import { TOTAL_COLLECTION_COUNT } from '@/game/collection/creatures';
import { useTranslation } from '@/game/localization/LocalizationProvider';

type EggHeaderProps = {
  hitsLeft: number;
  maxHits: number;
  isEnergyHydrated: boolean;
  nextRecoveryAt: number | null;
  rewardedAd: RewardedHitAdController;
  canStartRewardedAd: boolean;
  onReloadRewardedAd: () => void;
  onShowRewardedAd: () => void;
  collectionCount: number;
  onPressCollection: () => void;
  canPressCollection: boolean;
  highlightCollection: boolean;
  highlightHits: boolean;
  showShop: boolean;
  onPressShop: () => void;
  showSettings: boolean;
  onPressSettings: () => void;
};

export function EggHeader({
  hitsLeft,
  maxHits,
  isEnergyHydrated,
  nextRecoveryAt,
  rewardedAd,
  canStartRewardedAd,
  onReloadRewardedAd,
  onShowRewardedAd,
  collectionCount,
  onPressCollection,
  canPressCollection,
  highlightCollection,
  highlightHits,
  showShop,
  onPressShop,
  showSettings,
  onPressSettings,
}: EggHeaderProps) {
  const collectionPulse = useRef(new Animated.Value(1)).current;
  const { t } = useTranslation();

  useEffect(() => {
    if (!highlightCollection) {
      collectionPulse.stopAnimation();
      collectionPulse.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(collectionPulse, {
          toValue: 1.06,
          duration: 760,
          useNativeDriver: true,
        }),
        Animated.timing(collectionPulse, {
          toValue: 1,
          duration: 760,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [collectionPulse, highlightCollection]);

  return (
    <View
      style={[
        styles.header,
        highlightCollection && styles.tutorialHeader,
        highlightHits && styles.resourcesHeader,
      ]}>
      {highlightHits ? <View pointerEvents="none" style={styles.resourcesHeaderScrim} /> : null}
      <View style={[styles.energyColumn, highlightHits && styles.highlightedEnergyColumn]}>
        <View style={[styles.energyTarget, highlightHits && styles.hitsHighlight]}>
          <View style={[styles.headerPill, styles.energyPill]}>
            <Text style={styles.headerIcon}>⚡</Text>
            <View>
              <Text style={styles.energyLabel}>{t('main.hits')}</Text>
              <Text style={styles.headerValue}>
                {isEnergyHydrated ? hitsLeft : '--'}/{maxHits}
              </Text>
              {isEnergyHydrated && nextRecoveryAt !== null && (
                <View style={styles.recoveryRow}>
                  <Text style={styles.recoveryLabel}>+1</Text>
                  <HitRecoveryCountdown
                    recoveryAt={nextRecoveryAt}
                    style={styles.recoveryTime}
                  />
                </View>
              )}
            </View>
          </View>
        </View>
        {isEnergyHydrated && hitsLeft > 0 && hitsLeft < maxHits && !highlightHits && (
          <RewardedHitButton
            ad={rewardedAd}
            canInteract={canStartRewardedAd}
            compact
            onReload={onReloadRewardedAd}
            onShow={onShowRewardedAd}
          />
        )}
      </View>

      {highlightHits ? (
        <View pointerEvents="none" style={styles.hitsTutorialCard}>
          <Text style={styles.tutorialTitle}>{t('main.hitsTutorialTitle')}</Text>
          <Text style={styles.tutorialBody}>{t('main.hitsTutorialBody')}</Text>
        </View>
      ) : null}

      <Text adjustsFontSizeToFit minimumFontScale={0.7} numberOfLines={1} style={styles.logo}>
        {t('main.logo')}
      </Text>

      <View style={styles.rightControls}>
        <Animated.View
          style={[
            highlightCollection && styles.collectionHighlight,
            { transform: [{ scale: collectionPulse }] },
          ]}>
          <Pressable
            accessibilityLabel={t('main.openCollection')}
            accessibilityRole="button"
            disabled={!canPressCollection}
            onPress={onPressCollection}
            style={[styles.headerPill, styles.collectionPill]}>
            <Text style={styles.headerIcon}>📖</Text>
            <Text style={styles.headerValue}>{collectionCount}/{TOTAL_COLLECTION_COUNT}</Text>
          </Pressable>
          {highlightCollection ? (
            <Text pointerEvents="none" style={styles.collectionTargetLabel}>
              {t('main.collectionPrompt')}
            </Text>
          ) : null}
        </Animated.View>
        {showShop ? (
          <Pressable
            accessibilityLabel={t('main.openShop')}
            accessibilityRole="button"
            hitSlop={2}
            onPress={onPressShop}
            style={({ pressed }) => [
              styles.settingsButton,
              pressed && styles.settingsButtonPressed,
            ]}>
            <Ionicons color="#8A735E" name="storefront-outline" size={19} />
          </Pressable>
        ) : null}
        {showSettings ? (
          <Pressable
            accessibilityLabel={t('main.openSettings')}
            accessibilityRole="button"
            hitSlop={2}
            onPress={onPressSettings}
            style={({ pressed }) => [
              styles.settingsButton,
              pressed && styles.settingsButtonPressed,
            ]}>
            <Ionicons color="#8A735E" name="settings-outline" size={19} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 86,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tutorialHeader: { position: 'relative', zIndex: 301 },
  resourcesHeader: { position: 'relative', zIndex: 301 },
  resourcesHeaderScrim: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    backgroundColor: 'rgba(35, 25, 20, 0.5)',
  },
  logo: {
    flexShrink: 1,
    marginHorizontal: 4,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2.5,
    color: '#493C32',
  },
  headerPill: {
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF9F1',
    borderWidth: 1,
    borderColor: '#E8DCCF',
  },
  energyPill: {
    minWidth: 88,
    height: 54,
    paddingHorizontal: 10,
  },
  collectionPill: { paddingHorizontal: 8 },
  energyTarget: { borderRadius: 16 },
  highlightedEnergyColumn: { zIndex: 2 },
  hitsHighlight: {
    padding: 3,
    borderWidth: 2.5,
    borderColor: '#F6B75A',
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#F6B75A',
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 2,
  },
  energyColumn: { width: 88, alignItems: 'center', gap: 4 },
  headerIcon: { fontSize: 15 },
  energyLabel: {
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: '#A09285',
  },
  headerValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#493C32',
  },
  recoveryRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  recoveryLabel: { fontSize: 7, fontWeight: '900', color: '#B27C3F' },
  recoveryTime: { fontSize: 8, fontWeight: '800', color: '#8A735E' },
  hitsTutorialCard: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 104,
    zIndex: 2,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFDF7',
    borderWidth: 2,
    borderColor: '#D99A52',
    shadowColor: '#4D3828',
    shadowOpacity: 0.16,
    shadowRadius: 9,
    elevation: 4,
  },
  tutorialTitle: { textAlign: 'center', fontSize: 19, fontWeight: '900', color: '#4D3828' },
  tutorialBody: {
    marginTop: 5,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
    color: '#6F5847',
  },
  collectionHighlight: {
    borderRadius: 22,
    shadowColor: '#F0A84A',
    shadowOpacity: 0.95,
    shadowRadius: 14,
    elevation: 8,
  },
  rightControls: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  settingsButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#FFF9F1',
    borderWidth: 1,
    borderColor: '#E8DCCF',
  },
  settingsButtonPressed: { opacity: 0.72, transform: [{ scale: 0.96 }] },
  collectionTargetLabel: {
    position: 'absolute',
    top: 45,
    right: 0,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    color: '#D7862F',
  },
});
