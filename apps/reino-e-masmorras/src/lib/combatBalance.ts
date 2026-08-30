import type { ClassId, DungeonDef } from '../types/game.ts';
import { CLASSES, createCharacter, grantXp } from './classes.ts';
import { DUNGEONS } from './dungeons.ts';
import { spawnEnemy } from './enemies.ts';
import { generateItem } from './equipment.ts';
import { enhancedItem } from './enhancement.ts';
import { OFFHAND_KIND } from './itemTiers.ts';
import { unlockLegalBuild } from './classAudit.ts';
import { getEquippedAbilities } from './skills.ts';
import { createCombatState, runCombat, runFullDungeon } from './combatEngine.ts';
import type { EquipmentItem, Rarity } from '../types/game.ts';

export interface BalanceFightResult {
  classId: ClassId; dungeonId: string; boss: boolean; gearProfile: GearProfile; won: boolean;
  actions: number; playerDamage: number; enemyDamage: number; finalHp: number;
}

export type GearProfile = 'recem-chegado' | 'farmado' | 'bem-equipado' | 'endgame-realista' | 'stress';
export const GEAR_PROFILES: Record<GearProfile, { levelOffset: number; tierOffset: number; rarity: Rarity; quality: number; forge: number }> = {
  'recem-chegado': { levelOffset: 0, tierOffset: -1, rarity: 'incomum', quality: 0, forge: 1 },
  // Farmado is an actual two-level progression profile, not a same-level
  // witness profile. Its gear and attributes remain ordinary for that level.
  farmado: { levelOffset: 2, tierOffset: 0, rarity: 'raro', quality: .05, forge: 3 },
  'bem-equipado': { levelOffset: 4, tierOffset: 0, rarity: 'raro', quality: .12, forge: 5 },
  'endgame-realista': { levelOffset: 8, tierOffset: 0, rarity: 'epico', quality: .18, forge: 7 },
  stress: { levelOffset: 10, tierOffset: 0, rarity: 'legendario', quality: .25, forge: 10 },
};

const PHYSICAL_PRIMARY: Partial<Record<ClassId, 'str' | 'dex'>> = {
  guerreiro: 'str', ladino: 'dex', cavaleiro: 'str', paladino: 'str', barbaro: 'str', arqueiro: 'dex', cacador: 'dex',
};
const MAGICAL_PRIMARY: Partial<Record<ClassId, 'int' | 'wis'>> = {
  mago: 'int', clerigo: 'int', feiticeiro: 'int', bruxo: 'int', druida: 'int', bardo: 'int', necromante: 'int',
};

function buildCombatAttributes(ch: ReturnType<typeof createCharacter>, profile: GearProfile) {
  const points = ch.attributePoints;
  if (points <= 0) return ch;
  const primary = PHYSICAL_PRIMARY[ch.classId] ?? MAGICAL_PRIMARY[ch.classId] ?? 'str';
  const primaryShare = profile === 'stress' ? 0.7 : 0.65;
  const primaryPoints = Math.floor(points * primaryShare);
  const allocatedAttrs = { ...ch.allocatedAttrs, [primary]: ch.allocatedAttrs[primary] + primaryPoints, vit: ch.allocatedAttrs.vit + points - primaryPoints };
  return { ...ch, allocatedAttrs, attributePoints: 0 };
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

export function equippedBalanceCharacter(classId: ClassId, dungeon: DungeonDef, profile: GearProfile = 'bem-equipado') {
  const cfg = GEAR_PROFILES[profile]; const leveled = levelCharacter(classId, Math.max(1, dungeon.levelReq + cfg.levelOffset)); const ch = buildCombatAttributes(leveled, profile);
  const path = ({ guerreiro:'furioso',mago:'piromante',ladino:'veneno',clerigo:'retidao',cavaleiro:'investida',paladino:'voto',barbaro:'furia',arqueiro:'precisao',cacador:'armadilhas',feiticeiro:'explosao',bruxo:'maldicao',druida:'furia-natureza',bardo:'cancao-guerra',necromante:'decomposicao' } as Record<ClassId,string>)[classId];
  const build = unlockLegalBuild(classId, [path]); const tier = Math.max(1, Math.min(11, dungeon.itemTier + cfg.tierOffset));
  const make = (slot: 'weapon'|'body'|'legs'|'hands'|'accessory'|'offhand'): EquipmentItem => enhancedItem({ ...generateItem(slot, classId, tier, cfg.quality, cfg.rarity), enhanceLevel: cfg.forge });
  // A balance profile is a real loadout, including the consumables the
  // player could have bought before entering. Potions are persistent inside
  // runFullDungeon and auto-trigger under the same threshold/cooldown as the
  // panel; they are not a combat-state injection or a free heal.
  const potions = profile === 'recem-chegado' ? 1 : profile === 'farmado' ? 4 : profile === 'bem-equipado' ? 8 : profile === 'endgame-realista' ? 12 : 16;
  return { ...ch, potions, unlockedSkills: build.unlocked, equippedAbilities: build.activeIds.slice(0, 5), equipment: { ...ch.equipment, weapon: make('weapon'), body: make('body'), legs: make('legs'), hands: make('hands'), accessory: make('accessory'), offhand: OFFHAND_KIND[classId] ? make('offhand') : null } };
}

function withSeed<T>(seed: number, fn: () => T): T {
  const previous = Math.random;
  Math.random = seededRng(seed);
  try { return fn(); } finally { Math.random = previous; }
}

const DEFENSIVE_EFFECTS = new Set(['heal','regen','shield','divineWall','orderResist','colossalShield','lastGuard','boneShield','boneFortress','aegis','ironWall','livingFortress','lastGuard','counterStance','kingsBanner','painGuard','wallStance','lastStand','reviveWindow']);
function balancePriorities(ch: ReturnType<typeof equippedBalanceCharacter>): string[] {
  return getEquippedAbilities(ch.classId, ch.unlockedSkills, ch.equippedAbilities)
    .sort((a, b) => Number(DEFENSIVE_EFFECTS.has(a.effect.kind)) - Number(DEFENSIVE_EFFECTS.has(b.effect.kind)) || a.cooldown - b.cooldown)
    .map((a) => a.id);
}

export function simulateFight(classId: ClassId, dungeon: DungeonDef, boss: boolean, seed: number, gearProfile: GearProfile = 'bem-equipado'): BalanceFightResult {
  return withSeed(seed, () => {
    const ch = equippedBalanceCharacter(classId, dungeon, gearProfile);
    const enemy = spawnEnemy(boss ? dungeon.bossDepth : dungeon.startDepth, dungeon);
    const priorities = balancePriorities(ch);
    const result = runCombat(createCombatState(ch, enemy, seed, ch.equippedAbilities, priorities));
    return { classId, dungeonId: dungeon.id, boss, gearProfile, won: result.won, actions: result.actions, playerDamage: result.playerDamage, enemyDamage: result.enemyDamage, finalHp: result.state.playerHp };
  });
}

export interface DungeonRunBalanceResult { classId: ClassId; dungeonId: string; gearProfile: GearProfile; won: boolean; fights: number; actions: number; checkpoints: number; finalHp: number }
export function simulateDungeonRun(classId: ClassId, dungeon: DungeonDef, seed: number, gearProfile: GearProfile = 'bem-equipado'): DungeonRunBalanceResult {
  return withSeed(seed, () => { const ch = equippedBalanceCharacter(classId, dungeon, gearProfile); const result = runFullDungeon(ch, dungeon, seed, balancePriorities(ch)); return { classId, dungeonId: dungeon.id, gearProfile, won: result.won, fights: result.fights, actions: result.actions, checkpoints: result.checkpoints.length, finalHp: result.state.playerHp }; });
}
export function runDungeonCoverage(seeds = 1, gearProfile: GearProfile = 'bem-equipado'): DungeonRunBalanceResult[] { const rows: DungeonRunBalanceResult[] = []; for (let seed = 1; seed <= seeds; seed += 1) for (const classId of Object.keys(CLASSES) as ClassId[]) for (const dungeon of DUNGEONS) rows.push(simulateDungeonRun(classId, dungeon, seed, gearProfile)); return rows; }

export interface RebalanceDurationTarget { label: string; dungeonIndex: number; profile: GearProfile; regular: [number, number]; elite: [number, number]; boss: [number, number]; }
export const REBALANCE_DURATION_TARGETS: RebalanceDurationTarget[] = [
  { label: 'D1-D6', dungeonIndex: 5, profile: 'farmado', regular: [5, 8], elite: [9, 14], boss: [19, 25] },
  { label: 'D7-D18', dungeonIndex: 17, profile: 'bem-equipado', regular: [8, 11], elite: [11, 15], boss: [32, 40] },
  { label: 'D19-D30', dungeonIndex: 23, profile: 'bem-equipado', regular: [10, 14], elite: [16, 21], boss: [45, 55] },
  { label: 'D31-D33', dungeonIndex: 30, profile: 'endgame-realista', regular: [11, 15], elite: [16, 22], boss: [40, 50] },
];

export interface RebalanceDurationMeasurement {
  label: string; dungeonId: string; profile: GearProfile; kind: 'regular' | 'elite' | 'boss';
  samples: number; wins: number; medianActions: number; target: [number, number]; withinTarget: boolean;
}
export interface RebalanceBossWinRate { classId: ClassId; wins: number; samples: number; winRate: number; targetMinimum: number; meetsTarget: boolean; }
export interface RebalanceWinRateTarget { label: string; dungeonIndex: number; profile: GearProfile; target: [number, number]; }
export interface RebalanceWinRateMeasurement extends RebalanceWinRateTarget { dungeonId: string; samples: number; wins: number; winRate: number; withinTarget: boolean; }
export interface RebalanceMeasurement { durations: RebalanceDurationMeasurement[]; finalBoss: RebalanceBossWinRate[]; winRates: RebalanceWinRateMeasurement[]; }

/**
 * Full-run checkpoints for every progression band. Lower profiles remain
 * deliberately poor deep into a later band; their non-zero target is useful
 * as a regression guard without pretending that under-geared characters
 * should farm endgame. Special dungeons are measured separately because
 * they are intended to be harder than the adjacent mainline.
 */
export const REBALANCE_WIN_RATE_TARGETS: RebalanceWinRateTarget[] = [
  { label: 'D1-D6 especial / Farmado', dungeonIndex: 5, profile: 'farmado', target: [0.00, 0.15] },
  { label: 'D1-D6 especial / Bem Equipado', dungeonIndex: 5, profile: 'bem-equipado', target: [0.10, 0.30] },
  { label: 'D7-D12 especial / Farmado', dungeonIndex: 11, profile: 'farmado', target: [0.05, 0.25] },
  { label: 'D7-D12 especial / Bem Equipado', dungeonIndex: 11, profile: 'bem-equipado', target: [0.45, 0.70] },
  { label: 'D13-D18 / Farmado', dungeonIndex: 17, profile: 'farmado', target: [0.01, 0.15] },
  { label: 'D13-D18 / Bem Equipado', dungeonIndex: 17, profile: 'bem-equipado', target: [0.08, 0.30] },
  { label: 'D19-D24 / Farmado', dungeonIndex: 23, profile: 'farmado', target: [0.00, 0.10] },
  { label: 'D19-D24 / Bem Equipado', dungeonIndex: 23, profile: 'bem-equipado', target: [0.04, 0.15] },
  { label: 'D25-D30 / Bem Equipado', dungeonIndex: 29, profile: 'bem-equipado', target: [0.01, 0.15] },
  { label: 'D25-D30 / Endgame', dungeonIndex: 29, profile: 'endgame-realista', target: [0.08, 0.20] },
  { label: 'D31-D32 / Bem Equipado', dungeonIndex: 31, profile: 'bem-equipado', target: [0.01, 0.15] },
  { label: 'D31-D32 / Endgame', dungeonIndex: 31, profile: 'endgame-realista', target: [0.08, 0.20] },
  { label: 'D33 opcional / Endgame', dungeonIndex: 32, profile: 'endgame-realista', target: [0.03, 0.12] },
];

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const ordered = [...values].sort((a, b) => a - b);
  return ordered[Math.floor(ordered.length / 2)];
}

/**
 * Measures the explicit rebalance targets against the same runCombat engine
 * used by the class audit. The duration median uses successful fights only;
 * wins/samples remain visible so a short median cannot hide a failing profile.
 */
export function measureRebalanceTargets(seeds = 10): RebalanceMeasurement {
  const durations: RebalanceDurationMeasurement[] = [];
  for (const target of REBALANCE_DURATION_TARGETS) {
    const dungeon = DUNGEONS[target.dungeonIndex];
    const encounters: Array<['regular' | 'elite' | 'boss', number, [number, number]]> = [
      ['regular', dungeon.startDepth, target.regular],
      ['elite', dungeon.miniBossDepths?.[0] ?? dungeon.startDepth, target.elite],
      ['boss', dungeon.bossDepth, target.boss],
    ];
    for (const [kind, depth, range] of encounters) {
      const actions: number[] = [];
      for (const classId of Object.keys(CLASSES) as ClassId[]) for (let seed = 1; seed <= seeds; seed += 1) {
        const ch = equippedBalanceCharacter(classId, dungeon, target.profile);
        const result = withSeed(seed + target.dungeonIndex * 1000 + (kind === 'boss' ? 100000 : kind === 'elite' ? 50000 : 0), () => runCombat(createCombatState(ch, spawnEnemy(depth, dungeon), seed, ch.equippedAbilities, balancePriorities(ch))));
        if (result.won) actions.push(result.actions);
      }
      const medianActions = median(actions);
      durations.push({ label: target.label, dungeonId: dungeon.id, profile: target.profile, kind, samples: seeds * Object.keys(CLASSES).length, wins: actions.length, medianActions, target: range, withinTarget: actions.length > 0 && medianActions >= range[0] && medianActions <= range[1] });
    }
  }

  // D32 is the final normal dungeon; D33 is the optional Arena do Campeão.
  const finalDungeon = DUNGEONS[31];
  const finalBoss = (Object.keys(CLASSES) as ClassId[]).map((classId) => {
    let wins = 0;
    for (let seed = 1; seed <= seeds; seed += 1) if (simulateFight(classId, finalDungeon, true, seed, 'endgame-realista').won) wins += 1;
    const winRate = wins / seeds;
    return { classId, wins, samples: seeds, winRate, targetMinimum: 0.70, meetsTarget: winRate >= 0.70 };
  });
  const winRates = REBALANCE_WIN_RATE_TARGETS.map((target) => {
    const dungeon = DUNGEONS[target.dungeonIndex];
    let wins = 0;
    const classIds = Object.keys(CLASSES) as ClassId[];
    for (const classId of classIds) for (let seed = 1; seed <= seeds; seed += 1) {
      if (simulateDungeonRun(classId, dungeon, seed, target.profile).won) wins += 1;
    }
    const samples = classIds.length * seeds;
    const winRate = wins / samples;
    return { ...target, dungeonId: dungeon.id, samples, wins, winRate, withinTarget: winRate >= target.target[0] && winRate <= target.target[1] };
  });
  return { durations, finalBoss, winRates };
}

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
