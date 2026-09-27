import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '@/game/localization/LocalizationProvider';

type HitTimerProps = {
  visible: boolean;
  targetDurationMs: number;
  elapsedMs: number;
};

export function HitTimer({ visible, targetDurationMs, elapsedMs }: HitTimerProps) {
  const { t } = useTranslation();
  const formattedTarget = useMemo(
    () => (Math.max(0, targetDurationMs) / 1000).toFixed(3),
    [targetDurationMs]
  );

  if (!visible) return null;

  return (
    <View
      accessibilityElementsHidden
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={styles.container}>
      <View accessible={false} style={styles.targetRow}>
        <Text accessible={false} style={styles.targetLabel}>
          {t('timer.target')}
        </Text>
        <Text accessible={false} style={styles.targetValue}>
          {formattedTarget}
        </Text>
      </View>
      <Text accessible={false} style={styles.elapsedValue}>
        {(Math.max(0, elapsedMs) / 1000).toFixed(3)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(255, 253, 247, 0.72)',
    borderWidth: 1.5,
    borderColor: '#D99A52',
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    opacity: 0.72,
  },
  targetLabel: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: '#6F5847',
  },
  targetValue: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    color: '#6F5847',
  },
  elapsedValue: {
    minWidth: 68,
    textAlign: 'center',
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    color: '#4D3828',
  },
});
