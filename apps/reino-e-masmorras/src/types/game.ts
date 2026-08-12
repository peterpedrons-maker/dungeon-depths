export type ClassId =
  | 'guerreiro' | 'mago' | 'ladino' | 'clerigo'
  | 'cavaleiro' | 'paladino' | 'barbaro' | 'arqueiro' | 'cacador'
  | 'feiticeiro' | 'bruxo' | 'druida' | 'bardo' | 'necromante';

// ── Primary attributes: a derived layer fed only by "attribute" skill nodes
// (never a free-allocation pool), converted into CombatStats via fixed
// per-point coefficients in combatStats.ts ──
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
  baseAtk: number;
  baseDef: number;
  critChance: number;
}

export type Rarity = 'comum' | 'incomum' | 'raro' | 'epico' | 'legendario';

export type ItemSlot = 'weapon' | 'body' | 'legs' | 'hands' | 'accessory';
export type SecondaryStatType = 'crit' | 'def' | 'hp' | 'block';

export interface EquipmentItem {
  id: string;
  name: string;
  classId: ClassId;
  slot: ItemSlot;
  rarity: Rarity;
  dmgBonus: number; // weapon's primary stat, 0 on other slots
  defBonus: number; // body/legs/hands primary stat, 0 on other slots
  hpBonus: number; // accessory's primary stat, 0 on other slots
  secondaryStat?: { type: SecondaryStatType; value: number };
}

export interface Equipment {
  weapon: EquipmentItem | null;
  body: EquipmentItem | null;
  legs: EquipmentItem | null;
  hands: EquipmentItem | null;
  accessory: EquipmentItem | null;
}

// ── Skill tree: attribute/passive nodes are always-on stat math; active nodes
// unlock a discrete ability governed by the cooldown/priority/condition engine ──
export type SkillNodeType = 'attribute' | 'passive' | 'active';

export interface SkillEffect {
  dmgPct?: number;        // multiplies attack power
  defPct?: number;        // multiplies defense
  critPct?: number;       // adds to crit chance
  critDmgPct?: number;    // adds to crit damage multiplier
  blockChance?: number;   // chance to halve an incoming hit
  flatBonusDmg?: number;  // flat damage added to every hit
  lowHpDmgScale?: number; // extra damage% scaling with missing HP
  maxHpFlat?: number;     // flat bonus to max HP
  lifestealPct?: number;  // % of damage dealt healed back
  thornsPct?: number;     // % of an incoming hit reflected back at the attacker
  onCritHealPct?: number; // heals for % of max HP whenever the player crits
  attrBonus?: Partial<Attributes>; // present only on "attribute" nodes
  dmgPctVsStatus?: { status: StatusEffectKind; pct: number }; // conditional passive, e.g. "+15% dmg vs poisoned enemy"
}

export type StatusEffectKind = 'poison' | 'burn';

export interface AbilityCondition {
  type: 'always' | 'enemyHasStatus' | 'hpBelow' | 'enemyHpBelow' | 'everyNRounds';
  status?: StatusEffectKind;
  pct?: number;
  n?: number;
}

export interface AbilityEffect {
  kind: 'bigHit' | 'guaranteedCrit' | 'applyStatus' | 'bonusVsStatus' | 'heal' | 'buffDef' | 'buffBlock';
  dmgMult?: number;
  status?: StatusEffectKind;
  statusRounds?: number;
  statusDmgPct?: number; // % of atk dealt per tick
  healPct?: number;
  buffPct?: number;
  buffRounds?: number;
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
  gold: number;
  potions: number;
  bestDepth: number;
  skillPoints: number;
  unlockedSkills: string[]; // node ids, e.g. "guerreiro:furioso:0" — for active nodes, this only means "known"
  equippedAbilities: string[]; // ordered subset of unlocked active-ability ids, actually used in combat (checked top to bottom each round)
  equipment: Equipment;
  inventory: EquipmentItem[];
  buildings: Record<string, number>; // kingdom building id -> level
}

export type EnemyShape = 'goblin' | 'wolf' | 'skeleton' | 'orc' | 'troll' | 'dragon' | 'horror';

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
}

export interface DungeonDef {
  id: string;
  name: string;
  desc: string;
  startDepth: number;
  special?: boolean;
  enemyPool?: EnemyShape[];
  goldMult?: number;
  xpMult?: number;
  dropMult?: number;
  dmgTakenMult?: number;
}

export interface RankEntry {
  name: string;
  classId: ClassId;
  depth: number;
  level: number;
  date: string;
}

export type Screen = 'title' | 'create' | 'game';
export type Section = 'kingdom' | 'buildings' | 'character' | 'skills' | 'merchant' | 'highscore' | 'dungeon';

// ── Combat-facing stat bundle, after class base + level growth + equipment + skill tree + attributes ──
export interface CombatStats {
  atk: number;
  def: number;
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
}

// ── Kingdom buildings: permanent, gold-funded upgrades that persist across runs ──
export interface KingdomBonuses {
  dropChanceBonusPct: number;
  itemQualityBonusPct: number; // Forja: bonus on top of an item's rolled primary stat
  potionHealBonusPct: number;
  xpBonusPct: number;
}
