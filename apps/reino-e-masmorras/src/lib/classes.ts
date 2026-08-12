import { ClassDef, ClassId, Character } from '../types/game';

export const CLASSES: Record<ClassId, ClassDef> = {
  guerreiro: {
    id: 'guerreiro', name: 'Guerreiro', color: '#c0392b',
    desc: 'Vida alta, resiste a golpes pesados.',
    baseHp: 42, baseAtk: 8, baseDef: 6, critChance: 0.05, lifesteal: 0,
  },
  mago: {
    id: 'mago', name: 'Mago', color: '#8e44ad',
    desc: 'Ataques poderosos, mas frágil.',
    baseHp: 26, baseAtk: 14, baseDef: 2, critChance: 0.08, lifesteal: 0,
  },
  arqueiro: {
    id: 'arqueiro', name: 'Arqueiro', color: '#27ae60',
    desc: 'Chance alta de acertos críticos.',
    baseHp: 30, baseAtk: 10, baseDef: 4, critChance: 0.22, lifesteal: 0,
  },
  clerigo: {
    id: 'clerigo', name: 'Clérigo', color: '#d4ac0d',
    desc: 'Recupera vida a cada golpe certeiro.',
    baseHp: 34, baseAtk: 7, baseDef: 5, critChance: 0.05, lifesteal: 0.3,
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
  };
}

// Levels up as many times as the accumulated XP allows, fully healing each time.
export function grantXp(ch: Character, amount: number): Character {
  const next = { ...ch, xp: ch.xp + amount };
  while (next.xp >= next.xpToNext) {
    next.xp -= next.xpToNext;
    next.level += 1;
    next.maxHp += 6;
    next.atk += 2;
    next.def += 1;
    next.hp = next.maxHp;
    next.xpToNext = xpToNextLevel(next.level);
  }
  return next;
}
