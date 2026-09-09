import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceInFlightArrows, alignInFlightArrows, archerDistanceLabel, clampArcherDistance,
  convergenceMultiplier, createArcherCombatState, gainArcherCadence, gainArcherSteps,
  scheduleInFlightArrows, tensionForPreciseHit,
} from './archer.ts';
import { createCombatState, resolveEnvironmentTick, resolvePlayerAction } from './combatEngine.ts';
import { createCharacter } from './classes.ts';
import { DUNGEONS } from './dungeons.ts';
import { spawnEnemy } from './enemies.ts';
import { getEquippedAbilities } from './skills.ts';

test('Distância, rótulos e geração de recursos respeitam caps', () => {
  assert.equal(clampArcherDistance(-4), 0); assert.equal(clampArcherDistance(9), 3);
  assert.equal(archerDistanceLabel(3), 'HORIZONTE');
  const state = gainArcherSteps(gainArcherCadence(createArcherCombatState(), 99), 99);
  assert.equal(state.cadence, 6); assert.equal(state.steps, 3);
  assert.deepEqual([tensionForPreciseHit(0), tensionForPreciseHit(1), tensionForPreciseHit(2), tensionForPreciseHit(3)], [4,10,18,24]);
});

test('Flechas em voo avançam só quando já existiam e aterrissam por ordem', () => {
  const base = createArcherCombatState();
  const state = scheduleInFlightArrows(base, [
    { sourceAbilityId: 'a', sourceName: 'A', atk: 10, accuracy: 1, critChance: 0, critDmgMult: 1.5, defPenPct: 0, dmgMult: .5, actionsRemaining: 1 },
    { sourceAbilityId: 'b', sourceName: 'B', atk: 10, accuracy: 1, critChance: 0, critDmgMult: 1.5, defPenPct: 0, dmgMult: .5, actionsRemaining: 2 },
  ]);
  const advanced = advanceInFlightArrows(state, [1], 1);
  assert.deepEqual(advanced.landed.map((a) => a.id), [1]);
  assert.deepEqual(advanced.state.arrows.map((a) => a.id), [2]);
});

test('Flecha de Vento aproxima timers deterministicamente e Convergência escala', () => {
  const state = scheduleInFlightArrows(createArcherCombatState(), [1,2,3].map((timer, i) => ({ sourceAbilityId: `${i}`, sourceName: `${i}`, atk: 1, accuracy: 1, critChance: 0, critDmgMult: 1.5, defPenPct: 0, dmgMult: 1, actionsRemaining: timer })));
  assert.deepEqual(alignInFlightArrows(state).arrows.map((a) => a.actionsRemaining), [2,2,2]);
  assert.equal(convergenceMultiplier(0), 1); assert.equal(convergenceMultiplier(1), 1.1); assert.equal(convergenceMultiplier(3), 1.3);
});

test('Flechas em voo real: agendadas e pousam via resolveEnvironmentTick no combate real', () => {
  const character = createCharacter('Arqueiro real', 'arqueiro');
  const enemy = { ...spawnEnemy(DUNGEONS[0].bossDepth, DUNGEONS[0]), maxHp: 1_000_000, evasion: 0 };
  const state = createCombatState(character, enemy, 1, [], []);

  // Lança uma habilidade com flecha em voo de teste com actionsRemaining=2
  state.archerState = scheduleInFlightArrows(state.archerState, [
    { sourceAbilityId: 'test-flight', sourceName: 'Flecha em Voo', atk: 100, accuracy: 1.0, critChance: 0, critDmgMult: 1.5, defPenPct: 0, dmgMult: 0.5, actionsRemaining: 2 }
  ]);
  assert.equal(state.archerState.arrows.length, 1, 'flecha agendada');

  // resolveEnvironmentTick deve avançar a flecha
  const beforeEnemyHp = state.enemyHp;
  resolveEnvironmentTick(state);
  assert.equal(state.archerState.arrows.length, 1, 'flecha ainda existe após 1 tick (actionsRemaining: 1)');
  assert.equal(state.enemyHp, beforeEnemyHp, 'inimigo não sofre dano se flecha ainda não pousou');

  // 2º tick deve fazer a flecha pousar e causar dano
  const beforeEnemyHp2 = state.enemyHp;
  resolveEnvironmentTick(state);
  assert.equal(state.archerState.arrows.length, 0, 'flecha pousou e saiu da lista');
  assert.ok(state.enemyHp < beforeEnemyHp2, 'inimigo sofre dano quando flecha pousa');
  assert.ok(state.events.some(e => e.type === 'hit' && e.actor === 'player'), 'evento de hit registrado quando flecha pousa');
});
