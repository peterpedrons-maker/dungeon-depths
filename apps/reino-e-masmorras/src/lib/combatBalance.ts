import type { ClassId, DungeonDef } from '../types/game.ts';
import { CLASSES, createCharacter, grantXp } from './classes.ts';
import { DUNGEONS } from './dungeons.ts';
import { spawnEnemy } from './enemies.ts';
import { generateItem } from './equipment.ts';
import { enhancedItem } from './enhancement.ts';
import { OFFHAND_KIND } from './itemTiers.ts';
import { unlockLegalBuild } from './classAudit.ts';
import { createCombatState, runCombat, runFullDungeon } from './combatEngine.ts';
import type { EquipmentItem, Rarity } from '../types/game.ts';

export interface BalanceFightResult {
  classId: ClassId; dungeonId: string; boss: boolean; gearProfile: GearProfile; won: boolean;
  actions: number; playerDamage: number; enemyDamage: number; finalHp: number;
}

export type GearProfile = 'recem-chegado' | 'farmado' | 'bem-equipado' | 'endgame-realista' | 'stress';
export const GEAR_PROFILES: Record<GearProfile, { levelOffset: number; tierOffset: number; rarity: Rarity; quality: number; forge: number }> = {
  'recem-chegado': { levelOffset: 0, tierOffset: -1, rarity: 'incomum', quality: 0, forge: 1 },
  farmado: { levelOffset: 2, tierOffset: 0, rarity: 'raro', quality: .05, forge: 3 },
  'bem-equipado': { levelOffset: 4, tierOffset: 0, rarity: 'raro', quality: .12, forge: 5 },
  'endgame-realista': { levelOffset: 8, tierOffset: 0, rarity: 'epico', quality: .18, forge: 7 },
  stress: { levelOffset: 10, tierOffset: 0, rarity: 'legendario', quality: .25, forge: 10 },
};

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

export function equippedBalanceCharacter(classId: ClassId, dungeon: DungeonDef, profile: GearProfile = 'bem-equipado') {
  const cfg = GEAR_PROFILES[profile]; const ch = levelCharacter(classId, Math.max(1, dungeon.levelReq + cfg.levelOffset));
  const path = ({ guerreiro:'furioso',mago:'piromante',ladino:'veneno',clerigo:'devocao',cavaleiro:'bastiao',paladino:'voto',barbaro:'furia',arqueiro:'precisao',cacador:'armadilhas',feiticeiro:'explosao',bruxo:'maldicao',druida:'cura-natural',bardo:'cancao-guerra',necromante:'decomposicao' } as Record<ClassId,string>)[classId];
  const build = unlockLegalBuild(classId, [path]); const tier = Math.max(1, Math.min(11, dungeon.itemTier + cfg.tierOffset));
  const make = (slot: 'weapon'|'body'|'legs'|'hands'|'accessory'|'offhand'): EquipmentItem => enhancedItem({ ...generateItem(slot, classId, tier, cfg.quality, cfg.rarity), enhanceLevel: cfg.forge });
  return { ...ch, unlockedSkills: build.unlocked, equippedAbilities: build.activeIds.slice(0, 5), equipment: { ...ch.equipment, weapon: make('weapon'), body: make('body'), legs: make('legs'), hands: make('hands'), accessory: make('accessory'), offhand: OFFHAND_KIND[classId] ? make('offhand') : null } };
}

function withSeed<T>(seed: number, fn: () => T): T {
  const previous = Math.random;
  Math.random = seededRng(seed);
  try { return fn(); } finally { Math.random = previous; }
}

export function simulateFight(classId: ClassId, dungeon: DungeonDef, boss: boolean, seed: number, gearProfile: GearProfile = 'bem-equipado'): BalanceFightResult {
  return withSeed(seed, () => {
    const ch = equippedBalanceCharacter(classId, dungeon, gearProfile);
    const enemy = spawnEnemy(boss ? dungeon.bossDepth : dungeon.startDepth, dungeon);
    const result = runCombat(createCombatState(ch, enemy, seed, ch.equippedAbilities, ch.equippedAbilities));
    return { classId, dungeonId: dungeon.id, boss, gearProfile, won: result.won, actions: result.actions, playerDamage: result.playerDamage, enemyDamage: result.enemyDamage, finalHp: result.state.playerHp };
  });
}

export interface DungeonRunBalanceResult { classId: ClassId; dungeonId: string; gearProfile: GearProfile; won: boolean; fights: number; actions: number; checkpoints: number; finalHp: number }
export function simulateDungeonRun(classId: ClassId, dungeon: DungeonDef, seed: number, gearProfile: GearProfile = 'bem-equipado'): DungeonRunBalanceResult {
  return withSeed(seed, () => { const ch = equippedBalanceCharacter(classId, dungeon, gearProfile); const result = runFullDungeon(ch, dungeon, seed); return { classId, dungeonId: dungeon.id, gearProfile, won: result.won, fights: result.fights, actions: result.actions, checkpoints: result.checkpoints.length, finalHp: result.state.playerHp }; });
}
export function runDungeonCoverage(seeds = 1, gearProfile: GearProfile = 'bem-equipado'): DungeonRunBalanceResult[] { const rows: DungeonRunBalanceResult[] = []; for (let seed = 1; seed <= seeds; seed += 1) for (const classId of Object.keys(CLASSES) as ClassId[]) for (const dungeon of DUNGEONS) rows.push(simulateDungeonRun(classId, dungeon, seed, gearProfile)); return rows; }

export function runCombatBalance(seeds = 300, startSeed = 1): BalanceSummary {
  const results: BalanceFightResult[] = [];
  const classIds = Object.keys(CLASSES) as ClassId[];
  for (let seed = startSeed; seed < startSeed + seeds; seed += 1) {
    for (const classId of classIds) for (const dungeon of DUNGEONS) {
      results.push(simulateFight(classId, dungeon, false, seed));
      results.push(simulateFight(classId, dungeon, true, seed + 100000));
    }
  }
  const total = results.length || 1;
  return {
    seed: startSeed, fights: results.length, wins: results.filter((r) => r.won).length,
    averageActions: results.reduce((s, r) => s + r.actions, 0) / total,
    averagePlayerDamage: results.reduce((s, r) => s + r.playerDamage, 0) / total,
    averageEnemyDamage: results.reduce((s, r) => s + r.enemyDamage, 0) / total,
    results,
  };
}
