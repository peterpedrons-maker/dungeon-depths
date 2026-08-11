import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Heart, Coins, Star, Shield, Sword, Backpack, Droplet, MapPin, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { CharacterTab } from './CharacterTab';
import { SkillTree } from './SkillTree';
import warriorIcon from '@/assets/warrior-icon.jpg';
import rogueIcon from '@/assets/rogue-icon.jpg';
import mageIcon from '@/assets/mage-icon.jpg';
import clericIcon from '@/assets/cleric-icon.jpg';
import barbarianIcon from '@/assets/barbarian-icon.jpg';
import archerIcon from '@/assets/archer-icon.jpg';
import { CharacterClass, MAX_LEVEL } from '@/types/game';
import { cn } from '@/lib/utils';

const CLASS_ICON_IMAGES: Record<CharacterClass, string> = {
  warrior: warriorIcon,
  rogue: rogueIcon,
  mage: mageIcon,
  cleric: clericIcon,
  barbarian: barbarianIcon,
  archer: archerIcon,
};

export function GameHUD() {
  const { state } = useGame();
  const { character, dungeonFloor, roomsCleared } = state;
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isSkillsOpen, setIsSkillsOpen] = useState(false);

  if (!character) return null;

  const { stats, equippedWeapon, equippedArmor, equippedItems } = character;
  const healthPercent = (stats.health / stats.maxHealth) * 100;
  const manaPercent = (stats.mana / stats.maxMana) * 100;
  const isMaxLevel = stats.level >= MAX_LEVEL;
  const expNeeded = stats.level * 100;
  const expPercent = isMaxLevel ? 100 : (stats.experience / expNeeded) * 100;

  // Calculate total attack/defense from equipped items
  let totalAttack = stats.attack;
  let totalDefense = stats.defense;
  
  if (equippedWeapon) totalAttack += equippedWeapon.effect;
  if (equippedArmor) totalDefense += equippedArmor.effect;

  return (
    <>
      <div className="pointer-events-none fixed left-0 right-0 top-0 z-50 p-3 md:p-6">
        <div className="pointer-events-auto mx-auto flex max-w-7xl flex-col gap-2 md:flex-row md:items-stretch md:gap-3">
          
          {/* Top Row - Mobile: Character + Location + Inventory */}
          <div className="flex items-center gap-2 md:contents">
            {/* Character Card */}
            <div className="path-card rounded-lg md:rounded-xl p-2 md:p-4 flex items-center gap-2 md:gap-4 border-primary/30 shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)] flex-1 md:flex-none">
              <img 
                src={CLASS_ICON_IMAGES[character.class]} 
                alt={character.class} 
                className="h-10 w-10 md:h-14 md:w-14 rounded-lg object-cover border-2 border-primary/40" 
              />
              <div className="flex flex-col min-w-0">
                <p className="font-cinzel text-sm md:text-lg font-bold text-foreground truncate">
                  {character.name}
                </p>
                <p className="text-xs md:text-sm capitalize text-primary font-semibold">
                  Lv.{stats.level} {character.class}
                </p>
              </div>
            </div>

            {/* Location Card */}
            <div className="path-card rounded-lg md:rounded-xl p-2 md:p-4 flex items-center justify-center gap-2 md:gap-3 border-primary/30 shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)] md:order-4 md:w-[180px] md:ml-auto">
              <MapPin className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              <div className="flex flex-col items-center">
                <p className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wide">F{dungeonFloor}</p>
                <p className="text-sm md:text-lg font-bold text-foreground">R{roomsCleared + 1}</p>
              </div>
            </div>

            {/* Gold - Mobile only in top row */}
            <div className="flex md:hidden items-center gap-1.5 path-card rounded-lg p-2 border-primary/30">
              <Coins className="h-4 w-4 text-gold" />
              <span className="text-sm font-bold text-gold">{stats.gold}</span>
            </div>

            {/* Skills Button - Mobile */}
            <button
              onClick={() => setIsSkillsOpen(true)}
              className={cn(
                "md:hidden flex items-center gap-1 rounded-lg bg-primary/20 p-2 transition-all duration-300 hover:bg-primary/40 border border-primary/50",
                character.skillPoints > 0 && "animate-pulse"
              )}
            >
              <Sparkles className="h-4 w-4 text-primary" />
              {character.skillPoints > 0 && (
                <span className="text-xs font-bold text-primary">{character.skillPoints}</span>
              )}
            </button>

            {/* Inventory Button - Mobile */}
            <button
              onClick={() => setIsInventoryOpen(true)}
              className="md:hidden flex items-center gap-1 rounded-lg bg-primary/20 p-2 transition-all duration-300 hover:bg-primary/40 border border-primary/50"
            >
              <Backpack className="h-4 w-4 text-primary" />
            </button>
          </div>

          {/* Stats Card - Desktop layout, Bottom row on mobile */}
          <div className="path-card rounded-lg md:rounded-xl p-2 md:p-4 flex-1 flex items-center gap-2 md:gap-6 border-primary/30 shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)] md:order-2">
            {/* Health Bar */}
            <div className="flex-1 min-w-0 md:min-w-[140px] md:max-w-[180px]">
              <div className="mb-1 md:mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Heart className="h-3 w-3 md:h-4 md:w-4 text-health" />
                  <span className="text-[10px] md:text-xs font-semibold text-muted-foreground hidden sm:inline">HP</span>
                </div>
                <span className="text-xs md:text-sm font-bold text-health">
                  {stats.health}/{stats.maxHealth}
                </span>
              </div>
              <Progress 
                value={healthPercent} 
                className="h-2 md:h-2.5 bg-muted/60 rounded-full"
              />
            </div>

            {/* Mana Bar */}
            <div className="flex-1 min-w-0 md:min-w-[120px] md:max-w-[160px]">
              <div className="mb-1 md:mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Droplet className="h-3 w-3 md:h-4 md:w-4 text-blue-400" />
                  <span className="text-[10px] md:text-xs font-semibold text-muted-foreground hidden sm:inline">MP</span>
                </div>
                <span className="text-xs md:text-sm font-bold text-blue-400">
                  {stats.mana}/{stats.maxMana}
                </span>
              </div>
              <Progress 
                value={manaPercent} 
                className="h-2 md:h-2.5 bg-muted/60 rounded-full [&>div]:bg-blue-500"
              />
            </div>

            {/* Experience Bar */}
            <div className="flex-1 min-w-0 md:min-w-[100px] md:max-w-[140px]">
              <div className="mb-1 md:mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 md:h-4 md:w-4 text-exp" />
                  <span className="text-[10px] md:text-xs font-semibold text-muted-foreground hidden sm:inline">EXP</span>
                </div>
                <span className="text-xs md:text-sm font-bold text-exp">
                  {isMaxLevel ? 'MAX' : `${stats.experience}/${expNeeded}`}
                </span>
              </div>
              <Progress 
                value={expPercent} 
                className="h-2 md:h-2.5 bg-muted/60 rounded-full"
              />
            </div>

            {/* Divider - Desktop only */}
            <div className="hidden md:block h-10 w-px bg-border/50" />

            {/* Gold - Desktop only */}
            <div className="hidden md:flex items-center gap-2">
              <Coins className="h-5 w-5 text-gold" />
              <span className="text-lg font-bold text-gold">{stats.gold}</span>
            </div>
          </div>

          {/* Equipment & Inventory Card - Desktop only */}
          <div className="hidden md:flex path-card rounded-xl p-4 items-center justify-center gap-3 border-primary/30 shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)] order-5 w-[340px]">
            {equippedItems.weapon && (
              <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-2 border border-border/50">
                <Sword className="h-4 w-4 text-primary" />
                <span className="text-base font-semibold">{equippedItems.weapon.icon}</span>
              </div>
            )}
            {equippedItems.chest && (
              <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-2 border border-border/50">
                <Shield className="h-4 w-4 text-secondary" />
                <span className="text-base font-semibold">{equippedItems.chest.icon}</span>
              </div>
            )}
            
            {/* Skills Button */}
            <button
              onClick={() => setIsSkillsOpen(true)}
              className={cn(
                "flex items-center gap-2 rounded-lg bg-primary/20 px-4 py-2 transition-all duration-300 hover:bg-primary/40 hover:shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] border border-primary/50",
                character.skillPoints > 0 && "animate-pulse"
              )}
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Skills</span>
              {character.skillPoints > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-primary rounded-full text-primary-foreground">
                  {character.skillPoints}
                </span>
              )}
            </button>
            
            {/* Inventory Button */}
            <button
              onClick={() => setIsInventoryOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-primary/20 px-4 py-2 transition-all duration-300 hover:bg-primary/40 hover:shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] border border-primary/50"
            >
              <Backpack className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Inventory</span>
            </button>
          </div>
        </div>
      </div>

      {/* Character Tab Modal */}
      <CharacterTab isOpen={isInventoryOpen} onClose={() => setIsInventoryOpen(false)} />
      
      {/* Skill Tree Modal */}
      {isSkillsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="w-[90vw] max-w-[800px] max-h-[90vh] overflow-auto">
            <SkillTree onClose={() => setIsSkillsOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}