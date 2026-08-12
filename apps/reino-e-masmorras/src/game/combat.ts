export interface AttackResult {
  dmg: number;
  crit: boolean;
}

// Shared damage formula for both the player and enemies: defense blunts half
// its value off the raw attack, then a little randomness and crit multiplier.
export function rollAttack(atk: number, def: number, critChance: number): AttackResult {
  const base = Math.max(1, atk - def * 0.5);
  const variance = base * (0.85 + Math.random() * 0.3);
  const crit = Math.random() < critChance;
  const dmg = Math.round(variance * (crit ? 1.6 : 1));
  return { dmg: Math.max(1, dmg), crit };
}
