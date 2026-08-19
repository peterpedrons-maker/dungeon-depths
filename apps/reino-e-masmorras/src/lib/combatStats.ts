import { AttributeKey, Character, ClassId, CombatStats, EquipmentItem } from '../types/game';
import { CLASSES } from './classes';
import { enhancedItem } from './enhancement';
import { computeAttributeTotals, computeSkillBonuses } from './skills';

export const BASE_CRIT_DMG_MULT = 1.6;

// Fixed per-point coefficients converting the 7 primary attributes (class
// baseAttrs + the player's freely-spent attributePoints, see classes.ts)
// into the same stat channels equipment and skill-tree secondary stats
// already feed. STR/DEX feed physical ATK only (weapon swings are always
// physical); INT feeds MATK only. VIT feeds physical DEF; WIS feeds MDEF
// ("resistência mágica") plus a small VIT-adjacent toughness contribution.
// AGI also feeds speedPct — DungeonPanel uses it to shorten the delay
// between the player's own actions, so a high-AGI build genuinely acts
// more often than a slow one instead of just dodging/blocking more.
const ATTR_COEF = {
  atkPerStr: 1.0, atkPerDex: 0.6,
  matkPerInt: 1.0,
  critPerDex: 0.003, critPerAgi: 0.0015, critPerLuk: 0.0025,
  blockPerAgi: 0.004,
  speedPerAgi: 0.008,
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

// Diminishing-returns curve for the four attributes that feed the same
// primary stats equipment does (STR/DEX->ATK, VIT->DEF/HP, INT->MATK,
// WIS->MDEF) — everywhere else (crit, block, speed, drop luck...) stays
// linear. Points^0.7 scaled so the curve matches the old 1-point-per-point
// rate exactly at CURVE_ANCHOR (about where most classes already sit in
// their own priority attribute), so light/moderate investment feels
// unchanged and only heavy single-stat dumping tapers off — the intent is
// to stop pure attribute investment alone from outscaling equipment, not to
// punish a normal build. See lib/combatStats.ts discussion for the numbers.
const ATTR_CURVE_EXP = 0.7;
const ATTR_CURVE_ANCHOR = 5;
const ATTR_CURVE_K = Math.pow(ATTR_CURVE_ANCHOR, 1 - ATTR_CURVE_EXP);
function curved(points: number): number {
  return ATTR_CURVE_K * Math.pow(points, ATTR_CURVE_EXP);
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
  for (const raw of equippedItems(ch)) {
    const item = enhancedItem(raw);
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
  const atkFromAttr = curved(attrs.str) * ATTR_COEF.atkPerStr * mult('str') + curved(attrs.dex) * ATTR_COEF.atkPerDex * mult('dex');
  const matkFromAttr = curved(attrs.int) * ATTR_COEF.matkPerInt * mult('int');
  const defFromAttr = curved(attrs.vit) * ATTR_COEF.defPerVit * mult('vit');
  const mdefFromAttr = curved(attrs.wis) * ATTR_COEF.mdefPerWis * mult('wis') + curved(attrs.vit) * ATTR_COEF.mdefPerVit * mult('vit');
  const critFromAttr = attrs.dex * ATTR_COEF.critPerDex * mult('dex') + attrs.agi * ATTR_COEF.critPerAgi * mult('agi') + attrs.luk * ATTR_COEF.critPerLuk * mult('luk');
  const blockFromAttr = attrs.agi * ATTR_COEF.blockPerAgi * mult('agi');
  const hpFromAttr = curved(attrs.vit) * ATTR_COEF.hpPerVit * mult('vit');
  const speedFromAttr = attrs.agi * ATTR_COEF.speedPerAgi * mult('agi');

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
    speedPct: Math.min(0.5, speedFromAttr),
  };
}

// ch.maxHp is the character's pure base (class + level growth); equipment
// and talents can push the real cap higher, so anything that shows or caps
// against "max HP" should use this instead of the raw field.
export function effectiveMaxHp(ch: Character): number {
  return Math.round(ch.maxHp + computeCombatStats(ch).maxHpBonus);
}

// A single headline number summarizing "how strong is this character" —
// pulled straight from computeCombatStats(), so every source that feeds
// real combat numbers (class/level base, equipment, skill-tree bonuses, and
// attribute investment) counts toward the score, and swapping in a better
// weapon or armor piece visibly moves it. An earlier version was
// deliberately attribute-only and ignored equipment entirely, which read as
// broken once gear started mattering as much as it now does. Percentage
// stats (crit chance, evasion, ...) are 0-1 fractions internally — ×100
// puts them on the same order of magnitude as flat stats like atk instead
// of rounding away to almost nothing.
export function computeCombatPower(ch: Character): number {
  const stats = computeCombatStats(ch);
  const maxHp = effectiveMaxHp(ch);
  const power =
    stats.atk * 2 +
    stats.matk * 2 +
    stats.def * 1.5 +
    stats.mdef * 1.5 +
    maxHp * 0.4 +
    stats.critChance * 100 * 1.5 +
    (stats.critDmgMult - 1) * 100 * 0.8 +
    stats.blockChance * 100 * 1.2 +
    stats.evasion * 100 * 1.2 +
    stats.accuracy * 100 * 0.8 +
    stats.cooldownReductionPct * 100 * 1.2 +
    stats.lifestealPct * 100 +
    ch.level * 4;
  return Math.round(power);
}
