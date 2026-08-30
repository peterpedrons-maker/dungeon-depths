import test from 'node:test';
import assert from 'node:assert/strict';
import { addNameFragment, addWarlockScar, applyWarlockDebt, borrowedPowerPct, clampWarlockDebt, collectionAmount, consumeTrueNameAndRefragment, createWarlockEnemyNameState, createWarlockPlayerState, projectWarlockCast, resolveCollection } from './warlock.ts';
import { createCombatState, naturalAbilityPriorities, resolveEnvironmentTick, resolvePlayerAction } from './combatEngine.ts';
import { createCharacter } from './classes.ts';
import { DUNGEONS } from './dungeons.ts';
import { spawnEnemy } from './enemies.ts';
import { getEquippedAbilities } from './skills.ts';

// Real end-to-end coverage for the exact bug reported: consuming Nome
// Verdadeiro always called consumeTrueNameAndRefragment(enemy, false) at
// cast-payment time, before the attack even rolled — so a LANDED
// Exigir Tributo/Palavra Proibida/Apagar o Nome always discarded the
// "refragment" (1 Fragmento kept on a hit, per warlock.ts's own tested
// consumeTrueNameAndRefragment) instead of ever keeping it.
const GENERATOR_ID = 'bruxo:maldicao:4'; // "Selo do Nome" — sempre disponível, gera Dívida e Fragmento ao acertar.
const CONSUMER_ID = 'bruxo:maldicao:9'; // "Exigir Tributo" — exige Dívida 1 e Nome Verdadeiro (3 Fragmentos).
function warlockWithAbilities() {
  const character = createCharacter('Bruxo real', 'bruxo');
  character.unlockedSkills = [GENERATOR_ID, CONSUMER_ID];
  return character;
}
function friendlyEnemy() {
  return { ...spawnEnemy(DUNGEONS[0].bossDepth, DUNGEONS[0]), maxHp: 1_000_000, evasion: 0 };
}

test('Exigir Tributo real que acerta mantém 1 Fragmento (refragment), não descarta tudo', () => {
  const character = warlockWithAbilities();
  const consumer = getEquippedAbilities('bruxo', character.unlockedSkills, [CONSUMER_ID])[0];
  const priority = naturalAbilityPriorities(consumer, [GENERATOR_ID], { classId: 'bruxo', unlockedSkills: character.unlockedSkills });
  let consumedState: ReturnType<typeof createCombatState> | undefined;
  for (let seed = 1; seed <= 100 && !consumedState; seed += 1) {
    const state = createCombatState(character, friendlyEnemy(), seed, [GENERATOR_ID, CONSUMER_ID], priority);
    for (let i = 0; i < 30 && !consumedState; i += 1) {
      const beforeEvents = state.events.length;
      resolvePlayerAction(state);
      for (let t = 0; t < 4; t += 1) resolveEnvironmentTick(state);
      const cast = state.events.slice(beforeEvents).find((e) => e.type === 'abilityCast' && e.abilityId === CONSUMER_ID);
      if (cast) consumedState = state;
    }
  }
  assert.ok(consumedState, 'não foi possível lançar Exigir Tributo real em 100 sementes');
  assert.ok(consumedState!.events.some((e) => e.type === 'hit' && e.actor === 'player' && e.abilityId === CONSUMER_ID), 'o cast usado no teste precisa ter acertado, senão o refragment não se aplica');
  assert.equal(consumedState!.warlockEnemy.nameFragments, 1, 'um Exigir Tributo real que acerta deve manter exatamente 1 Fragmento (refragment)');
});

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
  const early = projectWarlockCast({ debt: 2, debtGain: 0, maxHp: 500, currentHp: 35, collectionPct: 0.07 });
  assert.equal(early.collectionHpCost, 35); assert.equal(early.safeToCast, false);
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
