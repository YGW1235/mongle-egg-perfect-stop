import { StyleSheet, Text, View } from 'react-native';

import { formatInteger } from '@/game/localization/format';
import { useTranslation } from '@/game/localization/LocalizationProvider';

type EggInfoProps = {
  hp: number;
  maxHp: number;
  highlightHp: boolean;
};

export function EggInfo({ hp, maxHp, highlightHp }: EggInfoProps) {
  const hpPercent = Math.max(0, hp / maxHp);
  const { locale, t } = useTranslation();

  return (
    <View style={[styles.eggInfo, highlightHp && styles.tutorialEggInfo]}>
      <View style={[styles.hpTarget, highlightHp && styles.hpHighlight]}>
        <Text style={styles.eggName}>{t('game.creamEgg')}</Text>
        <View style={styles.hpRow}>
          <Text style={styles.hpText}>{formatInteger(hp, locale)}</Text>
          <Text style={styles.hpDivider}>/</Text>
          <Text style={styles.hpMaxText}>{formatInteger(maxHp, locale)}</Text>
        </View>
        <View style={styles.hpTrack}>
          <View style={[styles.hpFill, { width: `${hpPercent * 100}%` }]} />
        </View>
      </View>
      {highlightHp ? (
        <View pointerEvents="none" style={styles.hpTutorialCard}>
          <Text style={styles.tutorialTitle}>{t('onboarding.eggHpTitle')}</Text>
          <Text style={styles.tutorialBody}>{t('onboarding.eggHpBody')}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  eggInfo: { position: 'relative', alignItems: 'center', marginTop: 8 },
  tutorialEggInfo: { zIndex: 301, marginTop: 30 },
  hpTarget: { alignItems: 'center' },
  hpHighlight: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 2.5,
    borderColor: '#F6B75A',
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#F6B75A',
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 2,
  },
  hpTutorialCard: {
    position: 'absolute',
    top: '100%',
    width: 270,
    marginTop: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#FFFDF7',
    borderWidth: 2,
    borderColor: '#D99A52',
    shadowColor: '#4D3828',
    shadowOpacity: 0.16,
    shadowRadius: 9,
    elevation: 4,
  },
  tutorialTitle: { fontSize: 20, fontWeight: '900', color: '#4D3828' },
  tutorialBody: {
    marginTop: 7,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '600',
    color: '#6F5847',
  },
  eggName: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#7A695C',
  },
  hpRow: { marginTop: 7, flexDirection: 'row', alignItems: 'center' },
  hpText: { fontSize: 16, fontWeight: '900', color: '#493C32' },
  hpDivider: { marginHorizontal: 4, fontSize: 13, color: '#B4A79A' },
  hpMaxText: { fontSize: 13, fontWeight: '700', color: '#9C8E82' },
  hpTrack: {
    width: 210,
    height: 10,
    marginTop: 9,
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: '#E7DCCF',
  },
  hpFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#75B88A',
  },
});
