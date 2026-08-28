import assert from 'node:assert/strict';
import test from 'node:test';
import { auditActiveAbilities, auditAllClasses, auditResourceLifecycles, buildAuditMatrix, runClassAuditFullRuns } from './classAudit.ts';

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
    assert.equal(row.castCount, 1);
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

test('full-run contratual percorre 98 builds em cenários regulares e boss', () => {
  const runs = runClassAuditFullRuns();
  assert.equal(runs.length, 98 * 7 * 2);
  assert.ok(runs.every((run) => run.pass));
  assert.ok(runs.every((run) => run.equipped === 5));
  assert.ok(runs.every((run) => run.casts > 0));
});
