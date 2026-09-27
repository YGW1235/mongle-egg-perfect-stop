import type { CreatureRarity } from '@/game/collection/types';

export type HatchRevealImpact = 'none' | 'medium' | 'heavy';

export type HatchRarityStyle = {
  glowColor: string;
  glowShadowColor: string;
  glowPeakOpacity: number;
  glowRestOpacity: number;
  glowPeakScale: number;
  glowPulse: boolean;
  shockwaveColor: string;
  sparkleColor: string;
  sparkleCount: number;
  sparkleDistanceMultiplier: number;
  flashColor: string;
  breakFlashOpacity: number;
  revealFlashOpacity: number;
  revealDelayMs: number;
  creatureOvershootScale: number;
  revealImpact: HatchRevealImpact;
};

export const HATCH_RARITY_STYLES: Record<CreatureRarity, HatchRarityStyle> = {
  COMMON: {
    glowColor: '#FFD978',
    glowShadowColor: '#F0A84A',
    glowPeakOpacity: 0.78,
    glowRestOpacity: 0.38,
    glowPeakScale: 1.3,
    glowPulse: false,
    shockwaveColor: '#FFD277',
    sparkleColor: '#F0A84A',
    sparkleCount: 6,
    sparkleDistanceMultiplier: 1,
    flashColor: '#FFF5D8',
    breakFlashOpacity: 0.88,
    revealFlashOpacity: 0,
    revealDelayMs: 0,
    creatureOvershootScale: 1.1,
    revealImpact: 'none',
  },
  UNCOMMON: {
    glowColor: '#B7DEB5',
    glowShadowColor: '#82BD91',
    glowPeakOpacity: 0.84,
    glowRestOpacity: 0.43,
    glowPeakScale: 1.36,
    glowPulse: false,
    shockwaveColor: '#A8D5A8',
    sparkleColor: '#72AD80',
    sparkleCount: 7,
    sparkleDistanceMultiplier: 1.05,
    flashColor: '#F6F8E8',
    breakFlashOpacity: 0.89,
    revealFlashOpacity: 0.06,
    revealDelayMs: 0,
    creatureOvershootScale: 1.11,
    revealImpact: 'none',
  },
  RARE: {
    glowColor: '#A9D8F0',
    glowShadowColor: '#75B6DB',
    glowPeakOpacity: 0.9,
    glowRestOpacity: 0.48,
    glowPeakScale: 1.44,
    glowPulse: true,
    shockwaveColor: '#91C9E8',
    sparkleColor: '#6EAED4',
    sparkleCount: 8,
    sparkleDistanceMultiplier: 1.12,
    flashColor: '#EFF9FC',
    breakFlashOpacity: 0.91,
    revealFlashOpacity: 0.18,
    revealDelayMs: 0,
    creatureOvershootScale: 1.13,
    revealImpact: 'medium',
  },
  EPIC: {
    glowColor: '#C6B3E8',
    glowShadowColor: '#9D82CF',
    glowPeakOpacity: 0.95,
    glowRestOpacity: 0.53,
    glowPeakScale: 1.52,
    glowPulse: true,
    shockwaveColor: '#B59DDD',
    sparkleColor: '#9275C4',
    sparkleCount: 9,
    sparkleDistanceMultiplier: 1.18,
    flashColor: '#F7F0FC',
    breakFlashOpacity: 0.94,
    revealFlashOpacity: 0.3,
    revealDelayMs: 70,
    creatureOvershootScale: 1.15,
    revealImpact: 'heavy',
  },
  LEGENDARY: {
    glowColor: '#FFD67A',
    glowShadowColor: '#EAA83D',
    glowPeakOpacity: 1,
    glowRestOpacity: 0.58,
    glowPeakScale: 1.62,
    glowPulse: true,
    shockwaveColor: '#F2BD52',
    sparkleColor: '#E3A52F',
    sparkleCount: 10,
    sparkleDistanceMultiplier: 1.25,
    flashColor: '#FFF6D8',
    breakFlashOpacity: 1,
    revealFlashOpacity: 0.52,
    revealDelayMs: 200,
    creatureOvershootScale: 1.18,
    revealImpact: 'heavy',
  },
  SECRET: {
    glowColor: '#FFD67A',
    glowShadowColor: '#EAA83D',
    glowPeakOpacity: 1,
    glowRestOpacity: 0.58,
    glowPeakScale: 1.62,
    glowPulse: true,
    shockwaveColor: '#F2BD52',
    sparkleColor: '#E3A52F',
    sparkleCount: 10,
    sparkleDistanceMultiplier: 1.25,
    flashColor: '#FFF6D8',
    breakFlashOpacity: 1,
    revealFlashOpacity: 0.52,
    revealDelayMs: 200,
    creatureOvershootScale: 1.18,
    revealImpact: 'heavy',
  },
};

