import { AttributeKey, Attributes, ClassDef, ClassId, Character } from '../types/game';
import { computeKingdomBonuses } from './buildings';
import { generateMerchantStock } from './merchantStock';
import { generateItem } from './equipment';

// Shared attribute display metadata (label + reference color from the Kit
// de Arte) — used by both CharacterOverview and CharacterCreation so the
// two screens never drift apart on what an attribute is called or colored.
export const ATTR_META: Record<AttributeKey, { label: string; abbr: string; color: string }> = {
  str: { label: 'Força', abbr: 'FOR', color: '#c1502e' },
  dex: { label: 'Destreza', abbr: 'DES', color: '#4f9d4f' },
  agi: { label: 'Agilidade', abbr: 'AGI', color: '#4fb8b0' },
  vit: { label: 'Vitalidade', abbr: 'VIT', color: '#c9863c' },
  int: { label: 'Inteligência', abbr: 'INT', color: '#3f7ab8' },
  wis: { label: 'Sabedoria', abbr: 'SAB', color: '#9b6fc9' },
  luk: { label: 'Sorte', abbr: 'SOR', color: '#e0b93c' },
};
export const ATTR_ORDER: AttributeKey[] = ['str', 'dex', 'agi', 'vit', 'int', 'wis', 'luk'];

// The highest level a character can reach — grantXp() stops advancing past
// this, and the last remaining XP is discarded rather than left overflowing
// the bar. Picked so a full 3-tree skill build (45 nodes, 1 point/2 levels =
// 30 points by 60) still requires committing to at most 2 of the 3 trees.
export const MAX_LEVEL = 60;

// baseAtk/baseDef are the class's PHYSICAL power (weapon swings — always
// physical, even for spellcasters) and baseMatk/baseMdef are its MAGICAL
// power (used only by abilities explicitly cast as spells). A pure warrior
// has baseMatk 0 and never rolls it; a pure caster has a token baseAtk (a
// weak, purely physical basic swing) and a high baseMatk that its spells
// actually scale off of. baseAttrs are the class's level-1 head start —
// every class gets a floor of 1 in all 7 attributes (nothing is ever truly
// zero, so even an "irrelevant" attribute does a little something) with its
// 2-3 priority attributes set to 2-3 (secondary) or 5 (primary) on top of
// that floor. This magnitude also drives how well the class scales with
// that attribute later (see classAttrMult in combatStats.ts) — everything
// past this head start comes from the player's own attributePoints spend.
export const CLASSES: Record<ClassId, ClassDef> = {
  guerreiro: {
    id: 'guerreiro', name: 'Guerreiro', color: '#a5432f',
    desc: 'Vida alta, resiste a golpes pesados.',
    weaponBase: 'Espada', bodyBase: 'Peitoral de Placas', legsBase: 'Grevas de Ferro', handsBase: 'Manoplas de Ferro',
    baseHp: 44, baseAtk: 8, baseDef: 6, baseMatk: 0, baseMdef: 2, critChance: 0.05,
    baseAttrs: { str: 5, dex: 1, agi: 1, vit: 3, int: 1, wis: 1, luk: 1 },
  },
  mago: {
    id: 'mago', name: 'Mago', color: '#3f7ab8',
    desc: 'Ataques poderosos, mas frágil.',
    weaponBase: 'Cajado', bodyBase: 'Robe Arcano', legsBase: 'Calças de Tecido', handsBase: 'Luvas de Tecido',
    baseHp: 26, baseAtk: 3, baseDef: 2, baseMatk: 14, baseMdef: 5, critChance: 0.06,
    baseAttrs: { str: 1, dex: 1, agi: 1, vit: 1, int: 5, wis: 3, luk: 1 },
  },
  ladino: {
    id: 'ladino', name: 'Ladino', color: '#4a5a48',
    desc: 'Rápido e traiçoeiro, aposta tudo no crítico e no veneno.',
    weaponBase: 'Adaga', bodyBase: 'Colete de Couro', legsBase: 'Calças de Couro', handsBase: 'Luvas de Couro',
    baseHp: 30, baseAtk: 10, baseDef: 4, baseMatk: 0, baseMdef: 2, critChance: 0.16,
    baseAttrs: { str: 1, dex: 5, agi: 3, vit: 1, int: 1, wis: 1, luk: 2 },
  },
  clerigo: {
    id: 'clerigo', name: 'Clérigo', color: '#c9a86a',
    desc: 'Cura, buffs e magia sagrada — sustenta a jornada mais do que corta.',
    weaponBase: 'Maça Sagrada', bodyBase: 'Vestes Consagradas', legsBase: 'Saiote Consagrado', handsBase: 'Luvas Consagradas',
    baseHp: 34, baseAtk: 4, baseDef: 3, baseMatk: 8, baseMdef: 6, critChance: 0.05,
    baseAttrs: { str: 1, dex: 1, agi: 1, vit: 2, int: 3, wis: 5, luk: 1 },
  },
  cavaleiro: {
    id: 'cavaleiro', name: 'Cavaleiro', color: '#7a8a9a',
    desc: 'Tanque de defesa elevada, feito para segurar a linha de frente.',
    weaponBase: 'Espada Longa', bodyBase: 'Armadura de Cavaleiro', legsBase: 'Grevas de Aço', handsBase: 'Manoplas de Aço',
    baseHp: 50, baseAtk: 7, baseDef: 8, baseMatk: 0, baseMdef: 3, critChance: 0.04,
    baseAttrs: { str: 3, dex: 1, agi: 1, vit: 5, int: 1, wis: 1, luk: 1 },
  },
  paladino: {
    id: 'paladino', name: 'Paladino', color: '#e0c060',
    desc: 'Guerreiro sagrado — defesa, cura e buffs num só pacote.',
    weaponBase: 'Martelo Sagrado', bodyBase: 'Armadura Consagrada', legsBase: 'Grevas Sagradas', handsBase: 'Manoplas Sagradas',
    baseHp: 42, baseAtk: 8, baseDef: 6, baseMatk: 0, baseMdef: 4, critChance: 0.05,
    baseAttrs: { str: 5, dex: 1, agi: 1, vit: 2, int: 1, wis: 3, luk: 1 },
  },
  barbaro: {
    id: 'barbaro', name: 'Bárbaro', color: '#8a3a2a',
    desc: 'Dano físico bruto e resistência, tudo em cima da força.',
    weaponBase: 'Machado Bárbaro', bodyBase: 'Peles de Fera', legsBase: 'Calças de Couro Reforçado', handsBase: 'Braceletes de Osso',
    baseHp: 46, baseAtk: 11, baseDef: 4, baseMatk: 0, baseMdef: 1, critChance: 0.07,
    baseAttrs: { str: 5, dex: 1, agi: 1, vit: 3, int: 1, wis: 1, luk: 2 },
  },
  arqueiro: {
    id: 'arqueiro', name: 'Arqueiro', color: '#5a8a4a',
    desc: 'Dano físico à distância — precisão e críticos certeiros.',
    weaponBase: 'Arco Longo', bodyBase: 'Gibão de Couro', legsBase: 'Calças de Caça', handsBase: 'Braçadeiras de Tiro',
    baseHp: 28, baseAtk: 11, baseDef: 3, baseMatk: 0, baseMdef: 2, critChance: 0.14,
    baseAttrs: { str: 1, dex: 5, agi: 3, vit: 1, int: 1, wis: 1, luk: 2 },
  },
  cacador: {
    id: 'cacador', name: 'Caçador', color: '#6a7a4a',
    desc: 'Dano à distância com armadilhas e efeitos de controle.',
    weaponBase: 'Besta', bodyBase: 'Manto de Caçador', legsBase: 'Calças de Trilha', handsBase: 'Luvas de Rastreador',
    baseHp: 30, baseAtk: 10, baseDef: 3, baseMatk: 0, baseMdef: 2, critChance: 0.12,
    baseAttrs: { str: 1, dex: 5, agi: 3, vit: 1, int: 1, wis: 2, luk: 1 },
  },
  feiticeiro: {
    id: 'feiticeiro', name: 'Feiticeiro', color: '#a03fb8',
    desc: 'Dano mágico explosivo — todo poder ofensivo, pouca defesa.',
    weaponBase: 'Grimório Arcano', bodyBase: 'Vestes Arcanas', legsBase: 'Calças Arcanas', handsBase: 'Luvas Arcanas',
    baseHp: 25, baseAtk: 2, baseDef: 2, baseMatk: 15, baseMdef: 4, critChance: 0.07,
    baseAttrs: { str: 1, dex: 1, agi: 1, vit: 1, int: 5, wis: 1, luk: 3 },
  },
  bruxo: {
    id: 'bruxo', name: 'Bruxo', color: '#4a2a5a',
    desc: 'Magia sombria, maldições e dano periódico.',
    weaponBase: 'Grimório Sombrio', bodyBase: 'Vestes Sombrias', legsBase: 'Calças Sombrias', handsBase: 'Luvas Sombrias',
    baseHp: 27, baseAtk: 3, baseDef: 2, baseMatk: 13, baseMdef: 5, critChance: 0.06,
    baseAttrs: { str: 1, dex: 1, agi: 1, vit: 1, int: 5, wis: 3, luk: 2 },
  },
  druida: {
    id: 'druida', name: 'Druida', color: '#3f8a5a',
    desc: 'Natureza — cura, buffs, debuffs e dano mágico.',
    weaponBase: 'Cajado Élfico', bodyBase: 'Vestes Naturais', legsBase: 'Calças de Folhas', handsBase: 'Luvas de Vinha',
    baseHp: 32, baseAtk: 4, baseDef: 4, baseMatk: 9, baseMdef: 5, critChance: 0.06,
    baseAttrs: { str: 1, dex: 1, agi: 1, vit: 2, int: 3, wis: 5, luk: 1 },
  },
  bardo: {
    id: 'bardo', name: 'Bardo', color: '#c9663c',
    desc: 'Buffs, debuffs e suporte — vitória através da inspiração.',
    weaponBase: 'Alaúde Encantado', bodyBase: 'Traje de Bardo', legsBase: 'Calças de Viajante', handsBase: 'Luvas de Bardo',
    baseHp: 29, baseAtk: 5, baseDef: 3, baseMatk: 6, baseMdef: 4, critChance: 0.10,
    baseAttrs: { str: 1, dex: 3, agi: 1, vit: 1, int: 1, wis: 5, luk: 2 },
  },
  necromante: {
    id: 'necromante', name: 'Necromante', color: '#3a3a4a',
    desc: 'Magia sombria, maldições e dano periódico dos mortos.',
    weaponBase: 'Cetro Nigromante', bodyBase: 'Vestes Nigromantes', legsBase: 'Calças Nigromantes', handsBase: 'Luvas Nigromantes',
    baseHp: 27, baseAtk: 3, baseDef: 2, baseMatk: 13, baseMdef: 5, critChance: 0.06,
    baseAttrs: { str: 1, dex: 1, agi: 1, vit: 1, int: 5, wis: 3, luk: 2 },
  },
};

const ZERO_ATTRS: Attributes = { str: 0, dex: 0, agi: 0, vit: 0, int: 0, wis: 0, luk: 0 };

// Classes whose active abilities are cast as spells (dmgType 'magical' by
// default — see DungeonPanel's MAGICAL_CLASSES). Their basic weapon swing
// (no ability active) is still always physical.
export const MAGICAL_CLASSES: ClassId[] = ['mago', 'feiticeiro', 'bruxo', 'necromante', 'clerigo', 'druida', 'bardo'];

// Third cut, 5x steeper than the last one (18 + level*14 -> 40 + level*55
// -> 100 + level*140 -> this) — deliberately turns leveling into something
// that requires replaying a dungeon multiple times, not a byproduct of
// clearing it once. Simulated against every enemy/dungeon in the game:
// clearing Ruínas Superficiais start to finish (11 regular fights + its
// boss) no longer even reaches level 2 on its own (needs ~4 full clears);
// clearing all 12 currently existing dungeons back to back only lands
// around level 6 of the level-60 cap (was ~14).
export function xpToNextLevel(level: number): number {
  return 500 + level * 700;
}

// Free attribute points granted at character creation, on top of the
// class's baseAttrs floor — spent immediately in CharacterCreation's
// allocator before the run ever starts (separate from the 1-per-level pool
// grantXp hands out afterward via the normal in-game allocator).
export const STARTING_ATTR_POINTS = 5;

// initialAllocatedAttrs is the creation-time allocator's result (already
// fully spent — see STARTING_ATTR_POINTS), so attributePoints starts at 0
// same as before; only their destination (allocatedAttrs) differs from the
// old always-zero default.
export function createCharacter(name: string, classId: ClassId, initialAllocatedAttrs?: Attributes, ironMode = false): Character {
  const c = CLASSES[classId];
  const base: Character = {
    name, classId, level: 1, xp: 0, xpToNext: xpToNextLevel(1),
    hp: c.baseHp, maxHp: c.baseHp, atk: c.baseAtk, def: c.baseDef, matk: c.baseMatk, mdef: c.baseMdef,
    gold: 0, potions: 1, potionThreshold: 0.3, bestDepth: 0, ironMode,
    skillPoints: 0, attributePoints: 0, allocatedAttrs: initialAllocatedAttrs ?? { ...ZERO_ATTRS },
    unlockedSkills: [], equippedAbilities: [], abilityThresholds: {},
    equipment: {
      // Every hero starts geared, not empty-handed — a guaranteed comum
      // weapon + chest piece (tier 1, the lowest rung), instead of leaving
      // the very first fight in the game riding on bare class base stats.
      weapon: generateItem('weapon', classId, 1, 0, 'comum'),
      body: generateItem('body', classId, 1, 0, 'comum'),
      legs: null, hands: null, offhand: null, accessory: null,
    },
    inventory: [],
    buildings: {}, merchantStock: [],
  };
  // Seeded up front (not left empty until the first run ends) so a
  // brand-new character never sees a bare shop — mainly matters for a
  // player who racks up some gold retreating early a few times before ever
  // finishing or dying in a dungeon, which is the only thing that re-rolls
  // stock afterward.
  return { ...base, merchantStock: generateMerchantStock(base, computeKingdomBonuses(base.buildings)) };
}

// Levels up as many times as the accumulated XP allows (capped at MAX_LEVEL,
// discarding leftover XP once reached), fully healing each time. Skill
// points only land on even levels (1 every 2 levels — 30 by the level cap,
// enough to fully commit to at most 2 of a class's 3 talent trees, never
// all 3). Attribute points land every level, spent freely via allocatedAttrs.
export function grantXp(ch: Character, amount: number): Character {
  if (ch.level >= MAX_LEVEL) return ch;
  const next = { ...ch, xp: ch.xp + amount };
  while (next.xp >= next.xpToNext && next.level < MAX_LEVEL) {
    next.xp -= next.xpToNext;
    next.level += 1;
    next.maxHp += 6;
    next.atk += 2;
    next.def += 1;
    next.matk += 2;
    next.mdef += 1;
    next.hp = next.maxHp;
    if (next.level % 2 === 0) next.skillPoints += 1;
    next.attributePoints += 1;
    next.xpToNext = xpToNextLevel(next.level);
  }
  if (next.level >= MAX_LEVEL) { next.level = MAX_LEVEL; next.xp = 0; }
  return next;
}
