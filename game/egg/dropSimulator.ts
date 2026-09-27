import {
  CREATURES,
  TOTAL_COLLECTION_COUNT,
  getCreaturesByRarity,
} from '@/game/collection/creatures';
import type { CreatureDefinition } from '@/game/collection/types';

import {
  CREAM_EGG_RARITY_WEIGHTS,
  rollCreamEggCreature,
  rollCreamEggRarity,
  selectCreatureFromRarity,
  selectCreatureFromRarityWithLegendaryProtection,
  type CreamEggRarity,
} from './drop';

export type DropSimulationPolicy =
  | 'BASELINE'
  | 'LEGENDARY_PROTECTION'
  | 'RARITY_NEW_BOOST';

export const DROP_SIMULATION_POLICIES: readonly DropSimulationPolicy[] = [
  'BASELINE',
  'LEGENDARY_PROTECTION',
  'RARITY_NEW_BOOST',
];

export const RARITY_NEW_BOOST_CHANCE = 0.5;
export const DROP_COMPARISON_SEED = 20_260_828;

export type DropSimulationResult = {
  iterations: number;
  rarityCounts: Record<CreamEggRarity, number>;
  creatureCounts: Record<string, number>;
  uniqueCount: number;
};

export type CompletionSimulationResult = {
  policy: DropSimulationPolicy;
  trials: number;
  averageEggs: number;
  medianEggs: number;
  p75Eggs: number;
  p90Eggs: number;
  p95Eggs: number;
  p99Eggs: number;
  minEggs: number;
  maxEggs: number;
  duplicateStats: CompletionMetricStats;
  lastMissingRarityCounts: Record<CreamEggRarity, number>;
  lastCreatureCounts: Record<string, number>;
  firstLegendaryStats: AcquisitionMetricStats;
  legendaryPairStats: AcquisitionMetricStats;
};

export type CompletionMetricStats = {
  average: number;
  median: number;
  p95: number;
};

export type AcquisitionMetricStats = {
  average: number;
  median: number;
  p90: number;
  p95: number;
};

export type CompletionSimulationOptions = {
  policy?: DropSimulationPolicy;
  random?: RandomSource;
  safetyLimit?: number;
  newBoostChance?: number;
};

export type CompletionPolicyComparison = Record<
  DropSimulationPolicy,
  CompletionSimulationResult
>;

export type RandomSource = () => number;

function createEmptyRarityCounts(): Record<CreamEggRarity, number> {
  return {
    COMMON: 0,
    UNCOMMON: 0,
    RARE: 0,
    EPIC: 0,
    LEGENDARY: 0,
  };
}

function assertPositiveInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer: ${value}`);
  }
}

function percentile(sortedValues: readonly number[], percentileValue: number): number {
  const index = Math.ceil(percentileValue * sortedValues.length) - 1;
  return sortedValues[Math.max(0, index)];
}

function average(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function median(sortedValues: readonly number[]): number {
  const midpoint = Math.floor(sortedValues.length / 2);
  return sortedValues.length % 2 === 0
    ? (sortedValues[midpoint - 1] + sortedValues[midpoint]) / 2
    : sortedValues[midpoint];
}

function createEmptyCreatureCounts(): Record<string, number> {
  return Object.fromEntries(CREATURES.map((creature) => [creature.id, 0])) as Record<
    string,
    number
  >;
}

function selectFromPool(
  pool: readonly CreatureDefinition[],
  randomValue: number
): CreatureDefinition {
  const normalizedRandom = Math.min(Math.max(randomValue, 0), 1 - Number.EPSILON);
  return pool[Math.floor(normalizedRandom * pool.length)];
}

export function createSeededRandom(seed: number): RandomSource {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function rollCreamEggCreatureForPolicy(
  policy: DropSimulationPolicy,
  seen: ReadonlySet<string>,
  random: RandomSource,
  newBoostChance = RARITY_NEW_BOOST_CHANCE
): CreatureDefinition {
  if (policy === 'BASELINE') return rollCreamEggCreature(random(), random());
  if (newBoostChance < 0 || newBoostChance > 1) {
    throw new Error(`New boost chance must be between 0 and 1: ${newBoostChance}`);
  }

  const rarity = rollCreamEggRarity(random());
  if (policy === 'LEGENDARY_PROTECTION') {
    return selectCreatureFromRarityWithLegendaryProtection(rarity, seen, random());
  }

  const rarityPool = getCreaturesByRarity(rarity);
  const unseenPool = rarityPool.filter((creature) => !seen.has(creature.id));

  if (policy === 'RARITY_NEW_BOOST' && unseenPool.length > 0) {
    const shouldBoost = random() < newBoostChance;
    return shouldBoost
      ? selectFromPool(unseenPool, random())
      : selectCreatureFromRarity(rarity, random());
  }

  return selectCreatureFromRarity(rarity, random());
}

export function getCreamEggCreatureExpectedPercentage(
  creature: CreatureDefinition
): number {
  const rarityEntry = CREAM_EGG_RARITY_WEIGHTS.find(
    ({ rarity }) => rarity === creature.rarity
  );
  const poolSize = getCreaturesByRarity(creature.rarity).length;
  if (rarityEntry === undefined || poolSize === 0) return 0;
  return rarityEntry.weight / poolSize;
}

export function simulateCreamEggDrops(
  iterations: number,
  random: RandomSource = Math.random
): DropSimulationResult {
  assertPositiveInteger(iterations, 'Drop simulation iterations');

  const rarityCounts = createEmptyRarityCounts();
  const creatureCounts = createEmptyCreatureCounts();

  for (let index = 0; index < iterations; index += 1) {
    const creature = rollCreamEggCreature(random(), random());
    rarityCounts[creature.rarity as CreamEggRarity] += 1;
    creatureCounts[creature.id] += 1;
  }

  return {
    iterations,
    rarityCounts,
    creatureCounts,
    uniqueCount: Object.values(creatureCounts).filter((count) => count > 0).length,
  };
}

export function simulateCollectionCompletion(
  trials: number,
  options: CompletionSimulationOptions = {}
): CompletionSimulationResult {
  const {
    policy = 'BASELINE',
    random = Math.random,
    safetyLimit = 100_000,
    newBoostChance = RARITY_NEW_BOOST_CHANCE,
  } = options;
  assertPositiveInteger(trials, 'Completion simulation trials');
  assertPositiveInteger(safetyLimit, 'Completion simulation safety limit');

  const eggsPerTrial: number[] = [];
  const duplicatesPerTrial: number[] = [];
  const firstLegendaryEggs: number[] = [];
  const legendaryPairEggs: number[] = [];
  const lastMissingRarityCounts = createEmptyRarityCounts();
  const lastCreatureCounts = createEmptyCreatureCounts();
  for (let trial = 0; trial < trials; trial += 1) {
    const seen = new Set<string>();
    const seenLegendary = new Set<string>();
    let eggs = 0;
    let firstLegendaryAt = 0;
    let legendaryPairAt = 0;
    let lastCreature: CreatureDefinition | null = null;

    while (seen.size < TOTAL_COLLECTION_COUNT && eggs < safetyLimit) {
      const creature = rollCreamEggCreatureForPolicy(
        policy,
        seen,
        random,
        newBoostChance
      );
      eggs += 1;
      if (creature.rarity === 'LEGENDARY') {
        if (firstLegendaryAt === 0) firstLegendaryAt = eggs;
        seenLegendary.add(creature.id);
        if (seenLegendary.size === 2 && legendaryPairAt === 0) legendaryPairAt = eggs;
      }
      if (!seen.has(creature.id)) lastCreature = creature;
      seen.add(creature.id);
    }

    if (seen.size < TOTAL_COLLECTION_COUNT) {
      throw new Error(`Completion simulation exceeded ${safetyLimit} eggs in trial ${trial + 1}.`);
    }
    eggsPerTrial.push(eggs);
    duplicatesPerTrial.push(eggs - TOTAL_COLLECTION_COUNT);
    firstLegendaryEggs.push(firstLegendaryAt);
    legendaryPairEggs.push(legendaryPairAt);
    if (lastCreature === null || lastCreature.rarity === 'SECRET') {
      throw new Error(`Completion simulation did not resolve a valid last creature in trial ${trial + 1}.`);
    }
    lastMissingRarityCounts[lastCreature.rarity] += 1;
    lastCreatureCounts[lastCreature.id] += 1;
  }

  eggsPerTrial.sort((left, right) => left - right);
  duplicatesPerTrial.sort((left, right) => left - right);
  firstLegendaryEggs.sort((left, right) => left - right);
  legendaryPairEggs.sort((left, right) => left - right);

  return {
    policy,
    trials,
    averageEggs: average(eggsPerTrial),
    medianEggs: median(eggsPerTrial),
    p75Eggs: percentile(eggsPerTrial, 0.75),
    p90Eggs: percentile(eggsPerTrial, 0.9),
    p95Eggs: percentile(eggsPerTrial, 0.95),
    p99Eggs: percentile(eggsPerTrial, 0.99),
    minEggs: eggsPerTrial[0],
    maxEggs: eggsPerTrial[eggsPerTrial.length - 1],
    duplicateStats: {
      average: average(duplicatesPerTrial),
      median: median(duplicatesPerTrial),
      p95: percentile(duplicatesPerTrial, 0.95),
    },
    lastMissingRarityCounts,
    lastCreatureCounts,
    firstLegendaryStats: {
      average: average(firstLegendaryEggs),
      median: median(firstLegendaryEggs),
      p90: percentile(firstLegendaryEggs, 0.9),
      p95: percentile(firstLegendaryEggs, 0.95),
    },
    legendaryPairStats: {
      average: average(legendaryPairEggs),
      median: median(legendaryPairEggs),
      p90: percentile(legendaryPairEggs, 0.9),
      p95: percentile(legendaryPairEggs, 0.95),
    },
  };
}

export function simulateCompletionPolicyComparison(
  trials: number,
  seed = DROP_COMPARISON_SEED
): CompletionPolicyComparison {
  return Object.fromEntries(
    DROP_SIMULATION_POLICIES.map((policy) => [
      policy,
      simulateCollectionCompletion(trials, {
        policy,
        random: createSeededRandom(seed),
      }),
    ])
  ) as CompletionPolicyComparison;
}
