import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GUARD_BREAK_ACTIONS, GUARD_BREAK_DEF_PEN, GUARD_BREAK_RESET, GUARD_BREAK_RESET_VANGUARD,
  POSTURE_BASIC_DAMAGE, POSTURE_MAX, applyPostureDamage, bandValue, createWarriorEnemyState,
  crossesLowerBand, duelPostureDamage, parryReduction, postureBand, recoverPosture,
} from './warrior.ts';

test('Postura has exact bands and clamps', () => {
  assert.equal(postureBand(100), 'firm'); assert.equal(postureBand(67), 'firm');
  assert.equal(postureBand(66), 'unstable'); assert.equal(postureBand(34), 'unstable');
  assert.equal(postureBand(33), 'open'); assert.equal(postureBand(1), 'open'); assert.equal(postureBand(0), 'broken');
  assert.equal(applyPostureDamage(10, 18), 0); assert.equal(applyPostureDamage(100, -5), 100);
});

test('Posture recovery respects central priority and floor', () => {
  assert.equal(recoverPosture(94), 8); assert.equal(recoverPosture(40, { pressure: true }), 5);
  assert.equal(recoverPosture(40, { pressure: true, suppressed: true }), 4);
  assert.equal(recoverPosture(40, { pressure: true, suppressed: true, breathless: true }), 2);
  assert.equal(recoverPosture(40, { zero: true }), 0);
});

test('Parry and Duelist scaling respect caps', () => {
  assert.ok(Math.abs(parryReduction(.28, 100, true, true) - .41) < 1e-9);
  assert.equal(parryReduction(.44, 100, true, true), .45);
  assert.equal(duelPostureDamage(20, 20, true), 21);
  assert.equal(duelPostureDamage(20, 80, true), 22);
});

test('estado inicial, ataque básico e resets usam os valores definitivos', () => {
  assert.deepEqual(createWarriorEnemyState(), {
    current: POSTURE_MAX, max: POSTURE_MAX, guardBroken: false,
    offensiveActionsLeft: 0, ticksLeft: 0, pressureRecoveryPending: false,
    suppressedActionsLeft: 0, zeroRecoveryPending: false,
    vanguardFirstHitUsed: false, duelistFirmFirstHitUsed: false,
    perfectCounterAccuracyPending: false,
  });
  assert.equal(applyPostureDamage(100, POSTURE_BASIC_DAMAGE), 90);
  assert.equal(Math.min(POSTURE_MAX, 90 + recoverPosture(90)), 98);
  assert.equal(GUARD_BREAK_ACTIONS, 2);
  assert.equal(GUARD_BREAK_DEF_PEN, 0.20);
  assert.equal(GUARD_BREAK_RESET, 75);
  assert.equal(GUARD_BREAK_RESET_VANGUARD, 65);
});

test('Finta mantém piso 1 e nunca cria Guarda Quebrada', () => {
  assert.equal(applyPostureDamage(50, 16, 1), 34);
  assert.equal(applyPostureDamage(10, 16, 1), 1);
  assert.equal(applyPostureDamage(1, 16, 1), 1);
});

test('cruzamento de faixa gera uma leitura e tabelas dinâmicas usam a faixa atual', () => {
  assert.equal(crossesLowerBand(70, 60), true);
  assert.equal(crossesLowerBand(70, 20), true);
  assert.equal(crossesLowerBand(60, 55), false);
  const values = { firm: 1.25, unstable: 1.50, open: 1.75, broken: 1.90 } as const;
  assert.equal(bandValue(values, 100, 0), 1.25);
  assert.equal(bandValue(values, 50, 0), 1.50);
  assert.equal(bandValue(values, 20, 0), 1.75);
  assert.equal(bandValue(values, 0, 0), 1.90);
});
