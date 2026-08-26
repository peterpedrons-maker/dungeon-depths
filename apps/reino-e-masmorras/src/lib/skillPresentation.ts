import { AbilityCondition, Character, SkillNode } from '../types/game';
import { CLASSES } from './classes';
import { computeCombatStats, effectiveMaxHp } from './combatStats';
import {
  INTERCESSAO_HEAL_PCT, MAOS_CONSAGRADAS_HEAL_EFFICIENCY_PCT,
  SABEDORIA_COMPASSIVA_HEAL_EFFICIENCY_PCT, SABEDORIA_COMPASSIVA_HP_THRESHOLD,
  SABEDORIA_JULGAMENTO_HEAL_PCT, SIGNIFICANT_HEAL_PCT_LOWERED, clericBaseHp, clericDirectHealAmount,
  clericPassiveHealAmount, significantHealAmount,
} from './clerigo';
import { formatGameNumber, formatGamePercent } from './format';

export interface PresentationRow { label: string; value: string }

function conditions(condition: AbilityCondition): string[] {
  switch (condition.type) {
    case 'always': return [];
    case 'all': return (condition.conditions ?? []).flatMap(conditions);
    case 'any': return [`Uma destas condições: ${(condition.conditions ?? []).flatMap(conditions).join(' ou ')}`];
    case 'not': return [`Não: ${(condition.conditions ?? []).flatMap(conditions).join('')}`];
    case 'hpBelow': return [`Sua Vida abaixo de ${formatGamePercent(condition.pct ?? 0)}`];
    case 'enemyHpBelow': return [`Vida do inimigo abaixo de ${formatGamePercent(condition.pct ?? 0)}`];
    case 'resourceAtLeast': return [`Pelo menos ${condition.value ?? 0} de ${condition.resource === 'faith' ? 'Fé' : condition.resource}`];
    case 'resourceBelow': return [`Menos de ${condition.value ?? 0} de ${condition.resource}`];
    case 'resourceAtMost': return [`No máximo ${condition.value ?? 0} de ${condition.resource}`];
    case 'enemyStacksAtLeast': return [`Pelo menos ${condition.stacks ?? 0} ${condition.stackId === 'judgment' ? 'Julgamentos' : condition.stackId}`];
    case 'enemyStacksEqual': return [`Exatamente ${condition.stacks ?? 0} ${condition.stackId}`];
    case 'stateActive': return [`${condition.state} ativo(a)`];
    case 'selfDebuffed': return ['Possuir ao menos um efeito negativo'];
    case 'enemyHasStatus': return [`Inimigo sob ${condition.status}`];
    case 'stateInactive': return [`${condition.state} inativo(a)`];
    case 'painAtLeastPct': return [`Dor de pelo menos ${formatGamePercent(condition.pct ?? 0)}`];
    case 'everyNRounds': return [`A cada ${condition.n ?? 1} ciclos`];
    default: return [];
  }
}

export function skillPresentationRows(ch: Character, node: SkillNode): PresentationRow[] {
  const rows: PresentationRow[] = [];
  const ability = node.ability;
  if (ability) {
    rows.push({ label: 'Recarga', value: `${ability.cooldown} ciclos` });
    const requirements = conditions(ability.condition);
    if (requirements.length) rows.push({ label: 'Requisito', value: requirements.join(' e ') });
    if (ability.effect.faithCost) rows.push({ label: 'Custo', value: `${ability.effect.faithCost} Fé, cobrada ao usar` });
  }

  if (ch.classId !== 'clerigo') return rows;
  const stats = computeCombatStats(ch);
  const baseHp = clericBaseHp(CLASSES.clerigo.baseHp, ch.level);
  const hasHands = ch.unlockedSkills.includes('clerigo:devocao:3');
  let efficiency = hasHands ? MAOS_CONSAGRADAS_HEAL_EFFICIENCY_PCT : 0;
  if (ch.unlockedSkills.includes('clerigo:devocao:0') && ch.hp / effectiveMaxHp(ch) < SABEDORIA_COMPASSIVA_HP_THRESHOLD) {
    efficiency += SABEDORIA_COMPASSIVA_HEAL_EFFICIENCY_PCT;
  }

  if (ability?.effect.kind === 'heal') {
    const amount = clericDirectHealAmount(baseHp, ability.effect.healPct ?? 0, stats.supportPowerPct, efficiency);
    rows.push({ label: 'Cura atual', value: `Recupera até ${formatGameNumber(amount)}` });
    rows.push({ label: 'Cálculo', value: `${formatGamePercent(ability.effect.healPct ?? 0)} da Vida Base × Poder de Suporte × bônus de cura` });
    rows.push({ label: 'Atributos', value: 'SAB amplia pelo Poder de Suporte; INT não altera a cura' });
    if (ability.effect.faithGainOnHeal) {
      rows.push({ label: 'Cura Significativa', value: `${formatGameNumber(significantHealAmount(baseHp, hasHands))} de cura efetiva para gerar 1 Fé` });
    }
  }
  if (node.id === 'clerigo:devocao:3') {
    rows.push({ label: 'Limite atual', value: `${formatGameNumber(significantHealAmount(baseHp, true))} de cura efetiva (${formatGamePercent(SIGNIFICANT_HEAL_PCT_LOWERED)} da Vida Base)` });
  }
  if (ability?.effect.kind === 'regen') {
    const perTick = Math.round(effectiveMaxHp(ch) * (ability.effect.regenPct ?? 0) * (1 + stats.supportPowerPct));
    const rounds = ability.effect.regenRounds ?? 1;
    rows.push({ label: 'Regeneração atual', value: `${formatGameNumber(perTick)} por ciclo; até ${formatGameNumber(perTick * rounds)} em ${rounds} ciclos` });
    rows.push({ label: 'Gatilhos', value: 'Não gera Fé, Graça nem Cura Significativa' });
  }
  if (ability?.effect.kind === 'reviveWindow') {
    const raw = clericPassiveHealAmount(baseHp, ability.effect.reviveHealPct ?? 0, stats.supportPowerPct);
    const cap = Math.round(effectiveMaxHp(ch) * (ability.effect.reviveHealCapPct ?? 1));
    rows.push({ label: 'Restauração atual', value: `Até ${formatGameNumber(Math.min(raw, cap))}; teto de ${formatGameNumber(cap)}` });
    rows.push({ label: 'Gatilhos', value: 'Não gera Fé, Graça nem Cura Significativa' });
  }
  if (node.id === 'clerigo:retidao:8' || node.id === 'clerigo:provacao:11') {
    const pct = node.id === 'clerigo:retidao:8' ? INTERCESSAO_HEAL_PCT : SABEDORIA_JULGAMENTO_HEAL_PCT;
    const amount = clericPassiveHealAmount(baseHp, pct, stats.supportPowerPct);
    rows.push({ label: 'Cura atual', value: `Recupera até ${formatGameNumber(amount)}` });
    rows.push({ label: 'Gatilhos', value: 'Cura passiva: não gera Fé, Graça nem Cura Significativa' });
  }
  return rows;
}
