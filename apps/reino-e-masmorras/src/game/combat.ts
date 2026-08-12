import { BASE_CRIT_DMG_MULT } from '../lib/combatStats';

export interface AttackResult {
  dmg: number;
  crit: boolean;
}

// Shared damage formula for both the player and enemies: defense blunts half
// its value off the raw attack, then a little randomness and a (possibly
// talent-boosted) crit multiplier.
export function rollAttack(atk: number, def: number, critChance: number, critDmgMult = BASE_CRIT_DMG_MULT): AttackResult {
  const base = Math.max(1, atk - def * 0.5);
  const variance = base * (0.85 + Math.random() * 0.3);
  const crit = Math.random() < critChance;
  const dmg = Math.round(variance * (crit ? critDmgMult : 1));
  return { dmg: Math.max(1, dmg), crit };
}

// A big-hit / guaranteed-crit / bonus-vs-status active ability still goes
// through the same roll — it's just a damage multiplier layered on, with an
// optional forced crit (guaranteedCrit) instead of the normal crit roll.
export function rollAbilityHit(
  atk: number, def: number, dmgMult: number, critChance: number, critDmgMult: number, forceCrit = false,
): AttackResult {
  const base = Math.max(1, atk - def * 0.5);
  const variance = base * (0.85 + Math.random() * 0.3) * dmgMult;
  const crit = forceCrit || Math.random() < critChance;
  const dmg = Math.round(variance * (crit ? critDmgMult : 1));
  return { dmg: Math.max(1, dmg), crit };
}
