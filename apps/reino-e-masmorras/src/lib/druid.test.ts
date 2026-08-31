import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DRUID_SEASONS, DRUID_INSTINCT_MAX, DRUID_DISSONANCE_MAX,
  nextDruidSeason, isDruidSeasonAligned, isDruidCycleAbility, isDruidActionMisaligned,
  pickDruidSeasonalAbility, druidAbilityIdsToAwaken,
  emptyDruidYear, markDruidYear, isDruidYearPerfect, oldestUnsyncedDruidSeason, evaluateDruidYearEnd,
  druidGardenMax, growDruidGarden, plantDruidSeeds, maturateDruidGardenOneStage, forceDruidGardenToFruit,
  druidFruitCount, consumeDruidFruits, consumeOldestDruidFruit,
  druidFormForSeason, druidFormBonuses, druidAvatarCombinedBonuses, gainDruidInstinctOnFormChange,
  activateDruidAvatarActions, tickDruidAvatar,
  gainDruidDissonance, reduceDruidDissonanceOnAligned, isDruidReequilibriumReady,
} from './druid.ts';
import { createCombatState, resolvePlayerAction } from './combatEngine.ts';
import { createCharacter } from './classes.ts';
import { DUNGEONS } from './dungeons.ts';
import { spawnEnemy } from './enemies.ts';

test('seasons cycle spring -> summer -> autumn -> winter -> spring', () => {
  assert.equal(nextDruidSeason('spring'), 'summer');
  assert.equal(nextDruidSeason('summer'), 'autumn');
  assert.equal(nextDruidSeason('autumn'), 'winter');
  assert.equal(nextDruidSeason('winter'), 'spring');
});

test('alignment/misalignment/cycle classification', () => {
  assert.equal(isDruidSeasonAligned('summer', 'summer'), true);
  assert.equal(isDruidSeasonAligned('winter', 'summer'), false);
  assert.equal(isDruidCycleAbility('cycle'), true);
  assert.equal(isDruidCycleAbility('summer'), false);
  assert.equal(isDruidActionMisaligned(undefined, 'summer'), true); // ataque básico
  assert.equal(isDruidActionMisaligned('cycle', 'summer'), false);
  assert.equal(isDruidActionMisaligned('winter', 'summer'), true);
  assert.equal(isDruidActionMisaligned('summer', 'summer'), false);
});

test('seasonal selector: pass 1 prefers season/cycle match in priority order, pass 2 falls back to first eligible', () => {
  const eligible = [
    { effect: { druidSeason: 'autumn' } },
    { effect: { druidSeason: 'summer' } },
    { effect: { druidSeason: 'cycle' } },
  ];
  assert.equal(pickDruidSeasonalAbility(eligible, 'summer'), eligible[1]);
  const cycleOnly = [{ effect: { druidSeason: 'autumn' } }, { effect: { druidSeason: 'cycle' } }];
  assert.equal(pickDruidSeasonalAbility(cycleOnly, 'winter'), cycleOnly[1]);
  const noMatch = [{ effect: { druidSeason: 'autumn' } }, { effect: { druidSeason: 'winter' } }];
  assert.equal(pickDruidSeasonalAbility(noMatch, 'summer'), noMatch[0]);
  assert.equal(pickDruidSeasonalAbility([], 'summer'), null);
});

test('seasonal awakening zeroes only equipped abilities whose season matches the new season', () => {
  const abilities = [
    { id: 'a', effect: { druidSeason: 'spring' } },
    { id: 'b', effect: { druidSeason: 'summer' } },
    { id: 'c', effect: { druidSeason: 'cycle' } },
    { id: 'd', effect: {} },
  ];
  assert.deepEqual(druidAbilityIdsToAwaken(abilities, 'spring'), ['a']);
  assert.deepEqual(druidAbilityIdsToAwaken(abilities, 'summer'), ['b']);
});

test('year ledger tracks sintonia per season and detects a perfect year', () => {
  let ledger = emptyDruidYear();
  assert.equal(isDruidYearPerfect(ledger), false);
  ledger = markDruidYear(ledger, 'spring');
  ledger = markDruidYear(ledger, 'summer');
  ledger = markDruidYear(ledger, 'autumn');
  assert.equal(isDruidYearPerfect(ledger), false);
  ledger = markDruidYear(ledger, 'winter');
  assert.equal(isDruidYearPerfect(ledger), true);
  // marking an already-true season is a no-op (returns same reference)
  const marked = markDruidYear(ledger, 'winter');
  assert.equal(marked, ledger);
});

test('oldestUnsyncedDruidSeason never points to a future season', () => {
  let ledger = emptyDruidYear();
  assert.equal(oldestUnsyncedDruidSeason(ledger, 'winter'), 'spring');
  ledger = markDruidYear(ledger, 'spring');
  assert.equal(oldestUnsyncedDruidSeason(ledger, 'autumn'), 'summer');
  ledger = markDruidYear(ledger, 'summer');
  ledger = markDruidYear(ledger, 'autumn');
  ledger = markDruidYear(ledger, 'winter');
  assert.equal(oldestUnsyncedDruidSeason(ledger, 'winter'), null);
  // current season is winter but only spring is attuned: summer/autumn/winter unsynced, oldest is summer
  assert.equal(oldestUnsyncedDruidSeason(markDruidYear(emptyDruidYear(), 'spring'), 'winter'), 'summer');
});

test('evaluateDruidYearEnd grants Renovo only on a perfect year and always resets the ledger', () => {
  const perfectLedger = markDruidYear(markDruidYear(markDruidYear(markDruidYear(emptyDruidYear(), 'spring'), 'summer'), 'autumn'), 'winter');
  const perfectResult = evaluateDruidYearEnd(perfectLedger, 0);
  assert.equal(perfectResult.perfectYear, true);
  assert.equal(perfectResult.renewal, 1);
  assert.deepEqual(perfectResult.ledger, emptyDruidYear());

  const imperfectLedger = markDruidYear(emptyDruidYear(), 'spring');
  const imperfectResult = evaluateDruidYearEnd(imperfectLedger, 0);
  assert.equal(imperfectResult.perfectYear, false);
  assert.equal(imperfectResult.renewal, 0);
  assert.deepEqual(imperfectResult.ledger, emptyDruidYear());

  // Renovo is capped at 1 — an existing Renovo isn't stacked by a second perfect year
  const alreadyHasRenewal = evaluateDruidYearEnd(perfectLedger, 1);
  assert.equal(alreadyHasRenewal.renewal, 1);
});

test('garden: max capacity base vs upgraded, planting respects the cap', () => {
  assert.equal(druidGardenMax(false), 2);
  assert.equal(druidGardenMax(true), 3);
  const planted = plantDruidSeeds([], 1, 5, 2);
  assert.equal(planted.garden.length, 2);
  assert.equal(planted.nextId, 3);
});

test('garden: growth is seed -> sprout -> fruit, one stage per Sintonizada cast', () => {
  let { garden } = plantDruidSeeds([], 1, 1, 2);
  assert.equal(garden[0].stage, 'seed');
  garden = growDruidGarden(garden);
  assert.equal(garden[0].stage, 'sprout');
  garden = growDruidGarden(garden);
  assert.equal(garden[0].stage, 'fruit');
  // fruit stays fruit once mature
  garden = growDruidGarden(garden);
  assert.equal(garden[0].stage, 'fruit');
});

test('garden: perfect-year maturation advances every immature unit exactly one stage', () => {
  const { garden: planted } = plantDruidSeeds([], 1, 2, 2);
  const grownOnce = growDruidGarden([planted[0]]).concat(planted[1]); // one sprout, one seed
  const matured = maturateDruidGardenOneStage(grownOnce);
  assert.equal(matured[0].stage, 'fruit'); // sprout -> fruit
  assert.equal(matured[1].stage, 'sprout'); // seed -> sprout
});

test('garden: fruit harvesting consumes oldest-first and forceDruidGardenToFruit forces every unit to fruit', () => {
  const forced = forceDruidGardenToFruit(plantDruidSeeds([], 1, 2, 2).garden);
  assert.equal(druidFruitCount(forced), 2);
  const older = { id: 1, stage: 'fruit' as const, age: 5 };
  const newer = { id: 2, stage: 'fruit' as const, age: 1 };
  const consumed = consumeDruidFruits([older, newer], 1);
  assert.equal(consumed.consumedCount, 1);
  assert.deepEqual(consumed.garden, [newer]);
  const single = consumeOldestDruidFruit([older, newer]);
  assert.equal(single.consumed, true);
  assert.deepEqual(single.garden, [newer]);
  assert.equal(consumeOldestDruidFruit([]).consumed, false);
});

test('forms: form-for-season table and per-form combat bonuses', () => {
  assert.equal(druidFormForSeason('spring'), 'stag');
  assert.equal(druidFormForSeason('summer'), 'wolf');
  assert.equal(druidFormForSeason('autumn'), 'bear');
  assert.equal(druidFormForSeason('winter'), 'owl');
  assert.equal(druidFormBonuses('none').mdefPct, 0);
  assert.equal(druidFormBonuses('stag').mdefPct > 0, true);
  assert.equal(druidFormBonuses('wolf').speedPct > 0, true);
  assert.equal(druidFormBonuses('bear').dmgTakenPct < 0, true);
  assert.equal(druidFormBonuses('owl').mdefPenPct > 0, true);
});

test('avatar primordial combines all four forms without double-counting the base form', () => {
  const combined = druidAvatarCombinedBonuses();
  const sumMdefPct = druidFormBonuses('stag').mdefPct + druidFormBonuses('wolf').mdefPct + druidFormBonuses('bear').mdefPct + druidFormBonuses('owl').mdefPct;
  assert.equal(combined.mdefPct, sumMdefPct);
  assert.equal(combined.speedPct, druidFormBonuses('wolf').speedPct);
  assert.equal(combined.accuracyPct, druidFormBonuses('owl').accuracyPct);
});

test('instinct: only gained on a real form change, capped at max, first transformation from none does not generate', () => {
  assert.equal(gainDruidInstinctOnFormChange('none', 'stag', 0), 0);
  assert.equal(gainDruidInstinctOnFormChange('stag', 'stag', 0), 0);
  assert.equal(gainDruidInstinctOnFormChange('stag', 'wolf', 0), 1);
  assert.equal(gainDruidInstinctOnFormChange('stag', 'wolf', DRUID_INSTINCT_MAX), DRUID_INSTINCT_MAX);
});

test('avatar primordial: normal grants 3 actions, renewed grants 4, ticks down to 0', () => {
  assert.equal(activateDruidAvatarActions(false), 3);
  assert.equal(activateDruidAvatarActions(true), 4);
  let left = activateDruidAvatarActions(true);
  left = tickDruidAvatar(left); assert.equal(left, 3);
  left = tickDruidAvatar(tickDruidAvatar(tickDruidAvatar(left)));
  assert.equal(left, 0);
  assert.equal(tickDruidAvatar(0), 0);
});

test('dissonance: gained only when misaligned, capped at max, reduces by 1 when aligned unless already at cap', () => {
  let d = 0;
  d = gainDruidDissonance(d, true); assert.equal(d, 1);
  d = gainDruidDissonance(d, false); assert.equal(d, 1);
  d = gainDruidDissonance(d, true); d = gainDruidDissonance(d, true);
  assert.equal(d, DRUID_DISSONANCE_MAX);
  d = gainDruidDissonance(d, true); assert.equal(d, DRUID_DISSONANCE_MAX); // capped
  assert.equal(isDruidReequilibriumReady(d), true);
  // at cap, natural reduction is locked until Reequilíbrio consumes it
  assert.equal(reduceDruidDissonanceOnAligned(d), DRUID_DISSONANCE_MAX);
  assert.equal(reduceDruidDissonanceOnAligned(2), 1);
  assert.equal(reduceDruidDissonanceOnAligned(1), 0);
  assert.equal(reduceDruidDissonanceOnAligned(0), 0);
});

test('structural: universal season list has exactly 4 entries in calendar order', () => {
  assert.deepEqual(DRUID_SEASONS, ['spring', 'summer', 'autumn', 'winter']);
});

test('motor real: cast Sintonizado planta 2 Sementes, marca o Ano e avança a Estação', () => {
  // Real end-to-end coverage: pure function tests above only verify the math
  // (markDruidYear, nextDruidSeason, plantDruidSeeds in isolation) — not that
  // resolvePlayerAction actually drives them together for a real cast.
  const SEMEADURA_VITAL_ID = 'druida:cura-natural:4'; // sempre disponível, druidSeason: 'spring'.
  const character = { ...createCharacter('Druida real', 'druida'), unlockedSkills: [SEMEADURA_VITAL_ID] };
  const enemy = { ...spawnEnemy(DUNGEONS[0].bossDepth, DUNGEONS[0]), maxHp: 1_000_000, evasion: 0 };
  const state = createCombatState(character, enemy, 3, [SEMEADURA_VITAL_ID], [SEMEADURA_VITAL_ID]);

  assert.equal(state.classState.classId === 'druida' ? state.classState.season : undefined, 'spring', 'personagem novo começa na Primavera');
  state.playerHp = Math.round(state.playerHp * 0.5); // heal-kind abilities só são "úteis" (e escolhidas) com vida incompleta.
  const hpBefore = state.playerHp;
  resolvePlayerAction(state);
  assert.ok(state.events.some((e) => e.type === 'abilityCast' && e.abilityId === SEMEADURA_VITAL_ID), 'primeiro cast deveria acontecer');
  assert.ok(state.playerHp > hpBefore, 'Semeadura Vital deveria curar');
  assert.ok(state.classState.classId === 'druida' && state.classState.garden.length === 2, 'cast Sintonizado (Primavera==Primavera) deveria plantar 2 Sementes, não 1');
  assert.equal(state.classState.classId === 'druida' ? state.classState.season : undefined, 'summer', 'a Estação avança a cada ação, alinhada ou não');
  assert.equal(state.classState.classId === 'druida' && state.classState.yearLedger.spring, true, 'cast Sintonizado deveria marcar a Primavera no Ano');
});
