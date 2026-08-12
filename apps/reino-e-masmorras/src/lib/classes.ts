import { ClassDef, ClassId, Character } from '../types/game';

export const CLASSES: Record<ClassId, ClassDef> = {
  guerreiro: {
    id: 'guerreiro', name: 'Guerreiro', color: '#a5432f',
    desc: 'Vida alta, resiste a golpes pesados.',
    weaponBase: 'Espada',
    baseHp: 44, baseAtk: 8, baseDef: 6, critChance: 0.05,
  },
  mago: {
    id: 'mago', name: 'Mago', color: '#3f7ab8',
    desc: 'Ataques poderosos, mas frágil.',
    weaponBase: 'Cajado',
    baseHp: 26, baseAtk: 14, baseDef: 2, critChance: 0.06,
  },
  assassino: {
    id: 'assassino', name: 'Assassino', color: '#4a5a48',
    desc: 'Rápido e traiçoeiro, aposta tudo no crítico.',
    weaponBase: 'Adaga',
    baseHp: 30, baseAtk: 10, baseDef: 4, critChance: 0.16,
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
    skillPoints: 0, unlockedSkills: [],
    equipment: { weapon: null }, inventory: [],
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
