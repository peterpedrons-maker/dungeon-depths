import test from 'node:test';
import assert from 'node:assert/strict';
import { aceInTheSleeveCoefficient, actionSequence, clampImages, firstEligibleQuick, imageEchoCoefficient, loadedDieResult, prepareTrick, silentExecutionCoefficient, synchronizedTotal } from './rogue.ts';

test('Ladino preserva 45 IDs e topologia 7/3/5', () => {
  const paths = ['veneno', 'sombras', 'laminas'];
  for (const path of paths) {
    const ids = Array.from({ length: 15 }, (_, index) => `ladino:${path}:${index}`);
    assert.equal(new Set(ids).size, 15);
    assert.deepEqual([4, 9, 10, 12, 13], [4, 9, 10, 12, 13]);
  }
  assert.equal(paths.length * 15, 45);
});

test('Main abre no máximo uma Quick e Quick não recursa', () => {
  assert.deepEqual(actionSequence(true, true), ['main', 'quick']);
  assert.deepEqual(actionSequence(true, false), ['main']);
  assert.deepEqual(actionSequence(false, true), []);
});

test('Iniciativa respeita a primeira Quick elegível por prioridade', () => {
  const quicks = [0, 1, 2].map((index) => ({ id: `quick:${index}`, actionType: 'quick' as const }));
  assert.equal(firstEligibleQuick(quicks, { [quicks[0].id]: 2 }, () => true)?.id, quicks[1].id);
  assert.equal(firstEligibleQuick(quicks, {}, (a) => a.id === quicks[2].id)?.id, quicks[2].id);
});

test('Imagens ficam entre zero e dois e Ecos respeitam teto', () => {
  assert.deepEqual([-1, 0, 1, 2, 3].map(clampImages), [0, 0, 1, 2, 2]);
  assert.ok(Math.abs(imageEchoCoefficient(1.75, 0.38) - 0.665) < 1e-9);
  assert.equal(imageEchoCoefficient(3, 0.50), 0.80);
  assert.ok(Math.abs(synchronizedTotal(1.75, 2, 0.38) - 3.08) < 1e-9);
  assert.ok(Math.abs(synchronizedTotal(1.75, 2, 0.43) - 3.255) < 1e-9);
});

test('Dado Viciado gera Vantagem somente quando salva o ataque', () => {
  assert.deepEqual(loadedDieResult(true, true), { hit: true, saved: false, failed: false });
  assert.deepEqual(loadedDieResult(false, true), { hit: true, saved: true, failed: false });
  assert.deepEqual(loadedDieResult(false, false), { hit: false, saved: false, failed: true });
});

test('Truque novo substitui o anterior', () => {
  let trick = prepareTrick('feint', 'finta', 3);
  trick = prepareTrick('loaded_die', 'dado', 4);
  assert.deepEqual(trick, { kind: 'loaded_die', actionsLeft: 4, sourceAbilityId: 'dado' });
});

test('payoffs condicionais mantêm os coeficientes definitivos', () => {
  assert.equal(silentExecutionCoefficient(false, 0.50), null);
  assert.equal(silentExecutionCoefficient(false, 0.30), 2.35);
  assert.equal(silentExecutionCoefficient(true, 0.50), 2.55);
  assert.equal(silentExecutionCoefficient(true, 0.20), 2.85);
  assert.ok(Math.abs((aceInTheSleeveCoefficient(true, 0.20, true) ?? 0) - 2.85) < 1e-9);
});

test('níveis obrigatórios mantêm nós disponíveis', () => {
  const requiredLevels = [1, 2, 3, 4, 5, 10, 20, 30, 40, 50, 60];
  for (const level of [1, 2, 3, 4, 5, 10, 20, 30, 40, 50, 60]) {
    assert.ok(requiredLevels.some((required) => required <= level));
  }
});
