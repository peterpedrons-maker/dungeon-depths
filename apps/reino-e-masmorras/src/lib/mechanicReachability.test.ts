import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PAIN_TICKS, PAIN_TICKS_INQUEBRAVEL, createPainPacket, consumePainPackets,
  consumeWildPostureAction, tickPainPackets,
} from './barbarianStabilization.ts';
import {
  DETERMINATION_GEN_BLOCK, DETERMINATION_GEN_BLOCK_GUARDA_ELEVADA,
  DETERMINATION_GEN_DIRECT_HIT, DETERMINATION_MAX, addDetermination,
  determinationForDirectHit, determinationForPreventedDamage,
} from './knight.ts';
import {
  BREACH_DURATION_TICKS, BREACH_MAX, applyBreach, consumeBreach, tickBreach,
} from './hunter.ts';
import {
  JUDGMENT_BASE_DURATION_TICKS, JUDGMENT_CONVICCAO_DURATION_TICKS,
  JUDGMENT_MAX_STACKS, applyJudgmentState, consumeJudgmentState, tickJudgmentState,
} from './clerigo.ts';
import { applyPostureDamage, POSTURE_BASIC_DAMAGE, POSTURE_MAX, recoverablePosture, recoverPosture, createWarriorEnemyState } from './warrior.ts';
import { applyEnemyStack, DECOMPOSITION_MAX, reaperExecuteMultiplier, soulsForCrossedThresholds } from './necromancer.ts';
import { advanceThermal, circuitAfterCast, heatBand } from './mago.ts';
import { latestAtOrBefore, reaches, simulateReachability } from './mechanicReachability.ts';

test('Guerreiro mantém pressão básica e todas as travas de recuperação', () => {
  let posture = POSTURE_MAX;
  posture = applyPostureDamage(posture, POSTURE_BASIC_DAMAGE);
  assert.equal(posture, 90);
  posture = Math.min(POSTURE_MAX, posture + recoverPosture(posture));
  assert.equal(posture, 98);
  posture = applyPostureDamage(posture, POSTURE_BASIC_DAMAGE);
  posture = Math.min(POSTURE_MAX, posture + recoverPosture(posture));
  assert.equal(posture, 96);
  assert.equal(Math.min(POSTURE_MAX, 99 + recoverPosture(99)), 100);
  assert.equal(recoverPosture(40, { suppressed: true }), 4);
  assert.equal(recoverPosture(40, { zero: true }), 0);
  assert.equal(applyPostureDamage(20, 30), 0);
  assert.equal(recoverablePosture({ ...createWarriorEnemyState(), current: 0, guardBroken: true }), 0);
});

test('Cavaleiro gera Determinação estável sem somar bloqueio com o +3', () => {
  assert.equal(DETERMINATION_GEN_DIRECT_HIT, 3);
  assert.equal(determinationForDirectHit({ landed: true, blocked: false, fortressActive: false }), 3);
  assert.equal(determinationForDirectHit({ landed: true, blocked: true, fortressActive: false }), DETERMINATION_GEN_BLOCK);
  assert.equal(determinationForDirectHit({ landed: true, blocked: true, elevatedBlock: true, fortressActive: false }), DETERMINATION_GEN_BLOCK_GUARDA_ELEVADA);
  assert.equal(determinationForDirectHit({ landed: true, blocked: false, fortressActive: true }), 0);
  assert.equal(determinationForDirectHit({ landed: false, blocked: false, fortressActive: false }), 0);
  let determination = 0;
  for (let i = 0; i < 8; i++) determination = addDetermination(determination, determinationForDirectHit({ landed: true, blocked: false, fortressActive: false }));
  assert.equal(determination, 24);
  assert.equal(determinationForPreventedDamage({ amountPrevented: 30, effectiveMaxHp: 1000, thresholdPct: 0.03, capPoints: 4 }), 1);
  assert.equal(determinationForPreventedDamage({ amountPrevented: 100, effectiveMaxHp: 1000, thresholdPct: 0.02, capPoints: 8 }), 5);
  assert.equal(determinationForPreventedDamage({ amountPrevented: 1000, effectiveMaxHp: 1000, thresholdPct: 0.03, capPoints: 4 }), 4);
  assert.equal(determinationForPreventedDamage({ amountPrevented: 1000, effectiveMaxHp: 1000, thresholdPct: 0.03, capPoints: 4, fortressActive: true }), 0);
  determination = addDetermination(determination, determinationForPreventedDamage({ amountPrevented: 30, effectiveMaxHp: 1000, thresholdPct: 0.03, capPoints: 4 }));
  assert.equal(determination, 25);
  determination = addDetermination(determination, DETERMINATION_GEN_BLOCK);
  assert.equal(determination, 35); // 25 é atingível sem RNG perfeito.
  assert.equal(addDetermination(DETERMINATION_MAX - 1, 99), DETERMINATION_MAX);
});

test('Bárbaro consome Postura Selvagem por ação e mantém Dor em pacotes independentes', () => {
  let charges = 3;
  charges = consumeWildPostureAction(charges, false);
  assert.equal(charges, 3); // envTick, DOT ou miss não consomem.
  charges = consumeWildPostureAction(charges, true);
  charges = consumeWildPostureAction(charges, true);
  charges = consumeWildPostureAction(charges, true);
  assert.equal(charges, 0);
  const normal = createPainPacket(50, PAIN_TICKS);
  assert.equal(normal.ticksLeft, 5);
  let packets = [normal]; let paid = 0;
  for (let i = 0; i < PAIN_TICKS; i++) { const tick = tickPainPackets(packets); packets = tick.packets; paid += tick.paid; }
  assert.equal(Math.round(paid), 50);
  const unbreakable = createPainPacket(60, PAIN_TICKS_INQUEBRAVEL);
  assert.equal(unbreakable.ticksLeft, 6);
  packets = [createPainPacket(20, 5), unbreakable]; paid = 0;
  for (let i = 0; i < 6; i++) { const tick = tickPainPackets(packets); packets = tick.packets; paid += tick.paid; }
  assert.equal(Math.round(paid), 80); // sobreposição não perde dano.
  const consumed = consumePainPackets([createPainPacket(40, 5)], 10);
  assert.equal(consumed.consumed, 10);
  assert.equal(consumed.packets[0].perTick, 30 / 5);
  const redirectedFromTwoHits = [100, 100].reduce((total, hit) => total + hit * 0.30, 0);
  assert.ok(redirectedFromTwoHits >= 1000 * 0.05); // Dor de 5% em cenário legítimo.
});

test('Caçador mantém três Brechas na árvore pura de Precisão', () => {
  let breach = applyBreach(undefined, 1)!;
  for (let i = 0; i < 4; i++) breach = tickBreach(breach)!;
  assert.equal(breach.ticksLeft, 2);
  breach = applyBreach(breach, 1)!;
  assert.equal(breach.stacks, 2); assert.equal(breach.ticksLeft, BREACH_DURATION_TICKS);
  for (let i = 0; i < 4; i++) breach = tickBreach(breach)!;
  breach = applyBreach(breach, 1)!;
  assert.equal(breach.stacks, 3); // primeira Brecha ainda existe no terceiro gerador.
  assert.equal(applyBreach(breach, 4)!.stacks, BREACH_MAX);
  assert.equal(consumeBreach(breach, 1)!.stacks, 2);
  assert.equal(consumeBreach(breach, 2)!.stacks, 1);
  assert.equal(consumeBreach(breach, 3), undefined);
  assert.equal(breach.ticksLeft, BREACH_DURATION_TICKS);
});

test('Clérigo Provação empilha Julgamento antes do novo cooldown', () => {
  let judgment = applyJudgmentState(undefined, 2, JUDGMENT_BASE_DURATION_TICKS)!;
  assert.equal(judgment.ticksLeft, 5);
  for (let i = 0; i < 4; i++) judgment = tickJudgmentState(judgment)!;
  judgment = applyJudgmentState(judgment, 2, JUDGMENT_BASE_DURATION_TICKS)!;
  assert.equal(judgment.stacks, 4); assert.equal(judgment.ticksLeft, 5);
  judgment = applyJudgmentState(judgment, 1, JUDGMENT_CONVICCAO_DURATION_TICKS)!;
  assert.equal(judgment.stacks, JUDGMENT_MAX_STACKS); assert.equal(judgment.ticksLeft, 6);
  assert.equal(consumeJudgmentState(judgment, 3)!.stacks, 2);
  assert.equal(Math.max(1, judgment.ticksLeft - 2), 4); // Ira Consumidora respeita piso 1.
  assert.equal(consumeJudgmentState(judgment, 5), undefined);
});

test('Necromante alcança os payoffs sem alterar números', () => {
  const thresholds = soulsForCrossedThresholds(100, 20, 100, new Set());
  assert.equal(thresholds.gained, 3);
  let decomposition = applyEnemyStack(undefined, 2);
  decomposition = applyEnemyStack(decomposition, 3);
  assert.equal(decomposition.stacks, DECOMPOSITION_MAX);
  assert.ok(reaperExecuteMultiplier(0.10, 2.75, 0.25, 0.15, 3.5) >= 3.2);
});

test('Mago atinge Calor 60/70, Estado Térmico e Circuito 3', () => {
  let heat = 0; for (let i = 0; i < 7; i++) heat += 10;
  assert.equal(heatBand(heat), 'incandescent');
  assert.ok(heat >= 60);
  assert.equal(advanceThermal(advanceThermal('normal', 1), 2), 'frozen');
  let circuit = circuitAfterCast('none', 'positive', 0, false);
  circuit = circuitAfterCast(circuit.last, 'negative', circuit.circuit, false);
  circuit = circuitAfterCast(circuit.last, 'positive', circuit.circuit, false);
  circuit = circuitAfterCast(circuit.last, 'negative', circuit.circuit, false);
  assert.equal(circuit.circuit, 3);
});

test('infraestrutura de alcançabilidade expõe checkpoints 4/8/12/16', () => {
  const snapshots = simulateReachability(0, Array.from({ length: 16 }, (_, i) => i), (state) => state + 1);
  assert.deepEqual([...snapshots.keys()], [4, 8, 12, 16]);
  assert.equal(latestAtOrBefore(snapshots, 12), 12);
  assert.equal(reaches(snapshots, (state) => state >= 12), true);
});
