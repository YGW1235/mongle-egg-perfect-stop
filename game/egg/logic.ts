import { HARD_MODE_BONUS_MAX, HARD_MODE_BONUS_MIN } from './constants';
import { CrackLevel, Grade } from './types';

export function randomTargetDuration(): number {
  return Math.round(1800 + Math.random() * 1400);
}

export function rollHardModeBonus(randomValue = Math.random()): number {
  const clampedRandomValue = Math.min(
    Math.max(randomValue, 0),
    1 - Number.EPSILON
  );
  return (
    Math.floor(
      clampedRandomValue * (HARD_MODE_BONUS_MAX - HARD_MODE_BONUS_MIN + 1)
    ) + HARD_MODE_BONUS_MIN
  );
}

export function getGrade(errorMs: number): Grade {
  if (errorMs <= 10) return 'PERFECT';
  if (errorMs <= 30) return 'EXCELLENT';
  if (errorMs <= 80) return 'GREAT';
  if (errorMs <= 150) return 'GOOD';
  return 'MISS';
}

export function getGradeColor(grade: Grade): string {
  switch (grade) {
    case 'PERFECT':
      return '#F6B73C';
    case 'EXCELLENT':
      return '#E8A93A';
    case 'GREAT':
      return '#62B38B';
    case 'GOOD':
      return '#74A8D8';
    case 'MISS':
      return '#D97A72';
  }
}

export function getImpactPower(grade: Grade): number {
  switch (grade) {
    case 'PERFECT':
      return 1;
    case 'EXCELLENT':
      return 0.85;
    case 'GREAT':
      return 0.65;
    case 'GOOD':
      return 0.45;
    case 'MISS':
      return 0.2;
  }
}

export function getCrackLevel(hp: number, maxHp: number): CrackLevel {
  const ratio = hp / maxHp;

  if (ratio <= 0) return 4;
  if (ratio <= 0.25) return 3;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 1;
  return 0;
}
