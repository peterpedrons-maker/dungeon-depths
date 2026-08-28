import assert from 'node:assert/strict';
import test from 'node:test';
import { DUNGEONS } from './dungeons.ts';
import { CLASSES } from './classes.ts';
import { runCombatBalance, seededRng } from './combatBalance.ts';

test('harness de combate é determinístico e cobre o roster/dungeons disponíveis', () => {
  assert.equal(seededRng(42)(), seededRng(42)());
  const summary = runCombatBalance(2);
  assert.equal(summary.fights, Object.keys(CLASSES).length * DUNGEONS.length * 2 * 2);
  assert.ok(summary.results.every((r) => Number.isFinite(r.actions) && r.actions > 0));
  assert.ok(summary.results.every((r) => Number.isFinite(r.finalHp) && r.finalHp >= 0));
  assert.ok(summary.results.some((r) => r.won));
});
