import assert from 'node:assert/strict';
import test from 'node:test';
import { auditActiveAbilities, auditAllClasses, auditResourceLifecycles, auditRealAbilityReachability, auditRealBuilds, auditRealPurePaths, buildAuditMatrix, runClassAuditFullRuns } from './classAudit.ts';
import { assertAllAbilityKindsResolved, consumeCombatEvents } from './combatEngine.ts';

test('auditoria estrutural cobre as 14 classes, 42 paths e 630 nodes', () => {
  const report = auditAllClasses();
  assert.equal(report.classes, 14);
  assert.equal(report.paths, 42);
  assert.equal(report.nodes, 630);
  assert.equal(report.actives, 210);
  assert.equal(report.passives, 126);
  assert.equal(report.attributes, 294);
  assert.deepEqual(report.issues, []);
});

test('matriz legal cobre 42 paths puros, 42 pares e 14 tri-híbridos', () => {
  const builds = buildAuditMatrix();
  assert.equal(builds.length, 98);
  assert.equal(builds.filter((b) => b.pathIds.length === 1).length, 42);
  assert.equal(builds.filter((b) => b.pathIds.length === 2).length, 42);
  assert.equal(builds.filter((b) => b.pathIds.length === 3).length, 14);
  assert.ok(builds.every((b) => b.legal));
  assert.ok(builds.filter((b) => b.pathIds.length === 1).every((b) => b.activeIds.length === 5));
});

test('cada uma das 210 ativas tem condição alcançável, cinco prioridades e cooldown exposto', () => {
  const rows = auditActiveAbilities();
  assert.equal(rows.length, 210);
  assert.equal(rows.filter((row) => row.reachable === 'PASS').length, 210);
  for (const row of rows) {
    assert.ok(row.cooldown >= 0);
    assert.equal(row.cooldownTooltipCoherent, true);
    assert.ok(row.castCount > 0);
    for (const ids of Object.values(row.priorityVariants)) {
      assert.equal(ids.length, 5);
      assert.equal(new Set(ids).size, 5);
    }
  }
});

test('mecânicas de classe têm descrição, display e ligação com a árvore', () => {
  const rows = auditResourceLifecycles();
  assert.ok(rows.length >= 80);
  assert.ok(rows.every((row) => row.hasDescription));
  assert.ok(rows.filter((row) => row.referencedByNodes > 0).length >= 70);
});

test('full-run contratual simula as 98 builds nas 33 dungeons', () => {
  const runs = runClassAuditFullRuns();
  assert.equal(runs.length, 98);
  assert.ok(runs.every((run) => run.pass));
  assert.ok(runs.every((run) => run.equipped === 5));
  assert.ok(runs.every((run) => run.casts > 0));
  assert.ok(runs.every((run) => run.dungeonsSimulated === 33));
  assert.ok(runs.every((run) => run.dungeonsCleared >= 0 && run.dungeonsCleared <= 33));
});

test('resolver exaustivo cobre os 51 tipos de efeito', () => {
  assert.equal(assertAllAbilityKindsResolved(), true);
});

test('validação end-to-end real alcança as 210 ativas', () => {
  const rows = auditRealAbilityReachability();
  assert.equal(rows.length, 210);
  assert.ok(rows.every((row) => row.pass && row.castCount > 0 && row.proofEventCount > 0 && row.unappliedEffectFields.length === 0));
});

test('cada caminho puro lança seus cinco ativos no motor real', () => {
  const rows = auditRealPurePaths();
  assert.equal(rows.length, 42);
  assert.ok(rows.every((row) => row.pass && row.activeIds.length === 5 && row.activeIds.every((id) => row.castsByAbility[id] > 0)));
});

test('a matriz de 98 builds roda uma masmorra completa', () => {
  const rows = auditRealBuilds();
  assert.equal(rows.length, 98);
  assert.ok(rows.every((row) => row.pass && row.equipped === 5 && row.abilitiesCast === 5 && row.zeroCastAbilities.length === 0 && row.dungeonsSimulated === 33));
});

test('adaptador de eventos alimenta log, dano, habilidade e flash', () => {
  const seen: string[] = [];
  consumeCombatEvents([
    { type: 'abilityCast', tick: 1, actor: 'player', abilityId: 'x', name: 'Teste' },
    { type: 'damage', tick: 1, actor: 'player', amount: 12, crit: true },
    { type: 'heal', tick: 1, actor: 'player', amount: 4 },
    { type: 'enemyDeath', tick: 1 },
  ], {
    onAbilityCast: (_side, name) => seen.push(`cast:${name}`),
    onFloat: (side, amount, crit, _miss, heal) => seen.push(`float:${side}:${amount}:${crit}:${heal}`),
    onFlash: (side) => seen.push(`flash:${side}`),
    onLog: (line) => seen.push(`log:${line}`),
  });
  assert.deepEqual(seen, ['cast:Teste', 'float:enemy:12:true:undefined', 'flash:enemy', 'float:player:4:false:true', 'log:Inimigo derrotado']);
});
