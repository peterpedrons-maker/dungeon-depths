import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Skill, LearnedSkill, calculateEstimatedDamage } from '@/types/skills';
import { getClassSkills, canLearnSkill } from '@/lib/skillData';
import { 
  Shield, Volume2, Sword, Heart, ShieldCheck, Droplet,
  Target, Cloud, Skull, Zap, Crosshair, Flame,
  Snowflake, Sparkles, Brain, Wand2,
  RotateCcw, Star, Eye, Wind, CloudRain, ArrowRight, Axe,
  Lock, Check, Plus, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Shield, Volume2, Sword, Heart, ShieldCheck, Droplet,
  Target, Cloud, Skull, Zap, Crosshair, Flame,
  Snowflake, Sparkles, Brain, Wand2,
  RotateCcw, Star, Eye, Wind, CloudRain, ArrowRight, Axe,
};

interface SkillTreeProps {
  onClose?: () => void;
}

export function SkillTree({ onClose }: SkillTreeProps) {
  const { state, dispatch } = useGame();
  const { character } = state;
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  
  if (!character) return null;
  
  const classSkills = getClassSkills(character.class);
  const activeSkills = classSkills.filter(s => s.type === 'active');
  const passiveSkills = classSkills.filter(s => s.type === 'passive');
  
  const getLearnedSkill = (skillId: string): LearnedSkill | undefined => {
    return character.skills.find(s => s.skillId === skillId);
  };
  
  const handleLearnSkill = (skillId: string) => {
    dispatch({ type: 'LEARN_SKILL', skillId });
    setSelectedSkill(null);
  };
  
  const renderSkillCard = (skill: Skill, tier: number) => {
    const learned = getLearnedSkill(skill.id);
    const { canLearn, reason } = canLearnSkill(skill, character.stats.level, character.skills);
    const isMaxRank = learned && learned.rank >= skill.maxRank;
    const IconComponent = ICON_MAP[skill.icon] || Sparkles;
    
    const isLearned = !!learned;
    const canUpgrade = isLearned && !isMaxRank && canLearn && character.skillPoints > 0;
    const canLearnNew = !isLearned && canLearn && character.skillPoints > 0;
    
    // Get estimated damage for tooltip preview
    const estimated = skill.type === 'active' ? calculateEstimatedDamage(
      skill,
      learned?.rank || 1,
      {
        attack: character.stats.attack,
        magicAttack: character.stats.magicAttack,
        maxHealth: character.stats.maxHealth,
        maxMana: character.stats.maxMana,
        intelligence: character.attributes.intelligence,
        strength: character.attributes.strength,
        dexterity: character.attributes.dexterity,
      }
    ) : null;
    
    return (
      <div
        key={skill.id}
        className={cn(
          'relative path-card rounded-xl p-4 cursor-pointer transition-all duration-200',
          selectedSkill?.id === skill.id && 'ring-2 ring-primary',
          isLearned && 'border-primary/50 bg-primary/5',
          !canLearn && !isLearned && 'opacity-50'
        )}
        onClick={() => setSelectedSkill(skill)}
      >
        {/* Tier indicator */}
        {tier > 1 && (
          <div className="absolute -top-2 left-4 px-2 py-0.5 text-xs rounded bg-muted/80 text-muted-foreground">
            Tier {tier}
          </div>
        )}
        
        {/* Rank indicator */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          {[...Array(skill.maxRank)].map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-2.5 h-2.5 rounded-full border-2 transition-all',
                i < (learned?.rank || 0)
                  ? 'bg-primary border-primary shadow-sm shadow-primary/50'
                  : 'bg-transparent border-muted-foreground/40'
              )}
            />
          ))}
        </div>
        
        <div className="flex items-start gap-3">
          <div className={cn(
            'p-3 rounded-lg transition-all',
            isLearned ? 'bg-primary/20 shadow-md shadow-primary/20' : 'bg-muted/50'
          )}>
            <IconComponent className={cn(
              'h-7 w-7',
              isLearned ? 'text-primary' : 'text-muted-foreground'
            )} />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className={cn(
              'font-cinzel text-sm font-semibold truncate',
              isLearned ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {skill.name}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {skill.description}
            </p>
            
            {skill.type === 'active' && (
              <div className="flex items-center gap-2 mt-2 text-xs">
                <span className="text-blue-400 font-semibold">{skill.manaCost} MP</span>
                {skill.cooldown && (
                  <span className="text-muted-foreground">{skill.cooldown}t CD</span>
                )}
                {estimated && estimated.totalDamage > 0 && (
                  <span className="text-red-400">~{estimated.totalDamage} dmg</span>
                )}
                {estimated && estimated.totalHeal > 0 && (
                  <span className="text-green-400">+{estimated.totalHeal} HP</span>
                )}
              </div>
            )}
            
            {skill.type === 'passive' && skill.passiveBonus && (
              <div className="flex flex-wrap gap-1 mt-2">
                {skill.passiveBonus.slice(0, 2).map((bonus, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 text-xs">
                    +{bonus.value * (learned?.rank || 1)} {bonus.stat.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                ))}
              </div>
            )}
            
            {!canLearn && !isLearned && reason && (
              <div className="flex items-center gap-1 mt-2 text-xs text-yellow-500">
                <Lock className="h-3 w-3" />
                <span>{reason}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Learn/Upgrade button */}
        {(canLearnNew || canUpgrade) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLearnSkill(skill.id);
            }}
            className="absolute bottom-2 right-2 p-2 rounded-full bg-primary/20 hover:bg-primary/40 transition-colors group"
          >
            <Plus className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
          </button>
        )}
        
        {isMaxRank && (
          <div className="absolute bottom-2 right-2 p-2 rounded-full bg-green-500/20">
            <Check className="h-4 w-4 text-green-500" />
          </div>
        )}
      </div>
    );
  };
  
  // Group skills by tier (based on requirements)
  const getSkillTier = (skill: Skill): number => {
    if (!skill.requiredLevel && !skill.requiredSkillId) return 1;
    if (skill.requiredLevel && skill.requiredLevel >= 5) return 3;
    if (skill.requiredLevel && skill.requiredLevel >= 3) return 2;
    if (skill.requiredSkillId) return 2;
    return 1;
  };
  
  const groupedActiveSkills = {
    tier1: activeSkills.filter(s => getSkillTier(s) === 1),
    tier2: activeSkills.filter(s => getSkillTier(s) === 2),
    tier3: activeSkills.filter(s => getSkillTier(s) === 3),
  };
  
  const groupedPassiveSkills = {
    tier1: passiveSkills.filter(s => getSkillTier(s) === 1),
    tier2: passiveSkills.filter(s => getSkillTier(s) === 2),
    tier3: passiveSkills.filter(s => getSkillTier(s) === 3),
  };
  
  return (
    <div className="path-card rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-cinzel text-2xl font-bold text-foreground">Skill Tree</h2>
          <p className="text-sm text-muted-foreground capitalize">{character.class} Skills</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 border border-primary/30">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <span className="font-cinzel text-lg font-bold text-primary">
              {character.skillPoints}
            </span>
            <span className="text-sm text-muted-foreground">Points</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      
      <ScrollArea className="h-[calc(100vh-350px)] pr-4">
        {/* Active Skills Section */}
        <div className="mb-8">
          <h3 className="font-cinzel text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Sword className="h-5 w-5 text-primary" />
            Active Skills
          </h3>
          
          {/* Tier 1 */}
          <div className="mb-4">
            <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Tier 1 - Basic</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groupedActiveSkills.tier1.map(skill => renderSkillCard(skill, 1))}
            </div>
          </div>
          
          {/* Arrow connector */}
          {groupedActiveSkills.tier2.length > 0 && (
            <div className="flex justify-center my-3">
              <ChevronRight className="h-6 w-6 text-primary/50 rotate-90" />
            </div>
          )}
          
          {/* Tier 2 */}
          {groupedActiveSkills.tier2.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Tier 2 - Advanced</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupedActiveSkills.tier2.map(skill => renderSkillCard(skill, 2))}
              </div>
            </div>
          )}
          
          {/* Arrow connector */}
          {groupedActiveSkills.tier3.length > 0 && (
            <div className="flex justify-center my-3">
              <ChevronRight className="h-6 w-6 text-primary/50 rotate-90" />
            </div>
          )}
          
          {/* Tier 3 */}
          {groupedActiveSkills.tier3.length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Tier 3 - Ultimate</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupedActiveSkills.tier3.map(skill => renderSkillCard(skill, 3))}
              </div>
            </div>
          )}
        </div>
        
        {/* Passive Skills Section */}
        <div>
          <h3 className="font-cinzel text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-secondary" />
            Passive Skills
          </h3>
          
          {/* Tier 1 */}
          <div className="mb-4">
            <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Tier 1 - Basic</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groupedPassiveSkills.tier1.map(skill => renderSkillCard(skill, 1))}
            </div>
          </div>
          
          {/* Arrow connector */}
          {groupedPassiveSkills.tier2.length > 0 && (
            <div className="flex justify-center my-3">
              <ChevronRight className="h-6 w-6 text-secondary/50 rotate-90" />
            </div>
          )}
          
          {/* Tier 2 */}
          {groupedPassiveSkills.tier2.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Tier 2 - Advanced</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupedPassiveSkills.tier2.map(skill => renderSkillCard(skill, 2))}
              </div>
            </div>
          )}
          
          {/* Arrow connector */}
          {groupedPassiveSkills.tier3.length > 0 && (
            <div className="flex justify-center my-3">
              <ChevronRight className="h-6 w-6 text-secondary/50 rotate-90" />
            </div>
          )}
          
          {/* Tier 3 */}
          {groupedPassiveSkills.tier3.length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Tier 3 - Mastery</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupedPassiveSkills.tier3.map(skill => renderSkillCard(skill, 3))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Selected Skill Details */}
      {selectedSkill && (
        <div className="mt-6 p-4 rounded-lg border border-border bg-card/50">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {(() => {
                const IconComponent = ICON_MAP[selectedSkill.icon] || Sparkles;
                return <IconComponent className="h-8 w-8 text-primary" />;
              })()}
              <div>
                <h4 className="font-cinzel text-lg font-bold">{selectedSkill.name}</h4>
                <p className="text-sm text-muted-foreground capitalize">
                  {selectedSkill.type} Skill • Max Rank {selectedSkill.maxRank}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedSkill(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
          
          <p className="mt-3 text-foreground">{selectedSkill.description}</p>
          
          {selectedSkill.type === 'active' && (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 font-semibold">
                {selectedSkill.manaCost} Mana
              </span>
              {selectedSkill.cooldown && (
                <span className="px-2 py-1 rounded bg-muted text-muted-foreground">
                  {selectedSkill.cooldown} Turn Cooldown
                </span>
              )}
              {selectedSkill.visualEffect && (
                <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 capitalize">
                  {selectedSkill.visualEffect} Effect
                </span>
              )}
            </div>
          )}
          
          {selectedSkill.passiveBonus && selectedSkill.passiveBonus.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-muted-foreground mb-1">Bonuses per rank:</p>
              <div className="flex flex-wrap gap-2">
                {selectedSkill.passiveBonus.map((bonus, i) => (
                  <span key={i} className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-sm font-semibold">
                    +{bonus.value} {bonus.stat.replace(/([A-Z])/g, ' $1').trim()}
                    {bonus.isPercent && '%'}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {selectedSkill.effects && selectedSkill.effects.length > 0 && selectedSkill.type === 'active' && (
            <div className="mt-3">
              <p className="text-sm text-muted-foreground mb-1">Effects:</p>
              <div className="flex flex-wrap gap-2">
                {selectedSkill.effects.map((effect, i) => (
                  <span key={i} className="px-2 py-1 rounded bg-primary/20 text-primary text-sm capitalize">
                    {effect.type.replace(/_/g, ' ')}: {effect.value}
                    {effect.scaling && ` (+${Math.round(effect.scaling.ratio * 100)}% ${effect.scaling.stat})`}
                    {effect.duration && ` (${effect.duration}t)`}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Learn Button */}
          {(() => {
            const learned = getLearnedSkill(selectedSkill.id);
            const { canLearn, reason } = canLearnSkill(selectedSkill, character.stats.level, character.skills);
            const isMaxRank = learned && learned.rank >= selectedSkill.maxRank;
            
            if (isMaxRank) {
              return (
                <div className="mt-4 p-3 rounded-lg bg-green-500/20 text-green-400 text-center font-semibold">
                  ✓ Max Rank Achieved
                </div>
              );
            }
            
            if (!canLearn) {
              return (
                <div className="mt-4 p-3 rounded-lg bg-yellow-500/20 text-yellow-500 text-center">
                  <Lock className="h-4 w-4 inline mr-2" />
                  {reason}
                </div>
              );
            }
            
            if (character.skillPoints <= 0) {
              return (
                <div className="mt-4 p-3 rounded-lg bg-muted text-muted-foreground text-center">
                  No skill points available
                </div>
              );
            }
            
            return (
              <button
                onClick={() => handleLearnSkill(selectedSkill.id)}
                className="mt-4 w-full fantasy-button py-3 font-cinzel text-primary-foreground"
              >
                {learned ? `Upgrade to Rank ${learned.rank + 1}` : 'Learn Skill'} (1 Point)
              </button>
            );
          })()}
        </div>
      )}
    </div>
  );
}
