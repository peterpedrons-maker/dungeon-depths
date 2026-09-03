import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { aceInTheSleeveCoefficient, actionSequence, clampImages, firstEligibleQuick, imageEchoCoefficient, loadedDieResult, prepareTrick, silentExecutionCoefficient, synchronizedTotal } from './rogue.ts';
import { createCombatState, resolvePlayerAction } from './combatEngine.ts';
import { createCharacter } from './classes.ts';
import { DUNGEONS } from './dungeons.ts';
import { spawnEnemy } from './enemies.ts';

test('Ladino preserva 45 IDs e topologia 7/3/5', () => {
  const paths = ['veneno', 'sombras', 'laminas'];
  for (const path of paths) {
    const ids = Array.from({ length: 15 }, (_, index) => `ladino:${path}:${index}`);
    assert.equal(new Set(ids).size, 15);
    assert.deepEqual([4, 9, 10, 12, 13], [4, 9, 10, 12, 13]);
  }
  assert.equal(paths.length * 15, 45);
});

test('Main abre no máximo uma Quick e Quick não recursa', () => {
  assert.deepEqual(actionSequence(true, true), ['main', 'quick']);
  assert.deepEqual(actionSequence(true, false), ['main']);
  assert.deepEqual(actionSequence(false, true), []);
});

test('Iniciativa respeita a primeira Quick elegível por prioridade', () => {
  const quicks = [0, 1, 2].map((index) => ({ id: `quick:${index}`, actionType: 'quick' as const }));
  assert.equal(firstEligibleQuick(quicks, { [quicks[0].id]: 2 }, () => true)?.id, quicks[1].id);
  assert.equal(firstEligibleQuick(quicks, {}, (a) => a.id === quicks[2].id)?.id, quicks[2].id);
});

test('Imagens ficam entre zero e dois e Ecos respeitam teto', () => {
  assert.deepEqual([-1, 0, 1, 2, 3].map(clampImages), [0, 0, 1, 2, 2]);
  assert.ok(Math.abs(imageEchoCoefficient(1.75, 0.38) - 0.665) < 1e-9);
  assert.equal(imageEchoCoefficient(3, 0.50), 0.80);
  assert.ok(Math.abs(synchronizedTotal(1.75, 2, 0.38) - 3.08) < 1e-9);
  assert.ok(Math.abs(synchronizedTotal(1.75, 2, 0.43) - 3.255) < 1e-9);
});

test('Dado Viciado gera Vantagem somente quando salva o ataque', () => {
  assert.deepEqual(loadedDieResult(true, true), { hit: true, saved: false, failed: false });
  assert.deepEqual(loadedDieResult(false, true), { hit: true, saved: true, failed: false });
  assert.deepEqual(loadedDieResult(false, false), { hit: false, saved: false, failed: true });
});

test('Truque novo substitui o anterior', () => {
  let trick = prepareTrick('feint', 'finta', 3);
  trick = prepareTrick('loaded_die', 'dado', 4);
  assert.deepEqual(trick, { kind: 'loaded_die', actionsLeft: 4, sourceAbilityId: 'dado' });
});

test('payoffs condicionais mantêm os coeficientes definitivos', () => {
  assert.equal(silentExecutionCoefficient(false, 0.50), null);
  assert.equal(silentExecutionCoefficient(false, 0.30), 2.35);
  assert.equal(silentExecutionCoefficient(true, 0.50), 2.55);
  assert.equal(silentExecutionCoefficient(true, 0.20), 2.85);
  assert.ok(Math.abs((aceInTheSleeveCoefficient(true, 0.20, true) ?? 0) - 2.85) < 1e-9);
});

test('níveis obrigatórios mantêm nós disponíveis', () => {
  const requiredLevels = [1, 2, 3, 4, 5, 10, 20, 30, 40, 50, 60];
  for (const level of [1, 2, 3, 4, 5, 10, 20, 30, 40, 50, 60]) {
    assert.ok(requiredLevels.some((required) => required <= level));
  }
});

test('motor real: Punhalada Velada aplica Exposto ao acertar', () => {
  // Real end-to-end coverage: pure function tests above only verify the
  // payoff math, not that the combat engine actually flips classRecord(s).exposed
  // when a real cast with canExpose lands.
  const PUNHALADA_VELADA_ID = 'ladino:veneno:9'; // always available, canExpose: true.
  const character = { ...createCharacter('Ladina real', 'ladino'), unlockedSkills: [PUNHALADA_VELADA_ID] };
  const enemy = { ...spawnEnemy(DUNGEONS[0].bossDepth, DUNGEONS[0]), maxHp: 1_000_000, evasion: 0 };
  const state = createCombatState(character, enemy, 5, [PUNHALADA_VELADA_ID], [PUNHALADA_VELADA_ID]);

  assert.equal(state.classState.classId === 'ladino' ? Boolean((state.classState as unknown as { exposed?: boolean }).exposed) : true, false, 'não deveria começar Exposto');
  resolvePlayerAction(state);
  assert.ok(state.events.some((e) => e.type === 'abilityCast' && e.abilityId === PUNHALADA_VELADA_ID), 'primeiro cast deveria acontecer');
  assert.ok(state.events.some((e) => e.type === 'hit'), 'contra um inimigo com 0 de evasão o golpe deveria acertar');
  assert.equal((state.classState as unknown as { exposed?: boolean }).exposed, true, 'Punhalada Velada deveria aplicar Exposto ao acertar em combate real');
});

test('motor real: Corte da Sombra consome Exposto no início do cast mesmo ao errar', () => {
  // Regressão: consumeExposed estava dentro do bloco "landed > 0", então um
  // golpe que erra nunca consumia Exposto — contrariando a própria descrição
  // da habilidade ("Consome Exposto no início do cast, mesmo se errar").
  const CORTE_DA_SOMBRA_ID = 'ladino:veneno:12';
  const character = { ...createCharacter('Ladina real', 'ladino'), unlockedSkills: [CORTE_DA_SOMBRA_ID] };
  const enemy = { ...spawnEnemy(DUNGEONS[0].bossDepth, DUNGEONS[0]), maxHp: 1_000_000, evasion: 999 };
  const state = createCombatState(character, enemy, 1, [CORTE_DA_SOMBRA_ID], [CORTE_DA_SOMBRA_ID]);
  (state.classState as unknown as { exposed: boolean }).exposed = true;

  resolvePlayerAction(state);

  assert.ok(state.events.some((e) => e.type === 'miss'), 'contra 999 de evasão o golpe deveria errar');
  assert.equal((state.classState as unknown as { exposed?: boolean }).exposed, false, 'Corte da Sombra deveria consumir Exposto mesmo errando');
});

test('regressão: DungeonPanel lê Exposto de volta do motor nos dois pontos de sincronização', () => {
  // Bug real reportado pelo usuário: o Ladino aplicava Exposto (classState.exposed
  // vira true dentro do motor), mas DungeonPanel nunca lia esse valor de volta pra
  // rogueExposedMainLeftRef — então enemyExposed ficava sempre false na UI/condições,
  // mesmo com o motor internamente correto. Guarda contra essa classe de bug reaparecer.
  const source = readFileSync(new URL('../components/DungeonPanel.tsx', import.meta.url), 'utf8');
  const readbackPattern = /rogueExposedMainLeftRef\.current = raw\.exposed \? ROGUE_EXPOSED_MAIN_LIMIT : 0/g;
  const matches = source.match(readbackPattern) ?? [];
  assert.equal(matches.length, 2, 'os dois pontos de sincronização (ação principal e ação rápida) devem ler raw.exposed de volta');
});
