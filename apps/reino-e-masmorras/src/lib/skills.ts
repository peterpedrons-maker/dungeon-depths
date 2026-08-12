import { ClassId } from '../types/game';

export interface SkillEffect {
  dmgPct?: number;        // multiplies attack power
  defPct?: number;        // multiplies defense
  critPct?: number;       // adds to crit chance
  critDmgPct?: number;    // adds to crit damage multiplier
  blockChance?: number;   // chance to halve an incoming hit
  flatBonusDmg?: number;  // flat damage added to every hit
  lowHpDmgScale?: number; // extra damage% scaling with missing HP
}

export interface SkillNode {
  id: string;
  name: string;
  desc: string;
  effect: SkillEffect;
}

export interface SkillPath {
  id: string;
  name: string;
  color: string;
  nodes: SkillNode[]; // unlocked strictly in order
}

function node(id: string, name: string, desc: string, effect: SkillEffect): SkillNode {
  return { id, name, desc, effect };
}

export const SKILL_TREES: Record<ClassId, SkillPath[]> = {
  guerreiro: [
    {
      id: 'furioso', name: 'Furioso', color: '#a5432f',
      nodes: [
        node('guerreiro:furioso:0', 'Golpe Pesado', '+8% de dano.', { dmgPct: 0.08 }),
        node('guerreiro:furioso:1', 'Sede de Sangue', '+8% de dano adicional.', { dmgPct: 0.08 }),
        node('guerreiro:furioso:2', 'Fúria Crescente', 'Quanto menor sua vida, mais dano você causa (até +20%).', { lowHpDmgScale: 0.20 }),
        node('guerreiro:furioso:3', 'Fúria Descontrolada', '+15% de dano final.', { dmgPct: 0.15 }),
      ],
    },
    {
      id: 'guardiao', name: 'Guardião', color: '#6b7280',
      nodes: [
        node('guerreiro:guardiao:0', 'Pele de Ferro', '+8% de defesa.', { defPct: 0.08 }),
        node('guerreiro:guardiao:1', 'Postura Firme', '+8% de defesa adicional.', { defPct: 0.08 }),
        node('guerreiro:guardiao:2', 'Escudo Reflexivo', '12% de chance de bloquear metade do dano recebido.', { blockChance: 0.12 }),
        node('guerreiro:guardiao:3', 'Última Resistência', '+10% de defesa e +8% de bloqueio.', { defPct: 0.10, blockChance: 0.08 }),
      ],
    },
    {
      id: 'duelista', name: 'Duelista', color: '#c89a2e',
      nodes: [
        node('guerreiro:duelista:0', 'Golpe Certeiro', '+8% de chance de crítico.', { critPct: 0.08 }),
        node('guerreiro:duelista:1', 'Lâmina Afiada', '+20% de dano crítico.', { critDmgPct: 0.20 }),
        node('guerreiro:duelista:2', 'Fluidez', '+8% de chance de crítico.', { critPct: 0.08 }),
        node('guerreiro:duelista:3', 'Ponto Fraco', '+30% de dano crítico.', { critDmgPct: 0.30 }),
      ],
    },
  ],
  mago: [
    {
      id: 'piromante', name: 'Piromante', color: '#c1502e',
      nodes: [
        node('mago:piromante:0', 'Chama Menor', '+8% de dano.', { dmgPct: 0.08 }),
        node('mago:piromante:1', 'Brasas', '+6 de dano fixo por ataque.', { flatBonusDmg: 6 }),
        node('mago:piromante:2', 'Combustão', '+8% de dano adicional.', { dmgPct: 0.08 }),
        node('mago:piromante:3', 'Inferno', '+14 de dano fixo por ataque.', { flatBonusDmg: 14 }),
      ],
    },
    {
      id: 'gelido', name: 'Gélido', color: '#3f7ab8',
      nodes: [
        node('mago:gelido:0', 'Casco de Gelo', '+8% de defesa.', { defPct: 0.08 }),
        node('mago:gelido:1', 'Escudo de Gelo', '12% de chance de bloquear metade do dano recebido.', { blockChance: 0.12 }),
        node('mago:gelido:2', 'Ar Glacial', '+8% de defesa adicional.', { defPct: 0.08 }),
        node('mago:gelido:3', 'Glacial', '+10% de defesa e +10% de bloqueio.', { defPct: 0.10, blockChance: 0.10 }),
      ],
    },
    {
      id: 'eletromante', name: 'Eletromante', color: '#c89a2e',
      nodes: [
        node('mago:eletromante:0', 'Faísca', '+8% de chance de crítico.', { critPct: 0.08 }),
        node('mago:eletromante:1', 'Choque', '+20% de dano crítico.', { critDmgPct: 0.20 }),
        node('mago:eletromante:2', 'Sobrecarga', '+8% de chance de crítico.', { critPct: 0.08 }),
        node('mago:eletromante:3', 'Tempestade', '+30% de dano crítico.', { critDmgPct: 0.30 }),
      ],
    },
  ],
  assassino: [
    {
      id: 'veneno', name: 'Veneno', color: '#4f7a3a',
      nodes: [
        node('assassino:veneno:0', 'Lâmina Envenenada', '+8% de dano.', { dmgPct: 0.08 }),
        node('assassino:veneno:1', 'Toxina Concentrada', '+6 de dano fixo por ataque.', { flatBonusDmg: 6 }),
        node('assassino:veneno:2', 'Sangue Fraco', '+8% de dano adicional.', { dmgPct: 0.08 }),
        node('assassino:veneno:3', 'Peçonha Mortal', '+14 de dano fixo por ataque.', { flatBonusDmg: 14 }),
      ],
    },
    {
      id: 'sombras', name: 'Sombras', color: '#5b5f6a',
      nodes: [
        node('assassino:sombras:0', 'Passos Silenciosos', '+8% de defesa.', { defPct: 0.08 }),
        node('assassino:sombras:1', 'Vulto', '12% de chance de esquivar e reduzir o dano à metade.', { blockChance: 0.12 }),
        node('assassino:sombras:2', 'Instinto', '+8% de defesa adicional.', { defPct: 0.08 }),
        node('assassino:sombras:3', 'Golpe das Sombras', '+10% de defesa e +10% de esquiva.', { defPct: 0.10, blockChance: 0.10 }),
      ],
    },
    {
      id: 'laminas', name: 'Lâminas Gêmeas', color: '#c89a2e',
      nodes: [
        node('assassino:laminas:0', 'Fio Duplo', '+8% de chance de crítico.', { critPct: 0.08 }),
        node('assassino:laminas:1', 'Corte Preciso', '+20% de dano crítico.', { critDmgPct: 0.20 }),
        node('assassino:laminas:2', 'Dança das Lâminas', '+8% de chance de crítico.', { critPct: 0.08 }),
        node('assassino:laminas:3', 'Execução', '+30% de dano crítico.', { critDmgPct: 0.30 }),
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
  const totals: Required<SkillEffect> = { dmgPct: 0, defPct: 0, critPct: 0, critDmgPct: 0, blockChance: 0, flatBonusDmg: 0, lowHpDmgScale: 0 };
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
    }
  }
  return totals;
}
