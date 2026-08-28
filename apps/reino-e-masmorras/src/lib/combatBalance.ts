import type { ClassId, DungeonDef } from '../types/game.ts';
import { CLASSES, createCharacter, grantXp } from './classes.ts';
import { computeCombatStats, effectiveMaxHp } from './combatStats.ts';
import { DUNGEONS } from './dungeons.ts';
import { spawnEnemy } from './enemies.ts';
import { rollAttack } from '../game/combat.ts';

export interface BalanceFightResult {
  classId: ClassId; dungeonId: string; boss: boolean; won: boolean;
  actions: number; playerDamage: number; enemyDamage: number; finalHp: number;
}

export interface BalanceSummary {
  seed: number; fights: number; wins: number; averageActions: number;
  averagePlayerDamage: number; averageEnemyDamage: number;
  results: BalanceFightResult[];
}

export function seededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function levelCharacter(classId: ClassId, level: number) {
  let ch = createCharacter(`Balance ${classId}`, classId);
  while (ch.level < level) ch = grantXp(ch, ch.xpToNext);
  return ch;
}

function withSeed<T>(seed: number, fn: () => T): T {
  const previous = Math.random;
  Math.random = seededRng(seed);
  try { return fn(); } finally { Math.random = previous; }
}

export function simulateFight(classId: ClassId, dungeon: DungeonDef, boss: boolean, seed: number): BalanceFightResult {
  return withSeed(seed, () => {
    const ch = levelCharacter(classId, Math.max(1, dungeon.levelReq));
    const stats = computeCombatStats(ch);
    const enemy = spawnEnemy(boss ? dungeon.bossDepth : dungeon.startDepth, dungeon);
    let playerHp = effectiveMaxHp(ch);
    let enemyHp = enemy.maxHp;
    let playerDamage = 0, enemyDamage = 0, actions = 0;
    while (playerHp > 0 && enemyHp > 0 && actions < 200) {
      const hit = rollAttack(stats.atk, enemy.def, stats.critChance, stats.critDmgMult);
      enemyHp = Math.max(0, enemyHp - hit.dmg); playerDamage += hit.dmg; actions += 1;
      if (enemyHp <= 0) break;
      const retaliation = rollAttack(enemy.atk, stats.def, 0.06);
      playerHp = Math.max(0, playerHp - retaliation.dmg); enemyDamage += retaliation.dmg;
    }
    return { classId, dungeonId: dungeon.id, boss, won: enemyHp <= 0, actions, playerDamage, enemyDamage, finalHp: playerHp };
  });
}

export function runCombatBalance(seeds = 300): BalanceSummary {
  const results: BalanceFightResult[] = [];
  const classIds = Object.keys(CLASSES) as ClassId[];
  for (let seed = 1; seed <= seeds; seed += 1) {
    for (const classId of classIds) for (const dungeon of DUNGEONS) {
      results.push(simulateFight(classId, dungeon, false, seed));
      results.push(simulateFight(classId, dungeon, true, seed + 100000));
    }
  }
  const total = results.length || 1;
  return {
    seed: 42, fights: results.length, wins: results.filter((r) => r.won).length,
    averageActions: results.reduce((s, r) => s + r.actions, 0) / total,
    averagePlayerDamage: results.reduce((s, r) => s + r.playerDamage, 0) / total,
    averageEnemyDamage: results.reduce((s, r) => s + r.enemyDamage, 0) / total,
    results,
  };
}
