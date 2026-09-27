import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  BANGUL_MONGLE,
  DAL_MONGLE,
  KING_MONGLE,
  MONGLE,
  POSIL_MONGLE,
} from '@/game/collection/creatures';
import type { CreatureDefinition } from '@/game/collection/types';
import { CrackLevel, Grade } from '@/game/egg/types';

type GraphicsTestPanelProps = {
  visible: boolean;
  onHit: (grade: Grade) => void;
  onExactHit: () => void;
  onSetCrackLevel: (level: Exclude<CrackLevel, 4>) => void;
  onBreak: () => void;
  onHatch: (creature: CreatureDefinition) => void;
  onOpenDropSimulator: () => void;
  onReset: () => void;
};

const HIT_BUTTONS: readonly { label: string; grade: Grade }[] = [
  { label: 'P', grade: 'PERFECT' },
  { label: 'E', grade: 'EXCELLENT' },
  { label: 'G', grade: 'GREAT' },
  { label: 'GD', grade: 'GOOD' },
  { label: 'M', grade: 'MISS' },
];

const CRACK_LEVELS: readonly Exclude<CrackLevel, 4>[] = [0, 1, 2, 3];

const HATCH_BUTTONS: readonly { label: string; creature: CreatureDefinition }[] = [
  { label: 'HC', creature: MONGLE },
  { label: 'HU', creature: POSIL_MONGLE },
  { label: 'HR', creature: BANGUL_MONGLE },
  { label: 'HE', creature: DAL_MONGLE },
  { label: 'HL', creature: KING_MONGLE },
];

export function GraphicsTestPanel({
  visible,
  onHit,
  onExactHit,
  onSetCrackLevel,
  onBreak,
  onHatch,
  onOpenDropSimulator,
  onReset,
}: GraphicsTestPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (!visible) return null;

  const runImpactTest = (callback: () => void) => {
    setExpanded(false);
    callback();
  };

  return (
    <View style={styles.devTools}>
      {expanded ? (
        <View style={styles.devCompactPanel}>
          <View style={styles.devPanelHeader}>
            <Text style={styles.devPanelTitle}>GRAPHICS TEST</Text>
            <Pressable onPress={() => setExpanded(false)} style={styles.devCloseButton}>
              <Text style={styles.devCloseText}>×</Text>
            </Pressable>
          </View>

          <View style={styles.devButtonRow}>
            {HIT_BUTTONS.map(({ label, grade }) => (
              <Pressable
                key={grade}
                onPress={() => runImpactTest(() => onHit(grade))}
                style={styles.devHitButton}>
                <Text style={styles.devHitButtonText}>{label}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => runImpactTest(onExactHit)}
              style={[styles.devHitButton, styles.devExactButton]}>
              <Text style={styles.devHitButtonText}>EX</Text>
            </Pressable>
          </View>

          <View style={styles.devButtonRow}>
            {CRACK_LEVELS.map((level) => (
              <Pressable
                key={level}
                onPress={() => onSetCrackLevel(level)}
                style={styles.devStageButton}>
                <Text style={styles.devStageButtonText}>C{level}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => runImpactTest(onBreak)}
              style={[styles.devStageButton, styles.devBreakButton]}>
              <Text style={styles.devBreakButtonText}>BREAK</Text>
            </Pressable>
            <Pressable
              onPress={onReset}
              style={[styles.devStageButton, styles.devResetCompact]}>
              <Text style={styles.devResetCompactText}>R</Text>
            </Pressable>
          </View>

          <View style={[styles.devButtonRow, styles.devLastButtonRow]}>
            {HATCH_BUTTONS.map(({ label, creature }) => (
              <Pressable
                key={label}
                onPress={() => runImpactTest(() => onHatch(creature))}
                style={styles.devHatchButton}>
                <Text style={styles.devHatchButtonText}>{label}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => runImpactTest(onOpenDropSimulator)}
              style={[styles.devHatchButton, styles.devSimulatorButton]}>
              <Text style={styles.devSimulatorButtonText}>SIM</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable onPress={() => setExpanded(true)} style={styles.devToggleButton}>
          <Text style={styles.devToggleText}>TEST</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  devTools: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    zIndex: 200,
    alignItems: 'flex-end',
  },
  devToggleButton: {
    height: 38,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: 'rgba(73,60,50,0.88)',
  },
  devToggleText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: '#FFFFFF',
  },
  devCompactPanel: {
    width: 250,
    padding: 9,
    borderRadius: 16,
    backgroundColor: 'rgba(238,229,218,0.96)',
    borderWidth: 1,
    borderColor: '#DACABD',
  },
  devPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  devPanelTitle: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: '#917C6B',
  },
  devCloseButton: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#DED1C5',
  },
  devCloseText: { marginTop: -2, fontSize: 18, fontWeight: '700', color: '#665448' },
  devButtonRow: { flexDirection: 'row', gap: 5, marginBottom: 5 },
  devLastButtonRow: { marginBottom: 0 },
  devHitButton: {
    flex: 1,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: '#FFF9F1',
    borderWidth: 1,
    borderColor: '#DECEC0',
  },
  devHitButtonText: { fontSize: 8, fontWeight: '900', color: '#665448' },
  devExactButton: { backgroundColor: '#FFE4A3', borderColor: '#E8B954' },
  devStageButton: {
    flex: 1,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#FFF9F1',
    borderWidth: 1,
    borderColor: '#DECEC0',
  },
  devStageButtonText: { fontSize: 8, fontWeight: '900', color: '#665448' },
  devBreakButton: { flex: 1.5, backgroundColor: '#D97A72', borderColor: '#C7635B' },
  devBreakButtonText: { fontSize: 7, fontWeight: '900', color: '#FFFFFF' },
  devResetCompact: { backgroundColor: '#493C32', borderColor: '#493C32' },
  devResetCompactText: { fontSize: 9, fontWeight: '900', color: '#FFFFFF' },
  devHatchButton: {
    flex: 1,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#F4E9D8',
    borderWidth: 1,
    borderColor: '#D8C2A8',
  },
  devHatchButtonText: { fontSize: 8, fontWeight: '900', color: '#7A604A' },
  devSimulatorButton: { backgroundColor: '#493C32', borderColor: '#493C32' },
  devSimulatorButtonText: { fontSize: 7, fontWeight: '900', color: '#FFFFFF' },
});
