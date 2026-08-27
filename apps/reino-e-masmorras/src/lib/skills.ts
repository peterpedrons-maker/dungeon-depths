Warning: truncated output (original token count: 80230)
Total output lines: 2115

import { AbilityDef, AbilityEffect, Attributes, AttributeKey, ClassId, ScalingEntry, SkillEffect, SkillNode, SkillNodeType, SkillPath } from '../types/game';
import { CLASSES } from './classes';

// Each class has more equippable actives than this cap (5 per path × 3 paths)
// — this caps how many of the ones you've unlocked can actually be slotted
// into combat at once, forcing a real build choice.
export const MAX_EQUIPPED_ABILITIES = 4;

// Presets for the per-ability "vida abaixo de X%" trigger, editable on the
// loadout screen independently for every equipped ability that uses a
// hpBelow condition — lets a player stagger a shield at 50% and a heal at
// 20% instead of everything firing off the same shared threshold.
export const ABILITY_THRESHOLD_OPTIONS = [0.2, 0.3, 0.4, 0.5, 0.6];

// ── Reusable 15-node branching topology, shared by every path in the game ──
// 5 tiers × 3 columns (Left/Mid/Right). Prereqs are OR logic (any listed
// prereq unlocks it), so a player can commit to a single column all the way
// to a tier-5 capstone (L5, M5 or R5) without ever touching the other two —
// M5 in particular only needs ONE of the three tier-4 nodes, so no path
// forces every one of its 15 nodes to be unlocked to reach the top.
// Composition: 7 attribute / 3 passive / 5 active, matching the requested mix.
interface TopoSlot { type: SkillNodeType; prereq: number[]; }
const TOPOLOGY: TopoSlot[] = [
  { type: 'attribute', prereq: [] },        // 0  L1
  { type: 'attribute', prereq: [] },        // 1  M1
  { type: 'attribute', prereq: [] },        // 2  R1
  { type: 'attribute', prereq: [0] },       // 3  L2
  { type: 'active', prereq: [1] },          // 4  M2
  { type: 'attribute', prereq: [2] },       // 5  R2
  { type: 'passive', prereq: [3, 4] },      // 6  L3 (cross-link)
  { type: 'attribute', prereq: [4] },       // 7  M3
  { type: 'passive', prereq: [5, 4] },      // 8  R3 (cross-link)
  { type: 'active', prereq: [6] },          // 9  L4
  { type: 'active', prereq: [7] },          // 10 M4
  { type: 'attribute', prereq: [8] },       // 11 R4
  { type: 'active', prereq: [9] },          // 12 L5 (capstone)
  { type: 'active', prereq: [9, 10, 11] },  // 13 M5 (capstone, any single branch)
  { type: 'passive', prereq: [11] },        // 14 R5 (capstone)
];

interface NodeSpec {
  name: string;
  desc: string;
  effect?: SkillEffect;
  ability?: Omit<AbilityDef, 'id'>;
  scaling?: ScalingEntry[];
  mechanicRefs?: string[];
}

// Passe editorial universal: corrige apenas a apresentação, sempre a partir
// dos valores mecânicos já existentes. Nenhum multiplicador/cooldown muda.
function presentationText(text: string, ability?: Omit<AbilityDef, 'id'>): string {
  let result = text
    .replace(/BaselineMaxHp/g, 'Vida Base')
    .replace(/EffectiveMaxHp/g, 'Vida Máxima')
    .replace(/overheal/g, 'excesso de cura')
    .replace(/(\d+)\.(\d+)(?=x|%)/g, '$1,$2')
    .replace(/\brodadas?\b/gi, (word: string) => word.toLowerCase().endsWith('s') ? 'ciclos' : 'ciclo');
  if (!ability) return result;

  result = result.replace(/Recarga de \d+(?:[,.]\d+)?\s*(?:s|segundos?|ciclos?)/gi, `Recarga de ${ability.cooldown} ciclos`);
  const effect = ability.effect;
  const duration = effect.statusRounds ?? effect.ccRounds ?? effect.statModRounds ?? effect.buffRounds
    ?? effect.regenRounds ?? effect.immunityRounds ?? effect.hasteRounds ?? effect.berserkRounds;
  if (duration) {
    result = result.replace(/\bpor \d+(?:[,.]\d+)?s\b/gi, `por ${duration} ${duration === 1 ? 'ciclo' : 'ciclos'}`);
    result = result.replace(/\bdurante \d+(?:[,.]\d+)?s\b/gi, `durante ${duration} ${duration === 1 ? 'ciclo' : 'ciclos'}`);
  }
  return result;
}

function buildPath(classId: ClassId, pathId: string, name: string, color: string, specs: NodeSpec[]): SkillPath {
  const nodes: SkillNode[] = specs.map((s, i) => {
    const slot = TOPOLOGY[i];
    const id = `${classId}:${pathId}:${i}`;
    const node: SkillNode = {
      id, name: s.name, desc: presentationText(s.desc, s.ability), type: slot.type,
      effect: s.effect ?? {},
      prereqIds: slot.prereq.map((j) => `${classId}:${pathId}:${j}`),
    };
    if (slot.type === 'active' && s.ability) node.ability = { id, ...s.ability, desc: presentationText(s.ability.desc, s.ability) };
    if (s.scaling) node.scaling = s.scaling;
    if (s.mechanicRefs) node.mechanicRefs = s.mechanicRefs;
    return node;
  });
  return { id: pathId, name, color, nodes };
}

const warriorAtkScale = (posture: string): ScalingEntry[] => [
  { attribute: 'str', label: 'FOR', role: 'principal', description: 'Aumenta o ATK usado pelo golpe; FOR não é somada novamente ao multiplicador.' },
  { label: 'Postura', role: 'mecanica', description: posture },
];
const warriorFixedScale = (description: string): ScalingEntry[] => [{ label: 'Fixo', role: 'fixo', description }];
const warriorVitScale = (description: string): ScalingEntry[] => [{ attribute: 'vit', label: 'VIT', role: 'principal', description }];
const warriorDexScale = (description: string): ScalingEntry[] => [{ attribute: 'dex', label: 'DES', role: 'principal', description }];

export const SKILL_TREES: Record<ClassId, SkillPath[]> = {
  guerreiro: [
    buildPath('guerreiro', 'furioso', 'Vanguarda', '#a5432f', [
      { name: 'Ombro à Frente', desc: '+2% de dano físico direto. O primeiro golpe de uma habilidade de Vanguarda que acertar cada inimigo causa +6 de Dano de Postura.', effect: { dmgPct: 0.02 }, mechanicRefs: ['guerreiro:posture'], scaling: warriorFixedScale('O bônus de +6 de Postura é fixo e ocorre uma vez por inimigo.') },
      { name: 'Mira de Guerra', desc: '+2 pontos percentuais de Precisão. Com Postura inimiga em 66 ou menos, o total deste nó é +4 pontos percentuais.', effect: { accuracyPct: 0.02 }, mechanicRefs: ['guerreiro:posture'], scaling: warriorFixedScale('Precisão fixa; não escala com atributos.') },
      { name: 'Fôlego de Vanguarda', desc: '+8 de Vida Máxima. Com Postura inimiga em 33 ou menos, recebe 3% menos dano direto.', effect: { maxHpFlat: 8 }, mechanicRefs: ['guerreiro:posture'], scaling: warriorVitScale('Aumenta a Vida Máxima; a redução condicional permanece fixa em 3%.') },
      { name: 'Ritmo de Assalto', desc: '-3% de Recarga somente para habilidades de Vanguarda. Ao acertar uma delas, o próximo ataque básico causa +2 de Dano de Postura.', effect: {}, mechanicRefs: ['guerreiro:posture'], scaling: warriorFixedScale('Recarga e +2 de Postura são valores fixos.') },
      { name: 'Quebra-Linha', desc: 'Cause 1,45x ATK e 18 de Dano de Postura. Contra Postura Firme, causa 22 de Postura. Recarga: 3 ciclos.', ability: { name: 'Quebra-Linha', desc: '1,45x ATK e 18 de Postura; 22 contra Postura Firme.', cooldown: 3, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 1.45, postureDamage: 18, postureDamageFirm: 22, vanguardAbility: true } }, mechanicRefs: ['guerreiro:posture'], scaling: warriorAtkScale('18 fixos; 22 se o alvo estava Firme antes do golpe.') },
      { name: 'Passo Agressivo', desc: '+2% de Velocidade de ação. Com Postura inimiga em 50 ou menos, o total deste nó é +3%.', effect: {}, mechanicRefs: ['guerreiro:posture'], scaling: warriorFixedScale('Velocidade fixa, respeitando o cap global.') },
      { name: 'Pressão Implacável', desc: 'Quando uma habilidade de Vanguarda acerta, a próxima recuperação natural de Postura do inimigo fica limitada a 5.', effect: {}, mechanicRefs: ['guerreiro:posture'], scaling: warriorFixedScale('O limite de recuperação é fixo e apenas renovado por novos acertos.') },
      { name: 'Aço em Movimento', desc: '+2,5% de DEF. Se uma ação causar pelo menos 20 de Dano de Postura, recebe +3% de DEF por 2 ciclos.', effect: { defPct: 0.025 }, mechanicRefs: ['guerreiro:posture'], scaling: warriorVitScale('VIT aumenta a DEF; o bônus temporário deste nó é fixo.') },
      { name: 'Sem Respirar', desc: 'Quando o inimigo recuperaria Postura estando em 50 ou menos, reduza a recuperação em 2, com mínimo normal de 2.', effect: {}, mechanicRefs: ['guerreiro:posture'], scaling: warriorFixedScale('A redução de recuperação é fixa.') },
      { name: 'Golpe de Pressão', desc: 'Cause 1,60x ATK e 16 de Dano de Postura. Ao acertar, aplica Suprimido por 2 ações reais: recuperação máxima de 4. Recarga: 4 ciclos.', ability: { name: 'Golpe de Pressão', desc: '1,60x ATK, 16 de Postura e Suprimido por 2 ações reais.', cooldown: 4, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 1.60, postureDamage: 16, suppressPostureRecoveryActions: 2, vanguardAbility: true } }, mechanicRefs: ['guerreiro:posture'], scaling: warriorAtkScale('16 de Dano de Postura fixos; Suprimido não acumula.') },
      { name: 'Aríete', desc: 'Dois impactos independentes de 0,75x ATK e 9 de Postura cada. Se ambos acertarem, a próxima recuperação natural é 0. Recarga: 5 ciclos.', ability: { name: 'Aríete', desc: '2 impactos de 0,75x ATK e 9 de Postura; ambos acertando zeram a próxima recuperação.', cooldown: 5, condition: { type: 'always' }, effect: { kind: 'multiHit', hitCount: 2, dmgMultPerHit: 0.75, postureDamagePerHit: 9, zeroNextPostureRecoveryIfAllHits: true, vanguardAbility: true } }, mechanicRefs: ['guerreiro:posture'], scaling: warriorAtkScale('9 de Postura fixos por impacto.') },
      { name: 'Penetração Marcial', desc: 'Com Postura inimiga em 50 ou menos, ataques físicos diretos recebem +5% de penetração de DEF.', effect: {}, mechanicRefs: ['guerreiro:posture'], scaling: warriorFixedScale('Penetração condicional fixa; soma com Guarda Quebrada dentro dos caps.') },
      { name: 'Romper Guarda', desc: 'Requer Postura em 30 ou menos. Cause 2,10x ATK e 30 de Dano de Postura. Se quebrar a Guarda, a janela recebe +1 ação ofensiva, até 3. Recarga: 6 ciclos.', ability: { name: 'Romper Guarda', desc: '2,10x ATK e 30 de Postura; a quebra pode durar 3 ações ofensivas.', cooldown: 6, condition: { type: 'enemyPostureAtMost', value: 30 }, effect: { kind: 'bigHit', dmgMult: 2.10, postureDamage: 30, guardBreakActionsBonusOnBreak: 1, vanguardAbility: true } }, mechanicRefs: ['guerreiro:posture', 'guerreiro:guardbreak'], scaling: warriorAtkScale('30 de Dano de Postura fixos.') },
      { name: 'Avanço Irrefreável', desc: 'Três impactos independentes de 0,65x ATK e 7 de Postura cada. Uma quebra entre impactos fortalece imediatamente os restantes. Recarga: 8 ciclos.', ability: { name: 'Avanço Irrefreável', desc: '3 impactos de 0,65x ATK e 7 de Postura, com quebra imediata entre hits.', cooldown: 8, condition: { type: 'always' }, effect: { kind: 'multiHit', hitCount: 3, dmgMultPerHit: 0.65, postureDamagePerHit: 7, vanguardAbility: true } }, mechanicRefs: ['guerreiro:posture', 'guerreiro:guardbreak'], scaling: warriorAtkScale('7 de Postura fixos por impacto.') },
      { name: 'Domínio da Linha', desc: 'Quando Guarda Quebrada termina, a Postura retorna a 65 em vez de 75.', effect: {}, mechanicRefs: ['guerreiro:guardbreak'], scaling: warriorFixedScale('O retorno a 65 é fixo, não acumula e não reduz além disso.') },
    ]),
    buildPath('guerreiro', 'guardiao', 'Mestre da Guarda', '#6b7280', [
      { name: 'Guarda de Aço', desc: '+2% de DEF. Enquanto houver Guarda Preparada, recebe também +2% de MDEF.', effect: { defPct: 0.02 }, mechanicRefs: ['guerreiro:parry'], scaling: warriorVitScale('VIT aumenta DEF e MDEF; o bônus condicional é fixo.') },
      { name: 'Fôlego Guardado', desc: '+8 de Vida Máxima. Depois de um Aparo bem-sucedido, recebe +3% de DEF por 2 ciclos.', effect: { maxHpFlat: 8 }, mechanicRefs: ['guerreiro:parry'], scaling: warriorVitScale('Aumenta a Vida Máxima; o bônus pós-Aparo é fixo.') },
      { name: 'Reflexo Marcial', desc: '+2 pontos percentuais de Precisão. Uma habilidade lançada com Riposta pronta recebe +3 pontos percentuais adicionais.', effect: { accuracyPct: 0.02 }, mechanicRefs: ['guerreiro:riposte'], scaling: warriorFixedScale('Precisão fixa; Riposta é verificada no início do cast.') },
      { name: 'Disciplina Defensiva', desc: '-3% de Recarga somente para Mestre da Guarda. Guardas Preparadas duram +1 ciclo, sem ganhar Aparos extras.', effect: {}, mechanicRefs: ['guerreiro:parry'], scaling: warriorFixedScale('Recarga e duração adicionais são fixas.') },
      { name: 'Guarda Preparada', desc: 'Ação de suporte. Por 3 ciclos, prepara 1 Aparo: reduz 28% do dano direto restante e causa 18 de Postura. Recarga: 5 ciclos.', ability: { name: 'Guarda Preparada', desc: 'Prepara 1 Aparo de 28% e 18 de Postura por 3 ciclos.', cooldown: 5, condition: { type: 'always' }, effect: { kind: 'preparedGuard', preparedParries: 1, parryReductionPct: 0.28, postureDamage: 18, preparedDuration: 3, canGenerateRiposte: true, guardAbility: true } }, mechanicRefs: ['guerreiro:parry', 'guerreiro:posture'], scaling: [{ attribute: 'vit', label: 'VIT', role: 'principal', description: 'Técnica de Impacto pode elevar a redução do Aparo, respeitando 45%.' }, { label: 'Postura', role: 'mecanica', description: 'Causa 18 de Dano de Postura fixos.' }] },
      { name: 'Armadura Ativa', desc: '+2,5% de DEF. Depois de um Aparo, recebe +4% de MDEF por 2 ciclos.', effect: { defPct: 0.025 }, mechanicRefs: ['guerreiro:parry'], scaling: warriorVitScale('VIT aumenta DEF e MDEF; o bônus pós-Aparo é fixo.') },
      { name: 'Riposta Imediata', desc: 'Todo Aparo bem-sucedido prepara uma Riposta: a próxima habilidade ofensiva recebe +0,18x ATK e +6 de Postura.', effect: {}, mechanicRefs: ['guerreiro:riposte'], scaling: warriorAtkScale('Riposta acrescenta +6 de Postura fixos.') },
      { name: 'Técnica de Impacto', desc: 'VIT melhora a redução do Aparo em 0,15 ponto percentual por VIT total, até +8 pontos percentuais.', effect: {}, mechanicRefs: ['guerreiro:parry'], scaling: warriorVitScale('Cada ponto de VIT concede +0,15 pp à redução do Aparo, hard cap adicional de 8 pp.') },
      { name: 'Aço Contra Aço', desc: 'Um Aparo contra dano pré-Aparo de pelo menos 15% da Vida Máxima causa +8 de Postura e prepara Riposta Pesada (+0,28x ATK e +10 de Postura).', effect: {}, mechanicRefs: ['guerreiro:parry', 'guerreiro:riposte'], scaling: warriorVitScale('Vida Máxima define o limite de Aparo Pesado; os bônus são fixos.') },
      { name: 'Corte de Riposta', desc: 'Cause 1,50x ATK e 12 de Postura. Riposta pronta é aplicada e consumida normalmente. Recarga: 4 ciclos.', ability: { name: 'Corte de Riposta', desc: '1,50x ATK e 12 de Postura; recebe os bônus da Riposta.', cooldown: 4, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 1.50, postureDamage: 12, guardAbility: true } }, mechanicRefs: ['guerreiro:riposte', 'guerreiro:posture'], scaling: warriorAtkScale('12 de Postura fixos antes da Riposta.') },
      { name: 'Guarda Cruzada', desc: 'Ação de suporte. Por 4 ciclos, prepara 2 Aparos de 18% e 11 de Postura. Somente o primeiro gera Riposta normal; o segundo pode elevá-la a Pesada. Recarga: 8 ciclos.', ability: { name: 'Guarda Cruzada', desc: 'Prepara 2 Aparos de 18% e 11 de Postura por 4 ciclos.', cooldown: 8, condition: { type: 'always' }, effect: { kind: 'preparedGuard', preparedParries: 2, parryReductionPct: 0.18, postureDamage: 11, preparedDuration: 4, canGenerateRiposte: true, guardAbility: true } }, mechanicRefs: ['guerreiro:parry', 'guerreiro:riposte'], scaling: warriorVitScale('Técnica de Impacto pode elevar a redução; hard cap final de 45%.') },
      { name: 'Postura Inabalável', desc: '+3% de MDEF. Enquanto Riposta ou Riposta Pesada estiver pronta, recebe +5 pontos percentuais de Tenacidade.', effect: { mdefPct: 0.03 }, mechanicRefs: ['guerreiro:riposte'], scaling: warriorVitScale('Aumenta MDEF; a Tenacidade condicional é fixa.') },
      { name: 'Desarme Técnico', desc: 'Requer Riposta. Cause 1,85x ATK e 18 de Postura, mais o bônus da Riposta. Ao acertar, reduz o ATK inimigo em 10% por 2 ciclos. Recarga: 6 ciclos.', ability: { name: 'Desarme Técnico', desc: 'Requer Riposta; 1,85x ATK, 18 de Postura e -10% ATK inimigo.', cooldown: 6, condition: { type: 'riposteReady' }, effect: { kind: 'bigHit', dmgMult: 1.85, postureDamage: 18, riposteRequired: true, atkDebuffOnHitPct: 0.10, atkDebuffRounds: 2, guardAbility: true } }, mechanicRefs: ['guerreiro:riposte', 'guerreiro:posture'], scaling: warriorAtkScale('18 de Postura fixos antes da Riposta.') },
      { name: 'Contra-Golpe Perfeito', desc: 'Requer Riposta e Postura inimiga em 40 ou menos. Cause 2,35x ATK e 26 de Postura. Se quebrar a Guarda, o primeiro ataque da janela recebe +5 pp de Precisão. Recarga: 8 ciclos.', ability: { name: 'Contra-Golpe Perfeito', desc: 'Requer Riposta e Postura até 40; 2,35x ATK e 26 de Postura.', cooldown: 8, condition: { type: 'all', conditions: [{ type: 'riposteReady' }, { type: 'enemyPostureAtMost', value: 40 }] }, effect: { kind: 'bigHit', dmgMult: 2.35, postureDamage: 26, riposteRequired: true, perfectCounterAccuracyOnBreak: true, guardAbility: true } }, mechanicRefs: ['guerreiro:riposte', 'guerreiro:guardbreak'], scaling: warriorAtkScale('26 de Postura fixos antes da Riposta.') },
      { name: 'Mestre do Aparo', desc: 'Todos os Aparos recebem +5 pontos percentuais de redução. Se um Aparo causar Guarda Quebrada, a janela recebe +1 ação ofensiva, até 3.', effect: {}, mechanicRefs: ['guerreiro:parry', 'guerreiro:guardbreak'], scaling: warriorVitScale('Aplica depois do valor base e antes do hard cap final de 45%.') },
    ]),
    buildPath('guerreiro', 'duelista', 'Duelista', '#c89a2e', [
      { name: 'Olho de Espadachim', desc: '+2 pontos percentuais de Precisão. O primeiro golpe de habilidade Duelista que acertar cada inimigo enquanto Firme causa +5 de Postura.', effect: { accuracyPct: 0.02 }, mechanicRefs: ['guerreiro:posture'], scaling: warriorFixedScale('Precisão e o primeiro bônus de +5 de Postura são fixos.') },
      { name: 'Ponta Precisa', desc: '+1,5 ponto percentual de Crítico. Contra inimigo Aberto, recebe +1 ponto percentual adicional; não se aplica em Guarda Quebrada.', effect: { critPct: 0.015 }, mechanicRefs: ['guerreiro:posture'], scaling: warriorFixedScale('Chance de Crítico fixa.') },
      { name: 'Passo de Medida', desc: '+1,5% de Evasão. Ao atravessar Firme → Instável ou Instável → Aberto com uma habilidade Duelista, recebe +2% de Evasão por 2 ciclos.', effect: { evasionPct: 0.015 }, mechanicRefs: ['guerreiro:reading'], scaling: warriorFixedScale('Evasão fixa; o bônus temporário não acumula.') },
      { name: 'Técnica de Medida', desc: '-3% de Recarga somente para Duelista. Contra inimigo Aberto, habilidades Duelistas recebem +2 pontos percentuais de Precisão.', effect: {}, mechanicRefs: ['guerreiro:posture'], scaling: warriorFixedScale('Recarga e Precisão condicionais são fixas.') },
      { name: 'Estocada de Medida', desc: 'Muda conforme a faixa: Firme 1,25x/20; Instável 1,50x/14; Aberto 1,75x/10 e +8 pp Precisão; Quebrada 1,90x/0. Recarga: 3 ciclos.', ability: { name: 'Estocada de Medida', desc: 'Dano, Postura e Precisão mudam conforme a faixa atual.', cooldown: 3, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 1.25, postureDamage: 20, dmgMultByBand: { firm: 1.25, unstable: 1.50, open: 1.75, broken: 1.90 }, postureDamageByBand: { firm: 20, unstable: 14, open: 10, broken: 0 }, duelistAbility: true } }, mechanicRefs: ['guerreiro:posture', 'guerreiro:guardbreak'], scaling: warriorAtkScale('Postura fixa por faixa; apenas Destreza Marcial pode ampliá-la.') },
      { name: 'Mão Firme', desc: '+4% de Dano Crítico. Contra inimigo Aberto ou com Guarda Quebrada, +2% de dano físico direto.', effect: { critDmgPct: 0.04 }, mechanicRefs: ['guerreiro:posture'], scaling: warriorFixedScale('Dano Crítico e dano condicional fixos.') },
      { name: 'Leitura da Guarda', desc: 'Atravessar uma faixa para baixo com habilidade Duelista prepara 1 Leitura. A próxima ofensiva Duelista recebe +5 pp de Precisão e consome a carga no início do cast.', effect: {}, mechanicRefs: ['guerreiro:reading'], scaling: warriorFixedScale('Leitura tem máximo de uma carga.') },
      { name: 'Destreza Marcial', desc: 'DES aumenta o Dano de Postura das habilidades Duelistas em 0,30% por DES total, até +12%.', effect: {}, mechanicRefs: ['guerreiro:posture'], scaling: warriorDexScale('Concede +0,30% de Dano de Postura por DES total, hard cap de 12%.') },
      { name: 'Finta Verdadeira', desc: 'Depois de Finta de Lâmina, prepara Finta: a próxima ofensiva Duelista recebe +8 de Postura e +10% penetração de DEF, consumidos no início do cast.', effect: {}, mechanicRefs: ['guerreiro:feint'], scaling: warriorFixedScale('Os bônus da Finta são fixos e não acumulam.') },
      { name: 'Finta de Lâmina', desc: 'Ação de suporte sem rolagem: reduz 16 de Postura, mas nunca abaixo de 1. Não pode quebrar a Guarda. Prepara Finta e pode gerar Leitura. Recarga: 5 ciclos.', ability: { name: 'Finta de Lâmina', desc: 'Reduz 16 de Postura sem baixar de 1 e prepara Finta.', cooldown: 5, condition: { type: 'all', conditions: [{ type: 'notGuardBroken' }, { type: 'not', conditions: [{ type: 'enemyPostureAtMost', value: 1 }] }] }, effect: { kind: 'feint', postureDamage: 16, noPostureBreak: true, duelistAbility: true } }, mechanicRefs: ['guerreiro:posture', 'guerreiro:feint', 'guerreiro:reading'], scaling: warriorDexScale('Destreza Marcial amplia os 16 de Postura; Finta mantém o piso de 1.') },
      { name: 'Corte de Oportunidade', desc: 'Muda conforme a faixa: Firme 1,35x/18; Instável 1,75x/14; Aberto 2,05x/10; Quebrada 2,20x/0. Recarga: 4 ciclos.', ability: { name: 'Corte de Oportunidade', desc: 'Fica mais ofensivo conforme a Guarda cai.', cooldown: 4, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 1.35, postureDamage: 18, dmgMultByBand: { firm: 1.35, unstable: 1.75, open: 2.05, broken: 2.20 }, postureDamageByBand: { firm: 18, unstable: 14, open: 10, broken: 0 }, duelistAbility: true } }, mechanicRefs: ['guerreiro:posture', 'guerreiro:guardbreak'], scaling: warriorAtkScale('Postura fixa por faixa; apenas Destreza Marcial pode ampliá-la.') },
      { name: 'Lâmina na Abertura', desc: 'Contra inimigo Aberto, +5% penetração de DEF. Durante Guarda Quebrada, +8%.', effect: {}, mechanicRefs: ['guerreiro:posture', 'guerreiro:guardbreak'], scaling: warriorFixedScale('Penetração condicional fixa.') },
      { name: 'Estocada Profunda', desc: 'Requer inimigo Aberto. Cause 2,15x ATK, 22 de Postura e possui 12% de penetração de DEF. Se quebrar a Guarda, prepara Leitura Perfeita. Recarga: 6 ciclos.', ability: { name: 'Estocada Profunda', desc: 'Somente em Postura Aberta; 2,15x ATK, 22 de Postura e 12% penetração.', cooldown: 6, condition: { type: 'enemyPostureBand', postureBand: 'open' }, effect: { kind: 'bigHit', dmgMult: 2.15, postureDamage: 22, defPenPct: 0.12, readingPerfectOnBreak: true, duelistAbility: true } }, mechanicRefs: ['guerreiro:posture', 'guerreiro:reading'], scaling: warriorAtkScale('22 de Postura antes de Destreza Marcial.') },
      { name: 'Golpe do Mestre', desc: 'Requer Guarda Quebrada. Acerto garantido, mas Crítico normal. Cause 2,65x ATK; com Leitura Perfeita, 2,85x. Depois encerra a Guarda Quebrada. Recarga: 8 ciclos.', ability: { name: 'Golpe do Mestre', desc: 'Acerto garantido durante Guarda Quebrada; encerra a janela após resolver.', cooldown: 8, condition: { type: 'guardBroken' }, effect: { kind: 'bigHit', dmgMult: 2.65, guaranteedAccuracy: true, finishGuardBreak: true, duelistAbility: true } }, mechanicRefs: ['guerreiro:guardbreak', 'guerreiro:reading'], scaling: warriorAtkScale('Não causa Dano de Postura; troca as ações restantes pela execução.') },
      { name: 'Mestre do Tempo', desc: 'Leitura normal também concede +0,15x ATK. Leitura Perfeita substitui a normal e concede +0,20x ATK e +5 pp de Precisão.', effect: {}, mechanicRefs: ['guerreiro:reading'], scaling: warriorAtkScale('Leitura normal e Perfeita não se somam.') },
    ]),
  ],
  mago: [
    buildPath('mago', 'piromante', 'Piromante', '#c1502e', [
      { name: 'Mente Incandescente', desc: '+2% de dano mágico direto de Fogo. A primeira magia de Fogo que acertar cada inimigo gera +5 Calor.', effect: { magicDmgPct: 0.02 }, mechanicRefs: ['mago:heat'] },
      { name: 'Chama Disciplinada', desc: '+2 pontos percentuais de Precisão de Fogo; com 60+ Calor, +2 adicionais.', effect: { accuracyPct: 0.02 }, mechanicRefs: ['mago:heat'] },
      { name: 'Cinzas Defensivas', desc: '+2% MDEF. Ao consumir 40+ Calor, o próximo dano direto recebido é reduzido em 6%.', effect: { mdefPct: 0.02 }, mechanicRefs: ['mago:heat'] },
      { name: 'Escrita de Fogo', desc: '-3% Recarga de Piromante. Magias de Fogo Amplificadas recebem +3 pontos percentuais de Precisão.', effect: {}, mechanicRefs: ['mago:runes'] },
      { name: 'Bola de Fogo', desc: 'Normal: 1,30x MATK e +20 Calor. Amplificada: 1,50x MATK e +25 Calor.', ability: { name: 'Bola de Fogo', desc: '1,30x MATK e gera 20 Calor. Amplificada: 1,50x e 25 Calor.', cooldown: 3, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 1.30, amplifiedDmgMult: 1.50, element: 'fire', heatGain: 20, amplifiedHeatGain: 25 } }, mechanicRefs: ['mago:runes', 'mago:heat'] },
      { name: 'Dissipação Arcana', desc: '+2,5% MDEF. Ações sem Fogo resfriam 15 de Calor em vez de 10.', effect: { mdefPct: 0.025 }, mechanicRefs: ['mago:heat'] },
      { name: 'Pressão Arcana', desc: 'Ao entrar em Limite Térmico, a próxima habilidade que consumir Calor recebe +0,15x MATK.', effect: {}, mechanicRefs: ['mago:heat'] },
      { name: 'Fornalha Interior', desc: '+2% dano mágico direto de Fogo. Com 60–89 Calor, +3 pontos percentuais de Precisão de Fogo.', effect: { magicDmgPct: 0.02 }, mechanicRefs: ['mago:heat'] },
      { name: 'Válvula de Emergência', desc: 'O primeiro Superaquecimento de cada inimigo causa 3% da Vida Máxima, em vez de 5%.', effect: {}, mechanicRefs: ['mago:overheat'] },
      { name: 'Incinerar', desc: 'Normal: 1,15x MATK e Queimadura de 0,16x MATK por 3 ciclos; +18 Calor. Amplificada: 1,35x, 0,20x por ciclo e +22 Calor.', ability: { name: 'Incinerar', desc: 'Dano direto e Queimadura por 3 ciclos; gera Calor. Amplificada fortalece ambos.', cooldown: 4, condition: { type: 'always' }, effect: { kind: 'applyStatus', dmgMult: 1.15, amplifiedDmgMult: 1.35, amplifiedStatusDmgPct: 0.20, element: 'fire', status: 'burn', statusRounds: 3, statusDmgPct: 0.16, heatGain: 18, amplifiedHeatGain: 22 } }, mechanicRefs: ['mago:runes', 'mago:heat'] },
      { name: 'Descarga Térmica', desc: 'Requer 60 Calor. Consome 40 e causa 1,45x + 0,0105x por Calor inicial (máx. 2,75x). Amplificada: +0,25x.', ability: { name: 'Descarga Térmica', desc: 'Consome 40 Calor e escala com o Calor no início do cast.', cooldown: 5, condition: { type: 'resourceAtLeast', resource: 'heat', value: 60 }, effect: { kind: 'bigHit', dmgMult: 1.45, amplifiedDmgMult: 0.25, element: 'fire', heatCost: 40, heatDmgMultPerPoint: 0.0105, heatDmgMultCap: 2.75 } }, mechanicRefs: ['mago:heat', 'mago:runes'] },
      { name: 'Núcleo de Magma', desc: '+3% dano mágico direto de Fogo. Habilidades que consomem Calor com 90+ recebem +3% de dano direto final.', effect: { magicDmgPct: 0.03 }, mechanicRefs: ['mago:heat'] },
      { name: 'Coluna Solar', desc: '1,55x + até 0,60x MATK pelo Calor atual. Amplificada: +0,30x. Depois gera 20 Calor.', ability: { name: 'Coluna Solar', desc: 'Escala com o Calor atual e pode causar Superaquecimento.', cooldown: 6, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 1.55, amplifiedDmgMult: 0.30, element: 'fire', heatGain: 20, heatDmgMultPerPoint: 0.006, heatDmgMultCap: 2.15 } }, mechanicRefs: ['mago:heat', 'mago:runes'] },
      { name: 'Cataclismo', desc: 'Requer 70 Calor. Consome todo o Calor e causa 1,80x + 0,011x por Calor inicial. Amplificada: +0,30x.', ability: { name: 'Cataclismo', desc: 'Consome todo o Calor; mantém os bônus da faixa registrada no cast.', cooldown: 9, condition: { type: 'resourceAtLeast', resource: 'heat', value: 70 }, effect: { kind: 'bigHit', dmgMult: 1.80, amplifiedDmgMult: 0.30, element: 'fire', heatCostAll: true, heatDmgMultPerPoint: 0.011 } }, mechanicRefs: ['mago:heat', 'mago:runes'] },
      { name: 'Mestre do Limite', desc: 'Após consumir Calor, recupere 10; se a habilidade foi Amplificada, 15.', effect: {}, mechanicRefs: ['mago:heat', 'mago:runes'] },
    ]),
    buildPath('mago', 'gelido', 'Gélido', '#3f7ab8', [
      { name: 'Mente Serena', desc: '+2% MDEF. A primeira magia Gélida que acertar cada inimigo avança +1 Estado Térmico.', effect: { mdefPct: 0.02 }, mechanicRefs: ['mago:thermal_state'] },
      { name: 'Geometria Cristalina', desc: '+2% dano mágico direto de Gelo; contra Frágil ou Congelado, +2 pontos percentuais de Precisão.', effect: { magicDmgPct: 0.02 }, mechanicRefs: ['mago:thermal_state'] },
      { name: 'Reserva Cristalina', desc: '+8 Vida Máxima. Barreiras Gélidas recebem +8% de eficiência relativa.', effect: { maxHpFlat: 8 } },
      { name: 'Ritmo Glacial', desc: '-3% Recarga de Gélido. Ao congelar, a próxima habilidade Gélida recebe +5 pontos percentuais de Precisão.', effect: {} },
      { name: 'Lança de Gelo', desc: 'Normal: 1,30x MATK e avança 1 Estado. Amplificada: 1,50x e avança 2.', ability: { name: 'Lança de Gelo', desc: 'Avança o Estado Térmico ao acertar.', cooldown: 3, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 1.30, amplifiedDmgMult: 1.50, element: 'frost', thermalAdvanceOnHit: 1, amplifiedThermalAdvanceOnHit: 2 } } },
      { name: 'Pele de Geada', desc: '+2,5% MDEF. Contra inimigo Frágil ou Congelado, -4% dano direto recebido.', effect: { mdefPct: 0.025 } },
      { name: 'Frio Penetrante', desc: 'Enquanto o inimigo está Frágil ou Congelado, -5% MDEF inimiga.', effect: {} },
      { name: 'Sabedoria do Inverno', desc: 'Barreiras Gélidas recebem até +10% de eficiência baseada em SAB total.', effect: {} },
      { name: 'Cristalização', desc: 'Ao entrar em Congelado, receba barreira de 4% da Vida Máxima por 3 ciclos.', effect: {} },
      { name: 'Barreira de Gelo', desc: 'Com HP abaixo do limite: barreira de 10% da Vida Máxima por 4 ciclos. Amplificada: 13%; o primeiro golpe absorvido avança 2 Estados.', ability: { name: 'Barreira de Gelo', desc: 'Barreira Gélida que avança o Estado Térmico no primeiro golpe absorvido.', cooldown: 6, condition: { type: 'hpBelow', pct: 0.8 }, effect: { kind: 'shield', shieldPct: 0.10, amplifiedDmgMult: 0.13, element: 'frost' } } },
      { name: 'Mordida Glacial', desc: '1,50x MATK e avança 1 Estado; se já estava Frágil ou Congelado, reduz dano inimigo por 2 ciclos. Amplificada: 1,70x e redução maior.', ability: { name: 'Mordida Glacial', desc: 'Dano de Gelo e avanço térmico.', cooldown: 4, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 1.50, amplifiedDmgMult: 1.70, element: 'frost', thermalAdvanceOnHit: 1 } } },
      { name: 'Coração de Permafrost', desc: '+3% dano mágico direto de Gelo. Estilhaçar em Congelado recebe +0,15x MATK.', effect: { magicDmgPct: 0.03 } },
      { name: 'Estilhaçar', desc: 'Requer Estado diferente de Normal. Resfriado 1,55x; Frágil 2,15x; Congelado 2,75x. Amplificada: +0,25x; remove o Estado ao acertar.', ability: { name: 'Estilhaçar', desc: 'Converte Estado Térmico em dano direto.', cooldown: 6, condition: { type: 'stateActive', state: 'thermal' }, effect: { kind: 'bigHit', element: 'frost', shatter: true, amplifiedDmgMult: 0.25 } } },
      { name: 'Zero Absoluto', desc: 'Se não está Congelado: 1,25x MATK e Congela. Se já está Congelado: 2,35x. Amplificada: 1,50x ou 2,65x.', ability: { name: 'Zero Absoluto', desc: 'Congela ou castiga um inimigo já Congelado sem empilhar atraso.', cooldown: 9, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 1.25, amplifiedDmgMult: 1.50, element: 'frost', thermalAdvanceOnHit: 3 } } },
      { name: 'Inverno Perpétuo', desc: 'Quando Congelado termina pela ação inimiga, fica Frágil; Estilhaçar Congelado deixa Resfriado.', effect: {}, mechanicRefs: ['mago:frozen', 'mago:thermal_state'] },
    ]),
    buildPath('mago', 'eletromante', 'Eletromante', '#c89a2e', [
      { name: 'Mente Condutora', desc: '+2% dano mágico direto elétrico. O primeiro Circuito fechado por inimigo recebe Pulso +0,05x MATK.', effect: { magicDmgPct: 0.02 }, mechanicRefs: ['mago:circuit'] },
      { name: 'Impulso Nervoso', desc: '+2% velocidade de ação; com Última Polaridade, AGI dá até +5% adicional.', effect: {} },
      { name: 'Precisão Voltaica', desc: '+2 pontos percentuais de Precisão elétrica; com Circuito 2+, +2 adicionais.', effect: { accuracyPct: 0.02 } },
      { name: 'Circuito Curto', desc: '-3% Recarga elétrica. Se uma magia Amplificada fechar Circuito, seu Pulso recebe +15% de dano final.', effect: {} },
      { name: 'Faísca Arcana', desc: '[+ POSITIVA] Normal: 1,10x MATK. Amplificada: 1,25x.', ability: { name: 'Faísca Arcana', desc: '[+ POSITIVA] Peça rápida para montar Circuitos.', cooldown: 3, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 1.10, amplifiedDmgMult: 1.25, element: 'lightning', polarity: 'positive' } } },
      { name: 'Isolamento Arcano', desc: 'Ao fechar Circuito, o próximo dano direto recebido é reduzido em 6%.', effect: {} },
      { name: 'Condutor Perfeito', desc: 'Ao fechar Circuito, +4% velocidade de ação por 2 ciclos; não acumula.', effect: {} },
      { name: 'Ressonância em Série', desc: '+2% dano elétrico. Multi-hit com 2+ acertos que fecha Circuito dá Pulso +0,05x.', effect: { magicDmgPct: 0.02 } },
      { name: 'Corrente Residual', desc: 'Ao repetir polaridade com Circuito acima de zero, causa Pulso Residual de 0,10x MATK.', effect: {} },
      { name: 'Arco Duplo', desc: '[- NEGATIVA] 2 impactos de 0,70x MATK. Amplificada: terceiro impacto de 0,30x.', ability: { name: 'Arco Duplo', desc: '[- NEGATIVA] Cada impacto rola Precisão e Crítico próprios.', cooldown: 4, condition: { type: 'always' }, effect: { kind: 'multiHit', hitCount: 2, dmgMultPerHit: 0.70, amplifiedDmgMult: 0.30, element: 'lightning', polarity: 'negative' } } },
      { name: 'Inversor de Fase', desc: 'Suporte: +8% velocidade por 3 ciclos e a próxima elétrica fecha Circuito como oposta. Amplificada: 12% por 4 e +5pp Precisão.', ability: { name: 'Inversor de Fase', desc: 'Conta para Runas; não altera Polaridade sozinho.', cooldown: 7, condition: { type: 'always' }, effect: { kind: 'haste', hasteRounds: 3, element: 'lightning', circuitPerfectWithInverter: true } } },
      { name: 'Núcleo de Trovão', desc: '+3% dano elétrico. Enquanto Ressonância está pronta, a habilidade que a consome recebe +4% dano direto.', effect: { magicDmgPct: 0.03 } },
      { name: 'Raio Perfurante', desc: '[+ POSITIVA] 1,65x MATK com 12% penetração MDEF; fechando Circuito, 18%. Amplificada: 1,85x e 20%.', ability: { name: 'Raio Perfurante', desc: '[+ POSITIVA] Penetração é calculada por cast.', cooldown: 5, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 1.65, amplifiedDmgMult: 1.85, element: 'lightning', polarity: 'positive', mdefPenPct: 0.12, amplifiedMdefPenPct: 0.20 } } },
      { name: 'Tempestade Devastadora', desc: '[- NEGATIVA] 4 impactos de 0,45x MATK. Amplificada: 0,52x cada. Fecha no máximo um Circuito.', ability: { name: 'Tempestade Devastadora', desc: '[- NEGATIVA] Multi-hit com rolagens independentes.', cooldown: 8, condition: { type: 'always' }, effect: { kind: 'multiHit', hitCount: 4, dmgMultPerHit: 0.45, amplifiedDmgMult: 0.52, element: 'lightning', polarity: 'negative' } } },
      { name: 'Mestre da Ressonância', desc: 'Pulso de Circuito 3 vira 0,40x MATK; Eco vira 0,65x. Ao consumir Ressonância, Circuito fica no mínimo 1.', effect: {}, mechanicRefs: ['mago:resonance', 'mago:circuit'] },
    ]),
  ],
  ladino: [
    buildPath('ladino', 'veneno', 'Veneno', '#4f7a3a', [
      { name: 'Ímpeto Fatal', desc: '+3% de dano crítico.', effect: { critDmgPct: 0.03 } },
      { name: 'Talento Natural', desc: '-2% de recarga das habilidades.', effect: { cooldownReductionPct: 0.02 } },
      { name: 'Precisão Brutal', desc: '+3% de dano crítico.', effect: { critDmgPct: 0.03 } },
      { name: 'Ritmo Acelerado', desc: '-2.5% de recarga das habilidades.', effect: { cooldownReductionPct: 0.025 } },
      { name: 'Golpe Peçonhento', desc: 'Habilidade ativa: envenena o inimigo, causando dano contínuo por 6s. Recarga de 6s.',
        ability: { name: 'Golpe Peçonhento', desc: 'Envenena o inimigo, causando dano contínuo por 6s.', cooldown: 4, condition: { type: 'always' }, effect: { kind: 'applyStatus', status: 'poison', statusRounds: 4, statusDmgPct: 0.4 } } },
      { name: 'Golpe Devastador', desc: '+4% de dano crítico.', effect: { critDmgPct: 0.04 } },
      { name: 'Sangue Envenenado', desc: 'Cura 7% do dano causado.', effect: { lifestealPct: 0.07 } },
      { name: 'Fluxo Constante', desc: '-3% de recarga das habilidades.', effect: { cooldownReductionPct: 0.03 } },
      { name: 'Instinto Venenoso', desc: 'Dano contra inimigo envenenado aumenta em 15%.', effect: { dmgPctVsStatus: { status: 'poison', pct: 0.15 } } },
      { name: 'Corte Tóxico', desc: 'Habilidade ativa: golpe com 1.9x de dano. Recarga de 5s.',
        ability: { name: 'Corte Tóxico', desc: 'Golpe com 1.9x de dano.', cooldown: 3, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 1.9 } } },
      { name: 'Veneno Mortal', desc: 'Habilidade ativa: envenena o inimigo com mais força por 8s. Recarga de 6s.',
        ability: { name: 'Veneno Mortal', desc: 'Envenena o inimigo com mais força por 8s.', cooldown: 4, condition: { type: 'always' }, effect: { kind: 'applyStatus', status: 'poison', statusRounds: 5, statusDmgPct: 0.5 } } },
      { name: 'Fúria Concentrada', desc: '+6% de dano crítico.', effect: { critDmgPct: 0.06 } },
      { name: 'Golpe Fatal', desc: 'Habilidade ativa: só pode ser usada com o inimigo envenenado — causa 2.4x de dano. Recarga de 5s.',
        ability: { name: 'Golpe Fatal', desc: 'Dano extra em inimigos envenenados.', cooldown: 3, condition: { type: 'enemyHasStatus', status: 'poison' }, effect: { kind: 'bonusVsStatus', dmgMult: 2.4 } } },
      { name: 'Execução Venenosa', desc: 'Habilidade ativa: só pode ser usada com o inimigo envenenado — causa 3.2x de dano. Recarga de 8s.',
        ability: { name: 'Execução Venenosa', desc: 'Dano massivo em inimigos envenenados.', cooldown: 5, condition: { type: 'enemyHasStatus', status: 'poison' }, effect: { kind: 'bonusVsStatus', dmgMult: 3.2 } } },
      { name: 'Fúria Silenciosa', desc: 'Cura 6% da vida máxima sempre que você acerta um crítico.', effect: { onCritHealPct: 0.06 } },
    ]),
    buildPath('ladino', 'sombras', 'Sombras', '#5b5f6a', [
      { name: 'Fluidez de Combate', desc: '+1.5% de evasão.', effect: { evasionPct: 0.015 } },
      { name: 'Olhar Atento', desc: '+1.5% de precisão.', effect: { accuracyPct: 0.015 } },
      { name: 'Esquiva Instintiva', desc: '+1.5% de evasão.', effect: { evasionPct: 0.015 } },
      { name: 'Mira Afiada', desc: '+2% de precisão.', effect: { accuracyPct: 0.02 } },
      { name: 'Passo nas Sombras', desc: 'Habilidade ativa: +25% de chance de esquiva por 5s. Recarga de 8s.',
        ability: { name: 'Passo nas Sombras', desc: '+25% de chance de esquiva por 5s.', cooldown: 5, condition: { type: 'always' }, effect: { kind: 'buffBlock', buffPct: 0.25, buffRounds: 3 } } },
      { name: 'Reflexo Ágil', desc: '+2% de evasão.', effect: { evasionPct: 0.02 } },
      { name: 'Reflexos', desc: '10% de chance de esquivar e reduzir o dano à metade.', effect: { blockChance: 0.10 } },
      { name: 'Foco Certeiro', desc: '+2.5% de precisão.', effect: { accuracyPct: 0.025 } },
      { name: 'Contragolpe', desc: 'Reflete 10% de todo dano recebido de volta no inimigo.', effect: { thornsPct: 0.10 } },
      { name: 'Golpe Cegante', desc: 'Habilidade ativa: golpe com 1.7x de dano que cega o inimigo, reduzindo sua precisão por 3s. Recarga de 6s.',
        ability: { name: 'Golpe Cegante', desc: 'Golpe com 1.7x de dano que cega o inimigo, reduzindo sua precisão por 3s.', cooldown: 4, condition: { type: 'always' }, effect: { kind: 'statMod', dmgMult: 1.7, statMod: 'accuracy', statModPct: -0.25, statModRounds: 2, statModTarget: 'enemy' } } },
      { name: 'Salto para as Sombras', desc: 'Habilidade ativa: só pode ser usada com sua vida abaixo de 40% — +30% de chance de esquiva por 5s. Recarga de 24s.',
        ability: { name: 'Salto para as Sombras', desc: '+30% de chance de esquiva por 5s quando sua vida está abaixo de 40%.', cooldown: 15, condition: { type: 'hpBelow', pct: 0.4 }, effect: { kind: 'buffBlock', buffPct: 0.30, buffRounds: 3 } } },
      { name: 'Passo Leve', desc: '+3% de evasão.', effect: { evasionPct: 0.03 } },
      { name: 'Véu das Sombras', desc: 'Habilidade ativa: +40% de chance de esquiva por 6s. Recarga de 11s.',
        ability: { name: 'Véu das Sombras', desc: '+40% de chance de esquiva por 6s.', cooldown: 7, condition: { type: 'always' }, effect: { kind: 'buffBlock', buffPct: 0.40, buffRounds: 4 } } },
      { name: 'Um com a Escuridão', desc: 'Habilidade ativa: +50% de chance de esquiva por 8s. Recarga de 13s.',
        ability: { name: 'Um com a Escuridão', desc: '+50% de chance de esquiva por 8s.', cooldown: 8, condition: { type: 'always' }, effect: { kind: 'buffBlock', buffPct: 0.50, buffRounds: 5 } } },
      { name: 'Vitalidade Furtiva', desc: '+15 de vida máxima.', effect: { maxHpFlat: 15 } },
    ]),
    buildPath('ladino', 'laminas', 'Lâminas Gêmeas', '#c89a2e', [
      { name: 'Reflexo Assassino', desc: '+1% de chance de crítico.', effect: { critPct: 0.01 } },
      { name: 'Potência Crua', desc: '+2 de dano.', effect: { flatBonusDmg: 2 } },
      { name: 'Olhar Predador', desc: '+1% de chance de crítico.', effect: { critPct: 0.01 } },
      { name: 'Golpe Pesado', desc: '+3 de dano.', effect: { flatBonusDmg: 3 } },
      { name: 'Investida Precisa', desc: 'Habilidade ativa: garante um acerto crítico. Recarga de 6s.',
        ability: { name: 'Investida Precisa', desc: 'Garante um acerto crítico.', cooldown: 4, condition: { type: 'always' }, effect: { kind: 'guaranteedCrit' } } },
      { name: 'Golpe Calculado', desc: '+1.2% de chance de crítico.', effect: { critPct: 0.012 } },
      { name: 'Sede pelas Lâminas', desc: 'Cura 6% da vida máxima sempre que você acerta um crítico.', effect: { onCritHealPct: 0.06 } },
      { name: 'Força Bruta', desc: '+4 de dano.', effect: { flatBonusDmg: 4 } },
      { name: 'Precisão Cirúrgica', desc: '+18% de dano crítico.', effect: { critDmgPct: 0.18 } },
      { name: 'Golpe Perfurante', desc: 'Habilidade ativa: golpe com 2.0x de dano que ignora parte da defesa do inimigo por 5s. Recarga de 6s.',
        ability: { name: 'Golpe Perfurante', desc: 'Golpe com 2.0x de dano; ignora parte da defesa do inimigo por 5s.', cooldown: 4, condition: { type: 'always' }, effect: { kind: 'statMod', dmgMult: 2.0, statMod: 'defPenPct', statModPct: 0.3, statModRounds: 3, statModTarget: 'self' } } },
      { name: 'Golpe de Misericórdia', desc: 'Habilidade ativa: só pode ser usada com o inimigo abaixo de 30% de vida — 2.5x de dano. Recarga de 6s.',
        ability: { name: 'Golpe de Misericórdia', desc: '2.5x de dano contra inimigos abaixo de 30% de vida.', cooldown: 4, condition: { type: 'enemyHpBelow', pct: 0.3 }, effect: { kind: 'bigHit', dmgMult: 2.5 } } },
      { name: 'Instinto Mortal', desc: '+1.8% de chance de crítico.', effect: { critPct: 0.018 } },
      { name: 'Fúria das Lâminas', desc: 'Habilidade ativa: golpe garantidamente crítico com 1.6x de dano adicional. Recarga de 8s.',
        ability: { name: 'Fúria das Lâminas', desc: 'Golpe garantidamente crítico com 1.6x de dano adicional.', cooldown: 5, condition: { type: 'always' }, effect: { kind: 'guaranteedCrit', dmgMult: 1.6 } } },
      { name: 'Execução Perfeita', desc: 'Habilidade ativa: só pode ser usada com o inimigo abaixo de 25% de vida — 3.2x de dano. Recarga de 10s.',
        ability: { name: 'Execução Perfeita', desc: '3.2x de dano contra inimigos abaixo de 25% de vida.', cooldown: 6, condition: { type: 'enemyHpBelow', pct: 0.25 }, effect: { kind: 'bigHit', dmgMult: 3.2 } } },
      { name: 'Instinto Mortal', desc: '+7% de chance de crítico.', effect: { critPct: 0.07 } },
    ]),
  ],
  // Clérigo "redesign completo e definitivo" — SAB/FÉ/GRAÇA/CONSAGRAÇÃO/
  // JULGAMENTO (see lib/clerigo.ts for the shared mechanic constants). Same
  // 15-node topology/ids as every other class — art indices 4/9/10/12/13
  // and the devocao/retidao/provacao path ids are unchanged, only the
  // content behind them is new.
  clerigo: [
    buildPath('clerigo', 'devocao', 'Devoção', '#d8c27a', [
      { name: 'Sabedoria Compassiva', desc: '+2% de defesa mágica. Enquanto sua vida estiver abaixo de 40%, sua cura direta ativa ganha +5% de eficiência final.', effect: { mdefPct: 0.02 },
        scaling: [{ attribute: 'wis', label: 'SAB', role: 'principal', description: 'Aumenta a defesa mágica; com vida abaixo de 40%, também a eficiência da cura direta (+5%).' }] },
      { name: 'Prece Serena', desc: '-3% de recarga, mas apenas em habilidades de Devoção.', effect: {},
        scaling: [{ attribute: 'wis', label: 'SAB', role: 'secundario', description: 'Sinergia tática — reduz a recarga somente das habilidades de Devoção.' }, { label: 'Recarga', role: 'mecanica', description: 'Não afeta habilidades de Retidão, Provação ou de outras classes.' }] },
      { name: 'Fôlego Abençoado', desc: '+8 de vida máxima. Depois de desbloquear Graça, aumenta o teto de Graça por VIT total (até +2 pontos percentuais).', effect: { maxHpFlat: 8 },
        mechanicRefs: ['clerigo:grace'],
        scaling: [{ attribute: 'vit', label: 'VIT', role: 'principal', description: 'Aumenta a vida máxima e, após desbloquear Graça, seu teto máximo (até +2pp).' }] },
      { name: 'Mãos Consagradas', desc: '+3% de eficiência da cura direta ativa. Reduz o limite de Cura Significativa para gerar Fé de 15% para 12% da Vida Base.', effect: {},
        mechanicRefs: ['clerigo:faith'],
        scaling: [{ attribute: 'wis', label: 'SAB', role: 'principal', description: 'Aumenta a eficiência da cura direta ativa (+3%).' }, { label: 'Fé', role: 'mecanica', description: 'Facilita gerar Fé por cura (limite cai de 15% para 12%).' }] },
      { name: 'Cura Divina', desc: 'Habilidade ativa: recupera 35% da Vida Base, ampliado por Poder de Suporte e bônus de cura. Gera Fé quando a cura efetiva atinge o limite de Cura Significativa. Recarga de 4 ciclos.',
        mechanicRefs: ['clerigo:faith'],
        ability: { name: 'Cura Divina', desc: 'Recupera 35% da Vida Base, com Poder de Suporte e bônus de cura; pode gerar Fé pela cura efetiva.', cooldown: 4, condition: { type: 'always' }, effect: { kind: 'heal', healPct: 0.35, faithGainOnHeal: true } },
        scaling: [{ attribute: 'wis', label: 'SAB', role: 'principal', description: 'Aumenta a quantidade curada através do Poder de Suporte.' }, { label: 'Fé', role: 'mecanica', description: 'Gera Fé se a cura efetiva atingir o limite de Cura Significativa.' }] },
      { name: 'Véu da Alma', desc: '+2.5% de defesa mágica. Enquanto você tiver um DOT, debuff ou silêncio ativo, sua cura direta ativa ganha +5% de eficiência final.', effect: { mdefPct: 0.025 },
        scaling: [{ attribute: 'wis', label: 'SAB', role: 'principal', description: 'Aumenta a defesa mágica e a eficiência da cura direta enquanto debuffado (+5%).' }] },
      { name: 'Graça Transbordante', desc: 'Desbloqueia Graça: 40% do overheal de curas diretas ativas vira Graça (cap de 8% da vida máxima efetiva, duração de 3 ciclos).', effect: {},
        mechanicRefs: ['clerigo:grace'],
        scaling: [{ attribute: 'wis', label: 'SAB', role: 'principal', description: 'Cura maior gera mais overheal, a matéria-prima da Graça.' }, { attribute: 'vit', label: 'VIT', role: 'secundario', description: 'Vida máxima efetiva maior pode ampliar o teto de Graça (via outros nós).' }, { label: 'Graça', role: 'mecanica', description: 'Desbloqueia a mecânica de Graça.' }] },
      { name: 'Liturgia Contínua', desc: '-3% de recarga das habilidades de Devoção (chega a -5% enquanto sua Fé for 3 ou mais, em habilidades de Devoção com custo de Fé).', effect: {},
        mechanicRefs: ['clerigo:faith'],
        scaling: [{ label: 'Fé', role: 'mecanica', description: 'O bônus de recarga cresce com Fé alta em habilidades que custam Fé.' }] },
      { name: 'Misericórdia Ativa', desc: 'Sempre que uma cura direta gerar Fé, se você tiver um DOT ativo, reduz a duração dele em 1 ciclo (uma vez por ação).', effect: {},
        mechanicRefs: ['clerigo:faith'],
        scaling: [{ label: 'Fé', role: 'mecanica', description: 'Só ativa quando a cura realmente gera Fé.' }] },
      { name: 'Renovação', desc: 'Habilidade ativa: custa 1 Fé — só com vida abaixo de 70% — regenera 3% da vida máxima efetiva por ciclo, por 3 ciclos. Recarga de 6 ciclos.',
        mechanicRefs: ['clerigo:faith'],
        ability: {
          name: 'Renovação', desc: 'Custa 1 Fé. Regenera 3% da vida máxima efetiva por ciclo, por 3 ciclos.',
          cooldown: 6, condition: { type: 'all', conditions: [{ type: 'hpBelow', pct: 0.70 }, { type: 'resourceAtLeast', resource: 'faith', value: 1 }] },
          effect: { kind: 'regen', regenPct: 0.03, regenRounds: 3, faithCost: 1 },
        },
        scaling: [{ attribute: 'wis', label: 'SAB', role: 'principal', description: 'Aumenta a cura de cada ciclo de regeneração.' }, { label: 'Fé', role: 'mecanica', description: 'Custa 1 Fé; os ciclos NÃO geram Fé nem Graça.' }] },
      { name: 'Escudo Sagrado', desc: 'Habilidade ativa: custa 1 Fé — só com vida abaixo de 80% — cria uma barreira de 8% da vida máxima efetiva por até 4 ciclos. Gera Fé se absorver o bastante. Recarga de 7 ciclos.',
        mechanicRefs: ['clerigo:faith'],
        ability: {
          name: 'Escudo Sagrado', desc: 'Custa 1 Fé. Cria uma barreira de 8% da vida máxima efetiva; gera Fé se absorver o suficiente.',
          cooldown: 7, condition: { type: 'all', conditions: [{ type: 'hpBelow', pct: 0.80 }, { type: 'resourceAtLeast', resource: 'faith', value: 1 }] },
          effect: { kind: 'shield', shieldPct: 0.08, faithCost: 1, shieldFaithThresholdPct: 0.08 },
        },
        scaling: [{ attribute: 'wis', label: 'SAB', role: 'principal', description: 'Aumenta o tamanho da barreira.' }, { attribute: 'vit', label: 'VIT', role: 'secundario', description: 'Aumenta a vida máxima efetiva usada como base da barreira.' }, { label: 'Fé', role: 'mecanica', description: 'Custa 1 Fé; pode gerar +1 Fé de volta se absorver o suficiente.' }] },
      { name: 'Coração Devoto', desc: '+12 de vida máxima. Enquanto sua vida estiver abaixo de 35%, a conversão de overheal em Graça aumenta em +10 pontos percentuais.', effect: { maxHpFlat: 12 },
        mechanicRefs: ['clerigo:grace'],
        scaling: [{ attribute: 'vit', label: 'VIT', role: 'principal', description: 'Aumenta a vida máxima; com vida baixa (<35%), também a conversão de overheal em Graça (+10pp).' }] },
      { name: 'Milagre', desc: 'Habilidade ativa: custa 3 Fé — só com vida abaixo de 35% — recupera 55% da Vida Base e remove o efeito negativo mais grave. Pode gerar no máximo 1 Fé, pela cura efetiva ou pela purificação. Recarga de 10 ciclos.',
        mechanicRefs: ['clerigo:faith'],
        ability: {
          name: 'Milagre', desc: 'Custa 3 Fé. Recupera 55% da Vida Base e remove o efeito negativo mais grave; pode gerar no máximo 1 Fé.',
          cooldown: 10, condition: { type: 'all', conditions: [{ type: 'hpBelow', pct: 0.35 }, { type: 'resourceAtLeast', resource: 'faith', value: 3 }] },
          effect: { kind: 'heal', healPct: 0.55, faithCost: 3, faithGainOnHeal: true },
          extraEffects: [{ kind: 'cleanseOne' }],
        },
        scaling: [{ attribute: 'wis', label: 'SAB', role: 'principal', description: 'Aumenta a cura.' }, { label: 'Fé', role: 'mecanica', description: 'Custa 3 Fé; gera no máximo +1 Fé pelo cast, mesmo curando e purificando.' }, { label: 'Graça', role: 'mecanica', description: 'O overheal pode virar Graça.' }] },
      { name: 'Ressurreição Menor', desc: 'Habilidade ativa: custa 4 Fé — só com vida abaixo de 30% — abre uma janela de 3 ciclos que impede sua morte uma vez por tentativa. Recupera 40% da Vida Base, ampliado por Poder de Suporte, limitado a 25% da Vida Máxima. Recarga de 15 ciclos.',
        mechanicRefs: ['clerigo:faith'],
        ability: {
          name: 'Ressurreição Menor', desc: 'Custa 4 Fé. Por 3 ciclos, um dano fatal é evitado uma vez por tentativa, restaurando parte da vida.',
          cooldown: 15, condition: { type: 'all', conditions: [{ type: 'hpBelow', pct: 0.30 }, { type: 'resourceAtLeast', resource: 'faith', value: 4 }] },
          effect: { kind: 'reviveWindow', faithCost: 4, reviveWindowRounds: 3, reviveHealPct: 0.40, reviveHealCapPct: 0.25 },
        },
        scaling: [{ attribute: 'wis', label: 'SAB', role: 'principal', description: 'Aumenta a vida restaurada se a ressurreição ativar.' }, { label: 'Fé', role: 'mecanica', description: 'Custa 4 Fé; não é reembolsada se a janela expirar sem ativar.' }] },
      { name: 'Graça Divina', desc: 'Melhora Graça: conversão de 40% para 55%, duração de 3 para 4 ciclos, cap de 8% para 12% da vida máxima efetiva (até 14% com Fôlego Abençoado). Quando uma reserva de Graça é totalmente consumida por dano, ganha +1 Fé.', effect: {},
        mechanicRefs: ['clerigo:grace', 'clerigo:faith'],
        scaling: [{ attribute: 'wis', label: 'SAB', role: 'principal', description: 'A cura maior gera mais overheal, aproveitado pela conversão melhorada.' }, { attribute: 'vit', label: 'VIT', role: 'secundario', description: 'Contribui para o teto de Graça via Fôlego Abençoado.' }, { label: 'Graça', role: 'mecanica', description: 'Melhora conversão/duração/cap de Graça.' }, { label: 'Fé', role: 'mecanica', description: 'Gera +1 Fé quando uma Graça é totalmente consumida.' }] },
    ]),
    buildPath('clerigo', 'retidao', 'Retidão', '#b8862e', [
      { name: 'Couraça Espiritual', desc: '+2% de defesa mágica. Enquanto Consagração estiver ativa, +3% de defesa mágica adicional.', effect: { mdefPct: 0.02 },
        mechanicRefs: ['clerigo:consecration'],
        scaling: [{ attribute: 'wis', label: 'SAB', role: 'principal', description: 'Aumenta a defesa mágica; mais ainda com Consagração ativa (+3%).' }] },
      { name: 'Disciplina Sagrada', desc: '+8 de vida máxima e +2 pontos percentuais de Tenacidade.', effect: { maxHpFlat: 8 },
        scaling: [{ attribute: 'vit', label: 'VIT', role: 'principal', description: 'Aumenta a vida máxima e a Tenacidade (respeitando o teto global).' }] },
      { name: 'Fé Vigilante', desc: '+2% de defesa mágica. Quando um efeito negativo é completamente resistido durante Consagração, ela é estendida em +1 ciclo (uma vez por instância).', effect: { mdefPct: 0.02 },
        mechanicRefs: ['clerigo:consecration'],
        scaling: [{ attribute: 'wis', label: 'SAB', role: 'principal', description: 'Aumenta a defesa mágica e a chance de resistir efeitos negativos.' }, { label: 'Consagração', role: 'mecanica', description: 'Resistir um efeito durante Consagração estende sua duração (+1 ciclo, uma vez por instância).' }] },
      { name: 'Barreira Ritual', desc: '+2.5% de defesa mágica. Barreiras normais criadas por você ganham +4% de eficiência multiplicativa (não afeta Graça).', effect: { mdefPct: 0.025 },
        scaling: [{ attribute: 'wis', label: 'SAB', role: 'principal', description: 'Aumenta a defesa mágica e o tamanho das barreiras normais (+4%, não afeta Graça).' }] },
      { name: 'Escudo da Retidão', desc: 'Habilidade ativa: cria uma barreira de 7% da vida máxima efetiva por 3 ciclos e Consagração por 3 ciclos. Pode gerar Fé se absorver o bastante. Recarga de 6 ciclos.',
        mechanicRefs: ['clerigo:consecration', 'clerigo:faith'],
        ability: {
          name: 'Escudo da Retidão', desc: 'Cria uma barreira de 7% da vida máxima efetiva e Consagração por 3 ciclos.',
          cooldown: 6, condition: { type: 'always' },
          effect: { kind: 'shield', shieldPct: 0.07, shieldFaithThresholdPct: 0.08, consecrationRoundsOnCast: 3 },
        },
        scaling: [{ attribute: 'wis', label: 'SAB', role: 'principal', description: 'Aumenta o tamanho da barreira.' }, { attribute: 'vit', label: 'VIT', role: 'secundario', description: 'Aumenta a vida máxima efetiva usada como base.' }, { label: 'Consagração', role: 'mecanica', description: 'Cria Consagração por 3 ciclos.' }, { label: 'Fé', role: 'mecanica', description: 'Pode gerar Fé se a barreira absorver o suficiente.' }] },
      { name: 'Guarda da Alma', desc: '+2% de defesa física. Enquanto tiver uma barreira normal ativa, +3% de defesa física adicional (não conta Graça).', effect: { defPct: 0.02 },
        scaling: [{ attribute: 'vit', label: 'VIT', role: 'principal', description: 'Aumenta a defesa física; mais ainda com uma barreira normal ativa (+3%).' }] },
      { name: 'Solo Consagrado', desc: 'Enquanto Consagração estiver ativa: +8% de defesa mágica e +6 pontos percentuais de Tenacidade. O primeiro efeito negativo aplicado em cada Consagração tem sua duração reduzida em 1 ciclo (e gera +1 Fé, uma vez por instância).', effect: {},
        mechanicRefs: ['clerigo:consecration', 'clerigo:faith'],
        scaling: [{ label: 'Consagração', role: 'mecanica', description: 'Bônus só se aplicam enquanto Consagração está ativa.' }, { label: 'Fé', role: 'mecanica', description: 'A primeira redução de efeito negativo por Consagração gera +1 Fé.' }] },
      { name: 'Vigília', desc: '+2.5% de defesa mágica. Enquanto Consagração estiver ativa, o primeiro tick de DOT que você sofrer nela causa -15% de dano.', effect: { mdefPct: 0.025 },
        mechanicRefs: ['clerigo:consecration'],
        scaling: [{ attribute: 'wis', label: 'SAB', role: 'principal', description: 'Aumenta a defesa mágica.' }, { label: 'Consagração', role: 'mecanica', description: 'Reduz o primeiro tick de DOT sofrido em cada Consagração (-15%).' }] },
      { name: 'Intercessão', desc: 'Quando uma barreira normal criada por você é completamente destruída por dano durante Consagração, recupera 4% da Vida Base, ampliado por Poder de Suporte (uma vez por barreira).', effect: {},
        mechanicRefs: ['clerigo:consecration'],
        scaling: [{ attribute: 'wis', label: 'SAB', role: 'principal', description: 'Aumenta a cura gerada.' }, { label: 'Consagração', role: 'mecanica', description: 'Só ativa enquanto Consagração está ativa.' }] },
      { name: 'Golpe Sagrado', desc: 'Habilidade mágica ativa: golpe com 1.45x de MATK (1.70x durante Consagração). Acertar durante Consagração estende sua duração em +1 ciclo. Recarga de 4 ciclos.',
        mechanicRefs: ['clerigo:consecration'],
        ability: {
          name: 'Golpe Sagrado', desc: 'Golpe com 1.45x de MATK (1.70x durante Consagração); acertar durante Consagração a estende em +1 ciclo.',
          cooldown: 4, condition: { type: 'always' },
          effect: { kind: 'bigHit', dmgMult: 1.45, consecrationDmgMultBonus: 0.25, extendConsecrationOnHit: 1 },
        },
        scaling: [{ attribute: 'int', label: 'INT', role: 'principal', description: 'Aumenta o dano mágico do golpe.' }, { label: 'Consagração', role: 'mecanica', description: 'Golpe mais forte e estende a duração enquanto ativa.' }, { attribute: 'wis', label: 'SAB', role: 'terciario', description: 'Sinergia defensiva indireta com o resto da árvore.' }] },
      { name: 'Voto de Proteção', desc: 'Habilidade ativa: custa 1 Fé — cria/renova Consagração por 4 ciclos e reduz o dano direto recebido em 8% (até 12% com Poder de Suporte) por 3 ciclos, além de +8 pontos percentuais de Tenacidade. Recarga de 7 ciclos.',
        mechanicRefs: ['clerigo:faith', 'clerigo:consecration'],
        ability: {
          name: 'Voto de Proteção', desc: 'Custa 1 Fé. Cria Consagração e reduz o dano recebido (8-12%) por 3 ciclos, com Tenacidade extra.',
          cooldown: 7, condition: { type: 'resourceAtLeast', resource: 'faith', value: 1 },
          effect: { kind: 'consecrationGuard', faithCost: 1, consecrationRoundsOnCast: 4, buffRounds: 3 },
        },
        scaling: [{ attribute: 'wis', label: 'SAB', role: 'principal', description: 'Aumenta a redução de dano recebido (8% base, até 12%).' }, { label: 'Fé', role: 'mecanica', description: 'Custa 1 Fé.' }, { label: 'Consagração', role: 'mecanica', description: 'Cria/renova Consagração por 4 ciclos.' }] },
      { name: 'Ancora Sagrada', desc: '+10 de vida máxima. Quando uma barreira normal é completamente destruída, o próximo golpe direto recebido em até 2 ciclos tem -8% de dano (não acumula).', effect: { maxHpFlat: 10 },
        scaling: [{ attribute: 'vit', label: 'VIT', role: 'principal', description: 'Aumenta a vida máxima.' }, { label: 'Consagração', role: 'mecanica', description: 'Reage à destruição de barreiras normais.' }] },
      { name: 'Martelo da Fé', desc: 'Habilidade ativa: custa 1 Fé — só durante Consagração — golpe mágico de 1.80x de MATK que cria uma pequena barreira baseada no dano causado. Recarga de 5 ciclos.',
        mechanicRefs: ['clerigo:faith', 'clerigo:consecration'],
        ability: {
          name: 'Martelo da Fé', desc: 'Custa 1 Fé. Golpe de 1.80x de MATK que cria uma barreira baseada no dano causado.',
          cooldown: 5, condition: { type: 'all', conditions: [{ type: 'stateActive', state: 'consecration' }, { type: 'resourceAtLeast', resource: 'faith', value: 1 }] },
          effect: { kind: 'bigHit', dmgMult: 1.80, faithCost: 1, shieldFromDamagePct: 0.20, shieldFromDamageCapPct: 0.06 },
        },
        scaling: [{ attribute: 'int', label: 'INT', role: 'principal', description: 'Aumenta o dano do golpe.' }, { attribute: 'wis', label: 'SAB', role: 'secundario', description: 'Aumenta a barreira criada a partir do dano.' }, { label: 'Fé', role: 'mecanica', description: 'Custa 1 Fé.' }, { label: 'Consagração', role: 'mecanica', description: 'Só pode ser usada durante Consagração.' }] },
      { name: 'Muralha Divina', desc: 'Habilidade ativa: custa 3 Fé — cria uma barreira de 12% da vida máxima efetiva (até 24%) e Consagração por 4 ciclos. Enquanto essa barreira tiver vida, -10% de dano direto recebido. Recarga de 12 ciclos.',
        mechanicRefs: ['clerigo:faith', 'clerigo:consecration'],
        ability: {
          name: 'Muralha Divina', desc: 'Custa 3 Fé. Cria uma grande barreira e Consagração por 4 ciclos; enquanto a barreira durar, -10% de dano recebido.',
          cooldown: 12, condition: { type: 'resourceAtLeast', resource: 'faith', value: 3 },
          effect: { kind: 'divineWall', faithCost: 3, shieldPct: 0.12, consecrationRoundsOnCast: 4 },
        },
        scaling: [{ attribute: 'wis', label: 'SAB', role: 'principal', description: 'Aumenta o tamanho da barreira.' }, { attribute: 'vit', label: 'VIT', role: 'secundario', description: 'Aumenta a vida máxima efetiva usada como base.' }, { label: 'Fé', role: 'mecanica', description: 'Custa 3 Fé.' }, { label: 'Consagração', role: 'mecanica', description: 'Cria Consagração por 4 ciclos.' }] },
      { name: 'Santuário Vivo', desc: 'Consagração ganha +1 ciclo de duração máxima. Uma vez por instância, se um golpe direto (após mitigação, antes de barreiras) causaria pelo menos 15% da vida máxima efetiva, ele é reduzido em mais 20% — e a Consagração termina imediatamente.', effect: {},
        mechanicRefs: ['clerigo:consecration'],
        scaling: [{ attribute: 'vit', label: 'VIT', role: 'principal', description: 'Vida máxima maior facilita atingir o teto que ativa a proteção.' }, { label: 'Consagração', role: 'mecanica', description: 'Sacrifica a Consagração ativa para negar um golpe grande.' }] },
    ]),
    buildPath('clerigo', 'provacao', 'Provação', '#8a4a6b', [
      { name: 'Fogo da Fé', desc: '+2% de MATK. Contra um inimigo com ao menos 1 Julgamento, +1% de dano mágico direto.', effect: { dmgPct: 0.02 },
        mechanicRefs: ['clerigo:judgment'],
        scaling: [{ attribute: 'int', label: 'INT', role: 'principal', description: 'Aumenta o MATK; contra um inimigo com Julgamento, também o dano direto (+1%).' }] },
      { name: 'Olhar do Juiz', desc: '+1.5% de precisão. Contra um inimigo com 3 ou mais Julgamentos, +2 pontos percentuais de precisão adicionais.', effect: { accuracyPct: 0.015 },
        mechanicRefs: ['clerigo:judgment'],
        scaling: [{ attribute: 'dex', label: 'DES', role: 'principal', description: 'Aumenta a precisão; mais ainda contra um inimigo com 3+ Julgamentos (+2%).' }] },
      { name: 'Palavra Ardente', desc: '+2% de MATK. Habilidades que aplicarem Julgamento ganham +3% de dano direto final.', effect: { dmgPct: 0.02 },
        mechanicRefs: ['clerigo:judgment'],
        scaling: [{ attribute: 'int', label: 'INT', role: 'principal', description: 'Aumenta o MATK e o dano de habilidades que aplicam Julgamento (+3%).' }] },
      { name: 'Zelo Inflexível', desc: '+1% de chance de crítico. Um crítico mágico direto contra um inimigo com Julgamento renova a duração dos stacks em +1 ciclo (uma vez por ação).', effect: { critPct: 0.01 },
        mechanicRefs: ['clerigo:judgment'],
        scaling: [{ attribute: 'luk', label: 'SOR', role: 'principal', description: 'Aumenta a chance de crítico, que renova a duração do Julgamento.' }] },
      { name: 'Chama Purificadora', desc: 'Habilidade ativa: golpe mágico de 1.35x de MATK que aplica 2 Julgamentos. Recarga de 4 ciclos.',
        mechanicRefs: ['clerigo:judgment', 'clerigo:faith'],
        ability: {
          name: 'Chama Purificadora', desc: 'Golpe de 1.35x de MATK que aplica 2 Julgamentos.',
          cooldown: 4, condition: { type: 'always' },
          effect: { kind: 'bigHit', dmgMult: 1.35, judgmentStacksOnHit: 2 },
        },
        scaling: [{ attribute: 'int', label: 'INT', role: 'principal', description: 'Aumenta o dano do golpe.' }, { label: 'Julgamento', role: 'mecanica', description: 'Aplica 2 Julgamentos; atingir 3 ou 5 pela primeira vez gera Fé.' }] },
      { name: 'Convicção', desc: '+2.5% de MATK. Duração de Julgamento de 4 para 5 ciclos (não aumenta o máximo de stacks).', effect: { dmgPct: 0.025 },
        mechanicRefs: ['clerigo:judgment'],
        scaling: [{ attribute: 'int', label: 'INT', role: 'principal', description: 'Aumenta o MATK.' }, { label: 'Julgamento', role: 'mecanica', description: 'Aumenta a duração do Julgamento (4→5 ciclos).' }] },
      { name: 'Acusação', desc: 'Quando um ataque mágico direto seu critica, aplica +1 Julgamento (uma vez por ação).', effect: {},
        mechanicRefs: ['clerigo:judgment'],
        scaling: [{ attribute: 'luk', label: 'SOR', role: 'secundario', description: 'Mais crítico gera mais Julgamento.' }, { label: 'Julgamento', role: 'mecanica', description: 'Só ativa em crítico direto, nunca DOT/reflexão.' }] },
      { name: 'Veredito Preciso', desc: '+2% de precisão. Cada Julgamento ativo no alvo dá +0.4 ponto percentual de precisão contra ele (até +2% com 5 stacks).', effect: { accuracyPct: 0.02 },
        mechanicRefs: ['clerigo:judgment'],
        scaling: [{ attribute: 'dex', label: 'DES', role: 'principal', description: 'Aumenta a precisão.' }, { label: 'Julgamento', role: 'mecanica', description: '+0.4% de precisão por Julgamento no alvo (até +2% com 5).' }] },
      { name: 'Peso do Veredito', desc: 'Cada Julgamento no inimigo dá +1.5% de dano mágico direto contra ele (até +7.5% com 5 stacks).', effect: {},
        mechanicRefs: ['clerigo:judgment'],
        scaling: [{ attribute: 'int', label: 'INT', role: 'principal', description: 'O MATK amplificado por essa % de dano.' }, { label: 'Julgamento', role: 'mecanica', description: '+1.5% de dano direto por stack (até +7.5% com 5).' }] },
      { name: 'Purificação Divina', desc: 'Habilidade de suporte: remove todos os DOTs, penalidades e silêncio ativos em você. Gera Fé se remover algo; a cada 2 efeitos removidos, aplica +1 Julgamento no inimigo (até 2). Recarga de 6 ciclos.',
        mechanicRefs: ['clerigo:faith', 'clerigo:judgment'],
        ability: {
          name: 'Purificação Divina', desc: 'Remove todos os efeitos negativos. Gera Fé se remover algo; a cada 2 removidos, aplica +1 Julgamento (até 2).',
          cooldown: 6, condition: { type: 'selfDebuffed' },
          effect: { kind: 'dispel', cleanseFaithGain: true, cleanseJudgmentPer2: true },
        },
        scaling: [{ attribute: 'wis', label: 'SAB', role: 'principal', description: 'Identidade de purificação do Clérigo.' }, { label: 'Fé', role: 'mecanica', description: 'Gera Fé ao remover pelo menos um efeito.' }, { label: 'Julgamento', role: 'mecanica', description: 'Converte efeitos removidos em Julgamento (até 2 stacks).' }] },
      { name: 'Sentença Final', desc: 'Habilidade ativa: custa 1 Fé — só com o inimigo abaixo de 40% de vida e 2+ Julgamentos — consome até 3 Julgamentos para um golpe de 1.75x +0.20x por stack consumida (até 2.35x). Recarga de 5 ciclos.',
        mechanicRefs: ['clerigo:faith', 'clerigo:judgment'],
        ability: {
          name: 'Sentença Final', desc: 'Custa 1 Fé. Consome até 3 Julgamentos para um golpe de 1.75x +0.20x por stack (até 2.35x).',
          cooldown: 5, condition: { type: 'all', conditions: [{ type: 'enemyHpBelow', pct: 0.40 }, { type: 'enemyStacksAtLeast', stackId: 'judgment', stacks: 2 }] },
          effect: { kind: 'bigHit', dmgMult: 1.75, dmgMultPerJudgmentStack: 0.20, judgmentConsumeMax: 3, faithCost: 1 },
        },
        scaling: [{ attribute: 'int', label: 'INT', role: 'principal', description: 'Aumenta o dano do golpe.' }, { label: 'Julgamento', role: 'mecanica', description: 'Consome até 3 stacks para dano extra; se errar, os stacks não são consumidos.' }, { label: 'Fé', role: 'mecanica', description: 'Custa 1 Fé, gasta mesmo se o golpe errar.' }] },
      { name: 'Sabedoria do Julgamento', desc: '+2,5% de defesa mágica. Quando uma habilidade consumir 3 ou mais Julgamentos de uma vez, recupera 2% da Vida Base, ampliado por Poder de Suporte.', effect: { mdefPct: 0.025 },
        mechanicRefs: ['clerigo:judgment'],
        scaling: [{ attribute: 'wis', label: 'SAB', role: 'principal', description: 'Aumenta a cura ao consumir 3+ Julgamentos de uma vez.' }, { label: 'Julgamento', role: 'mecanica', description: 'Só ativa ao consumir 3 ou mais stacks na mesma ação.' }] },
      { name: 'Ira Consumidora', desc: 'Habilidade ativa: custa 1 Fé — só com 3+ Julgamentos — golpe de 1.55x +0.16x por Julgamento ATUAL (até 2.35x com 5), sem consumir stacks, mas reduz sua duração restante em 2 ciclos (mínimo 1). Recarga de 6 ciclos.',
        mechanicRefs: ['clerigo:faith', 'clerigo:judgment'],
        ability: {
          name: 'Ira Consumidora', desc: 'Custa 1 Fé. Golpe de 1.55x +0.16x por Julgamento atual (sem consumir), reduzindo sua duração em 2 ciclos.',
          cooldown: 6, condition: { type: 'all', conditions: [{ type: 'enemyStacksAtLeast', stackId: 'judgment', stacks: 3 }, { type: 'resourceAtLeast', resource: 'faith', value: 1 }] },
          effect: { kind: 'bigHit', dmgMult: 1.55, dmgMultPerJudgmentStack: 0.16, judgmentReadOnly: true, judgmentDurationCutOnHit: 2, faithCost: 1 },
        },
        scaling: [{ attribute: 'int', label: 'INT', role: 'principal', description: 'Aumenta o dano do golpe.' }, { label: 'Julgamento', role: 'mecanica', description: 'Aproveita os stacks atuais sem consumi-los, mas corta sua duração.' }, { label: 'Fé', role: 'mecanica', description: 'Custa 1 Fé.' }] },
      { name: 'Apocalipse Sagrado', desc: 'Habilidade ativa: custa 3 Fé — exige pelo menos 5 Julgamentos — golpe de 2,85x de MATK que consome exatamente 5 ao acertar. Se errar, não consome Julgamentos. Recarga de 9 ciclos.',
        mechanicRefs: ['clerigo:faith', 'clerigo:judgment'],
        ability: {
          name: 'Apocalipse Sagrado', desc: 'Custa 3 Fé. Golpe de 2,85x de MATK com 5 ou mais Julgamentos; consome exatamente 5 ao acertar.',
          cooldown: 9, condition: { type: 'all', conditions: [{ type: 'enemyStacksAtLeast', stackId: 'judgment', stacks: 5 }, { type: 'resourceAtLeast', resource: 'faith', value: 3 }] },
          effect: { kind: 'bigHit', dmgMult: 2.85, judgmentConsumeMax: 5, faithCost: 3 },
        },
        scaling: [{ attribute: 'int', label: 'INT', role: 'principal', description: 'Aumenta o dano do golpe.' }, { label: 'Julgamento', role: 'mecanica', description: 'Exige e consome os 5 stacks; se errar, os stacks permanecem.' }, { label: 'Fé', role: 'mecanica', description: 'Custa 3 Fé.' }, { attribute: 'luk', label: 'SOR', role: 'secundario', description: 'Aumenta a chance de crítico normal.' }] },
      { name: 'Juízo Final', desc: 'Quando uma habilidade consumir exatamente 5 Julgamentos, ganha +1 Fé e +10% de MATK por 2 ciclos (não pode ser renovado enquanto ativo).', effect: {},
        mechanicRefs: ['clerigo:judgment', 'clerigo:faith'],
        scaling: [{ attribute: 'int', label: 'INT', role: 'principal', description: 'O buff aumenta seu MATK.' }, { label: 'Julgamento', role: 'mecanica', description: 'Só ativa ao consumir exatamente 5 stacks de uma vez.' }, { label: 'Fé', role: 'mecanica', description: 'Gera +1 Fé junto com o buff.' }] },
    ]),
  ],
  cavaleiro: [
    buildPath('cavaleiro', 'bastiao', 'Bastião', '#7a8a9a', [
      { name: 'Armadura de Aço', desc: '+2% de defesa. Contra um golpe físico direto que, mesmo após a mitigação, ainda causaria 15%+ da sua vida máxima, reduz esse dano ainda mais (por VIT).', effect: { defPct: 0.02 },
        mechanicRefs: ['cavaleiro:determination'],
        scaling: [{ attribute: 'vit', label: 'VIT', role: 'principal', description: 'Aumenta a defesa e a redução extra contra golpes muito pesados (até +4%).' }, { label: 'DEF', role: 'mecanica', description: 'Não afeta dano contínuo (DOT).' }] },
      { name: 'Pulso Vital', desc: '+10 de vida máxima. Barreiras criadas por você ficam até 4% mais eficientes (multiplicativo), por VIT.', effect: { maxHpFlat: 10 },
        scaling: [{ attribute: 'vit', label: 'VIT', role: 'principal', description: 'Aumenta a vida máxima e a eficiência das suas próprias barreiras (até +4%, multiplicativo).' }] },
      { name: 'Guarda Elevada', desc: '+2 pontos percentuais de chance de bloqueio. Bloqueios agora geram 12 de Determinação em vez de 10.', effect: { blockChance: 0.02 },
        mechanicRefs: ['cavaleiro:determination'],
        scaling: [{ label: 'Bloqueio', role: 'fixo', description: 'Não escala com VIT — proposital.' }, { label: 'Determinação', role: 'mecanica', description: 'Cada bloqueio bem-sucedido passa a gerar mais Determinação.' }] },
      { name: 'Peso da Armadura', desc: '+2.5% de defesa. Contra um "Golpe Pesado" (dano que representaria 18%+ da sua vida máxima antes de bloqueio/barreira), a eficiência da sua DEF aumenta (por VIT).', effect: { defPct: 0.025 },
        scaling: [{ attribute: 'vit', label: 'VIT', role: 'principal', description: 'Aumenta a defesa e, contra Golpes Pesados, a eficiência da DEF usada na mitigação (até +6%).' }] },
      { name: 'Muralha de Ferro', desc: 'Habilidade ativa: postura por 4 ciclos com -20% de dano direto recebido (até -23% por VIT) e crítico 0%. Cada 2% da sua vida máxima que ela impedir de uma ação inimiga gera Determinação (até +8). Recarga de 7 ciclos.',
        mechanicRefs: ['cavaleiro:determination'],
        ability: {
          name: 'Muralha de Ferro', desc: 'Postura por 4 ciclos: -20% de dano recebido (até -23%), mas crítico 0%. Gera Determinação pelo dano impedido.',
          cooldown: 7, condition: { type: 'always' },
          effect: { kind: 'ironWall', postureRounds: 4, dmgReductionPctBase: 0.20, dmgReductionPctPerVit: 0.001, dmgReductionPctCap: 0.03 },
        },
        scaling: [{ attribute: 'vit', label: 'VIT', role: 'principal', description: 'Aumenta a redução de dano (até +3pp).' }, { label: 'Determinação', role: 'mecanica', description: 'Gera Determinação proporcional ao dano impedido, até um teto por ação inimiga.' }] },
      { name: 'Escudo Disciplinado', desc: '+2.5 pontos percentuais de chance de bloqueio. Após bloquear, o próximo golpe direto recebido em até 2 ciclos causa -8% de dano (não acumula).', effect: { blockChance: 0.025 },
        scaling: [{ label: 'Bloqueio', role: 'mecanica', description: 'Bloquear abre uma pequena janela de redução extra no próximo golpe.' }] },
      { name: 'Reação Defensiva', desc: 'Desbloqueia Retaliação: a cada 3 bloqueios bem-sucedidos, ganha 1 carga (máximo 2). Sua próxima ação ofensiva direta consome uma carga e causa dano físico bônus baseado na sua DEF (limitado pelo seu ATK).', effect: {},
        mechanicRefs: ['cavaleiro:retaliation'],
        scaling: [{ attribute: 'vit', label: 'VIT', role: 'principal', description: 'Aumenta a DEF, base do dano de Retaliação.' }, { attribute: 'str', label: 'FOR', role: 'secundario', description: 'Aumenta o ATK, que limita o dano máximo de Retaliação.' }, { label: 'Bloqueio', role: 'mecanica', description: '3 bloqueios geram 1 carga.' }] },
      { name: 'Corpo Blindado', desc: '+2.5% de defesa mágica. Parte da sua DEF passa a contribuir para a MDEF (8% da DEF atual, limitado a 20% da MDEF antes da conversão).', effect: { mdefPct: 0.025 },
        scaling: [{ attribute: 'vit', label: 'VIT', role: 'secundario', description: 'Aumenta a DEF, que por sua vez converte parte do valor em MDEF (com teto).' }, { label: 'MDEF', role: 'mecanica', description: 'A conversão nunca ultrapassa 20% da MDEF pré-conversão.' }] },
      { name: 'Juramento de Resistência', desc: 'A cada 3 efeitos negativos realmente aplicados a você (DOT, debuff, silêncio, atordoamento, sono), o PRÓXIMO tem sua duração reduzida em 1 ciclo. O contador reinicia.', effect: {},
        scaling: [{ attribute: 'vit', label: 'VIT', role: 'secundario', description: 'Sinergia com Tenacidade.' }, { label: 'Resistência', role: 'mecanica', description: 'Um efeito totalmente resistido não conta para o contador.' }] },
      { name: 'Escudo Colossal', desc: 'Habilidade ativa: custa 25 Determinação — cria uma barreira de 10% da vida máxima efetiva (até 14% por VIT) por 4 ciclos. Nega o primeiro atordoamento ou sono recebido enquanto durar (consumindo 25% da barreira restante). Se a barreira for destruída por dano e você tiver Reação Defensiva, ganha +1 carga de Retaliação. Recarga de 8 ciclos.',
        mechanicRefs: ['cavaleiro:determination', 'cavaleiro:retaliation'],
        ability: {
          name: 'Escudo Colossal', desc: 'Custa 25 Determinação. Barreira de 10% da vida máxima efetiva (até 14%) por 4 ciclos; nega o primeiro atordoamento/sono.',
          cooldown: 8, condition: { type: 'resourceAtLeast', resource: 'determination', value: 25 },
          effect: { kind: 'colossalShield', determinationCost: 25, shieldPctBase: 0.10, shieldPctPerVit: 0.001, shieldPctCap: 0.04, shieldRounds: 4 },
        },
        scaling: [{ attribute: 'vit', label: 'VIT', role: 'principal', description: 'Aumenta o tamanho da barreira (até +4pp).' }, { label: 'Determinação', role: 'mecanica', description: 'Custa 25 Determinação.' }, { label: 'Retaliação', role: 'mecanica', description: 'Se a barreira for destruída por dano, pode gerar uma carga.' }] },
      { name: 'Última Guarda', desc: 'Habilidade ativa: só com vida abaixo de 25% — por 2 ciclos, sua vida não pode cair abaixo de 1 (não cura). Ao terminar, se você sobreviveu, recebe uma pequena barreira (4%-6% da vida máxima, por VIT) por 2 ciclos. Uma vez por inimigo.',
        mechanicRefs: ['cavaleiro:determination'],
        ability: {
          name: 'Última Guarda', desc: 'Sua vida não pode cair abaixo de 1 por 2 ciclos; ao terminar, recebe uma pequena barreira. Uma vez por inimigo.',
          cooldown: 20, condition: { type: 'hpBelow', pct: 0.25 },
          effect: { kind: 'lastGuard', lastGuardRounds: 2, shieldPctBase: 0.04, shieldPctPerVit: 0.0005, shieldPctCap: 0.02, shieldRounds: 2 },
        },
        scaling: [{ attribute: 'vit', label: 'VIT', role: 'principal', description: 'Aumenta a barreira recebida ao final do efeito (até +2pp).' }] },
      { name: 'Núcleo de Aço', desc: '+10 de vida máxima. +2% de defesa. Enquanto sua vida estiver abaixo de 35%, redução adicional de dano direto (por VIT, não afeta DOT).', effect: { maxHpFlat: 10, defPct: 0.02 },
        scaling: [{ attribute: 'vit', label: 'VIT', role: 'principal', description: 'Aumenta vida/defesa e, com vida baixa (<35%), a redução extra de dano direto (até +5%).' }] },
      { name: 'Contra-Ataque Absoluto', desc: 'Habilidade ativa: custa 25 Determinação — por 2 ciclos, armazena 30% de todo dano direto que atingir sua vida (não conta bloqueado/absorvido/DOT), até um teto (8%-12% da vida máxima, por VIT). No próximo acerto ofensivo direto, libera esse dano como bônus físico (limitado pelo seu ATK). Substitui o bônus de uma carga de Retaliação, se houver. Recarga de 9 ciclos.',
        mechanicRefs: ['cavaleiro:determination', 'cavaleiro:retaliation'],
        ability: {
          name: 'Contra-Ataque Absoluto', desc: 'Custa 25 Determinação. Armazena 30% do dano direto sofrido por 2 ciclos e libera no próximo acerto.',
          cooldown: 9, condition: { type: 'resourceAtLeast', resource: 'determination', value: 25 },
          effect: { kind: 'counterStance', determinationCost: 25, postureRounds: 2, counterStoragePct: 0.30, counterCapPctBase: 0.08, counterCapPctPerVit: 0.001, counterCapPctCap: 0.04 },
        },
        scaling: [{ attribute: 'vit', label: 'VIT', role: 'principal', description: 'Aumenta o teto de dano armazenado (até +4pp).' }, { attribute: 'str', label: 'FOR', role: 'secundario', description: 'Aumenta o ATK, que limita o dano liberado.' }, { label: 'Determinação', role: 'mecanica', description: 'Custa 25 Determinação.' }] },
      { name: 'Fortaleza Viva', desc: 'Habilidade ativa: custa 50 Determinação — por 3 ciclos, -22% de dano direto recebido (até -25% por VIT), chance de bloqueio nunca abaixo de 45% (respeitando o teto de 60%) e -15% de velocidade de ação. Mutuamente exclusiva com Muralha de Ferro. Enquanto ativa, bloqueios e barreiras não geram Determinação. Recarga de 15 ciclos.',
        mechanicRefs: ['cavaleiro:determination'],
        ability: {
          name: 'Fortaleza Viva', desc: 'Custa 50 Determinação. -22% de dano recebido (até -25%), bloqueio mínimo 45%, -15% de velocidade, por 3 ciclos.',
          cooldown: 15, condition: { type: 'resourceAtLeast', resource: 'determination', value: 50 },
          effect: { kind: 'livingFortress', determinationCost: 50, postureRounds: 3, dmgReductionPctBase: 0.22, dmgReductionPctPerVit: 0.001, dmgReductionPctCap: 0.03, minBlockChancePct: 0.45 },
        },
        scaling: [{ attribute: 'vit', label: 'VIT', role: 'principal', description: 'Aumenta a redução de dano (até +3pp).' }, { label: 'Bloqueio', role: 'mecanica', description: 'Garante um piso de 45% de bloqueio enquanto ativa.' }, { label: 'Determinação', role: 'mecanica', description: 'Custa 50 Determinação; não gera mais Determinação enquanto ativa.' }] },
      { name: 'Bastião Inquebrável', desc: 'Uma vez por TENTATIVA de masmorra: ao receber dano fatal, sua vida fica em 1, você ganha uma barreira de 10% da vida máxima, +40 de Determinação e -25% de dano recebido por 2 ciclos. Não cura vida.', effect: {},
        mechanicRefs: ['cavaleiro:determination'],
        scaling: [{ attribute: 'vit', label: 'VIT', role: 'principal', description: 'Aumenta a vida máxima e o tamanho da barreira de emergência.' }, { label: 'Determinação', role: 'mecanica', description: 'Concede uma grande quantidade de Determinação ao ativar.' }] },
    ]),
    buildPath('cavaleiro', 'investida', 'Investida', '#a5432f', [
      { name: 'Força de Impacto', desc: '+2% de ATK físico. Contra um inimigo com 90%+ de vida, seu primeiro golpe direto causa dano adicional (por FOR).', effect: { dmgPct: 0.02 },
        scaling: [{ attribute: 'str', label: 'FOR', role: 'principal', description: 'Aumenta o ATK e, contra um inimigo quase intacto, o dano do primeiro golpe (até +3%).' }] },
      { name: 'Passo de Guerra', desc: '+1.5% de velocidade de ação. O primeiro golpe direto contra cada novo inimigo gera +25 de Momentum em vez de +15.', effect: {},
        mechanicRefs: ['cavaleiro:momentum'],
        scaling: [{ attribute: 'agi', label: 'AGI', role: 'secundario', description: 'Sinergia de velocidade de ação.' }, { label: 'Momentum', role: 'mecanica', description: 'Aumenta a geração do primeiro golpe contra um novo inimigo.' }] },
      { name: 'Sangue de Combate', desc: '+8 de vida máxima. O limite de dano de um golpe para remover Momentum sobe de 15% para até 18% da sua vida máxima (por VIT).', effect: { maxHpFlat: 8 },
        mechanicRefs: ['cavaleiro:momentum'],
        scaling: [{ attribute: 'vit', label: 'VIT', role: 'principal', description: 'Aumenta a vida máxima e o limiar que evita perder Momentum (até +3pp).' }] },
      { name: 'Cavalgada', desc: '+2.5% de ATK físico. Enquanto Momentum estiver em 60 ou mais, dano direto adicional (por FOR).', effect: { dmgPct: 0.025 },
        mechanicRefs: ['cavaleiro:momentum'],
        scaling: [{ attribute: 'str', label: 'FOR', role: 'principal', description: 'Aumenta o ATK e, com Momentum alto, o dano direto (até +3%).' }, { label: 'Momentum', role: 'mecanica', description: 'Só ativa com 60+ de Momentum.' }] },
      { name: 'Investida', desc: 'Habilidade ativa: golpe com 1.65x de ATK físico (2.00x contra um inimigo com 90%+ de vida). Ao acertar, gera +25 de Momentum além da geração normal (+35 contra um inimigo quase intacto). Recarga de 4 ciclos.',
        mechanicRefs: ['cavaleiro:momentum'],
        ability: {
          name: 'Investida', desc: 'Golpe de 1.65x de ATK (2.00x contra um inimigo quase intacto); gera Momentum extra ao acertar.',
          cooldown: 4, condition: { type: 'always' },
          effect: { kind: 'bigHit', dmgMult: 1.65, dmgMultVsHighEnemyHp: 2.00, momentumGainOnHitExtra: 25, momentumGainOnHitExtraVsHighHp: 35 },
        },
        scaling: [{ attribute: 'str', label: 'FOR', role: 'principal', description: 'Aumenta o dano do golpe.' }, { label: 'Momentum', role: 'mecanica', description: 'Gera Momentum extra além da geração normal do acerto.' }] },
      { name: 'Pressão Constante', desc: '+1.5% de precisão. Cada golpe direto consecutivo que acertar o MESMO inimigo dá +0.5% de dano direto (máximo 5 stacks). Errar ou trocar de inimigo zera.', effect: { accuracyPct: 0.015 },
        scaling: [{ attribute: 'dex', label: 'DES', role: 'principal', description: 'Aumenta a precisão, que ajuda a manter a sequência de acertos.' }, { label: 'Pressão', role: 'mecanica', description: 'Até +2.5% de dano com 5 stacks; zera ao errar ou trocar de alvo.' }] },
      { name: 'Momentum', desc: 'Melhora o benefício por 20 de Momentum: de +0.75%/+0.75% para +1.25% de dano direto e +1.00% de velocidade de ação (com 100: +6.25% dano, +5% velocidade).', effect: {},
        mechanicRefs: ['cavaleiro:momentum'],
        scaling: [{ label: 'Momentum', role: 'mecanica', description: 'Melhora o bônus passivo por faixa de Momentum acumulado.' }, { attribute: 'str', label: 'FOR', role: 'secundario', description: 'Aumenta o dano-base beneficiado pelo bônus.' }] },
      { name: 'Veterano de Guerra', desc: '+8 de vida máxima. Momentum máximo sobe de 100 para 120 (não preenche automaticamente).', effect: { maxHpFlat: 8 },
        mechanicRefs: ['cavaleiro:momentum'],
        scaling: [{ attribute: 'vit', label: 'VIT', role: 'principal', description: 'Aumenta a vida máxima.' }, { label: 'Momentum', role: 'mecanica', description: 'Aumenta o teto de Momentum, sem gerar o valor extra automaticamente.' }] },
      { name: 'Sede de Vitória', desc: 'Ao derrotar um inimigo, recupera 2.5% da vida máxima efetiva e carrega parte do seu Momentum atual (até 30) para o próximo inimigo.', effect: {},
        mechanicRefs: ['cavaleiro:momentum'],
        scaling: [{ attribute: 'vit', label: 'VIT', role: 'secundario', description: 'A cura é uma fração da vida máxima.' }, { label: 'Momentum', role: 'mecanica', description: 'Carrega até 30 de Momentum para o próximo inimigo.' }] },
      { name: 'Romper Formação', desc: 'Habilidade ativa: golpe com 1.70x de ATK físico que penetra 8% da defesa do inimigo, mais 0.08 ponto percentual por Momentum atual (até 18% no total). Não consome Momentum. Recarga de 5 ciclos.',
        mechanicRefs: ['cavaleiro:momentum'],
        ability: {
          name: 'Romper Formação', desc: 'Golpe de 1.70x de ATK com penetração de defesa escalando com o Momentum atual (até 18%).',
          cooldown: 5, condition: { type: 'always' },
          effect: { kind: 'bigHit', dmgMult: 1.70, defPenPctBase: 0.08, defPenPctPerMomentum: 0.0008, defPenPctCap: 0.18 },
        },
        scaling: [{ attribute: 'str', label: 'FOR', role: 'principal', description: 'Aumenta o dano do golpe.' }, { label: 'Momentum', role: 'mecanica', description: 'Aumenta a penetração de defesa deste golpe (até 18% no total).' }] },
      { name: 'Carga Implacável', desc: 'Habilidade ativa: só com 40+ de Momentum — consome TODO o Momentum (mesmo se errar) para um golpe de 1.45x +0.0105x por ponto consumido (até 2.85x). Consumir 100+ e acertar aplica Abalado: +8% de dano recebido por 2 ciclos. Recarga de 6 ciclos.',
        mechanicRefs: ['cavaleiro:momentum'],
        ability: {
          name: 'Carga Implacável', desc: 'Consome todo o Momentum para um golpe de 1.45x +0.0105x por ponto consumido (até 2.85x); 100+ consumido aplica Abalado.',
          cooldown: 6, condition: { type: 'resourceAtLeast', resource: 'momentum', value: 40 },
          effect: { kind: 'bigHit', dmgMult: 1.45, momentumConsumeAll: true, dmgMultPerMomentumConsumed: 0.0105, abaladoThreshold: 100, abaladoDmgTakenPct: 0.08, abaladoRounds: 2 },
        },
        scaling: [{ attribute: 'str', label: 'FOR', role: 'principal', description: 'Aumenta o dano-base do golpe.' }, { label: 'Momentum', role: 'mecanica', description: 'Todo o Momentum é consumido, mesmo se o golpe errar; quanto mais consumido, maior o dano (até 2.85x).' }] },
      { name: 'Instinto de Sobrevivência', desc: '+10 de vida máxima. A perda de Momentum por um Golpe Pesado (normalmente 15) é reduzida por VIT (mínimo de 8).', effect: { maxHpFlat: 10 },
        mechanicRefs: ['cavaleiro:momentum'],
        scaling: [{ attribute: 'vit', label: 'VIT', role: 'principal', description: 'Reduz quanto Momentum você perde ao sofrer um golpe pesado (até -7, mínimo de 8 perdidos).' }] },
      { name: 'Golpe de Ruptura', desc: 'Habilidade ativa: só com 30+ de Momentum (não consome) — golpe com 1.80x de ATK físico que reduz a DEF do inimigo em 10%, mais 0.06 ponto percentual por Momentum atual (até -18%), por 3 ciclos. Recarga de 7 ciclos.',
        mechanicRefs: ['cavaleiro:momentum'],
        ability: {
          name: 'Golpe de Ruptura', desc: 'Golpe de 1.80x de ATK que reduz a DEF do inimigo com base no Momentum atual (até -18%) por 3 ciclos.',
          cooldown: 7, condition: { type: 'resourceAtLeast', resource: 'momentum', value: 30 },
          effect: { kind: 'bigHit', dmgMult: 1.80, enemyDefReductionPctBase: 0.10, enemyDefReductionPctPerMomentum: 0.0006, enemyDefReductionPctCap: 0.18, enemyDefReductionRounds: 3 },
        },
        scaling: [{ attribute: 'str', label: 'FOR', role: 'principal', description: 'Aumenta o dano do golpe.' }, { label: 'Momentum', role: 'mecanica', description: 'Quanto mais Momentum atual, maior a redução de DEF aplicada (até -18%).' }] },
      { name: 'Última Carga', desc: 'Habilidade ativa: só com vida abaixo de 30% e 40+ de Momentum — consome TODO o Momentum (mesmo se errar) para um golpe de 1.80x +0.012x por ponto consumido (até 3.45x). Depois do cast, sempre recebe -15% de DEF e -10% de velocidade por 3 ciclos. Recarga de 10 ciclos.',
        mechanicRefs: ['cavaleiro:momentum'],
        ability: {
          name: 'Última Carga', desc: 'Consome todo o Momentum para um golpe de 1.80x +0.012x por ponto (até 3.45x); sempre recebe uma penalidade temporária depois.',
          cooldown: 10, condition: { type: 'all', conditions: [{ type: 'hpBelow', pct: 0.30 }, { type: 'resourceAtLeast', resource: 'momentum', value: 40 }] },
          effect: { kind: 'bigHit', dmgMult: 1.80, momentumConsumeAll: true, dmgMultPerMomentumConsumed: 0.012, selfDebuffOnCastAlways: true, selfDebuffDefPct: -0.15, selfDebuffSpeedPct: -0.10, selfDebuffRounds: 3 },
        },
        scaling: [{ attribute: 'str', label: 'FOR', role: 'principal', description: 'Aumenta o dano-base do golpe.' }, { label: 'Momentum', role: 'mecanica', description: 'Todo o Momentum consumido aumenta o dano (até 3.45x).' }, { attribute: 'vit', label: 'VIT', role: 'secundario', description: 'Ajuda a sobreviver à penalidade temporária que segue o golpe.' }] },
      { name: 'Cavaleiro Imparável', desc: 'A cada 4 golpes diretos consecutivos que acertarem o mesmo inimigo, seu Momentum máximo atual aumenta em 10 (até +30 por inimigo). Enquanto Momentum estiver em 90%+ do máximo atual: +5% de dano direto e +10 pontos percentuais de Tenacidade.', effect: {},
        mechanicRefs: ['cavaleiro:momentum'],
        scaling: [{ label: 'Momentum', role: 'mecanica', description: 'Aumenta o teto de Momentum daquele combate e concede bônus perto do máximo atual.' }, { attribute: 'str', label: 'FOR', role: 'secundario', description: 'Contribui para o dano beneficiado.' }] },
    ]),
    buildPath('cavaleiro', 'comando', 'Comando', '#e0c060', [
      { name: 'Voz de Comando', desc: '+1.5% de precisão. A eficiência das suas Ordens sobre Poder de Suporte sobe de 50% para 60% (teto continua 30%).', effect: { accuracyPct: 0.015 },
        scaling: [{ attribute: 'wis', label: 'SAB', role: 'principal', description: 'Aumenta o Poder de Suporte usado pelas Ordens.' }, { attribute: 'dex', label: 'DES', role: 'secundario', description: 'Aumenta a precisão.' }] },
      { name: 'Presença de Líder', desc: '+8 de vida máxima. Se VIT total for 20 ou mais, buffs temporários de Comando aplicados a você duram +1 ciclo (não afeta recarga).', effect: { maxHpFlat: 8 },
        mechanicRefs: ['cavaleiro:orders'],
        scaling: [{ attribute: 'vit', label: 'VIT', role: 'principal', description: 'Aumenta a vida máxima e, a partir de 20 de VIT, a duração dos buffs de Comando.' }] },
      { name: 'Disciplina Militar', desc: '+2% de defesa. Tenacidade adicional por VIT total.', effect: { defPct: 0.02 },
        scaling: [{ attribute: 'vit', label: 'VIT', role: 'principal', description: 'Aumenta a defesa e a Tenacidade (até +3%, respeitando o teto global).' }] },
      { name: 'Estratégia', desc: 'Redução de recarga SOMENTE para habilidades de Comando, por SAB total (até 7%). Não afeta Bastião, Investida ou outras classes.', effect: {},
        scaling: [{ attribute: 'wis', label: 'SAB', role: 'principal', description: 'Reduz a recarga apenas das habilidades de Comando.' }] },
      { name: 'Ordem: Ataque', desc: 'Habilidade ativa: golpe com 1.25x de ATK físico. Ao acertar, +10% de ATK por 3 ciclos (escalado por Poder de Suporte). Gera +1 Ordem mesmo se errar. Recarga de 5 ciclos.',
        mechanicRefs: ['cavaleiro:orders'],
        ability: {
          name: 'Ordem: Ataque', desc: 'Golpe de 1.25x de ATK; ao acertar, +10% de ATK por 3 ciclos. Gera +1 Ordem mesmo se errar.',
          cooldown: 5, condition: { type: 'always' },
          effect: { kind: 'bigHit', dmgMult: 1.25, orderGainOnCast: 1, selfBuffAtkPctOnHit: 0.10, selfBuffRoundsOnHit: 3 },
        },
        scaling: [{ attribute: 'str', label: 'FOR', role: 'principal', description: 'Aumenta o dano do golpe.' }, { attribute: 'wis', label: 'SAB', role: 'principal', description: 'Aumenta o buff de ATK gerado.' }, { label: 'Ordens', role: 'mecanica', description: 'Gera +1 Ordem, mesmo se o golpe errar.' }] },
      { name: 'Formação', desc: '+2.5% de defesa. Enquanto pelo menos um buff de Comando estiver ativo, DEF adicional por VIT total (não aumenta com múltiplos buffs).', effect: { defPct: 0.025 },
        mechanicRefs: ['cavaleiro:orders'],
        scaling: [{ attribute: 'vit', label: 'VIT', role: 'principal', description: 'Aumenta a defesa base e, com um buff de Comando ativo, uma defesa adicional (até +4%).' }] },
      { name: 'Liderança', desc: 'Quando um buff temporário de uma habilidade de Comando que consumiu Ordem termina naturalmente, +1 Ordem (uma vez por habilidade). Ao derrotar um inimigo com pelo menos 1 Ordem, o próximo pode começar com 1.', effect: {},
        mechanicRefs: ['cavaleiro:orders'],
        scaling: [{ label: 'Ordens', role: 'mecanica', description: 'Recupera Ordens gastas quando o efeito termina, e carrega 1 para o próximo inimigo.' }] },
      { name: 'Estratégia de Campo', desc: '+2% de defesa mágica. Se SAB total for 18 ou mais, habilidades de Comando que consomem Ordem e possuem buff temporário duram +1 ciclo (não afeta Ordem: Executar; teto combinado com Presença de Líder de +2 ciclos).', effect: { mdefPct: 0.02 },
        mechanicRefs: ['cavaleiro:orders'],
        scaling: [{ attribute: 'wis', label: 'SAB', role: 'principal', description: 'Aumenta a defesa mágica e, a partir de 18 de SAB, a duração de buffs de habilidades que custam Ordem.' }] },
      { name: 'Disciplina Inabalável', desc: 'Cada efeito negativo realmente aplicado a você soma um contador; ao chegar a 2, gera +1 Ordem e reinicia (no máximo uma vez por ciclo). Efeitos resistidos não contam.', effect: {},
        mechanicRefs: ['cavaleiro:orders'],
        scaling: [{ attribute: 'vit', label: 'VIT', role: 'secundario', description: 'Resistência indireta via Tenacidade.' }, { label: 'Ordens', role: 'mecanica', description: 'Transforma pressão inimiga em Ordens.' }] },
      { name: 'Ordem: Avançar', desc: 'Habilidade ativa: custa 1 Ordem — golpe com 1.45x de ATK físico. Ao acertar, +8% de velocidade de ação e +5% de dano direto por 3 ciclos (escalados por Poder de Suporte). Recarga de 6 ciclos.',
        mechanicRefs: ['cavaleiro:orders'],
        ability: {
          name: 'Ordem: Avançar', desc: 'Custa 1 Ordem. Golpe de 1.45x de ATK; ao acertar, +8% de velocidade e +5% de dano por 3 ciclos.',
          cooldown: 6, condition: { type: 'resourceAtLeast', resource: 'orders', value: 1 },
          effect: { kind: 'bigHit', dmgMult: 1.45, orderCost: 1, selfBuffSpeedPctOnHit: 0.08, selfBuffAtkPctOnHit: 0.05, selfBuffRoundsOnHit: 3 },
        },
        scaling: [{ attribute: 'str', label: 'FOR', role: 'principal', description: 'Aumenta o dano do golpe.' }, { attribute: 'wis', label: 'SAB', role: 'principal', description: 'Aumenta os buffs gerados.' }, { label: 'Ordens', role: 'mecanica', description: 'Custa 1 Ordem, gasta mesmo se o golpe errar.' }] },
      { name: 'Ordem: Resistir', d…30230 tokens truncated…ico.', effect: { flatBonusMagicDmg: 2 } },
      { name: 'Talento Natural', desc: '-2% de recarga das habilidades.', effect: { cooldownReductionPct: 0.02 } },
      { name: 'Fluxo Mágico', desc: '+2 de dano mágico.', effect: { flatBonusMagicDmg: 2 } },
      { name: 'Ritmo Acelerado', desc: '-2.5% de recarga das habilidades.', effect: { cooldownReductionPct: 0.025 } },
      { name: 'Praga Necrótica', desc: 'Habilidade ativa: envenena o inimigo, causando dano contínuo por 6s. Recarga de 6s.',
        ability: { name: 'Praga Necrótica', desc: 'Envenena o inimigo, causando dano contínuo por 6s.', cooldown: 4, condition: { type: 'always' }, effect: { kind: 'applyStatus', status: 'poison', statusRounds: 4, statusDmgPct: 0.4 } } },
      { name: 'Essência Concentrada', desc: '+3 de dano mágico.', effect: { flatBonusMagicDmg: 3 } },
      { name: 'Dreno Necrótico', desc: 'Cura 6% do dano causado.', effect: { lifestealPct: 0.06 } },
      { name: 'Fluxo Constante', desc: '-3% de recarga das habilidades.', effect: { cooldownReductionPct: 0.03 } },
      { name: 'Amplificação da Praga', desc: 'Dano contra inimigo envenenado aumenta em 15%.', effect: { dmgPctVsStatus: { status: 'poison', pct: 0.15 } } },
      { name: 'Toque Corrosivo', desc: 'Habilidade ativa: golpe com 1.9x de dano que corrói a armadura do inimigo, reduzindo sua defesa por 5s. Recarga de 6s.',
        ability: { name: 'Toque Corrosivo', desc: 'Golpe com 1.9x de dano que reduz a defesa do inimigo por 5s.', cooldown: 4, condition: { type: 'always' }, effect: { kind: 'statMod', dmgMult: 1.9, statMod: 'def', statModPct: -0.25, statModRounds: 3, statModTarget: 'enemy' } } },
      { name: 'Praga Devastadora', desc: 'Habilidade ativa: envenena o inimigo com mais força por 8s. Recarga de 6s.',
        ability: { name: 'Praga Devastadora', desc: 'Envenena o inimigo com mais força por 8s.', cooldown: 4, condition: { type: 'always' }, effect: { kind: 'applyStatus', status: 'poison', statusRounds: 5, statusDmgPct: 0.5 } } },
      { name: 'Poder Arcano', desc: '+5 de dano mágico.', effect: { flatBonusMagicDmg: 5 } },
      { name: 'Colheita das Almas', desc: 'Habilidade ativa: só pode ser usada com o inimigo envenenado — causa 2.4x de dano. Recarga de 5s.',
        ability: { name: 'Colheita das Almas', desc: 'Dano extra em inimigos envenenados.', cooldown: 3, condition: { type: 'enemyHasStatus', status: 'poison' }, effect: { kind: 'bonusVsStatus', dmgMult: 2.4 } } },
      { name: 'Apocalipse Necrótico', desc: 'Habilidade ativa: só pode ser usada com o inimigo envenenado — causa 3.2x de dano. Recarga de 8s.',
        ability: { name: 'Apocalipse Necrótico', desc: 'Dano massivo em inimigos envenenados.', cooldown: 5, condition: { type: 'enemyHasStatus', status: 'poison' }, effect: { kind: 'bonusVsStatus', dmgMult: 3.2 } } },
      { name: 'Sede dos Mortos', desc: 'Cura 6% da vida máxima sempre que você acerta um crítico.', effect: { onCritHealPct: 0.06 } },
    ]),
    buildPath('necromante', 'drenar-vida', 'Drenar Vida', '#4a2a5a', [
      { name: 'Resistência Íntima', desc: '+6 de vida máxima.', effect: { maxHpFlat: 6 } },
      { name: 'Olhar Predador', desc: '+1% de chance de crítico.', effect: { critPct: 0.01 } },
      { name: 'Fôlego Extra', desc: '+6 de vida máxima.', effect: { maxHpFlat: 6 } },
      { name: 'Golpe Calculado', desc: '+1.2% de chance de crítico.', effect: { critPct: 0.012 } },
      { name: 'Escudo de Ossos', desc: 'Habilidade ativa: +28% de defesa por 5s. Recarga de 8s.',
        ability: { name: 'Escudo de Ossos', desc: '+28% de defesa por 5s.', cooldown: 5, condition: { type: 'always' }, effect: { kind: 'buffDef', buffPct: 0.28, buffRounds: 3 } } },
      { name: 'Constituição Firme', desc: '+8 de vida máxima.', effect: { maxHpFlat: 8 } },
      { name: 'Armadura de Ossos', desc: '10% de chance de bloquear metade do dano recebido.', effect: { blockChance: 0.10 } },
      { name: 'Instinto Mortal', desc: '+1.5% de chance de crítico.', effect: { critPct: 0.015 } },
      { name: 'Retribuição dos Mortos', desc: 'Reflete 12% de todo dano recebido de volta no inimigo.', effect: { thornsPct: 0.12 } },
      { name: 'Sangue Pelo Sangue', desc: 'Habilidade ativa: só pode ser usada com sua vida abaixo de 40% — +18% de roubo de vida por 5s. Recarga de 24s.',
        ability: { name: 'Sangue Pelo Sangue', desc: '+18% de roubo de vida por 5s quando sua vida está abaixo de 40%.', cooldown: 15, condition: { type: 'hpBelow', pct: 0.4 }, effect: { kind: 'lifestealBuff', buffPct: 0.18, buffRounds: 3 } } },
      { name: 'Véu da Morte', desc: 'Habilidade ativa: +25% de chance de bloqueio por 5s. Recarga de 8s.',
        ability: { name: 'Véu da Morte', desc: '+25% de chance de bloqueio por 5s.', cooldown: 5, condition: { type: 'always' }, effect: { kind: 'buffBlock', buffPct: 0.25, buffRounds: 3 } } },
      { name: 'Vigor Interior', desc: '+14 de vida máxima.', effect: { maxHpFlat: 14 } },
      { name: 'Fortaleza de Ossos', desc: 'Habilidade ativa: +45% de defesa por 6s. Recarga de 11s.',
        ability: { name: 'Fortaleza de Ossos', desc: '+45% de defesa por 6s.', cooldown: 7, condition: { type: 'always' }, effect: { kind: 'buffDef', buffPct: 0.45, buffRounds: 4 } } },
      { name: 'Voracidade Mortal', desc: 'Habilidade ativa: só pode ser usada com sua vida abaixo de 50% — +25% de roubo de vida por 6s. Recarga de 35s.',
        ability: { name: 'Voracidade Mortal', desc: '+25% de roubo de vida por 6s quando sua vida está abaixo de 50%.', cooldown: 22, condition: { type: 'hpBelow', pct: 0.5 }, effect: { kind: 'lifestealBuff', buffPct: 0.25, buffRounds: 4 } } },
      { name: 'Vínculo Eterno com a Morte', desc: '+18 de vida máxima.', effect: { maxHpFlat: 18 } },
    ]),
    buildPath('necromante', 'ceifador', 'Ceifador', '#c89a2e', [
      { name: 'Reflexo Assassino', desc: '+1% de chance de crítico.', effect: { critPct: 0.01 } },
      { name: 'Fluxo Mágico', desc: '+2 de dano mágico.', effect: { flatBonusMagicDmg: 2 } },
      { name: 'Olhar Predador', desc: '+1% de chance de crítico.', effect: { critPct: 0.01 } },
      { name: 'Essência Concentrada', desc: '+3 de dano mágico.', effect: { flatBonusMagicDmg: 3 } },
      { name: 'Golpe da Foice', desc: 'Habilidade ativa: garante um acerto crítico. Recarga de 6s.',
        ability: { name: 'Golpe da Foice', desc: 'Garante um acerto crítico.', cooldown: 4, condition: { type: 'always' }, effect: { kind: 'guaranteedCrit' } } },
      { name: 'Golpe Calculado', desc: '+1.2% de chance de crítico.', effect: { critPct: 0.012 } },
      { name: 'Ceifa Ampliada', desc: '+16% de dano crítico.', effect: { critDmgPct: 0.16 } },
      { name: 'Poder Arcano', desc: '+4 de dano mágico.', effect: { flatBonusMagicDmg: 4 } },
      { name: 'Colheita de Vida', desc: 'Cura 6% da vida máxima sempre que você acerta um crítico.', effect: { onCritHealPct: 0.06 } },
      { name: 'Golpe do Terror', desc: 'Habilidade ativa: golpe com 1.8x de dano que aterroriza o inimigo, atordoando-o por 2s. Recarga de 6s.',
        ability: { name: 'Golpe do Terror', desc: 'Golpe com 1.8x de dano que atordoa o inimigo por 2s.', cooldown: 4, condition: { type: 'always' }, effect: { kind: 'crowdControl', dmgMult: 1.8, cc: 'stun', ccRounds: 1 } } },
      { name: 'Toque Final', desc: 'Habilidade ativa: só pode ser usada com o inimigo abaixo de 30% de vida — 2.5x de dano. Recarga de 6s.',
        ability: { name: 'Toque Final', desc: '2.5x de dano contra inimigos abaixo de 30% de vida.', cooldown: 4, condition: { type: 'enemyHpBelow', pct: 0.3 }, effect: { kind: 'bigHit', dmgMult: 2.5 } } },
      { name: 'Instinto Mortal', desc: '+1.8% de chance de crítico.', effect: { critPct: 0.018 } },
      { name: 'Dança da Ceifa', desc: 'Habilidade ativa: golpe garantidamente crítico com 1.6x de dano adicional. Recarga de 8s.',
        ability: { name: 'Dança da Ceifa', desc: 'Golpe garantidamente crítico com 1.6x de dano adicional.', cooldown: 5, condition: { type: 'always' }, effect: { kind: 'guaranteedCrit', dmgMult: 1.6 } } },
      { name: 'Ceifa da Morte', desc: 'Habilidade ativa: só pode ser usada com o inimigo abaixo de 25% de vida — 3.4x de dano. Recarga de 10s.',
        ability: { name: 'Ceifa da Morte', desc: '3.4x de dano contra inimigos abaixo de 25% de vida.', cooldown: 6, condition: { type: 'enemyHpBelow', pct: 0.25 }, effect: { kind: 'bigHit', dmgMult: 3.4 } } },
      { name: 'Instinto do Ceifador', desc: '+7% de chance de crítico.', effect: { critPct: 0.07 } },
    ]),
  ],
};

// Redesign definitivo do Necromante. Mantém todos os IDs/índices da sheet;
// os campos mecânicos são declarativos e resolvidos pelo motor de combate.
const necroInt = (detail: string): ScalingEntry[] => [{ attribute: 'int', label: 'INT', role: 'principal', description: 'Aumenta o MATK usado pela técnica; INT não é somada novamente.' }, { label: 'Mecânica', role: 'mecanica', description: detail }];
const necroWis = (detail: string): ScalingEntry[] => [{ attribute: 'wis', label: 'SAB', role: 'secundario', description: detail }];
const necroLuck = (detail: string): ScalingEntry[] => [{ attribute: 'luk', label: 'SOR', role: 'secundario', description: detail }];

SKILL_TREES.necromante = [
  buildPath('necromante', 'decomposicao', 'Decomposição', '#3a3a4a', [
    { name: 'Ímpeto Necrótico', desc: '+2% de MATK. Habilidades diretas que aplicam Decomposição recebem até +3% de dano final conforme INT.', effect: { magicDmgPct: 0.02 }, mechanicRefs: ['necromante:decomposition'], scaling: necroInt('+0,075 ponto percentual por INT, máximo +3%.') },
    { name: 'Conhecimento Funerário', desc: '+2% de MDEF. Com 20 SAB, a Praga dura +1 ciclo.', effect: { mdefPct: 0.02 }, mechanicRefs: ['necromante:plague'], scaling: necroWis('Com 20 SAB, duração da Praga +1, máximo +1.') },
    { name: 'Carne Fria', desc: '+8 de Vida Máxima. Contra presa com Praga, recebe até 3% menos dano direto conforme SAB.', effect: { maxHpFlat: 8 }, mechanicRefs: ['necromante:plague'], scaling: necroWis('-0,10 ponto percentual por SAB, máximo -3%.') },
    { name: 'Corrosão Profunda', desc: '+2,5% de MATK. Contra 3+ Decomposições, dano mágico direto recebe até +3% conforme INT.', effect: { magicDmgPct: 0.025 }, mechanicRefs: ['necromante:decomposition'], scaling: necroInt('+0,075 ponto percentual por INT, máximo +3%; não aumenta a Praga.') },
    { name: 'Praga Necrótica', desc: 'Cause 1,10x MATK, aplique 2 Decomposições e uma Praga de 0,16x MATK por 4 ciclos. Recarga: 4 ciclos.', ability: { name: 'Praga Necrótica', desc: '1,10x MATK, +2 Decomposições e Praga Necrótica.', cooldown: 4, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 1.10, dmgType: 'magical', decompositionOnHit: 2, plagueApply: true, plagueMultiplier: 0.16, plagueDuration: 4, necromancerTag: 'decomposition' } }, mechanicRefs: ['necromante:decomposition', 'necromante:plague'], scaling: necroInt('A Praga guarda o MATK atual e Decomposição fortalece cada tick.') },
    { name: 'Ritmo da Ruína', desc: '-3% de recarga das técnicas de Decomposição; -5% com Praga ativa e 18 SAB.', effect: {}, mechanicRefs: ['necromante:plague'], scaling: necroWis('Bônus específico respeita o cap global.') },
    { name: 'Dreno Necrótico', desc: 'Cada tick da Praga cura 8% do dano real, limitado a 0,75% da Vida Máxima.', mechanicRefs: ['necromante:plague'], scaling: necroInt('A cura cresce somente através do dano real da Praga.') },
    { name: 'Essência Necrótica', desc: '+2,5% de MATK. Praga passa a 0,17x; Praga Devastadora, 0,21x.', effect: { magicDmgPct: 0.025 }, mechanicRefs: ['necromante:plague'], scaling: necroInt('Altera o coeficiente, não a duração.') },
    { name: 'Amplificação da Praga', desc: 'Tick da Praga com 4+ Decomposições aplica -6% ATK inimigo até o próximo ciclo.', mechanicRefs: ['necromante:decomposition', 'necromante:plague'], scaling: necroInt('O debuff não acumula e só é renovado por novo tick válido.') },
    { name: 'Toque Corrosivo', desc: 'Cause 1,55x MATK, aplique 1 Decomposição e reduza MDEF em 2% por stack, até 10%, por 3 ciclos. Recarga: 4.', ability: { name: 'Toque Corrosivo', desc: '1,55x MATK, +1 Decomposição e corrosão de MDEF.', cooldown: 4, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 1.55, dmgType: 'magical', decompositionOnHit: 1, necromancerTag: 'decomposition' } }, mechanicRefs: ['necromante:decomposition'], scaling: necroInt('A intensidade lê os stacks depois da aplicação.') },
    { name: 'Praga Devastadora', desc: 'Custa 1 Alma. Requer Praga e 2 Decomposições. 1,25x MATK, +2 stacks e Praga de 0,20x por 5 ciclos. Recarga: 6.', ability: { name: 'Praga Devastadora', desc: 'Investe uma Alma para intensificar a Praga.', cooldown: 6, condition: { type: 'all', conditions: [{ type: 'resourceAtLeast', resource: 'souls', value: 1 }, { type: 'periodicEffectActive', effectId: 'necromante:plague' }, { type: 'enemyStacksAtLeast', stackId: 'decomposition', stacks: 2 }] }, effect: { kind: 'bigHit', dmgMult: 1.25, dmgType: 'magical', soulCost: 1, decompositionOnHit: 2, plagueApply: true, plagueMultiplier: 0.20, plagueDuration: 5, necromancerTag: 'decomposition' } }, mechanicRefs: ['necromante:souls', 'necromante:decomposition', 'necromante:plague'], scaling: necroInt('Com Essência Necrótica, Praga 0,21x.') },
    { name: 'Poder da Ruína', desc: '+3% de MATK. Técnica de Decomposição que gasta Alma contra 5 stacks recebe até +3% dano direto conforme INT.', effect: { magicDmgPct: 0.03 }, mechanicRefs: ['necromante:souls', 'necromante:decomposition'], scaling: necroInt('+0,075 ponto percentual por INT, máximo +3%.') },
    { name: 'Colheita das Almas', desc: 'Requer 2 Decomposições. 1,60x MATK e +0,16x por até 3 stacks consumidos; consumir 3 gera 1 Alma. Recarga: 5.', ability: { name: 'Colheita das Almas', desc: 'Consome até 3 Decomposições para dano e uma possível Alma.', cooldown: 5, condition: { type: 'enemyStacksAtLeast', stackId: 'decomposition', stacks: 2 }, effect: { kind: 'bigHit', dmgMult: 1.60, dmgType: 'magical', decompositionConsumeMax: 3, soulGainOnConsumeExact: 3, necromancerTag: 'decomposition' } }, mechanicRefs: ['necromante:decomposition', 'necromante:souls'], scaling: necroInt('+0,16x por stack consumido, máximo 2,08x.') },
    { name: 'Apocalipse Necrótico', desc: 'Custa 3 Almas. Requer 5 stacks e Praga. 1,85x MATK +70% do dano restante da Praga, limitado a 1,00x MATK; consome setup ao acertar. Recarga: 9.', ability: { name: 'Apocalipse Necrótico', desc: 'Detona a Praga e toda a Decomposição.', cooldown: 9, condition: { type: 'all', conditions: [{ type: 'resourceAtLeast', resource: 'souls', value: 3 }, { type: 'enemyStacksEqual', stackId: 'decomposition', stacks: 5 }, { type: 'periodicEffectActive', effectId: 'necromante:plague' }] }, effect: { kind: 'bigHit', dmgMult: 1.85, dmgType: 'magical', soulCost: 3, plagueDetonatePct: 0.70, plagueDetonateCapMult: 1, necromancerTag: 'decomposition' } }, mechanicRefs: ['necromante:souls', 'necromante:decomposition', 'necromante:plague'], scaling: necroInt('O bônus usa os ticks restantes e tem cap de 1,00x MATK atual.') },
    { name: 'Sede dos Mortos', desc: 'Morte com Praga ou 3+ Decomposições cura 4% da Vida Base com Poder de Suporte e permite carregar até 3 Almas.', mechanicRefs: ['necromante:souls', 'necromante:decomposition', 'necromante:plague'], scaling: necroWis('SAB melhora a cura através de Poder de Suporte.') },
  ]),
  buildPath('necromante', 'drenar-vida', 'Drenar Vida', '#4a2a5a', [
    { name: 'Resistência Íntima', desc: '+8 de Vida Máxima. Barreiras do Escudo de Ossos recebem até +5% de eficiência conforme SAB.', effect: { maxHpFlat: 8 }, mechanicRefs: ['necromante:servants'], scaling: necroWis('+0,15% por SAB, máximo +5% multiplicativo.') },
    { name: 'Vínculo Funerário', desc: '+2% de MDEF. Dano dos Servos recebe até +4% conforme INT.', effect: { mdefPct: 0.02 }, mechanicRefs: ['necromante:servants'], scaling: necroInt('+0,10 ponto percentual por INT, máximo +4%.') },
    { name: 'Ossos Duros', desc: '+2% de DEF. Com Servo ativo, recebe até 3% menos dano direto conforme SAB.', effect: { defPct: 0.02 }, mechanicRefs: ['necromante:servants'], scaling: necroWis('-0,10 ponto percentual por SAB, máximo -3%.') },
    { name: 'Sangue Preservado', desc: '+8 de Vida Máxima. Curas de Sangue Pelo Sangue e Voracidade recebem até +5% conforme SAB.', effect: { maxHpFlat: 8 }, scaling: necroWis('+0,15% por SAB, máximo +5% multiplicativo.') },
    { name: 'Escudo de Ossos', desc: 'Custa 1 Alma e requer espaço. Cria barreira de 5% da Vida Máxima com Poder de Suporte e invoca um Servo. Recarga: 6.', ability: { name: 'Escudo de Ossos', desc: 'Barreira e um Servo Ósseo de 4 ataques.', cooldown: 6, condition: { type: 'all', conditions: [{ type: 'resourceAtLeast', resource: 'souls', value: 1 }, { type: 'summonCountBelow' }] }, effect: { kind: 'boneShield', soulCost: 1, summonCount: 1, summonAttacks: 4, barrierBasePct: 0.05 } }, mechanicRefs: ['necromante:souls', 'necromante:servants'], scaling: necroWis('SAB fortalece a barreira; INT fortalece o Servo.') },
    { name: 'Constituição Fúnebre', desc: '+10 de Vida Máxima. Com 20 SAB, o primeiro Servo de cada inimigo ganha +1 ataque.', effect: { maxHpFlat: 10 }, mechanicRefs: ['necromante:servants'], scaling: necroWis('Máximo uma vez por inimigo.') },
    { name: 'Armadura de Ossos', desc: 'Máximo de Servos passa a 2. Com ao menos um Servo, recebe 4% menos dano direto.', mechanicRefs: ['necromante:servants'], scaling: necroWis('A redução é fixa e não aumenta com dois Servos.') },
    { name: 'Comando Mortuário', desc: '+2,5% de MDEF. Intervalo dos ataques dos Servos cai em até 6% conforme SAB.', effect: { mdefPct: 0.025 }, mechanicRefs: ['necromante:servants'], scaling: necroWis('+0,30% de velocidade por SAB, máximo +6%.') },
    { name: 'Retribuição dos Mortos', desc: 'Ataques de Servo acumulam +3% para a próxima magia direta, até +9%; a magia consome tudo.', mechanicRefs: ['necromante:servants'], scaling: necroInt('Praga, Servo e ataque físico não consomem.') },
    { name: 'Sangue Pelo Sangue', desc: 'Sacrifica o Servo mais antigo para 1,85x MATK +0,08x por ataque restante e cura 22%; sem Servo custa 1 Alma, causa 1,60x e cura 15%. Recarga: 5.', ability: { name: 'Sangue Pelo Sangue', desc: 'Sacrifício ofensivo que drena vida.', cooldown: 5, condition: { type: 'any', conditions: [{ type: 'summonCountAtLeast', count: 1 }, { type: 'resourceAtLeast', resource: 'souls', value: 1 }] }, effect: { kind: 'bigHit', dmgMult: 1.60, dmgType: 'magical', soulCost: 1, sacrificeOldestSummon: true, directHealFromDamagePct: 0.15, directHealCapPct: 0.06, necromancerTag: 'soul' } }, mechanicRefs: ['necromante:souls', 'necromante:servants'], scaling: necroInt('Com Servo, até 2,17x e cura 22%, cap 8% da Vida Base.') },
    { name: 'Véu da Morte', desc: 'Custa 1 Alma. Por 3 ciclos, reduz dano direto em 8%; um Servo pode perder um ataque para elevar um golpe a 15%. Recarga: 8.', ability: { name: 'Véu da Morte', desc: 'Sacrifica vida útil dos Servos por proteção.', cooldown: 8, condition: { type: 'resourceAtLeast', resource: 'souls', value: 1 }, effect: { kind: 'deathVeil', soulCost: 1, buffRounds: 3 } }, mechanicRefs: ['necromante:souls', 'necromante:servants'], scaling: necroWis('Proteção fixa, uma ativação por ação inimiga.') },
    { name: 'Vigor Interior', desc: '+12 de Vida Máxima. Sacrifício voluntário concede até 4% de redução direta conforme VIT por 2 ciclos.', effect: { maxHpFlat: 12 }, mechanicRefs: ['necromante:servants'], scaling: [{ attribute: 'vit', label: 'VIT', role: 'terciario', description: '0,10 ponto percentual por VIT, máximo 4%.' }] },
    { name: 'Fortaleza de Ossos', desc: 'Custa 2 Almas. Completa o limite de Servos, renova existentes para ao menos 3 ataques e cria barreira de 8%. Recarga: 12.', ability: { name: 'Fortaleza de Ossos', desc: 'Ergue uma legião temporária e uma grande barreira.', cooldown: 12, condition: { type: 'resourceAtLeast', resource: 'souls', value: 2 }, effect: { kind: 'boneFortress', soulCost: 2, summonCount: 2, summonAttacks: 4, summonMaxRefresh: 3, barrierBasePct: 0.08 } }, mechanicRefs: ['necromante:souls', 'necromante:servants'], scaling: necroWis('SAB fortalece a barreira; INT fortalece os Servos.') },
    { name: 'Voracidade Mortal', desc: 'Abaixo de 40% de Vida, devora todos os Servos e até 3 Almas para curar, até 18% da Vida Máxima, e ganha 12% Roubo de Vida por 3 ciclos. Recarga: 14.', ability: { name: 'Voracidade Mortal', desc: 'Consome sua estrutura para sobreviver.', cooldown: 14, condition: { type: 'all', conditions: [{ type: 'hpBelow', pct: 0.40 }, { type: 'any', conditions: [{ type: 'summonCountAtLeast', count: 1 }, { type: 'resourceAtLeast', resource: 'souls', value: 1 }] }] }, effect: { kind: 'mortalVoracity', consumeAllSummons: true, consumeSoulsMax: 3, buffRounds: 3 } }, mechanicRefs: ['necromante:souls', 'necromante:servants'], scaling: necroWis('4% da Vida Base por Servo +3% por Alma, multiplicado por Poder de Suporte.') },
    { name: 'Vínculo Eterno com a Morte', desc: 'Servos passam a 5 ataques; preserva um com até 2 ataques entre inimigos. O primeiro Servo que expirar naturalmente gera 1 Alma.', mechanicRefs: ['necromante:souls', 'necromante:servants'], scaling: necroInt('A geração ocorre uma vez por inimigo e nunca por sacrifício.') },
  ]),
  buildPath('necromante', 'ceifador', 'Ceifador', '#c89a2e', [
    { name: 'Reflexo do Ceifador', desc: '+1% de Crítico. Contra presa abaixo de 50%, recebe até +2% conforme SOR.', effect: { critPct: 0.01 }, scaling: necroLuck('+0,10 ponto percentual por SOR, máximo +2%.') },
    { name: 'Poder da Ceifa', desc: '+2% de MATK. Técnicas ofensivas que gastam Alma recebem até +3% conforme INT.', effect: { magicDmgPct: 0.02 }, mechanicRefs: ['necromante:souls'], scaling: necroInt('+0,075 ponto percentual por INT, máximo +3%.') },
    { name: 'Manto das Almas', desc: '+2% de MDEF e +0,5% por Alma armazenada, até +3% adicional.', effect: { mdefPct: 0.02 }, mechanicRefs: ['necromante:souls'], scaling: necroWis('A defesa adicional acompanha o recurso atual.') },
    { name: 'Golpe Calculado', desc: '+3% de Dano Crítico e +0,5% a cada 20% de Vida perdida da presa, até +2% adicional.', effect: { critDmgPct: 0.03 }, scaling: necroLuck('O bônus adicional acompanha a Vida perdida da presa.') },
    { name: 'Golpe da Foice', desc: 'Cause 1,45x MATK. O primeiro crítico desta técnica em cada inimigo gera 1 Alma. Recarga: 4.', ability: { name: 'Golpe da Foice', desc: 'Golpe de ceifa que pode arrancar uma Alma no crítico.', cooldown: 4, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 1.45, dmgType: 'magical', necromancerTag: 'reaper' } }, mechanicRefs: ['necromante:souls'], scaling: necroInt('SOR ajuda a geração através do crítico.') },
    { name: 'Essência Ceifada', desc: '+2,5% de MATK. Ganhar Alma prepara até +3% de dano na próxima magia direta por 2 ciclos.', effect: { magicDmgPct: 0.025 }, mechanicRefs: ['necromante:souls'], scaling: necroInt('+0,075 ponto percentual por INT, máximo +3%.') },
    { name: 'Ceifa Ampliada', desc: 'Quando um ataque cruza limite de Alma, próxima magia ganha +8% Dano Crítico por Alma gerada, até +16%, por 2 ciclos.', mechanicRefs: ['necromante:souls'], scaling: necroLuck('O bônus é preparado pelo evento de threshold.') },
    { name: 'Instinto Mortal', desc: '+1,5% de Crítico. Com 4+ Almas, recebe até +3% adicional conforme SOR.', effect: { critPct: 0.015 }, mechanicRefs: ['necromante:souls'], scaling: necroLuck('+0,10 ponto percentual por SOR, máximo +3%.') },
    { name: 'Colheita de Vida', desc: 'Sempre que uma habilidade gasta Almas, cura 0,75% da Vida Base por Alma, com Poder de Suporte, até 2,25%.', mechanicRefs: ['necromante:souls'], scaling: necroWis('Não gera Alma nem aciona outras curas.') },
    { name: 'Golpe do Terror', desc: 'Custa 1 Alma. 1,65x MATK e -15% Precisão inimiga por 2 ciclos; se tinha 4+ Almas, também -8% ATK. Recarga: 5.', ability: { name: 'Golpe do Terror', desc: 'Gasta Alma para enfraquecer a presa.', cooldown: 5, condition: { type: 'resourceAtLeast', resource: 'souls', value: 1 }, effect: { kind: 'bigHit', dmgMult: 1.65, dmgType: 'magical', soulCost: 1, necromancerTag: 'reaper' } }, mechanicRefs: ['necromante:souls'], scaling: necroInt('SOR continua governando críticos normais.') },
    { name: 'Toque Final', desc: 'Custa 1 Alma e requer presa abaixo de 40%. 2,10x MATK, +0,10x a cada 10% abaixo do limite, até 2,50x. Recarga: 5.', ability: { name: 'Toque Final', desc: 'Ataque de execução crescente contra Vida baixa.', cooldown: 5, condition: { type: 'all', conditions: [{ type: 'resourceAtLeast', resource: 'souls', value: 1 }, { type: 'enemyHpBelow', pct: 0.40 }] }, effect: { kind: 'bigHit', dmgMult: 2.10, dmgType: 'magical', soulCost: 1, enemyHpExecuteBase: 2.10, enemyHpExecuteThreshold: 0.40, enemyHpExecutePer5Pct: 0.05, enemyHpExecuteCap: 2.50, necromancerTag: 'reaper' } }, mechanicRefs: ['necromante:souls'], scaling: necroInt('A Vida perdida da presa aumenta o multiplicador.') },
    { name: 'Poder Terminal', desc: '+3% de MATK. Contra presa abaixo de 25%, dano mágico direto recebe até +3% conforme INT.', effect: { magicDmgPct: 0.03 }, scaling: necroInt('+0,075 ponto percentual por INT, máximo +3%.') },
    { name: 'Dança da Ceifa', desc: 'Custa 2 Almas. Três hits independentes de 0,65x MATK; 2+ críticos reembolsam 1 Alma. Recarga: 7.', ability: { name: 'Dança da Ceifa', desc: 'Três golpes com acerto e crítico independentes.', cooldown: 7, condition: { type: 'resourceAtLeast', resource: 'souls', value: 2 }, effect: { kind: 'multiHit', hitCount: 3, dmgMultPerHit: 0.65, dmgType: 'magical', soulCost: 2, necromancerTag: 'reaper' } }, mechanicRefs: ['necromante:souls'], scaling: necroInt('SOR governa os três rolls críticos independentes.') },
    { name: 'Ceifa da Morte', desc: 'Custa 3 Almas e requer presa abaixo de 25%. 2,75x MATK, +0,15x a cada 5% abaixo, até 3,50x. Recarga: 9.', ability: { name: 'Ceifa da Morte', desc: 'Payoff final de Vida baixa e Almas.', cooldown: 9, condition: { type: 'all', conditions: [{ type: 'resourceAtLeast', resource: 'souls', value: 3 }, { type: 'enemyHpBelow', pct: 0.25 }] }, effect: { kind: 'bigHit', dmgMult: 2.75, dmgType: 'magical', soulCost: 3, enemyHpExecuteBase: 2.75, enemyHpExecuteThreshold: 0.25, enemyHpExecutePer5Pct: 0.15, enemyHpExecuteCap: 3.50, necromancerTag: 'reaper' } }, mechanicRefs: ['necromante:souls'], scaling: necroInt('Não garante crítico, não ignora MDEF e não é instakill.') },
    { name: 'Instinto do Ceifador', desc: 'Cruzar 25% gera +1 Alma adicional. A primeira técnica de Ceifador abaixo de 25% custa 1 Alma a menos.', mechanicRefs: ['necromante:souls'], scaling: necroLuck('Cada benefício acontece uma vez por inimigo.') },
  ]),
];

// Redesign definitivo do Ladino. Os IDs internos veneno/sombras/laminas e
// todos os índices são preservados; os nomes visuais passam a representar
// Assassino, Dançarino de Lâminas e Trapaceiro.
SKILL_TREES.ladino = [
  buildPath('ladino', 'veneno', 'Assassino', '#4f7a3a', [
    { name: 'Instinto Predatório', desc: '+2% de dano físico direto. A primeira Emboscada em cada inimigo recebe +3 pontos percentuais de Crítico.', effect: { dmgPct: 0.02 }, mechanicRefs: ['ladino:ambush'] },
    { name: 'Mão do Assassino', desc: '+1,5 ponto percentual de Crítico; contra inimigo Exposto, +1 ponto percentual.', effect: { critPct: 0.015 }, mechanicRefs: ['ladino:exposed'] },
    { name: 'Passos sem Som', desc: '+1,5% de Evasão. Enquanto Furtivo, a penalidade de Precisão inimiga aumenta para 12 pontos percentuais.', effect: { evasionPct: 0.015 }, mechanicRefs: ['ladino:stealth'] },
    { name: 'Sangue Frio', desc: '-3% de recarga somente das técnicas Assassinas. Enquanto Furtivo, +2 pontos percentuais de Precisão.', effect: {}, mechanicRefs: ['ladino:stealth'] },
    { name: 'Passo Sombrio', desc: 'AÇÃO RÁPIDA. Entre em Furtivo. Só é usada se você ainda não estiver Furtivo. Recarga: 5 ciclos.', ability: { name: 'Passo Sombrio', desc: 'Entre em Furtivo sem substituir sua próxima Ação Principal.', cooldown: 5, actionType: 'quick', condition: { type: 'stateInactive', state: 'stealth' }, effect: { kind: 'rogueStealth', roguePath: 'assassin' } }, mechanicRefs: ['ladino:initiative', 'ladino:stealth'] },
    { name: 'Ponta Letal', desc: '+4% de Dano Crítico. Contra Exposto, +2 pontos percentuais de Precisão.', effect: { critDmgPct: 0.04 }, mechanicRefs: ['ladino:exposed'] },
    { name: 'Emboscador', desc: 'O dano físico direto de uma Emboscada recebe +5% final. Não afeta Toxina, Ecos ou outros efeitos indiretos.', mechanicRefs: ['ladino:ambush'] },
    { name: 'Toxina Refinada', desc: '+2% de dano físico direto. A Toxina aplicada por habilidades Assassinas causa +10% de dano relativo.', effect: { dmgPct: 0.02 }, mechanicRefs: ['ladino:toxin'] },
    { name: 'Janela Mortal', desc: 'Enquanto o inimigo estiver Exposto, habilidades Principais Assassinas recebem +4% de dano físico direto final.', mechanicRefs: ['ladino:exposed'] },
    { name: 'Punhalada Velada', desc: 'AÇÃO PRINCIPAL. Cause 1,45x ATK; como Emboscada, 1,65x e aplique Exposto ao acertar. Recarga: 3 ciclos.', ability: { name: 'Punhalada Velada', desc: 'Golpe que transforma Furtivo em Exposto.', cooldown: 3, actionType: 'main', condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 1.45, ambushDmgMult: 1.65, offensive: true, canExpose: true, roguePath: 'assassin', imageEchoRatio: 0.10 } }, mechanicRefs: ['ladino:initiative', 'ladino:ambush', 'ladino:exposed'] },
    { name: 'Lâmina Envenenada', desc: 'AÇÃO RÁPIDA. Prepare Lâmina Tóxica para a próxima Principal física que acertar. A Toxina dura 3 ciclos. Recarga: 4.', ability: { name: 'Lâmina Envenenada', desc: 'Prepare uma Toxina de 0,12x ATK; em Emboscada, 0,15x.', cooldown: 4, actionType: 'quick', condition: { type: 'stateInactive', state: 'toxicBlade' }, effect: { kind: 'rogueToxicBlade', roguePath: 'assassin', toxicBlade: true } }, mechanicRefs: ['ladino:initiative', 'ladino:toxin'] },
    { name: 'Artéria Aberta', desc: 'Contra inimigo com 35% ou menos de Vida: +3% de dano físico direto e +3 pontos percentuais de Precisão.', effect: {} },
    { name: 'Corte da Sombra', desc: 'AÇÃO PRINCIPAL. 1,65x ATK; se Exposto no início, consome Exposto e causa 2,15x com 15% de penetração de DEF. Recarga: 5.', ability: { name: 'Corte da Sombra', desc: 'Consome Exposto no início do cast, mesmo se errar.', cooldown: 5, actionType: 'main', condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 1.65, exposedDmgMult: 2.15, consumeExposed: true, defPenPct: 0.15, offensive: true, roguePath: 'assassin', imageEchoRatio: 0.10 } }, mechanicRefs: ['ladino:initiative', 'ladino:exposed'] },
    { name: 'Execução Silenciosa', desc: 'AÇÃO PRINCIPAL. Requer Exposto ou Vida inimiga até 30%. Causa 2,35x, 2,55x ou 2,85x ATK quando ambos valem. Recarga: 8.', ability: { name: 'Execução Silenciosa', desc: 'Payoff de Exposto e Vida baixa; não garante acerto nem crítico.', cooldown: 8, actionType: 'main', condition: { type: 'any', conditions: [{ type: 'enemyExposed' }, { type: 'enemyHpBelow', pct: 0.30 }] }, effect: { kind: 'bigHit', dmgMult: 2.35, exposedDmgMult: 2.55, combinedDmgMult: 2.85, consumeExposed: true, offensive: true, roguePath: 'assassin', imageEchoRatio: 0.10 } }, mechanicRefs: ['ladino:initiative', 'ladino:exposed'] },
    { name: 'Mestre do Véu', desc: 'Comece Furtivo contra cada novo inimigo. Se Execução Silenciosa acertar e a presa sobreviver, entre novamente em Furtivo.', mechanicRefs: ['ladino:stealth'] },
  ]),
  buildPath('ladino', 'sombras', 'Dançarino de Lâminas', '#5b5f6a', [
    { name: 'Corpo em Movimento', desc: '+1,5% de Velocidade. Após a primeira Rápida em cada inimigo, +2 pontos percentuais de Evasão até a próxima Principal.', effect: {} },
    { name: 'Fio Duplo', desc: '+2 pontos percentuais de Precisão em multi-hit; com 2 Imagens, +1 ponto percentual adicional.', effect: {} },
    { name: 'Passo Fluido', desc: '+1,5% de Evasão; com ao menos 1 Imagem, +1% adicional.', effect: { evasionPct: 0.015 }, mechanicRefs: ['ladino:images'] },
    { name: 'Ritmo de Aço', desc: '-3% de recarga somente do Dançarino. Rápidas ofensivas ganham +2 pontos percentuais de Precisão.', effect: {} },
    { name: 'Passo Cortante', desc: 'AÇÃO RÁPIDA. Cause 0,40x ATK e crie 1 Imagem, mesmo se errar. Só é usada com menos de 2 Imagens. Recarga: 3.', ability: { name: 'Passo Cortante', desc: 'Ataque Rápido que prepara uma Imagem Residual.', cooldown: 3, actionType: 'quick', condition: { type: 'imageCountBelow', count: 2 }, effect: { kind: 'bigHit', dmgMult: 0.40, offensive: true, imageGain: 1, roguePath: 'blade' } }, mechanicRefs: ['ladino:initiative', 'ladino:images'] },
    { name: 'Lâminas Fluidas', desc: '+2% de dano físico direto. Ecos de Imagem causam +5% relativo.', effect: { dmgPct: 0.02 }, mechanicRefs: ['ladino:images'] },
    { name: 'Réplica Precisa', desc: 'Ecos das Imagens ignoram 10% da DEF inimiga.', mechanicRefs: ['ladino:images'] },
    { name: 'Entre Passos', desc: 'Depois de uma Rápida do Dançarino, a próxima Principal ofensiva ganha +3 pontos percentuais de Precisão.', effect: {}, mechanicRefs: ['ladino:initiative'] },
    { name: 'Fluxo Intocável', desc: 'Depois de uma Rápida do Dançarino, o próximo dano direto inimigo é reduzido em 6%, ou o efeito termina na próxima Principal.', mechanicRefs: ['ladino:initiative'] },
    { name: 'Corte Cruzado', desc: 'AÇÃO PRINCIPAL. 1,45x ATK; consome Imagens e cada uma cria um Eco de 25% do coeficiente. Recarga: 3.', ability: { name: 'Corte Cruzado', desc: 'Sincroniza todas as Imagens disponíveis.', cooldown: 3, actionType: 'main', condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 1.45, offensive: true, consumeImages: true, imageEchoRatio: 0.25, roguePath: 'blade' } }, mechanicRefs: ['ladino:initiative', 'ladino:images'] },
    { name: 'Lâmina Reversa', desc: 'AÇÃO RÁPIDA. Cause 0,35x ATK. Com menos de 2 Imagens, crie 1; com 2, prepare Eco Afiado. Recarga: 4.', ability: { name: 'Lâmina Reversa', desc: 'Gera uma Imagem ou fortalece a próxima sincronização.', cooldown: 4, actionType: 'quick', condition: { type: 'stateInactive', state: 'reverseWasted' }, effect: { kind: 'bigHit', dmgMult: 0.35, offensive: true, imageGain: 1, sharpenedEchoOnCap: true, roguePath: 'blade' } }, mechanicRefs: ['ladino:initiative', 'ladino:images', 'ladino:sharpened_echo'] },
    { name: 'Sincronia Marcial', desc: '+3% de dano físico direto com 2 Imagens. Ecos recebem +2 pontos percentuais de penetração de DEF.', effect: {}, mechanicRefs: ['ladino:images'] },
    { name: 'Dança das Lâminas', desc: 'AÇÃO PRINCIPAL. 3 hits independentes de 0,52x ATK. Cada Imagem cria somente 1 Eco de 0,312x. Recarga: 5.', ability: { name: 'Dança das Lâminas', desc: 'Três golpes; a sincronização não multiplica por hit.', cooldown: 5, actionType: 'main', condition: { type: 'always' }, effect: { kind: 'multiHit', hitCount: 3, dmgMultPerHit: 0.52, dmgMult: 1.56, offensive: true, consumeImages: true, imageEchoRatio: 0.20, roguePath: 'blade' } }, mechanicRefs: ['ladino:initiative', 'ladino:images'] },
    { name: 'Ataque Sincronizado', desc: 'AÇÃO PRINCIPAL. Requer e consome 2 Imagens. 1,75x ATK, +8 pontos percentuais de Precisão e dois Ecos de 0,665x. Recarga: 8.', ability: { name: 'Ataque Sincronizado', desc: 'Grande payoff preparado; se errar, as Imagens são perdidas e não há Ecos.', cooldown: 8, actionType: 'main', condition: { type: 'imageCountAtLeast', count: 2 }, effect: { kind: 'bigHit', dmgMult: 1.75, offensive: true, requiresImages: 2, consumeImages: true, imageEchoRatio: 0.38, roguePath: 'blade' } }, mechanicRefs: ['ladino:initiative', 'ladino:images'] },
    { name: 'Mestre das Imagens', desc: 'Ratios de Eco do Dançarino aumentam em 0,05 absoluto. Consumir exatamente 2 Imagens recupera 1 após toda a resolução.', mechanicRefs: ['ladino:images'] },
  ]),
  buildPath('ladino', 'laminas', 'Trapaceiro', '#c89a2e', [
    { name: 'Dedos Ligeiros', desc: '+2 pontos percentuais de Precisão. O primeiro Truque contra cada inimigo dura +1 Ação Principal.', effect: { accuracyPct: 0.02 }, mechanicRefs: ['ladino:prepared_trick'] },
    { name: 'Olho do Trapaceiro', desc: '+1,5% de Evasão; com Truque Preparado, +1% adicional.', effect: { evasionPct: 0.015 }, mechanicRefs: ['ladino:prepared_trick'] },
    { name: 'Sorte Preparada', desc: '+1 ponto percentual de Crítico; com Vantagem pronta, +2 pontos percentuais adicionais.', effect: { critPct: 0.01 }, mechanicRefs: ['ladino:advantage'] },
    { name: 'Ritmo Improvisado', desc: '-3% de recarga somente das habilidades Trapaceiras. Truques duram +1 Ação Principal.', effect: {}, mechanicRefs: ['ladino:prepared_trick'] },
    { name: 'Finta Baixa', desc: 'AÇÃO RÁPIDA. Prepare Finta: o próximo ataque direto inimigo perde 15 pontos percentuais de Precisão; se errar, gera Vantagem. Recarga: 4.', ability: { name: 'Finta Baixa', desc: 'Prepara um Truque que reage ao próximo ataque direto inimigo.', cooldown: 4, actionType: 'quick', condition: { type: 'quickWindow' }, effect: { kind: 'roguePrepareTrick', trickKind: 'feint', roguePath: 'trickster' } }, mechanicRefs: ['ladino:initiative', 'ladino:prepared_trick', 'ladino:advantage'] },
    { name: 'Mão Ágil', desc: '+2% de Velocidade. Depois de um Truque ser acionado, a próxima Principal recebe +2 pontos percentuais de Precisão.', effect: {} },
    { name: 'Explorar Erro', desc: 'Enquanto Vantagem estiver pronta, a próxima Principal ofensiva também recebe 5% de penetração de DEF.', mechanicRefs: ['ladino:advantage'] },
    { name: 'Aposta Calculada', desc: '+4% de Dano Crítico; com Vantagem pronta, +2% de dano físico direto.', effect: { critDmgPct: 0.04 }, mechanicRefs: ['ladino:advantage'] },
    { name: 'Plano B', desc: 'Quando um Truque falha, reduz em 1 ciclo a recarga da Rápida que o preparou, no máximo uma vez por Truque.', mechanicRefs: ['ladino:prepared_trick'] },
    { name: 'Golpe Sujo', desc: 'AÇÃO PRINCIPAL. 1,45x ATK; com Vantagem, 1,80x e, ao acertar, reduz dano direto inimigo em 10% por 2 ciclos. Recarga: 3.', ability: { name: 'Golpe Sujo', desc: 'Explora Vantagem para dano e enfraquecimento.', cooldown: 3, actionType: 'main', condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 1.45, advantageDmgMult: 1.80, enemyDirectDmgDebuffPct: 0.10, enemyDirectDmgDebuffRounds: 2, offensive: true, roguePath: 'trickster', imageEchoRatio: 0.10 } }, mechanicRefs: ['ladino:initiative', 'ladino:advantage'] },
    { name: 'Dado Viciado', desc: 'AÇÃO RÁPIDA. Prepare duas rolagens para a primeira verificação de acerto da próxima Principal ofensiva. Recarga: 5.', ability: { name: 'Dado Viciado', desc: 'Use o melhor de dois resultados; se a segunda rolagem salvar o ataque, prepare Vantagem para a próxima Principal.', cooldown: 5, actionType: 'quick', condition: { type: 'quickWindow' }, effect: { kind: 'roguePrepareTrick', trickKind: 'loaded_die', roguePath: 'trickster' } }, mechanicRefs: ['ladino:initiative', 'ladino:prepared_trick', 'ladino:advantage'] },
    { name: 'Carta Marcada', desc: '+2% de dano físico direto. Consumir Vantagem concede +3% de penetração de DEF adicional naquele cast.', effect: { dmgPct: 0.02 }, mechanicRefs: ['ladino:advantage'] },
    { name: 'Mão Leve', desc: 'AÇÃO PRINCIPAL. 1,30x ATK; com Vantagem, 1,60x e, ao acertar, atrasa a próxima ação inimiga em 18% e reduz uma Rápida. Recarga: 5.', ability: { name: 'Mão Leve', desc: 'Rouba Tempo uma vez da ação inimiga já agendada.', cooldown: 5, actionType: 'main', condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 1.30, advantageDmgMult: 1.60, timeSteal: true, offensive: true, roguePath: 'trickster', imageEchoRatio: 0.10 } }, mechanicRefs: ['ladino:initiative', 'ladino:advantage', 'ladino:time_stolen'] },
    { name: 'Ás na Manga', desc: 'AÇÃO PRINCIPAL. Requer Vantagem ou Vida inimiga até 25%. Causa 2,20x, 2,55x ou 2,75x; com Vantagem, +10pp Crítico e 12% penetração. Recarga: 8.', ability: { name: 'Ás na Manga', desc: 'Finalizador do Trapaceiro; não garante acerto nem crítico.', cooldown: 8, actionType: 'main', condition: { type: 'any', conditions: [{ type: 'advantageReady' }, { type: 'enemyHpBelow', pct: 0.25 }] }, effect: { kind: 'bigHit', dmgMult: 2.20, advantageDmgMult: 2.55, combinedDmgMult: 2.75, advantageCritPct: 0.10, advantageDefPenPct: 0.12, offensive: true, roguePath: 'trickster', imageEchoRatio: 0.10 } }, mechanicRefs: ['ladino:initiative', 'ladino:advantage'] },
    { name: 'Mestre do Improviso', desc: 'Principal Trapaceira com Vantagem recebe +0,10x ATK e +8pp Precisão. Se a habilidade inteira errar, Vantagem é restaurada depois.', mechanicRefs: ['ladino:advantage'] },
  ]),
];

const paladinStrikeScaling = (detail: string): ScalingEntry[] => [
  { attribute: 'str', label: 'FOR', role: 'principal', description: 'Aumenta o ATK físico usado pelo golpe.' },
  { attribute: 'wis', label: 'SAB', role: 'secundario', description: 'Aumenta somente a eficiência radiante própria do Paladino, até o cap.' },
  { label: 'Virtudes', role: 'mecanica', description: detail },
];
const paladinAegisScaling = (detail: string): ScalingEntry[] => [
  { attribute: 'vit', label: 'VIT', role: 'principal', description: 'Aumenta Vida/DEF e pode elevar o teto da Égide, respeitando o cap do talento.' },
  { attribute: 'wis', label: 'SAB', role: 'secundario', description: 'Pode elevar o teto sagrado da Égide, respeitando o cap do talento.' },
  { label: 'Égide', role: 'mecanica', description: detail },
];
const paladinHealScaling = (detail: string): ScalingEntry[] => [
  { attribute: 'wis', label: 'SAB', role: 'principal', description: 'Melhora a cura própria ativa dentro do cap específico do Paladino.' },
  { attribute: 'vit', label: 'VIT', role: 'secundario', description: 'Aumenta a Vida Máxima e a parcela limitada baseada nela.' },
  { label: 'Misericórdia', role: 'mecanica', description: detail },
];
const paladinFixedScaling = (detail: string): ScalingEntry[] => [{ label: 'Virtudes', role: 'mecanica', description: detail }];

// Redesign definitivo do Paladino. IDs internos voto/martelo/luz, índices e
// topologia permanecem idênticos; somente a apresentação e o comportamento
// passam a representar Égide, Veredito e Redenção.
SKILL_TREES.paladino = [
  buildPath('paladino', 'voto', 'Égide', '#c9a86a', [
    { name: 'Vigor Consagrado', desc: '+8 de Vida Máxima. VIT aumenta o teto das Égides deste caminho em 0,08 ponto percentual por ponto, até +2 pontos percentuais.', effect: { maxHpFlat: 8 }, mechanicRefs: ['paladino:aegis'], scaling: paladinAegisScaling('O bônus altera o teto de absorção, não a porcentagem reduzida do golpe.') },
    { name: 'Fé de Ferro', desc: '+2% de MDEF. Enquanto Coragem for a Virtude Regente, +2% de MDEF adicional.', effect: { mdefPct: 0.02 }, mechanicRefs: ['paladino:virtues', 'paladino:regent'], scaling: [{ attribute: 'wis', label: 'SAB', role: 'principal', description: 'Sustenta a defesa sagrada da classe.' }, { label: 'Coragem', role: 'mecanica', description: 'Ser Regente ativa o bônus condicional.' }] },
    { name: 'Guarda Devota', desc: '+2% de DEF. Invocar Coragem por uma habilidade de Égide prepara +3 pontos percentuais de redução para a próxima Égide criada.', effect: { defPct: 0.02 }, mechanicRefs: ['paladino:virtues', 'paladino:aegis'], scaling: paladinAegisScaling('O preparo não acumula e é consumido pela próxima Égide.') },
    { name: 'Disciplina do Voto', desc: '-3% de Recarga somente para habilidades paladino:voto.', mechanicRefs: ['paladino:liturgy'], scaling: [{ attribute: 'wis', label: 'SAB', role: 'secundario', description: 'Representa disciplina sagrada sem alterar recargas globais.' }, { label: 'Égide', role: 'mecanica', description: 'A redução é restrita a este caminho.' }] },
    { name: 'Égide Sagrada', desc: 'Invoca Coragem e cria uma Égide por 3 ciclos. O próximo golpe direto sofre 35% de redução, limitada a 10% da Vida Máxima. Recarga: 4 ciclos.', ability: { name: 'Égide Sagrada', desc: 'Invoca Coragem. Cria uma Égide de um golpe: 35% de redução, teto de 10% da Vida Máxima, duração de 3 ciclos.', cooldown: 4, condition: { type: 'always' }, effect: { kind: 'aegis', paladinPath: 'aegis', paladinVirtues: ['courage'], aegisReductionPct: 0.35, aegisMaxHpCapPct: 0.10, aegisDuration: 3 } }, mechanicRefs: ['paladino:virtues', 'paladino:liturgy', 'paladino:aegis'], scaling: paladinAegisScaling('Protege apenas o próximo golpe inimigo direto que acertar.') },
    { name: 'Sabedoria Protetora', desc: '+2% de MDEF. SAB aumenta o teto das Égides deste caminho em 0,08 ponto percentual por ponto, até +2 pontos percentuais.', effect: { mdefPct: 0.02 }, mechanicRefs: ['paladino:aegis'], scaling: paladinAegisScaling('Combina com Vigor Consagrado; cada talento mantém seu próprio cap de +2pp.') },
    { name: 'Voto Mantido', desc: 'Uma vez por Liturgia, se uma Égide impedir ao menos 5% da Vida Máxima, acrescente +1 ação à Liturgia, até o máximo de 4.', mechanicRefs: ['paladino:liturgy', 'paladino:aegis'], scaling: paladinFixedScaling('Não cria Virtude nem Convicção artificial.') },
    { name: 'Corpo do Templo', desc: '+10 de Vida Máxima. Abaixo de 40% de Vida, Égides deste caminho recebem +5 pontos percentuais de redução; o teto não muda.', effect: { maxHpFlat: 10 }, mechanicRefs: ['paladino:aegis'], scaling: paladinAegisScaling('A condição aumenta a porcentagem, mas preserva o teto de absorção.') },
    { name: 'Escudo Vivo', desc: 'Se uma Égide expirar sem ser consumida, restaura 3% da Vida Máxima. Uma ativação por Égide; não cria outra Égide.', mechanicRefs: ['paladino:aegis'], scaling: paladinHealScaling('É cura passiva: não aciona Misericórdia Armada nem sistemas do Clérigo.') },
    { name: 'Martelo do Guardião', desc: 'Invoca Coragem. Cause 1,40x ATK. Ao acertar com Égide ativa, renove sua duração em +1 ciclo, até 3. Recarga: 4 ciclos.', ability: { name: 'Martelo do Guardião', desc: 'Invoca Coragem. Cause 1,40x ATK; ao acertar, renove em +1 ciclo a Égide ativa, até 3.', cooldown: 4, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 1.40, paladinPath: 'aegis', paladinVirtues: ['courage'], renewAegisOnHit: 1 } }, mechanicRefs: ['paladino:virtues', 'paladino:liturgy', 'paladino:aegis'], scaling: paladinStrikeScaling('Coragem é invocada no início do cast, mesmo se o golpe errar.') },
    { name: 'Provação do Escudo', desc: 'Invoca Coragem e causa 1,25x ATK. Abaixo de 60% de Vida, também invoca Misericórdia, que se torna Regente. Recarga: 6 ciclos.', ability: { name: 'Provação do Escudo', desc: 'Invoca Coragem e causa 1,25x ATK. Abaixo de 60% de Vida, também invoca Misericórdia.', cooldown: 6, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 1.25, paladinPath: 'aegis', paladinVirtues: ['courage'], paladinExtraVirtueBelowHp: { virtue: 'mercy', pct: 0.60 } } }, mechanicRefs: ['paladino:virtues', 'paladino:liturgy', 'paladino:regent'], scaling: paladinStrikeScaling('Em emergência pode reunir duas Virtudes numa única ação real.') },
    { name: 'Armadura do Juramento', desc: '+2,5% de DEF. Com Convicção 2 ou maior, +2% de MDEF.', effect: { defPct: 0.025 }, mechanicRefs: ['paladino:conviction'], scaling: [{ attribute: 'vit', label: 'VIT', role: 'principal', description: 'Aumenta a defesa física e a Vida.' }, { label: 'Convicção', role: 'mecanica', description: 'Duas Virtudes diferentes ativam o bônus de MDEF.' }] },
    { name: 'Égide Suprema', desc: 'Requer Vida abaixo de 55%. Invoca Coragem e cria Égide por 3 ciclos: 50% de redução, teto de 15% da Vida Máxima. Recarga: 8 ciclos.', ability: { name: 'Égide Suprema', desc: 'Invoca Coragem. Cria uma Égide de um golpe: 50% de redução, teto de 15% da Vida Máxima, duração de 3 ciclos.', cooldown: 8, condition: { type: 'hpBelow', pct: 0.55 }, effect: { kind: 'aegis', paladinPath: 'aegis', paladinVirtues: ['courage'], aegisReductionPct: 0.50, aegisMaxHpCapPct: 0.15, aegisDuration: 3 } }, mechanicRefs: ['paladino:virtues', 'paladino:aegis'], scaling: paladinAegisScaling('Substitui qualquer Égide anterior; nunca empilha.') },
    { name: 'Veredito da Fortaleza', desc: 'VEREDITO. Requer Convicção 2. Consome todas as Virtudes: 1,55x ATK com 2 ou 1,80x com 3; cria Égide 40%/12% ou 50%/16%. Pleno com Coragem Regente protege dois golpes, o segundo com 50% da eficiência. Recarga: 8 ciclos.', ability: { name: 'Veredito da Fortaleza', desc: 'Consome a Liturgia no início. Causa dano conforme a Convicção e cria uma Égide; Pleno com Coragem Regente protege dois golpes.', cooldown: 8, condition: { type: 'resourceAtLeast', resource: 'conviction', value: 2 }, effect: { kind: 'bigHit', paladinPath: 'aegis', paladinVerdict: true, verdictDmgMultByConviction: { 2: 1.55, 3: 1.80 }, verdictAegisByConviction: { 2: { reductionPct: 0.40, maxHpCapPct: 0.12 }, 3: { reductionPct: 0.50, maxHpCapPct: 0.16 } } } }, mechanicRefs: ['paladino:verdict', 'paladino:conviction', 'paladino:regent', 'paladino:aegis'], scaling: paladinStrikeScaling('O snapshot define dano e Égide; um erro não devolve as Virtudes.') },
    { name: 'Égide Perfeita', desc: 'Uma vez por inimigo, quando uma Égide enfrentar um golpe de ao menos 12% da Vida Máxima, reduza mais 5% do dano restante depois da Égide.', mechanicRefs: ['paladino:aegis'], scaling: paladinAegisScaling('Só reage a golpe direto e reinicia apenas no próximo inimigo.') },
  ]),
  buildPath('paladino', 'martelo', 'Veredito', '#a5432f', [
    { name: 'Força do Veredito', desc: '+2% de dano físico direto. Com Justiça ativa, habilidades radiantes do Paladino recebem +1% de dano final.', effect: { dmgPct: 0.02 }, mechanicRefs: ['paladino:virtues', 'paladino:verdict'], scaling: paladinStrikeScaling('Justiça ativa fortalece apenas técnicas marcadas como radiantes.') },
    { name: 'Olho do Juiz', desc: '+1,5 ponto percentual de Precisão. Com Convicção 2 ou maior, +1,5 ponto percentual adicional.', effect: { accuracyPct: 0.015 }, mechanicRefs: ['paladino:conviction'], scaling: [{ attribute: 'dex', label: 'DES', role: 'principal', description: 'Sustenta a Precisão-base do golpe.' }, { label: 'Convicção', role: 'mecanica', description: 'Duas Virtudes diferentes ativam a precisão adicional.' }] },
    { name: 'Fôlego do Carrasco', desc: '+8 de Vida Máxima. Contra inimigo abaixo de 35% de Vida, Vereditos recebem +2% de dano final.', effect: { maxHpFlat: 8 }, mechanicRefs: ['paladino:verdict'], scaling: [{ attribute: 'vit', label: 'VIT', role: 'secundario', description: 'Aumenta Vida e resistência.' }, { label: 'Veredito', role: 'mecanica', description: 'A condição de Vida baixa fortalece apenas habilidades de Veredito.' }] },
    { name: 'Ritmo do Martelo', desc: '-3% de Recarga somente para habilidades paladino:martelo.', mechanicRefs: ['paladino:liturgy'], scaling: paladinFixedScaling('A redução é restrita ao caminho Veredito.') },
    { name: 'Golpe do Veredito', desc: 'Invoca Justiça. Habilidade marcial/radiante que causa 1,45x ATK. Recarga: 3 ciclos.', ability: { name: 'Golpe do Veredito', desc: 'Invoca Justiça e causa 1,45x ATK com eficiência radiante de SAB.', cooldown: 3, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 1.45, paladinPath: 'verdict', paladinVirtues: ['justice'], paladinRadiant: true } }, mechanicRefs: ['paladino:virtues', 'paladino:liturgy'], scaling: paladinStrikeScaling('Justiça entra na Liturgia no início do cast.') },
    { name: 'Sabedoria Incandescente', desc: '+2% de MDEF. A eficiência por SAB das habilidades radiantes deste caminho aumenta em 20%, sem elevar o cap global de 15%.', effect: { mdefPct: 0.02 }, mechanicRefs: ['paladino:verdict'], scaling: [{ attribute: 'wis', label: 'SAB', role: 'principal', description: 'Aumenta mais rapidamente a eficiência radiante, ainda limitada a 15%.' }, { attribute: 'str', label: 'FOR', role: 'secundario', description: 'O núcleo do dano continua sendo ATK físico.' }] },
    { name: 'Peso da Justiça', desc: 'Vereditos recebem +3 pontos percentuais de penetração de DEF por Virtude no snapshot, até +9 pontos percentuais.', mechanicRefs: ['paladino:verdict', 'paladino:conviction'], scaling: paladinFixedScaling('A penetração é calculada no snapshot; não cria marca no inimigo.') },
    { name: 'Mão Firme', desc: '+1,5 ponto percentual de Crítico. Com Justiça Regente, habilidades deste caminho recebem +5% de Dano Crítico.', effect: { critPct: 0.015 }, mechanicRefs: ['paladino:regent'], scaling: [{ attribute: 'luk', label: 'SOR', role: 'secundario', description: 'Sustenta os críticos normais.' }, { label: 'Justiça', role: 'mecanica', description: 'Ser Regente ativa o Dano Crítico adicional deste caminho.' }] },
    { name: 'Sentença Certeira', desc: 'Veredito com Convicção 3 recebe +6 pontos percentuais de Precisão. Não garante acerto.', mechanicRefs: ['paladino:verdict', 'paladino:conviction'], scaling: paladinFixedScaling('Um erro ainda consome o snapshot completo.') },
    { name: 'Martelo da Justiça', desc: 'Invoca Justiça. Cause 1,75x ATK, ou 1,90x contra inimigo abaixo de 50% de Vida. Habilidade radiante. Recarga: 5 ciclos.', ability: { name: 'Martelo da Justiça', desc: 'Invoca Justiça. Cause 1,75x ATK, aumentado para 1,90x abaixo de 50% da Vida inimiga.', cooldown: 5, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 1.75, lowHpDmgMult: 1.90, paladinPath: 'verdict', paladinVirtues: ['justice'], paladinRadiant: true } }, mechanicRefs: ['paladino:virtues', 'paladino:liturgy'], scaling: paladinStrikeScaling('A Vida inimiga é lida no início do golpe.') },
    { name: 'Luz Condenatória', desc: 'Invoca Justiça. Cause 1,45x ATK radiante e, ao acertar, reduza a DEF inimiga em 8% por 2 ciclos. Recarga: 6 ciclos.', ability: { name: 'Luz Condenatória', desc: 'Invoca Justiça. Cause 1,45x ATK; ao acertar, reduza a DEF inimiga em 8% por 2 ciclos.', cooldown: 6, condition: { type: 'always' }, effect: { kind: 'statMod', dmgMult: 1.45, statMod: 'def', statModPct: -0.08, statModRounds: 2, statModTarget: 'enemy', paladinPath: 'verdict', paladinVirtues: ['justice'], paladinRadiant: true } }, mechanicRefs: ['paladino:virtues', 'paladino:liturgy'], scaling: paladinStrikeScaling('O modificador usa o canal universal de DEF do inimigo.') },
    { name: 'Precisão Sagrada', desc: '+1,5 ponto percentual de Precisão. Veredito Pleno recebe +5% de Dano Crítico.', effect: { accuracyPct: 0.015 }, mechanicRefs: ['paladino:verdict'], scaling: [{ attribute: 'dex', label: 'DES', role: 'principal', description: 'Sustenta a Precisão-base.' }, { label: 'Veredito Pleno', role: 'mecanica', description: 'Três Virtudes ativam o bônus de Dano Crítico.' }] },
    { name: 'Veredito', desc: 'VEREDITO. Requer Convicção 2. Consome as Virtudes e causa 2,25x ATK com 2 ou 2,70x com 3. Pleno com Justiça Regente: 2,95x e +12pp de penetração. Recarga: 6 ciclos.', ability: { name: 'Veredito', desc: 'Consome a Liturgia no início. Causa 2,25x ATK com 2 Virtudes ou 2,70x com 3; a Regente define a forma Plena.', cooldown: 6, condition: { type: 'resourceAtLeast', resource: 'conviction', value: 2 }, effect: { kind: 'bigHit', paladinPath: 'verdict', paladinVerdict: true, paladinRadiant: true, verdictDmgMultByConviction: { 2: 2.25, 3: 2.70 }, fullJusticeDmgMult: 2.95 } }, mechanicRefs: ['paladino:verdict', 'paladino:conviction', 'paladino:regent'], scaling: paladinStrikeScaling('Convicção e Regente são capturadas no início, mesmo se errar.') },
    { name: 'Última Sentença', desc: 'VEREDITO. Requer inimigo com 30% ou menos de Vida e Convicção 1. Causa 2,10x/2,45x/2,80x conforme 1/2/3 Virtudes; Pleno com Justiça: 3,00x. Recarga: 7 ciclos.', ability: { name: 'Última Sentença', desc: 'Consome a Liturgia no início. Finalizador sem morte instantânea: 2,10x, 2,45x ou 2,80x ATK.', cooldown: 7, condition: { type: 'all', conditions: [{ type: 'enemyHpBelow', pct: 0.30 }, { type: 'resourceAtLeast', resource: 'conviction', value: 1 }] }, effect: { kind: 'bigHit', paladinPath: 'verdict', paladinVerdict: true, paladinRadiant: true, verdictDmgMultByConviction: { 1: 2.10, 2: 2.45, 3: 2.80 }, fullJusticeDmgMult: 3.00 } }, mechanicRefs: ['paladino:verdict', 'paladino:conviction', 'paladino:regent'], scaling: paladinStrikeScaling('Não garante acerto, crítico ou execução automática.') },
    { name: 'Lei do Martelo', desc: 'Depois de Veredito Pleno com Justiça Regente, se o inimigo sobreviver, o próximo ataque básico em até 2 ciclos causa +20% de dano.', mechanicRefs: ['paladino:verdict', 'paladino:regent'], scaling: paladinFixedScaling('O ataque básico não invoca Virtude nem inicia Liturgia.') },
  ]),
  buildPath('paladino', 'luz', 'Redenção', '#d8c27a', [
    { name: 'Sabedoria Benigna', desc: '+2% de MDEF. Abaixo de 50% de Vida, curas próprias ativas do Paladino recebem +4% de eficiência final.', effect: { mdefPct: 0.02 }, mechanicRefs: ['paladino:virtues'], scaling: paladinHealScaling('O bônus não afeta Roubo de Vida, regeneração nem curas passivas.') },
    { name: 'Fôlego Misericordioso', desc: '+8 de Vida Máxima. VIT aumenta curas deste caminho baseadas na Vida Máxima em 0,08pp por ponto, até +3pp.', effect: { maxHpFlat: 8 }, mechanicRefs: ['paladino:virtues'], scaling: paladinHealScaling('O bônus é limitado e não transforma o Paladino em curador principal.') },
    { name: 'Ritmo da Prece', desc: '-3% de Recarga somente para habilidades paladino:luz.', mechanicRefs: ['paladino:liturgy'], scaling: paladinFixedScaling('A redução é restrita ao caminho Redenção.') },
    { name: 'Luz Interior', desc: '+1,5% de Roubo de Vida. Durante Liturgia com Misericórdia ativa, +1% adicional, respeitando o cap global.', effect: { lifestealPct: 0.015 }, mechanicRefs: ['paladino:liturgy', 'paladino:virtues'], scaling: [{ attribute: 'wis', label: 'SAB', role: 'secundario', description: 'Sustenta a identidade sagrada sem usar MATK.' }, { label: 'Misericórdia', role: 'mecanica', description: 'Estar ativa durante a Liturgia concede o bônus condicional.' }] },
    { name: 'Golpe da Misericórdia', desc: 'Invoca Misericórdia. Cause 1,15x ATK e, ao acertar, cure 18% do dano realmente causado. Recarga: 4 ciclos.', ability: { name: 'Golpe da Misericórdia', desc: 'Invoca Misericórdia. Cause 1,15x ATK e cure 18% do dano efetivamente causado.', cooldown: 4, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 1.15, paladinPath: 'redemption', paladinVirtues: ['mercy'], healFromDamagePct: 0.18 } }, mechanicRefs: ['paladino:virtues', 'paladino:liturgy'], scaling: paladinStrikeScaling('A cura usa o dano pós-mitigação e a eficiência limitada de cura própria.') },
    { name: 'Mente Serena', desc: '+2% de MDEF. SAB aumenta a eficiência das curas ativas deste caminho até o cap próprio do Paladino.', effect: { mdefPct: 0.02 }, mechanicRefs: ['paladino:virtues'], scaling: paladinHealScaling('SAB não cria MATK nem usa as fórmulas de cura do Clérigo.') },
    { name: 'Cura pelo Dever', desc: 'Uma vez por Liturgia, ao invocar Misericórdia abaixo de 60% de Vida, restaure 3% da Vida Máxima.', mechanicRefs: ['paladino:liturgy', 'paladino:virtues'], scaling: paladinHealScaling('Repetir Misericórdia na mesma Liturgia não reativa a cura.') },
    { name: 'Sangue Consagrado', desc: '+10 de Vida Máxima. Abaixo de 35% de Vida, +2% de DEF.', effect: { maxHpFlat: 10 }, mechanicRefs: ['paladino:virtues'], scaling: [{ attribute: 'vit', label: 'VIT', role: 'principal', description: 'Aumenta Vida e resistência na linha de frente.' }, { label: 'Vida baixa', role: 'mecanica', description: 'A condição ativa o bônus defensivo.' }] },
    { name: 'Misericórdia Armada', desc: 'Cura própria ativa que restaurar ao menos 8% da Vida Máxima prepara +6% de dano na próxima habilidade ofensiva direta por 2 ciclos. Não acumula.', mechanicRefs: ['paladino:virtues'], scaling: paladinHealScaling('Não é acionada por Roubo de Vida, regeneração, Escudo Vivo ou cura passiva.') },
    { name: 'Imposição das Mãos', desc: 'Requer Vida abaixo de 60%. Invoca Misericórdia e cura 14% da Vida Máxima, com escalamento limitado de SAB/VIT. Recarga: 5 ciclos.', ability: { name: 'Imposição das Mãos', desc: 'Invoca Misericórdia e cura 14% da Vida Máxima com eficiência limitada de SAB/VIT.', cooldown: 5, condition: { type: 'hpBelow', pct: 0.60 }, effect: { kind: 'heal', paladinPath: 'redemption', paladinVirtues: ['mercy'], activeHealMaxHpPct: 0.14 } }, mechanicRefs: ['paladino:virtues', 'paladino:liturgy'], scaling: paladinHealScaling('Não remove efeitos, não ressuscita e não cria barreira.') },
    { name: 'Luz Vingadora', desc: 'Invoca Misericórdia. Cause 1,45x ATK e cure 25% do dano causado; abaixo de 35% de Vida no início, cure 35%. Recarga: 6 ciclos.', ability: { name: 'Luz Vingadora', desc: 'Invoca Misericórdia. Cause 1,45x ATK e cure 25% do dano real, ou 35% se iniciou abaixo de 35% de Vida.', cooldown: 6, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 1.45, paladinPath: 'redemption', paladinVirtues: ['mercy'], healFromDamagePct: 0.25, lowHpHealFromDamagePct: 0.35, lowHpHealThreshold: 0.35 } }, mechanicRefs: ['paladino:virtues', 'paladino:liturgy'], scaling: paladinStrikeScaling('A cura é calculada depois da mitigação do dano.') },
    { name: 'Esperança Tenaz', desc: '+2% de DEF. Com Convicção 2 ou maior, +2% de MDEF.', effect: { defPct: 0.02 }, mechanicRefs: ['paladino:conviction'], scaling: [{ attribute: 'vit', label: 'VIT', role: 'principal', description: 'Aumenta defesa e Vida.' }, { label: 'Convicção', role: 'mecanica', description: 'Duas Virtudes diferentes ativam o bônus de MDEF.' }] },
    { name: 'Veredito da Redenção', desc: 'VEREDITO. Requer Convicção 2 e Vida abaixo de 70%. Não causa dano. Cura 14% da Vida Máxima com 2 Virtudes ou 21% com 3; Pleno com Misericórdia Regente cura mais 8% da Vida perdida. Recarga: 8 ciclos.', ability: { name: 'Veredito da Redenção', desc: 'Consome a Liturgia no início. Cura 14% ou 21% da Vida Máxima; a Regente define a forma Plena.', cooldown: 8, condition: { type: 'all', conditions: [{ type: 'resourceAtLeast', resource: 'conviction', value: 2 }, { type: 'hpBelow', pct: 0.70 }] }, effect: { kind: 'heal', paladinPath: 'redemption', paladinVerdict: true, verdictHealPctByConviction: { 2: 0.14, 3: 0.21 } } }, mechanicRefs: ['paladino:verdict', 'paladino:conviction', 'paladino:regent'], scaling: paladinHealScaling('O snapshot é consumido antes da cura; excesso normal é perdido.') },
    { name: 'Luz que Não Cede', desc: 'Invoca Misericórdia e causa 1,30x ATK. Ao acertar, cura 8% da Vida Máxima. Abaixo de 40% de Vida no início, também invoca Coragem. Recarga: 7 ciclos.', ability: { name: 'Luz que Não Cede', desc: 'Invoca Misericórdia e causa 1,30x ATK; ao acertar, cura 8% da Vida Máxima. Em emergência, também invoca Coragem.', cooldown: 7, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 1.30, paladinPath: 'redemption', paladinVirtues: ['mercy'], paladinExtraVirtueBelowHp: { virtue: 'courage', pct: 0.40 }, activeHealMaxHpPct: 0.08 } }, mechanicRefs: ['paladino:virtues', 'paladino:liturgy', 'paladino:regent'], scaling: paladinStrikeScaling('Coragem é adicionada depois de Misericórdia e se torna a Regente na emergência.') },
    { name: 'Misericórdia Perfeita', desc: 'Depois de Veredito Pleno com Misericórdia Regente que restaure ao menos 15% da Vida Máxima, reduza em 1 ciclo a habilidade de Redenção equipada de maior prioridade em recarga.', mechanicRefs: ['paladino:verdict', 'paladino:regent'], scaling: paladinFixedScaling('No máximo uma redução por Veredito.') },
  ]),
];

export function unlockedCountInPath(path: SkillPath, unlocked: string[]): number {
  return path.nodes.filter((n) => unlocked.includes(n.id)).length;
}

// A node is unlockable once the player has a free point and either it's a
// root (no prereqs) or AT LEAST ONE of its prereqs is already unlocked — OR
// logic is what makes the tree genuinely branch instead of forcing a single
// forced order, so a player can commit to one column all the way to a
// tier-5 capstone without ever touching the other branches.
export function canUnlockNode(node: SkillNode, unlocked: string[]): boolean {
  if (unlocked.includes(node.id)) return false;
  if (node.prereqIds.length === 0) return true;
  return node.prereqIds.some((id) => unlocked.includes(id));
}

export function computeSkillBonuses(classId: ClassId, unlocked: string[]): Required<Omit<SkillEffect, 'dmgPctVsStatus'>> & { dmgPctVsPoison: number; dmgPctVsBurn: number } {
  const totals = {
    dmgPct: 0, defPct: 0, mdefPct: 0, critPct: 0, critDmgPct: 0, blockChance: 0,
    flatBonusDmg: 0, flatBonusMagicDmg: 0, magicDmgPct: 0, lowHpDmgScale: 0,
    maxHpFlat: 0, lifestealPct: 0, thornsPct: 0, onCritHealPct: 0,
    evasionPct: 0, accuracyPct: 0, cooldownReductionPct: 0,
    dmgPctVsPoison: 0, dmgPctVsBurn: 0,
  };
  for (const path of SKILL_TREES[classId]) {
    for (const n of path.nodes) {
      if (!unlocked.includes(n.id)) continue;
      totals.dmgPct += n.effect.dmgPct ?? 0;
      totals.defPct += n.effect.defPct ?? 0;
      totals.mdefPct += n.effect.mdefPct ?? 0;
      totals.critPct += n.effect.critPct ?? 0;
      totals.critDmgPct += n.effect.critDmgPct ?? 0;
      totals.blockChance += n.effect.blockChance ?? 0;
      totals.flatBonusDmg += n.effect.flatBonusDmg ?? 0;
      totals.flatBonusMagicDmg += n.effect.flatBonusMagicDmg ?? 0;
      totals.magicDmgPct += n.effect.magicDmgPct ?? 0;
      totals.lowHpDmgScale += n.effect.lowHpDmgScale ?? 0;
      totals.maxHpFlat += n.effect.maxHpFlat ?? 0;
      totals.lifestealPct += n.effect.lifestealPct ?? 0;
      totals.thornsPct += n.effect.thornsPct ?? 0;
      totals.onCritHealPct += n.effect.onCritHealPct ?? 0;
      totals.evasionPct += n.effect.evasionPct ?? 0;
      totals.accuracyPct += n.effect.accuracyPct ?? 0;
      totals.cooldownReductionPct += n.effect.cooldownReductionPct ?? 0;
      if (n.effect.dmgPctVsStatus?.status === 'poison') totals.dmgPctVsPoison += n.effect.dmgPctVsStatus.pct;
      if (n.effect.dmgPctVsStatus?.status === 'burn') totals.dmgPctVsBurn += n.effect.dmgPctVsStatus.pct;
    }
  }
  return totals;
}

// Druida — O Ciclo Vivo.  Defined after the legacy table so the redesign is
// the single source used by saves/loadouts while preserving every node id.
const druidNode = (path: string, i: number, name: string, desc: string, active?: AbilityDef): SkillNode => { const e:any={}; if(!active){if(path==='cura-natural'){if([0,5,7,9,11].includes(i))e.maxHpFlat=i===0||i===7?8:6;if([1,11].includes(i))e.mdefPct=0.02;if(i===2)e.tenacityPct=0.02;if(i===3)e.cooldownReductionPct=0.03;if(i===5)e.defPct=0.02;if(i===6)e.lifestealPct=0.0;} if(path==='furia-natureza'){if(i===0)e.magicDmgPct=0.02;if(i===1)e.maxHpFlat=8;if(i===2)e.accuracyPct=0.015;if(i===3)e.cooldownReductionPct=0.03;if(i===5)e.defPct=0.02;if(i===7)e.speedPct=0.015;if(i===11)e.mdefPct=0.02;} if(path==='equilibrio'){if(i===0||i===11)e.mdefPct=0.02;if(i===1)e.accuracyPct=0.015;if(i===2)e.maxHpFlat=8;if(i===3)e.cooldownReductionPct=0.03;if(i===5)e.defPct=0.02;if(i===7)e.magicDmgPct=0.02;}} return {id:`druida:${path}:${i}`,prereqIds:i<3?[]:[`druida:${path}:${i-3}`],type:active?'active':(i===6||i===8||i===14?'passive':'attribute'),name,desc,effect:e,ability:active}; };
const druidAbility = (path:string,i:number,name:string,desc:string,effect:any):AbilityDef => { const season=i===4?'spring':i===9?'summer':i===10?'autumn':i===12?'winter':'cycle'; const action=path==='cura-natural'?(i===4?'seed':i===10?'harvest':i===12?'winter':i===13?'cycle':undefined):path==='furia-natureza'?(i===13?'cycle':'form'):(i===13?'cycle':'equilibrium'); let e={...effect,druidSeason:season,druidAction:action}; if(path==='cura-natural'&&i===4)e={...e,kind:'heal',healPct:0.06}; if(path==='cura-natural'&&i===9)e={...e,kind:'bigHit',dmgMult:1.20,healFromDamagePct:0.18,healFromDamageCapPct:0.05}; if(path==='cura-natural'&&i===10)e={...e,kind:'bigHit',dmgMult:1.10}; if(path==='cura-natural'&&i===12)e={...e,kind:'regen',regenPct:0.04,regenRounds:3}; if(path==='cura-natural'&&i===13)e={...e,kind:'heal',healPct:0.08}; if(path==='furia-natureza'&&i===9)e={...e,kind:'multiHit',hitCount:2,dmgMultPerHit:0.62}; if(path==='furia-natureza'&&i===10)e={...e,kind:'bigHit',dmgMult:1.70}; if(path==='furia-natureza'&&i===12)e={...e,kind:'bigHit',dmgMult:1.40}; if(path==='furia-natureza'&&i===13)e={...e,kind:'bigHit',dmgMult:2.00}; if(path==='equilibrio'&&i===4)e={...e,kind:'bigHit',dmgMult:1.25}; if(path==='equilibrio'&&i===9)e={...e,kind:'bigHit',dmgMult:1.60}; if(path==='equilibrio'&&i===10)e={...e,kind:'multiHit',hitCount:2,dmgMultPerHit:0.60}; if(path==='equilibrio'&&i===12)e={...e,kind:'bigHit',dmgMult:1.20}; if(path==='equilibrio'&&i===13)e={...e,kind:'multiHit',hitCount:4,dmgMultPerHit:0.45}; return { id:`druida:${path}:${i}`, name, desc, cooldown:i===12?5:i===13?9:4, condition:{type:'always'}, effect:e}; };
const druidPath=(path:string,display:string,color:string,names:string[])=>buildPath('druida',path,display,color,names.map((n,i)=>{if(![4,9,10,12,13].includes(i))return druidNode(path,i,n,`Ação do Ciclo Vivo: ${n}.`);const e=i===4?{kind:'heal',healPct:0.18}:i===9?{kind:'bigHit',dmgMult:2.0}:i===10?{kind:'regen',regenPct:0.06,regenRounds:3}:i===12?{kind:'guaranteedCrit',dmgMult:2.4}:{kind:'bigHit',dmgMult:3.0};return druidNode(path,i,n,`Ação do Ciclo Vivo: ${n}.`,druidAbility(path,i,n,`Usa a Estação e a Sintonia atual.`,e));}));
SKILL_TREES.druida=[
  druidPath('cura-natural','Renascimento','#3f8a5a',['Raiz Vital','Seiva Sábia','Broto Resiliente','Cultivo Paciente','Semente da Vida','Vigor Verdejante','Jardim Vivo','Copa Protetora','Fruto Maduro','Colheita Restauradora','Casca Regenerativa','Vida Profunda','Renovo','Ano Perfeito','Nada se Perde']),
  druidPath('furia-natureza','Metamorfose','#8a3a2a',['Instinto do Cervo','Garras Naturais','Pele Selvagem','Forma Adaptável','Investida do Cervo','Músculos de Lobo','Fúria da Forma','Caçada Incansável','Forma do Urso','Rugido Primordial','Forma da Coruja','Olhos Noturnos','Predador Sazonal','Avatar Bestial','Instinto Ancestral']),
  druidPath('equilibrio','Equilíbrio','#4f7a3a',['Centro Interior','Sopro Equilibrado','Ritual Cíclico','Passo Sazonal','Pulso do Equinócio','Harmonia','Descompasso','Maré de Equilíbrio','Reequilíbrio','Balanço Natural','Convergência','Sintonia Profunda','Círculo Perfeito','Retorno ao Centro','Equilíbrio Vivo']),
];

// Primary-attribute totals = the class's level-1 head start (baseAttrs) plus
// whatever the player has freely spent their attributePoints on
// (allocatedAttrs) — the skill tree no longer grants primary attributes at
// all, only secondary stats (see the 'attribute'-type nodes above).
export function computeAttributeTotals(classId: ClassId, allocatedAttrs: Attributes): Attributes {
  const base = CLASSES[classId].baseAttrs;
  const totals: Attributes = { str: 0, dex: 0, agi: 0, vit: 0, int: 0, wis: 0, luk: 0 };
  for (const key of Object.keys(totals) as AttributeKey[]) {
    totals[key] = (base[key] ?? 0) + allocatedAttrs[key];
  }
  return totals;
}

// Active abilities the player has unlocked (i.e. "knows"), in tree order —
// these still need to be equipped into a combat loadout before they do
// anything (see getEquippedAbilities below).
export function getUnlockedAbilities(classId: ClassId, unlocked: string[]): AbilityDef[] {
  const abilities: AbilityDef[] = [];
  for (const path of SKILL_TREES[classId]) {
    for (const n of path.nodes) {
      if (n.type === 'active' && n.ability && unlocked.includes(n.id)) abilities.push(n.ability);
    }
  }
  return abilities;
}

// ── Bruxo: Dívida Profana (redesign definitivo) ──────────────────────────
const warlockScale = (mechanic: string, attribute: AttributeKey = 'int'): ScalingEntry[] => [
  { attribute, label: attribute === 'int' ? 'INT' : attribute.toUpperCase(), role: 'principal', description: attribute === 'int' ? 'Aumenta o MATK usado pela habilidade; não é somada novamente ao multiplicador.' : 'Interage com a defesa e a resistência do Bruxo.' },
  { label: mechanic, role: 'mecanica', description: 'Recurso mecânico; o valor é capturado no início do cast e respeita os limites do prompt.' },
];
const warlockFixedScale = (mechanic: string): ScalingEntry[] => [
  { label: mechanic, role: 'mecanica', description: 'Estado do contrato; não escala diretamente com atributo.' },
  { attribute: 'int', label: 'INT', role: 'principal', description: 'Aumenta o MATK usado pela habilidade; não é somada novamente ao multiplicador.' },
];
SKILL_TREES.bruxo = [
  buildPath('bruxo', 'maldicao', 'NOME PROIBIDO', '#4a2a5a', [
    { name: 'Olhar por Trás do Véu', desc: '+1,5pp Precisão; contra inimigo Vinculado, +2pp adicionais.', effect: { accuracyPct: 0.015 }, mechanicRefs: ['bruxo:binding'], scaling: warlockScale('Vínculo', 'dex') },
    { name: 'Caligrafia Profana', desc: '+2% de dano mágico direto de Nome Proibido; com Nome Verdadeiro, +2% adicionais.', effect: { magicDmgPct: 0.02 }, mechanicRefs: ['bruxo:true-name'], scaling: warlockScale('Nome Verdadeiro') },
    { name: 'Pele do Segredo', desc: '+2% MDEF; enquanto o inimigo estiver Vinculado, +2% DEF.', effect: { mdefPct: 0.02 }, mechanicRefs: ['bruxo:binding'], scaling: warlockScale('Vínculo', 'wis') },
    { name: 'Ritual Abreviado', desc: '-3% de Recarga somente para habilidades de Nome Proibido.', effect: { cooldownReductionPct: 0.03 }, mechanicRefs: ['bruxo:debt'], scaling: warlockScale('Recarga') },
    { name: 'Selo do Nome', desc: '1,25x MATK, gera 1 Dívida e aplica Vínculo ao acertar. Recarga: 3 ciclos.', mechanicRefs: ['bruxo:debt','bruxo:binding'], scaling: warlockScale('Dívida'), ability: { name: 'Selo do Nome', desc: '1,25x MATK; gera Dívida e aplica Vínculo.', cooldown: 3, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgType: 'magical', dmgMult: 1.25, warlockPath: 'maldicao', warlockDebtGain: 1, warlockBindOnHit: true } } },
    { name: 'Pronúncia Exata', desc: '+3% Dano Crítico; contra Nome Verdadeiro, +2pp de Crítico.', effect: { critDmgPct: 0.03 }, mechanicRefs: ['bruxo:true-name'], scaling: warlockScale('Nome Verdadeiro','luk') },
    { name: 'Fragmentos do Nome', desc: 'Desbloqueia Fragmentos do Nome de 0 a 3: acerto de Nome e ação real do alvo Vinculado geram fragmentos.', mechanicRefs: ['bruxo:true-name'], scaling: warlockFixedScale('Fragmentos do Nome') },
    { name: 'Anatomia da Alma', desc: 'Contra Vinculado, +4% penetração de MDEF e +0,08% por INT, até +7%.', mechanicRefs: ['bruxo:binding'], scaling: warlockScale('Vínculo') },
    { name: 'Primeira Letra', desc: 'A primeira habilidade de Nome Proibido que acerta cada inimigo gera 1 Fragmento adicional.', mechanicRefs: ['bruxo:true-name'], scaling: warlockFixedScale('Fragmentos do Nome') },
    { name: 'Exigir Tributo', desc: 'Requer Nome Verdadeiro e Dívida ≥1. Consome 3 Fragmentos, causa 1,55x MATK e reduz Dívida em 2 mesmo se errar. Recarga: 4.', mechanicRefs: ['bruxo:true-name','bruxo:debt'], scaling: warlockScale('Dívida'), ability: { name: 'Exigir Tributo', desc: 'Consome Nome Verdadeiro; 1,55x MATK e paga 2 Dívidas.', cooldown: 4, condition: { type: 'all', conditions: [{ type: 'resourceAtLeast', resource: 'debt', value: 1 }, { type: 'stateActive', state: 'trueName' }] }, effect: { kind: 'bigHit', dmgType: 'magical', dmgMult: 1.55, warlockPath: 'maldicao', warlockDebtPay: 2, warlockConsumeTrueName: true, warlockBindOnHit: true } } },
    { name: 'Mandamento de Fraqueza', desc: '1,45x MATK, gera Dívida e, ao acertar, reduz em 10% o dano direto da próxima ação inimiga. Recarga: 5.', mechanicRefs: ['bruxo:deadline','bruxo:binding'], scaling: warlockScale('Prazo Final'), ability: { name: 'Mandamento de Fraqueza', desc: '1,45x MATK e Mandamento na próxima ação inimiga.', cooldown: 5, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgType: 'magical', dmgMult: 1.45, warlockPath: 'maldicao', warlockDebtGain: 1, warlockBindOnHit: true, warlockNextEnemyDmgReductionPct: 0.10 } } },
    { name: 'Memória Proibida', desc: '+8 Vida Máxima. Consumir Nome Verdadeiro prepara -4% dano direto recebido até a próxima ação inimiga.', effect: { maxHpFlat: 8 }, mechanicRefs: ['bruxo:true-name'], scaling: warlockScale('Nome Verdadeiro','vit') },
    { name: 'Palavra Proibida', desc: 'Requer e consome Nome Verdadeiro. 1,90x MATK, gera Dívida e aplica Silêncio por 1 ciclo ao acertar. Recarga: 7.', mechanicRefs: ['bruxo:true-name','bruxo:debt'], scaling: warlockScale('Nome Verdadeiro'), ability: { name: 'Palavra Proibida', desc: '1,90x MATK; silencia por 1 ciclo.', cooldown: 7, condition: { type: 'stateActive', state: 'trueName' }, effect: { kind: 'crowdControl', dmgType: 'magical', dmgMult: 1.90, cc: 'silence', ccRounds: 1, warlockPath: 'maldicao', warlockDebtGain: 1, warlockConsumeTrueName: true, warlockBindOnHit: true } } },
    { name: 'Apagar o Nome', desc: 'Requer Nome Verdadeiro e Dívida ≥1. Consome 3 Fragmentos, causa 2,55x MATK, +15% penetração de MDEF e paga 3 Dívidas mesmo no erro. Recarga: 9.', mechanicRefs: ['bruxo:true-name','bruxo:debt'], scaling: warlockScale('Dívida'), ability: { name: 'Apagar o Nome', desc: '2,55x MATK e +15% penetração; paga 3 Dívidas.', cooldown: 9, condition: { type: 'all', conditions: [{ type: 'resourceAtLeast', resource: 'debt', value: 1 }, { type: 'stateActive', state: 'trueName' }] }, effect: { kind: 'bigHit', dmgType: 'magical', dmgMult: 2.55, warlockMdefPenPct: 0.15, warlockPath: 'maldicao', warlockDebtPay: 3, warlockConsumeTrueName: true, warlockBindOnHit: true } } },
    { name: 'Assinatura Falsa', desc: 'Ao consumir Nome Verdadeiro, cancela a próxima geração de Dívida antes do Crédito.', mechanicRefs: ['bruxo:forgery'], scaling: warlockFixedScale('Assinatura Falsa') },
  ]),
  buildPath('bruxo', 'pacto', 'NEGOCIAÇÃO', '#5b5f6a', [
    { name: 'Margem de Segurança', desc: '+8 Vida Máxima.', effect: { maxHpFlat: 8 }, mechanicRefs: ['bruxo:credit'], scaling: warlockScale('Vida Máxima','vit') },
    { name: 'Sangue Frio', desc: '+2% MDEF; com Dívida ≥4, +2% MDEF adicionais.', effect: { mdefPct: 0.02 }, mechanicRefs: ['bruxo:debt'], scaling: warlockScale('Dívida','wis') },
    { name: 'Garantia Oculta', desc: '+2pp Tenacidade.', effect: {}, mechanicRefs: ['bruxo:credit'], scaling: warlockScale('Tenacidade','vit') },
    { name: 'Termos Ágeis', desc: '-3% de Recarga somente para habilidades de Negociação.', effect: { cooldownReductionPct: 0.03 }, mechanicRefs: ['bruxo:credit'], scaling: warlockScale('Recarga') },
    { name: 'Escudo do Fiador', desc: '1,20x MATK, gera Dívida e cria barreira de 7% da Vida Máxima após resolver. Recarga: 4.', mechanicRefs: ['bruxo:credit','bruxo:debt'], scaling: warlockScale('Crédito'), ability: { name: 'Escudo do Fiador', desc: '1,20x MATK e barreira de 7%.', cooldown: 4, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgType: 'magical', dmgMult: 1.20, warlockPath: 'pacto', warlockDebtGain: 1, warlockBarrierPct: 0.07 } } },
    { name: 'Juros Sob Controle', desc: '+2% DEF; enquanto possuir Crédito, +2% MDEF.', effect: { defPct: 0.02 }, mechanicRefs: ['bruxo:credit'], scaling: warlockScale('Crédito','wis') },
    { name: 'Crédito Sombrio', desc: 'Desbloqueia Crédito de 0 a 2 (ou 3 com Advogado do Abismo).', mechanicRefs: ['bruxo:credit'], scaling: warlockFixedScale('Crédito Sombrio') },
    { name: 'Cláusula de Proteção', desc: '+6 Vida Máxima; barreiras de Negociação recebem +0,10% por SAB, até +4%.', effect: { maxHpFlat: 6 }, mechanicRefs: ['bruxo:credit'], scaling: warlockScale('Barreiras','wis') },
    { name: 'Bom Pagador', desc: 'Crédito que cancela Dívida concede +5% dano mágico direto e +5% à barreira do cast financiado.', mechanicRefs: ['bruxo:credit'], scaling: warlockFixedScale('Crédito Sombrio') },
    { name: 'Renegociar Termos', desc: 'Requer Dívida ≥2. 1,25x MATK, paga 2 Dívidas, gera Crédito e reduz dano direto recebido em 8% por 2 ciclos. Recarga: 5.', mechanicRefs: ['bruxo:credit','bruxo:debt'], scaling: warlockScale('Crédito'), ability: { name: 'Renegociar Termos', desc: '1,25x MATK; paga 2 Dívidas e prepara proteção.', cooldown: 5, condition: { type: 'resourceAtLeast', resource: 'debt', value: 2 }, effect: { kind: 'bigHit', dmgType: 'magical', dmgMult: 1.25, warlockPath: 'pacto', warlockDebtPay: 2, warlockGrantCredits: 1, warlockNextEnemyDmgReductionPct: 0.08 } } },
    { name: 'Cláusula de Sangue', desc: 'Requer Dívida ≥3. Paga 6% da Vida Máxima em HP no início, causa 1,70x MATK, paga 3 Dívidas e gera Crédito. Recarga: 6.', mechanicRefs: ['bruxo:credit','bruxo:debt'], scaling: warlockScale('Dívida'), ability: { name: 'Cláusula de Sangue', desc: 'Paga 6% HP; 1,70x MATK e quita 3 Dívidas.', cooldown: 6, condition: { type: 'resourceAtLeast', resource: 'debt', value: 3 }, effect: { kind: 'bigHit', dmgType: 'magical', dmgMult: 1.70, warlockPath: 'pacto', warlockDebtPay: 3, warlockGrantCredits: 1, warlockSelfHpCostPct: 0.06 } } },
    { name: 'Reserva Contratual', desc: '+8 Vida Máxima; após pagar ≥1 Dívida, recebe -4% dano direto até a próxima ação inimiga.', effect: { maxHpFlat: 8 }, mechanicRefs: ['bruxo:debt'], scaling: warlockScale('Dívida','vit') },
    { name: 'Empréstimo Abissal', desc: '2,00x MATK, gera Dívida e cria barreira de 10% da Vida Máxima. Recarga: 7.', mechanicRefs: ['bruxo:credit','bruxo:debt'], scaling: warlockScale('Crédito'), ability: { name: 'Empréstimo Abissal', desc: '2,00x MATK e barreira de 10%.', cooldown: 7, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgType: 'magical', dmgMult: 2.00, warlockPath: 'pacto', warlockDebtGain: 1, warlockBarrierPct: 0.10 } } },
    { name: 'Contrato Irrevogável', desc: 'Requer Dívida ≥5. 2,05x MATK usando Dívida pré-pagamento; depois fixa Dívida em 1 e concede 2 Créditos. Recarga: 10.', mechanicRefs: ['bruxo:debt','bruxo:credit'], scaling: warlockScale('Dívida'), ability: { name: 'Contrato Irrevogável', desc: '2,05x MATK; fixa Dívida em 1 e concede 2 Créditos.', cooldown: 10, condition: { type: 'resourceAtLeast', resource: 'debt', value: 5 }, effect: { kind: 'bigHit', dmgType: 'magical', dmgMult: 2.05, warlockPath: 'pacto', warlockDebtSetAfter: 1, warlockGrantCredits: 2 } } },
    { name: 'Advogado do Abismo', desc: 'Aumenta o limite de Crédito para 3; Crédito cancelando Dívida mantém o poder como se +1 Dívida existisse.', mechanicRefs: ['bruxo:credit'], scaling: warlockFixedScale('Crédito Sombrio') },
  ]),
  buildPath('bruxo', 'corrupcao', 'TRANSGRESSÃO', '#c89a2e', [
    { name: 'Poder que Vaza', desc: '+2% dano mágico direto de Transgressão.', effect: { magicDmgPct: 0.02 }, mechanicRefs: ['bruxo:scars'], scaling: warlockScale('Estigmas') },
    { name: 'Olhos Marcados', desc: '+1,5pp Precisão; com 2+ Estigmas, +2pp adicionais.', effect: { accuracyPct: 0.015 }, mechanicRefs: ['bruxo:scars'], scaling: warlockScale('Estigmas','dex') },
    { name: 'Pele Cicatrizada', desc: '+2% MDEF; a penalidade dos Estigmas é aplicada depois.', effect: { mdefPct: 0.02 }, mechanicRefs: ['bruxo:scars'], scaling: warlockScale('Estigmas','wis') },
    { name: 'Ritual sem Freio', desc: '-3% de Recarga somente para habilidades de Transgressão.', effect: { cooldownReductionPct: 0.03 }, mechanicRefs: ['bruxo:scars'], scaling: warlockScale('Recarga') },
    { name: 'Fenda no Contrato', desc: '1,35x MATK, gera Dívida e recebe +5% dano direto se DebtForPower ≥5. Recarga: 3.', mechanicRefs: ['bruxo:debt','bruxo:scars'], scaling: warlockScale('Dívida'), ability: { name: 'Fenda no Contrato', desc: '1,35x MATK; gera Dívida e amplifica com dívida alta.', cooldown: 3, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgType: 'magical', dmgMult: 1.35, warlockPath: 'corrupcao', warlockDebtGain: 1 } } },
    { name: 'Vaso Imperfeito', desc: '+8 Vida Máxima.', effect: { maxHpFlat: 8 }, mechanicRefs: ['bruxo:scars'], scaling: warlockScale('Vida Máxima','vit') },
    { name: 'Estigmas', desc: 'Desbloqueia Estigmas 0 a 3: cada Cobrança real ≥5% da Vida Máxima gera 1, +3% dano de Transgressão e -2% MDEF.', mechanicRefs: ['bruxo:scars'], scaling: warlockFixedScale('Estigmas') },
    { name: 'Dor Familiar', desc: '+3% Dano Crítico; com 3 Estigmas, +3% adicionais.', effect: { critDmgPct: 0.03 }, mechanicRefs: ['bruxo:scars'], scaling: warlockScale('Estigmas','luk') },
    { name: 'A Cicatriz Ensina', desc: 'Cobrança que cria Estigma prepara +8% dano na próxima habilidade normal de Transgressão.', mechanicRefs: ['bruxo:scars'], scaling: warlockFixedScale('Insight da Cicatriz') },
    { name: 'Cobrança Antecipada', desc: 'Requer Dívida ≥4. 1,60x MATK, depois cobra 7% da Vida Máxima e paga 2 Dívidas mesmo no erro. Recarga: 5.', mechanicRefs: ['bruxo:debt','bruxo:scars'], scaling: warlockScale('Cobrança'), ability: { name: 'Cobrança Antecipada', desc: '1,60x MATK; cobrança de 7% e quitação de 2 Dívidas.', cooldown: 5, condition: { type: 'resourceAtLeast', resource: 'debt', value: 4 }, effect: { kind: 'bigHit', dmgType: 'magical', dmgMult: 1.60, warlockPath: 'corrupcao', warlockDebtPay: 2, warlockEarlyCollectionPct: 0.07 } } },
    { name: 'Carne como Pergaminho', desc: '1,75x MATK, gera Dívida e recebe +3% dano direto por Estigma no início do cast. Recarga: 5.', mechanicRefs: ['bruxo:scars','bruxo:debt'], scaling: warlockScale('Estigmas'), ability: { name: 'Carne como Pergaminho', desc: '1,75x MATK com bônus por Estigma.', cooldown: 5, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgType: 'magical', dmgMult: 1.75, warlockPath: 'corrupcao', warlockDebtGain: 1, warlockDmgMultPerScar: 0.03 } } },
    { name: 'Vozes sob a Pele', desc: '+2pp Tenacidade; após sofrer Cobrança, +3pp até a próxima ação inimiga.', effect: {}, mechanicRefs: ['bruxo:scars'], scaling: warlockScale('Estigmas','vit') },
    { name: 'Devorar Cicatrizes', desc: 'Requer ≥1 Estigma. Consome todos no início, causa 1,50x +0,30x por Estigma e gera Dívida. Recarga: 7.', mechanicRefs: ['bruxo:scars','bruxo:debt'], scaling: warlockScale('Estigmas'), ability: { name: 'Devorar Cicatrizes', desc: 'Consome Estigmas para dano crescente.', cooldown: 7, condition: { type: 'resourceAtLeast', resource: 'scars', value: 1 }, effect: { kind: 'bigHit', dmgType: 'magical', dmgMult: 1.50, warlockPath: 'corrupcao', warlockDebtGain: 1, warlockConsumeScars: true, warlockDmgMultPerScar: 0.30 } } },
    { name: 'A Voz que Responde', desc: 'Requer 3 Estigmas, Dívida ≥5 e HP para Cobrança. Consome Estigmas, desfere 3 impactos de 0,85x, cobra 12%, fixa Dívida em 3 e ecoa o HP pago no inimigo. Recarga: 10.', mechanicRefs: ['bruxo:scars','bruxo:debt'], scaling: warlockScale('Cobrança'), ability: { name: 'A Voz que Responde', desc: '3 impactos de 0,85x, Cobrança Forçada de 12% e Eco do Preço.', cooldown: 10, condition: { type: 'all', conditions: [{ type: 'resourceAtLeast', resource: 'scars', value: 3 }, { type: 'resourceAtLeast', resource: 'debt', value: 5 }] }, effect: { kind: 'multiHit', hitCount: 3, dmgMultPerHit: 0.85, dmgType: 'magical', warlockPath: 'corrupcao', warlockConsumeScars: true, warlockForcedCollectionPct: 0.12, warlockDebtSetAfter: 3, warlockCollectionEchoPct: 1 } } },
    { name: 'Sem Volta', desc: 'Começando com 3 Estigmas, Poder Emprestado usa 2% por Dívida e Sobrecontrato recebe +20% dano.', mechanicRefs: ['bruxo:scars'], scaling: warlockFixedScale('Estigmas') },
  ]),
];

// Feiticeiro — RUPTURA / REVERBERAÇÃO / MOLDAGEM (definitive tree).
const sorcererScale = (mechanic: string, attr: AttributeKey = 'int'): ScalingEntry[] => [
  { attribute: attr, label: attr.toUpperCase(), role: 'principal', description: 'Aumenta o MATK usado pela magia.' },
  { label: mechanic, role: 'mecanica', description: 'Mecânica capturada no início do cast e resolvida uma vez por ação.' },
];
const sorcererFixed = (mechanic: string): ScalingEntry[] => [{ label: mechanic, role: 'mecanica', description: 'Estado do Feiticeiro; respeita os limites do prompt.' }, { attribute: 'int', label: 'INT', role: 'principal', description: 'Aumenta o MATK da habilidade.' }];
const sActive = (name: string, desc: string, cooldown: number, effect: AbilityEffect, condition: AbilityDef['condition'] = { type: 'always' }) => ({ ability: { name, desc, cooldown, condition, effect } });
SKILL_TREES.feiticeiro = [
  buildPath('feiticeiro', 'explosao', 'RUPTURA', '#a03fb8', [
    { name:'Pressão Interior', desc:'+2% dano mágico direto de Ruptura; com Pulso ≥4, +2% adicionais.', effect:{ magicDmgPct:0.02 }, scaling:sorcererScale('Pulso Inato'), mechanicRefs:['feiticeiro:pulse'] },
    { name:'Alvo de Impacto', desc:'+1,5pp Precisão; Magia Intensificada recebe +1,5pp.', effect:{ accuracyPct:0.015 }, scaling:sorcererScale('Precisão'), mechanicRefs:['feiticeiro:awakened'] },
    { name:'Núcleo Supercrítico', desc:'+3% Dano Crítico; Intensificada recebe +3% adicionais.', effect:{ critDmgPct:0.03 }, scaling:sorcererScale('Crítico'), mechanicRefs:['feiticeiro:awakened'] },
    { name:'Ritmo de Ruptura', desc:'-3% Recarga somente para habilidades de Ruptura.', effect:{ cooldownReductionPct:0.03 }, scaling:sorcererFixed('Recarga') },
    { name:'Impacto de Origem', desc:'1,35x MATK. Recarga 3. Desperta fica Intensificada.', ...sActive('Impacto de Origem','1,35x MATK.',3,{kind:'bigHit',dmgType:'magical',dmgMult:1.35,sorcererPath:'rupture',sorcererAwakenedMode:'intensified',sorcererFractureGain:1}), scaling:sorcererScale('Fraturas') },
    { name:'Tensão Crescente', desc:'+1,5pp Crítico; com Pulso ≥4, +1,5pp.', effect:{ critPct:0.015 }, scaling:sorcererScale('Pulso Inato') },
    { name:'Fratura Arcana', desc:'Desbloqueia Fraturas 0–3; Ruptura Desperta acertada gera +1.', effect:{}, mechanicRefs:['feiticeiro:fracture'], scaling:sorcererFixed('Fraturas') },
    { name:'Matriz Trincada', desc:'+2% dano direto de Ruptura; com 3 Fraturas, +3%.', effect:{ magicDmgPct:0.02 }, mechanicRefs:['feiticeiro:fracture'], scaling:sorcererScale('Fraturas') },
    { name:'Rachadura Espontânea', desc:'Primeiro crítico de Ruptura por inimigo gera +1 Fratura.', effect:{}, mechanicRefs:['feiticeiro:fracture'] },
    { name:'Compressão Violenta', desc:'1,55x +0,08x por Fratura no início. Recarga 4.', ...sActive('Compressão Violenta','1,55x MATK mais Fraturas.',4,{kind:'bigHit',dmgType:'magical',dmgMult:1.55,sorcererPath:'rupture',sorcererAwakenedMode:'intensified',sorcererThirdHitBonusPerFracture:0.08}), scaling:sorcererScale('Fraturas') },
    { name:'Ruptura Gêmea', desc:'Dois impactos independentes de 0,80x. Recarga 5.', ...sActive('Ruptura Gêmea','Dois impactos de 0,80x MATK.',5,{kind:'multiHit',dmgType:'magical',hitCount:2,dmgMultPerHit:0.80,sorcererPath:'rupture',sorcererAwakenedMode:'intensified'}), scaling:sorcererScale('Multi-hit') },
    { name:'Limiar do Colapso', desc:'+4% Dano Crítico; contra 3 Fraturas, +2pp Crítico.', effect:{ critDmgPct:0.04 }, mechanicRefs:['feiticeiro:fracture'] },
    { name:'Ponto de Colapso', desc:'Consome Fraturas; 1,55x +0,25x por stack. Recarga 7.', ...sActive('Ponto de Colapso','Consome todas as Fraturas.',7,{kind:'bigHit',dmgType:'magical',dmgMult:1.55,sorcererPath:'rupture',sorcererFractureConsume:3,sorcererAwakenedMode:'intensified'},{ type:'enemyStacksAtLeast', stackId:'fracture', stacks:1 }), scaling:sorcererScale('Fraturas') },
    { name:'Supernova Interior', desc:'Três impactos 0,70/0,70/0,70 +0,12 por Fratura no terceiro. Consome tudo. Recarga 10.', ...sActive('Supernova Interior','Três impactos de Ruptura.',10,{kind:'multiHit',dmgType:'magical',hitCount:3,dmgMultPerHit:0.70,hitDmgMults:[0.70,0.70,0.70],sorcererPath:'rupture',sorcererFractureConsume:3,sorcererThirdHitBonusPerFracture:0.12,sorcererAwakenedMode:'intensified'}), scaling:sorcererScale('Fraturas') },
    { name:'Depois da Explosão', desc:'Consumir exatamente 3 Fraturas e acertar deixa 1; erro total deixa 0.', effect:{}, mechanicRefs:['feiticeiro:fracture'] },
  ]),
  buildPath('feiticeiro', 'sobrecarga', 'REVERBERAÇÃO', '#c89a2e', [
    { name:'Eco Interior', desc:'+2% dano mágico direto de Reverberação.', effect:{ magicDmgPct:0.02 }, mechanicRefs:['feiticeiro:resonance'] },
    { name:'Reflexo Duplo', desc:'+1,5pp Crítico; Eco +1pp.', effect:{ critPct:0.015 }, mechanicRefs:['feiticeiro:resonance'] },
    { name:'Frequência Estável', desc:'+1,5pp Precisão; Eco +1,5pp.', effect:{ accuracyPct:0.015 }, mechanicRefs:['feiticeiro:resonance'] },
    { name:'Ritmo Recorrente', desc:'-3% Recarga somente para Reverberação.', effect:{ cooldownReductionPct:0.03 } },
    { name:'Pulso Bifurcado', desc:'Dois impactos 0,68x; Eco 0,272x. Recarga 3.', ...sActive('Pulso Bifurcado','Dois impactos de 0,68x MATK.',3,{kind:'multiHit',dmgType:'magical',hitCount:2,dmgMultPerHit:0.68,sorcererPath:'reverberation',sorcererAwakenedMode:'refracted',sorcererEchoPotency:0.40}), scaling:sorcererScale('Eco Arcano') },
    { name:'Aceleração Harmônica', desc:'+1,5% Velocidade; com Ressonância, +1%.', effect:{}, mechanicRefs:['feiticeiro:resonance'] },
    { name:'Ressonância', desc:'Desbloqueia 0–2. Magia Desperta gera +1; próxima normal consome 1 e dá +2 Pulso.', effect:{}, mechanicRefs:['feiticeiro:resonance'] },
    { name:'Câmara de Eco', desc:'+3% Dano Crítico; Eco +3%.', effect:{ critDmgPct:0.03 }, mechanicRefs:['feiticeiro:resonance'] },
    { name:'Segunda Onda', desc:'Se original critar, Ecos recebem +6pp Crítico.', effect:{}, mechanicRefs:['feiticeiro:resonance'] },
    { name:'Eco Instável', desc:'1,50x MATK; com Pulso 4–5, +6% dano. Recarga 4.', ...sActive('Eco Instável','1,50x MATK.',4,{kind:'bigHit',dmgType:'magical',dmgMult:1.50,sorcererPath:'reverberation',sorcererAwakenedMode:'refracted',sorcererEchoPotency:0.40}), scaling:sorcererScale('Pulso Inato') },
    { name:'Cascata Arcana', desc:'Três impactos de 0,55x; Eco em cada. Recarga 5.', ...sActive('Cascata Arcana','Três impactos de 0,55x MATK.',5,{kind:'multiHit',dmgType:'magical',hitCount:3,dmgMultPerHit:0.55,sorcererPath:'reverberation',sorcererAwakenedMode:'refracted',sorcererEchoPotency:0.40}), scaling:sorcererScale('Eco Arcano') },
    { name:'Memória Harmônica', desc:'+2% dano de Reverberação; com Ressonância, +2% Dano Crítico.', effect:{ magicDmgPct:0.02 }, mechanicRefs:['feiticeiro:resonance'] },
    { name:'Recorrência', desc:'1,75x. Ao acertar, reduz em 1 o maior cooldown de outra habilidade equipada. Recarga 7.', ...sActive('Recorrência','1,75x MATK e reduz o maior cooldown.',7,{kind:'bigHit',dmgType:'magical',dmgMult:1.75,sorcererPath:'reverberation',sorcererCooldownCutOnHit:true}), scaling:sorcererScale('Recarga') },
    { name:'Sobrecarga Viva', desc:'Quatro impactos de 0,50x; Eco total 0,80x. Recarga 9.', ...sActive('Sobrecarga Viva','Quatro impactos de 0,50x MATK.',9,{kind:'multiHit',dmgType:'magical',hitCount:4,dmgMultPerHit:0.50,sorcererPath:'reverberation',sorcererAwakenedMode:'refracted',sorcererEchoPotency:0.40}), scaling:sorcererScale('Eco Arcano') },
    { name:'Perpetuum Arcano', desc:'Overflow inato ≥2 ao passar de Pulso 6 gera +1 Ressonância.', effect:{}, mechanicRefs:['feiticeiro:pulse','feiticeiro:resonance'] },
  ]),
  buildPath('feiticeiro', 'dominio', 'MOLDAGEM', '#c1502e', [
    { name:'Geometria Instintiva', desc:'+1,5pp Precisão; com Pulso ≥4, +1pp.', effect:{ accuracyPct:0.015 } },
    { name:'Canal Estreito', desc:'+2% dano mágico direto de Moldagem.', effect:{ magicDmgPct:0.02 } },
    { name:'Pele de Mana', desc:'+2% MDEF; com Controle 2, +2% adicionais.', effect:{ mdefPct:0.02 }, mechanicRefs:['feiticeiro:control'] },
    { name:'Ritmo Preciso', desc:'-3% Recarga somente para Moldagem.', effect:{ cooldownReductionPct:0.03 } },
    { name:'Vetor Forçado', desc:'1,30x MATK e +4pp Precisão. Recarga 3.', ...sActive('Vetor Forçado','1,30x MATK e +4pp Precisão.',3,{kind:'bigHit',dmgType:'magical',dmgMult:1.30,sorcererPath:'shaping',sorcererAccuracyBonusPct:0.04,sorcererAwakenedMode:'molded'}), scaling:sorcererScale('Controle') },
    { name:'Mira Arcana', desc:'+1,5pp Precisão; com Controle, +1,5pp.', effect:{ accuracyPct:0.015 }, mechanicRefs:['feiticeiro:control'] },
    { name:'Controle Arcano', desc:'Desbloqueia Controle 0–2; Desperta gera +1; cada carga dá +2pp Precisão/+2% pen.', effect:{}, mechanicRefs:['feiticeiro:control'] },
    { name:'Estrutura Densa', desc:'+3% penetração de MDEF; com Controle 2, +2%.', effect:{}, mechanicRefs:['feiticeiro:control'] },
    { name:'Correção Instantânea', desc:'Uma vez por inimigo, falha total com Controle rerrola o primeiro impacto com +10pp.', effect:{}, mechanicRefs:['feiticeiro:control'] },
    { name:'Campo de Distorção', desc:'1,30x; ao acertar prepara -8% dano da próxima ação inimiga. Com Controle, -12% e +4pp. Recarga 4.', ...sActive('Campo de Distorção','1,30x MATK e proteção contra a próxima ação.',4,{kind:'bigHit',dmgType:'magical',dmgMult:1.30,sorcererPath:'shaping',sorcererControlConsume:1,sorcererAccuracyBonusPct:0.04,sorcererEnemyDmgReductionPct:0.08,sorcererEnemyDmgReductionRounds:1,sorcererAwakenedMode:'molded'}), scaling:sorcererScale('Controle') },
    { name:'Corte de Realidade', desc:'1,75x MATK e +10% penetração. Recarga 5.', ...sActive('Corte de Realidade','1,75x MATK com penetração.',5,{kind:'bigHit',dmgType:'magical',dmgMult:1.75,sorcererPath:'shaping',sorcererMdefPenPct:0.10}), scaling:sorcererScale('Penetração') },
    { name:'Constante Impossível', desc:'+2% MDEF; com Controle 2, +3% dano de Moldagem.', effect:{ mdefPct:0.02 }, mechanicRefs:['feiticeiro:control'] },
    { name:'Forma Impossível', desc:'Três impactos 0,60x; consome 1 Controle; +8pp Precisão; terceiro +15% pen. Recarga 7.', ...sActive('Forma Impossível','Três impactos de 0,60x MATK.',7,{kind:'multiHit',dmgType:'magical',hitCount:3,dmgMultPerHit:0.60,sorcererPath:'shaping',sorcererControlConsume:1,sorcererAccuracyBonusPct:0.08,sorcererThirdHitPenPct:0.15,sorcererAwakenedMode:'molded'}), scaling:sorcererScale('Controle') },
    { name:'Forma Absoluta', desc:'Consome 2 Controle; 2,35x, +15pp Precisão/+20% pen. Recarga 9.', ...sActive('Forma Absoluta','2,35x MATK com precisão e penetração máximas.',9,{kind:'bigHit',dmgType:'magical',dmgMult:2.35,sorcererPath:'shaping',sorcererControlConsume:2,sorcererAccuracyBonusPct:0.15,sorcererMdefPenPct:0.20,sorcererAwakenedMode:'molded'},{ type:'resourceAtLeast', resource:'control', value:2 }), scaling:sorcererScale('Controle') },
    { name:'Lei Pessoal', desc:'Consumir exatamente 2 Controle e acertar recupera 1 Controle.', effect:{}, mechanicRefs:['feiticeiro:control'] },
  ]),
];

// The abilities actually used in combat: the equipped-loadout subset of the
// unlocked abilities, in the player's chosen priority order (checked top to
// bottom every combat round).
export function getEquippedAbilities(classId: ClassId, unlocked: string[], equipped: string[]): AbilityDef[] {
  const known = getUnlockedAbilities(classId, unlocked);
  return equipped
    .map((id) => known.find((a) => a.id === id))
    .filter((a): a is AbilityDef => a !== undefined);
}
