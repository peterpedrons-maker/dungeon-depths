import test from 'node:test';
import assert from 'node:assert/strict';
import { createCombatState, resolvePlayerAction } from './combatEngine.ts';
import { createCharacter } from './classes.ts';
import { DUNGEONS } from './dungeons.ts';
import { spawnEnemy } from './enemies.ts';
import { MOMENTUM_GAIN_FIRST_HIT, MOMENTUM_GAIN_NEXT_HIT } from './knight.ts';

// Real end-to-end coverage for the exact bug reported: the live engine used
// to grant a flat +10 Momentum on every landed basic attack (never the real
// 15-first/8-next curve) AND +3 Determinação straight from the Cavaleiro's
// own hit landing — Determinação is only ever supposed to come from being
// hit, blocking, or absorbing damage (see resolveEnemyAction), never from
// the Cavaleiro's own offense.
function friendlyEnemy() {
  return { ...spawnEnemy(DUNGEONS[0].bossDepth, DUNGEONS[0]), maxHp: 1_000_000, evasion: 0 };
}

test('ataque básico real do Cavaleiro nunca gera Determinação', () => {
  const character = createCharacter('Cavaleiro real', 'cavaleiro');
  const state = createCombatState(character, friendlyEnemy(), 1, [], []);
  resolvePlayerAction(state);
  assert.ok(state.events.some((e) => e.type === 'hit' && e.actor === 'player'));
  assert.equal(state.classState.resources.determination, 0);
});

test('primeiro ataque básico real contra um inimigo vale 15 de Momentum, os seguintes valem 8', () => {
  const character = createCharacter('Cavaleiro real', 'cavaleiro');
  const enemy = friendlyEnemy();
  const state = createCombatState(character, enemy, 1, [], []);

  resolvePlayerAction(state);
  assert.equal(state.classState.resources.momentum, MOMENTUM_GAIN_FIRST_HIT);
  assert.equal(state.enemy.knightMomentumFirstHitUsed, true);

  resolvePlayerAction(state);
  assert.equal(state.classState.resources.momentum, MOMENTUM_GAIN_FIRST_HIT + MOMENTUM_GAIN_NEXT_HIT);

  resolvePlayerAction(state);
  assert.equal(state.classState.resources.momentum, MOMENTUM_GAIN_FIRST_HIT + MOMENTUM_GAIN_NEXT_HIT * 2);
});

test('o marcador de primeiro golpe reseta para um inimigo novo (novo createCombatState)', () => {
  const character = createCharacter('Cavaleiro real', 'cavaleiro');
  const stateVsFirstEnemy = createCombatState(character, friendlyEnemy(), 1, [], []);
  resolvePlayerAction(stateVsFirstEnemy);
  resolvePlayerAction(stateVsFirstEnemy);
  assert.equal(stateVsFirstEnemy.classState.resources.momentum, MOMENTUM_GAIN_FIRST_HIT + MOMENTUM_GAIN_NEXT_HIT);

  // Um novo inimigo (spawnEnemy fresco, sem knightMomentumFirstHitUsed) faz
  // o próximo acerto real valer 15 de novo, não continuar em 8.
  const stateVsSecondEnemy = createCombatState(character, friendlyEnemy(), 2, [], []);
  resolvePlayerAction(stateVsSecondEnemy);
  assert.equal(stateVsSecondEnemy.classState.resources.momentum, MOMENTUM_GAIN_FIRST_HIT);
});
