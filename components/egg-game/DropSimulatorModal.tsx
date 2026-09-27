import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  CREATURES,
  RARITY_COLORS,
  TOTAL_COLLECTION_COUNT,
} from '@/game/collection/creatures';
import { CREAM_EGG_RARITY_WEIGHTS } from '@/game/egg/drop';
import {
  DROP_COMPARISON_SEED,
  DROP_SIMULATION_POLICIES,
  createSeededRandom,
  getCreamEggCreatureExpectedPercentage,
  simulateCollectionCompletion,
  simulateCompletionPolicyComparison,
  simulateCreamEggDrops,
  type CompletionPolicyComparison,
  type CompletionSimulationResult,
  type DropSimulationResult,
  type DropSimulationPolicy,
} from '@/game/egg/dropSimulator';

type DropSimulatorModalProps = {
  visible: boolean;
  onClose: () => void;
};

const DROP_ITERATIONS = [100, 1_000, 10_000, 100_000] as const;
const COMPLETION_TRIALS = [1_000, 10_000] as const;
const POLICY_LABELS: Record<DropSimulationPolicy, string> = {
  BASELINE: 'BASE',
  LEGENDARY_PROTECTION: 'LEG PROTECT',
  RARITY_NEW_BOOST: 'NEW BOOST 50%',
};

function formatCount(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function DropSimulatorModal({ visible, onClose }: DropSimulatorModalProps) {
  const [dropResult, setDropResult] = useState<DropSimulationResult | null>(null);
  const [completionResult, setCompletionResult] =
    useState<CompletionSimulationResult | null>(null);
  const [comparisonResult, setComparisonResult] =
    useState<CompletionPolicyComparison | null>(null);
  const [selectedPolicy, setSelectedPolicy] =
    useState<DropSimulationPolicy>('BASELINE');
  const [running, setRunning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const taskTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runningRef = useRef(false);

  useEffect(
    () => () => {
      if (taskTimeoutRef.current !== null) clearTimeout(taskTimeoutRef.current);
      runningRef.current = false;
    },
    []
  );

  if (!__DEV__) return null;

  const runTask = (task: () => void) => {
    if (runningRef.current) return;
    runningRef.current = true;
    setRunning(true);
    setErrorMessage(null);
    taskTimeoutRef.current = setTimeout(() => {
      try {
        task();
      } catch (error: unknown) {
        setErrorMessage(error instanceof Error ? error.message : 'Simulation failed.');
      } finally {
        runningRef.current = false;
        setRunning(false);
        taskTimeoutRef.current = null;
      }
    }, 0);
  };

  const runDropSimulation = (iterations: number) => {
    runTask(() => setDropResult(simulateCreamEggDrops(iterations)));
  };

  const runCompletionSimulation = (trials: number) => {
    runTask(() =>
      setCompletionResult(
        simulateCollectionCompletion(trials, {
          policy: selectedPolicy,
          random: createSeededRandom(DROP_COMPARISON_SEED),
        })
      )
    );
  };

  const runPolicyComparison = () => {
    runTask(() =>
      setComparisonResult(simulateCompletionPolicyComparison(10_000))
    );
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={running ? undefined : onClose}
      transparent
      visible={visible}>
      <SafeAreaView style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>DEV TOOL</Text>
              <Text style={styles.title}>DROP BALANCE</Text>
            </View>
            <Pressable disabled={running} onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.buttonRow}>
              {DROP_ITERATIONS.map((iterations) => (
                <Pressable
                  disabled={running}
                  key={iterations}
                  onPress={() => runDropSimulation(iterations)}
                  style={[styles.actionButton, running && styles.disabledButton]}>
                  <Text style={styles.actionButtonText}>
                    {iterations >= 1_000 ? `${iterations / 1_000}K` : iterations}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.controlLabel}>POLICY</Text>
            <View style={styles.policyRow}>
              {DROP_SIMULATION_POLICIES.map((policy) => (
                <Pressable
                  disabled={running}
                  key={policy}
                  onPress={() => setSelectedPolicy(policy)}
                  style={[
                    styles.policyButton,
                    selectedPolicy === policy && styles.policyButtonSelected,
                    running && styles.disabledButton,
                  ]}>
                  <Text
                    style={[
                      styles.policyButtonText,
                      selectedPolicy === policy && styles.policyButtonTextSelected,
                    ]}>
                    {POLICY_LABELS[policy]}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.controlLabel}>COMPLETION</Text>
            <View style={styles.buttonRow}>
              {COMPLETION_TRIALS.map((trials) => (
                <Pressable
                  disabled={running}
                  key={trials}
                  onPress={() => runCompletionSimulation(trials)}
                  style={[styles.completionButton, running && styles.disabledButton]}>
                  <Text style={styles.completionButtonText}>
                    {trials / 1_000}K
                  </Text>
                </Pressable>
              ))}
              <Pressable
                disabled={running}
                onPress={runPolicyComparison}
                style={[styles.compareButton, running && styles.disabledButton]}>
                <Text style={styles.compareButtonText}>
                  {running ? 'RUNNING…' : 'COMPARE 10K'}
                </Text>
              </Pressable>
            </View>

            {errorMessage !== null ? <Text style={styles.error}>{errorMessage}</Text> : null}

            {dropResult !== null ? (
              <>
                <Text style={styles.sectionTitle}>
                  LAST SIMULATION · {dropResult.iterations.toLocaleString()}
                </Text>
                <Text style={styles.uniqueText}>
                  Unique: {dropResult.uniqueCount} / {TOTAL_COLLECTION_COUNT}
                </Text>

                {CREAM_EGG_RARITY_WEIGHTS.map(({ rarity, weight }) => {
                  const count = dropResult.rarityCounts[rarity];
                  const percentage = (count / dropResult.iterations) * 100;
                  const difference = percentage - weight;
                  return (
                    <View key={rarity} style={styles.resultRow}>
                      <Text style={[styles.rarityName, { color: RARITY_COLORS[rarity] }]}>
                        {rarity}
                      </Text>
                      <View style={styles.resultValues}>
                        <Text style={styles.resultPrimary}>
                          {count.toLocaleString()} · {formatPercentage(percentage)}
                        </Text>
                        <Text style={styles.resultSecondary}>
                          expected {formatPercentage(weight)} · {difference >= 0 ? '+' : ''}
                          {formatPercentage(difference)}
                        </Text>
                      </View>
                    </View>
                  );
                })}

                <Text style={styles.sectionTitle}>CREATURE RESULTS</Text>
                {CREATURES.map((creature) => {
                  const count = dropResult.creatureCounts[creature.id];
                  const percentage = (count / dropResult.iterations) * 100;
                  const expected = getCreamEggCreatureExpectedPercentage(creature);
                  return (
                    <View key={creature.id} style={styles.creatureRow}>
                      <View style={styles.creatureIdentity}>
                        <Text style={styles.collectionNumber}>
                          #{String(creature.collectionNumber).padStart(3, '0')}
                        </Text>
                        <Text numberOfLines={1} style={styles.creatureName}>
                          {creature.name}
                        </Text>
                      </View>
                      <View style={styles.creatureValues}>
                        <Text style={styles.resultPrimary}>
                          {count.toLocaleString()} / {dropResult.iterations.toLocaleString()}
                        </Text>
                        <Text style={styles.resultSecondary}>
                          {formatPercentage(percentage)} · expected {formatPercentage(expected)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </>
            ) : null}

            {completionResult !== null ? (
              <>
                <Text style={styles.sectionTitle}>
                  {POLICY_LABELS[completionResult.policy]} ·{' '}
                  {completionResult.trials.toLocaleString()} TRIALS · SEED 20260828
                </Text>
                <View style={styles.metricGrid}>
                  {[
                    ['AVERAGE', completionResult.averageEggs],
                    ['MEDIAN', completionResult.medianEggs],
                    ['P75', completionResult.p75Eggs],
                    ['P90', completionResult.p90Eggs],
                    ['P95', completionResult.p95Eggs],
                    ['P99', completionResult.p99Eggs],
                    ['MIN', completionResult.minEggs],
                    ['MAX', completionResult.maxEggs],
                  ].map(([label, value]) => (
                    <View key={label} style={styles.metricCard}>
                      <Text style={styles.metricLabel}>{label}</Text>
                      <Text style={styles.metricValue}>{formatCount(value as number)}</Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.analysisTitle}>DUPLICATES BEFORE COMPLETION</Text>
                <Text style={styles.analysisText}>
                  Average {formatCount(completionResult.duplicateStats.average)} · Median{' '}
                  {formatCount(completionResult.duplicateStats.median)} · P95{' '}
                  {formatCount(completionResult.duplicateStats.p95)}
                </Text>

                <Text style={styles.analysisTitle}>LEGENDARY ACQUISITION</Text>
                <Text style={styles.analysisText}>
                  First · Avg {formatCount(completionResult.firstLegendaryStats.average)} · Med{' '}
                  {formatCount(completionResult.firstLegendaryStats.median)} · P90{' '}
                  {formatCount(completionResult.firstLegendaryStats.p90)} · P95{' '}
                  {formatCount(completionResult.firstLegendaryStats.p95)}
                </Text>
                <Text style={styles.analysisText}>
                  Pair · Avg {formatCount(completionResult.legendaryPairStats.average)} · Med{' '}
                  {formatCount(completionResult.legendaryPairStats.median)} · P90{' '}
                  {formatCount(completionResult.legendaryPairStats.p90)} · P95{' '}
                  {formatCount(completionResult.legendaryPairStats.p95)}
                </Text>

                <Text style={styles.analysisTitle}>LAST MISSING RARITY</Text>
                {CREAM_EGG_RARITY_WEIGHTS.map(({ rarity }) => (
                  <View key={rarity} style={styles.compactResultRow}>
                    <Text style={[styles.compactLabel, { color: RARITY_COLORS[rarity] }]}>
                      {rarity}
                    </Text>
                    <Text style={styles.analysisText}>
                      {formatPercentage(
                        (completionResult.lastMissingRarityCounts[rarity] /
                          completionResult.trials) *
                          100
                      )}
                    </Text>
                  </View>
                ))}

                <Text style={styles.analysisTitle}>LAST CREATURE · TOP 5</Text>
                {CREATURES.map((creature) => ({
                  creature,
                  count: completionResult.lastCreatureCounts[creature.id],
                }))
                  .sort((left, right) => right.count - left.count)
                  .slice(0, 5)
                  .map(({ creature, count }) => (
                    <View key={creature.id} style={styles.compactResultRow}>
                      <Text style={styles.compactLabel}>{creature.name}</Text>
                      <Text style={styles.analysisText}>
                        {formatPercentage((count / completionResult.trials) * 100)}
                      </Text>
                    </View>
                  ))}
              </>
            ) : null}

            {comparisonResult !== null ? (
              <>
                <Text style={styles.sectionTitle}>POLICY COMPARISON · 10K · SEED 20260828</Text>
                <View style={styles.comparisonHeader}>
                  <Text style={styles.comparisonMetricLabel}>METRIC</Text>
                  {DROP_SIMULATION_POLICIES.map((policy) => (
                    <Text key={policy} style={styles.comparisonValue}>
                      {POLICY_LABELS[policy].replace(' PROTECT', '').replace(' 50%', '')}
                    </Text>
                  ))}
                </View>
                {[
                  ['AVERAGE', 'averageEggs'],
                  ['MEDIAN', 'medianEggs'],
                  ['P75', 'p75Eggs'],
                  ['P90', 'p90Eggs'],
                  ['P95', 'p95Eggs'],
                  ['P99', 'p99Eggs'],
                ].map(([label, key]) => (
                  <View key={label} style={styles.comparisonRow}>
                    <Text style={styles.comparisonMetricLabel}>{label}</Text>
                    {DROP_SIMULATION_POLICIES.map((policy) => (
                      <Text key={policy} style={styles.comparisonValue}>
                        {formatCount(
                          comparisonResult[policy][
                            key as keyof Pick<
                              CompletionSimulationResult,
                              | 'averageEggs'
                              | 'medianEggs'
                              | 'p75Eggs'
                              | 'p90Eggs'
                              | 'p95Eggs'
                              | 'p99Eggs'
                            >
                          ]
                        )}
                      </Text>
                    ))}
                  </View>
                ))}
              </>
            ) : null}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: 'rgba(42,32,25,0.72)',
  },
  card: {
    maxHeight: '94%',
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#F8F3EA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E3D7CA',
  },
  eyebrow: { fontSize: 8, fontWeight: '900', letterSpacing: 1.6, color: '#AD927D' },
  title: { marginTop: 2, fontSize: 18, fontWeight: '900', color: '#493C32' },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8DDD2',
  },
  closeText: { marginTop: -2, fontSize: 22, fontWeight: '700', color: '#665448' },
  content: { padding: 16, paddingBottom: 28 },
  buttonRow: { flexDirection: 'row', gap: 7 },
  actionButton: {
    flex: 1,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#493C32',
  },
  actionButtonText: { fontSize: 11, fontWeight: '900', color: '#FFFFFF' },
  controlLabel: {
    marginTop: 12,
    marginBottom: 6,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: '#9A826F',
  },
  policyRow: { flexDirection: 'row', gap: 6 },
  policyButton: {
    flex: 1,
    minHeight: 38,
    paddingHorizontal: 4,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D9C9BA',
    backgroundColor: '#FFF9F1',
  },
  policyButtonSelected: { borderColor: '#493C32', backgroundColor: '#493C32' },
  policyButtonText: { fontSize: 7, fontWeight: '900', color: '#755F50' },
  policyButtonTextSelected: { color: '#FFFFFF' },
  completionButton: {
    flex: 0.7,
    height: 42,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D9A441',
  },
  completionButtonText: { fontSize: 11, fontWeight: '900', color: '#493512' },
  compareButton: {
    flex: 1.6,
    height: 42,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B8675F',
  },
  compareButtonText: { fontSize: 9, fontWeight: '900', color: '#FFFFFF' },
  disabledButton: { opacity: 0.45 },
  error: { marginTop: 12, fontSize: 11, fontWeight: '700', color: '#B34F47' },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 8,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: '#917C6B',
  },
  uniqueText: { marginBottom: 8, fontSize: 14, fontWeight: '900', color: '#493C32' },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 46,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DED2C5',
  },
  rarityName: { width: 94, fontSize: 11, fontWeight: '900' },
  resultValues: { flex: 1, alignItems: 'flex-end' },
  resultPrimary: { fontSize: 11, fontWeight: '800', color: '#493C32' },
  resultSecondary: { marginTop: 2, fontSize: 9, color: '#8B7665' },
  creatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DED2C5',
  },
  creatureIdentity: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  collectionNumber: { width: 38, fontSize: 9, fontWeight: '800', color: '#AD927D' },
  creatureName: { flex: 1, fontSize: 11, fontWeight: '800', color: '#5D4B3E' },
  creatureValues: { alignItems: 'flex-end' },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metricCard: {
    width: '31%',
    minWidth: 84,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#EEE4D9',
  },
  metricLabel: { fontSize: 8, fontWeight: '900', color: '#9A826F' },
  metricValue: { marginTop: 4, fontSize: 16, fontWeight: '900', color: '#493C32' },
  analysisTitle: {
    marginTop: 16,
    marginBottom: 5,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    color: '#9A826F',
  },
  analysisText: { fontSize: 9, lineHeight: 15, color: '#6F5B4D' },
  compactResultRow: {
    minHeight: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DED2C5',
  },
  compactLabel: { fontSize: 9, fontWeight: '800', color: '#5D4B3E' },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#CDBBAB',
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 32,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DED2C5',
  },
  comparisonMetricLabel: {
    width: 72,
    fontSize: 8,
    fontWeight: '900',
    color: '#7A6555',
  },
  comparisonValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 8,
    fontWeight: '800',
    color: '#493C32',
  },
});
