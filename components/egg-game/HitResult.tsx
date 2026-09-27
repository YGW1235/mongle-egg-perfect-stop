import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { getGradeColor } from '@/game/egg/logic';
import { Grade } from '@/game/egg/types';
import { formatInteger } from '@/game/localization/format';
import { useTranslation } from '@/game/localization/LocalizationProvider';

type HitResultProps = {
  visible: boolean;
  grade: Grade | null;
  damage: number;
  hardBonus: number;
  exactHit: boolean;
  scale: Animated.Value;
  opacity: Animated.Value;
};

export function HitResult({
  visible,
  grade,
  damage,
  hardBonus,
  exactHit,
  scale,
  opacity,
}: HitResultProps) {
  const { locale, t } = useTranslation();
  if (!visible || !grade) return null;

  return (
    <Animated.View
      style={[
        styles.resultBubble,
        { opacity, transform: [{ scale }] },
      ]}>
      <Text style={[styles.resultGrade, { color: getGradeColor(grade) }]}>
        {exactHit ? t('hit.perfectCrack') : grade}
      </Text>
      <Text style={styles.damageText}>
        {t('hit.damage', { damage: formatInteger(damage, locale) })}
      </Text>
      {hardBonus > 0 ? (
        <Text style={styles.hardBonusText}>
          {t('hit.hardBonus', { bonus: formatInteger(hardBonus, locale) })}
        </Text>
      ) : null}
      {exactHit && <Text style={styles.secretText}>{t('hit.exact')}</Text>}
    </Animated.View>
  );
}

type HitResultActionsProps = {
  visible: boolean;
  canContinue: boolean;
  onNextHit: () => void;
};

export function HitResultActions({
  visible,
  canContinue,
  onNextHit,
}: HitResultActionsProps) {
  const { t } = useTranslation();
  if (!visible) return null;

  return (
    <View style={styles.bottomArea}>
      {canContinue ? (
        <Pressable
          onPress={onNextHit}
          style={({ pressed }) => [
            styles.mainButton,
            pressed && styles.buttonPressed,
          ]}>
          <Text style={styles.mainButtonText}>{t('hit.next')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  resultBubble: {
    position: 'absolute',
    bottom: 8,
    minWidth: 190,
    paddingVertical: 12,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: '#FFF9F1',
    borderWidth: 1,
    borderColor: '#E9DDD0',
    elevation: 5,
  },
  resultGrade: { fontSize: 21, fontWeight: '900', letterSpacing: 1.2 },
  damageText: {
    marginTop: 3,
    fontSize: 14,
    fontWeight: '800',
    color: '#66564B',
  },
  hardBonusText: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: '#C9782C',
  },
  secretText: {
    marginTop: 4,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#F0A84A',
  },
  bottomArea: { paddingBottom: 18, alignItems: 'center' },
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
  buttonPressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
});
