import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DECOMPOSITION_MAX, PLAGUE_EFFECT_ID, SOUL_MAX, advanceSummonClock, applyEnemyStack, clampResource, makeBoneServant, plagueTickDamage, reaperExecuteMultiplier, soulsForCrossedThresholds, soulsForNextEnemy } from './necromancer.ts';
import { createCombatState, resolvePlayerAction } from './combatEngine.ts';
import { createCharacter } from './classes.ts';
import { DUNGEONS } from './dungeons.ts';
import { spawnEnemy } from './enemies.ts';

// Real end-to-end coverage for the exact bug reported: Almas real cap was
// hardcoded to 10 in several combatEngine.ts call sites instead of the
// documented/UI cap of 6 (SOUL_MAX, classMechanics.ts: 'necromante:souls'
// combatDisplay.maxValue). A Necromante who banked souls across several
// kills without spending them could hold up to 10, not 6.
const PLAGUE_ABILITY_ID = 'necromante:decomposicao:4'; // "Praga Necrótica" — sempre disponível.
function necromancerWithAbility() {
  const character = createCharacter('Necromante real', 'necromante');
  character.unlockedSkills = [PLAGUE_ABILITY_ID];
  return character;
}
function killableEnemy() {
  return { ...spawnEnemy(DUNGEONS[0].bossDepth, DUNGEONS[0]), maxHp: 1, evasion: 0 };
}

test('Almas reais nunca ultrapassam o teto real de 6 mesmo matando vários inimigos seguidos', () => {
  const character = createCharacter('Necromante real', 'necromante');
  let state = createCombatState(character, killableEnemy(), 1, [], []);
  for (let i = 0; i < 8 && state.classState.resources.souls < SOUL_MAX; i += 1) {
    resolvePlayerAction(state);
    if (state.won) state = createCombatState(character, killableEnemy(), i + 2, [], []);
  }
  assert.ok(state.classState.resources.souls <= SOUL_MAX, `Almas (${state.classState.resources.souls}) nunca podem passar de ${SOUL_MAX}`);
});

test('Praga Necrótica real grava Decomposição e Praga no classState para o DungeonPanel sincronizar de volta', () => {
  const character = necromancerWithAbility();
  const state = createCombatState(character, { ...spawnEnemy(DUNGEONS[0].bossDepth, DUNGEONS[0]), maxHp: 1_000_000, evasion: 0 }, 1, [PLAGUE_ABILITY_ID], [PLAGUE_ABILITY_ID]);
  resolvePlayerAction(state);
  assert.ok(state.events.some((e) => e.type === 'hit' && e.actor === 'player'));
  assert.equal(state.classState.decomposition, 2);
  assert.equal(state.classState.plague, 4);
  assert.equal(state.classState.plagueMultiplier, 0.16);
});

test('Almas cruzam todos os thresholds uma única vez e respeitam cap', () => {
  const first = soulsForCrossedThresholds(80, 45, 100, new Set());
  assert.equal(first.gained, 2);
  const again = soulsForCrossedThresholds(80, 20, 100, first.crossed);
  assert.equal(again.gained, 1);
  assert.equal(clampResource(99), 6);
});

test('carry entre inimigos é 1-2 ou 1-3 com Sede dos Mortos', () => {
  assert.equal(soulsForNextEnemy(0, false), 1);
  assert.equal(soulsForNextEnemy(6, false), 2);
  assert.equal(soulsForNextEnemy(6, true), 3);
});

test('Decomposição acumula até cinco e renova quatro ciclos', () => {
  let stack = applyEnemyStack(undefined, 2);
  stack = applyEnemyStack({ ...stack, ticksRemaining: 1 }, 9);
  assert.equal(stack.stacks, DECOMPOSITION_MAX);
  assert.equal(stack.ticksRemaining, 4);
});

test('Praga usa snapshot e recebe +4% multiplicativo por stack', () => {
  const plague = { id: PLAGUE_EFFECT_ID, sourceId: 'x', snapshotPower: 100, dmgMultiplier: 0.16, ticksRemaining: 4, tags: ['dot'], canCrit: false, bypassDefense: true };
  assert.equal(plagueTickDamage(plague, 0), 16);
  assert.equal(plagueTickDamage(plague, 5), 19);
});

test('relógio genérico do Servo funciona também em catch-up', () => {
  const summon = makeBoneServant('s1', 'skill', 4);
  const result = advanceSummonClock(summon, 9_500);
  assert.equal(result.attacks, 3);
  assert.equal(result.next.attacksRemaining, 1);
  assert.equal(result.next.elapsedMs, 500);
  assert.equal(result.next.canCrit, false);
  assert.equal(result.next.canLifesteal, false);
});

test('curva de execução respeita exemplos e hard cap', () => {
  assert.equal(reaperExecuteMultiplier(0.25, 2.75, 0.25, 0.15, 3.5), 2.75);
  assert.equal(reaperExecuteMultiplier(0.10, 2.75, 0.25, 0.15, 3.5), 3.2);
  assert.equal(reaperExecuteMultiplier(0, 2.75, 0.25, 0.15, 3.5), 3.5);
});

test('árvores definitivas preservam 45 IDs e composição 7/3/5', () => {
  const source = readFileSync(new URL('./skills.ts', import.meta.url), 'utf8').split('// Redesign definitivo do Necromante.')[1];
  assert.ok(source);
  for (const id of ['decomposicao', 'drenar-vida', 'ceifador']) {
    const start = source.indexOf(`buildPath('necromante', '${id}'`);
    const next = source.indexOf("buildPath('necromante'", start + 30);
    const block = source.slice(start, next < 0 ? source.indexOf('\n];', start) : next);
    assert.equal((block.match(/^    \{ name:/gm) ?? []).length, 15);
    assert.equal((block.match(/ability: \{/g) ?? []).length, 5);
  }
});

test('níveis obrigatórios mantêm recurso limitado e fórmulas finitas', () => {
  for (const level of [1, 2, 3, 4, 5, 10, 20, 30, 40, 50, 60]) {
    const snapshotMatk = 13 + (level - 1) * 2;
    assert.ok(Number.isFinite(plagueTickDamage({ id: PLAGUE_EFFECT_ID, sourceId: 'sim', snapshotPower: snapshotMatk, dmgMultiplier: 0.16, ticksRemaining: 4, tags: [], canCrit: false, bypassDefense: true }, 5)));
    assert.ok(clampResource(level) <= 6);
  }
});
