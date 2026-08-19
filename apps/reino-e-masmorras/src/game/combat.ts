import { BASE_CRIT_DMG_MULT } from '../lib/combatStats';

export interface AttackResult {
  dmg: number;
  crit: boolean;
}

// Defense used to blunt damage with no ceiling — `atk - def*0.5` — which
// meant a build that stacked def hard (a tank's own gear + attribute curve
// pushes this fast) could push incoming damage down to the 1-floor against
// anything whose atk wasn't already far ahead of that def, while the exact
// same fixed subtraction barely dents a glass-cannon's own attack against a
// lightly-armored target. Capping how much of atk def is allowed to eat
// keeps a heavy investment in defense meaningful (it still cuts a large
// share of every hit) without letting it flatten incoming damage to
// nothing — some of a hit always gets through, on both sides of the fight.
const MAX_MITIGATION_PCT = 0.65;

function mitigatedBase(atk: number, def: number): number {
  const mitigation = Math.min(def * 0.5, atk * MAX_MITIGATION_PCT);
  return Math.max(1, atk - mitigation);
}

// Shared damage formula for both the player and enemies: defense blunts a
// share of it (capped, see mitigatedBase), then a little randomness and a
// (possibly talent-boosted) crit multiplier.
export function rollAttack(atk: number, def: number, critChance: number, critDmgMult = BASE_CRIT_DMG_MULT): AttackResult {
  const base = mitigatedBase(atk, def);
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
  const base = mitigatedBase(atk, def) * dmgMult;
  const variance = base * (0.85 + Math.random() * 0.3);
  const crit = forceCrit || Math.random() < critChance;
  const dmg = Math.round(variance * (crit ? critDmgMult : 1));
  return { dmg: Math.max(1, dmg), crit };
}
