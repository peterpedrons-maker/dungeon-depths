import { Skill, LearnedSkill, calculateEstimatedDamage } from '@/types/skills';
import { 
  Sword, Sparkles, Clock, Droplets, Shield, Heart, Flame, Snowflake,
  Target, Skull, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SkillTooltipProps {
  skill: Skill;
  learned: LearnedSkill;
  stats: {
    attack: number;
    magicAttack: number;
    maxHealth: number;
    maxMana: number;
    mana: number;
    intelligence?: number;
    strength?: number;
    dexterity?: number;
  };
  className?: string;
}

const EFFECT_TYPE_COLORS: Record<string, string> = {
  damage: 'text-red-400',
  magic_damage: 'text-purple-400',
  heal: 'text-green-400',
  heal_percent: 'text-green-400',
  buff_attack: 'text-orange-400',
  buff_defense: 'text-blue-400',
  buff_crit: 'text-yellow-400',
  debuff_defense: 'text-red-400',
  stun: 'text-yellow-500',
  bleed: 'text-red-500',
  lifesteal_attack: 'text-purple-500',
  shield: 'text-cyan-400',
  mana_restore: 'text-blue-400',
};

const EFFECT_TYPE_ICONS: Record<string, React.ReactNode> = {
  damage: <Sword className="h-3 w-3" />,
  magic_damage: <Sparkles className="h-3 w-3" />,
  heal: <Heart className="h-3 w-3" />,
  heal_percent: <Heart className="h-3 w-3" />,
  buff_attack: <Flame className="h-3 w-3" />,
  buff_defense: <Shield className="h-3 w-3" />,
  buff_crit: <Target className="h-3 w-3" />,
  debuff_defense: <Shield className="h-3 w-3" />,
  stun: <Zap className="h-3 w-3" />,
  bleed: <Skull className="h-3 w-3" />,
  lifesteal_attack: <Droplets className="h-3 w-3" />,
  shield: <Snowflake className="h-3 w-3" />,
  mana_restore: <Droplets className="h-3 w-3" />,
};

export function SkillTooltip({ skill, learned, stats, className }: SkillTooltipProps) {
  const { totalDamage, totalHeal, effects } = calculateEstimatedDamage(
    skill,
    learned.rank,
    stats
  );
  
  const canUse = stats.mana >= skill.manaCost && learned.currentCooldown === 0;
  
  return (
    <div className={cn(
      'w-64 p-3 rounded-lg border bg-card/95 backdrop-blur-sm shadow-xl',
      'border-border/50',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-cinzel font-bold text-foreground">{skill.name}</h4>
        <div className="flex items-center gap-1">
          {[...Array(skill.maxRank)].map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-2 h-2 rounded-full',
                i < learned.rank ? 'bg-primary' : 'bg-muted-foreground/30'
              )}
            />
          ))}
        </div>
      </div>
      
      {/* Description */}
      <p className="text-xs text-muted-foreground mb-3">{skill.description}</p>
      
      {/* Cost & Cooldown */}
      <div className="flex items-center gap-3 mb-3 text-xs">
        <div className={cn(
          'flex items-center gap-1 px-2 py-1 rounded',
          stats.mana >= skill.manaCost ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
        )}>
          <Droplets className="h-3 w-3" />
          <span>{skill.manaCost} MP</span>
        </div>
        
        {skill.cooldown && (
          <div className={cn(
            'flex items-center gap-1 px-2 py-1 rounded',
            learned.currentCooldown > 0 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-muted text-muted-foreground'
          )}>
            <Clock className="h-3 w-3" />
            <span>
              {learned.currentCooldown > 0 
                ? `${learned.currentCooldown} turns` 
                : `${skill.cooldown} turn CD`}
            </span>
          </div>
        )}
      </div>
      
      {/* Estimated Values */}
      {(totalDamage > 0 || totalHeal > 0) && (
        <div className="mb-3 p-2 rounded bg-muted/50 border border-border/50">
          <p className="text-xs text-muted-foreground mb-1">Estimated at Rank {learned.rank}:</p>
          <div className="flex flex-wrap gap-2">
            {totalDamage > 0 && (
              <span className="flex items-center gap-1 text-sm font-semibold text-red-400">
                <Sword className="h-3 w-3" />
                {totalDamage} DMG
              </span>
            )}
            {totalHeal > 0 && (
              <span className="flex items-center gap-1 text-sm font-semibold text-green-400">
                <Heart className="h-3 w-3" />
                +{totalHeal} HP
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Effect Breakdown */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground">Effects:</p>
        {skill.effects.map((effect, i) => (
          <div 
            key={i}
            className={cn(
              'flex items-center gap-2 text-xs',
              EFFECT_TYPE_COLORS[effect.type] || 'text-foreground'
            )}
          >
            <span className="flex-shrink-0">
              {EFFECT_TYPE_ICONS[effect.type]}
            </span>
            <span>{effects[i] || effect.type}</span>
          </div>
        ))}
      </div>
      
      {/* Scaling Info */}
      {skill.effects.some(e => e.scaling) && (
        <div className="mt-3 pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            Scales with: {skill.effects
              .filter(e => e.scaling)
              .map(e => e.scaling!.stat)
              .filter((v, i, a) => a.indexOf(v) === i)
              .join(', ')}
          </p>
        </div>
      )}
      
      {/* Status */}
      {!canUse && (
        <div className="mt-3 pt-2 border-t border-border/50">
          {stats.mana < skill.manaCost && (
            <p className="text-xs text-red-400">Not enough mana!</p>
          )}
          {learned.currentCooldown > 0 && (
            <p className="text-xs text-yellow-400">On cooldown: {learned.currentCooldown} turns</p>
          )}
        </div>
      )}
    </div>
  );
}
