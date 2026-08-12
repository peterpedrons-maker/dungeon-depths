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
