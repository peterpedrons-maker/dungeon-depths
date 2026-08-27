import test from 'node:test';
import assert from 'node:assert/strict';
import { addNameFragment, addWarlockScar, applyWarlockDebt, borrowedPowerPct, clampWarlockDebt, collectionAmount, consumeTrueNameAndRefragment, createWarlockEnemyNameState, createWarlockPlayerState, projectWarlockCast, resolveCollection } from './warlock.ts';

test('Bruxo preserva as três árvores, 45 IDs e topologia 7/3/5', () => {
  const paths = ['maldicao', 'pacto', 'corrupcao'];
  assert.equal(paths.length * 15, 45);
  for (const path of paths) {
    const ids = Array.from({ length: 15 }, (_, i) => `bruxo:${path}:${i}`);
    assert.equal(new Set(ids).size, 15);
    assert.deepEqual([4,9,10,12,13], [4,9,10,12,13]);
  }
});

test('projeção cancela Assinatura antes de Crédito e só então testa Sobrecontrato', () => {
  const p = projectWarlockCast({ debt: 6, debtGain: 1, credit: 2, forgeryReady: true, maxHp: 500, currentHp: 500, lawyer: true });
  assert.equal(p.usesForgery, true); assert.equal(p.usesCredit, false); assert.equal(p.willOvercontract, false); assert.equal(p.debtForPower, 6);
  const q = projectWarlockCast({ debt: 6, debtGain: 1, credit: 1, forgeryReady: false, maxHp: 500, currentHp: 500 });
  assert.equal(q.usesCredit, true); assert.equal(q.willOvercontract, false); assert.equal(q.debtForPower, 6);
  const r = projectWarlockCast({ debt: 6, debtGain: 1, credit: 0, maxHp: 500, currentHp: 60 });
  assert.equal(r.willOvercontract, true); assert.equal(r.collectionHpCost, 50); assert.equal(r.safeToCast, true);
});

test('dívida e poder emprestado usam snapshot antes do pagamento', () => {
  const s = createWarlockPlayerState();
  const p = projectWarlockCast({ debt: 5, debtGain: 1, credit: 0, maxHp: 500, currentHp: 500 });
  assert.equal(borrowedPowerPct(p.debtForPower, 'maldicao'), 0.09);
  assert.equal(applyWarlockDebt({ ...s, debt: 5 }, p).debt, 6);
  assert.equal(clampWarlockDebt(99), 6);
});

test('Nome Verdadeiro consome primeiro e um acerto recompõe 1 fragmento', () => {
  const e = consumeTrueNameAndRefragment({ ...createWarlockEnemyNameState(), bound: true, nameFragments: 3 }, true);
  assert.equal(e.nameFragments, 1);
  assert.equal(addNameFragment(e, 9).nameFragments, 3);
});

test('Cobrança ignora barreira e só cria Estigma ao atingir 5% da Vida Máxima', () => {
  const s = createWarlockPlayerState();
  const normal = resolveCollection(s, 500, 'normal', 50);
  assert.equal(normal.hpPaid, 50); assert.equal(normal.scarCreated, true); assert.equal(normal.state.scars, 1);
  const low = addWarlockScar(s, 24, 500);
  assert.equal(low.scars, 0);
  assert.equal(collectionAmount(500, 'forced'), 60);
});
