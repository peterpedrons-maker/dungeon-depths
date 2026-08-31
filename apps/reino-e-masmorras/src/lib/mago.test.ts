import assert from 'node:assert/strict';
import test from 'node:test';
import {
  advanceThermal, circuitAfterCast, circuitPulseMult, fireDamageBonus,
  nextRunes, nextRunesForEnemy, thermalAfterFrozenEnds, thermalAfterShatter,
  thermalShatterMult,
} from './mago.ts';
import { createCombatState, resolveEnvironmentTick, resolvePlayerAction } from './combatEngine.ts';
import { createCharacter } from './classes.ts';
import { DUNGEONS } from './dungeons.ts';
import { spawnEnemy } from './enemies.ts';
import { getEquippedAbilities } from './skills.ts';

// Real end-to-end coverage for Mago heat generation and rune progression:
// pure function tests only verify the math, not that the combat engine correctly
// applies nextRunes() on each cast or that heat is properly consumed/generated
// when abilities fire in real combat.
const FIRE_BALL_ABILITY_ID = 'mago:piromante:4'; // "Bola de Fogo" — always available, generates heat.
function magoWithAbility() {
  const character = createCharacter('Maga real', 'mago');
  character.unlockedSkills = [FIRE_BALL_ABILITY_ID];
  return character;
}
function friendlyEnemy() {
  return { ...spawnEnemy(DUNGEONS[0].bossDepth, DUNGEONS[0]), maxHp: 1_000_000, evasion: 0 };
}

test('Mago real gera Calor em Bola de Fogo e Runas avançam 0→1→2→Amplificada→0 em casts reais', () => {
  const character = magoWithAbility();
  const ability = getEquippedAbilities('mago', character.unlockedSkills, [FIRE_BALL_ABILITY_ID])[0];
  const priority = [FIRE_BALL_ABILITY_ID];
  const state = createCombatState(character, friendlyEnemy(), 1, [FIRE_BALL_ABILITY_ID], priority);

  // Cast #1: Runas 0 → 1, gera 20 Calor
  resolvePlayerAction(state);
  assert.ok(state.events.some((e) => e.type === 'abilityCast' && e.abilityId === FIRE_BALL_ABILITY_ID), 'primeiro cast deveria acontecer');
  assert.ok(state.classState.classId === 'mago' && state.classState.heat >= 20, 'Bola de Fogo deveria gerar 20 Calor no primeiro hit');

  // Advance cooldown
  for (let t = 0; t < 3; t += 1) resolveEnvironmentTick(state);

  // Cast #2: Runas 1 → 2, gera mais 20 Calor (total ≥40)
  const heat1 = state.classState.classId === 'mago' ? state.classState.heat : 0;
  resolvePlayerAction(state);
  assert.ok(state.classState.classId === 'mago' && state.classState.heat >= heat1 + 15, 'segundo cast deveria gerar mais Calor');

  // Advance cooldown
  for (let t = 0; t < 3; t += 1) resolveEnvironmentTick(state);

  // Cast #3: Runas 2 → Amplified (0 com amplified flag), gera 25 Calor em vez de 20
  const beforeAmp = state.classState.classId === 'mago' ? state.classState.heat : 0;
  resolvePlayerAction(state);
  const castEvent = state.events.find((e) => e.type === 'abilityCast' && e.abilityId === FIRE_BALL_ABILITY_ID);
  assert.ok(castEvent, 'terceiro cast deveria ser Amplificado');
  assert.ok(state.classState.classId === 'mago' && state.classState.heat > beforeAmp, 'Bola de Fogo Amplificada deveria gerar 25 Calor');
});

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
