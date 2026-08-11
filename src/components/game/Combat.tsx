import { useGame } from '@/contexts/GameContext';
import { Sword, Shield, FlaskConical, DoorOpen, Sparkles, Clock, Droplet, Droplets, Flame, Zap, Heart, Snowflake, Pause, Play } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { FloatingDamage, DamageNumber } from './FloatingDamage';
import dungeonBg from '@/assets/dungeon-mossy.jpg';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getClassSkills } from '@/lib/skillData';
import { Skill } from '@/types/skills';
import { cn } from '@/lib/utils';
import { SkillEffect, getSkillVisualType, SkillEffectType } from './SkillEffects';
import { SkillTooltip } from './SkillTooltip';

// Icon map for skills
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Shield, Sword, Heart, Flame, Snowflake, Sparkles, Droplet, Zap,
  Target: Sparkles, Cloud: Sparkles, Skull: Droplet, Crosshair: Sparkles,
  Brain: Sparkles, Wand2: Sparkles, ShieldCheck: Shield, RotateCcw: Sparkles,
  Star: Sparkles, Eye: Sparkles, Wind: Sparkles, CloudRain: Droplets,
  ArrowRight: Sword, Axe: Sword, Volume2: Sparkles,
};

export function Combat() {
  const { state, dispatch } = useGame();
  const { combat, character } = state;
  const [damages, setDamages] = useState<DamageNumber[]>([]);
  const damageIdRef = useRef(0);
  const prevCombatLogRef = useRef<string[]>([]);
  const [activeSkillEffect, setActiveSkillEffect] = useState<{
    type: SkillEffectType;
    target: 'player' | 'enemy';
  } | null>(null);
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);
  const lastTickRef = useRef(Date.now());
  const animationFrameRef = useRef<number>();

  // Combat tick loop - runs continuously
  useEffect(() => {
    if (!combat || !character) return;

    const tick = () => {
      const now = Date.now();
      const deltaTime = now - lastTickRef.current;
      lastTickRef.current = now;

      if (!combat.isPaused && combat.enemy.health > 0 && character.stats.health > 0) {
        dispatch({ type: 'COMBAT_TICK', deltaTime });
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [combat?.isPaused, dispatch]);

  // Auto-attack when player action bar fills
  useEffect(() => {
    if (!combat || combat.isPaused) return;
    
    if (combat.playerActionBar >= 100) {
      triggerSkillEffect('physical', 'enemy');
      dispatch({ type: 'PLAYER_AUTO_ATTACK' });
    }
  }, [combat?.playerActionBar, combat?.isPaused, dispatch]);

  // Enemy attacks when their action bar fills
  useEffect(() => {
    if (!combat || combat.isPaused) return;
    
    if (combat.enemyActionBar >= 100) {
      dispatch({ type: 'ENEMY_AUTO_ATTACK' });
    }
  }, [combat?.enemyActionBar, combat?.isPaused, dispatch]);

  // Parse combat log for damage numbers
  useEffect(() => {
    if (!combat) return;
    
    const currentLog = combat.combatLog;
    const prevLog = prevCombatLogRef.current;
    
    // Check for new log entries
    if (currentLog.length > prevLog.length) {
      const newEntries = currentLog.slice(prevLog.length);
      
      newEntries.forEach((entry) => {
        // Match damage entries
        const damageMatch = entry.match(/deals? (\d+) damage/i);
        if (damageMatch) {
          const amount = parseInt(damageMatch[1]);
          const isPlayer = entry.toLowerCase().includes('you deal') || 
                          entry.includes('CRITICAL HIT') ||
                          entry.includes('Fireball') ||
                          entry.includes('Smite');
          const isCritical = entry.includes('CRITICAL') || amount >= 20;
          addDamage(
            amount, 
            isCritical, 
            false, 
            45 + Math.random() * 10, 
            isPlayer ? 25 + Math.random() * 10 : 70 + Math.random() * 10
          );
        }
        
        // Match healing
        const healMatch = entry.match(/Healed? for (\d+) HP/i);
        if (healMatch) {
          const amount = parseInt(healMatch[1]);
          addDamage(amount, false, true, 45 + Math.random() * 10, 65 + Math.random() * 5);
        }
        
        // Match bleed damage
        const bleedMatch = entry.match(/takes (\d+) bleed damage/i);
        if (bleedMatch) {
          const amount = parseInt(bleedMatch[1]);
          addDamage(amount, false, false, 45 + Math.random() * 10, 25 + Math.random() * 10);
        }
        
        // Match mana restoration
        const manaMatch = entry.match(/Restored (\d+) MP/i);
        if (manaMatch) {
          const amount = parseInt(manaMatch[1]);
          addDamage(amount, false, false, 55 + Math.random() * 10, 65 + Math.random() * 5, true);
        }
      });
    }
    
    prevCombatLogRef.current = currentLog;
  }, [combat?.combatLog]);

  const addDamage = (amount: number, isCritical: boolean, isHeal: boolean, x: number, y: number, isMana?: boolean) => {
    const id = damageIdRef.current++;
    setDamages(prev => [...prev, { id, amount, isCritical, isHeal, x, y, isMana }]);
  };

  const removeDamage = useCallback((id: number) => {
    setDamages(prev => prev.filter(d => d.id !== id));
  }, []);

  const triggerSkillEffect = (effectType: SkillEffectType, target: 'player' | 'enemy' = 'enemy') => {
    setActiveSkillEffect({ type: effectType, target });
  };

  if (!combat || !character) return null;

  const { enemy, combatLog, activeBuffs, enemyDebuffs, shieldAmount, playerActionBar, enemyActionBar, isPaused } = combat;
  const enemyHealthPercent = (enemy.health / enemy.maxHealth) * 100;
  const hasPotion = character.inventory.some(i => i.slot === 'consumable' && i.mods.some(m => m.type === 'health'));
  const hasManaPotion = character.inventory.some(i => i.slot === 'consumable' && i.mods.some(m => m.type === 'mana'));
  const healthPotionCount = character.inventory.filter(i => i.slot === 'consumable' && i.mods.some(m => m.type === 'health')).length;
  const manaPotionCount = character.inventory.filter(i => i.slot === 'consumable' && i.mods.some(m => m.type === 'mana')).length;

  // Get learned active skills
  const classSkills = getClassSkills(character.class);
  const learnedActiveSkills = character.skills
    .map(ls => {
      const skill = classSkills.find(s => s.id === ls.skillId);
      return skill?.type === 'active' ? { skill, learned: ls } : null;
    })
    .filter((s): s is { skill: Skill; learned: typeof character.skills[0] } => s !== null);

  const handleUsePotion = (type: 'health' | 'mana') => {
    if (type === 'health') {
      triggerSkillEffect('heal', 'player');
      dispatch({ type: 'COMBAT_ACTION', action: 'potion' });
    } else {
      triggerSkillEffect('nature', 'player');
      dispatch({ type: 'COMBAT_ACTION', action: 'mana_potion' });
    }
  };

  const handleDefend = () => {
    dispatch({ type: 'COMBAT_ACTION', action: 'defend' });
  };

  const handleFlee = () => {
    dispatch({ type: 'COMBAT_ACTION', action: 'flee' });
  };

  const handleUseSkill = (skillId: string) => {
    const skill = classSkills.find(s => s.id === skillId);
    if (skill) {
      const visualType = skill.visualEffect || 
        (skill.effects.length > 0 ? getSkillVisualType(skill.effects[0].type) : 'physical');
      const target = skill.targetType === 'self' ? 'player' : 'enemy';
      triggerSkillEffect(visualType, target);
    }
    dispatch({ type: 'USE_SKILL', skillId });
  };

  const canUseSkill = (skill: Skill, learned: typeof character.skills[0]) => {
    if (learned.currentCooldown > 0) return false;
    if (character.stats.mana < skill.manaCost) return false;
    return true;
  };

  const togglePause = () => {
    dispatch({ type: 'TOGGLE_COMBAT_PAUSE' });
  };

  // Get player debuffs and enemy buffs
  const playerDebuffs = combat?.playerDebuffs || [];
  const enemyBuffs = combat?.enemyBuffs || [];
  const isStunned = combat?.isStunned || false;

  // Get buff/debuff display info
  const getBuffIcon = (effectType: string) => {
    switch (effectType) {
      case 'buff_attack': return <Flame className="h-4 w-4 text-orange-400" />;
      case 'buff_defense': return <Shield className="h-4 w-4 text-blue-400" />;
      case 'buff_crit': return <Sparkles className="h-4 w-4 text-yellow-400" />;
      case 'bleed': return <Droplet className="h-4 w-4 text-red-400" />;
      case 'debuff_defense': return <Shield className="h-4 w-4 text-red-400" />;
      case 'poison': return <Droplets className="h-4 w-4 text-green-500" />;
      case 'debuff_attack': return <Sword className="h-4 w-4 text-purple-400" />;
      case 'enrage': return <Flame className="h-4 w-4 text-red-500" />;
      default: return <Sparkles className="h-4 w-4 text-green-400" />;
    }
  };

  const getBuffLabel = (effectType: string, value: number) => {
    switch (effectType) {
      case 'buff_attack': return `+${value}% ATK`;
      case 'buff_defense': return `+${value}% DEF`;
      case 'buff_crit': return `+${value}% CRIT`;
      case 'bleed': return `${value}/s Bleed`;
      case 'debuff_defense': return `-${value} DEF`;
      case 'poison': return `${value}/s Poison`;
      case 'debuff_attack': return `-${value}% ATK`;
      case 'enrage': return `+${value}% ATK`;
      default: return `${effectType}: ${value}`;
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Skill Visual Effects */}
      {activeSkillEffect && (
        <SkillEffect
          type={activeSkillEffect.type}
          isActive={true}
          targetPosition={activeSkillEffect.target}
          onComplete={() => setActiveSkillEffect(null)}
        />
      )}
      
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${dungeonBg})` }}
      />
      <div className="absolute inset-0 bg-background/80" />
      
      {/* Floating Damage Numbers */}
      <FloatingDamage damages={damages} onComplete={removeDamage} />
      
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pt-24 pb-8">
        {/* Pause Button */}
        <button
          onClick={togglePause}
          className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-lg bg-card/90 border border-primary/30 hover:bg-card transition-colors"
        >
          {isPaused ? (
            <>
              <Play className="h-5 w-5 text-green-400" />
              <span className="text-green-400 font-semibold">Resume</span>
            </>
          ) : (
            <>
              <Pause className="h-5 w-5 text-yellow-400" />
              <span className="text-yellow-400 font-semibold">Pause</span>
            </>
          )}
        </button>

        {/* Active Buffs Display */}
        {(activeBuffs.length > 0 || shieldAmount > 0) && (
          <div className="absolute top-20 right-4 flex flex-col gap-2">
            {shieldAmount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 animate-pulse">
                <Snowflake className="h-4 w-4 text-cyan-400" />
                <span className="text-sm text-cyan-400 font-semibold">{shieldAmount} Shield</span>
              </div>
            )}
            {activeBuffs.map((buff, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/40">
                {getBuffIcon(buff.effectType)}
                <span className="text-sm text-green-400 font-semibold">
                  {getBuffLabel(buff.effectType, buff.value)}
                </span>
                <span className="text-xs text-green-400/70">({buff.remainingTurns.toFixed(1)}s)</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Player Debuffs Display (poison, weaken, stun) */}
        {(playerDebuffs.length > 0 || isStunned) && (
          <div className="absolute top-36 right-4 flex flex-col gap-2">
            {isStunned && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/20 border border-yellow-500/40 animate-pulse">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span className="text-sm text-yellow-400 font-semibold">STUNNED</span>
              </div>
            )}
            {playerDebuffs.map((debuff, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/40">
                {getBuffIcon(debuff.effectType)}
                <span className="text-sm text-purple-400 font-semibold">
                  {getBuffLabel(debuff.effectType, debuff.value)}
                </span>
                <span className="text-xs text-purple-400/70">({debuff.remainingTurns.toFixed(1)}s)</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Enemy Debuffs Display (from player skills) */}
        {enemyDebuffs.length > 0 && (
          <div className="absolute top-20 left-4 flex flex-col gap-2">
            <span className="text-xs text-muted-foreground mb-1">Enemy Debuffs</span>
            {enemyDebuffs.map((debuff, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/40">
                {getBuffIcon(debuff.effectType)}
                <span className="text-sm text-red-400 font-semibold">
                  {getBuffLabel(debuff.effectType, debuff.value)}
                </span>
                <span className="text-xs text-red-400/70">({debuff.remainingTurns.toFixed(1)}s)</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Enemy Buffs Display (enrage, etc.) */}
        {enemyBuffs.length > 0 && (
          <div className="absolute top-36 left-4 flex flex-col gap-2">
            <span className="text-xs text-muted-foreground mb-1">Enemy Buffs</span>
            {enemyBuffs.map((buff, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/20 border border-orange-500/40 animate-pulse">
                {getBuffIcon(buff.effectType)}
                <span className="text-sm text-orange-400 font-semibold">
                  {getBuffLabel(buff.effectType, buff.value)}
                </span>
                <span className="text-xs text-orange-400/70">({buff.remainingTurns.toFixed(1)}s)</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Enemy Display */}
        <div className="relative mb-4 w-full max-w-md text-center">
          <div className="mb-4 inline-block rounded-full bg-accent/20 p-6">
            <div className="text-6xl">👹</div>
          </div>
          <h2 className="game-title mb-2 text-3xl font-bold text-accent">
            {enemy.name}
          </h2>
          <p className="mb-2 text-sm italic text-muted-foreground">
            {enemy.description}
          </p>
          
          {/* Enemy Abilities */}
          {enemy.abilities && enemy.abilities.length > 0 && (
            <div className="mb-4 flex flex-wrap justify-center gap-2">
              {enemy.abilities.map((ability, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent-foreground border border-accent/30"
                  title={`${ability.chance}% chance`}
                >
                  {ability.description}
                </span>
              ))}
            </div>
          )}
          
          {/* Enemy Health */}
          <div className="mx-auto max-w-xs mb-2">
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-muted-foreground">HP</span>
              <span className="text-health">{Math.max(0, enemy.health)}/{enemy.maxHealth}</span>
            </div>
            <Progress 
              value={Math.max(0, enemyHealthPercent)} 
              className="h-3 bg-muted"
            />
          </div>

          {/* Enemy Action Bar */}
          <div className="mx-auto max-w-xs">
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Sword className="h-3 w-3" /> Action
              </span>
              <span className="text-red-400">{Math.floor(enemyActionBar)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-100"
                style={{ width: `${enemyActionBar}%` }}
              />
            </div>
          </div>
        </div>

        {/* Player Action Bar */}
        <div className="w-full max-w-md mb-6">
          <div className="p-4 rounded-xl border border-primary/30 bg-card/90 backdrop-blur-sm">
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Sword className="h-4 w-4 text-primary" /> Your Attack
              </span>
              <span className="text-primary font-semibold">{Math.floor(playerActionBar)}%</span>
            </div>
            <div className="h-4 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-100",
                  playerActionBar >= 100 
                    ? "bg-gradient-to-r from-yellow-500 to-yellow-300 animate-pulse" 
                    : "bg-gradient-to-r from-primary to-primary/70"
                )}
                style={{ width: `${Math.min(100, playerActionBar)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-center">
              DEX: {character.attributes.dexterity} • Speed: {(20 + character.attributes.dexterity * 0.5).toFixed(1)}/s
            </p>
          </div>
        </div>

        {/* Skills Bar - Always visible */}
        <div className="w-full max-w-xl mb-4">
          <div className="p-4 rounded-xl border border-primary/30 bg-card/90 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-cinzel text-lg font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Skills
              </h3>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-blue-400">
                  MP: {character.stats.mana}/{character.stats.maxMana}
                </span>
              </div>
            </div>
            
            {learnedActiveSkills.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {learnedActiveSkills.map(({ skill, learned }) => {
                  const canUse = canUseSkill(skill, learned);
                  const onCooldown = learned.currentCooldown > 0;
                  const notEnoughMana = character.stats.mana < skill.manaCost;
                  const IconComponent = ICON_MAP[skill.icon] || Sparkles;
                  
                  return (
                    <div key={skill.id} className="relative">
                      <button
                        onClick={() => canUse && handleUseSkill(skill.id)}
                        onMouseEnter={() => setHoveredSkill(skill.id)}
                        onMouseLeave={() => setHoveredSkill(null)}
                        disabled={!canUse || isPaused}
                        className={cn(
                          'relative w-full p-3 rounded-lg border-2 transition-all text-left',
                          canUse && !isPaused
                            ? 'border-primary/50 bg-primary/10 hover:bg-primary/20 hover:border-primary cursor-pointer'
                            : 'border-muted/30 bg-muted/10 opacity-50 cursor-not-allowed'
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <IconComponent className={cn('h-4 w-4', canUse ? 'text-primary' : 'text-muted-foreground')} />
                          <span className={cn('font-cinzel text-xs font-semibold truncate', canUse ? 'text-foreground' : 'text-muted-foreground')}>
                            {skill.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className={cn(notEnoughMana && !onCooldown ? 'text-red-400' : 'text-blue-400')}>
                            {skill.manaCost} MP
                          </span>
                          <span className="text-muted-foreground">R{learned.rank}</span>
                        </div>
                        
                        {/* Cooldown overlay */}
                        {onCooldown && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
                            <div className="flex items-center gap-1 text-yellow-400">
                              <Clock className="h-4 w-4" />
                              <span className="font-bold">{learned.currentCooldown.toFixed(1)}s</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Not enough mana indicator */}
                        {notEnoughMana && !onCooldown && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
                            <span className="text-xs text-red-400">Low MP</span>
                          </div>
                        )}
                      </button>
                      
                      {/* Tooltip */}
                      {hoveredSkill === skill.id && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
                          <SkillTooltip
                            skill={skill}
                            learned={learned}
                            stats={{
                              attack: character.stats.attack,
                              magicAttack: character.stats.magicAttack,
                              maxHealth: character.stats.maxHealth,
                              maxMana: character.stats.maxMana,
                              mana: character.stats.mana,
                              intelligence: character.attributes.intelligence,
                              strength: character.attributes.strength,
                              dexterity: character.attributes.dexterity,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">
                No active skills learned yet. Open the character tab to learn skills!
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-xl">
          <div className="grid grid-cols-4 gap-3">
            <button
              onClick={handleDefend}
              disabled={isPaused}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg border-2 py-4 font-cinzel transition-all",
                combat.isDefending 
                  ? "border-blue-400 bg-blue-500/30 text-blue-200" 
                  : "border-secondary bg-secondary/20 text-secondary-foreground hover:bg-secondary/40",
                isPaused && "opacity-50 cursor-not-allowed"
              )}
            >
              <Shield className="h-5 w-5" />
              {combat.isDefending ? 'Defending' : 'Defend'}
            </button>
            
            <button
              onClick={() => handleUsePotion('health')}
              disabled={!hasPotion || isPaused}
              className="relative flex items-center justify-center gap-2 rounded-lg border-2 border-health bg-health/20 py-4 font-cinzel text-foreground transition-all hover:bg-health/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FlaskConical className="h-5 w-5" />
              HP
              {hasPotion && (
                <span className="absolute top-1 right-2 text-xs text-health">{healthPotionCount}</span>
              )}
            </button>
            
            <button
              onClick={() => handleUsePotion('mana')}
              disabled={!hasManaPotion || isPaused}
              className="relative flex items-center justify-center gap-2 rounded-lg border-2 border-blue-500 bg-blue-500/20 py-4 font-cinzel text-foreground transition-all hover:bg-blue-500/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Droplets className="h-5 w-5 text-blue-400" />
              MP
              {hasManaPotion && (
                <span className="absolute top-1 right-2 text-xs text-blue-400">{manaPotionCount}</span>
              )}
            </button>
            
            <button
              onClick={handleFlee}
              disabled={isPaused}
              className="flex items-center justify-center gap-2 rounded-lg border-2 border-muted bg-muted/20 py-4 font-cinzel text-muted-foreground transition-all hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <DoorOpen className="h-5 w-5" />
              Flee
            </button>
          </div>
        </div>

        {/* Combat Log - Fixed bottom left */}
        <div className="fixed bottom-4 left-4 z-20 w-80 rounded-lg border border-border bg-card/95 p-4 backdrop-blur-sm">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Combat Log</p>
          <div className="max-h-32 space-y-1 overflow-y-auto">
            {combatLog.slice(-5).map((log, i) => (
              <p 
                key={i}
                className={`text-sm ${i === combatLog.slice(-5).length - 1 ? 'text-foreground' : 'text-muted-foreground'}`}
              >
                {log}
              </p>
            ))}
          </div>
        </div>

        {/* Enemy Stats */}
        <div className="mt-6 flex gap-6 text-sm text-muted-foreground">
          <span>ATK: {enemy.attack}</span>
          <span>DEF: {enemy.defense}</span>
        </div>
      </div>
    </div>
  );
}
