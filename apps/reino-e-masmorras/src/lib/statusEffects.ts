import { mitigatedBase } from '../game/combat.ts';

// Dano contínuo recebido pelo jogador — Poison e Sangramento têm identidades
// mecânicas distintas por pedido direto do usuário (antes eram idênticos,
// só com nomes/ícones diferentes): Poison ignora armadura e escala com a
// Vida Máxima do alvo (fica mais perigoso contra quem investiu em vida,
// não em DEF); Sangramento é dano físico de verdade, mitigado pela mesma
// fórmula ATK-vs-DEF de um golpe direto (mitigatedBase), então machuca
// menos quem tem DEF alta. Só se aplica ao Poison/Sangramento recebidos
// pelo jogador de inimigos — o 'poison' usado pelo Bardo (dano ofensivo
// escalado por MATK contra o inimigo, com nome de "amaldiçoar") e o
// 'poison' das armadilhas do Caçador (dano ofensivo contra o inimigo,
// escalado por ATK) continuam usando a fórmula antiga, sem relação com
// esta.
//
// 1% por tique por instância — calibrado pro pior caso de empilhamento
// (o jogador pode acumular até 3 instâncias simultâneas de Poison, que
// somam no mesmo tique) sem virar sangria constante numa dungeon cheia de
// fontes de veneno (ex.: Covil de Aranhas).
export const POISON_DMG_PCT_OF_MAXHP_PER_TICK = 0.01;
export const BLEED_DMG_MULT = 0.35;

export function poisonDmgPerTick(targetMaxHp: number): number {
  return Math.max(1, Math.round(targetMaxHp * POISON_DMG_PCT_OF_MAXHP_PER_TICK));
}
export function bleedDmgPerTick(sourceAtk: number, targetDef: number): number {
  return Math.max(1, Math.round(mitigatedBase(sourceAtk, targetDef) * BLEED_DMG_MULT));
}
