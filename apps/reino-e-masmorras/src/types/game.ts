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
// inventing a parallel vocabulary just for those slots. The 9 after 'matk'
// are affix-only — they have no matching primary *Bonus field on
// EquipmentItem, they only ever show up inside an item's secondaryStats roll
// (see lib/equipment.ts's SLOT_AFFIX_POOL) — added so gear finally has a way
// to grant Evasão/Precisão/Tenacidade/Velocidade/Roubo de Vida/Espinhos/
// Redução de Recarga/sorte de item, none of which any equipment slot could
// touch before.
export type SecondaryStatType =
  | 'crit' | 'critDmg' | 'def' | 'mdef' | 'hp' | 'block' | 'atk' | 'matk'
  | 'evasion' | 'accuracy' | 'tenacity' | 'speed' | 'lifesteal' | 'thorns' | 'cdr' | 'itemFind' | 'itemQuality';

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
  cdrBonus: number; // Foco's alternate primary stat (50/50 vs matkBonus), 0 on other slots
  // Every item rolls 1+ of these (count driven by rarity — see
  // AFFIX_COUNT_RANGE in lib/equipment.ts), sampled without repeats from a
  // slot-themed pool. Always an array, even for a single roll, so every
  // consumer (combat aggregation, tooltips) has one shape to handle instead
  // of a legacy singular-vs-plural split.
  secondaryStats: { type: SecondaryStatType; value: number }[];
  enhanceLevel: number; // Forja upgrade, 0-10 — scales this item's *Bonus fields only, and (see affixBoosts below) one chosen affix per level
  // Parallel to secondaryStats — affixBoosts[i] is the cumulative fractional
  // bonus (e.g. 0.25 = +25%) applied to secondaryStats[i].value by
  // enhancedItem() in lib/enhancement.ts. Grows only when that specific
  // affix is the one picked (by Runa de Aprimoramento or, lacking one, at
  // random) on a successful Forja level-up — see AFFIX_PCT_BY_LEVEL.
  // Undefined/missing entries read as 0 (old saves, or an affix added after
  // generation — see originalAffixCount below).
  affixBoosts?: number[];
  // secondaryStats.length at generateItem() time — lets Resetar (see
  // lib/enhancement.ts's resetItem) tell an originally-rolled affix apart
  // from one a Runa de Aprimoramento added later to a Comum item that rolled
  // zero affixes (see Ferreiro's rune flow), so resetting can strip the
  // added one instead of just zeroing its boost. Undefined reads as "every
  // current affix is original" (old saves, pre-rune items).
  originalAffixCount?: number;
  // false only while sitting unpurchased in Character.merchantStock — name,
  // icon and stats are hidden in the UI until the player buys it, at which
  // point it's set back to true (or just dropped, since undefined === true).
  // Never false anywhere else (equipped or in the player's own inventory).
  identified?: boolean;
  // Top-left cell of this item's footprint in the inventory grid (see
  // lib/inventoryGrid.ts) — undefined while equipped, always set once an
  // item is actually sitting in Character.inventory.
  gridX?: number;
  gridY?: number;
}

// A Runa de Aprimoramento stack — one entry per distinct (rarity, tier)
// combination the player owns, count-stacked like a potion instead of
// occupying individual grid cells (there's no per-item variance to track
// like equipment has — every rune of the same rarity+tier is identical).
// Usable at the Ferreiro on an item whose own tier/rarity it's >= both of
// (see lib/runes.ts's canUseRuneOn).
export interface RuneStack {
  rarity: Rarity;
  tier: number; // 1-10
  count: number;
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

// Composable conditions (see lib/barbarian.ts's evalAbilityCondition) —
// 'all'/'any'/'not' recurse into `conditions` ('not' only ever reads its
// first entry), everything else is a leaf test evaluated against the live
// AbilityConditionContext built by DungeonPanel.conditionMet(). Added for
// the Bárbaro redesign's resource/state-gated kit (e.g. "Fúria >= 20 AND
// not already in Frenesi"), generic so any future class's kit can compose
// the same leaves instead of each condition needing its own bespoke field.
export interface AbilityCondition {
  type:
    | 'always' | 'enemyHasStatus' | 'hpBelow' | 'enemyHpBelow' | 'everyNRounds' | 'selfDebuffed'
    | 'all' | 'any' | 'not'
    | 'resourceAtLeast' | 'resourceBelow' | 'resourceAtMost' | 'stateActive' | 'stateInactive'
    | 'painAtLeastPct' | 'enemyWoundsAtLeast' | 'enemyWoundsEqual';
  status?: StatusEffectKind;
  pct?: number;
  n?: number;
  conditions?: AbilityCondition[]; // all/any (every entry) / not (only conditions[0])
  resource?: 'fury'; // resourceAtLeast/resourceBelow
  value?: number; // resourceAtLeast/resourceBelow threshold
  state?: 'frenzy'; // stateActive/stateInactive
  stacks?: number; // enemyWoundsAtLeast
}

export interface AbilityEffect {
  kind:
    | 'bigHit' | 'guaranteedCrit' | 'applyStatus' | 'bonusVsStatus' | 'heal' | 'buffDef' | 'buffBlock'
    | 'crowdControl' | 'statMod' | 'shield' | 'regen' | 'dispel' | 'immunity' | 'haste' | 'berserk' | 'taunt'
    | 'lifestealBuff' | 'atkBuff'
    // Bárbaro redesign — see lib/barbarian.ts. furyBoost/furyMaxFrenzy/
    // painGuard/wallStance/lastStand/bloodFeast are self-targeted (added to
    // SELF_ABILITY_KINDS in DungeonPanel.tsx); the fury*/wound*/pain* fields
    // below layer onto ANY kind (mainly bigHit/guaranteedCrit) instead of
    // each combination needing its own kind — see AbilityDef.extraEffects
    // for the general multi-effect mechanism this pairs with.
    | 'furyBoost' | 'furyMaxFrenzy' | 'painGuard' | 'wallStance' | 'lastStand' | 'bloodFeast';
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

  // ── Bárbaro redesign fields (lib/barbarian.ts) — all optional, layered on
  // top of whichever `kind` above actually resolves the ability, instead of
  // each combination (dano + Ferida, consumir Dor + dano + Fúria, ...)
  // needing its own kind. furyCost is deducted the instant an ability is
  // CHOSEN (before the hit roll), same round an ability with it also always
  // goes on cooldown regardless of hit/miss — see DungeonPanel's playerAct.
  furyCost?: number;
  furyGainOnHit?: number; // offense: flat Fúria on a successful hit
  furyGainOnCrit?: number; // offense: additional Fúria if that hit crit
  furyGainFlat?: number; // self ability: flat Fúria with no hit roll (furyBoost)
  woundStacksOnHit?: number; // offense: applies N Ferida stacks on a successful hit
  renewWoundsOnHit?: boolean; // offense: refresh Ferida duration without adding stacks
  consumeWoundsOnHit?: boolean; // offense: clears all Ferida stacks after a successful hit
  dmgMultPerWoundStack?: number; // offense: extra dmgMult per CURRENT Ferida stack, read before consumption
  painRedirectPct?: number; // painGuard: % of direct dmg-to-HP redirected to Dor while active
  painConsumeMaxPct?: number; // max % of effective max HP of Dor this ability cancels/spends
  painConsumeDmgMultPer2Pct?: number; // offense: +dmgMult per 2% max HP of Dor actually consumed
  furyPerHitTaken?: number; // wallStance: Fúria gained each enemy hit that lands while active
}

export interface AbilityDef {
  id: string; // matches the owning SkillNode's id
  name: string;
  desc: string;
  cooldown: number; // in combat rounds
  condition: AbilityCondition;
  effect: AbilityEffect;
  // General multi-effect support (see Bárbaro redesign, section 13 of its
  // spec) — resolved right after `effect` itself, in order, through the same
  // small per-kind branches. Lets an ability do more than one thing (e.g.
  // Resistência Absoluta: cleanse + consume Dor + gain Fúria + temporary
  // damage reduction) without inventing a new AbilityEffect.kind per
  // combination.
  extraEffects?: AbilityEffect[];
}

// Bárbaro redesign, section 6 — purely a DISPLAY concern (the "ESCALA:"
// block on a node's tooltip/card in SkillTree.tsx), separate from whatever
// mechanical bonus DungeonPanel.tsx actually computes for that node. `role`
// is a free label because a single node can carry more than one relevant
// axis (e.g. "FOR — Principal" and "Feridas — Mecânica" on the same node);
// `attribute` is omitted for a non-attribute-tied role ('mecanica'/'fixo').
export type ScalingRole = 'principal' | 'secundario' | 'terciario' | 'mecanica' | 'fixo';
export interface ScalingEntry {
  attribute?: AttributeKey;
  label: string; // e.g. "FOR", "Dor", "Feridas", "Fixo"
  role: ScalingRole;
  description: string;
}

export interface SkillNode {
  id: string;
  name: string;
  desc: string;
  type: SkillNodeType;
  effect: SkillEffect;
  ability?: AbilityDef; // present only when type === 'active'
  prereqIds: string[]; // OR logic — unlockable once ANY prereq is unlocked; empty = root node
  // Optional "ESCALA:" tooltip metadata (see ScalingEntry above) — never
  // inferred, only ever hand-authored per node so it can't drift from what
  // the node's mechanic in DungeonPanel.tsx actually does.
  scaling?: ScalingEntry[];
  // Universal class-mechanic explainer system (see lib/classMechanics.ts) —
  // ids of the ClassMechanic entries this node's own effect/ability touches
  // (e.g. ['barbaro:fury', 'barbaro:wounds']), rendered as tappable chips at
  // the bottom of the node's popup. Never inferred from text — hand-authored
  // per node, same discipline as `scaling`.
  mechanicRefs?: string[];
}

// ── Universal class-mechanic explainer system ──
// A generic, reusable data model for any class's exclusive resources/stacks/
// marks/postures/states/etc. (Fúria, Frenesi, Dor, Feridas for Bárbaro today;
// Determinação/Retaliação/Momentum/Ordens for a future Cavaleiro, and so on).
// Nothing in the UI layer ever branches on classId or on a mechanic's name —
// every component here takes a ClassMechanic (or its id) and renders it
// generically. See components/ClassMechanics.tsx.
export type MechanicCategory = 'resource' | 'state' | 'stack' | 'mark' | 'other';

export interface ClassMechanic {
  id: string; // stable id, e.g. "barbaro:fury" — referenced by SkillNode.mechanicRefs
  classId: ClassId;
  name: string;
  category: MechanicCategory;
  shortDescription: string; // 1-2 sentences, for the quick tap-to-explain popup
  fullDescription: string; // full explanation, for the "Mecânicas da Classe" panel
}

// One entry per attribute the class actually cares about, for the "Atributos
// Importantes" section of the class mechanics panel — explains WHY the
// attribute matters for this class's kit, not just its raw combatStats.ts
// coefficient.
export interface ClassAttributeNote {
  attribute: AttributeKey;
  label: string; // e.g. "FOR"
  role: string; // e.g. "Principal", "Principal defensivo", "Secundário", "Terciário"
  description: string;
}

// Per-specialization (SkillPath) identity summary for the class mechanics
// panel — keyed by the path's own id (e.g. "furia", "resistencia").
export interface ClassSpecializationNote {
  pathId: string;
  identity: string; // e.g. "FOR + Fúria + Frenesi."
  style: string; // e.g. "Alto risco, alto dano."
  loop: string; // e.g. "Gerar Fúria → entrar em Frenesi → escolher entre manter ou gastar o recurso."
}

// Named combination of two specializations, when the class was designed
// with cross-path synergy in mind — optional, only where it adds real signal.
export interface ClassCombinationNote {
  pathIds: [string, string];
  name: string; // e.g. "Fúria + Selvageria"
  description: string; // e.g. "Maior dano, maior risco."
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
  // Runas de Aprimoramento owned — stacked by (rarity, tier) like potions,
  // never merged across a different rarity or tier (see lib/runes.ts).
  // Consumed at the Ferreiro to choose which affix improves on a Forja
  // level-up instead of leaving it to chance.
  runes: RuneStack[];
  // The Mercador's current stock (see lib/merchantStock.ts) — re-rolled only
  // by maybeRefreshMerchantStock, once merchantRefreshedAt is old enough
  // (see MERCHANT_REFRESH_MS), checked when the shop is opened — never by
  // finishing a run and never just from opening/closing the shop on its
  // own, so the player can't farm a good roll by walking in and out or by
  // repeating dungeons back to back.
  merchantStock: EquipmentItem[];
  // Date.now() of the last stock refresh — undefined/0 on an old save reads
  // as "due for a refresh immediately" (see storage.ts's backfill).
  merchantRefreshedAt?: number;
  // Modo Ferro: set once at creation, never changed after. On death inside a
  // dungeon (see App.tsx's handleRunEnd) an ironMode character is deleted
  // for good instead of the normal heal-and-return-to-Reino — no second
  // chances. Never gated behind anything; any class/build can opt in.
  ironMode?: boolean;
  // Bestiário — every enemy shape ever killed, incremented on each kill
  // (see DungeonPanel.tsx). Absence of a key means never encountered.
  kills?: Partial<Record<EnemyShape, number>>;
  // Dungeon ids (DungeonDef.id) this character has cleared at least once —
  // a normal-mode clear unlocks that dungeon's Modo Pesadelo (see
  // DungeonLoadout.tsx), a Pesadelo clear separately unlocks Títulos tied
  // to it. Neither list ever shrinks.
  clearedDungeons?: string[];
  clearedNightmareDungeons?: string[];
  // Títulos (lib/titles.ts) are computed live from character state, never
  // stored as an unlocked-list — only which one is currently equipped (or
  // null) is persisted. Shown next to the name in TopBar.
  equippedTitle?: string | null;
}

export type EnemyShape =
  | 'goblin' | 'wolf' | 'skeleton' | 'dragon'
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
  // Região 2 — Torre Amaldiçoada
  | 'gargoyle' | 'spectralMage' | 'cursedKnight' | 'watchingEye' | 'crawlingShadow' | 'fallenArchmage'
  // Região 2 — Minas Abandonadas
  | 'cursedMiner' | 'oreGolem' | 'koboldRaider' | 'batSwarm' | 'gasWisp' | 'oreTitan'
  // Região 2 — Floresta Amaldiçoada
  | 'corruptedEnt' | 'ghostWolf' | 'darkFairy' | 'cursedBear' | 'stranglingVine' | 'forestHeart'
  // Região 2 — Covil dos Dragões (dragon acima, agora bossificado como Dragão Jovem, é o chefe)
  | 'dragonHatchling' | 'wildWyvern' | 'scaledGuardian' | 'draconicCultist' | 'fireSerpent'
  // Região 2 — Necrópole Esquecida (skeletonLord abaixo continua o chefe, já combinava)
  | 'darkReaper' | 'deathCrow' | 'boneExecutioner' | 'wailingGhost' | 'graveWorm' | 'skeletonLord'
  // Região 2 — Ruínas Élficas
  | 'corruptedGuardian' | 'whisperingVine' | 'ruinBeast' | 'elvenWraith' | 'crystalGolem' | 'ancestralGuardian'
  // Região 2 — Arena de Sangue
  | 'cursedGladiator' | 'arenaBeast' | 'maskedExecutioner' | 'beastTamer' | 'fallenChampion' | 'grandChampion'
  // Alvos de Caçada (lib/hunts.ts) — superchefes opcionais e reaproveitáveis, bem mais fortes que o chefe normal do mesmo nível
  | 'boneTyrant' | 'swampLeviathan' | 'infernalWyrm'
  // Região 3 — Fortaleza Orc
  | 'orcWarrior' | 'orcArcher' | 'orcShaman' | 'orcBerserker' | 'orcStandardBearer' | 'orcWarchief'
  // Região 3 — Labirinto de Gelo
  | 'iceElemental' | 'frostWolf' | 'glacialBat' | 'iceWraith' | 'frozenSentinel' | 'iceMonarch'
  // Região 3 — Templo Afundado (fork)
  | 'drownedAcolyte' | 'frozenPriest' | 'lakeWraith' | 'submergedGuardian' | 'iceEel' | 'sunkenHighPriest'
  // Região 3 — Cavernas de Cristal (fork)
  | 'crystalBat' | 'crystalSpider' | 'prismGolem' | 'crystalWisp' | 'glimmeringStalker' | 'crystalSovereign'
  // Região 3 — Covil do Lobo Alfa
  | 'alphaWolfPup' | 'direWolf' | 'snowStalker' | 'packHunter' | 'frostFangWolf' | 'alphaDireWolf'
  // Região 3 — Catacumbas Reais
  | 'royalSkeleton' | 'cryptSentinel' | 'boneNoble' | 'spectralChamberlain' | 'entombedKnight' | 'royalLich'
  // Região 3 — Poço sem Fundo (especial)
  | 'wellCrawler' | 'voidTendril' | 'drowningWraith' | 'abyssalStalker' | 'hollowDweller' | 'pitDweller'
  // Região 4 — Covil da Aranha-Rainha
  | 'jungleSpider' | 'silkStalker' | 'spiderBrood' | 'webWeaverJungle' | 'venomousBroodling' | 'spiderQueen'
  // Região 4 — Cidadela em Ruínas
  | 'ruinedSentinel' | 'vineWarrior' | 'crumblingGolem' | 'junglePhantom' | 'overgrownGuardian' | 'citadelGuardian'
  // Região 4 — Santuário Profanado (fork)
  | 'defiledPriest' | 'profaneIdol' | 'corruptedAcolyte' | 'hexedStatue' | 'ritualCultist' | 'profaneHighPriest'
  // Região 4 — Mina de Obsidiana (fork)
  | 'obsidianGolem' | 'magmaBat' | 'obsidianMiner' | 'emberWraith' | 'obsidianBeetle' | 'obsidianColossus'
  // Região 4 — Selva Esquecida
  | 'forgottenGuardian' | 'junglePredator' | 'ancientVine' | 'feralJaguar' | 'sporeling' | 'forgottenColossus'
  // Região 4 — Fortaleza dos Ossos
  | 'boneSoldier' | 'boneArcher' | 'marrowGolem' | 'boneCatapultBeast' | 'ossuaryWraith' | 'boneWarlord'
  // Região 4 — Torre dos Ecos (especial)
  | 'echoWraith' | 'resonantSpecter' | 'mirroredHorror' | 'echoSentinel' | 'hollowChant' | 'echoSovereign'
  // Região 5 — Abismo de Gelo
  | 'glacialWraith' | 'abyssalIceElemental' | 'frostcrawler' | 'iceBehemoth' | 'hollowFrost' | 'glacialAbyssLord'
  // Região 5 — Ruínas Vulcânicas
  | 'magmaGolem' | 'ashWraith' | 'emberBat' | 'volcanicStalker' | 'cinderHound' | 'infernoColossus'
  // Região 5 — Covil do Dragão Ancião (fork)
  | 'ancientDrakeling' | 'dragonCultistElder' | 'scaleWyrmling' | 'drakeGuardian' | 'emberDrake' | 'elderDragon'
  // Região 5 — Salão dos Titãs (fork)
  | 'titanGuardian' | 'stoneColossus' | 'ancientSentinel' | 'runicGolem' | 'titanWarden' | 'fallenTitan'
  // Região 5 — Necrópole Real
  | 'royalWraith' | 'ashenGuard' | 'cursedEmbalmer' | 'royalMummy' | 'deathHerald' | 'royalNecromancer'
  // Região 5 — Palácio Submerso
  | 'drownedCourtier' | 'submergedGuard' | 'tidalWraith' | 'coralHorror' | 'deepOneAcolyte' | 'drownedMonarch'
  // Região 5 — Arena do Campeão (especial)
  | 'championGladiator' | 'arenaChampionBeast' | 'veteranDuelist' | 'arenaWarlord' | 'bloodiedChampion' | 'eternalChampion';

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

// A real alternative action an enemy can take instead of its plain attack —
// distinct from EnemyProc (a small chance-based rider ON the plain attack).
// Rolled by DungeonPanel's pickEnemyAbility() only when off cooldown, and
// only a fraction of the time even then (useChance), so it reads as a
// signature move the enemy sometimes breaks out, not its default action.
// No icon/art needed — it only ever shows up as combat-log text, same as
// EnemyProc. Deliberately capped at one per shape for this pass; bosses
// don't have one yet (that's the "boss phases" follow-up).
export type EnemyAbilityKind = 'bigHit' | 'lifestealHit' | 'statusBite' | 'controlSlam' | 'weakenNova' | 'stealGold';
export interface EnemyAbilityEffect {
  kind: EnemyAbilityKind;
  dmgMult?: number; // bigHit/lifestealHit/statusBite/controlSlam/weakenNova — multiplies the normal attack roll (small/no hit for the two debuff kinds)
  lifestealPct?: number; // lifestealHit — fraction of the damage dealt healed back to the enemy
  status?: StatusEffectKind; statusRounds?: number; // statusBite — guaranteed application, unlike EnemyProc's chance roll
  cc?: CrowdControlKind; ccRounds?: number; // controlSlam — guaranteed application
  statMod?: StatModStat; statModPct?: number; statModRounds?: number; // weakenNova — guaranteed application
  goldPct?: number; // stealGold — fraction of the player's current gold, no damage roll at all
}
export interface EnemyAbility {
  id: string;
  name: string; // Portuguese flavor name, shown as a log tag ("... [Mordida Vampírica]")
  cooldown: number; // same round-count unit envTick decays player ability cooldowns in
  useChance: number; // 0-1, rolled once per round it's off cooldown
  effect: EnemyAbilityEffect;
}

// A boss-only HP-threshold transition — no new art, just a one-time
// telegraphed punish plus a permanent escalation for the rest of the fight,
// so a boss reads as an actual encounter with a story arc instead of a
// flat damage sponge. Regular (non-boss) enemies never carry these.
export interface BossPhase {
  hpPct: number; // enters this phase once the boss's HP drops to/below this fraction of its max (e.g. 0.66)
  name: string; // short phase label shown next to the boss's name in its HP bar
  transitionMsg: string; // one-time combat-log line fired the instant the phase starts
  atkMult?: number; // multiplies the boss's atk/matk for the rest of the fight (stacks with any earlier phase)
  cc?: CrowdControlKind; ccRounds?: number; // guaranteed CC applied to the player once, as the transition's punish
  extraAbilities?: EnemyAbility[]; // added to the boss's ability pool from this phase on
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
  abilities?: EnemyAbility[];
  evasion?: number; // innate dodge chance some agile/spectral shapes carry — lets Evasion Down debuffs matter against them
  matk?: number; // magical power — only used if atkType is 'magical'
  mdef?: number; // magical defense — every shape has one, since the player may cast spells regardless of the enemy's own attack type
  atkType?: 'physical' | 'magical'; // omitted = physical
  isBoss?: boolean; // true only for a dungeon's own boss entry, spawned exclusively at DungeonDef.bossDepth
  phases?: BossPhase[]; // isBoss only — HP-threshold escalations, checked in ascending hpPct-descending order as the fight progresses
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
  abilities?: EnemyAbility[];
  evasion?: number;
  matk?: number;
  mdef?: number;
  atkType?: 'physical' | 'magical';
  isBoss?: boolean;
  isElite?: boolean; // a milestone encounter at one of the dungeon's miniBossDepths — boosted stats/rewards, same shape roster, no bespoke art needed
  phases?: BossPhase[];
  // Bárbaro-only Ferida stacks (lib/barbarian.ts) — a bespoke DOT mechanic,
  // deliberately not reusing StatusInstance/StatusEffectKind (see the
  // redesign spec's "não usar simplesmente o array atual de bleed"):
  // stacking to 5, each application renews ALL stacks' duration, and its
  // damage is a % of the Bárbaro's own current ATK, not a fixed roll like
  // poison/burn/bleed. Absent/undefined = no Feridas active.
  barbarianWounds?: { stacks: number; ticksLeft: number };
}

export interface DungeonDef {
  id: string;
  name: string;
  desc: string;
  startDepth: number;
  // Kept for flavor/display and as the CP-anchor calibration reference (see
  // instanceFromTier) even though it no longer gates entry for non-special
  // dungeons — see unlockAfter below and isDungeonUnlocked() in dungeons.ts.
  levelReq: number;
  special?: boolean;
  // Dungeon ids (OR logic — unlocked once ANY is cleared) that unlock this
  // one. Undefined/empty on a non-special dungeon = always unlocked (the
  // start of a chain, e.g. Ruínas Superficiais). Ignored entirely on a
  // `special` dungeon, which keeps the old levelReq gate instead — the
  // "algumas exceções pras dungeons especiais" the level-gate removal asked
  // for, since a bonus/side dungeon (Cripta, Torre, Arena) isn't part of the
  // mainline chain a player is expected to clear in order.
  unlockAfter?: string[];
  enemyPool?: EnemyShape[];
  goldMult?: number;
  xpMult?: number;
  dropMult?: number;
  dmgTakenMult?: number;
  bossDepth: number; // fixed depth the boss spawns at — defeating it clears the dungeon and ends the run
  boss: EnemyShape;
  miniBossDepths?: number[]; // depths shown as milestone markers on the progress bar; no dungeon defines any yet
  itemTier: number; // 1-10 — the base tier (lib/itemTiers.ts) every item found in this dungeon rolls at, hand-authored like bossDepth so item power tracks dungeon progression, not the in-run depth counter
  // Hand-authored per-dungeon knob (see lib/enemies.ts's instanceFromTier) —
  // scales every enemy in the dungeon on top of the normal depth/regular-vs-
  // boss curve, calibrated against an "anchor" player (roughly levelReq-2,
  // geared for what that region expects — see dungeons.ts) instead of the
  // old one-curve-fits-every-dungeon approach. 1 = the curve's own baseline;
  // below 1 softens a dungeon (early Região 1, still teaching the player),
  // above 1 tightens one (later regions, expects the player to actually be
  // geared up). Omitted = 1.
  difficultyMult?: number;
  isHunt?: boolean; // lib/hunts.ts entries only — startDepth === bossDepth (the fight IS the boss), stats get an extra multiplier on top of the normal boss curve, and the guaranteed kill-drop forces a high rarity
  // Never set on a DUNGEONS entry itself — GameShell.tsx builds a runtime
  // copy with this (and goldMult/dropMult/xpMult bumped) when the player
  // arms Modo Pesadelo on the loadout screen for an already-cleared
  // dungeon. lib/enemies.ts's spawnEnemy reads it to scale every enemy in
  // the run (not just the boss, unlike a Caçada).
  isNightmare?: boolean;
}

export interface RankEntry {
  name: string;
  classId: ClassId;
  cp: number; // computeCombatPower() at run-end — the ranking's tiebreaker for same-level entries
  level: number;
  date: string;
  ironMode?: boolean; // badges a hardcore run on the leaderboard — the run that ended this character's life, or their best retreat/victory while still alive
  // Snapshot of the 6 equipment slots at run-end, so RankingScreen can show
  // what a leaderboard entry is actually wearing when the player clicks it
  // — a separate copy frozen at submit time, not a live reference to the
  // character (whoever's climbing the board keeps playing and re-gearing
  // after their row was written).
  equipment?: Equipment;
  // Same "frozen snapshot" reasoning as equipment above, applied to the two
  // cosmetic flexes the Ranking screen is actually for: the title equipped
  // on the character (Character.equippedTitle, looked up against
  // lib/titles.ts's name at submit time since only the id would otherwise
  // survive a titles.ts rename) and the color from the account's equipped
  // Prestige Shop cosmetic (ProfileState.equippedCosmetic), if any.
  equippedTitleName?: string | null;
  cosmeticColor?: string | null;
}

export type Screen = 'title' | 'select' | 'create' | 'game';
export type Section =
  | 'kingdom' | 'buildings' | 'character' | 'skills' | 'highscore' | 'dungeon-select' | 'dungeon' | 'hunts'
  | 'prestige-shop' | 'bestiary' | 'titles';

// ── Títulos (lib/titles.ts) — purely computed from Character state, see the
// `condition` function; nothing about a title is ever persisted except
// which one (if any) is currently equipped, on Character.equippedTitle.
export interface TitleDef {
  id: string;
  name: string;
  desc: string; // how to earn it, shown on the locked card
  condition: (c: Character) => boolean;
}

// ── Loja de Prestígio (lib/cosmetics.ts) — account-wide, not per-character:
// prestige currency and owned/equipped cosmetics survive character deletion
// (including Modo Ferro permadeath) and are shared across every slot on the
// account, mirroring how Supabase auth itself is account-wide. Purely
// cosmetic (recolors the hero avatar/name in TopBar) — no combat effect.
export interface CosmeticDef {
  id: string;
  name: string;
  color: string;
  cost: number; // in prestígio
}

export interface ProfileState {
  prestige: number;
  ownedCosmetics: string[]; // CosmeticDef ids
  equippedCosmetic: string | null;
  // Baú de Armazém — account-wide, shared across every character slot (like
  // prestige/cosmetics above), unlimited capacity. Items sitting here have
  // no gridX/gridY (same convention as an equipped item) until withdrawn
  // back into a character's own inventory. See components/Bau.tsx.
  vaultItems: EquipmentItem[];
}

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
  evasion: number; // permanent base dodge chance — AGI-derived, plus skill-tree secondary-attribute nodes
  accuracy: number; // permanent base hit chance — DEX-derived, plus skill-tree secondary-attribute nodes
  cooldownReductionPct: number; // shortens ability cooldowns, capped at 50%
  speedPct: number; // AGI-derived — shortens the delay between the player's own actions, capped at 50%
  // WIS+VIT-derived (mirrors mdef's own wis-primary/vit-secondary split) —
  // chance to fully resist a new status effect (poison/burn/bleed/curse) or
  // crowd control (stun/sleep/silence) an enemy attempts to apply to you.
  // Distinct from evasion (which dodges the hit itself, damage included) —
  // this only ever intercepts the status/CC riding along on a hit that
  // already landed. Capped at 40%, same ceiling as evasion/accuracy. Named
  // "Tenacidade" in the UI — "Resistência" read as too easily confused with
  // def/mdef (which resist damage, not status/CC).
  tenacityPct: number;
}
