import { AttributeKey, Character, ClassId, CombatStats, EquipmentItem } from '../types/game';
import { CLASSES } from './classes';
import { computeAttributeTotals, computeSkillBonuses } from './skills';

export const BASE_CRIT_DMG_MULT = 1.6;

// Fixed per-point coefficients converting the 7 primary attributes (class
// baseAttrs + the player's freely-spent attributePoints, see classes.ts)
// into the same stat channels equipment and skill-tree secondary stats
// already feed. STR/DEX feed physical ATK only (weapon swings are always
// physical); INT feeds MATK only. VIT feeds physical DEF; WIS feeds MDEF
// ("resistência mágica") plus a small VIT-adjacent toughness contribution.
const ATTR_COEF = {
  atkPerStr: 1.0, atkPerDex: 0.6,
  matkPerInt: 1.0,
  critPerDex: 0.003, critPerAgi: 0.0015, critPerLuk: 0.0025,
  blockPerAgi: 0.004,
  defPerVit: 0.6,
  mdefPerWis: 0.5, mdefPerVit: 0.15,
  hpPerVit: 3,
  supportPctPerWis: 0.01,
  dropChancePctPerLuk: 0.004,
  itemQualityPctPerLuk: 0.005,
};

// The same attribute point is worth more to a class built around that
// attribute than to one that only carries it as a floor stat — a
// Guerreiro's VIT point yields more HP than a Mago's. Derived straight from
// baseAttrs' own magnitude (see classes.ts): the floor value every class
// gets in its "irrelevant" attributes (1) scales at the baseline rate the
// ATTR_COEF numbers above were tuned for; a class's secondary priority
// (2-3) and primary priority (5) attributes scale progressively better.
// Loot-luck stats (drop chance / item quality) are deliberately excluded —
// finding better gear isn't a combat power fantasy tied to class identity,
// so LUK's contribution to those stays universal.
function classAttrMult(classId: ClassId, key: AttributeKey): number {
  const base = CLASSES[classId].baseAttrs[key] ?? 1;
  if (base >= 5) return 2.0;
  if (base >= 2) return 1.5;
  return 1.0;
}

function equippedItems(ch: Character): EquipmentItem[] {
  return Object.values(ch.equipment).filter((i): i is EquipmentItem => i !== null);
}

// Combines class base + level growth (already baked into ch.atk/ch.def/
// ch.matk/ch.mdef) with every equipped item across all 6 slots, every
// unlocked talent node, and the primary attributes those talents grant into
// the numbers combat actually rolls against. Equipment used to only ever
// feed physical atk/def, but the offhand's foco/relicário line and the
// Bracelete accessory now feed magical power too (matkBonus), and Amuleto
// can feed mdef — so equipment can push every one of atk/def/matk/mdef now.
export function computeCombatStats(ch: Character): CombatStats {
  const bonuses = computeSkillBonuses(ch.classId, ch.unlockedSkills);
  const attrs = computeAttributeTotals(ch.classId, ch.allocatedAttrs);

  let itemDmg = 0, itemDef = 0, itemHp = 0, itemMatk = 0, itemMdef = 0, itemCrit = 0, itemCritDmg = 0, itemBlock = 0;
  for (const item of equippedItems(ch)) {
    itemDmg += item.dmgBonus;
    itemDef += item.defBonus;
    itemHp += item.hpBonus;
    itemMatk += item.matkBonus;
    itemMdef += item.mdefBonus;
    itemCrit += item.critChanceBonus;
    itemCritDmg += item.critDmgBonus;
    const sec = item.secondaryStat;
    if (sec?.type === 'crit') itemCrit += sec.value;
    else if (sec?.type === 'critDmg') itemCritDmg += sec.value;
    else if (sec?.type === 'def') itemDef += sec.value;
    else if (sec?.type === 'mdef') itemMdef += sec.value;
    else if (sec?.type === 'hp') itemHp += sec.value;
    else if (sec?.type === 'block') itemBlock += sec.value;
    else if (sec?.type === 'atk') itemDmg += sec.value;
    else if (sec?.type === 'matk') itemMatk += sec.value;
  }

  const mult = (key: AttributeKey) => classAttrMult(ch.classId, key);
  const atkFromAttr = attrs.str * ATTR_COEF.atkPerStr * mult('str') + attrs.dex * ATTR_COEF.atkPerDex * mult('dex');
  const matkFromAttr = attrs.int * ATTR_COEF.matkPerInt * mult('int');
  const defFromAttr = attrs.vit * ATTR_COEF.defPerVit * mult('vit');
  const mdefFromAttr = attrs.wis * ATTR_COEF.mdefPerWis * mult('wis') + attrs.vit * ATTR_COEF.mdefPerVit * mult('vit');
  const critFromAttr = attrs.dex * ATTR_COEF.critPerDex * mult('dex') + attrs.agi * ATTR_COEF.critPerAgi * mult('agi') + attrs.luk * ATTR_COEF.critPerLuk * mult('luk');
  const blockFromAttr = attrs.agi * ATTR_COEF.blockPerAgi * mult('agi');
  const hpFromAttr = attrs.vit * ATTR_COEF.hpPerVit * mult('vit');

  let atk = (ch.atk + itemDmg + atkFromAttr) * (1 + bonuses.dmgPct);
  let matk = (ch.matk + itemMatk + matkFromAttr) * (1 + bonuses.dmgPct);
  if (bonuses.lowHpDmgScale > 0) {
    const missing = 1 - ch.hp / ch.maxHp;
    atk *= 1 + bonuses.lowHpDmgScale * missing;
    matk *= 1 + bonuses.lowHpDmgScale * missing;
  }
  atk += bonuses.flatBonusDmg;
  matk += bonuses.flatBonusMagicDmg;

  const def = (ch.def + itemDef + defFromAttr) * (1 + bonuses.defPct);
  const mdef = (ch.mdef + itemMdef + mdefFromAttr) * (1 + bonuses.mdefPct);
  const critChance = Math.min(0.75, CLASSES[ch.classId].critChance + bonuses.critPct + itemCrit + critFromAttr);
  const critDmgMult = BASE_CRIT_DMG_MULT + bonuses.critDmgPct + itemCritDmg;

  return {
    atk: Math.round(atk),
    def: Math.round(def),
    matk: Math.round(matk),
    mdef: Math.round(mdef),
    critChance,
    critDmgMult,
    blockChance: Math.min(0.6, bonuses.blockChance + itemBlock + blockFromAttr),
    maxHpBonus: itemHp + bonuses.maxHpFlat + hpFromAttr,
    lifestealPct: bonuses.lifestealPct,
    thornsPct: bonuses.thornsPct,
    onCritHealPct: bonuses.onCritHealPct,
    dmgPctVsPoison: bonuses.dmgPctVsPoison,
    dmgPctVsBurn: bonuses.dmgPctVsBurn,
    supportPowerPct: attrs.wis * ATTR_COEF.supportPctPerWis * mult('wis'),
    dropChanceBonusPct: attrs.luk * ATTR_COEF.dropChancePctPerLuk,
    itemQualityBonusPct: attrs.luk * ATTR_COEF.itemQualityPctPerLuk,
    evasion: Math.min(0.4, bonuses.evasionPct),
    accuracy: Math.min(0.4, bonuses.accuracyPct),
    cooldownReductionPct: Math.min(0.5, bonuses.cooldownReductionPct),
  };
}

// ch.maxHp is the character's pure base (class + level growth); equipment
// and talents can push the real cap higher, so anything that shows or caps
// against "max HP" should use this instead of the raw field.
export function effectiveMaxHp(ch: Character): number {
  return ch.maxHp + computeCombatStats(ch).maxHpBonus;
}
