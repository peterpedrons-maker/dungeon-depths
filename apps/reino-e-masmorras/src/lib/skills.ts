import { AbilityDef, ClassId, SkillEffect, SkillNode, SkillPath } from '../types/game';

// Each class has at most 3 active abilities (one per path) — this caps how
// many of the ones you've unlocked can actually be slotted into combat at
// once, forcing a real build choice once a class has more than this many.
export const MAX_EQUIPPED_ABILITIES = 3;

function attr(id: string, name: string, desc: string, effect: SkillEffect): SkillNode {
  return { id, name, desc, type: 'attribute', effect };
}
function passive(id: string, name: string, desc: string, effect: SkillEffect): SkillNode {
  return { id, name, desc, type: 'passive', effect };
}
function active(id: string, name: string, desc: string, ability: Omit<AbilityDef, 'id'>): SkillNode {
  return { id, name, desc, type: 'active', effect: {}, ability: { id, ...ability } };
}

export const SKILL_TREES: Record<ClassId, SkillPath[]> = {
  guerreiro: [
    {
      id: 'furioso', name: 'Furioso', color: '#a5432f',
      nodes: [
        attr('guerreiro:furioso:0', 'Golpe Pesado', '+8% de dano.', { dmgPct: 0.08 }),
        attr('guerreiro:furioso:1', 'Sede de Sangue', '+8% de dano adicional.', { dmgPct: 0.08 }),
        attr('guerreiro:furioso:2', 'Fúria Crescente', 'Quanto menor sua vida, mais dano você causa (até +20%).', { lowHpDmgScale: 0.20 }),
        attr('guerreiro:furioso:3', 'Fúria Descontrolada', '+15% de dano final.', { dmgPct: 0.15 }),
        passive('guerreiro:furioso:4', 'Vampirismo', 'Cura 8% do dano causado.', { lifestealPct: 0.08 }),
        active('guerreiro:furioso:5', 'Golpe Brutal', 'Habilidade ativa: um golpe devastador com 2.2x de dano. Recarga de 4 rodadas.', {
          name: 'Golpe Brutal', desc: 'Um golpe devastador com 2.2x de dano.', cooldown: 4,
          condition: { type: 'always' }, effect: { kind: 'bigHit', dmgMult: 2.2 },
        }),
      ],
    },
    {
      id: 'guardiao', name: 'Guardião', color: '#6b7280',
      nodes: [
        attr('guerreiro:guardiao:0', 'Pele de Ferro', '+8% de defesa.', { defPct: 0.08 }),
        attr('guerreiro:guardiao:1', 'Postura Firme', '+8% de defesa adicional.', { defPct: 0.08 }),
        attr('guerreiro:guardiao:2', 'Escudo Reflexivo', '12% de chance de bloquear metade do dano recebido.', { blockChance: 0.12 }),
        attr('guerreiro:guardiao:3', 'Última Resistência', '+10% de defesa e +8% de bloqueio.', { defPct: 0.10, blockChance: 0.08 }),
        passive('guerreiro:guardiao:4', 'Retribuição', 'Reflete 15% de todo dano recebido de volta no inimigo.', { thornsPct: 0.15 }),
        active('guerreiro:guardiao:5', 'Postura Defensiva', 'Habilidade ativa: +30% de defesa por 3 rodadas. Recarga de 5 rodadas.', {
          name: 'Postura Defensiva', desc: '+30% de defesa por 3 rodadas.', cooldown: 5,
          condition: { type: 'always' }, effect: { kind: 'buffDef', buffPct: 0.30, buffRounds: 3 },
        }),
      ],
    },
    {
      id: 'duelista', name: 'Duelista', color: '#c89a2e',
      nodes: [
        attr('guerreiro:duelista:0', 'Golpe Certeiro', '+8% de chance de crítico.', { critPct: 0.08 }),
        attr('guerreiro:duelista:1', 'Lâmina Afiada', '+20% de dano crítico.', { critDmgPct: 0.20 }),
        attr('guerreiro:duelista:2', 'Fluidez', '+8% de chance de crítico.', { critPct: 0.08 }),
        attr('guerreiro:duelista:3', 'Ponto Fraco', '+30% de dano crítico.', { critDmgPct: 0.30 }),
        passive('guerreiro:duelista:4', 'Instinto Assassino', 'Cura 5% da vida máxima sempre que você acerta um crítico.', { onCritHealPct: 0.05 }),
        active('guerreiro:duelista:5', 'Fúria do Duelo', 'Habilidade ativa: garante um acerto crítico. Recarga de 4 rodadas.', {
          name: 'Fúria do Duelo', desc: 'Garante um acerto crítico.', cooldown: 4,
          condition: { type: 'always' }, effect: { kind: 'guaranteedCrit' },
        }),
      ],
    },
  ],
  mago: [
    {
      id: 'piromante', name: 'Piromante', color: '#c1502e',
      nodes: [
        attr('mago:piromante:0', 'Chama Menor', '+8% de dano.', { dmgPct: 0.08 }),
        attr('mago:piromante:1', 'Brasas', '+6 de dano fixo por ataque.', { flatBonusDmg: 6 }),
        attr('mago:piromante:2', 'Combustão', '+8% de dano adicional.', { dmgPct: 0.08 }),
        attr('mago:piromante:3', 'Inferno', '+14 de dano fixo por ataque.', { flatBonusDmg: 14 }),
        passive('mago:piromante:4', 'Chama Interior', 'Cura 5% do dano causado.', { lifestealPct: 0.05 }),
        active('mago:piromante:5', 'Queimadura', 'Habilidade ativa: incendeia o inimigo, causando dano contínuo por 3 rodadas. Recarga de 3 rodadas.', {
          name: 'Queimadura', desc: 'Incendeia o inimigo, causando dano contínuo por 3 rodadas.', cooldown: 3,
          condition: { type: 'always' }, effect: { kind: 'applyStatus', status: 'burn', statusRounds: 3, statusDmgPct: 0.5 },
        }),
      ],
    },
    {
      id: 'gelido', name: 'Gélido', color: '#3f7ab8',
      nodes: [
        attr('mago:gelido:0', 'Casco de Gelo', '+8% de defesa.', { defPct: 0.08 }),
        attr('mago:gelido:1', 'Escudo de Gelo', '12% de chance de bloquear metade do dano recebido.', { blockChance: 0.12 }),
        attr('mago:gelido:2', 'Ar Glacial', '+8% de defesa adicional.', { defPct: 0.08 }),
        attr('mago:gelido:3', 'Glacial', '+10% de defesa e +10% de bloqueio.', { defPct: 0.10, blockChance: 0.10 }),
        passive('mago:gelido:4', 'Núcleo Congelante', '+12 de vida máxima.', { maxHpFlat: 12 }),
        active('mago:gelido:5', 'Barreira de Gelo', 'Habilidade ativa: +25% de defesa por 3 rodadas. Recarga de 5 rodadas.', {
          name: 'Barreira de Gelo', desc: '+25% de defesa por 3 rodadas.', cooldown: 5,
          condition: { type: 'always' }, effect: { kind: 'buffDef', buffPct: 0.25, buffRounds: 3 },
        }),
      ],
    },
    {
      id: 'eletromante', name: 'Eletromante', color: '#c89a2e',
      nodes: [
        attr('mago:eletromante:0', 'Faísca', '+8% de chance de crítico.', { critPct: 0.08 }),
        attr('mago:eletromante:1', 'Choque', '+20% de dano crítico.', { critDmgPct: 0.20 }),
        attr('mago:eletromante:2', 'Sobrecarga', '+8% de chance de crítico.', { critPct: 0.08 }),
        attr('mago:eletromante:3', 'Tempestade', '+30% de dano crítico.', { critDmgPct: 0.30 }),
        passive('mago:eletromante:4', 'Condutor', 'Reflete 12% de todo dano recebido de volta no inimigo.', { thornsPct: 0.12 }),
        active('mago:eletromante:5', 'Choque em Cadeia', 'Habilidade ativa: só pode ser usada com o inimigo em chamas — causa 2x de dano. Recarga de 3 rodadas.', {
          name: 'Choque em Cadeia', desc: 'Dano extra em inimigos em chamas.', cooldown: 3,
          condition: { type: 'enemyHasStatus', status: 'burn' }, effect: { kind: 'bonusVsStatus', dmgMult: 2.0 },
        }),
      ],
    },
  ],
  assassino: [
    {
      id: 'veneno', name: 'Veneno', color: '#4f7a3a',
      nodes: [
        attr('assassino:veneno:0', 'Lâmina Envenenada', '+8% de dano.', { dmgPct: 0.08 }),
        attr('assassino:veneno:1', 'Toxina Concentrada', '+6 de dano fixo por ataque.', { flatBonusDmg: 6 }),
        attr('assassino:veneno:2', 'Sangue Fraco', '+8% de dano adicional.', { dmgPct: 0.08 }),
        attr('assassino:veneno:3', 'Peçonha Mortal', '+14 de dano fixo por ataque.', { flatBonusDmg: 14 }),
        passive('assassino:veneno:4', 'Sangue Envenenado', 'Cura 7% do dano causado.', { lifestealPct: 0.07 }),
        active('assassino:veneno:5', 'Golpe Peçonhento', 'Habilidade ativa: envenena o inimigo, causando dano contínuo por 4 rodadas. Recarga de 4 rodadas.', {
          name: 'Golpe Peçonhento', desc: 'Envenena o inimigo, causando dano contínuo por 4 rodadas.', cooldown: 4,
          condition: { type: 'always' }, effect: { kind: 'applyStatus', status: 'poison', statusRounds: 4, statusDmgPct: 0.4 },
        }),
      ],
    },
    {
      id: 'sombras', name: 'Sombras', color: '#5b5f6a',
      nodes: [
        attr('assassino:sombras:0', 'Passos Silenciosos', '+8% de defesa.', { defPct: 0.08 }),
        attr('assassino:sombras:1', 'Vulto', '12% de chance de esquivar e reduzir o dano à metade.', { blockChance: 0.12 }),
        attr('assassino:sombras:2', 'Instinto', '+8% de defesa adicional.', { defPct: 0.08 }),
        attr('assassino:sombras:3', 'Golpe das Sombras', '+10% de defesa e +10% de esquiva.', { defPct: 0.10, blockChance: 0.10 }),
        passive('assassino:sombras:4', 'Reflexos', 'Reflete 10% de todo dano recebido de volta no inimigo.', { thornsPct: 0.10 }),
        active('assassino:sombras:5', 'Passo nas Sombras', 'Habilidade ativa: +25% de chance de esquiva por 3 rodadas. Recarga de 5 rodadas.', {
          name: 'Passo nas Sombras', desc: '+25% de chance de esquiva por 3 rodadas.', cooldown: 5,
          condition: { type: 'always' }, effect: { kind: 'buffBlock', buffPct: 0.25, buffRounds: 3 },
        }),
      ],
    },
    {
      id: 'laminas', name: 'Lâminas Gêmeas', color: '#c89a2e',
      nodes: [
        attr('assassino:laminas:0', 'Fio Duplo', '+8% de chance de crítico.', { critPct: 0.08 }),
        attr('assassino:laminas:1', 'Corte Preciso', '+20% de dano crítico.', { critDmgPct: 0.20 }),
        attr('assassino:laminas:2', 'Dança das Lâminas', '+8% de chance de crítico.', { critPct: 0.08 }),
        attr('assassino:laminas:3', 'Execução', '+30% de dano crítico.', { critDmgPct: 0.30 }),
        passive('assassino:laminas:4', 'Fúria Silenciosa', 'Cura 6% da vida máxima sempre que você acerta um crítico.', { onCritHealPct: 0.06 }),
        active('assassino:laminas:5', 'Golpe Fatal', 'Habilidade ativa: só pode ser usada com o inimigo envenenado — causa 2.4x de dano. Recarga de 3 rodadas.', {
          name: 'Golpe Fatal', desc: 'Dano extra em inimigos envenenados.', cooldown: 3,
          condition: { type: 'enemyHasStatus', status: 'poison' }, effect: { kind: 'bonusVsStatus', dmgMult: 2.4 },
        }),
      ],
    },
  ],
};

export function unlockedCountInPath(path: SkillPath, unlocked: string[]): number {
  let count = 0;
  for (const n of path.nodes) { if (unlocked.includes(n.id)) count++; else break; }
  return count;
}

export function canUnlock(path: SkillPath, nodeIndex: number, unlocked: string[]): boolean {
  return unlockedCountInPath(path, unlocked) === nodeIndex;
}

export function computeSkillBonuses(classId: ClassId, unlocked: string[]): Required<SkillEffect> {
  const totals: Required<SkillEffect> = {
    dmgPct: 0, defPct: 0, critPct: 0, critDmgPct: 0, blockChance: 0, flatBonusDmg: 0, lowHpDmgScale: 0,
    maxHpFlat: 0, lifestealPct: 0, thornsPct: 0, onCritHealPct: 0,
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
