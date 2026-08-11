import { LootItem, RARITY_COLORS, RARITY_BORDER_COLORS, ModType, calculateCombatPower, ARMOR_WEIGHT_BONUSES } from '@/types/items';
import { cn } from '@/lib/utils';
import { ItemIcon } from './ItemIcon';
import { ArrowUp, ArrowDown, Zap } from 'lucide-react';

interface ItemTooltipProps {
  item: LootItem;
  compareItem?: LootItem | null;
  playerLevel?: number;
  playerClass?: string;
  className?: string;
  style?: React.CSSProperties;
}

// Helper to aggregate mod values by type
function getModTotals(item: LootItem): Record<ModType, number> {
  const totals: Partial<Record<ModType, number>> = {};
  item.mods.forEach((mod) => {
    totals[mod.type] = (totals[mod.type] || 0) + mod.value;
  });
  return totals as Record<ModType, number>;
}

// Helper to get all unique mod types between two items
function getAllModTypes(item1: LootItem, item2?: LootItem | null): ModType[] {
  const types = new Set<ModType>();
  item1.mods.forEach((mod) => types.add(mod.type));
  if (item2) {
    item2.mods.forEach((mod) => types.add(mod.type));
  }
  return Array.from(types);
}

export function ItemTooltip({ item, compareItem, playerLevel, playerClass, className, style }: ItemTooltipProps) {
  const rarityLabel = item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1);
  const showComparison = compareItem && compareItem.id !== item.id;
  
  const itemMods = getModTotals(item);
  const compareMods = compareItem ? getModTotals(compareItem) : {};
  const allModTypes = showComparison ? getAllModTypes(item, compareItem) : [];
  
  const canEquip = !item.requiredLevel || !playerLevel || playerLevel >= item.requiredLevel;
  const canEquipClass = !item.classRestriction || !playerClass || item.classRestriction.includes(playerClass.toLowerCase());
  const isEquipment = item.slot !== 'consumable';
  
  // Calculate Combat Power
  const itemPower = calculateCombatPower(item);
  const comparePower = compareItem ? calculateCombatPower(compareItem) : 0;
  const powerDiff = showComparison ? itemPower - comparePower : 0;
  
  return (
    <div
      className={cn(
        'w-72 p-4 rounded-xl border-2 bg-card/95 backdrop-blur-sm shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)] pointer-events-none',
        'fixed z-[9999]',
        RARITY_BORDER_COLORS[item.rarity],
        className
      )}
      style={{ isolation: 'isolate', ...style }}
    >
      {/* Item Name */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center border border-border/50">
          <ItemIcon icon={item.icon} className="text-2xl" />
        </div>
        <div>
          <h3 className={cn('font-cinzel font-semibold text-sm', RARITY_COLORS[item.rarity])}>
            {item.name}
          </h3>
          <div className="flex items-center gap-2 text-xs">
            <span className={RARITY_COLORS[item.rarity]}>{rarityLabel}</span>
            <span className="text-muted-foreground">• iLvl {item.level}</span>
          </div>
        </div>
      </div>
      
      {/* Combat Power */}
      {isEquipment && (
        <div className="flex items-center justify-between mb-2 p-2 bg-muted/40 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-semibold text-foreground">Combat Power</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-yellow-400">{itemPower}</span>
            {showComparison && powerDiff !== 0 && (
              <span className={cn(
                'flex items-center gap-0.5 text-sm font-semibold',
                powerDiff > 0 ? 'text-green-400' : 'text-red-400'
              )}>
                {powerDiff > 0 ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <ArrowDown className="h-3 w-3" />
                )}
                {powerDiff > 0 ? '+' : ''}{powerDiff}
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Armor Weight Category */}
      {item.weight && (
        <div className="flex items-center gap-2 mb-2">
          <span className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded",
            item.weight === 'light' && "bg-green-500/20 text-green-400 border border-green-500/30",
            item.weight === 'medium' && "bg-blue-500/20 text-blue-400 border border-blue-500/30",
            item.weight === 'heavy' && "bg-orange-500/20 text-orange-400 border border-orange-500/30"
          )}>
            {item.weight.charAt(0).toUpperCase() + item.weight.slice(1)} Armor
          </span>
          <span className="text-xs text-muted-foreground italic">
            {ARMOR_WEIGHT_BONUSES[item.weight].description}
          </span>
        </div>
      )}
      
      {/* Required Level */}
      {isEquipment && item.requiredLevel > 0 && (
        <div className={cn(
          "text-xs font-semibold mb-2",
          canEquip ? "text-green-400" : "text-red-400"
        )}>
          Requires Level {item.requiredLevel}
          {!canEquip && <span className="ml-1">(Too Low!)</span>}
        </div>
      )}
      
      {/* Class Restriction */}
      {isEquipment && item.classRestriction && item.classRestriction.length > 0 && (
        <div className={cn(
          "text-xs font-semibold mb-2",
          canEquipClass ? "text-green-400" : "text-red-400"
        )}>
          Classes: {item.classRestriction.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ')}
          {!canEquipClass && <span className="ml-1">(Wrong Class!)</span>}
        </div>
      )}
      
      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent my-3" />
      
      {/* Mods */}
      <div className="space-y-1.5">
        {item.mods.map((mod, index) => (
          <p key={index} className="text-sm text-blue-300">
            {mod.description}
          </p>
        ))}
      </div>
      
      {/* Comparison Section */}
      {showComparison && (
        <>
          <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent my-3" />
          
          <div className="mb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">
              Compared to Equipped
            </p>
            <div className="space-y-1.5">
              {allModTypes.map((modType) => {
                const newValue = itemMods[modType] || 0;
                const oldValue = compareMods[modType] || 0;
                const diff = newValue - oldValue;
                
                if (diff === 0) return null;
                
                const isPositive = diff > 0;
                const modLabel = modType.charAt(0).toUpperCase() + modType.slice(1).replace(/([A-Z])/g, ' $1');
                
                return (
                  <div key={modType} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{modLabel}</span>
                    <span className={cn(
                      'flex items-center gap-1 font-semibold',
                      isPositive ? 'text-green-400' : 'text-red-400'
                    )}>
                      {isPositive ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )}
                      {isPositive ? '+' : ''}{diff}
                      {modType.includes('Chance') || modType.includes('Damage') || modType === 'dodge' || modType === 'lifeSteal' || modType === 'goldFind' || modType === 'expBonus' ? '%' : ''}
                    </span>
                  </div>
                );
              })}
              
              {/* Level comparison */}
              {compareItem && item.level !== compareItem.level && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Item Level</span>
                  <span className={cn(
                    'flex items-center gap-1 font-semibold',
                    item.level > compareItem.level ? 'text-green-400' : 'text-red-400'
                  )}>
                    {item.level > compareItem.level ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )}
                    {item.level > compareItem.level ? '+' : ''}{item.level - compareItem.level}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Currently equipped item name */}
          <div className="mt-2 pt-2 border-t border-border/30">
            <p className="text-xs text-muted-foreground">
              Currently equipped: <span className={RARITY_COLORS[compareItem!.rarity]}>{compareItem!.name}</span>
            </p>
          </div>
        </>
      )}
      
      {/* Slot & Value */}
      <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between">
        <p className="text-xs text-muted-foreground capitalize">
          {item.slot === 'ring1' || item.slot === 'ring2' ? 'Ring' : item.slot}
        </p>
        <p className="text-xs text-gold font-semibold">
          {item.value} gold
        </p>
      </div>
    </div>
  );
}
