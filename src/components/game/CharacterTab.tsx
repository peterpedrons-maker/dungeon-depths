import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Trash2, Sword, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGame } from '@/contexts/GameContext';
import { LootItem, EquipmentSlot, RARITY_COLORS, RARITY_BORDER_COLORS, RARITY_GLOW, calculateCombatPower } from '@/types/items';
import { ItemTooltip } from './ItemTooltip';
import { ItemIcon } from './ItemIcon';
import { CharacterClass } from '@/types/game';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import warriorIcon from '@/assets/warrior-icon.jpg';
import rogueIcon from '@/assets/rogue-icon.jpg';
import mageIcon from '@/assets/mage-icon.jpg';
import clericIcon from '@/assets/cleric-icon.jpg';
import barbarianIcon from '@/assets/barbarian-icon.jpg';
import archerIcon from '@/assets/archer-icon.jpg';
interface CharacterTabProps {
  isOpen: boolean;
  onClose: () => void;
}
const CLASS_ICON_IMAGES: Record<CharacterClass, string> = {
  warrior: warriorIcon,
  rogue: rogueIcon,
  mage: mageIcon,
  cleric: clericIcon,
  barbarian: barbarianIcon,
  archer: archerIcon
};
const SLOT_ICONS: Record<EquipmentSlot, string> = {
  helm: '👤',
  amulet: '◯',
  chest: '🎽',
  gloves: '🧤',
  belt: '〰️',
  boots: '👢',
  weapon: '⚔️',
  offhand: '🛡️',
  ring1: '💍',
  ring2: '💍'
};
export function CharacterTab({
  isOpen,
  onClose
}: CharacterTabProps) {
  const {
    state,
    dispatch
  } = useGame();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<LootItem | null>(null);
  const [hoveredItem, setHoveredItem] = useState<LootItem | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({
    x: 0,
    y: 0
  });
  const [targetRingSlot, setTargetRingSlot] = useState<'ring1' | 'ring2' | null>(null);
  const handleItemHover = (item: LootItem | null, event?: React.MouseEvent) => {
    setHoveredItem(item);
    if (item && event) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      setTooltipPosition({
        x: rect.right + 8,
        y: Math.min(rect.top, window.innerHeight - 300)
      });
    }
  };
  if (!isOpen || !state.character) return null;
  const {
    equippedItems,
    inventory
  } = state.character;

  // Calculate total Combat Power from all equipped items
  const totalCombatPower = Object.values(equippedItems).filter((item): item is LootItem => item !== null).reduce((total, item) => total + calculateCombatPower(item), 0);
  const filteredInventory = inventory.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const handleEquip = (item: LootItem) => {
    // Check level requirement
    if (item.requiredLevel && state.character && item.requiredLevel > state.character.stats.level) {
      toast({
        title: "Cannot Equip",
        description: `${item.name} requires level ${item.requiredLevel}`,
        variant: "destructive"
      });
      return;
    }

    // Check class restriction
    if (item.classRestriction && item.classRestriction.length > 0 && state.character) {
      const playerClass = state.character.class.toLowerCase();
      if (!item.classRestriction.includes(playerClass)) {
        const allowedClasses = item.classRestriction.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ');
        toast({
          title: "Class Restricted",
          description: `${item.name} can only be equipped by: ${allowedClasses}`,
          variant: "destructive"
        });
        return;
      }
    }

    // If a ring slot is selected and the item is a ring, use that slot
    if (targetRingSlot && (item.slot === 'ring1' || item.slot === 'ring2')) {
      dispatch({
        type: 'EQUIP_LOOT_ITEM',
        item,
        targetSlot: targetRingSlot
      });
      setTargetRingSlot(null);
    } else {
      dispatch({
        type: 'EQUIP_LOOT_ITEM',
        item
      });
    }
    setSelectedItem(null);
  };
  const handleUnequip = (slot: EquipmentSlot) => {
    dispatch({
      type: 'UNEQUIP_ITEM',
      slot
    });
  };
  const handleDrop = (item: LootItem) => {
    dispatch({
      type: 'DROP_ITEM',
      itemId: item.id
    });
    setSelectedItem(null);
  };
  const handleSlotClick = (slot: EquipmentSlot) => {
    const equipped = equippedItems[slot];

    // For ring slots: if we have a ring selected in inventory, equip it to this slot
    if ((slot === 'ring1' || slot === 'ring2') && selectedItem && (selectedItem.slot === 'ring1' || selectedItem.slot === 'ring2')) {
      dispatch({
        type: 'EQUIP_LOOT_ITEM',
        item: selectedItem,
        targetSlot: slot
      });
      setSelectedItem(null);
      setTargetRingSlot(null);
      return;
    }

    // For ring slots without selection: toggle target slot for next equip
    if ((slot === 'ring1' || slot === 'ring2') && !equipped) {
      setTargetRingSlot(targetRingSlot === slot ? null : slot);
      return;
    }

    // Otherwise, unequip if there's an item
    if (equipped) {
      handleUnequip(slot);
    }
  };
  const renderEquipmentSlot = (slot: EquipmentSlot, label: string) => {
    const equipped = equippedItems[slot];
    const isRingSlot = slot === 'ring1' || slot === 'ring2';
    const isTargeted = isRingSlot && targetRingSlot === slot;
    const canReceiveRing = isRingSlot && selectedItem && (selectedItem.slot === 'ring1' || selectedItem.slot === 'ring2');
    return <div key={slot} className="relative group" onMouseEnter={e => equipped && handleItemHover(equipped, e)} onMouseLeave={() => handleItemHover(null)} onClick={() => handleSlotClick(slot)}>
        <div className={cn('w-16 h-16 border-2 rounded-xl flex items-center justify-center cursor-pointer', 'transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]', equipped ? `${RARITY_BORDER_COLORS[equipped.rarity]} ${RARITY_GLOW[equipped.rarity]} bg-card/90` : 'border-primary/30 bg-card/60 hover:border-primary/50', isTargeted && 'ring-2 ring-yellow-400 animate-pulse border-yellow-400', canReceiveRing && !equipped && 'border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.4)]')}>
          {equipped ? <ItemIcon icon={equipped.icon} className="text-3xl drop-shadow-lg" /> : <span className="text-2xl opacity-30">{SLOT_ICONS[slot]}</span>}
        </div>
        <p className={cn("text-[10px] text-center mt-1 font-medium uppercase tracking-wide", isTargeted ? "text-yellow-400" : "text-muted-foreground")}>
          {isTargeted ? 'Target' : label}
        </p>
      </div>;
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="flex items-start gap-4">
        {/* Left Panel - Character Card & Attributes */}
        <div className="w-60 flex flex-col gap-4">
          {/* Character Card */}
          <div className="path-card rounded-xl p-5 border-primary/30 shadow-[0_0_25px_rgba(var(--primary-rgb),0.2)]">
            <div className="flex flex-col items-center gap-3 mb-4">
              <img src={CLASS_ICON_IMAGES[state.character.class]} alt={state.character.class} className="h-20 w-20 rounded-xl object-cover border-2 border-primary/40 shadow-lg" />
              <div className="text-center">
                <h2 className="font-cinzel text-xl font-bold text-foreground">
                  {state.character.name}
                </h2>
                <p className="text-sm capitalize text-primary font-semibold">
                  Level {state.character.stats.level} {state.character.class}
                </p>
                {/* Total Combat Power */}
                <div className="flex items-center justify-center gap-1.5 mt-2 px-3 py-1.5 bg-yellow-400/10 rounded-lg border border-yellow-400/30">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-bold text-yellow-400">{totalCombatPower}</span>
                  <span className="text-xs text-yellow-400/70">CP</span>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Attributes Card */}
          <div className="path-card rounded-xl p-4 border-primary/30 shadow-[0_0_25px_rgba(var(--primary-rgb),0.2)]">
            <h3 className="text-xs font-cinzel text-muted-foreground mb-3 text-center uppercase tracking-wide border-b border-border pb-2">
              Primary Attributes
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                <span className="text-red-400 font-medium flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 bg-red-900/40 rounded-lg flex items-center justify-center text-xs">💪</span>
                  STR
                </span>
                <span className="text-base font-bold text-foreground">{state.character.attributes.strength}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                <span className="text-green-400 font-medium flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 bg-green-900/40 rounded-lg flex items-center justify-center text-xs">🎯</span>
                  DEX
                </span>
                <span className="text-base font-bold text-foreground">{state.character.attributes.dexterity}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                <span className="text-orange-400 font-medium flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 bg-orange-900/40 rounded-lg flex items-center justify-center text-xs">❤️</span>
                  VIT
                </span>
                <span className="text-base font-bold text-foreground">{state.character.attributes.vitality}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                <span className="text-blue-400 font-medium flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 bg-blue-900/40 rounded-lg flex items-center justify-center text-xs">✨</span>
                  INT
                </span>
                <span className="text-base font-bold text-foreground">{state.character.attributes.intelligence}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                <span className="text-purple-400 font-medium flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 bg-purple-900/40 rounded-lg flex items-center justify-center text-xs">👑</span>
                  CHA
                </span>
                <span className="text-base font-bold text-foreground">{state.character.attributes.charisma}</span>
              </div>
            </div>
          </div>

          {/* Combat Stats Card */}
          <div className="path-card rounded-xl p-4 border-primary/30 shadow-[0_0_25px_rgba(var(--primary-rgb),0.2)] flex-1">
            <h3 className="text-xs font-cinzel text-muted-foreground mb-3 text-center uppercase tracking-wide border-b border-border pb-2">
              Combat Stats
            </h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Attack</span>
                <span className="text-red-400 font-bold">{state.character.stats.attack}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Magic ATK</span>
                <span className="text-purple-400 font-bold">{state.character.stats.magicAttack}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Defense</span>
                <span className="text-blue-400 font-bold">{state.character.stats.defense}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Magic DEF</span>
                <span className="text-cyan-400 font-bold">{state.character.stats.magicDefense}</span>
              </div>
              <div className="h-px bg-border/50 my-2" />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Crit %</span>
                <span className="text-yellow-400 font-bold">{state.character.stats.critChance}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Crit DMG</span>
                <span className="text-orange-400 font-bold">{state.character.stats.critDamage}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Dodge</span>
                <span className="text-green-400 font-bold">{state.character.stats.dodge}%</span>
              </div>
              <div className="h-px bg-border/50 my-2" />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Life Steal</span>
                <span className="text-rose-400 font-bold">{state.character.stats.lifeSteal}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Gold Find</span>
                <span className="text-gold font-bold">+{state.character.stats.goldFind}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">XP Bonus</span>
                <span className="text-emerald-400 font-bold">+{state.character.stats.expBonus}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Window */}
        <div className="relative w-[100vw] max-w-[1400px] h-[150vh] max-h-[920px] path-card rounded-xl overflow-hidden border-primary/30 shadow-[0_0_40px_rgba(var(--primary-rgb),0.25)]">
          {/* Header Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          
          
          {/* Close button */}
          <Button variant="ghost" size="icon" className="absolute top-3 right-3 z-10 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-300" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>

          <div className="flex h-full pt-16 pb-4 px-6 gap-6">

          {/* Center Panel - Equipment */}
          <div className="flex-1 flex flex-col max-w-[320px]">
            <h3 className="text-primary uppercase tracking-wider font-cinzel font-semibold mb-3 flex items-center gap-2 text-3xl">
              <Sword className="h-4 w-4" />
              Equipment
            </h3>
            <div className="relative flex-1 flex items-center justify-center">
              {/* Equipment Grid - Proper Layout */}
              <div className="relative w-[300px] h-[500px]">
                {/* Row 1 - Helm */}
                <div className="absolute left-1/2 -translate-x-1/2 top-0">
                  {renderEquipmentSlot('helm', 'Helm')}
                </div>
                
                {/* Row 2 - Amulet */}
                <div className="absolute left-1/2 -translate-x-1/2 top-[85px]">
                  {renderEquipmentSlot('amulet', 'Amulet')}
                </div>
                
                {/* Row 3 - Weapon, Character Icon, Offhand */}
                <div className="absolute left-0 top-[170px]">
                  {renderEquipmentSlot('weapon', 'Weapon')}
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 top-[170px] w-[70px] h-[70px] border-2 border-primary/30 rounded-xl bg-gradient-to-b from-muted/40 to-muted/20 flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)]">
                  <img src={CLASS_ICON_IMAGES[state.character.class]} alt={state.character.class} className="h-12 w-12 rounded-lg object-cover" />
                </div>
                <div className="absolute right-0 top-[170px]">
                  {renderEquipmentSlot('offhand', 'Offhand')}
                </div>
                
                {/* Row 4 - Gloves, Chest, Belt */}
                <div className="absolute left-0 top-[255px]">
                  {renderEquipmentSlot('gloves', 'Gloves')}
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 top-[255px]">
                  {renderEquipmentSlot('chest', 'Chest')}
                </div>
                <div className="absolute right-0 top-[255px]">
                  {renderEquipmentSlot('belt', 'Belt')}
                </div>
                
                {/* Row 5 - Rings */}
                <div className="absolute left-0 top-[340px]">
                  {renderEquipmentSlot('ring1', 'Ring')}
                </div>
                <div className="absolute right-0 top-[340px]">
                  {renderEquipmentSlot('ring2', 'Ring')}
                </div>
                
                {/* Row 6 - Boots */}
                <div className="absolute left-1/2 -translate-x-1/2 top-[425px]">
                  {renderEquipmentSlot('boots', 'Boots')}
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px bg-gradient-to-b from-transparent via-primary/40 to-transparent relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-primary/60 rotate-45 rounded-sm" />
          </div>

          {/* Right Panel - Inventory */}
          <div className="flex-1 flex flex-col">
            <h3 className="text-primary uppercase tracking-wider font-cinzel font-semibold mb-3 text-3xl">Inventory</h3>
            
            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search items..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 bg-muted/30 border-border text-foreground placeholder:text-muted-foreground focus:border-primary rounded-lg" />
            </div>

            {/* Inventory Grid */}
            <ScrollArea className="flex-1">
              <div className="grid grid-cols-8 gap-2">
                {filteredInventory.map(item => <div key={item.id} className={`
                      relative w-14 h-14 border-2 rounded-xl flex items-center justify-center cursor-pointer
                      transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)] bg-card/80
                      ${RARITY_BORDER_COLORS[item.rarity]} ${RARITY_GLOW[item.rarity]}
                      ${selectedItem?.id === item.id ? 'ring-2 ring-primary scale-105' : ''}
                    `} onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)} onMouseEnter={e => handleItemHover(item, e)} onMouseLeave={() => handleItemHover(null)}>
                    <ItemIcon icon={item.icon} className="text-2xl" />
                  </div>)}
                {/* Empty slots to fill grid */}
                {Array.from({
                  length: Math.max(0, 48 - filteredInventory.length)
                }).map((_, i) => <div key={`empty-${i}`} className="w-14 h-14 border-2 border-border/40 rounded-xl bg-muted/20" />)}
              </div>
            </ScrollArea>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4">
              <Button variant="outline" className="flex-1 bg-primary/20 border-primary/50 text-primary hover:bg-primary/30 hover:text-primary hover:shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] transition-all duration-300 rounded-lg" disabled={!selectedItem || selectedItem.slot === 'consumable'} onClick={() => selectedItem && handleEquip(selectedItem)}>
                Equip
              </Button>
              <Button variant="outline" className="flex-1 bg-destructive/20 border-destructive/50 text-destructive hover:bg-destructive/30 hover:text-destructive transition-all duration-300 rounded-lg" disabled={!selectedItem} onClick={() => selectedItem && handleDrop(selectedItem)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Drop
              </Button>
            </div>
          </div>
          </div>

          {/* Footer Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        </div>
      </div>
      
      {/* Tooltip Portal */}
      {hoveredItem && createPortal(<ItemTooltip item={hoveredItem} compareItem={hoveredItem.slot !== 'consumable' && equippedItems[hoveredItem.slot as keyof typeof equippedItems] ? equippedItems[hoveredItem.slot as keyof typeof equippedItems] : null} playerLevel={state.character?.stats.level} playerClass={state.character?.class} style={{
      left: tooltipPosition.x,
      top: tooltipPosition.y
    }} />, document.body)}
    </div>;
}