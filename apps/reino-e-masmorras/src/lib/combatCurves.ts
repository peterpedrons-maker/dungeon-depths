export const DEF_EFFECTIVENESS = 0.55;
export const MAX_MITIGATION_PCT = 0.70;

export function hpDifficultyMultiplier(difficulty: number): number { return Math.pow(Math.max(0.01, difficulty), 1.00); }
export function atkDifficultyMultiplier(difficulty: number): number { return Math.pow(Math.max(0.01, difficulty), 0.82); }
export function defDifficultyMultiplier(difficulty: number): number { return Math.pow(Math.max(0.01, difficulty), 0.62); }
export function depthGrowthMultiplier(depth: number, channel: 'hp' | 'atk' | 'def'): number {
  const rate = channel === 'hp' ? 0.06 : channel === 'atk' ? 0.045 : 0.04;
  return 1 + Math.max(0, depth) * rate;
}
