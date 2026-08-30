import test from 'node:test';
import assert from 'node:assert/strict';
import { createCombatState, resolvePlayerAction, resolveEnemyAction } from './combatEngine.ts';
import { createCharacter } from './classes.ts';
import { DUNGEONS } from './dungeons.ts';
import { spawnEnemy } from './enemies.ts';

// Real end-to-end coverage for the exact bug reported: the live simulation
// engine used to grant +1 Rastro every time the Caçador's OWN hit landed
// (inside executeCombatAbilityEffect), when the spec (classMechanics.ts:
// 'cacador:trail') is explicit that Rastro only comes from the ENEMY
// completing a real action (hit or miss), never from the Caçador's own
// offense. DungeonPanel's live hunterOnEnemyRealAction() already did this
// correctly; only the shared simulation engine (resolveEnemyAction) had the
// wrong trigger.
function trackingHunter() {
  const character = createCharacter('Caçador real', 'cacador');
  character.unlockedSkills = ['cacador:rastreio:1'];
  return character;
}
function friendlyEnemy() {
  return { ...spawnEnemy(DUNGEONS[0].bossDepth, DUNGEONS[0]), maxHp: 1_000_000, evasion: 0 };
}

test('ataque básico real do Caçador nunca gera Rastro', () => {
  const character = trackingHunter();
  const state = createCombatState(character, friendlyEnemy(), 1, [], []);
  resolvePlayerAction(state);
  assert.ok(state.events.some((e) => e.type === 'hit' && e.actor === 'player'));
  assert.equal(state.enemy.hunterTrail ?? 0, 0);
});

test('uma ação real do inimigo (acerto) gera +1 Rastro real', () => {
  const character = trackingHunter();
  const state = createCombatState(character, { ...friendlyEnemy(), accuracy: 1 }, 1, [], []);
  state.playerMods.push({ stat: 'evasion', pct: -1, roundsLeft: 99 });
  resolveEnemyAction(state);
  assert.ok(state.events.some((e) => e.type === 'hit' && e.actor === 'enemy'));
  assert.equal(state.enemy.hunterTrail, 1);
});

test('uma ação real do inimigo que ERRA também gera +1 Rastro real', () => {
  const character = trackingHunter();
  let missState: ReturnType<typeof createCombatState> | undefined;
  for (let seed = 1; seed <= 50 && !missState; seed += 1) {
    const s = createCombatState(character, { ...friendlyEnemy(), accuracy: 0 }, seed, [], []);
    resolveEnemyAction(s);
    if (s.events.some((e) => e.type === 'miss' && e.actor === 'enemy')) missState = s;
  }
  assert.ok(missState, 'não foi possível reproduzir um erro real do inimigo em 50 sementes');
  assert.equal(missState!.enemy.hunterTrail, 1);
});

test('sem o caminho Rastreio desbloqueado, Rastro nunca é gerado', () => {
  const character = createCharacter('Caçador sem rastreio', 'cacador');
  const state = createCombatState(character, { ...friendlyEnemy(), accuracy: 1 }, 1, [], []);
  state.playerMods.push({ stat: 'evasion', pct: -1, roundsLeft: 99 });
  resolveEnemyAction(state);
  assert.ok(state.events.some((e) => e.type === 'hit' && e.actor === 'enemy'));
  assert.equal(state.enemy.hunterTrail ?? 0, 0);
});

test('Rastro real acumula até o teto de 5 ao longo de várias ações reais do inimigo', () => {
  const character = trackingHunter();
  const state = createCombatState(character, { ...friendlyEnemy(), accuracy: 1 }, 1, [], []);
  state.playerMods.push({ stat: 'evasion', pct: -1, roundsLeft: 99 });
  for (let i = 0; i < 8; i += 1) resolveEnemyAction(state);
  assert.equal(state.enemy.hunterTrail, 5);
});
