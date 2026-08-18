import { Character, TitleDef } from '../types/game';
import { DUNGEONS } from './dungeons';
import { MAX_LEVEL } from './classes';

const HUNT_BOSS_SHAPES = ['boneTyrant', 'swampLeviathan', 'infernalWyrm'] as const;

function totalKills(c: Character): number {
  return Object.values(c.kills ?? {}).reduce((sum, n) => sum + (n ?? 0), 0);
}

// Every title is a pure function of Character state — nothing is ever
// "granted" or stored as unlocked; a title simply is or isn't earned right
// now (see lib/titles.ts's unlockedTitles below). Only which one is
// equipped persists (Character.equippedTitle).
export const TITLES: TitleDef[] = [
  { id: 'aventureiro', name: 'Aventureiro', desc: 'Alcance o nível 10.', condition: (c) => c.level >= 10 },
  { id: 'veterano', name: 'Veterano de Guerra', desc: 'Alcance o nível 30.', condition: (c) => c.level >= 30 },
  { id: 'lenda', name: 'Lenda Viva', desc: `Alcance o nível máximo (${MAX_LEVEL}).`, condition: (c) => c.level >= MAX_LEVEL },

  { id: 'andarilho', name: 'Andarilho das Masmorras', desc: 'Conclua qualquer masmorra.', condition: (c) => (c.clearedDungeons?.length ?? 0) >= 1 },
  { id: 'explorador', name: 'Explorador Experiente', desc: 'Conclua 6 masmorras diferentes.', condition: (c) => (c.clearedDungeons?.length ?? 0) >= 6 },
  { id: 'conquistador', name: 'Conquistador do Reino', desc: 'Conclua todas as masmorras.', condition: (c) => (c.clearedDungeons?.length ?? 0) >= DUNGEONS.length },

  { id: 'cacador-feras', name: 'Caçador de Feras', desc: 'Derrote qualquer Alvo de Caçada.', condition: (c) => HUNT_BOSS_SHAPES.some((s) => (c.kills?.[s] ?? 0) >= 1) },
  { id: 'cacador-lendario', name: 'Caçador Lendário', desc: 'Derrote todos os Alvos de Caçada.', condition: (c) => HUNT_BOSS_SHAPES.every((s) => (c.kills?.[s] ?? 0) >= 1) },

  { id: 'coracao-ferro', name: 'Coração de Ferro', desc: 'Jogue com o Modo Ferro ativado.', condition: (c) => c.ironMode === true },

  { id: 'sobrevivente-pesadelo', name: 'Sobrevivente do Pesadelo', desc: 'Conclua qualquer masmorra em Modo Pesadelo.', condition: (c) => (c.clearedNightmareDungeons?.length ?? 0) >= 1 },
  { id: 'domador-pesadelo', name: 'Domador do Pesadelo', desc: 'Conclua 6 masmorras em Modo Pesadelo.', condition: (c) => (c.clearedNightmareDungeons?.length ?? 0) >= 6 },

  { id: 'exterminador', name: 'Exterminador', desc: 'Derrote 300 inimigos, no total.', condition: (c) => totalKills(c) >= 300 },
  { id: 'cacador-incansavel', name: 'Caçador Incansável', desc: 'Derrote 1.500 inimigos, no total.', condition: (c) => totalKills(c) >= 1500 },

  { id: 'terror-trolls', name: 'Terror dos Trolls', desc: 'Derrote 30 trolls.', condition: (c) => (c.kills?.troll ?? 0) >= 30 },
  { id: 'flagelo-dragoes', name: 'Flagelo dos Dragões', desc: 'Derrote 20 dragões.', condition: (c) => (c.kills?.dragon ?? 0) >= 20 },

  { id: 'rico', name: 'Rico como um Rei', desc: 'Acumule 5.000 de ouro.', condition: (c) => c.gold >= 5000 },
  { id: 'descida-profunda', name: 'Descida Profunda', desc: 'Alcance a profundidade 30 em uma expedição.', condition: (c) => c.bestDepth >= 30 },
];

export function unlockedTitles(c: Character): TitleDef[] {
  return TITLES.filter((t) => t.condition(c));
}
