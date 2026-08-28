/** Base de Cura universal: não inclui equipamento, VIT ou maxHpFlat. */
export const HEALING_BASE_PER_LEVEL = 10;
export function healingBaseHp(baseHp: number, level: number): number {
  return baseHp + HEALING_BASE_PER_LEVEL * Math.max(0, level - 1);
}
export function directHealAmount(baseHp: number, level: number, healPct: number, healingPowerPct: number, efficiencyPct = 0): number {
  return Math.round(healingBaseHp(baseHp, level) * healPct * (1 + healingPowerPct) * (1 + efficiencyPct));
}
export function passiveHealAmount(baseHp: number, level: number, healPct: number, healingPowerPct: number): number {
  return Math.round(healingBaseHp(baseHp, level) * healPct * (1 + healingPowerPct));
}
