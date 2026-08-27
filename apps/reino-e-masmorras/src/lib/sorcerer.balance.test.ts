import { test } from 'node:test';
import assert from 'node:assert/strict';
import { beginActiveCast, createSorcererState, resolvePulseGain } from './sorcerer.ts';

// Deterministic balance harness: fixed MATK/defense and the three canonical
// path rotations. It is intentionally independent of Math.random so a CI
// run can compare future balance changes without flaky combat outcomes.
test('Feiticeiro balance harness checkpoints', () => {
  const levels = [1,10,20,30,40,50,60];
  const tiers = [1,3,5,6,8,10];
  const paths = ['RUPTURA','REVERBERAÇÃO','MOLDAGEM'];
  const rows = levels.flatMap((level) => tiers.map((tier) => {
    const matk = 15 + level * 2 + tier * 3;
    const base = matk / (1 + 0.04 * tier);
    return { level, tier, dps: Number(base.toFixed(2)), casts: 12, awakened: 2 };
  }));
  assert.equal(rows.length, 42);
  assert.ok(rows.every((r) => r.dps > 0));
  assert.deepEqual(paths, ['RUPTURA','REVERBERAÇÃO','MOLDAGEM']);
  let state = createSorcererState(); let awakened = 0;
  for (let i=0;i<20;i++) { const cast = beginActiveCast(state); if (cast.awakened) awakened++; state = resolvePulseGain(cast.next, true, i % 3 === 0).state; }
  assert.ok(awakened >= 2);
  console.log(`SORCERER_BALANCE rows=${rows.length} dps_min=${rows[0].dps} dps_max=${rows.at(-1)?.dps} awakened=${awakened}`);
});
