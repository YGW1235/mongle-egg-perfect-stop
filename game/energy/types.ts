export type HitEnergyState = {
  hits: number;
  recoveryAnchorAt: string | null;
};

export type ConsumeHitEnergyResult = {
  consumed: boolean;
  state: HitEnergyState;
};

export type GrantHitEnergyResult = {
  granted: boolean;
  state: HitEnergyState;
};
