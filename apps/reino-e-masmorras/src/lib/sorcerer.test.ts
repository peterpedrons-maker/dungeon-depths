import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addControl, addFractures, addResonance, beginActiveCast, collapseMultiplier, consumeControl, consumeFractures, consumeResonance, createSorcererEnemyState, createSorcererState, echoMultipliers, resolvePulseGain, rupturePenetration, supernovaHitMultipliers } from './sorcerer.ts';

test('Pulso gera cast + acerto + crítico e desperta no 6', () => {
  let s = createSorcererState();
  s = resolvePulseGain(s, true, true).state;
  assert.equal(s.pulse, 3);
  const awakened = beginActiveCast({ ...s, pulse: 6 });
  assert.equal(awakened.awakened, true);
  assert.equal(awakened.next.pulse, 0);
});
test('Ressonância e Controle respeitam caps e consumo', () => {
  let s = createSorcererState();
  s = addResonance(s, 9); s = addControl(s, 9);
  assert.deepEqual(s, { pulse:0, resonance:2, control:2 });
  assert.equal(consumeResonance(s).resonance, 1);
  assert.equal(consumeControl(s, 2).control, 0);
});
test('Fraturas calculam pen e finalizadores com snapshot', () => {
  let e = createSorcererEnemyState(); e = addFractures(e, 9);
  assert.equal(e.fractures, 3); assert.equal(rupturePenetration(e.fractures), .09); assert.equal(collapseMultiplier(3), 2.30);
  assert.deepEqual(supernovaHitMultipliers(3), [.70,.70,1.06]); assert.equal(consumeFractures(e, 3).fractures, 0);
});
test('Eco repete cada payload em 40%', () => assert.deepEqual(echoMultipliers([.68,.55,.50]), [.272,.22000000000000003,.2]));
