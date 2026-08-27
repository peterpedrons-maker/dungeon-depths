import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceInFlightArrows, alignInFlightArrows, archerDistanceLabel, clampArcherDistance,
  convergenceMultiplier, createArcherCombatState, gainArcherCadence, gainArcherSteps,
  scheduleInFlightArrows, tensionForPreciseHit,
} from './archer.ts';

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
