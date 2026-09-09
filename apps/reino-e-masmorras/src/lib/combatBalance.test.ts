import assert from 'node:assert/strict';
import test from 'node:test';
import { DUNGEONS } from './dungeons.ts';
import { CLASSES } from './classes.ts';
import { measureRebalanceTargets, runCombatBalance, runDungeonCoverage, seededRng } from './combatBalance.ts';

test('harness de combate é determinístico e cobre o roster/dungeons disponíveis', () => {
  assert.equal(seededRng(42)(), seededRng(42)());
  const summary = runCombatBalance(2);
  assert.equal(summary.fights, Object.keys(CLASSES).length * DUNGEONS.length * 2 * 2);
  assert.ok(summary.results.every((r) => Number.isFinite(r.actions) && r.actions > 0));
  assert.ok(summary.results.every((r) => Number.isFinite(r.finalHp) && r.finalHp >= 0));
  assert.ok(summary.results.some((r) => r.won));
});

test('duração real verifica as faixas do rebalance e boss final normal', () => {
  const report = measureRebalanceTargets(10);
  assert.equal(report.durations.length, 12);
  assert.ok(report.durations.every((row) => row.withinTarget && row.wins > 0));
  assert.equal(report.finalBoss.length, Object.keys(CLASSES).length);
  assert.ok(report.finalBoss.every((row) => row.meetsTarget && row.winRate >= 0.70));
  assert.equal(report.winRates.length, 13);
  assert.ok(report.winRates.every((row) => row.samples === 140 && row.withinTarget), report.winRates.map((row) => `${row.label}=${row.winRate}`).join(', '));
});

test('win rates reais preservam progressão e a faixa de dungeon especial', () => {
  const early = DUNGEONS.slice(0, 6);
  const isSpecial = (row: { dungeonId: string }) => early.some((dungeon) => dungeon.id === row.dungeonId && dungeon.special);
  const coverage = new Map([
    ['recem-chegado', runDungeonCoverage(3, 'recem-chegado')],
    ['farmado', runDungeonCoverage(3, 'farmado')],
    ['bem-equipado', runDungeonCoverage(3, 'bem-equipado')],
  ] as const);
  const rate = (profile: 'recem-chegado' | 'farmado' | 'bem-equipado', predicate: (row: { dungeonId: string }) => boolean) => {
    const rows = coverage.get(profile)!.filter(predicate);
    return rows.filter((row) => row.won).length / rows.length;
  };
  assert.ok(rate('recem-chegado', (row) => early.some((dungeon) => dungeon.id === row.dungeonId)) >= 0.05);
  assert.ok(rate('recem-chegado', (row) => early.some((dungeon) => dungeon.id === row.dungeonId)) <= 0.20);
  assert.ok(rate('farmado', (row) => early.some((dungeon) => dungeon.id === row.dungeonId)) >= 0.45);
  assert.ok(rate('farmado', (row) => early.some((dungeon) => dungeon.id === row.dungeonId)) <= 0.70);
  assert.ok(rate('bem-equipado', (row) => early.some((dungeon) => dungeon.id === row.dungeonId)) >= 0.70);
  assert.ok(rate('bem-equipado', (row) => early.some((dungeon) => dungeon.id === row.dungeonId)) <= 0.95);
  assert.ok(rate('farmado', isSpecial) >= 0.40);
  assert.ok(rate('farmado', isSpecial) <= 0.65);
  assert.ok(rate('bem-equipado', isSpecial) >= 0.50);
  assert.ok(rate('bem-equipado', isSpecial) <= 0.70);
});
