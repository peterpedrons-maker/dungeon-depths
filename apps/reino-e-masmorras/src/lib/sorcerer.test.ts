import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addControl, addFractures, addResonance, beginActiveCast, collapseMultiplier, consumeControl, consumeFractures, consumeResonance, createSorcererEnemyState, createSorcererState, echoMultipliers, resolvePulseGain, rupturePenetration, supernovaHitMultipliers } from './sorcerer.ts';
import { createCombatState, resolveEnvironmentTick, resolvePlayerAction } from './combatEngine.ts';
import { createCharacter } from './classes.ts';
import { DUNGEONS } from './dungeons.ts';
import { spawnEnemy } from './enemies.ts';

// Real end-to-end coverage for the DungeonPanel<->combatEngine bridge — the
// pure resolvePulseGain/beginActiveCast tests above only prove the formula is
// right, not that resolvePlayerAction actually calls it correctly. This is
// exactly the class of bug that shipped: the live engine used to grant +2
// Pulso on a landed BASIC attack (no ability at all) and 0 Pulso on a missed
// active cast instead of the +1 owed just for casting.
const SORCERER_ABILITY_ID = 'feiticeiro:explosao:4'; // "Impacto de Origem" — 1.35x, sempre disponível, sorcererPath: 'rupture'.
function sorcererWithAbility() {
  const character = createCharacter('Feiticeira real', 'feiticeiro');
  character.unlockedSkills = [SORCERER_ABILITY_ID];
  return character;
}
function friendlyEnemy() {
  return { ...spawnEnemy(DUNGEONS[0].bossDepth, DUNGEONS[0]), maxHp: 1_000_000, evasion: 0 };
}

test('ataque básico real do Feiticeiro nunca gera Pulso', () => {
  const character = createCharacter('Feiticeira básica', 'feiticeiro');
  const state = createCombatState(character, friendlyEnemy(), 1, [], []);
  resolvePlayerAction(state);
  assert.ok(state.events.some((e) => e.type === 'hit' && e.actor === 'player'));
  assert.equal(state.classState.resources.pulse, 0);
});

test('cast real que erra ainda soma o +1 de conjurar', () => {
  const character = sorcererWithAbility();
  let missState: ReturnType<typeof createCombatState> | undefined;
  for (let seed = 1; seed <= 50 && !missState; seed += 1) {
    const s = createCombatState(character, { ...friendlyEnemy(), evasion: 1 }, seed, [SORCERER_ABILITY_ID], [SORCERER_ABILITY_ID]);
    s.playerMods.push({ stat: 'accuracy', pct: -1, roundsLeft: 1 });
    resolvePlayerAction(s);
    if (s.events.some((e) => e.type === 'miss' && e.actor === 'player')) missState = s;
  }
  assert.ok(missState, 'não foi possível reproduzir um erro real em 50 sementes');
  assert.equal(missState!.classState.resources.pulse, 1);
});

test('cast real que acerta soma +2 (cast + acerto)', () => {
  const character = sorcererWithAbility();
  const state = createCombatState(character, friendlyEnemy(), 1, [SORCERER_ABILITY_ID], [SORCERER_ABILITY_ID]);
  resolvePlayerAction(state);
  assert.ok(state.events.some((e) => e.type === 'hit' && e.actor === 'player'));
  assert.equal(state.classState.resources.pulse, 2);
});

test('cast real que acerta e crita soma +3 (cast + acerto + crítico)', () => {
  const character = sorcererWithAbility();
  let critState: ReturnType<typeof createCombatState> | undefined;
  for (let seed = 1; seed <= 200 && !critState; seed += 1) {
    const s = createCombatState(character, friendlyEnemy(), seed, [SORCERER_ABILITY_ID], [SORCERER_ABILITY_ID]);
    resolvePlayerAction(s);
    if (s.events.some((e) => e.type === 'crit' && e.actor === 'player')) critState = s;
  }
  assert.ok(critState, 'não foi possível reproduzir um crítico real em 200 sementes');
  assert.equal(critState!.classState.resources.pulse, 3);
});

test('Pulso persiste entre ações reais até 6, então Magia Desperta consome tudo sem realimentar no mesmo cast', () => {
  const character = sorcererWithAbility();
  const enemy = friendlyEnemy();
  let state = createCombatState(character, enemy, 1, [SORCERER_ABILITY_ID], [SORCERER_ABILITY_ID]);
  // 3 acertos consecutivos: 2 + 2 + 2 = 6 (sem crítico, cooldown do node é 3
  // então cada resolvePlayerAction real paga o cooldown; usamos ticks de
  // ambiente reais entre cada cast pra liberar a habilidade de novo).
  for (let i = 0; i < 3; i += 1) {
    resolvePlayerAction(state);
    for (let t = 0; t < 3; t += 1) resolveEnvironmentTick(state);
  }
  assert.equal(state.classState.resources.pulse, 6);
  const beforeAwakened = state.classState.resources.pulse;
  resolvePlayerAction(state);
  assert.equal(beforeAwakened, 6);
  // Depois do cast Desperto (mesmo acertando), o Pulso fica em 0 — não pode
  // realimentar +2 no mesmo cast que acabou de zerar (loop artificial).
  assert.equal(state.classState.resources.pulse, 0);
});

test('Pulso gera cast + acerto + crítico e desperta no 6', () => {
  let s = createSorcererState();
  s = resolvePulseGain(s, true, true).state;
  assert.equal(s.pulse, 3);
  const awakened = beginActiveCast({ ...s, pulse: 6 });
  assert.equal(awakened.awakened, true);
  assert.equal(awakened.next.pulse, 0);
});
test('Ressonância e Controle respeitam caps e consumo', () => {
  let s = createSorcererState();
  s = addResonance(s, 9); s = addControl(s, 9);
  assert.deepEqual(s, { pulse:0, resonance:2, control:2 });
  assert.equal(consumeResonance(s).resonance, 1);
  assert.equal(consumeControl(s, 2).control, 0);
});
test('Fraturas calculam pen e finalizadores com snapshot', () => {
  let e = createSorcererEnemyState(); e = addFractures(e, 9);
  assert.equal(e.fractures, 3); assert.equal(rupturePenetration(e.fractures), .09); assert.equal(collapseMultiplier(3), 2.30);
  assert.deepEqual(supernovaHitMultipliers(3), [.70,.70,1.06]); assert.equal(consumeFractures(e, 3).fractures, 0);
});
test('Eco repete cada payload em 40%', () => assert.deepEqual(echoMultipliers([.68,.55,.50]), [.272,.22000000000000003,.2]));
