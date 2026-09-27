export type GamePhase =
  | 'ready'
  | 'countdown'
  | 'go'
  | 'hold'
  | 'running'
  | 'impact'
  | 'result'
  | 'eggBroken';

export type Grade = 'PERFECT' | 'EXCELLENT' | 'GREAT' | 'GOOD' | 'MISS';

export type CrackLevel = 0 | 1 | 2 | 3 | 4;
