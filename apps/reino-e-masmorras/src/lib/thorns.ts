export const THORNS_ENEMY_MAX_HP_CAP = 0.04;

/** Damage from one landed direct hit before block/barrier absorption. */
export function thornsDamageForHit(baseDamage: number, thornsPct: number): number {
  if (baseDamage <= 0 || thornsPct <= 0) return 0;
  return Math.max(1, Math.round(baseDamage * thornsPct));
}

/** Caps the sum of all reflected hits from one enemy action. */
export function capThornsForAction(reflectedDamage: number, enemyMaxHp: number): number {
  if (reflectedDamage <= 0 || enemyMaxHp <= 0) return 0;
  return Math.min(reflectedDamage, Math.max(0, Math.round(enemyMaxHp * THORNS_ENEMY_MAX_HP_CAP)));
}

export function thornsDamageForAction(baseDamages: number[], thornsPct: number, enemyMaxHp: number): number {
  return capThornsForAction(baseDamages.reduce((sum, base) => sum + thornsDamageForHit(base, thornsPct), 0), enemyMaxHp);
}
