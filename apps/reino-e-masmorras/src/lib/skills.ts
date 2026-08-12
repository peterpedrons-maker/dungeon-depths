import { AbilityDef, Attributes, AttributeKey, ClassId, SkillEffect, SkillNode, SkillNodeType, SkillPath } from '../types/game';

// Each class has more equippable actives than this cap (5 per path × 3 paths)
// — this caps how many of the ones you've unlocked can actually be slotted
// into combat at once, forcing a real build choice.
export const MAX_EQUIPPED_ABILITIES = 4;

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
}

function attrNode(name: string, desc: string, key: AttributeKey, amount: number): NodeSpec {
  return { name, desc, effect: { attrBonus: { [key]: amount } as Partial<Attributes> } };
}

function buildPath(classId: ClassId, pathId: string, name: string, color: string, specs: NodeSpec[]): SkillPath {
  const nodes: SkillNode[] = specs.map((s, i) => {
    const slot = TOPOLOGY[i];
    const id = `${classId}:${pathId}:${i}`;
    const node: SkillNode = {
      id, name: s.name, desc: s.desc, type: slot.type,
      effect: s.effect ?? {},
      prereqIds: slot.prereq.map((j) => `${classId}:${pathId}:${j}`),
    };
    if (slot.type === 'active' && s.ability) node.ability = { id, ...s.ability };
    return node;
  });
  return { id: pathId, name, color, nodes };
}

export const SKILL_TREES: Record<ClassId, SkillPath[]> = {
  guerreiro: [
    buildPath('guerreiro', 'furioso', 'Furioso', '#a5432f', [
      attrNode('Braço Forte', '+2 Força.', 'str', 2),
      attrNode('Músculos de Aço', '+2 Força.', 'str', 2),
      attrNode('Fôlego de Batalha', '+2 Vitalidade.', 'vit', 2),
      attrNode('Punho de Ferro', '+2 Força.', 'str', 2),
      { name: 'Golpe Brutal', desc: 'Habilidade ativa: um golpe devastador com 2.2x de dano. Recarga de 4 rodadas.',
        ability: { name: 'Golpe Brutal', desc: 'Um golpe devastador com 2.2x de dano.', cooldown: 4, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 2.2 } } },
      attrNode('Sangue Fervente', '+2 Força.', 'str', 2),
      { name: 'Vampirismo', desc: 'Cura 6% do dano causado.', effect: { lifestealPct: 0.06 } },
      attrNode('Fúria Ancestral', '+3 Força.', 'str', 3),
      { name: 'Fúria Crescente', desc: 'Quanto menor sua vida, mais dano você causa (até +18%).', effect: { lowHpDmgScale: 0.18 } },
      { name: 'Investida Selvagem', desc: 'Habilidade ativa: golpe rápido e imprudente com 1.8x de dano. Recarga de 3 rodadas.',
        ability: { name: 'Investida Selvagem', desc: 'Golpe rápido e imprudente com 1.8x de dano.', cooldown: 3, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 1.8 } } },
      { name: 'Fúria Cega', desc: 'Habilidade ativa: garante um acerto crítico. Recarga de 4 rodadas.',
        ability: { name: 'Fúria Cega', desc: 'Garante um acerto crítico.', cooldown: 4, condition: { type: 'always' }, effect: { kind: 'guaranteedCrit' } } },
      attrNode('Poder Bruto', '+3 Força.', 'str', 3),
      { name: 'Lâmina Sanguinária', desc: 'Habilidade ativa: golpe brutal com 2.6x de dano. Recarga de 5 rodadas.',
        ability: { name: 'Lâmina Sanguinária', desc: 'Golpe brutal com 2.6x de dano.', cooldown: 5, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 2.6 } } },
      { name: 'Fúria Imparável', desc: 'Habilidade ativa: só pode ser usada com sua vida abaixo de 50% — golpe com 3.2x de dano. Recarga de 6 rodadas.',
        ability: { name: 'Fúria Imparável', desc: 'Golpe de 3.2x de dano quando sua vida está abaixo de 50%.', cooldown: 6, condition: { type: 'hpBelow', pct: 0.5 }, effect: { kind: 'bigHit', dmgMult: 3.2 } } },
      { name: 'Sede de Sangue Eterna', desc: 'Cura 8% da vida máxima sempre que você acerta um crítico.', effect: { onCritHealPct: 0.08 } },
    ]),
    buildPath('guerreiro', 'guardiao', 'Guardião', '#6b7280', [
      attrNode('Pele Grossa', '+2 Vitalidade.', 'vit', 2),
      attrNode('Constituição Firme', '+2 Vitalidade.', 'vit', 2),
      attrNode('Vontade de Ferro', '+2 Sabedoria.', 'wis', 2),
      attrNode('Postura Firme', '+2 Vitalidade.', 'vit', 2),
      { name: 'Postura Defensiva', desc: 'Habilidade ativa: +30% de defesa por 3 rodadas. Recarga de 5 rodadas.',
        ability: { name: 'Postura Defensiva', desc: '+30% de defesa por 3 rodadas.', cooldown: 5, condition: { type: 'always' }, effect: { kind: 'buffDef', buffPct: 0.30, buffRounds: 3 } } },
      attrNode('Resistência Mística', '+2 Sabedoria.', 'wis', 2),
      { name: 'Escudo Reflexivo', desc: '10% de chance de bloquear metade do dano recebido.', effect: { blockChance: 0.10 } },
      attrNode('Última Resistência', '+3 Vitalidade.', 'vit', 3),
      { name: 'Retribuição', desc: 'Reflete 12% de todo dano recebido de volta no inimigo.', effect: { thornsPct: 0.12 } },
      { name: 'Muralha Viva', desc: 'Habilidade ativa: +25% de chance de bloqueio por 3 rodadas. Recarga de 5 rodadas.',
        ability: { name: 'Muralha Viva', desc: '+25% de chance de bloqueio por 3 rodadas.', cooldown: 5, condition: { type: 'always' }, effect: { kind: 'buffBlock', buffPct: 0.25, buffRounds: 3 } } },
      { name: 'Segunda Chance', desc: 'Habilidade ativa: só pode ser usada com sua vida abaixo de 40% — recupera 25% da vida máxima. Recarga de 6 rodadas.',
        ability: { name: 'Segunda Chance', desc: 'Recupera 25% da vida máxima quando sua vida está abaixo de 40%.', cooldown: 6, condition: { type: 'hpBelow', pct: 0.4 }, effect: { kind: 'heal', healPct: 0.25 } } },
      attrNode('Coração de Pedra', '+3 Vitalidade.', 'vit', 3),
      { name: 'Bastião Inabalável', desc: 'Habilidade ativa: +45% de defesa por 4 rodadas. Recarga de 7 rodadas.',
        ability: { name: 'Bastião Inabalável', desc: '+45% de defesa por 4 rodadas.', cooldown: 7, condition: { type: 'always' }, effect: { kind: 'buffDef', buffPct: 0.45, buffRounds: 4 } } },
      { name: 'Fortaleza Viva', desc: 'Habilidade ativa: +50% de defesa por 5 rodadas. Recarga de 7 rodadas.',
        ability: { name: 'Fortaleza Viva', desc: '+50% de defesa por 5 rodadas.', cooldown: 7, condition: { type: 'always' }, effect: { kind: 'buffDef', buffPct: 0.50, buffRounds: 5 } } },
      { name: 'Vitalidade Eterna', desc: '+20 de vida máxima.', effect: { maxHpFlat: 20 } },
    ]),
    buildPath('guerreiro', 'duelista', 'Duelista', '#c89a2e', [
      attrNode('Golpe Certeiro', '+2 Destreza.', 'dex', 2),
      attrNode('Lâmina Afiada', '+2 Destreza.', 'dex', 2),
      attrNode('Sorte do Duelista', '+2 Sorte.', 'luk', 2),
      attrNode('Fluidez', '+2 Destreza.', 'dex', 2),
      { name: 'Fúria do Duelo', desc: 'Habilidade ativa: garante um acerto crítico. Recarga de 4 rodadas.',
        ability: { name: 'Fúria do Duelo', desc: 'Garante um acerto crítico.', cooldown: 4, condition: { type: 'always' }, effect: { kind: 'guaranteedCrit' } } },
      attrNode('Instinto', '+2 Sorte.', 'luk', 2),
      { name: 'Instinto Assassino', desc: 'Cura 5% da vida máxima sempre que você acerta um crítico.', effect: { onCritHealPct: 0.05 } },
      attrNode('Ponto Fraco', '+3 Destreza.', 'dex', 3),
      { name: 'Precisão Mortal', desc: '+15% de dano crítico.', effect: { critDmgPct: 0.15 } },
      { name: 'Estocada Rápida', desc: 'Habilidade ativa: golpe com 2.0x de dano. Recarga de 3 rodadas.',
        ability: { name: 'Estocada Rápida', desc: 'Golpe com 2.0x de dano.', cooldown: 3, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 2.0 } } },
      { name: 'Golpe de Misericórdia', desc: 'Habilidade ativa: só pode ser usada com o inimigo abaixo de 30% de vida — 2.5x de dano. Recarga de 4 rodadas.',
        ability: { name: 'Golpe de Misericórdia', desc: '2.5x de dano contra inimigos abaixo de 30% de vida.', cooldown: 4, condition: { type: 'enemyHpBelow', pct: 0.3 }, effect: { kind: 'bigHit', dmgMult: 2.5 } } },
      attrNode('Fortuna do Combate', '+3 Sorte.', 'luk', 3),
      { name: 'Fúria Absoluta', desc: 'Habilidade ativa: golpe garantidamente crítico com 1.4x de dano adicional. Recarga de 5 rodadas.',
        ability: { name: 'Fúria Absoluta', desc: 'Golpe garantidamente crítico com 1.4x de dano adicional.', cooldown: 5, condition: { type: 'always' }, effect: { kind: 'guaranteedCrit', dmgMult: 1.4 } } },
      { name: 'Execução Perfeita', desc: 'Habilidade ativa: só pode ser usada com o inimigo abaixo de 25% de vida — 3.5x de dano. Recarga de 6 rodadas.',
        ability: { name: 'Execução Perfeita', desc: '3.5x de dano contra inimigos abaixo de 25% de vida.', cooldown: 6, condition: { type: 'enemyHpBelow', pct: 0.25 }, effect: { kind: 'bigHit', dmgMult: 3.5 } } },
      { name: 'Reflexo Perfeito', desc: '+6% de chance de crítico.', effect: { critPct: 0.06 } },
    ]),
  ],
  mago: [
    buildPath('mago', 'piromante', 'Piromante', '#c1502e', [
      attrNode('Chama Menor', '+2 Inteligência.', 'int', 2),
      attrNode('Fagulha Ardente', '+2 Inteligência.', 'int', 2),
      attrNode('Resistência ao Calor', '+2 Vitalidade.', 'vit', 2),
      attrNode('Combustão', '+2 Inteligência.', 'int', 2),
      { name: 'Queimadura', desc: 'Habilidade ativa: incendeia o inimigo, causando dano contínuo por 3 rodadas. Recarga de 3 rodadas.',
        ability: { name: 'Queimadura', desc: 'Incendeia o inimigo, causando dano contínuo por 3 rodadas.', cooldown: 3, condition: { type: 'always' }, effect: { kind: 'applyStatus', status: 'burn', statusRounds: 3, statusDmgPct: 0.5 } } },
      attrNode('Brasas Vivas', '+2 Inteligência.', 'int', 2),
      { name: 'Chama Interior', desc: 'Cura 5% do dano causado.', effect: { lifestealPct: 0.05 } },
      attrNode('Inferno Menor', '+3 Inteligência.', 'int', 3),
      { name: 'Combustão Amplificada', desc: 'Dano contra inimigo em chamas aumenta em 15%.', effect: { dmgPctVsStatus: { status: 'burn', pct: 0.15 } } },
      { name: 'Explosão Ígnea', desc: 'Habilidade ativa: golpe com 1.9x de dano. Recarga de 3 rodadas.',
        ability: { name: 'Explosão Ígnea', desc: 'Golpe com 1.9x de dano.', cooldown: 3, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 1.9 } } },
      { name: 'Chuva de Fogo', desc: 'Habilidade ativa: incendeia o inimigo com mais força por 4 rodadas. Recarga de 4 rodadas.',
        ability: { name: 'Chuva de Fogo', desc: 'Incendeia o inimigo com mais força por 4 rodadas.', cooldown: 4, condition: { type: 'always' }, effect: { kind: 'applyStatus', status: 'burn', statusRounds: 4, statusDmgPct: 0.6 } } },
      attrNode('Núcleo Flamejante', '+3 Inteligência.', 'int', 3),
      { name: 'Detonação', desc: 'Habilidade ativa: só pode ser usada com o inimigo em chamas — causa 2.2x de dano. Recarga de 4 rodadas.',
        ability: { name: 'Detonação', desc: 'Dano extra em inimigos em chamas.', cooldown: 4, condition: { type: 'enemyHasStatus', status: 'burn' }, effect: { kind: 'bonusVsStatus', dmgMult: 2.2 } } },
      { name: 'Cataclismo Ardente', desc: 'Habilidade ativa: só pode ser usada com o inimigo em chamas — causa 3.0x de dano. Recarga de 5 rodadas.',
        ability: { name: 'Cataclismo Ardente', desc: 'Dano massivo contra inimigos em chamas.', cooldown: 5, condition: { type: 'enemyHasStatus', status: 'burn' }, effect: { kind: 'bonusVsStatus', dmgMult: 3.0 } } },
      { name: 'Coração de Brasa', desc: '+15 de vida máxima.', effect: { maxHpFlat: 15 } },
    ]),
    buildPath('mago', 'gelido', 'Gélido', '#3f7ab8', [
      attrNode('Casco de Gelo', '+2 Vitalidade.', 'vit', 2),
      attrNode('Mente Fria', '+2 Sabedoria.', 'wis', 2),
      attrNode('Sangue Frio', '+2 Vitalidade.', 'vit', 2),
      attrNode('Ar Glacial', '+2 Vitalidade.', 'vit', 2),
      { name: 'Barreira de Gelo', desc: 'Habilidade ativa: +25% de defesa por 3 rodadas. Recarga de 5 rodadas.',
        ability: { name: 'Barreira de Gelo', desc: '+25% de defesa por 3 rodadas.', cooldown: 5, condition: { type: 'always' }, effect: { kind: 'buffDef', buffPct: 0.25, buffRounds: 3 } } },
      attrNode('Foco Glacial', '+2 Sabedoria.', 'wis', 2),
      { name: 'Escudo de Gelo', desc: '10% de chance de bloquear metade do dano recebido.', effect: { blockChance: 0.10 } },
      attrNode('Núcleo Congelante', '+3 Vitalidade.', 'vit', 3),
      { name: 'Reserva Gélida', desc: '+15 de vida máxima.', effect: { maxHpFlat: 15 } },
      { name: 'Névoa Congelante', desc: 'Habilidade ativa: +20% de chance de bloqueio por 3 rodadas. Recarga de 5 rodadas.',
        ability: { name: 'Névoa Congelante', desc: '+20% de chance de bloqueio por 3 rodadas.', cooldown: 5, condition: { type: 'always' }, effect: { kind: 'buffBlock', buffPct: 0.20, buffRounds: 3 } } },
      { name: 'Regeneração Glacial', desc: 'Habilidade ativa: só pode ser usada com sua vida abaixo de 40% — recupera 22% da vida máxima. Recarga de 6 rodadas.',
        ability: { name: 'Regeneração Glacial', desc: 'Recupera 22% da vida máxima quando sua vida está abaixo de 40%.', cooldown: 6, condition: { type: 'hpBelow', pct: 0.4 }, effect: { kind: 'heal', healPct: 0.22 } } },
      attrNode('Vontade Congelada', '+3 Sabedoria.', 'wis', 3),
      { name: 'Fortaleza de Gelo', desc: 'Habilidade ativa: +40% de defesa por 4 rodadas. Recarga de 7 rodadas.',
        ability: { name: 'Fortaleza de Gelo', desc: '+40% de defesa por 4 rodadas.', cooldown: 7, condition: { type: 'always' }, effect: { kind: 'buffDef', buffPct: 0.40, buffRounds: 4 } } },
      { name: 'Eternidade Glacial', desc: 'Habilidade ativa: +55% de defesa por 5 rodadas. Recarga de 8 rodadas.',
        ability: { name: 'Eternidade Glacial', desc: '+55% de defesa por 5 rodadas.', cooldown: 8, condition: { type: 'always' }, effect: { kind: 'buffDef', buffPct: 0.55, buffRounds: 5 } } },
      { name: 'Espinhos de Gelo', desc: 'Reflete 12% de todo dano recebido de volta no inimigo.', effect: { thornsPct: 0.12 } },
    ]),
    buildPath('mago', 'eletromante', 'Eletromante', '#c89a2e', [
      attrNode('Faísca', '+2 Destreza.', 'dex', 2),
      attrNode('Carga Estática', '+2 Sorte.', 'luk', 2),
      attrNode('Reflexo Elétrico', '+2 Destreza.', 'dex', 2),
      attrNode('Choque', '+2 Destreza.', 'dex', 2),
      { name: 'Sobrecarga', desc: 'Habilidade ativa: garante um acerto crítico. Recarga de 4 rodadas.',
        ability: { name: 'Sobrecarga', desc: 'Garante um acerto crítico.', cooldown: 4, condition: { type: 'always' }, effect: { kind: 'guaranteedCrit' } } },
      attrNode('Campo Magnético', '+2 Sorte.', 'luk', 2),
      { name: 'Condutor Perfeito', desc: '+15% de dano crítico.', effect: { critDmgPct: 0.15 } },
      attrNode('Tempestade Elétrica', '+3 Destreza.', 'dex', 3),
      { name: 'Ressonância Ígnea', desc: 'Dano contra inimigo em chamas aumenta em 15%.', effect: { dmgPctVsStatus: { status: 'burn', pct: 0.15 } } },
      { name: 'Choque em Cadeia', desc: 'Habilidade ativa: só pode ser usada com o inimigo em chamas — causa 2.0x de dano. Recarga de 3 rodadas.',
        ability: { name: 'Choque em Cadeia', desc: 'Dano extra em inimigos em chamas.', cooldown: 3, condition: { type: 'enemyHasStatus', status: 'burn' }, effect: { kind: 'bonusVsStatus', dmgMult: 2.0 } } },
      { name: 'Raio Perfurante', desc: 'Habilidade ativa: golpe com 1.8x de dano. Recarga de 3 rodadas.',
        ability: { name: 'Raio Perfurante', desc: 'Golpe com 1.8x de dano.', cooldown: 3, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 1.8 } } },
      attrNode('Fortuna Voltaica', '+3 Sorte.', 'luk', 3),
      { name: 'Fúria Elétrica', desc: 'Habilidade ativa: golpe garantidamente crítico com 1.5x de dano adicional. Recarga de 5 rodadas.',
        ability: { name: 'Fúria Elétrica', desc: 'Golpe garantidamente crítico com 1.5x de dano adicional.', cooldown: 5, condition: { type: 'always' }, effect: { kind: 'guaranteedCrit', dmgMult: 1.5 } } },
      { name: 'Tempestade Devastadora', desc: 'Habilidade ativa: só pode ser usada com o inimigo em chamas — causa 3.2x de dano. Recarga de 6 rodadas.',
        ability: { name: 'Tempestade Devastadora', desc: 'Dano massivo contra inimigos em chamas.', cooldown: 6, condition: { type: 'enemyHasStatus', status: 'burn' }, effect: { kind: 'bonusVsStatus', dmgMult: 3.2 } } },
      { name: 'Instinto Voltaico', desc: '+7% de chance de crítico.', effect: { critPct: 0.07 } },
    ]),
  ],
  ladino: [
    buildPath('ladino', 'veneno', 'Veneno', '#4f7a3a', [
      attrNode('Lâmina Envenenada', '+2 Destreza.', 'dex', 2),
      attrNode('Passo Ágil', '+2 Agilidade.', 'agi', 2),
      attrNode('Toxina Concentrada', '+2 Destreza.', 'dex', 2),
      attrNode('Sangue Fraco', '+2 Destreza.', 'dex', 2),
      { name: 'Golpe Peçonhento', desc: 'Habilidade ativa: envenena o inimigo, causando dano contínuo por 4 rodadas. Recarga de 4 rodadas.',
        ability: { name: 'Golpe Peçonhento', desc: 'Envenena o inimigo, causando dano contínuo por 4 rodadas.', cooldown: 4, condition: { type: 'always' }, effect: { kind: 'applyStatus', status: 'poison', statusRounds: 4, statusDmgPct: 0.4 } } },
      attrNode('Reflexos Rápidos', '+2 Agilidade.', 'agi', 2),
      { name: 'Sangue Envenenado', desc: 'Cura 7% do dano causado.', effect: { lifestealPct: 0.07 } },
      attrNode('Peçonha Mortal', '+3 Destreza.', 'dex', 3),
      { name: 'Instinto Venenoso', desc: 'Dano contra inimigo envenenado aumenta em 15%.', effect: { dmgPctVsStatus: { status: 'poison', pct: 0.15 } } },
      { name: 'Corte Tóxico', desc: 'Habilidade ativa: golpe com 1.9x de dano. Recarga de 3 rodadas.',
        ability: { name: 'Corte Tóxico', desc: 'Golpe com 1.9x de dano.', cooldown: 3, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 1.9 } } },
      { name: 'Veneno Mortal', desc: 'Habilidade ativa: envenena o inimigo com mais força por 5 rodadas. Recarga de 4 rodadas.',
        ability: { name: 'Veneno Mortal', desc: 'Envenena o inimigo com mais força por 5 rodadas.', cooldown: 4, condition: { type: 'always' }, effect: { kind: 'applyStatus', status: 'poison', statusRounds: 5, statusDmgPct: 0.5 } } },
      attrNode('Toque da Serpente', '+3 Agilidade.', 'agi', 3),
      { name: 'Golpe Fatal', desc: 'Habilidade ativa: só pode ser usada com o inimigo envenenado — causa 2.4x de dano. Recarga de 3 rodadas.',
        ability: { name: 'Golpe Fatal', desc: 'Dano extra em inimigos envenenados.', cooldown: 3, condition: { type: 'enemyHasStatus', status: 'poison' }, effect: { kind: 'bonusVsStatus', dmgMult: 2.4 } } },
      { name: 'Execução Venenosa', desc: 'Habilidade ativa: só pode ser usada com o inimigo envenenado — causa 3.2x de dano. Recarga de 5 rodadas.',
        ability: { name: 'Execução Venenosa', desc: 'Dano massivo em inimigos envenenados.', cooldown: 5, condition: { type: 'enemyHasStatus', status: 'poison' }, effect: { kind: 'bonusVsStatus', dmgMult: 3.2 } } },
      { name: 'Fúria Silenciosa', desc: 'Cura 6% da vida máxima sempre que você acerta um crítico.', effect: { onCritHealPct: 0.06 } },
    ]),
    buildPath('ladino', 'sombras', 'Sombras', '#5b5f6a', [
      attrNode('Passos Silenciosos', '+2 Agilidade.', 'agi', 2),
      attrNode('Vulto', '+2 Agilidade.', 'agi', 2),
      attrNode('Instinto de Sobrevivência', '+2 Vitalidade.', 'vit', 2),
      attrNode('Instinto', '+3 Agilidade.', 'agi', 3),
      { name: 'Passo nas Sombras', desc: 'Habilidade ativa: +25% de chance de esquiva por 3 rodadas. Recarga de 5 rodadas.',
        ability: { name: 'Passo nas Sombras', desc: '+25% de chance de esquiva por 3 rodadas.', cooldown: 5, condition: { type: 'always' }, effect: { kind: 'buffBlock', buffPct: 0.25, buffRounds: 3 } } },
      attrNode('Fôlego das Sombras', '+2 Vitalidade.', 'vit', 2),
      { name: 'Reflexos', desc: '10% de chance de esquivar e reduzir o dano à metade.', effect: { blockChance: 0.10 } },
      attrNode('Golpe das Sombras', '+3 Agilidade.', 'agi', 3),
      { name: 'Contragolpe', desc: 'Reflete 10% de todo dano recebido de volta no inimigo.', effect: { thornsPct: 0.10 } },
      { name: 'Ataque Furtivo', desc: 'Habilidade ativa: golpe com 1.7x de dano. Recarga de 3 rodadas.',
        ability: { name: 'Ataque Furtivo', desc: 'Golpe com 1.7x de dano.', cooldown: 3, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 1.7 } } },
      { name: 'Fuga nas Sombras', desc: 'Habilidade ativa: só pode ser usada com sua vida abaixo de 40% — recupera 20% da vida máxima. Recarga de 6 rodadas.',
        ability: { name: 'Fuga nas Sombras', desc: 'Recupera 20% da vida máxima quando sua vida está abaixo de 40%.', cooldown: 6, condition: { type: 'hpBelow', pct: 0.4 }, effect: { kind: 'heal', healPct: 0.20 } } },
      attrNode('Mestre do Disfarce', '+3 Agilidade.', 'agi', 3),
      { name: 'Véu das Sombras', desc: 'Habilidade ativa: +40% de chance de esquiva por 4 rodadas. Recarga de 7 rodadas.',
        ability: { name: 'Véu das Sombras', desc: '+40% de chance de esquiva por 4 rodadas.', cooldown: 7, condition: { type: 'always' }, effect: { kind: 'buffBlock', buffPct: 0.40, buffRounds: 4 } } },
      { name: 'Um com a Escuridão', desc: 'Habilidade ativa: +50% de chance de esquiva por 5 rodadas. Recarga de 8 rodadas.',
        ability: { name: 'Um com a Escuridão', desc: '+50% de chance de esquiva por 5 rodadas.', cooldown: 8, condition: { type: 'always' }, effect: { kind: 'buffBlock', buffPct: 0.50, buffRounds: 5 } } },
      { name: 'Vitalidade Furtiva', desc: '+15 de vida máxima.', effect: { maxHpFlat: 15 } },
    ]),
    buildPath('ladino', 'laminas', 'Lâminas Gêmeas', '#c89a2e', [
      attrNode('Fio Duplo', '+2 Destreza.', 'dex', 2),
      attrNode('Sorte da Lâmina', '+2 Sorte.', 'luk', 2),
      attrNode('Dança das Lâminas', '+2 Destreza.', 'dex', 2),
      attrNode('Corte Preciso', '+2 Destreza.', 'dex', 2),
      { name: 'Investida Precisa', desc: 'Habilidade ativa: garante um acerto crítico. Recarga de 4 rodadas.',
        ability: { name: 'Investida Precisa', desc: 'Garante um acerto crítico.', cooldown: 4, condition: { type: 'always' }, effect: { kind: 'guaranteedCrit' } } },
      attrNode('Fortuna Sangrenta', '+2 Sorte.', 'luk', 2),
      { name: 'Sede pelas Lâminas', desc: 'Cura 6% da vida máxima sempre que você acerta um crítico.', effect: { onCritHealPct: 0.06 } },
      attrNode('Execução', '+3 Destreza.', 'dex', 3),
      { name: 'Precisão Cirúrgica', desc: '+18% de dano crítico.', effect: { critDmgPct: 0.18 } },
      { name: 'Turbilhão de Lâminas', desc: 'Habilidade ativa: golpe com 2.0x de dano. Recarga de 3 rodadas.',
        ability: { name: 'Turbilhão de Lâminas', desc: 'Golpe com 2.0x de dano.', cooldown: 3, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 2.0 } } },
      { name: 'Golpe de Misericórdia', desc: 'Habilidade ativa: só pode ser usada com o inimigo abaixo de 30% de vida — 2.5x de dano. Recarga de 4 rodadas.',
        ability: { name: 'Golpe de Misericórdia', desc: '2.5x de dano contra inimigos abaixo de 30% de vida.', cooldown: 4, condition: { type: 'enemyHpBelow', pct: 0.3 }, effect: { kind: 'bigHit', dmgMult: 2.5 } } },
      attrNode('Fortuna Absoluta', '+3 Sorte.', 'luk', 3),
      { name: 'Fúria das Lâminas', desc: 'Habilidade ativa: golpe garantidamente crítico com 1.6x de dano adicional. Recarga de 5 rodadas.',
        ability: { name: 'Fúria das Lâminas', desc: 'Golpe garantidamente crítico com 1.6x de dano adicional.', cooldown: 5, condition: { type: 'always' }, effect: { kind: 'guaranteedCrit', dmgMult: 1.6 } } },
      { name: 'Execução Perfeita', desc: 'Habilidade ativa: só pode ser usada com o inimigo abaixo de 25% de vida — 3.6x de dano. Recarga de 6 rodadas.',
        ability: { name: 'Execução Perfeita', desc: '3.6x de dano contra inimigos abaixo de 25% de vida.', cooldown: 6, condition: { type: 'enemyHpBelow', pct: 0.25 }, effect: { kind: 'bigHit', dmgMult: 3.6 } } },
      { name: 'Instinto Mortal', desc: '+7% de chance de crítico.', effect: { critPct: 0.07 } },
    ]),
  ],
  clerigo: [
    buildPath('clerigo', 'devocao', 'Devoção', '#d8c27a', [
      attrNode('Fé Sincera', '+2 Sabedoria.', 'wis', 2),
      attrNode('Oração Silenciosa', '+2 Sabedoria.', 'wis', 2),
      attrNode('Constituição Abençoada', '+2 Vitalidade.', 'vit', 2),
      attrNode('Devoção Profunda', '+2 Sabedoria.', 'wis', 2),
      { name: 'Cura Divina', desc: 'Habilidade ativa: recupera 30% da vida máxima. Recarga de 4 rodadas.',
        ability: { name: 'Cura Divina', desc: 'Recupera 30% da vida máxima.', cooldown: 4, condition: { type: 'always' }, effect: { kind: 'heal', healPct: 0.30 } } },
      attrNode('Graça Protetora', '+2 Vitalidade.', 'vit', 2),
      { name: 'Toque Vital', desc: 'Cura 5% do dano causado.', effect: { lifestealPct: 0.05 } },
      attrNode('Luz Interior', '+3 Sabedoria.', 'wis', 3),
      { name: 'Bênção da Vida', desc: '+18 de vida máxima.', effect: { maxHpFlat: 18 } },
      { name: 'Renovação', desc: 'Habilidade ativa: recupera 40% da vida máxima. Recarga de 5 rodadas.',
        ability: { name: 'Renovação', desc: 'Recupera 40% da vida máxima.', cooldown: 5, condition: { type: 'always' }, effect: { kind: 'heal', healPct: 0.40 } } },
      { name: 'Escudo Sagrado', desc: 'Habilidade ativa: +30% de defesa por 3 rodadas. Recarga de 5 rodadas.',
        ability: { name: 'Escudo Sagrado', desc: '+30% de defesa por 3 rodadas.', cooldown: 5, condition: { type: 'always' }, effect: { kind: 'buffDef', buffPct: 0.30, buffRounds: 3 } } },
      attrNode('Comunhão Celestial', '+3 Vitalidade.', 'vit', 3),
      { name: 'Milagre', desc: 'Habilidade ativa: só pode ser usada com sua vida abaixo de 50% — recupera 50% da vida máxima. Recarga de 6 rodadas.',
        ability: { name: 'Milagre', desc: 'Recupera 50% da vida máxima quando sua vida está abaixo de 50%.', cooldown: 6, condition: { type: 'hpBelow', pct: 0.5 }, effect: { kind: 'heal', healPct: 0.50 } } },
      { name: 'Ressurreição Menor', desc: 'Habilidade ativa: recupera 65% da vida máxima. Recarga de 7 rodadas.',
        ability: { name: 'Ressurreição Menor', desc: 'Recupera 65% da vida máxima.', cooldown: 7, condition: { type: 'always' }, effect: { kind: 'heal', healPct: 0.65 } } },
      { name: 'Graça Divina', desc: 'Cura 8% da vida máxima sempre que você acerta um crítico.', effect: { onCritHealPct: 0.08 } },
    ]),
    buildPath('clerigo', 'retidao', 'Retidão', '#b8862e', [
      attrNode('Punho da Fé', '+2 Força.', 'str', 2),
      attrNode('Armadura da Justiça', '+2 Vitalidade.', 'vit', 2),
      attrNode('Convicção', '+2 Sabedoria.', 'wis', 2),
      attrNode('Zelo', '+2 Força.', 'str', 2),
      { name: 'Escudo da Retidão', desc: 'Habilidade ativa: +30% de defesa por 3 rodadas. Recarga de 5 rodadas.',
        ability: { name: 'Escudo da Retidão', desc: '+30% de defesa por 3 rodadas.', cooldown: 5, condition: { type: 'always' }, effect: { kind: 'buffDef', buffPct: 0.30, buffRounds: 3 } } },
      attrNode('Julgamento Justo', '+2 Sabedoria.', 'wis', 2),
      { name: 'Retribuição Sagrada', desc: 'Reflete 12% de todo dano recebido de volta no inimigo.', effect: { thornsPct: 0.12 } },
      attrNode('Fúria Justiceira', '+3 Força.', 'str', 3),
      { name: 'Guarda Consagrada', desc: '10% de chance de bloquear metade do dano recebido.', effect: { blockChance: 0.10 } },
      { name: 'Golpe Sagrado', desc: 'Habilidade ativa: golpe com 1.9x de dano. Recarga de 3 rodadas.',
        ability: { name: 'Golpe Sagrado', desc: 'Golpe com 1.9x de dano.', cooldown: 3, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 1.9 } } },
      { name: 'Voto de Proteção', desc: 'Habilidade ativa: +25% de chance de bloqueio por 3 rodadas. Recarga de 5 rodadas.',
        ability: { name: 'Voto de Proteção', desc: '+25% de chance de bloqueio por 3 rodadas.', cooldown: 5, condition: { type: 'always' }, effect: { kind: 'buffBlock', buffPct: 0.25, buffRounds: 3 } } },
      attrNode('Firmeza Inabalável', '+3 Vitalidade.', 'vit', 3),
      { name: 'Martelo da Fé', desc: 'Habilidade ativa: golpe com 2.4x de dano. Recarga de 4 rodadas.',
        ability: { name: 'Martelo da Fé', desc: 'Golpe com 2.4x de dano.', cooldown: 4, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 2.4 } } },
      { name: 'Muralha Divina', desc: 'Habilidade ativa: +50% de defesa por 5 rodadas. Recarga de 7 rodadas.',
        ability: { name: 'Muralha Divina', desc: '+50% de defesa por 5 rodadas.', cooldown: 7, condition: { type: 'always' }, effect: { kind: 'buffDef', buffPct: 0.50, buffRounds: 5 } } },
      { name: 'Bastião Sagrado', desc: '+20 de vida máxima.', effect: { maxHpFlat: 20 } },
    ]),
    buildPath('clerigo', 'provacao', 'Provação', '#8a4a6b', [
      attrNode('Chama Sagrada', '+2 Inteligência.', 'int', 2),
      attrNode('Ira Divina', '+2 Sabedoria.', 'wis', 2),
      attrNode('Julgamento', '+2 Inteligência.', 'int', 2),
      attrNode('Fogo Purificador', '+2 Inteligência.', 'int', 2),
      { name: 'Chama Purificadora', desc: 'Habilidade ativa: incendeia o inimigo com fogo sagrado por 3 rodadas. Recarga de 3 rodadas.',
        ability: { name: 'Chama Purificadora', desc: 'Incendeia o inimigo com fogo sagrado por 3 rodadas.', cooldown: 3, condition: { type: 'always' }, effect: { kind: 'applyStatus', status: 'burn', statusRounds: 3, statusDmgPct: 0.5 } } },
      attrNode('Sentença', '+2 Sabedoria.', 'wis', 2),
      { name: 'Absorção Sagrada', desc: 'Cura 5% do dano causado.', effect: { lifestealPct: 0.05 } },
      attrNode('Punição', '+3 Inteligência.', 'int', 3),
      { name: 'Fogo do Juízo', desc: 'Dano contra inimigo em chamas aumenta em 15%.', effect: { dmgPctVsStatus: { status: 'burn', pct: 0.15 } } },
      { name: 'Golpe do Juízo', desc: 'Habilidade ativa: golpe com 1.9x de dano. Recarga de 3 rodadas.',
        ability: { name: 'Golpe do Juízo', desc: 'Golpe com 1.9x de dano.', cooldown: 3, condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 1.9 } } },
      { name: 'Sentença Final', desc: 'Habilidade ativa: só pode ser usada com o inimigo abaixo de 30% de vida — 2.3x de dano. Recarga de 4 rodadas.',
        ability: { name: 'Sentença Final', desc: '2.3x de dano contra inimigos abaixo de 30% de vida.', cooldown: 4, condition: { type: 'enemyHpBelow', pct: 0.3 }, effect: { kind: 'bigHit', dmgMult: 2.3 } } },
      attrNode('Vontade Inabalável', '+3 Sabedoria.', 'wis', 3),
      { name: 'Ira Consumidora', desc: 'Habilidade ativa: só pode ser usada com o inimigo em chamas — causa 2.4x de dano. Recarga de 4 rodadas.',
        ability: { name: 'Ira Consumidora', desc: 'Dano extra em inimigos em chamas.', cooldown: 4, condition: { type: 'enemyHasStatus', status: 'burn' }, effect: { kind: 'bonusVsStatus', dmgMult: 2.4 } } },
      { name: 'Apocalipse Sagrado', desc: 'Habilidade ativa: só pode ser usada com o inimigo em chamas — causa 3.2x de dano. Recarga de 6 rodadas.',
        ability: { name: 'Apocalipse Sagrado', desc: 'Dano massivo contra inimigos em chamas.', cooldown: 6, condition: { type: 'enemyHasStatus', status: 'burn' }, effect: { kind: 'bonusVsStatus', dmgMult: 3.2 } } },
      { name: 'Fervor Zeloso', desc: '+6% de chance de crítico.', effect: { critPct: 0.06 } },
    ]),
  ],
};

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

export function computeSkillBonuses(classId: ClassId, unlocked: string[]): Required<Omit<SkillEffect, 'attrBonus' | 'dmgPctVsStatus'>> & { dmgPctVsPoison: number; dmgPctVsBurn: number } {
  const totals = {
    dmgPct: 0, defPct: 0, critPct: 0, critDmgPct: 0, blockChance: 0, flatBonusDmg: 0, lowHpDmgScale: 0,
    maxHpFlat: 0, lifestealPct: 0, thornsPct: 0, onCritHealPct: 0, dmgPctVsPoison: 0, dmgPctVsBurn: 0,
  };
  for (const path of SKILL_TREES[classId]) {
    for (const n of path.nodes) {
      if (!unlocked.includes(n.id)) continue;
      totals.dmgPct += n.effect.dmgPct ?? 0;
      totals.defPct += n.effect.defPct ?? 0;
      totals.critPct += n.effect.critPct ?? 0;
      totals.critDmgPct += n.effect.critDmgPct ?? 0;
      totals.blockChance += n.effect.blockChance ?? 0;
      totals.flatBonusDmg += n.effect.flatBonusDmg ?? 0;
      totals.lowHpDmgScale += n.effect.lowHpDmgScale ?? 0;
      totals.maxHpFlat += n.effect.maxHpFlat ?? 0;
      totals.lifestealPct += n.effect.lifestealPct ?? 0;
      totals.thornsPct += n.effect.thornsPct ?? 0;
      totals.onCritHealPct += n.effect.onCritHealPct ?? 0;
      if (n.effect.dmgPctVsStatus?.status === 'poison') totals.dmgPctVsPoison += n.effect.dmgPctVsStatus.pct;
      if (n.effect.dmgPctVsStatus?.status === 'burn') totals.dmgPctVsBurn += n.effect.dmgPctVsStatus.pct;
    }
  }
  return totals;
}

// Primary-attribute totals granted by unlocked "attribute" nodes — this is
// the only source of Attributes in the game (no free-allocation pool).
export function computeAttributeTotals(classId: ClassId, unlocked: string[]): Attributes {
  const totals: Attributes = { str: 0, dex: 0, agi: 0, vit: 0, int: 0, wis: 0, luk: 0 };
  for (const path of SKILL_TREES[classId]) {
    for (const n of path.nodes) {
      if (!unlocked.includes(n.id) || !n.effect.attrBonus) continue;
      for (const key of Object.keys(n.effect.attrBonus) as AttributeKey[]) {
        totals[key] += n.effect.attrBonus[key] ?? 0;
      }
    }
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

// The abilities actually used in combat: the equipped-loadout subset of the
// unlocked abilities, in the player's chosen priority order (checked top to
// bottom every combat round).
export function getEquippedAbilities(classId: ClassId, unlocked: string[], equipped: string[]): AbilityDef[] {
  const known = getUnlockedAbilities(classId, unlocked);
  return equipped
    .map((id) => known.find((a) => a.id === id))
    .filter((a): a is AbilityDef => a !== undefined);
}
