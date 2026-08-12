import { Character, CombatStats, EquipmentItem } from '../types/game';
import { CLASSES } from './classes';
import { computeSkillBonuses } from './skills';

export const BASE_CRIT_DMG_MULT = 1.6;

function equippedItems(ch: Character): EquipmentItem[] {
  return Object.values(ch.equipment).filter((i): i is EquipmentItem => i !== null);
}

// Combines class base + level growth (already baked into ch.atk/ch.def) with
// every equipped item across all 5 slots and every unlocked talent node into
// the numbers combat actually rolls against.
export function computeCombatStats(ch: Character): CombatStats {
  const bonuses = computeSkillBonuses(ch.classId, ch.unlockedSkills);

  let itemDmg = 0, itemDef = 0, itemHp = 0, itemCrit = 0, itemBlock = 0;
  for (const item of equippedItems(ch)) {
    itemDmg += item.dmgBonus;
    itemDef += item.defBonus;
    itemHp += item.hpBonus;
    const sec = item.secondaryStat;
    if (sec?.type === 'crit') itemCrit += sec.value;
    else if (sec?.type === 'def') itemDef += sec.value;
    else if (sec?.type === 'hp') itemHp += sec.value;
    else if (sec?.type === 'block') itemBlock += sec.value;
  }

  let atk = (ch.atk + itemDmg) * (1 + bonuses.dmgPct);
  if (bonuses.lowHpDmgScale > 0) {
    const missing = 1 - ch.hp / ch.maxHp;
    atk *= 1 + bonuses.lowHpDmgScale * missing;
  }
  atk += bonuses.flatBonusDmg;

  const def = (ch.def + itemDef) * (1 + bonuses.defPct);
  const critChance = Math.min(0.75, CLASSES[ch.classId].critChance + bonuses.critPct + itemCrit);
  const critDmgMult = BASE_CRIT_DMG_MULT + bonuses.critDmgPct;

  return {
    atk: Math.round(atk),
    def: Math.round(def),
    critChance,
    critDmgMult,
    blockChance: Math.min(0.6, bonuses.blockChance + itemBlock),
    maxHpBonus: itemHp + bonuses.maxHpFlat,
    lifestealPct: bonuses.lifestealPct,
    thornsPct: bonuses.thornsPct,
    onCritHealPct: bonuses.onCritHealPct,
  };
}

// ch.maxHp is the character's pure base (class + level growth); equipment
// and talents can push the real cap higher, so anything that shows or caps
// against "max HP" should use this instead of the raw field.
export function effectiveMaxHp(ch: Character): number {
  return ch.maxHp + computeCombatStats(ch).maxHpBonus;
}
