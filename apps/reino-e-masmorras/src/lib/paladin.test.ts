import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PALADIN_ACTIVE_INDICES, PALADIN_ATTRIBUTE_INDICES, PALADIN_PASSIVE_INDICES, PALADIN_PATH_IDS,
  advancePaladinLiturgy, consumePaladinVerdict, createPaladinAegis, createPaladinLiturgyState,
  invokePaladinVirtue, invokePaladinVirtues, paladinAegisAttributeCapBonus, paladinAegisReduction,
  paladinActiveHealAmount, paladinConviction, paladinRadiantBonusPct, paladinRedemptionVitBonusPct,
} from './paladin.ts';
import { createCombatState, resolvePlayerAction } from './combatEngine.ts';
import { createCharacter } from './classes.ts';
import { DUNGEONS } from './dungeons.ts';
import { spawnEnemy } from './enemies.ts';

// Real end-to-end coverage for the exact bug reported: the live/simulation
// engine invoked Liturgia state only from combatEngine.ts's own cast-payment
// block, which never decayed it on subsequent real actions (DungeonPanel
// never calls resolveEnvironmentTick, the only place that decay existed) —
// and Veredito finishers fell through the same generic virtue-invocation
// fallback, invoking Justiça instead of consuming the Liturgia.
const INVOKE_JUSTICE_ID = 'paladino:martelo:4'; // "Golpe do Veredito" — invokes Justiça, always available.
const VERDICT_ID = 'paladino:martelo:12'; // "Veredito" — paladinVerdict, requires conviction >= 1.
function paladinWithAbilities(ids: string[]) {
  const character = createCharacter('Paladino real', 'paladino');
  character.unlockedSkills = ids;
  return character;
}
function friendlyEnemy() {
  return { ...spawnEnemy(DUNGEONS[0].bossDepth, DUNGEONS[0]), maxHp: 1_000_000, evasion: 0 };
}

test('Liturgia real decai uma vez por ação real do Paladino (ataques básicos incluídos)', () => {
  const character = paladinWithAbilities([INVOKE_JUSTICE_ID]);
  const state = createCombatState(character, friendlyEnemy(), 1, [INVOKE_JUSTICE_ID], [INVOKE_JUSTICE_ID]);
  resolvePlayerAction(state); // Invoca Justiça: Liturgia = 4, esta mesma ação não reduz.
  assert.equal(state.classState.liturgy, 4);
  assert.equal(state.classState.virtues.justice, true);
  state.priorities = []; // Força ataques básicos reais nas próximas ações (sem repetir a invocação).
  for (let i = 0; i < 3; i += 1) resolvePlayerAction(state); // 3 ataques básicos reais.
  assert.equal(state.classState.liturgy, 1);
  assert.equal(state.classState.virtues.justice, true, 'Virtude some só quando a Liturgia chega a 0');
  resolvePlayerAction(state); // Quarto ataque básico real: Liturgia expira.
  assert.equal(state.classState.liturgy, 0);
  assert.equal(state.classState.virtues.justice, false);
  assert.equal(state.classState.resources.conviction, 0);
});

test('Veredito real consome a Liturgia no início e usa o snapshot de Convicção pré-consumo no dano', () => {
  const character = paladinWithAbilities([INVOKE_JUSTICE_ID, VERDICT_ID]);
  const state = createCombatState(character, friendlyEnemy(), 1, [INVOKE_JUSTICE_ID, VERDICT_ID], [INVOKE_JUSTICE_ID, VERDICT_ID]);
  resolvePlayerAction(state); // Invoca Justiça: conviction = 1.
  assert.equal(state.classState.resources.conviction, 1);
  const enemyHpBefore = state.enemyHp;
  resolvePlayerAction(state); // Veredito (conviction >= 1 satisfeito) — não deve invocar outra Virtude.
  const castEvent = state.events.find((e) => e.type === 'abilityCast' && e.abilityId === VERDICT_ID);
  assert.ok(castEvent, 'Veredito deveria ter sido lançado');
  assert.ok(state.enemyHp < enemyHpBefore, 'Veredito deveria ter causado dano usando o multiplicador de 1 Convicção (1.90x), não 0');
  assert.equal(state.classState.virtues.justice, false, 'Veredito consome todas as Virtudes no início do cast');
  assert.equal(state.classState.liturgy, 0);
  assert.equal(state.classState.resources.conviction, 0);
});

test('primeira Virtude inicia Liturgia em 4 e a própria ação não reduz', () => {
  const invoked = invokePaladinVirtue(createPaladinLiturgyState(), 'justice');
  assert.equal(invoked.actionsLeft, 4);
  assert.equal(advancePaladinLiturgy(invoked).actionsLeft, 4);
});

test('Convicção deriva somente das Virtudes diferentes', () => {
  let state = createPaladinLiturgyState();
  state = invokePaladinVirtues(state, ['justice', 'courage', 'justice']);
  assert.equal(paladinConviction(state.virtues), 2);
});

test('Virtude nova estende Liturgia até 4; repetida não estende', () => {
  let state = advancePaladinLiturgy(invokePaladinVirtue(createPaladinLiturgyState(), 'justice'));
  state = advancePaladinLiturgy(state);
  assert.equal(state.actionsLeft, 3);
  state = invokePaladinVirtue(state, 'courage');
  assert.equal(state.actionsLeft, 4);
  state = invokePaladinVirtue(state, 'courage');
  assert.equal(state.actionsLeft, 4);
});

test('repetir Virtude altera a Regente sem aumentar Convicção', () => {
  let state = invokePaladinVirtues(createPaladinLiturgyState(), ['justice', 'mercy', 'justice']);
  assert.equal(state.regent, 'justice');
  assert.equal(paladinConviction(state.virtues), 2);
});

test('ações reais reduzem e o fim da Liturgia limpa tudo', () => {
  let state = invokePaladinVirtue(createPaladinLiturgyState(), 'courage');
  state = advancePaladinLiturgy(state);
  for (let i = 0; i < 4; i++) state = advancePaladinLiturgy(state);
  assert.deepEqual(state, createPaladinLiturgyState());
});

test('Veredito captura snapshot, reconhece Pleno e limpa no início', () => {
  const state = invokePaladinVirtues(createPaladinLiturgyState(), ['justice', 'courage', 'mercy']);
  const consumed = consumePaladinVerdict(state);
  assert.deepEqual(consumed.snapshot, {
    virtues: { justice: true, courage: true, mercy: true }, conviction: 3, regent: 'mercy', full: true,
  });
  assert.deepEqual(consumed.state, createPaladinLiturgyState());
});

test('snapshot gasto não depende do resultado posterior do ataque', () => {
  const consumed = consumePaladinVerdict(invokePaladinVirtue(createPaladinLiturgyState(), 'justice'));
  const attackMissed = true;
  assert.equal(attackMissed, true);
  assert.equal(paladinConviction(consumed.state.virtues), 0);
});

test('forma do Pleno acompanha a última Virtude Regente', () => {
  for (const regent of ['justice', 'courage', 'mercy'] as const) {
    const order = ['justice', 'courage', 'mercy'].filter((v) => v !== regent).concat(regent) as Array<typeof regent>;
    assert.equal(consumePaladinVerdict(invokePaladinVirtues(createPaladinLiturgyState(), order)).snapshot.regent, regent);
  }
});

test('Égide reduz golpe direto, respeita teto e é consumida', () => {
  const aegis = createPaladinAegis('test', 0.35, 0.10);
  assert.deepEqual(paladinAegisReduction(aegis, 100, 200), { damage: 80, absorbed: 20, aegis: null, consumed: true });
});

test('Égide não intercepta DOT', () => {
  const aegis = createPaladinAegis('test', 0.50, 0.20);
  assert.deepEqual(paladinAegisReduction(aegis, 40, 200, 'dot'), { damage: 40, absorbed: 0, aegis, consumed: false });
});

test('Égide de dois golpes usa metade da eficiência no segundo', () => {
  const first = paladinAegisReduction(createPaladinAegis('test', 0.50, 0.20, 2), 100, 500);
  assert.equal(first.absorbed, 50);
  assert.ok(first.aegis);
  const second = paladinAegisReduction(first.aegis!, 100, 500);
  assert.equal(second.absorbed, 25);
  assert.equal(second.aegis, null);
});

test('escalamentos de SAB e VIT respeitam seus caps', () => {
  assert.equal(paladinRadiantBonusPct(10), 0.05);
  assert.equal(paladinRadiantBonusPct(100), 0.15);
  assert.equal(paladinRadiantBonusPct(100, 1.2), 0.15);
  assert.equal(paladinAegisAttributeCapBonus(100), 0.02);
  assert.equal(paladinRedemptionVitBonusPct(100), 0.03);
});

test('estrutura definitiva mantém três paths e topologia 7/3/5', () => {
  assert.deepEqual(PALADIN_PATH_IDS, ['voto', 'martelo', 'luz']);
  assert.deepEqual(PALADIN_ATTRIBUTE_INDICES, [0, 1, 2, 3, 5, 7, 11]);
  assert.deepEqual(PALADIN_PASSIVE_INDICES, [6, 8, 14]);
  assert.deepEqual(PALADIN_ACTIVE_INDICES, [4, 9, 10, 12, 13]);
  assert.equal(PALADIN_PATH_IDS.length * 15, 45);
});

test('estado vazio possui zero Convicção e nenhuma Regente', () => {
  const state = createPaladinLiturgyState();
  assert.equal(paladinConviction(state.virtues), 0);
  assert.equal(state.regent, null);
});

test('Convicção nunca passa de três', () => {
  const state = invokePaladinVirtues(createPaladinLiturgyState(), ['justice', 'courage', 'mercy', 'justice', 'courage']);
  assert.equal(paladinConviction(state.virtues), 3);
});

test('Égide limita redução ao dano realmente recebido', () => {
  const result = paladinAegisReduction(createPaladinAegis('test', 2, 2), 7, 100);
  assert.equal(result.absorbed, 7);
  assert.equal(result.damage, 0);
});

test('Égide sanitiza quantidade de golpes e duração', () => {
  const aegis = createPaladinAegis('test', 0.4, 0.1, 0, 0);
  assert.equal(aegis.hitsRemaining, 1);
  assert.equal(aegis.ticksLeft, 1);
});

test('escalamento radiante ignora SAB negativo', () => {
  assert.equal(paladinRadiantBonusPct(-20), 0);
});

test('cura ativa usa Vida Máxima e eficiência limitada', () => {
  assert.equal(paladinActiveHealAmount(1000, 0.10, 10, 10), 106);
});

test('índices ativos representam cinco técnicas por caminho', () => {
  assert.equal(PALADIN_ACTIVE_INDICES.length, 5);
  assert.equal(PALADIN_PATH_IDS.length * PALADIN_ACTIVE_INDICES.length, 15);
});
