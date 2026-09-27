import { getCreaturesByRarity } from '@/game/collection/creatures';
import type { CreatureDefinition, CreatureRarity } from '@/game/collection/types';

export type CreamEggRarity = Exclude<CreatureRarity, 'SECRET'>;

export type RarityDropEntry = {
  rarity: CreamEggRarity;
  weight: number;
};

export const CREAM_EGG_RARITY_WEIGHTS: readonly RarityDropEntry[] = [
  { rarity: 'COMMON', weight: 60 },
  { rarity: 'UNCOMMON', weight: 20 },
  { rarity: 'RARE', weight: 12 },
  { rarity: 'EPIC', weight: 6 },
  { rarity: 'LEGENDARY', weight: 2 },
];

const TOTAL_RARITY_WEIGHT = CREAM_EGG_RARITY_WEIGHTS.reduce(
  (total, entry) => total + entry.weight,
  0
);

export function rollCreamEggRarity(randomValue = Math.random()): CreamEggRarity {
  const normalizedRandom = Math.min(Math.max(randomValue, 0), 1 - Number.EPSILON);
  const roll = normalizedRandom * TOTAL_RARITY_WEIGHT;
  let cumulativeWeight = 0;

  for (const entry of CREAM_EGG_RARITY_WEIGHTS) {
    cumulativeWeight += entry.weight;
    if (roll < cumulativeWeight) return entry.rarity;
  }

  throw new Error('Cream Egg rarity weights must cover the full roll range.');
}

export function selectCreatureFromRarity(
  rarity: CreamEggRarity,
  randomValue = Math.random()
): CreatureDefinition {
  const pool = getCreaturesByRarity(rarity);
  if (pool.length === 0) throw new Error(`No creatures registered for rarity: ${rarity}`);

  const normalizedRandom = Math.min(Math.max(randomValue, 0), 1 - Number.EPSILON);
  return pool[Math.floor(normalizedRandom * pool.length)];
}

export function selectCreatureFromRarityWithLegendaryProtection(
  rarity: CreamEggRarity,
  collectedCreatureIds: ReadonlySet<string>,
  randomValue = Math.random()
): CreatureDefinition {
  if (rarity !== 'LEGENDARY') {
    return selectCreatureFromRarity(rarity, randomValue);
  }

  const legendaryPool = getCreaturesByRarity('LEGENDARY');
  const uncollectedLegendary = legendaryPool.filter(
    (creature) => !collectedCreatureIds.has(creature.id)
  );
  if (uncollectedLegendary.length === 1) return uncollectedLegendary[0];

  return selectCreatureFromRarity(rarity, randomValue);
}

export function rollCreamEggCreature(
  rarityRandomValue = Math.random(),
  creatureRandomValue = Math.random()
): CreatureDefinition {
  return selectCreatureFromRarity(
    rollCreamEggRarity(rarityRandomValue),
    creatureRandomValue
  );
}

export function rollCreamEggCreatureWithLegendaryProtection(
  collectedCreatureIds: ReadonlySet<string>,
  rarityRandomValue = Math.random(),
  creatureRandomValue = Math.random()
): CreatureDefinition {
  const rarity = rollCreamEggRarity(rarityRandomValue);
  return selectCreatureFromRarityWithLegendaryProtection(
    rarity,
    collectedCreatureIds,
    creatureRandomValue
  );
}

function validateCreamEggDropConfig(): void {
  const expectedPoolSizes: Record<CreamEggRarity, number> = {
    COMMON: 10,
    UNCOMMON: 8,
    RARE: 6,
    EPIC: 4,
    LEGENDARY: 2,
  };

  if (TOTAL_RARITY_WEIGHT !== 100) {
    throw new Error(`Cream Egg rarity weights must total 100: ${TOTAL_RARITY_WEIGHT}`);
  }

  CREAM_EGG_RARITY_WEIGHTS.forEach(({ rarity }) => {
    const poolSize = getCreaturesByRarity(rarity).length;
    if (poolSize !== expectedPoolSizes[rarity]) {
      throw new Error(`Unexpected ${rarity} creature pool size: ${poolSize}`);
    }
  });

  if (getCreaturesByRarity('SECRET').length > 0) {
    throw new Error('SECRET creatures cannot be included in the Cream Egg registry.');
  }
}

if (__DEV__) validateCreamEggDropConfig();
