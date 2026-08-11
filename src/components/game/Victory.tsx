import { useGame } from '@/contexts/GameContext';
import { Trophy, Coins, Star } from 'lucide-react';
import dungeonBg from '@/assets/dungeon-mossy.jpg';
import { useMemo } from 'react';
import { generateCombatLoot } from '@/lib/lootGenerator';
import { LootItem, RARITY_COLORS, RARITY_BORDER_COLORS } from '@/types/items';
import { ItemIcon } from './ItemIcon';

export function Victory() {
  const { state, dispatch } = useGame();
  const { combat, dungeonFloor, currentPathId } = state;

  // Generate loot once when component mounts
  const lootDrops = useMemo<LootItem[]>(() => {
    return generateCombatLoot(dungeonFloor, 'normal');
  }, [dungeonFloor]);

  if (!combat) return null;

  const { enemy } = combat;

  const handleContinue = () => {
    // Add all loot items to inventory
    lootDrops.forEach(item => {
      dispatch({ type: 'ADD_LOOT_ITEM', item });
    });
    
    // Mark path as cleared
    if (currentPathId) {
      dispatch({ type: 'MARK_PATH_CLEARED', pathId: currentPathId });
    }
    
    dispatch({ type: 'NEXT_ROOM' });
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${dungeonBg})` }}
      />
      <div className="absolute inset-0 bg-background/85" />
      
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pt-24">
        <div className="animate-float mb-8">
          <Trophy className="h-20 w-20 text-gold" />
        </div>

        <h1 className="game-title mb-4 text-4xl font-bold text-primary">
          Victory!
        </h1>
        <p className="mb-8 text-xl text-foreground">
          You defeated the {enemy.name}!
        </p>

        <div className="mb-6 flex gap-8">
          <div className="flex items-center gap-2">
            <Coins className="h-6 w-6 text-gold" />
            <span className="text-xl font-semibold text-gold">+{enemy.goldReward}</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-6 w-6 text-exp" />
            <span className="text-xl font-semibold text-exp">+{enemy.expReward}</span>
          </div>
        </div>

        {/* Loot Drops */}
        {lootDrops.length > 0 && (
          <div className="mb-8 w-full max-w-md">
            <p className="mb-3 text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Loot Dropped
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {lootDrops.map(item => (
                <div
                  key={item.id}
                  className={`flex items-center gap-2 rounded-lg border-2 px-4 py-2 bg-card/80 ${RARITY_BORDER_COLORS[item.rarity]}`}
                >
                  <ItemIcon icon={item.icon} className="text-xl" />
                  <div className="text-left">
                    <p className={`font-semibold text-sm ${RARITY_COLORS[item.rarity]}`}>
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{item.slot}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleContinue}
          className="fantasy-button rounded-lg px-10 py-4 font-cinzel text-lg text-primary-foreground"
        >
          Continue Deeper
        </button>
      </div>
    </div>
  );
}
