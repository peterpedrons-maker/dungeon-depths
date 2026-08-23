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

export interface EquipmentContribution {
  dmg: number; def: number; hp: number; matk: number; mdef: number; crit: number; critDmg: number; block: number;
  evasion: number; accuracy: number; tenacity: number; speed: number; lifesteal: number; thorns: number; cdr: number;
  dropChance: number; itemQuality: number;
}

// Sums every equipped item's *Bonus fields and secondaryStats rolls into one
// flat total per stat channel — the exact numbers computeCombatStats folds
// into atk/def/etc. below. Pulled out on its own (not just inlined there)
// so CharacterOverview's Atributos tab can show "how much of your current
// power comes from gear" directly instead of only ever seeing gear and
// attributes pre-mixed into one final number, which read as equipment
// simply not being counted at all even though it always was.
export function equipmentContribution(ch: Character): EquipmentContribution {
  let dmg = 0, def = 0, hp = 0, matk = 0, mdef = 0, crit = 0, critDmg = 0, block = 0,
    evasion = 0, accuracy = 0, tenacity = 0, speed = 0, lifesteal = 0, thorns = 0, cdr = 0,
    dropChance = 0, itemQuality = 0;
  for (const raw of equippedItems(ch)) {
    const item = enhancedItem(raw);
    dmg += item.dmgBonus;
    def += item.defBonus;
    hp += item.hpBonus;
    matk += item.matkBonus;
    mdef += item.mdefBonus;
    crit += item.critChanceBonus;
    critDmg += item.critDmgBonus;
    cdr += item.cdrBonus;
    for (const sec of item.secondaryStats) {
      if (sec.type === 'crit') crit += sec.value;
      else if (sec.type === 'critDmg') critDmg += sec.value;
      else if (sec.type === 'def') def += sec.value;
      else if (sec.type === 'mdef') mdef += sec.value;
      else if (sec.type === 'hp') hp += sec.value;
      else if (sec.type === 'block') block += sec.value;
      else if (sec.type === 'atk') dmg += sec.value;
      else if (sec.type === 'matk') matk += sec.value;
      else if (sec.type === 'evasion') evasion += sec.value;
      else if (sec.type === 'accuracy') accuracy += sec.value;
      else if (sec.type === 'tenacity') tenacity += sec.value;
      else if (sec.type === 'speed') speed += sec.value;
      else if (sec.type === 'lifesteal') lifesteal += sec.value;
      else if (sec.type === 'thorns') thorns += sec.value;
      else if (sec.type === 'cdr') cdr += sec.value;
      else if (sec.type === 'itemFind') dropChance += sec.value;
      else if (sec.type === 'itemQuality') itemQuality += sec.value;
    }
  }
  return { dmg, def, hp, matk, mdef, crit, critDmg, block, evasion, accuracy, tenacity, speed, lifesteal, thorns, cdr, dropChance, itemQuality };
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
  const item = equipmentContribution(ch);

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

  let atk = (ch.atk + item.dmg + atkFromAttr) * (1 + bonuses.dmgPct);
  let matk = (ch.matk + item.matk + matkFromAttr) * (1 + bonuses.dmgPct);
  if (bonuses.lowHpDmgScale > 0) {
    const missing = 1 - ch.hp / ch.maxHp;
    atk *= 1 + bonuses.lowHpDmgScale * missing;
    matk *= 1 + bonuses.lowHpDmgScale * missing;
  }
  atk += bonuses.flatBonusDmg;
  matk += bonuses.flatBonusMagicDmg;

  const def = (ch.def + item.def + defFromAttr) * (1 + bonuses.defPct);
  const mdef = (ch.mdef + item.mdef + mdefFromAttr) * (1 + bonuses.mdefPct);
  const critChance = Math.min(0.75, CLASSES[ch.classId].critChance + bonuses.critPct + item.crit + critFromAttr);
  const critDmgMult = BASE_CRIT_DMG_MULT + bonuses.critDmgPct + item.critDmg;

  return {
    atk: Math.round(atk),
    def: Math.round(def),
    matk: Math.round(matk),
    mdef: Math.round(mdef),
    critChance,
    critDmgMult,
    // Bloqueio no longer has an attribute source at all — see the ATTR_COEF
    // comment above — so this is purely skill-tree + item affix now.
    blockChance: Math.min(0.6, bonuses.blockChance + item.block),
    maxHpBonus: item.hp + bonuses.maxHpFlat + hpFromAttr,
    lifestealPct: bonuses.lifestealPct + item.lifesteal,
    thornsPct: bonuses.thornsPct + item.thorns,
    onCritHealPct: bonuses.onCritHealPct,
    dmgPctVsPoison: bonuses.dmgPctVsPoison,
    dmgPctVsBurn: bonuses.dmgPctVsBurn,
    supportPowerPct: attrs.wis * ATTR_COEF.supportPctPerWis * mult('wis'),
    dropChanceBonusPct: attrs.luk * ATTR_COEF.dropChancePctPerLuk + item.dropChance,
    itemQualityBonusPct: attrs.luk * ATTR_COEF.itemQualityPctPerLuk + item.itemQuality,
    evasion: Math.min(0.4, bonuses.evasionPct + evasionFromAttr + item.evasion),
    accuracy: Math.min(0.4, bonuses.accuracyPct + accuracyFromAttr + item.accuracy),
    cooldownReductionPct: Math.min(0.5, bonuses.cooldownReductionPct + item.cdr),
    speedPct: Math.min(0.5, speedFromAttr + item.speed),
    tenacityPct: Math.min(0.4, tenacityFromAttr + item.tenacity),
  };
}

// ch.maxHp is the character's pure base (class + level growth); equipment
// and talents can push the real cap higher, so anything that shows or caps
// against "max HP" should use this instead of the raw field.
export function effectiveMaxHp(ch: Character): number {
  return Math.round(ch.maxHp + computeCombatStats(ch).maxHpBonus);
}

// Speed as a plain integer on the same "stat number" scale as HP/ATK/etc,
// instead of exposing the internal multiplier as a raw "Normal (100%)"-style
// label — 10 is the baseline every combatant would show at 1.0x speed, so a
// player and an enemy can be compared at a glance the same way any other
// stat already is. Used by the Bestiário's enemy detail (mult = enemy's own
// enemySpeedMult) and CharacterOverview's Combate block (mult = 1 +
// stats.speedPct) so both sides render off the exact same formula.
export function speedScore(mult: number): number {
  return Math.round(10 * mult);
}

export interface AttrContribution { label: string; total: string; nextPoint: string }
export interface AttrDescription { weight: number; contributions: AttrContribution[] }

interface RawContribution { label: string; raw: number; isPct: boolean }

// One evaluation of an attribute's formulas at a given point count — called
// twice by describeAttribute below (at the current total and at +1) so the
// tooltip can show both "how much this attribute gives you right now" and
// "what the very next point actually adds", instead of only the former.
// That total-only version used to read as a flat "per point" rate at a
// glance (it's formatted with a leading "+"), but every flat stat here
// (atk/def/mdef/hp from STR/DEX/VIT/INT/WIS) runs through curved() —
// diminishing returns past ATTR_CURVE_ANCHOR — so the total stopped being
// points × a constant rate once a character had invested more than a
// handful of points. Allocating a point and watching a much smaller number
// show up than the tooltip's total implied read as the tooltip lying about
// a completely different stat instead of just being cumulative vs. marginal.
function rawAttrContributions(key: AttributeKey, points: number, mult: number): RawContribution[] {
  switch (key) {
    case 'str':
      return [{ label: 'Ataque Físico', raw: curved(points) * ATTR_COEF.atkPerStr * mult, isPct: false }];
    case 'dex':
      return [
        { label: 'Ataque Físico', raw: curved(points) * ATTR_COEF.atkPerDex * mult, isPct: false },
        { label: 'Precisão', raw: points * ATTR_COEF.accuracyPerDex * mult, isPct: true },
      ];
    case 'agi':
      return [
        { label: 'Evasão', raw: points * ATTR_COEF.evasionPerAgi * mult, isPct: true },
        { label: 'Velocidade', raw: points * ATTR_COEF.speedPerAgi * mult, isPct: true },
      ];
    case 'vit':
      return [
        { label: 'Defesa Física', raw: curved(points) * ATTR_COEF.defPerVit * mult, isPct: false },
        { label: 'Vida Máxima', raw: curved(points) * ATTR_COEF.hpPerVit * mult, isPct: false },
        { label: 'Defesa Mágica', raw: curved(points) * ATTR_COEF.mdefPerVit * mult, isPct: false },
        { label: 'Tenacidade', raw: points * ATTR_COEF.tenacityPerVit * mult, isPct: true },
      ];
    case 'int':
      return [{ label: 'Ataque Mágico', raw: curved(points) * ATTR_COEF.matkPerInt * mult, isPct: false }];
    case 'wis':
      return [
        { label: 'Defesa Mágica', raw: curved(points) * ATTR_COEF.mdefPerWis * mult, isPct: false },
        { label: 'Poder de Suporte', raw: points * ATTR_COEF.supportPctPerWis * mult, isPct: true },
        { label: 'Tenacidade', raw: points * ATTR_COEF.tenacityPerWis * mult, isPct: true },
      ];
    case 'luk':
      return [
        { label: 'Crítico', raw: points * ATTR_COEF.critPerLuk * mult, isPct: true },
        // dropChancePctPerLuk/itemQualityPctPerLuk deliberately skip `mult` —
        // see the classAttrMult comment above: loot luck stays universal,
        // never weighted by class identity like combat stats are.
        { label: 'Chance de Encontrar Item', raw: points * ATTR_COEF.dropChancePctPerLuk, isPct: true },
        { label: 'Qualidade dos Itens', raw: points * ATTR_COEF.itemQualityPctPerLuk, isPct: true },
      ];
  }
}

function fmtContribution(raw: number, isPct: boolean): string {
  return isPct ? `${(raw * 100).toFixed(1)}%` : `${Math.round(raw)}`;
}

// Powers the "?" tooltip on each primary attribute in CharacterOverview's
// Atributos tab. Reuses the exact same coefficients/curve/class-multiplier
// computeCombatStats() itself uses, so the numbers shown are this specific
// character's real current contribution — not a generic, class-agnostic
// blurb — including the class weight multiplier (classAttrMult) that makes
// the same point worth more to a class built around that attribute. Each
// row now shows both the running total AND the marginal gain the next
// point would actually add (see rawAttrContributions' comment) — clicking
// "+1" moves the stat by exactly the nextPoint number shown here, not by
// the total.
export function describeAttribute(ch: Character, key: AttributeKey): AttrDescription {
  const attrs = computeAttributeTotals(ch.classId, ch.allocatedAttrs);
  const mult = classAttrMult(ch.classId, key);
  const points = attrs[key];
  const current = rawAttrContributions(key, points, mult);
  const next = rawAttrContributions(key, points + 1, mult);
  const contributions: AttrContribution[] = current.map((c, i) => ({
    label: c.label,
    total: `+${fmtContribution(c.raw, c.isPct)}`,
    nextPoint: `+${fmtContribution(next[i].raw - c.raw, c.isPct)}`,
  }));
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
