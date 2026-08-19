import { AttributeKey, Character, ClassId, CombatStats, EquipmentItem } from '../types/game';
import { CLASSES } from './classes';
import { enhancedItem } from './enhancement';
import { computeAttributeTotals, computeSkillBonuses } from './skills';

export const BASE_CRIT_DMG_MULT = 1.6;

// Fixed per-point coefficients converting the 7 primary attributes (class
// baseAttrs + the player's freely-spent attributePoints, see classes.ts)
// into the same stat channels equipment and skill-tree secondary stats
// already feed. Each attribute owns one clear identity now — Crítico used
// to leak in from DEX and AGI too (on top of LUK), Bloqueio came from AGI
// with no equivalent for Evasão/Precisão at all, which made "what does this
// attribute actually do" a genuinely confusing question. Rebalanced so:
// STR = ataque físico puro; DEX = ataque físico secundário + Precisão;
// AGI = Evasão + velocidade; VIT = defesa + vida (+ resistência, small);
// INT = ataque mágico puro; WIS = defesa mágica + poder de suporte (+
// resistência, primary); LUK = crítico (now its sole source) + sorte de
// item. Bloqueio has no attribute source at all anymore — it reads as an
// equipment/shield thing (see lib/equipment.ts's SHIELD_SCALE) and a
// skill-tree pick, not an innate stat, which fits it better than AGI ever
// did.
const ATTR_COEF = {
  atkPerStr: 1.0, atkPerDex: 0.6,
  matkPerInt: 1.0,
  critPerLuk: 0.007,
  accuracyPerDex: 0.0025,
  evasionPerAgi: 0.0025,
  speedPerAgi: 0.008,
  defPerVit: 0.6,
  mdefPerWis: 0.5, mdefPerVit: 0.15,
  hpPerVit: 3,
  supportPctPerWis: 0.01,
  dropChancePctPerLuk: 0.004,
  itemQualityPctPerLuk: 0.005,
  // New "tenacidade" channel (see CombatStats.tenacityPct) — mirrors mdef's
  // own wis-primary/vit-secondary split, since it's the same "magical
  // fortitude + physical toughness" duo resisting status/CC that mdef
  // already leans on for resisting spell damage.
  tenacityPerWis: 0.002, tenacityPerVit: 0.001,
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

  let itemDmg = 0, itemDef = 0, itemHp = 0, itemMatk = 0, itemMdef = 0, itemCrit = 0, itemCritDmg = 0, itemBlock = 0,
    itemEvasion = 0, itemAccuracy = 0, itemTenacity = 0, itemSpeed = 0, itemLifesteal = 0, itemThorns = 0, itemCdr = 0,
    itemDropChance = 0, itemItemQuality = 0;
  for (const raw of equippedItems(ch)) {
    const item = enhancedItem(raw);
    itemDmg += item.dmgBonus;
    itemDef += item.defBonus;
    itemHp += item.hpBonus;
    itemMatk += item.matkBonus;
    itemMdef += item.mdefBonus;
    itemCrit += item.critChanceBonus;
    itemCritDmg += item.critDmgBonus;
    for (const sec of item.secondaryStats) {
      if (sec.type === 'crit') itemCrit += sec.value;
      else if (sec.type === 'critDmg') itemCritDmg += sec.value;
      else if (sec.type === 'def') itemDef += sec.value;
      else if (sec.type === 'mdef') itemMdef += sec.value;
      else if (sec.type === 'hp') itemHp += sec.value;
      else if (sec.type === 'block') itemBlock += sec.value;
      else if (sec.type === 'atk') itemDmg += sec.value;
      else if (sec.type === 'matk') itemMatk += sec.value;
      else if (sec.type === 'evasion') itemEvasion += sec.value;
      else if (sec.type === 'accuracy') itemAccuracy += sec.value;
      else if (sec.type === 'tenacity') itemTenacity += sec.value;
      else if (sec.type === 'speed') itemSpeed += sec.value;
      else if (sec.type === 'lifesteal') itemLifesteal += sec.value;
      else if (sec.type === 'thorns') itemThorns += sec.value;
      else if (sec.type === 'cdr') itemCdr += sec.value;
      else if (sec.type === 'itemFind') itemDropChance += sec.value;
      else if (sec.type === 'itemQuality') itemItemQuality += sec.value;
    }
  }

  const mult = (key: AttributeKey) => classAttrMult(ch.classId, key);
  const atkFromAttr = curved(attrs.str) * ATTR_COEF.atkPerStr * mult('str') + curved(attrs.dex) * ATTR_COEF.atkPerDex * mult('dex');
  const matkFromAttr = curved(attrs.int) * ATTR_COEF.matkPerInt * mult('int');
  const defFromAttr = curved(attrs.vit) * ATTR_COEF.defPerVit * mult('vit');
  const mdefFromAttr = curved(attrs.wis) * ATTR_COEF.mdefPerWis * mult('wis') + curved(attrs.vit) * ATTR_COEF.mdefPerVit * mult('vit');
  const critFromAttr = attrs.luk * ATTR_COEF.critPerLuk * mult('luk');
  const accuracyFromAttr = attrs.dex * ATTR_COEF.accuracyPerDex * mult('dex');
  const evasionFromAttr = attrs.agi * ATTR_COEF.evasionPerAgi * mult('agi');
  const tenacityFromAttr = attrs.wis * ATTR_COEF.tenacityPerWis * mult('wis') + attrs.vit * ATTR_COEF.tenacityPerVit * mult('vit');
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
    // Bloqueio no longer has an attribute source at all — see the ATTR_COEF
    // comment above — so this is purely skill-tree + item affix now.
    blockChance: Math.min(0.6, bonuses.blockChance + itemBlock),
    maxHpBonus: itemHp + bonuses.maxHpFlat + hpFromAttr,
    lifestealPct: bonuses.lifestealPct + itemLifesteal,
    thornsPct: bonuses.thornsPct + itemThorns,
    onCritHealPct: bonuses.onCritHealPct,
    dmgPctVsPoison: bonuses.dmgPctVsPoison,
    dmgPctVsBurn: bonuses.dmgPctVsBurn,
    supportPowerPct: attrs.wis * ATTR_COEF.supportPctPerWis * mult('wis'),
    dropChanceBonusPct: attrs.luk * ATTR_COEF.dropChancePctPerLuk + itemDropChance,
    itemQualityBonusPct: attrs.luk * ATTR_COEF.itemQualityPctPerLuk + itemItemQuality,
    evasion: Math.min(0.4, bonuses.evasionPct + evasionFromAttr + itemEvasion),
    accuracy: Math.min(0.4, bonuses.accuracyPct + accuracyFromAttr + itemAccuracy),
    cooldownReductionPct: Math.min(0.5, bonuses.cooldownReductionPct + itemCdr),
    speedPct: Math.min(0.5, speedFromAttr + itemSpeed),
    tenacityPct: Math.min(0.4, tenacityFromAttr + itemTenacity),
  };
}

// ch.maxHp is the character's pure base (class + level growth); equipment
// and talents can push the real cap higher, so anything that shows or caps
// against "max HP" should use this instead of the raw field.
export function effectiveMaxHp(ch: Character): number {
  return Math.round(ch.maxHp + computeCombatStats(ch).maxHpBonus);
}

export interface AttrContribution { label: string; value: string }
export interface AttrDescription { weight: number; contributions: AttrContribution[] }

// Powers the "?" tooltip on each primary attribute in CharacterOverview's
// Atributos tab. Reuses the exact same coefficients/curve/class-multiplier
// computeCombatStats() itself uses, so the numbers shown are this specific
// character's real current contribution — not a generic, class-agnostic
// blurb — including the class weight multiplier (classAttrMult) that makes
// the same point worth more to a class built around that attribute.
// dropChanceBonusPct/itemQualityBonusPct are the one deliberate exception:
// they never apply the class weight (see the ATTR_COEF/classAttrMult
// comments above), so LUK's two loot-luck lines below skip `mult` on purpose.
export function describeAttribute(ch: Character, key: AttributeKey): AttrDescription {
  const attrs = computeAttributeTotals(ch.classId, ch.allocatedAttrs);
  const mult = classAttrMult(ch.classId, key);
  const points = attrs[key];
  const contributions: AttrContribution[] = [];
  switch (key) {
    case 'str':
      contributions.push({ label: 'Ataque Físico', value: `+${Math.round(curved(points) * ATTR_COEF.atkPerStr * mult)}` });
      break;
    case 'dex':
      contributions.push({ label: 'Ataque Físico', value: `+${Math.round(curved(points) * ATTR_COEF.atkPerDex * mult)}` });
      contributions.push({ label: 'Precisão', value: `+${(points * ATTR_COEF.accuracyPerDex * mult * 100).toFixed(1)}%` });
      break;
    case 'agi':
      contributions.push({ label: 'Evasão', value: `+${(points * ATTR_COEF.evasionPerAgi * mult * 100).toFixed(1)}%` });
      contributions.push({ label: 'Velocidade', value: `+${(points * ATTR_COEF.speedPerAgi * mult * 100).toFixed(1)}%` });
      break;
    case 'vit':
      contributions.push({ label: 'Defesa Física', value: `+${Math.round(curved(points) * ATTR_COEF.defPerVit * mult)}` });
      contributions.push({ label: 'Vida Máxima', value: `+${Math.round(curved(points) * ATTR_COEF.hpPerVit * mult)}` });
      contributions.push({ label: 'Defesa Mágica', value: `+${Math.round(curved(points) * ATTR_COEF.mdefPerVit * mult)}` });
      contributions.push({ label: 'Tenacidade', value: `+${(points * ATTR_COEF.tenacityPerVit * mult * 100).toFixed(1)}%` });
      break;
    case 'int':
      contributions.push({ label: 'Ataque Mágico', value: `+${Math.round(curved(points) * ATTR_COEF.matkPerInt * mult)}` });
      break;
    case 'wis':
      contributions.push({ label: 'Defesa Mágica', value: `+${Math.round(curved(points) * ATTR_COEF.mdefPerWis * mult)}` });
      contributions.push({ label: 'Poder de Suporte', value: `+${(points * ATTR_COEF.supportPctPerWis * mult * 100).toFixed(1)}%` });
      contributions.push({ label: 'Tenacidade', value: `+${(points * ATTR_COEF.tenacityPerWis * mult * 100).toFixed(1)}%` });
      break;
    case 'luk':
      contributions.push({ label: 'Crítico', value: `+${(points * ATTR_COEF.critPerLuk * mult * 100).toFixed(1)}%` });
      contributions.push({ label: 'Chance de Item', value: `+${(points * ATTR_COEF.dropChancePctPerLuk * 100).toFixed(1)}%` });
      contributions.push({ label: 'Qualidade de Item', value: `+${(points * ATTR_COEF.itemQualityPctPerLuk * 100).toFixed(1)}%` });
      break;
  }
  return { weight: mult, contributions };
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
