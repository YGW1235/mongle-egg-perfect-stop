import type { ImageSourcePropType } from 'react-native';

export type CreatureRarity =
  | 'COMMON'
  | 'UNCOMMON'
  | 'RARE'
  | 'EPIC'
  | 'LEGENDARY'
  | 'SECRET';

export type CreatureDefinition = {
  collectionNumber: number;
  id: string;
  name: string;
  rarity: CreatureRarity;
  description: string;
  image: ImageSourcePropType;
  thumbnail: ImageSourcePropType;
};

export type CollectedCreature = {
  creatureId: string;
  count: number;
  firstDiscoveredAt: string;
  lastAppliedRewardId?: string;
};

export type CollectionData = Record<string, CollectedCreature>;
