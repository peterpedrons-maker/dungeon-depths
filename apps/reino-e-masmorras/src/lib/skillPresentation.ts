import { AbilityCondition, Character, SkillNode } from '../types/game';
import { CLASSES } from './classes';
import { computeCombatStats, effectiveMaxHp } from './combatStats';
import {
  INTERCESSAO_HEAL_PCT, MAOS_CONSAGRADAS_HEAL_EFFICIENCY_PCT,
  SABEDORIA_COMPASSIVA_HEAL_EFFICIENCY_PCT, SABEDORIA_COMPASSIVA_HP_THRESHOLD,
  SABEDORIA_JULGAMENTO_HEAL_PCT, SIGNIFICANT_HEAL_PCT_LOWERED, clericBaseHp, clericDirectHealAmount,
  clericPassiveHealAmount, significantHealAmount,
} from './clerigo';
import { directHealAmount as bardDirectHealAmount, healingBaseHp as bardHealingBaseHp } from './bardo';
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
    case 'resourceAtLeast': return [`Pelo menos ${condition.value ?? 0} de ${condition.resource === 'faith' ? 'Fé' : condition.resource === 'souls' ? 'Almas' : condition.resource === 'conviction' ? 'Convicção' : condition.resource === 'tension' ? 'Tensão' : condition.resource === 'cadence' ? 'Cadência' : condition.resource === 'steps' ? 'Passos' : condition.resource === 'distance' ? 'Distância' : condition.resource === 'flightCount' ? 'Flechas em Voo' : condition.resource}`];
    case 'resourceBelow': return [`Menos de ${condition.value ?? 0} de ${condition.resource}`];
    case 'resourceAtMost': return [`No máximo ${condition.value ?? 0} de ${condition.resource === 'flightCount' ? 'Flechas em Voo' : condition.resource === 'distance' ? 'Distância' : condition.resource}`];
    case 'enemyStacksAtLeast': return [`Pelo menos ${condition.stacks ?? 0} ${condition.stackId === 'judgment' ? 'Julgamentos' : condition.stackId}`];
    case 'enemyStacksEqual': return [`Exatamente ${condition.stacks ?? 0} ${condition.stackId}`];
    case 'stateActive': return [`${condition.state} ativo(a)`];
    case 'selfDebuffed': return ['Possuir ao menos um efeito negativo'];
    case 'enemyHasStatus': return [`Inimigo sob ${condition.status}`];
    case 'stateInactive': return [`${condition.state} inativo(a)`];
    case 'painAtLeastPct': return [`Dor de pelo menos ${formatGamePercent(condition.pct ?? 0)}`];
    case 'everyNRounds': return [`A cada ${condition.n ?? 1} segundos`];
    case 'periodicEffectActive': return [condition.effectId === 'necromante:plague' ? 'Praga Necrótica ativa' : `${condition.effectId} ativo`];
    case 'summonCountAtLeast': return [`Pelo menos ${condition.count ?? 1} invocação ativa`];
    case 'summonCountBelow': return ['Espaço para uma nova invocação'];
    case 'isStealthed': return ['Estar Furtivo'];
    case 'enemyExposed': return ['Inimigo Exposto'];
    case 'imageCountAtLeast': return [`Pelo menos ${condition.count ?? 1} Imagens`];
    case 'imageCountBelow': return [`Menos de ${condition.count ?? 2} Imagens`];
    case 'advantageReady': return ['Vantagem pronta'];
    case 'preparedTrick': return [condition.trick === 'feint' ? 'Finta preparada' : condition.trick === 'loaded_die' ? 'Dado Viciado preparado' : 'Truque preparado'];
    case 'quickWindow': return ['Janela de Iniciativa aberta'];
    default: return [];
  }
}

export function skillPresentationRows(ch: Character, node: SkillNode): PresentationRow[] {
  const rows: PresentationRow[] = [];
  const ability = node.ability;
  if (ability) {
    if (ability.actionType) rows.push({ label: 'Ação', value: ability.actionType === 'quick' ? 'RÁPIDA — usada automaticamente na Janela de Iniciativa' : 'PRINCIPAL' });
    rows.push({ label: 'Recarga', value: `${ability.cooldown} segundos` });
    const requirements = conditions(ability.condition);
    if (requirements.length) rows.push({ label: 'Requisito', value: requirements.join(' e ') });
    if (ability.effect.faithCost) rows.push({ label: 'Custo', value: `${ability.effect.faithCost} Fé, cobrada ao usar` });
    if (ability.effect.soulCost) rows.push({ label: 'Custo', value: `${ability.effect.soulCost} ${ability.effect.soulCost === 1 ? 'Alma' : 'Almas'}, cobrada ao usar` });
    if (ability.effect.archerTensionCost) rows.push({ label: 'Custo', value: `${ability.effect.archerTensionCost} Tensão, cobrada no início do cast` });
    if (ability.effect.archerCadenceCost) rows.push({ label: 'Custo', value: `${ability.effect.archerCadenceCost} Cadência, cobrada no início do cast` });
    if (ability.effect.archerShotType === 'ballistic') rows.push({ label: 'Tipo', value: 'Balístico — cria Flecha em Voo sem dano imediato' });
    if (ch.classId === 'bardo') {
      if (ability.effect.bardVoice && ability.effect.bardVoice !== 'finale') rows.push({ label: 'Nota', value: ability.effect.bardVoice === 'marcato' ? 'Marcato' : ability.effect.bardVoice === 'dissonant' ? 'Dissonante' : ability.effect.bardVoice === 'lyrical' ? 'Lírica' : `Coringa — ${ability.effect.bardWildcardPolicy === 'refrainFirst' ? 'Refrain First' : 'Harmony First'}` });
      if (ability.effect.bardFinale) rows.push({ label: 'Finale', value: 'Consome 1 Ovação; não escreve Nota' });
      if (ability.effect.bardEncore) rows.push({ label: 'Bis', value: 'Repete apenas o payload primário a 55%; não escreve Nota' });
    }
  }

  if (ch.classId === 'bardo') {
    const stats = computeCombatStats(ch);
    const baseHp = bardHealingBaseHp(CLASSES.bardo.baseHp, ch.level);
    const wis = ch.allocatedAttrs.wis ?? 0;
    const efficiency = (ch.unlockedSkills.includes('bardo:inspiracao:0') ? Math.min(0.03, wis * 0.0008) : 0)
      + (ch.unlockedSkills.includes('bardo:inspiracao:7') ? Math.min(0.04, wis * 0.001) : 0);
    if (ability?.effect.kind === 'heal') {
      const pct = ability.effect.healPct ?? 0;
      const amount = bardDirectHealAmount(CLASSES.bardo.baseHp, ch.level, pct, stats.healingPowerPct, efficiency);
      rows.push({ label: 'Base de Cura', value: `${formatGameNumber(baseHp)} (${CLASSES.bardo.baseHp} + 10 × nível após o 1º)` });
      rows.push({ label: 'Cura atual', value: `Recupera até ${formatGameNumber(amount)}` });
      rows.push({ label: 'Cálculo', value: `${formatGamePercent(pct)} da Base de Cura × Poder de Cura × eficiência de cura` });
      if (ability.effect.bardOvationHealPct !== undefined) {
        const ovationAmount = bardDirectHealAmount(CLASSES.bardo.baseHp, ch.level, ability.effect.bardOvationHealPct, stats.healingPowerPct, efficiency);
        rows.push({ label: 'Com Ovação', value: `${formatGamePercent(ability.effect.bardOvationHealPct)} — até ${formatGameNumber(ovationAmount)}; não consome Ovação` });
      }
    }
    return rows;
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
    const amount = clericDirectHealAmount(baseHp, ability.effect.healPct ?? 0, stats.healingPowerPct, efficiency);
    rows.push({ label: 'Cura atual', value: `Recupera até ${formatGameNumber(amount)}` });
    rows.push({ label: 'Cálculo', value: `${formatGamePercent(ability.effect.healPct ?? 0)} da Base de Cura × Poder de Cura × bônus de cura` });
    rows.push({ label: 'Atributos', value: 'SAB amplia pelo Poder de Cura; INT não altera a cura' });
    if (ability.effect.faithGainOnHeal) {
      rows.push({ label: 'Cura Significativa', value: `${formatGameNumber(significantHealAmount(baseHp, hasHands))} de cura efetiva para gerar 1 Fé` });
    }
  }
  if (node.id === 'clerigo:devocao:3') {
    rows.push({ label: 'Limite atual', value: `${formatGameNumber(significantHealAmount(baseHp, true))} de cura efetiva (${formatGamePercent(SIGNIFICANT_HEAL_PCT_LOWERED)} da Base de Cura)` });
  }
  if (ability?.effect.kind === 'regen') {
    const perTick = Math.round(effectiveMaxHp(ch) * (ability.effect.regenPct ?? 0));
    const rounds = ability.effect.regenRounds ?? 1;
    rows.push({ label: 'Regeneração atual', value: `${formatGameNumber(perTick)} por segundo; até ${formatGameNumber(perTick * rounds)} em ${rounds} segundos` });
    rows.push({ label: 'Gatilhos', value: 'Não gera Fé, Graça nem Cura Significativa' });
  }
  if (ability?.effect.kind === 'reviveWindow') {
    const raw = clericPassiveHealAmount(baseHp, ability.effect.reviveHealPct ?? 0, 0);
    const cap = Math.round(effectiveMaxHp(ch) * (ability.effect.reviveHealCapPct ?? 1));
    rows.push({ label: 'Restauração atual', value: `Até ${formatGameNumber(Math.min(raw, cap))}; teto de ${formatGameNumber(cap)}` });
    rows.push({ label: 'Gatilhos', value: 'Não gera Fé, Graça nem Cura Significativa' });
  }
  if (node.id === 'clerigo:retidao:8' || node.id === 'clerigo:provacao:11') {
    const pct = node.id === 'clerigo:retidao:8' ? INTERCESSAO_HEAL_PCT : SABEDORIA_JULGAMENTO_HEAL_PCT;
    const amount = clericPassiveHealAmount(baseHp, pct, stats.healingPowerPct);
    rows.push({ label: 'Cura atual', value: `Recupera até ${formatGameNumber(amount)}` });
    rows.push({ label: 'Gatilhos', value: 'Cura passiva: não gera Fé, Graça nem Cura Significativa' });
  }
  return rows;
}
