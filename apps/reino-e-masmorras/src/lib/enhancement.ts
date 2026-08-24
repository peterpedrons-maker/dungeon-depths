import { EquipmentItem, SecondaryStatType } from '../types/game';

// Forja upgrade system (v1 — deliberately simple, gets more complex later):
// spend gold at the Forja to push an item's enhanceLevel up, which scales
// only its *Bonus fields (dmgBonus/defBonus/hpBonus/matkBonus/mdefBonus/
// critChanceBonus/critDmgBonus) by a flat % per level — the item's one true
// base stat, never its rolled secondaryStats affixes. An affix of type
// crit/critDmg/atk/matk/def/mdef/hp used to get folded into the SAME
// displayed number as a matching primary field (see the old
// SECONDARY_TO_STAT_KEY design), which made an item look like it had two
// "base" stats when it actually only ever has exactly one — see
// compareItemStatRows below, which now keeps every affix on its own row,
// tagged isBase:false, even when it happens to share a stat name with the
// item's real base stat. The stored item's *Bonus fields always stay the
// original rolled values; enhancedItem() below is the one place the +%
// actually gets applied, so every consumer (combat, item modals, sell
// value) reads the same number and the formula can be retuned later
// without needing to "unwind" anything already saved.
export const MAX_ENHANCE_LEVEL = 10;
// Cumulative bonus multiplier by enhance level — per-level increments grow
// instead of staying flat (was a flat 5%/level, so +10 = +50% no matter
// which levels it came from). A late push (+9->+10, +8%) now adds
// noticeably more raw power than an early one (+0->+1, +3%), matching how
// much harder/rarer a late success actually is (see SUCCESS_CHANCE_BASE
// and enhanceCost below) — the early levels are the "easy, cheap" ones, so
// they shouldn't hand out equally aggressive power as the late "expensive,
// near-lottery" ones. Total at +10 (54%) stays close to the old flat curve
// (50%) on purpose — this reshapes WHERE the power comes from, not how
// much overall.
const ENHANCE_PCT_BY_LEVEL = [0, 0.03, 0.06, 0.10, 0.14, 0.19, 0.24, 0.30, 0.37, 0.45, 0.54];

// Every successful Forja level-up also improves exactly one of the item's
// affixes (see applyAffixGrowth below) — chosen by the player if they spend
// a Runa de Aprimoramento for that level-up, or picked at random otherwise.
// This is the SAME shape/curve as ENHANCE_PCT_BY_LEVEL above (increments
// grow per level, so a late pick matters more than an early one), just
// rescaled so a single affix picked at every one of the 10 level-ups totals
// ~25% instead of the primary stat's ~54% — user call: "algo como um terço"
// of the primary bonus was the starting idea, raised to "pode chegar até
// uns vinte e cinco por cento" as the final number. Scale factor is exactly
// 0.25/0.54, so AFFIX_PCT_BY_LEVEL[10] lands on 0.25 by construction.
const AFFIX_PCT_BY_LEVEL = ENHANCE_PCT_BY_LEVEL.map((v) => (v * 0.25) / 0.54);

// Per-transition increment (index = the level being left, 0-9) — how much
// affixBoosts[i] grows when affix i is the one picked going from that level
// to the next. Diffs of AFFIX_PCT_BY_LEVEL, so picking the SAME affix at
// every level-up reproduces that table's cumulative total exactly; spreading
// picks across several affixes instead splits the same total budget between
// them.
const AFFIX_BOOST_INCREMENT_BY_LEVEL = AFFIX_PCT_BY_LEVEL.slice(1).map((v, i) => v - AFFIX_PCT_BY_LEVEL[i]);

// secondaryStats percent-fraction types (stored 0-1) vs. flat-number ones —
// same split lib/equipment.ts's PCT_AFFIX_TYPES draws, duplicated here
// (rather than imported) since equipment.ts already imports FROM this file
// and a cross-import back would be circular.
const PCT_AFFIX_TYPE_SET = new Set<SecondaryStatType>([
  'crit', 'critDmg', 'block', 'evasion', 'accuracy', 'tenacity', 'speed', 'lifesteal', 'thorns', 'cdr', 'itemFind', 'itemQuality',
]);

// Applies one affix's growth for a successful push from `item.enhanceLevel`
// to the next level. `affixIndex` is which secondaryStats entry improves —
// the Ferreiro's rune flow passes the player's choice, or a random existing
// index when no rune was used. Returns `item` unchanged if it has no affixes
// at all (nothing to grow — see the Ferreiro's separate "add a first affix
// via rune" path for that case instead).
export function applyAffixGrowth(item: EquipmentItem, affixIndex: number): EquipmentItem {
  const affix = item.secondaryStats[affixIndex];
  if (!affix) return item;
  const incrementPct = AFFIX_BOOST_INCREMENT_BY_LEVEL[item.enhanceLevel] ?? 0;
  // Percentage affixes (crítico, evasão, velocidade...) keep the pure
  // percentage, unfloored — they're already strong per point and read
  // clearly at whole percentage points. Flat-number affixes (defesa, vida,
  // ataque...) instead always gain at least +1 per pick: a pure percentage
  // of a small roll (e.g. 7 ataque mágico) can round to 0 and read as
  // "nada aconteceu" even though the pick was real — see the affixBoosts
  // comment on EquipmentItem for how the two units (fraction vs. flat
  // delta) coexist in the same array.
  const isPct = PCT_AFFIX_TYPE_SET.has(affix.type);
  const delta = isPct ? incrementPct : Math.max(1, Math.round(affix.value * incrementPct));
  const boosts = item.secondaryStats.map((_, i) => item.affixBoosts?.[i] ?? 0);
  boosts[affixIndex] += delta;
  return { ...item, affixBoosts: boosts };
}

// Chance to succeed when attempting to push FROM this enhanceLevel to the
// next one — only the first two levels are still a pure formality; +3/+4/+5
// already ask for a real (if still favorable) roll instead of all five
// being free, +5 and +6 are real but still-favorable coinflips-and-better,
// and from +7 on the odds fall off a cliff so a late attempt is a genuine
// gamble, down to a near-lottery 0.5% shot at the very last step. Index =
// current enhanceLevel (0-9). No building bonus anymore (the Forja's level
// system was removed entirely) — this base curve is the whole story.
const SUCCESS_CHANCE_BASE = [1.00, 1.00, 0.80, 0.75, 0.65, 0.50, 0.20, 0.08, 0.02, 0.005];

export function successChanceForLevel(level: number): number {
  return SUCCESS_CHANCE_BASE[level] ?? 0;
}

// Gold cost to push `item` from its current enhanceLevel to the next one —
// scales with the item's own tier (a tier-1 scrap sword is cheap to enhance,
// a tier-10 legend isn't) and grows per level so +9→+10 costs far more than
// +0→+1. 2026 rebalance, take three: base 15->20 and exponent 1.45->1.55,
// specified directly — +1-+4 stay affordable, +5-+6 start to bite, +7 hurts,
// +8-+9 are expensive, +10 is a deliberate long-term investment (its own
// 0.5% success chance already makes it a near-lottery — see
// SUCCESS_CHANCE_BASE — so the cost multiplies onto an already-low
// expected-attempts count, not a compounding trivial one).
export function enhanceCost(item: EquipmentItem): number {
  return Math.round(20 * item.tier * Math.pow(1.55, item.enhanceLevel));
}

const PRIMARY_KEYS = ['dmgBonus', 'defBonus', 'hpBonus', 'matkBonus', 'mdefBonus', 'critChanceBonus', 'critDmgBonus', 'cdrBonus'] as const;

// Returns a copy of `item` with its *Bonus fields scaled up by its current
// enhanceLevel, AND each secondaryStats entry scaled up by its own
// affixBoosts[i] (see applyAffixGrowth above) — this is what combat, item
// modals and sell value should all read instead of the raw stored fields.
export function enhancedItem(item: EquipmentItem): EquipmentItem {
  const hasAffixBoost = item.affixBoosts?.some((b) => b > 0) ?? false;
  if (item.enhanceLevel <= 0 && !hasAffixBoost) return item;
  const mult = 1 + (ENHANCE_PCT_BY_LEVEL[item.enhanceLevel] ?? 0);
  const scaled = { ...item };
  for (const key of PRIMARY_KEYS) {
    if (item[key] === 0) continue;
    const isPct = key === 'critChanceBonus' || key === 'critDmgBonus' || key === 'cdrBonus';
    scaled[key] = isPct ? item[key] * mult : Math.round(item[key] * mult);
  }
  if (hasAffixBoost) {
    // Two different units share the same affixBoosts array depending on
    // type (see applyAffixGrowth): a pct-type boost is a fraction, applied
    // multiplicatively; a flat-type boost is an absolute delta already in
    // the stat's own unit, applied additively (its minimum-+1-per-pick
    // floor was already baked in at growth time, not here).
    scaled.secondaryStats = item.secondaryStats.map((s, i) => {
      const boost = item.affixBoosts?.[i] ?? 0;
      if (boost <= 0) return s;
      if (PCT_AFFIX_TYPE_SET.has(s.type)) return { ...s, value: s.value * (1 + boost) };
      return { ...s, value: s.value + boost };
    });
  }
  return scaled;
}

// Gold cost to fully reset `item` back to +0 (undoing both the primary-stat
// enhancement and every affix improvement it picked up along the way) —
// scales with how much is actually being undone (tier × current level), not
// a flat fee, so resetting a heavily-invested item costs more than a fresh
// +1. Gold already spent on getting there is never refunded.
export function resetItemCost(item: EquipmentItem): number {
  return Math.round(10 * item.tier * item.enhanceLevel);
}

// Reverts an item to +0 — clears every affix's boost, and drops any affix a
// Runa de Aprimoramento added past the item's original roll (see
// originalAffixCount on EquipmentItem) rather than leaving a "free" affix
// behind after the enhancement that created it is undone.
export function resetItem(item: EquipmentItem): EquipmentItem {
  const keepCount = item.originalAffixCount ?? item.secondaryStats.length;
  return {
    ...item,
    enhanceLevel: 0,
    secondaryStats: item.secondaryStats.slice(0, keepCount),
    affixBoosts: undefined,
  };
}

export function itemDisplayName(item: EquipmentItem): string {
  return item.enhanceLevel > 0 ? `${item.name} +${item.enhanceLevel}` : item.name;
}

// Two decimal places for an item's own percentage stats (crit, lifesteal,
// evasão...) instead of a rounded whole number — a roll/enhance step can
// move a value by well under 1 percentage point (see applyAffixGrowth's
// pct-type branch, deliberately unfloored so a strong stat like roubo de
// vida grows in small relative steps rather than a flat +1pp/pick). One
// decimal place still wasn't enough: a small base value (e.g. 2.00%) times
// the ~1.4% relative first-pick growth lands at 2.03%, which rounds right
// back to "2,0%" and reads as "nothing changed" even though it's a real
// increase — two decimals is what actually keeps that visible. Comma
// decimal separator to match fmt()'s pt-BR number formatting elsewhere.
export function fmtItemPct(value: number): string {
  return (value * 100).toFixed(2).replace('.', ',');
}

// Bare "+N stat" lines for an item's primary roll (already enhance-scaled —
// pass the item through enhancedItem() first), shared by every item-detail
// card (CharacterOverview's quick-view, the Mercador's buy card) so the two
// never drift apart on wording.
export function primaryStatLines(item: EquipmentItem): string[] {
  return [
    item.dmgBonus > 0 && `+${item.dmgBonus} ataque físico`,
    item.defBonus > 0 && `+${item.defBonus} defesa`,
    item.hpBonus > 0 && `+${item.hpBonus} vida máxima`,
    item.matkBonus > 0 && `+${item.matkBonus} ataque mágico`,
    item.mdefBonus > 0 && `+${item.mdefBonus} defesa mágica`,
    item.critChanceBonus > 0 && `+${fmtItemPct(item.critChanceBonus)}% chance de crítico`,
    item.critDmgBonus > 0 && `+${fmtItemPct(item.critDmgBonus)}% dano crítico`,
    item.cdrBonus > 0 && `+${fmtItemPct(item.cdrBonus)}% redução de recarga`,
  ].filter((l): l is string => !!l);
}

function affixLabel(type: SecondaryStatType, value: number): string {
  switch (type) {
    case 'crit': return `+${fmtItemPct(value)}% chance de crítico`;
    case 'critDmg': return `+${fmtItemPct(value)}% dano crítico`;
    case 'block': return `+${fmtItemPct(value)}% chance de bloqueio`;
    case 'def': return `+${value} defesa`;
    case 'mdef': return `+${value} defesa mágica`;
    case 'atk': return `+${value} ataque físico`;
    case 'matk': return `+${value} ataque mágico`;
    case 'hp': return `+${value} vida máxima`;
    case 'evasion': return `+${fmtItemPct(value)}% evasão`;
    case 'accuracy': return `+${fmtItemPct(value)}% precisão`;
    case 'tenacity': return `+${fmtItemPct(value)}% tenacidade`;
    case 'speed': return `+${fmtItemPct(value)}% velocidade`;
    case 'lifesteal': return `+${fmtItemPct(value)}% roubo de vida`;
    case 'thorns': return `+${fmtItemPct(value)}% espinhos`;
    case 'cdr': return `+${fmtItemPct(value)}% redução de recarga`;
    case 'itemFind': return `+${fmtItemPct(value)}% chance de encontrar item`;
    case 'itemQuality': return `+${fmtItemPct(value)}% qualidade dos itens`;
  }
}

// An item can now roll several affixes (see AFFIX_COUNT_RANGE in
// lib/equipment.ts) — one line per rolled affix, in roll order.
export function secondaryStatLabels(item: EquipmentItem): string[] {
  return item.secondaryStats.map((s) => affixLabel(s.type, s.value));
}

// One shared label space for both the 7 flat *Bonus fields and every
// possible secondaryStats affix, so an item's full stat picture (base roll +
// every affix) can be compared against another item's picture stat-for-stat
// instead of comparing two different shapes. The 10 affix-only stats (block
// plus the 9 added alongside it — see SecondaryStatType) have no primary
// *Bonus field of their own, so they key straight off their own affix type
// name instead of an EquipmentItem field.
type StatKey = typeof PRIMARY_KEYS[number] | 'block' | 'evasion' | 'accuracy' | 'tenacity' | 'speed' | 'lifesteal' | 'thorns' | 'itemFind' | 'itemQuality';
const STAT_META: { key: StatKey; label: string; isPct: boolean }[] = [
  { key: 'dmgBonus', label: 'Ataque Físico', isPct: false },
  { key: 'defBonus', label: 'Defesa', isPct: false },
  { key: 'hpBonus', label: 'Vida Máxima', isPct: false },
  { key: 'matkBonus', label: 'Ataque Mágico', isPct: false },
  { key: 'mdefBonus', label: 'Defesa Mágica', isPct: false },
  { key: 'critChanceBonus', label: 'Chance de Crítico', isPct: true },
  { key: 'critDmgBonus', label: 'Dano Crítico', isPct: true },
  { key: 'cdrBonus', label: 'Redução de Recarga', isPct: true },
  { key: 'block', label: 'Bloqueio', isPct: true },
  { key: 'evasion', label: 'Evasão', isPct: true },
  { key: 'accuracy', label: 'Precisão', isPct: true },
  { key: 'tenacity', label: 'Tenacidade', isPct: true },
  { key: 'speed', label: 'Velocidade', isPct: true },
  { key: 'lifesteal', label: 'Roubo de Vida', isPct: true },
  { key: 'thorns', label: 'Espinhos', isPct: true },
  { key: 'itemFind', label: 'Chance de Encontrar Item', isPct: true },
  { key: 'itemQuality', label: 'Qualidade dos Itens', isPct: true },
];
// Which display label an affix type reads under — shares its name with a
// primary field for 8 of the 17 types (crit/critDmg/cdr/def/mdef/atk/matk/
// hp), but a same-named affix is NEVER summed into the primary's own number
// (see statEntries below): an item only ever has one real base stat, so a
// same-type affix always shows as its own separate "Afixos" row instead of
// quietly inflating the "Atributo Base" line it happens to share a name
// with. Every other affix type has no primary twin at all and always keys
// off its own name.
const SECONDARY_TO_STAT_KEY: Record<SecondaryStatType, StatKey> = {
  crit: 'critChanceBonus', critDmg: 'critDmgBonus', block: 'block',
  def: 'defBonus', mdef: 'mdefBonus', atk: 'dmgBonus', matk: 'matkBonus', hp: 'hpBonus',
  evasion: 'evasion', accuracy: 'accuracy', tenacity: 'tenacity', speed: 'speed',
  lifesteal: 'lifesteal', thorns: 'thorns', cdr: 'cdrBonus', itemFind: 'itemFind', itemQuality: 'itemQuality',
};

const PRIMARY_KEY_SET: ReadonlySet<string> = new Set(PRIMARY_KEYS);

// isBase marks the item's own primary roll (the 7 PRIMARY_KEYS — a weapon's
// Ataque Físico, armor's Defesa, etc., the ONE stat every item is guaranteed
// to roll) as opposed to a secondary affix (Precisão, Chance de Item, and
// every other roll-of-the-dice bonus, including a crit/critDmg/atk/matk/
// def/mdef/hp-type one) — lets the UI color the two differently and, more
// importantly, keeps enhancement from ever touching the affix side.
export interface StatCompareRow { label: string; isPct: boolean; equippedValue: number; newValue: number; isBase: boolean }

interface StatEntry { key: StatKey; isBase: boolean; value: number }

// An item's stat picture as a flat list of independent entries — never
// merged by key — so a primary roll and a same-named affix (e.g. a weapon
// whose primary is Ataque Físico that also rolled an Ataque Físico affix)
// stay two distinct entries instead of silently summing into one number
// that reads as pure "Atributo Base" on screen.
function statEntries(item: EquipmentItem): StatEntry[] {
  const entries: StatEntry[] = [];
  for (const key of PRIMARY_KEYS) {
    if (item[key] !== 0) entries.push({ key, isBase: true, value: item[key] });
  }
  for (const s of item.secondaryStats) {
    entries.push({ key: SECONDARY_TO_STAT_KEY[s.type], isBase: false, value: s.value });
  }
  return entries;
}

// Side-by-side stat picture of `newItem` vs. whatever's currently equipped
// in its slot — both sides go through enhancedItem() first so a comparison
// against a forged item reflects what's actually in play, not the raw roll.
// A null `equipped` (empty slot) reads as zero on every stat, which is
// exactly right for "nothing to lose here" — every one of the new item's
// stats shows as a pure gain. Iterates STAT_META twice per stat (once for a
// possible base row, once for a possible affix row) instead of once per
// StatKey, so the rare item that rolls the same stat name as both its base
// and an affix gets two separate rows instead of one merged number.
export function compareItemStatRows(newItem: EquipmentItem, equipped: EquipmentItem | null): StatCompareRow[] {
  const newEntries = statEntries(enhancedItem(newItem));
  const eqEntries = equipped ? statEntries(enhancedItem(equipped)) : [];
  const rows: StatCompareRow[] = [];
  for (const { key, label, isPct } of STAT_META) {
    const variants = PRIMARY_KEY_SET.has(key) ? [true, false] : [false];
    for (const isBase of variants) {
      const equippedValue = eqEntries.find((e) => e.key === key && e.isBase === isBase)?.value ?? 0;
      const newValue = newEntries.find((e) => e.key === key && e.isBase === isBase)?.value ?? 0;
      if (equippedValue === 0 && newValue === 0) continue;
      rows.push({ label, isPct, equippedValue, newValue, isBase });
    }
  }
  return rows;
}

export interface ItemStatLine { label: string; isPct: boolean; value: number; delta: number; isBase: boolean }

// `target`'s own stat picture — Path of Exile style: one item's real stats,
// each line optionally carrying a delta against whatever's equipped in that
// slot (delta = target's value minus the equipped item's value for that
// same stat, 0 when there's nothing to compare against or nothing changed).
// Unlike compareItemStatRows this only lists stats `target` itself actually
// has — the equipped item's stats that target lacks don't show up at all,
// since this reads as a single tooltip, not a two-item table.
export function itemStatLines(target: EquipmentItem, equipped: EquipmentItem | null): ItemStatLine[] {
  const rows = compareItemStatRows(target, equipped);
  return rows
    .filter((r) => r.newValue !== 0)
    .map((r) => ({ label: r.label, isPct: r.isPct, value: r.newValue, delta: r.newValue - r.equippedValue, isBase: r.isBase }));
}
