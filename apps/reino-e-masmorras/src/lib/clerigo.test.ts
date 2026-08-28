import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SIGNIFICANT_HEAL_PCT, SIGNIFICANT_HEAL_PCT_LOWERED,
  clericBaseHp, clericDirectHealAmount, clericPassiveHealAmount, significantHealAmount,
} from './clerigo.ts';

test('Base de Cura preserva a curva universal por nível', () => {
  assert.equal(clericBaseHp(34, 1), 34);
  assert.equal(clericBaseHp(34, 10), 124);
});

test('cura direta usa Vida Base, Poder de Cura e eficiência final', () => {
  assert.equal(clericDirectHealAmount(100, 0.35, 0.20, 0.03), 43);
  assert.equal(clericPassiveHealAmount(100, 0.04, 0.20), 5);
});

test('Cura Significativa usa 15% ou 12% com Mãos Consagradas', () => {
  assert.equal(SIGNIFICANT_HEAL_PCT, 0.15);
  assert.equal(SIGNIFICANT_HEAL_PCT_LOWERED, 0.12);
  assert.equal(significantHealAmount(101, false), 16);
  assert.equal(significantHealAmount(101, true), 13);
});
