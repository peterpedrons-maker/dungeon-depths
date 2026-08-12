import { Character, CombatStats } from '../types/game';
import { CLASSES } from './classes';
import { computeSkillBonuses } from './skills';

// Combines class base + level growth (already baked into ch.atk/ch.def) with
// the equipped weapon and every unlocked talent node into the numbers combat
// actually rolls against.
export function computeCombatStats(ch: Character): CombatStats {
  const bonuses = computeSkillBonuses(ch.classId, ch.unlockedSkills);
  const weapon = ch.equipment.weapon;
  const weaponDmg = weapon?.dmgBonus ?? 0;
  const weaponCrit = weapon?.secondaryStat?.type === 'crit' ? weapon.secondaryStat.value : 0;
  const weaponDef = weapon?.secondaryStat?.type === 'def' ? weapon.secondaryStat.value : 0;

  let atk = (ch.atk + weaponDmg) * (1 + bonuses.dmgPct);
  if (bonuses.lowHpDmgScale > 0) {
    const missing = 1 - ch.hp / ch.maxHp;
    atk *= 1 + bonuses.lowHpDmgScale * missing;
  }
  atk += bonuses.flatBonusDmg;

  const def = (ch.def + weaponDef) * (1 + bonuses.defPct);
  const critChance = Math.min(0.75, CLASSES[ch.classId].critChance + bonuses.critPct + weaponCrit);
  const critDmgMult = 1.6 + bonuses.critDmgPct;

  return {
    atk: Math.round(atk),
    def: Math.round(def),
    critChance,
    critDmgMult,
    blockChance: Math.min(0.6, bonuses.blockChance),
  };
}
