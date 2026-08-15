export type ClassId =
  | 'guerreiro' | 'mago' | 'ladino' | 'clerigo'
  | 'cavaleiro' | 'paladino' | 'barbaro' | 'arqueiro' | 'cacador'
  | 'feiticeiro' | 'bruxo' | 'druida' | 'bardo' | 'necromante';

// ── Primary attributes: class base (baseAttrs, below) + Character.allocatedAttrs
// (a free-allocation pool the player spends attributePoints into, 1 granted
// per level) — no longer fed by the skill tree at all. Converted into
// CombatStats via fixed per-point coefficients in combatStats.ts ──
export type AttributeKey = 'str' | 'dex' | 'agi' | 'vit' | 'int' | 'wis' | 'luk';
export type Attributes = Record<AttributeKey, number>;

export interface ClassDef {
  id: ClassId;
  name: string;
  color: string;
  desc: string;
  weaponBase: string; // base weapon name, e.g. "Espada"
  bodyBase: string; // base body-armor name, e.g. "Peitoral de Placas"
  legsBase: string; // base leg-armor name, e.g. "Grevas de Ferro"
  handsBase: string; // base hand-armor name, e.g. "Manoplas de Ferro"
  baseHp: number;
  baseAtk: number; // physical power — weapon swings always use this, even for spellcasters
  baseDef: number; // physical defense
  baseMatk: number; // magical power — only spent by abilities cast as spells
  baseMdef: number; // magical defense
  critChance: number;
  baseAttrs: Partial<Attributes>; // starting level-1 attributes, matching the class's priority stats
}

export type Rarity = 'comum' | 'incomum' | 'raro' | 'epico' | 'legendario';

export type ItemSlot = 'weapon' | 'body' | 'legs' | 'hands' | 'offhand' | 'accessory';
// 'atk'/'matk' let the accessory/offhand roll pool reuse the same channels
// weapons and armor already read from (dmgBonus/matkBonus below), instead of
// inventing a parallel vocabulary just for those slots.
export type SecondaryStatType = 'crit' | 'critDmg' | 'def' | 'mdef' | 'hp' | 'block' | 'atk' | 'matk';

// Only set on slot === 'accessory' items — the accessory base type is rolled
// independently of class (unlike offhand, which is 100% determined by the
// wearer's class via OFFHAND_KIND in lib/itemTiers.ts), so it needs its own
// tag to know which stat domain (ACCESSORY_STAT_POOL) it draws from.
export type AccessoryType = 'anel' | 'amuleto' | 'bracelete';

export interface EquipmentItem {
  id: string;
  name: string;
  classId: ClassId;
  slot: ItemSlot;
  rarity: Rarity;
  tier: number; // base tier 1-10 — which rung of the slot's name/power ladder this is (see lib/itemTiers.ts), independent of rarity's affix-count layer
  accessoryType?: AccessoryType;
  dmgBonus: number; // weapon's primary stat, 0 on other slots
  defBonus: number; // body/legs/hands/shield primary stat, 0 on other slots
  hpBonus: number; // accessory (Amuleto) primary stat, 0 on other slots
  matkBonus: number; // foco/Bracelete primary stat, 0 on other slots
  mdefBonus: number; // Amuleto primary stat, 0 on other slots
  critChanceBonus: number; // Anel primary stat, 0 on other slots
  critDmgBonus: number; // Anel primary stat, 0 on other slots
  secondaryStat?: { type: SecondaryStatType; value: number };
  enhanceLevel: number; // Forja upgrade, 0-10 — scales this item's *Bonus fields only, never secondaryStat (see lib/enhancement.ts)
}

export interface Equipment {
  weapon: EquipmentItem | null;
  body: EquipmentItem | null;
  legs: EquipmentItem | null;
  hands: EquipmentItem | null;
  offhand: EquipmentItem | null; // shield or foco/relicário — only classes in OFFHAND_KIND ever have one to equip
  accessory: EquipmentItem | null;
}

// ── Skill tree: "attribute" nodes are always-on SECONDARY stat math (crit,
// vida, defesa, redução de recarga, etc. — never the 7 primary attributes,
// which come only from ClassDef.baseAttrs + Character.allocatedAttrs now);
// "passive" nodes are unique/conditional effects; "active" nodes unlock a
// discrete ability governed by the cooldown/priority/condition engine ──
export type SkillNodeType = 'attribute' | 'passive' | 'active';

export interface SkillEffect {
  dmgPct?: number;        // multiplies attack power
  defPct?: number;        // multiplies physical defense only
  mdefPct?: number;       // multiplies magical defense only
  critPct?: number;       // adds to crit chance
  critDmgPct?: number;    // adds to crit damage multiplier
  blockChance?: number;   // chance to halve an incoming hit
  flatBonusDmg?: number;  // flat physical damage added to every hit
  flatBonusMagicDmg?: number; // flat magical damage added to every hit
  lowHpDmgScale?: number; // extra damage% scaling with missing HP
  maxHpFlat?: number;     // flat bonus to max HP
  lifestealPct?: number;  // % of damage dealt healed back
  thornsPct?: number;     // % of an incoming hit reflected back at the attacker
  onCritHealPct?: number; // heals for % of max HP whenever the player crits
  evasionPct?: number;    // permanent base dodge chance
  accuracyPct?: number;   // permanent base hit chance, offsets enemy evasion
  cooldownReductionPct?: number; // shortens every ability's cooldown, capped in combatStats.ts
  dmgPctVsStatus?: { status: StatusEffectKind; pct: number }; // conditional passive, e.g. "+15% dmg vs poisoned enemy"
}

// Damage-over-time family (poison/burn/bleed all tick identically; curse is
// DOT-shaped too but flavored as a hex). Distinct from crowd control below.
export type StatusEffectKind = 'poison' | 'burn' | 'bleed' | 'curse';

// Action-denial family: stun/sleep skip the affected combatant's entire
// round (no attack, no ability); silence only blocks ability use, falling
// back to a plain attack. Sleep additionally breaks early on taking damage.
export type CrowdControlKind = 'stun' | 'sleep' | 'silence';

// Generic buff/debuff stat channel — sign of statModPct decides buff vs
// debuff (e.g. 'atk' +pct = Attack Up, -pct = Attack Down). Covers most of
// the game's named buffs/debuffs through one mechanism instead of a bespoke
// field per named effect. 'accuracy'/'evasion' are new: without an active
// modifier every attack still always hits (today's behavior); only a statMod
// ability introduces a miss chance. 'dmgTakenPct' covers both Damage
// Reduction (negative) and Vulnerability (positive). 'defPenPct' covers
// Physical/Magic Penetration (ignores a % of the target's defense).
export type StatModStat = 'atk' | 'def' | 'critChance' | 'critDmgMult' | 'accuracy' | 'evasion' | 'dmgTakenPct' | 'defPenPct' | 'lifestealPct';

export interface AbilityCondition {
  type: 'always' | 'enemyHasStatus' | 'hpBelow' | 'enemyHpBelow' | 'everyNRounds' | 'selfDebuffed';
  status?: StatusEffectKind;
  pct?: number;
  n?: number;
}

export interface AbilityEffect {
  kind:
    | 'bigHit' | 'guaranteedCrit' | 'applyStatus' | 'bonusVsStatus' | 'heal' | 'buffDef' | 'buffBlock'
    | 'crowdControl' | 'statMod' | 'shield' | 'regen' | 'dispel' | 'immunity' | 'haste' | 'berserk' | 'taunt'
    | 'lifestealBuff' | 'atkBuff';
  // Which power/defense channel this hit rolls against — physical uses
  // atk/def (weapon swings always do, regardless of class), magical uses
  // matk/mdef. Omitted = physical, UNLESS the caster's class is in
  // MAGICAL_CLASSES, in which case it defaults to magical (a Mago's spells
  // are magical by default without needing every one tagged individually).
  dmgType?: 'physical' | 'magical';
  dmgMult?: number;
  status?: StatusEffectKind;
  statusRounds?: number;
  statusDmgPct?: number; // % of atk dealt per tick
  healPct?: number;
  buffPct?: number;
  buffRounds?: number;
  // crowdControl
  cc?: CrowdControlKind;
  ccRounds?: number;
  // statMod — target 'self' fires as a bonus action like heal/buffDef;
  // target 'enemy' competes for the round's attack action like applyStatus
  statMod?: StatModStat;
  statModPct?: number;
  statModRounds?: number;
  statModTarget?: 'self' | 'enemy';
  // shield: absorbs incoming damage before HP, sized as % of caster's max HP
  shieldPct?: number;
  // regen: heals a % of max HP at the start of each of the caster's rounds
  regenPct?: number;
  regenRounds?: number;
  // immunity: blocks new debuffs/CC/DOT from being applied to the caster
  immunityRounds?: number;
  // haste: doubles the caster's own cooldown decay for its duration
  hasteRounds?: number;
  // berserk: simultaneous self atk buff + def debuff
  berserkAtkPct?: number;
  berserkDefPct?: number;
  berserkRounds?: number;
  // lifestealBuff / atkBuff: pure self buffs (no attack roll), reusing
  // buffPct/buffRounds like buffDef/buffBlock do
}

export interface AbilityDef {
  id: string; // matches the owning SkillNode's id
  name: string;
  desc: string;
  cooldown: number; // in combat rounds
  condition: AbilityCondition;
  effect: AbilityEffect;
}

export interface SkillNode {
  id: string;
  name: string;
  desc: string;
  type: SkillNodeType;
  effect: SkillEffect;
  ability?: AbilityDef; // present only when type === 'active'
  prereqIds: string[]; // OR logic — unlockable once ANY prereq is unlocked; empty = root node
}

export interface SkillPath {
  id: string;
  name: string;
  color: string;
  nodes: SkillNode[]; // 15 nodes forming a branching graph — see prereqIds, not array order
}

export interface Character {
  name: string;
  classId: ClassId;
  level: number;
  xp: number;
  xpToNext: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  matk: number;
  mdef: number;
  gold: number;
  potions: number;
  potionThreshold: number; // 0-1 HP fraction — auto-drinks a potion in combat once HP falls at or below this, subject to its own cooldown
  bestDepth: number;
  skillPoints: number; // granted every 2 levels — spent 1-per-node in the skill tree
  attributePoints: number; // granted every level — spent freely across the 7 primary attributes
  allocatedAttrs: Attributes; // player-chosen distribution of attributePoints already spent
  unlockedSkills: string[]; // node ids, e.g. "guerreiro:furioso:0" — for active nodes, this only means "known"
  equippedAbilities: string[]; // ordered subset of unlocked active-ability ids, actually used in combat (checked top to bottom each round)
  abilityThresholds: Record<string, number>; // ability id -> custom 0-1 HP fraction, overriding its hpBelow condition's default pct when the player has customized it on the loadout screen
  equipment: Equipment;
  inventory: EquipmentItem[];
  buildings: Record<string, number>; // kingdom building id -> level
}

export type EnemyShape =
  | 'goblin' | 'wolf' | 'skeleton' | 'orc' | 'troll' | 'dragon' | 'horror'
  // Região 1 — Ruínas Superficiais (skeleton reused above)
  | 'ruinBat' | 'acidSlime' | 'ruinBandit' | 'carrionCrow' | 'boneKing'
  // Região 1 — Caverna dos Goblins (goblin reused above)
  | 'goblinShaman' | 'goblinThrower' | 'goblinFanatic' | 'goblinWolfRider' | 'grash'
  // Região 1 — Cripta do Tesouro
  | 'zombieLooter' | 'stoneGuardian' | 'greedyWraith' | 'wrappedMummy' | 'mimicChest' | 'cursedCustodian'
  // Região 1 — Pântano Podre
  | 'poisonToad' | 'swampViper' | 'crawlingBog' | 'cursedWisp' | 'rottingGator' | 'mudMother'
  // Região 1 — Covil de Aranhas
  | 'huntingSpider' | 'venomSpider' | 'giantSpider' | 'spiderlingSwarm' | 'darkWeaver' | 'blackMatriarch'
  // Bosses reaproveitados (Região 2+, sem arte própria ainda — placeholder no sprite do shape base)
  | 'horrorAncient' | 'orcWarlord' | 'trollChieftain' | 'dragonElder' | 'skeletonLord';

// A signature debuff each enemy shape has a chance to land alongside its
// normal attack each round — gives every enemy type a distinct combat feel
// without needing a full enemy ability/priority system of its own.
export interface EnemyProc {
  chance: number; // 0-1, rolled once per enemy attack
  label: string; // Portuguese flavor line appended to the attack log
  status?: StatusEffectKind; // DOT proc
  cc?: CrowdControlKind; // action-denial proc
  statMod?: StatModStat; // stat debuff proc (applied to the player)
  statModPct?: number;
  rounds: number;
}

export interface EnemyTier {
  shape: EnemyShape;
  name: string;
  color: string;
  minDepth: number;
  hp: number;
  atk: number;
  def: number;
  xp: number;
  gold: number;
  proc?: EnemyProc;
  evasion?: number; // innate dodge chance some agile/spectral shapes carry — lets Evasion Down debuffs matter against them
  matk?: number; // magical power — only used if atkType is 'magical'
  mdef?: number; // magical defense — every shape has one, since the player may cast spells regardless of the enemy's own attack type
  atkType?: 'physical' | 'magical'; // omitted = physical
  isBoss?: boolean; // true only for a dungeon's own boss entry, spawned exclusively at DungeonDef.bossDepth
}

export interface EnemyInstance {
  name: string;
  shape: EnemyShape;
  color: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  xpReward: number;
  goldReward: number;
  proc?: EnemyProc;
  evasion?: number;
  matk?: number;
  mdef?: number;
  atkType?: 'physical' | 'magical';
  isBoss?: boolean;
}

export interface DungeonDef {
  id: string;
  name: string;
  desc: string;
  startDepth: number;
  levelReq: number; // minimum character level to enter — shown locked on the map below this
  special?: boolean;
  enemyPool?: EnemyShape[];
  goldMult?: number;
  xpMult?: number;
  dropMult?: number;
  dmgTakenMult?: number;
  bossDepth: number; // fixed depth the boss spawns at — defeating it clears the dungeon and ends the run
  boss: EnemyShape;
  miniBossDepths?: number[]; // depths shown as milestone markers on the progress bar; no dungeon defines any yet
  itemTier: number; // 1-10 — the base tier (lib/itemTiers.ts) every item found in this dungeon rolls at, hand-authored like bossDepth so item power tracks dungeon progression, not the in-run depth counter
}

export interface RankEntry {
  name: string;
  classId: ClassId;
  depth: number;
  level: number;
  date: string;
}

export type Screen = 'title' | 'create' | 'game';
export type Section = 'kingdom' | 'buildings' | 'character' | 'skills' | 'merchant' | 'highscore' | 'dungeon-select' | 'dungeon';

// ── Combat-facing stat bundle, after class base + level growth + equipment + skill tree + attributes ──
export interface CombatStats {
  atk: number;
  def: number;
  matk: number;
  mdef: number;
  critChance: number;
  critDmgMult: number;
  blockChance: number;
  maxHpBonus: number;
  lifestealPct: number;
  thornsPct: number;
  onCritHealPct: number;
  dmgPctVsPoison: number; // conditional passive dmg bonus while the enemy is poisoned
  dmgPctVsBurn: number;   // conditional passive dmg bonus while the enemy is burning
  supportPowerPct: number; // WIS-derived: scales heal/buff ability magnitudes
  dropChanceBonusPct: number; // LUK-derived, stacks with the Kingdom's Forja bonus
  itemQualityBonusPct: number; // LUK-derived, stacks with the Kingdom's Forja bonus
  evasion: number; // permanent base dodge chance, from skill-tree secondary-attribute nodes
  accuracy: number; // permanent base hit chance, from skill-tree secondary-attribute nodes
  cooldownReductionPct: number; // shortens ability cooldowns, capped at 50%
}

// ── Kingdom buildings: permanent, gold-funded upgrades that persist across runs ──
export interface KingdomBonuses {
  dropChanceBonusPct: number;
  itemQualityBonusPct: number; // Forja: bonus on top of an item's rolled primary stat
  potionHealBonusPct: number;
  xpBonusPct: number;
}
