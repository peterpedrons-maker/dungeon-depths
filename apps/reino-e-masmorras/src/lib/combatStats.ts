import { Character, CombatStats, EquipmentItem } from '../types/game';
import { CLASSES } from './classes';
import { computeAttributeTotals, computeSkillBonuses } from './skills';

export const BASE_CRIT_DMG_MULT = 1.6;

// Fixed per-point coefficients converting the 7 primary attributes (granted
// only by "attribute" skill nodes) into the same stat channels equipment and
// skill passives already feed — kept modest so a handful of attribute nodes
// complements gear/talents rather than dwarfing them.
const ATTR_COEF = {
  atkPerStr: 1.0, atkPerDex: 0.6, atkPerInt: 1.0,
  critPerDex: 0.003, critPerAgi: 0.0015, critPerLuk: 0.0025,
  blockPerAgi: 0.004,
  defPerVit: 0.6, defPerWis: 0.4,
  hpPerVit: 3,
  supportPctPerWis: 0.01,
  dropChancePctPerLuk: 0.004,
  itemQualityPctPerLuk: 0.005,
};

function equippedItems(ch: Character): EquipmentItem[] {
  return Object.values(ch.equipment).filter((i): i is EquipmentItem => i !== null);
}

// Combines class base + level growth (already baked into ch.atk/ch.def) with
// every equipped item across all 5 slots, every unlocked talent node, and
// the primary attributes those talents grant into the numbers combat
// actually rolls against.
export function computeCombatStats(ch: Character): CombatStats {
  const bonuses = computeSkillBonuses(ch.classId, ch.unlockedSkills);
  const attrs = computeAttributeTotals(ch.classId, ch.unlockedSkills);

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

  const atkFromAttr = attrs.str * ATTR_COEF.atkPerStr + attrs.dex * ATTR_COEF.atkPerDex + attrs.int * ATTR_COEF.atkPerInt;
  const defFromAttr = attrs.vit * ATTR_COEF.defPerVit + attrs.wis * ATTR_COEF.defPerWis;
  const critFromAttr = attrs.dex * ATTR_COEF.critPerDex + attrs.agi * ATTR_COEF.critPerAgi + attrs.luk * ATTR_COEF.critPerLuk;
  const blockFromAttr = attrs.agi * ATTR_COEF.blockPerAgi;
  const hpFromAttr = attrs.vit * ATTR_COEF.hpPerVit;

  let atk = (ch.atk + itemDmg + atkFromAttr) * (1 + bonuses.dmgPct);
  if (bonuses.lowHpDmgScale > 0) {
    const missing = 1 - ch.hp / ch.maxHp;
    atk *= 1 + bonuses.lowHpDmgScale * missing;
  }
  atk += bonuses.flatBonusDmg;

  const def = (ch.def + itemDef + defFromAttr) * (1 + bonuses.defPct);
  const critChance = Math.min(0.75, CLASSES[ch.classId].critChance + bonuses.critPct + itemCrit + critFromAttr);
  const critDmgMult = BASE_CRIT_DMG_MULT + bonuses.critDmgPct;

  return {
    atk: Math.round(atk),
    def: Math.round(def),
    critChance,
    critDmgMult,
    blockChance: Math.min(0.6, bonuses.blockChance + itemBlock + blockFromAttr),
    maxHpBonus: itemHp + bonuses.maxHpFlat + hpFromAttr,
    lifestealPct: bonuses.lifestealPct,
    thornsPct: bonuses.thornsPct,
    onCritHealPct: bonuses.onCritHealPct,
    dmgPctVsPoison: bonuses.dmgPctVsPoison,
    dmgPctVsBurn: bonuses.dmgPctVsBurn,
    supportPowerPct: attrs.wis * ATTR_COEF.supportPctPerWis,
    dropChanceBonusPct: attrs.luk * ATTR_COEF.dropChancePctPerLuk,
    itemQualityBonusPct: attrs.luk * ATTR_COEF.itemQualityPctPerLuk,
  };
}

// ch.maxHp is the character's pure base (class + level growth); equipment
// and talents can push the real cap higher, so anything that shows or caps
// against "max HP" should use this instead of the raw field.
export function effectiveMaxHp(ch: Character): number {
  return ch.maxHp + computeCombatStats(ch).maxHpBonus;
}
