import { useState, useMemo, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { EncounterType, Item } from '@/types/game';
import { LootItem, RARITY_COLORS, RARITY_BORDER_COLORS } from '@/types/items';
import { getMerchantItems, getTreasureLoot } from '@/lib/gameData';
import { generateTreasureLoot } from '@/lib/lootGenerator';
import { Coins, ShoppingBag, PackageOpen, Gem } from 'lucide-react';
import dungeonBg from '@/assets/dungeon-mossy.jpg';
import treasureBg from '@/assets/dungeon-treasure.jpg';
import { ItemIcon } from './ItemIcon';

export function Encounter() {
  const {
    state,
    dispatch
  } = useGame();
  const {
    currentEncounter,
    dungeonFloor,
    character,
    currentPathId,
    clearedPathIds
  } = state;

  const [resolved, setResolved] = useState(false);
  const [result, setResult] = useState<{
    message: string;
    success: boolean;
  } | null>(null);
  const [loot, setLoot] = useState<Item | null>(null);
  const [merchantItems, setMerchantItems] = useState<Item[]>([]);
  const [treasureLoot, setTreasureLoot] = useState<{ gold: number; item?: Item } | null>(null);
  const [treasureItemDrops, setTreasureItemDrops] = useState<LootItem[]>([]);

  // Reset local state when entering a new path
  useEffect(() => {
    setResolved(false);
    setResult(null);
    setLoot(null);
    setMerchantItems([]);
    setTreasureLoot(null);
    setTreasureItemDrops([]);
  }, [currentPathId]);
  
  // Path is cleared if we've already completed its event before (merchant is excluded - always functional)
  const isCleared = useMemo(() => {
    if (!currentPathId) return false;
    // Merchants are NEVER considered cleared - they always remain functional
    if (currentEncounter === 'merchant') return false;
    const cleared = clearedPathIds.includes(currentPathId);
    return cleared;
  }, [currentPathId, currentEncounter, clearedPathIds]);
  
  // Auto-resolve cleared rooms immediately (skip to continue button)
  useEffect(() => {
    if (isCleared && !resolved) {
      setResolved(true);
      setResult({
        message: 'This area has already been cleared. Nothing of interest remains.',
        success: true
      });
    }
  }, [isCleared, resolved]);

  if (!currentEncounter || !character) return null;
  
  const handleResolve = () => {
    // If room is cleared (revisited non-merchant), just continue
    if (isCleared) {
      setResult({
        message: 'This area has already been cleared. Nothing of interest remains.',
        success: true
      });
      setResolved(true);
      return;
    }

    if (currentEncounter === 'merchant') {
      setMerchantItems(getMerchantItems(dungeonFloor, false));
      setResolved(true);
      return;
    }

    if (currentEncounter === 'treasure') {
      const loot = getTreasureLoot(dungeonFloor);
      setTreasureLoot(loot);
      
      // Generate loot items
      const itemDrops = generateTreasureLoot(dungeonFloor);
      setTreasureItemDrops(itemDrops);
      
      // Give the player the loot
      dispatch({ type: 'ADD_GOLD', amount: loot.gold });
      if (loot.item) {
        dispatch({ type: 'ADD_ITEM', item: loot.item });
      }
      
      // Add generated loot items
      itemDrops.forEach(item => {
        dispatch({ type: 'ADD_LOOT_ITEM', item });
      });
      
      // Mark path cleared so treasure can't be taken again
      if (currentPathId) {
        dispatch({ type: 'MARK_PATH_CLEARED', pathId: currentPathId });
      }
      
      setResolved(true);
      return;
    }

    // Mark path cleared after resolving an event
    if (currentPathId) {
      dispatch({ type: 'MARK_PATH_CLEARED', pathId: currentPathId });
    }

    setResolved(true);
  };

  const handleBuy = (item: Item) => {
    if (character.stats.gold >= item.value) {
      dispatch({
        type: 'BUY_ITEM',
        item: {
          ...item,
          id: `${item.id}-${Date.now()}`
        }
      });
    }
  };

  const handleContinue = () => {
    // If this was a cleared path, return to dungeon view (stay in current room context)
    // instead of moving to next room - prevents getting stuck
    if (isCleared) {
      dispatch({ type: 'SET_SCREEN', screen: 'dungeon' });
    } else {
      dispatch({ type: 'NEXT_ROOM' });
    }
  };

  const encounterConfig: Record<EncounterType, {
    title: string;
    icon: React.ReactNode;
    description: string;
  }> = {
    merchant: {
      title: 'Wandering Merchant',
      icon: <ShoppingBag className="h-12 w-12 text-gold" />,
      description: '"Welcome, adventurer..."'
    },
    battle: {
      title: 'Battle',
      icon: null,
      description: ''
    },
    treasure: {
      title: 'Treasure Chamber',
      icon: <Gem className="h-12 w-12 text-gold" />,
      description: 'A forgotten chest awaits...'
    }
  };

  const config = encounterConfig[currentEncounter];

  const backgroundImage = currentEncounter === 'treasure' ? treasureBg : dungeonBg;

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{
        backgroundImage: `url(${backgroundImage})`
      }} />
      <div className="absolute inset-0 bg-background/85" />
      
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pt-24 pb-8">
        <div className="w-full max-w-md text-center">
          {/* Cleared room indicator */}
          {isCleared ? (
            <>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-muted bg-muted/30 px-4 py-2 text-sm text-muted-foreground animate-fade-in">
                <PackageOpen className="h-5 w-5" />
                <span className="font-semibold">Room Already Cleared</span>
              </div>
              
              <h2 className="game-title mb-2 text-3xl font-bold text-muted-foreground">
                Empty Chamber
              </h2>
              <p className="mb-8 italic text-muted-foreground">
                You've been here before. The room lies silent and empty...
              </p>
            </>
          ) : (
            <>
              {/* Title */}
              <h2 className="game-title mb-2 text-3xl font-bold text-primary">
                {config.title}
              </h2>
              <p className="mb-8 italic text-muted-foreground">
                {config.description}
              </p>
            </>
          )}

          {/* Pre-resolution */}
          {!resolved && !isCleared && currentEncounter === 'merchant' && (
            <button onClick={handleResolve} className="fantasy-button rounded-lg px-8 py-4 font-cinzel text-lg text-primary-foreground">
              Browse Wares
            </button>
          )}

          {!resolved && !isCleared && currentEncounter === 'treasure' && (
            <button onClick={handleResolve} className="fantasy-button rounded-lg px-8 py-4 font-cinzel text-lg text-primary-foreground">
              Open Chest
            </button>
          )}
          
          {/* Cleared room - just show continue */}
          {!resolved && isCleared && (
            <button onClick={handleContinue} className="fantasy-button rounded-lg px-8 py-4 font-cinzel text-lg text-primary-foreground">
              Continue
            </button>
          )}

          {/* Merchant Shop */}
          {resolved && currentEncounter === 'merchant' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-gold">
                <Coins className="h-5 w-5" />
                <span className="font-semibold">{character.stats.gold} gold</span>
              </div>
              
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {merchantItems.map((item, i) => (
                  <div key={`${item.id}-${i}`} className="flex items-center justify-between rounded-lg border border-border bg-card/80 p-3">
                    <div className="text-left">
                      <p className="font-semibold text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <button 
                      onClick={() => handleBuy(item)} 
                      disabled={character.stats.gold < item.value} 
                      className="rounded bg-gold/20 px-4 py-2 font-cinzel text-sm text-gold transition-all hover:bg-gold/40 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {item.value}g
                    </button>
                  </div>
                ))}
              </div>

              <button onClick={handleContinue} className="mt-4 rounded-lg border-2 border-primary/50 bg-card px-8 py-3 font-cinzel text-foreground transition-all hover:border-primary">
                Leave Shop
              </button>
            </div>
          )}

          {/* Treasure Loot Display */}
          {resolved && currentEncounter === 'treasure' && treasureLoot && (
            <div className="space-y-4 animate-fade-in">
              <div className="rounded-lg border border-gold/50 bg-card/80 p-6">
                <Gem className="mx-auto mb-4 h-16 w-16 text-gold animate-pulse" />
                <h3 className="mb-4 font-cinzel text-xl text-gold">Treasure Found!</h3>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-gold">
                    <Coins className="h-5 w-5" />
                    <span className="font-semibold">+{treasureLoot.gold} gold</span>
                  </div>
                  
                  {treasureLoot.item && (
                    <div className="mt-2 rounded border border-border bg-background/50 p-2">
                      <p className="font-semibold text-foreground">{treasureLoot.item.name}</p>
                      <p className="text-xs text-muted-foreground">{treasureLoot.item.description}</p>
                    </div>
                  )}
                  
                  {/* Display generated loot items */}
                  {treasureItemDrops.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Items Found
                      </p>
                      {treasureItemDrops.map(item => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-2 rounded border-2 px-3 py-2 bg-background/50 ${RARITY_BORDER_COLORS[item.rarity]}`}
                        >
                          <ItemIcon icon={item.icon} className="text-lg" />
                          <div className="text-left flex-1">
                            <p className={`font-semibold text-sm ${RARITY_COLORS[item.rarity]}`}>
                              {item.name}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">{item.slot}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button onClick={handleContinue} className="fantasy-button rounded-lg px-8 py-4 font-cinzel text-lg text-primary-foreground">
                Continue
              </button>
            </div>
          )}
          
          {/* Cleared treasure room - show continue button */}
          {resolved && currentEncounter === 'treasure' && !treasureLoot && isCleared && (
            <button onClick={handleContinue} className="fantasy-button rounded-lg px-8 py-4 font-cinzel text-lg text-primary-foreground">
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
