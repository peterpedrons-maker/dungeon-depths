import assert from 'node:assert/strict';
import test from 'node:test';
import {
  advanceThermal, circuitAfterCast, circuitPulseMult, fireDamageBonus,
  nextRunes, nextRunesForEnemy, thermalAfterFrozenEnds, thermalAfterShatter,
  thermalShatterMult,
} from './mago.ts';

test('Runas seguem 0 → 1 → 2 → Amplificada → 0 e carregam no máximo 1', () => {
  assert.deepEqual(nextRunes(0), { next: 1, amplified: false });
  assert.deepEqual(nextRunes(1), { next: 2, amplified: false });
  assert.deepEqual(nextRunes(2), { next: 0, amplified: true });
  assert.equal(nextRunesForEnemy(0), 0);
  assert.equal(nextRunesForEnemy(2), 1);
});

test('Calor aplica as faixas de dano de Fogo', () => {
  assert.equal(fireDamageBonus(29), 0);
  assert.equal(fireDamageBonus(30), 0.04);
  assert.equal(fireDamageBonus(60), 0.09);
  assert.equal(fireDamageBonus(90), 0.15);
});

test('Estado Térmico avança sem stacks e Estilhaçar usa o multiplicador correto', () => {
  assert.equal(advanceThermal('normal', 1), 'chilled');
  assert.equal(advanceThermal('chilled', 1), 'fragile');
  assert.equal(advanceThermal('fragile', 1), 'frozen');
  assert.equal(advanceThermal('frozen', 3), 'frozen');
  assert.equal(thermalShatterMult('chilled'), 1.55);
  assert.equal(thermalShatterMult('fragile'), 2.15);
  assert.equal(thermalShatterMult('frozen'), 2.75);
  assert.equal(thermalAfterFrozenEnds(false), 'chilled');
  assert.equal(thermalAfterFrozenEnds(true), 'fragile');
  assert.equal(thermalAfterShatter('frozen', true), 'chilled');
});

test('Circuito só sobe com polaridades opostas ou Condutor Perfeito', () => {
  assert.deepEqual(circuitAfterCast('none', 'positive', 0, false), { last: 'positive', circuit: 0, closed: false });
  assert.deepEqual(circuitAfterCast('positive', 'negative', 0, false), { last: 'negative', circuit: 1, closed: true });
  assert.deepEqual(circuitAfterCast('negative', 'negative', 2, false), { last: 'negative', circuit: 1, closed: false });
  assert.deepEqual(circuitAfterCast('negative', 'negative', 1, true), { last: 'negative', circuit: 2, closed: true });
  assert.equal(circuitPulseMult(1, false), 0.15);
  assert.equal(circuitPulseMult(2, false), 0.22);
  assert.equal(circuitPulseMult(3, false), 0.32);
  assert.equal(circuitPulseMult(3, true), 0.40);
});
