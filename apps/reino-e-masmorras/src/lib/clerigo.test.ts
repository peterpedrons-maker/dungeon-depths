import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CLERIC_APOCALIPSE_SAGRADO_ABILITY_ID,
  CLERIC_IRA_CONSUMIDORA_ABILITY_ID,
  CLERIC_SENTENCA_FINAL_ABILITY_ID,
  JUDGMENT_BASE_DURATION_TICKS, JUDGMENT_CONVICCAO_DURATION_TICKS,
  SIGNIFICANT_HEAL_PCT, SIGNIFICANT_HEAL_PCT_LOWERED,
  clericBaseHp, clericDirectHealAmount, clericPassiveHealAmount, significantHealAmount,
  judgmentDurationForSkills, prioritizeClericTrialRotation,
} from './clerigo.ts';
import { createCharacter } from './classes.ts';
import { createCombatState, resolveEnvironmentTick, resolvePlayerAction } from './combatEngine.ts';
import { DUNGEONS } from './dungeons.ts';
import { spawnEnemy } from './enemies.ts';
import { SKILL_TREES } from './skills.ts';

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

test('Convicção muda a duração real de Julgamento de 5 para 6 ciclos', () => {
  assert.equal(judgmentDurationForSkills([]), JUDGMENT_BASE_DURATION_TICKS);
  assert.equal(judgmentDurationForSkills(['clerigo:provacao:5']), JUDGMENT_CONVICCAO_DURATION_TICKS);
});

test('rotação de Provação prioriza Apocalipse e preserva seu preparo', () => {
  const sentenca = { id: CLERIC_SENTENCA_FINAL_ABILITY_ID };
  const ira = { id: CLERIC_IRA_CONSUMIDORA_ABILITY_ID };
  const chama = { id: 'clerigo:provacao:4' };
  const apocalipse = { id: CLERIC_APOCALIPSE_SAGRADO_ABILITY_ID };
  assert.equal(prioritizeClericTrialRotation([sentenca, ira, chama, apocalipse], {
    apocalypseEquipped: true, apocalypseCooldown: 0, judgmentStacks: 5, faith: 3,
  })[0].id, CLERIC_APOCALIPSE_SAGRADO_ABILITY_ID);
  assert.deepEqual(prioritizeClericTrialRotation([sentenca, ira, chama], {
    apocalypseEquipped: true, apocalypseCooldown: 0, judgmentStacks: 3, faith: 2,
  }).map((ability) => ability.id), [chama.id]);
  assert.deepEqual(prioritizeClericTrialRotation([sentenca, ira, chama], {
    apocalypseEquipped: true, apocalypseCooldown: 4, judgmentStacks: 3, faith: 2,
  }).map((ability) => ability.id), [sentenca.id, ira.id, chama.id]);
});

test('motor real acumula Julgamento e lança Apocalipse repetidamente sem injeção', () => {
  const trial = SKILL_TREES.clerigo.find((path) => path.id === 'provacao')!;
  const unlockedSkills = trial.nodes.map((node) => node.id);
  const activeIds = trial.nodes.flatMap((node) => node.ability ? [node.ability.id] : []);
  const character = {
    ...createCharacter('Clérigo Provação', 'clerigo'),
    unlockedSkills,
    equippedAbilities: activeIds,
    priorities: activeIds,
  };
  const durableEnemy = { ...spawnEnemy(DUNGEONS[0].bossDepth, DUNGEONS[0]), maxHp: 1_000_000_000 };
  const state = createCombatState(character, durableEnemy, 29, activeIds, activeIds);
  const casts: string[] = [];
  for (let action = 0; action < 60; action += 1) {
    const beforeEvents = state.events.length;
    resolvePlayerAction(state);
    for (const event of state.events.slice(beforeEvents)) {
      if (event.type === 'abilityCast' && event.abilityId) casts.push(event.abilityId);
    }
    resolveEnvironmentTick(state);
  }
  assert.ok(casts.filter((id) => id === CLERIC_APOCALIPSE_SAGRADO_ABILITY_ID).length >= 3, casts.join(','));
  assert.ok(casts.filter((id) => id === 'clerigo:provacao:4').length >= 8, casts.join(','));

  const durationState = createCombatState(character, durableEnemy, 7, ['clerigo:provacao:4'], ['clerigo:provacao:4']);
  resolvePlayerAction(durationState);
  assert.equal(durationState.enemy.judgment?.stacks, 2);
  assert.equal(durationState.enemy.judgment?.ticksLeft, JUDGMENT_CONVICCAO_DURATION_TICKS);
});

test('aplicar novo Julgamento renova a duração de TODOS os stacks e gera Fé nos marcos 3/5', () => {
  // Só Chama Purificadora (sem Convicção) + Peso do Veredito — foca no
  // comportamento de renovação de duração e nos marcos de Fé do motor real,
  // sem depender de crítico (Zelo Inflexível/Acusação são cobertos à parte).
  const character = {
    ...createCharacter('Clériga Julgamento', 'clerigo'),
    unlockedSkills: ['clerigo:provacao:4', 'clerigo:provacao:8'],
    equippedAbilities: ['clerigo:provacao:4'],
    priorities: ['clerigo:provacao:4'],
  };
  const durableEnemy = { ...spawnEnemy(DUNGEONS[0].bossDepth, DUNGEONS[0]), maxHp: 1_000_000_000, evasion: 0 };
  const state = createCombatState(character, durableEnemy, 11, ['clerigo:provacao:4'], ['clerigo:provacao:4']);
  const faithOf = () => (state.classState.classId === 'clerigo' ? state.classState.faith : 0);

  resolvePlayerAction(state); // stacks 0 -> 2
  assert.equal(state.enemy.judgment?.stacks, 2);
  assert.equal(state.enemy.judgment?.ticksLeft, JUDGMENT_BASE_DURATION_TICKS);
  const faithAfterFirstCast = faithOf();

  for (let t = 0; t < 3; t += 1) resolveEnvironmentTick(state); // duration decays 5 -> 2, cooldown still not ready
  assert.equal(state.enemy.judgment?.ticksLeft, JUDGMENT_BASE_DURATION_TICKS - 3);
  for (let t = 0; t < 1; t += 1) resolveEnvironmentTick(state); // cooldown 4 done, duration would be 1 without renewal

  resolvePlayerAction(state); // stacks 2 -> 4, crosses milestone 3 -> +1 Fé
  assert.equal(state.enemy.judgment?.stacks, 4);
  assert.equal(state.enemy.judgment?.ticksLeft, JUDGMENT_BASE_DURATION_TICKS, 'aplicar Julgamento deve renovar a duração de todos os stacks, não só dos novos');
  assert.equal(faithOf(), faithAfterFirstCast + 1, 'atingir 3 Julgamentos pela primeira vez deveria gerar +1 Fé');

  for (let t = 0; t < 4; t += 1) resolveEnvironmentTick(state);
  resolvePlayerAction(state); // stacks 4 -> 5 (cap), crosses milestone 5 -> +1 Fé
  assert.equal(state.enemy.judgment?.stacks, 5);
  assert.equal(faithOf(), faithAfterFirstCast + 2, 'atingir 5 Julgamentos pela primeira vez deveria gerar +1 Fé adicional');
});
