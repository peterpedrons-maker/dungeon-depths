import { ClassDef, ClassId, Character } from '../types/game';

export const CLASSES: Record<ClassId, ClassDef> = {
  guerreiro: {
    id: 'guerreiro', name: 'Guerreiro', color: '#a5432f',
    desc: 'Vida alta, resiste a golpes pesados.',
    weaponBase: 'Espada', bodyBase: 'Peitoral de Placas', legsBase: 'Grevas de Ferro', handsBase: 'Manoplas de Ferro',
    baseHp: 44, baseAtk: 8, baseDef: 6, critChance: 0.05,
  },
  mago: {
    id: 'mago', name: 'Mago', color: '#3f7ab8',
    desc: 'Ataques poderosos, mas frágil.',
    weaponBase: 'Cajado', bodyBase: 'Robe Arcano', legsBase: 'Calças de Tecido', handsBase: 'Luvas de Tecido',
    baseHp: 26, baseAtk: 14, baseDef: 2, critChance: 0.06,
  },
  ladino: {
    id: 'ladino', name: 'Ladino', color: '#4a5a48',
    desc: 'Rápido e traiçoeiro, aposta tudo no crítico e no veneno.',
    weaponBase: 'Adaga', bodyBase: 'Colete de Couro', legsBase: 'Calças de Couro', handsBase: 'Luvas de Couro',
    baseHp: 30, baseAtk: 10, baseDef: 4, critChance: 0.16,
  },
  clerigo: {
    id: 'clerigo', name: 'Clérigo', color: '#c9a86a',
    desc: 'Cura, buffs e magia sagrada — sustenta a jornada mais do que corta.',
    weaponBase: 'Maça Sagrada', bodyBase: 'Vestes Consagradas', legsBase: 'Saiote Consagrado', handsBase: 'Luvas Consagradas',
    baseHp: 34, baseAtk: 9, baseDef: 3, critChance: 0.05,
  },
  cavaleiro: {
    id: 'cavaleiro', name: 'Cavaleiro', color: '#7a8a9a',
    desc: 'Tanque de defesa elevada, feito para segurar a linha de frente.',
    weaponBase: 'Espada Longa', bodyBase: 'Armadura de Cavaleiro', legsBase: 'Grevas de Aço', handsBase: 'Manoplas de Aço',
    baseHp: 50, baseAtk: 7, baseDef: 8, critChance: 0.04,
  },
  paladino: {
    id: 'paladino', name: 'Paladino', color: '#e0c060',
    desc: 'Guerreiro sagrado — defesa, cura e buffs num só pacote.',
    weaponBase: 'Martelo Sagrado', bodyBase: 'Armadura Consagrada', legsBase: 'Grevas Sagradas', handsBase: 'Manoplas Sagradas',
    baseHp: 42, baseAtk: 8, baseDef: 6, critChance: 0.05,
  },
  barbaro: {
    id: 'barbaro', name: 'Bárbaro', color: '#8a3a2a',
    desc: 'Dano físico bruto e resistência, tudo em cima da força.',
    weaponBase: 'Machado Bárbaro', bodyBase: 'Peles de Fera', legsBase: 'Calças de Couro Reforçado', handsBase: 'Braceletes de Osso',
    baseHp: 46, baseAtk: 11, baseDef: 4, critChance: 0.07,
  },
  arqueiro: {
    id: 'arqueiro', name: 'Arqueiro', color: '#5a8a4a',
    desc: 'Dano físico à distância — precisão e críticos certeiros.',
    weaponBase: 'Arco Longo', bodyBase: 'Gibão de Couro', legsBase: 'Calças de Caça', handsBase: 'Braçadeiras de Tiro',
    baseHp: 28, baseAtk: 11, baseDef: 3, critChance: 0.14,
  },
  cacador: {
    id: 'cacador', name: 'Caçador', color: '#6a7a4a',
    desc: 'Dano à distância com armadilhas e efeitos de controle.',
    weaponBase: 'Besta', bodyBase: 'Manto de Caçador', legsBase: 'Calças de Trilha', handsBase: 'Luvas de Rastreador',
    baseHp: 30, baseAtk: 10, baseDef: 3, critChance: 0.12,
  },
  feiticeiro: {
    id: 'feiticeiro', name: 'Feiticeiro', color: '#a03fb8',
    desc: 'Dano mágico explosivo — todo poder ofensivo, pouca defesa.',
    weaponBase: 'Grimório Arcano', bodyBase: 'Vestes Arcanas', legsBase: 'Calças Arcanas', handsBase: 'Luvas Arcanas',
    baseHp: 25, baseAtk: 15, baseDef: 2, critChance: 0.07,
  },
  bruxo: {
    id: 'bruxo', name: 'Bruxo', color: '#4a2a5a',
    desc: 'Magia sombria, maldições e dano periódico.',
    weaponBase: 'Grimório Sombrio', bodyBase: 'Vestes Sombrias', legsBase: 'Calças Sombrias', handsBase: 'Luvas Sombrias',
    baseHp: 27, baseAtk: 13, baseDef: 2, critChance: 0.06,
  },
  druida: {
    id: 'druida', name: 'Druida', color: '#3f8a5a',
    desc: 'Natureza — cura, buffs, debuffs e dano mágico.',
    weaponBase: 'Cajado Élfico', bodyBase: 'Vestes Naturais', legsBase: 'Calças de Folhas', handsBase: 'Luvas de Vinha',
    baseHp: 32, baseAtk: 11, baseDef: 4, critChance: 0.06,
  },
  bardo: {
    id: 'bardo', name: 'Bardo', color: '#c9663c',
    desc: 'Buffs, debuffs e suporte — vitória através da inspiração.',
    weaponBase: 'Alaúde Encantado', bodyBase: 'Traje de Bardo', legsBase: 'Calças de Viajante', handsBase: 'Luvas de Bardo',
    baseHp: 29, baseAtk: 9, baseDef: 3, critChance: 0.10,
  },
  necromante: {
    id: 'necromante', name: 'Necromante', color: '#3a3a4a',
    desc: 'Magia sombria, maldições e dano periódico dos mortos.',
    weaponBase: 'Cetro Nigromante', bodyBase: 'Vestes Nigromantes', legsBase: 'Calças Nigromantes', handsBase: 'Luvas Nigromantes',
    baseHp: 27, baseAtk: 13, baseDef: 2, critChance: 0.06,
  },
};

export function xpToNextLevel(level: number): number {
  return 18 + level * 14;
}

export function createCharacter(name: string, classId: ClassId): Character {
  const c = CLASSES[classId];
  return {
    name, classId, level: 1, xp: 0, xpToNext: xpToNextLevel(1),
    hp: c.baseHp, maxHp: c.baseHp, atk: c.baseAtk, def: c.baseDef,
    gold: 0, potions: 1, bestDepth: 0,
    skillPoints: 0, unlockedSkills: [], equippedAbilities: [],
    equipment: { weapon: null, body: null, legs: null, hands: null, accessory: null }, inventory: [],
    buildings: {},
  };
}

// Levels up as many times as the accumulated XP allows, fully healing each
// time and granting one skill point to spend in the class's talent tree.
export function grantXp(ch: Character, amount: number): Character {
  const next = { ...ch, xp: ch.xp + amount };
  while (next.xp >= next.xpToNext) {
    next.xp -= next.xpToNext;
    next.level += 1;
    next.maxHp += 6;
    next.atk += 2;
    next.def += 1;
    next.hp = next.maxHp;
    next.skillPoints += 1;
    next.xpToNext = xpToNextLevel(next.level);
  }
  return next;
}
