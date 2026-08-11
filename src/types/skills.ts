// Skill System Types - WoW-style skill trees with active and passive skills

import { CharacterClass } from './classes';
import { SkillEffectType as VisualEffectType } from '@/components/game/SkillEffects';

export type SkillType = 'active' | 'passive';

export type SkillTargetType = 'enemy' | 'self' | 'none';

// Effect types for skills
export type SkillEffectType = 
  | 'damage'           // Direct damage
  | 'magic_damage'     // Magic-based damage
  | 'heal'             // Heal self
  | 'heal_percent'     // Heal % of max health
  | 'buff_attack'      // Temporary attack boost
  | 'buff_defense'     // Temporary defense boost
  | 'buff_crit'        // Temporary crit chance boost
  | 'debuff_defense'   // Reduce enemy defense
  | 'debuff_attack'    // Reduce player attack (enemy ability)
  | 'stun'             // Skip enemy turn
  | 'bleed'            // Damage over time
  | 'poison'           // Damage over time (enemy ability on player)
  | 'lifesteal_attack' // Attack that heals based on damage
  | 'lifesteal'        // Enemy lifesteal ability
  | 'enrage'           // Enemy attack boost
  | 'shield'           // Absorb damage
  | 'mana_restore';    // Restore mana

export interface SkillEffect {
  type: SkillEffectType;
  value: number;          // Base value (damage amount, heal amount, buff %)
  duration?: number;      // For buffs/debuffs: number of turns
  scaling?: {             // Stat scaling for the effect
    stat: 'attack' | 'magicAttack' | 'maxHealth' | 'maxMana' | 'intelligence' | 'strength' | 'dexterity';
    ratio: number;        // Multiplier for the stat
  };
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  type: SkillType;
  icon: string;           // Lucide icon name or emoji
  visualEffect?: VisualEffectType; // Visual effect to display
  manaCost: number;       // 0 for passives
  cooldown?: number;      // Turns until can be used again (active only)
  targetType: SkillTargetType;
  effects: SkillEffect[];
  // Passive bonuses (for passive skills)
  passiveBonus?: {
    stat: 'attack' | 'defense' | 'magicAttack' | 'magicDefense' | 'maxHealth' | 'maxMana' | 
          'critChance' | 'critDamage' | 'dodge' | 'lifeSteal' | 'goldFind' | 'expBonus';
    value: number;        // Flat bonus or percentage
    isPercent?: boolean;  // If true, treated as percentage bonus
  }[];
  // Skill tree requirements
  requiredLevel?: number;     // Minimum character level
  requiredSkillId?: string;   // Must have this skill learned first
  maxRank: number;            // Max points that can be invested (1-3 typically)
  rankBonuses?: number[];     // How much each rank improves the base effect (multipliers)
}

export interface LearnedSkill {
  skillId: string;
  rank: number;           // Current invested points (1 to maxRank)
  currentCooldown: number; // Turns remaining on cooldown (0 = ready)
}

// Active buff/debuff applied during combat
export interface ActiveBuff {
  skillId: string;
  effectType: SkillEffectType;
  value: number;
  remainingTurns: number;
  isDebuff?: boolean;
}

// Skill tree structure per class
export interface ClassSkillTree {
  className: CharacterClass;
  skills: Skill[];
}

// Constants
export const SKILL_POINTS_PER_LEVEL = 1;
export const STARTING_SKILL_POINTS = 1;

// Helper function to calculate scaled effect value
export function calculateSkillEffectValue(
  effect: SkillEffect,
  rank: number,
  rankBonuses: number[] | undefined,
  stats: { attack: number; magicAttack: number; maxHealth: number; maxMana: number; 
           intelligence?: number; strength?: number; dexterity?: number }
): number {
  let baseValue = effect.value;
  
  // Apply rank multiplier
  if (rankBonuses && rankBonuses[rank - 1]) {
    baseValue *= rankBonuses[rank - 1];
  } else {
    baseValue *= rank; // Default: linear scaling
  }
  
  // Apply stat scaling
  if (effect.scaling) {
    const statValue = stats[effect.scaling.stat as keyof typeof stats] || 0;
    baseValue += statValue * effect.scaling.ratio;
  }
  
  return Math.floor(baseValue);
}

// Get total passive bonuses from learned skills
export function getPassiveBonuses(
  learnedSkills: LearnedSkill[],
  allSkills: Skill[]
): Record<string, number> {
  const bonuses: Record<string, number> = {};
  
  for (const learned of learnedSkills) {
    const skill = allSkills.find(s => s.id === learned.skillId);
    if (!skill || skill.type !== 'passive' || !skill.passiveBonus) continue;
    
    for (const bonus of skill.passiveBonus) {
      const key = bonus.stat + (bonus.isPercent ? '_percent' : '');
      const value = bonus.value * learned.rank;
      bonuses[key] = (bonuses[key] || 0) + value;
    }
  }
  
  return bonuses;
}

// Get effect description for tooltip
export function getEffectDescription(effect: SkillEffect, rank: number, rankBonuses?: number[]): string {
  let multiplier = 1;
  if (rankBonuses && rankBonuses[rank - 1]) {
    multiplier = rankBonuses[rank - 1];
  } else {
    multiplier = rank;
  }
  
  const value = Math.floor(effect.value * multiplier);
  
  switch (effect.type) {
    case 'damage':
      return `${value} physical damage${effect.scaling ? ` (+${Math.round(effect.scaling.ratio * 100)}% ${effect.scaling.stat})` : ''}`;
    case 'magic_damage':
      return `${value} magic damage${effect.scaling ? ` (+${Math.round(effect.scaling.ratio * 100)}% ${effect.scaling.stat})` : ''}`;
    case 'heal':
      return `Heal ${value} HP${effect.scaling ? ` (+${Math.round(effect.scaling.ratio * 100)}% ${effect.scaling.stat})` : ''}`;
    case 'heal_percent':
      return `Heal ${value}% of max HP`;
    case 'buff_attack':
      return `+${value}% attack for ${effect.duration} turns`;
    case 'buff_defense':
      return `+${value}% defense for ${effect.duration} turns`;
    case 'buff_crit':
      return `+${value}% crit chance for ${effect.duration} turns`;
    case 'debuff_defense':
      return `Reduce enemy defense by ${value} for ${effect.duration} turns`;
    case 'stun':
      return `Stun for ${value} turn(s)`;
    case 'bleed':
      return `${value} bleed damage per turn for ${effect.duration} turns`;
    case 'lifesteal_attack':
      return `${value} damage, heal 50% of damage dealt`;
    case 'shield':
      return `Absorb ${value} damage${effect.scaling ? ` (+${Math.round(effect.scaling.ratio * 100)}% ${effect.scaling.stat})` : ''}`;
    case 'mana_restore':
      return `Restore ${value} mana`;
    default:
      return `${effect.type}: ${value}`;
  }
}

// Calculate estimated damage for tooltip
export function calculateEstimatedDamage(
  skill: Skill,
  rank: number,
  stats: { attack: number; magicAttack: number; maxHealth: number; maxMana: number; 
           intelligence?: number; strength?: number; dexterity?: number }
): { totalDamage: number; totalHeal: number; effects: string[] } {
  let totalDamage = 0;
  let totalHeal = 0;
  const effects: string[] = [];
  
  for (const effect of skill.effects) {
    const effectValue = calculateSkillEffectValue(effect, rank, skill.rankBonuses, stats);
    
    switch (effect.type) {
      case 'damage':
      case 'magic_damage':
      case 'lifesteal_attack':
        totalDamage += effectValue;
        effects.push(`${effectValue} ${effect.type === 'magic_damage' ? 'magic' : 'physical'} dmg`);
        break;
      case 'heal':
        totalHeal += effectValue;
        effects.push(`+${effectValue} HP`);
        break;
      case 'heal_percent':
        const percentHeal = Math.floor(stats.maxHealth * (effectValue / 100));
        totalHeal += percentHeal;
        effects.push(`+${effectValue}% HP`);
        break;
      case 'buff_attack':
        effects.push(`+${effectValue}% ATK (${effect.duration}t)`);
        break;
      case 'buff_defense':
        effects.push(`+${effectValue}% DEF (${effect.duration}t)`);
        break;
      case 'buff_crit':
        effects.push(`+${effectValue}% CRIT (${effect.duration}t)`);
        break;
      case 'debuff_defense':
        effects.push(`-${effectValue} enemy DEF (${effect.duration}t)`);
        break;
      case 'stun':
        effects.push(`STUN ${effectValue}t`);
        break;
      case 'bleed':
        effects.push(`${effectValue} bleed/t (${effect.duration}t)`);
        totalDamage += effectValue * (effect.duration || 1);
        break;
      case 'shield':
        effects.push(`${effectValue} shield`);
        break;
      case 'mana_restore':
        effects.push(`+${effectValue} MP`);
        break;
    }
  }
  
  return { totalDamage, totalHeal, effects };
}
