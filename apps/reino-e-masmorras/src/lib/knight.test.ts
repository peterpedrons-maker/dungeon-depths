import test from 'node:test';
import assert from 'node:assert/strict';
import { createCombatState, resolvePlayerAction } from './combatEngine.ts';
import { createCharacter } from './classes.ts';
import { DUNGEONS } from './dungeons.ts';
import { spawnEnemy } from './enemies.ts';
import { MOMENTUM_GAIN_FIRST_HIT, MOMENTUM_GAIN_NEXT_HIT } from './knight.ts';
import { SKILL_TREES } from './skills.ts';

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

// Real end-to-end coverage for the bug reported by audit: Retaliação charges
// accumulated and displayed in the UI but were never consumed anywhere —
// the bonus DEF-based damage promised by Reação Defensiva (cavaleiro:bastiao:6)
// never actually landed. Fixed in combatEngine.ts's attack().
test('Retaliação real consome 1 carga e soma dano bônus de DEF/ATK no próximo golpe direto', () => {
  const character = createCharacter('Cavaleiro real', 'cavaleiro');
  const seed = 7;
  const withCharge = createCombatState(character, friendlyEnemy(), seed, [], []);
  (withCharge.classState as unknown as Record<string, unknown>).retaliationCharges = 1;
  resolvePlayerAction(withCharge);
  const dmgWithCharge = withCharge.enemy.maxHp - withCharge.enemyHp;
  assert.equal((withCharge.classState as unknown as Record<string, unknown>).retaliationCharges, 0, 'a carga deveria ser consumida');

  const withoutCharge = createCombatState(character, friendlyEnemy(), seed, [], []);
  resolvePlayerAction(withoutCharge);
  const dmgWithoutCharge = withoutCharge.enemy.maxHp - withoutCharge.enemyHp;
  assert.ok(dmgWithCharge > dmgWithoutCharge, `dano com Retaliação (${dmgWithCharge}) deveria ser maior que sem (${dmgWithoutCharge})`);
});

test('Retaliação não é consumida quando não há cargas disponíveis', () => {
  const character = createCharacter('Cavaleiro real', 'cavaleiro');
  const state = createCombatState(character, friendlyEnemy(), 3, [], []);
  resolvePlayerAction(state);
  assert.equal((state.classState as unknown as Record<string, unknown>).retaliationCharges ?? 0, 0);
});

// Real end-to-end coverage for the bug reported by audit: Comando Supremo's
// flag was set and displayed in the UI but never threaded into the combat
// engine's CombatState — Ordem abilities never received their "supreme"
// multipliers. Fixed via applyCommandSupremeIfActive in combatEngine.ts.
test('Comando Supremo real troca Ordem: Ataque pela versão suprema e consome as 3 Ordens de uma vez', () => {
  const comando = SKILL_TREES.cavaleiro.find((path) => path.id === 'comando')!;
  const ordemAtaque = comando.nodes.find((node) => node.name === 'Ordem: Ataque')!.ability!;
  const character = {
    ...createCharacter('Cavaleiro real', 'cavaleiro'),
    unlockedSkills: [comando.nodes.find((node) => node.name === 'Ordem: Ataque')!.id],
    equippedAbilities: [ordemAtaque.id],
    priorities: [ordemAtaque.id],
  };
  const seed = 11;

  const supremeState = createCombatState(character, friendlyEnemy(), seed, [ordemAtaque.id], [ordemAtaque.id]);
  (supremeState.classState as unknown as Record<string, unknown>).commandSupreme = true;
  supremeState.classState.resources.orders = 3;
  resolvePlayerAction(supremeState);
  const dmgSupreme = supremeState.enemy.maxHp - supremeState.enemyHp;
  assert.equal(supremeState.classState.resources.orders, 0, 'as 3 Ordens deveriam ser consumidas de uma vez');
  assert.equal((supremeState.classState as unknown as Record<string, unknown>).commandSupreme, false, 'Comando Supremo é consumido no cast, uma aplicação só');

  const baseState = createCombatState(character, friendlyEnemy(), seed, [ordemAtaque.id], [ordemAtaque.id]);
  resolvePlayerAction(baseState);
  const dmgBase = baseState.enemy.maxHp - baseState.enemyHp;
  assert.ok(dmgSupreme > dmgBase, `dano supremo (${dmgSupreme}) deveria ser maior que o base (${dmgBase})`);
});
