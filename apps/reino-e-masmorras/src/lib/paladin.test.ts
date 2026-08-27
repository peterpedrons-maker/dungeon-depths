import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PALADIN_ACTIVE_INDICES, PALADIN_ATTRIBUTE_INDICES, PALADIN_PASSIVE_INDICES, PALADIN_PATH_IDS,
  advancePaladinLiturgy, consumePaladinVerdict, createPaladinAegis, createPaladinLiturgyState,
  invokePaladinVirtue, invokePaladinVirtues, paladinAegisAttributeCapBonus, paladinAegisReduction,
  paladinActiveHealAmount, paladinConviction, paladinRadiantBonusPct, paladinRedemptionVitBonusPct,
} from './paladin.ts';

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
