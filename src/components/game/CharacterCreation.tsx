import { useState } from 'react';
import { useGame, saveCharacterToDatabase } from '@/contexts/GameContext';
import { CharacterClass, CLASS_DESCRIPTIONS, GameState, CLASS_BASE_STATS } from '@/types/game';
import { CLASS_BASE_ATTRIBUTES } from '@/types/classes';
import { LootItem, EquippedItems } from '@/types/items';
import { Loader2 } from 'lucide-react';
import { STARTING_SKILL_POINTS } from '@/types/skills';
import dungeonBg from '@/assets/dungeon-mossy.jpg';
import warriorIcon from '@/assets/warrior-icon.jpg';
import rogueIcon from '@/assets/rogue-icon.jpg';
import mageIcon from '@/assets/mage-icon.jpg';
import clericIcon from '@/assets/cleric-icon.jpg';
import barbarianIcon from '@/assets/barbarian-icon.jpg';
import archerIcon from '@/assets/archer-icon.jpg';
import { generateRoom } from '@/lib/gameData';
import { generateLootItem } from '@/lib/lootGenerator';
import { toast } from 'sonner';
import { ATTRIBUTE_INFO } from '@/types/attributes';
import { useMenuMusic } from '@/hooks/useMenuMusic';

const CLASS_ICON_IMAGES: Record<CharacterClass, string> = {
  warrior: warriorIcon,
  rogue: rogueIcon,
  mage: mageIcon,
  cleric: clericIcon,
  barbarian: barbarianIcon,
  archer: archerIcon,
};

const EMPTY_EQUIPPED: EquippedItems = {
  helm: null,
  amulet: null,
  chest: null,
  gloves: null,
  belt: null,
  boots: null,
  weapon: null,
  offhand: null,
  ring1: null,
  ring2: null,
};

export function CharacterCreation() {
  const { dispatch } = useGame();
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<CharacterClass>('warrior');
  const [isCreating, setIsCreating] = useState(false);
  
  // Play menu music (continues from MainMenu)
  useMenuMusic(0.4);

  // Validate character name: 1-20 chars, alphanumeric + spaces/hyphens only
  const validateName = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return 'Name is required';
    if (trimmed.length < 1 || trimmed.length > 20) return 'Name must be 1-20 characters';
    if (!/^[A-Za-z0-9 -]+$/.test(trimmed)) return 'Name can only contain letters, numbers, spaces, and hyphens';
    return null;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    setNameError(validateName(value));
  };

  const handleCreate = async () => {
    const validationError = validateName(name);
    if (validationError || isCreating) {
      setNameError(validationError);
      return;
    }
    
    setIsCreating(true);
    
    // Build the game state that will be created
    const sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const baseStats = CLASS_BASE_STATS[selectedClass];
    const baseAttributes = CLASS_BASE_ATTRIBUTES[selectedClass];
    
    // Generate starting potions as LootItems
    const startingPotion1: LootItem = {
      id: `potion-${sessionId}-1`,
      name: 'Minor Health Potion',
      baseName: 'Health Potion',
      slot: 'consumable',
      rarity: 'normal',
      level: 1,
      requiredLevel: 0,
      mods: [{ type: 'health', value: 30, description: 'Restores 30 HP' }],
      value: 25,
      icon: '🧪',
    };
    const startingPotion2: LootItem = { ...startingPotion1, id: `potion-${sessionId}-2` };
    
    // Generate starting mana potion for casters
    const startingManaPotion: LootItem = {
      id: `mana-potion-${sessionId}`,
      name: 'Minor Mana Potion',
      baseName: 'Mana Potion',
      slot: 'consumable',
      rarity: 'normal',
      level: 1,
      requiredLevel: 0,
      mods: [{ type: 'mana', value: 20, description: 'Restores 20 Mana' }],
      value: 25,
      icon: '💧',
    };
    
    const starterWeapon = generateLootItem(1, 'weapon', 'uncommon');
    
    // Determine starting inventory based on class
    const isCaster = selectedClass === 'mage' || selectedClass === 'cleric';
    const startingInventory = isCaster 
      ? [startingPotion1, startingManaPotion, starterWeapon]
      : [startingPotion1, startingPotion2, starterWeapon];
    
    const newGameState: GameState = {
      screen: 'dungeon',
      character: {
        name: name.trim(),
        class: selectedClass,
        stats: {
          ...baseStats,
          gold: 50,
          experience: 0,
          level: 1,
        },
        attributes: { ...baseAttributes },
        attributePoints: 0,
        skillPoints: STARTING_SKILL_POINTS,
        skills: [],
        equippedWeapon: null,
        equippedArmor: null,
        inventory: startingInventory,
        equippedItems: { ...EMPTY_EQUIPPED },
      },
      currentRoom: generateRoom(1),
      currentEncounter: null,
      currentPathId: null,
      combat: null,
      dungeonFloor: 1,
      roomsCleared: 0,
      discoveredRooms: [],
      lastDirection: null,
      clearedPathIds: [],
      pathToRoom: {},
    };
    
    // Cloud save is best-effort: guests (no account) and offline players
    // still get to play via localStorage even if this fails or returns null.
    await saveCharacterToDatabase(name.trim(), selectedClass, newGameState);

    dispatch({ type: 'CREATE_CHARACTER', name: name.trim(), characterClass: selectedClass });
    setIsCreating(false);
  };

  // Get all class keys
  const allClasses: CharacterClass[] = ['warrior', 'rogue', 'mage', 'cleric', 'barbarian', 'archer'];

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${dungeonBg})` }}
      />
      <div className="absolute inset-0 dungeon-overlay" />
      
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-8">
        <h1 className="game-title mb-6 text-4xl font-bold text-primary">
          Create Your Hero
        </h1>

        {/* Name Input */}
        <div className="mb-8 w-full max-w-lg">
          <label className="mb-2 block font-cinzel text-base text-muted-foreground">
            Character Name
          </label>
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="Enter your name..."
            className={`w-full rounded-lg border-2 bg-card/80 px-5 py-4 font-crimson text-xl text-foreground placeholder:text-muted-foreground focus:outline-none ${
              nameError ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary'
            }`}
            maxLength={20}
          />
          {nameError && (
            <p className="mt-2 text-sm text-red-500">{nameError}</p>
          )}
        </div>

        {/* Class Selection - Horizontal columns side by side */}
        <div className="mb-8 w-full max-w-7xl">
          <label className="mb-4 block font-cinzel text-base text-muted-foreground text-center">
            Choose Your Class
          </label>
          <div className="flex gap-4 justify-center flex-wrap lg:flex-nowrap">
            {allClasses.map((charClass) => {
              const classStats = CLASS_BASE_STATS[charClass];
              const classAttrs = CLASS_BASE_ATTRIBUTES[charClass];
              const isSelected = selectedClass === charClass;
              
              return (
                <div key={charClass} className="relative">
                  {/* Particle effects for selected card */}
                  {isSelected && (
                    <>
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-2 h-2 rounded-full bg-primary/80 animate-particle pointer-events-none"
                          style={{
                            left: `${10 + (i % 4) * 25}%`,
                            top: i < 4 ? '-8px' : 'auto',
                            bottom: i >= 4 ? '-8px' : 'auto',
                            animationDelay: `${i * 0.15}s`,
                          }}
                        />
                      ))}
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={`side-${i}`}
                          className="absolute w-1.5 h-1.5 rounded-full bg-primary/60 animate-particle-side pointer-events-none"
                          style={{
                            top: `${20 + (i % 2) * 40}%`,
                            left: i < 2 ? '-6px' : 'auto',
                            right: i >= 2 ? '-6px' : 'auto',
                            animationDelay: `${i * 0.2}s`,
                          }}
                        />
                      ))}
                    </>
                  )}
                  
                  <button
                    onClick={() => setSelectedClass(charClass)}
                    className={`relative w-56 path-card rounded-xl p-5 text-left flex flex-col transition-all duration-300 ease-out ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/50 scale-105 shadow-[0_0_30px_rgba(var(--primary-rgb),0.4)] animate-selected-pulse'
                        : 'hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)] hover:-translate-y-1'
                    }`}
                  >
                  {/* Class Header */}
                  <div className="mb-4 flex flex-col items-center gap-3">
                    <img 
                      src={CLASS_ICON_IMAGES[charClass]} 
                      alt={charClass} 
                      className="h-20 w-20 rounded-lg object-cover border-2 border-primary/30" 
                    />
                    <h3 className="font-cinzel text-xl font-semibold capitalize text-foreground">
                      {charClass}
                    </h3>
                  </div>
                  
                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-4 text-center min-h-[3.5rem]">
                    {CLASS_DESCRIPTIONS[charClass]}
                  </p>
                  
                  {/* Attributes */}
                  <div className="border-t border-border pt-3 mb-3">
                    <h4 className="text-xs font-cinzel text-muted-foreground mb-2 text-center uppercase tracking-wide">Attributes</h4>
                    <div className="grid grid-cols-2 gap-1.5 text-sm">
                      {(Object.keys(classAttrs) as Array<keyof typeof classAttrs>).map((attr) => (
                        <div key={attr} className="flex items-center justify-between px-1">
                          <span className={ATTRIBUTE_INFO[attr].color}>
                            {ATTRIBUTE_INFO[attr].abbrev}
                          </span>
                          <span className="font-semibold text-foreground">{classAttrs[attr]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="border-t border-border pt-3">
                    <h4 className="text-xs font-cinzel text-muted-foreground mb-2 text-center uppercase tracking-wide">Stats</h4>
                    <div className="grid grid-cols-2 gap-1.5 text-sm">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-muted-foreground">HP</span>
                        <span className="font-semibold text-health">{classStats.maxHealth}</span>
                      </div>
                      <div className="flex items-center justify-between px-1">
                        <span className="text-muted-foreground">MP</span>
                        <span className="font-semibold text-blue-400">{classStats.maxMana}</span>
                      </div>
                      <div className="flex items-center justify-between px-1">
                        <span className="text-muted-foreground">ATK</span>
                        <span className="font-semibold text-primary">{classStats.attack}</span>
                      </div>
                      <div className="flex items-center justify-between px-1">
                        <span className="text-muted-foreground">MAG</span>
                        <span className="font-semibold text-purple-400">{classStats.magicAttack}</span>
                      </div>
                      <div className="flex items-center justify-between px-1">
                        <span className="text-muted-foreground">DEF</span>
                        <span className="font-semibold text-secondary">{classStats.defense}</span>
                      </div>
                      <div className="flex items-center justify-between px-1">
                        <span className="text-muted-foreground">CRIT</span>
                        <span className="font-semibold text-yellow-400">{classStats.critChance}%</span>
                      </div>
                    </div>
                  </div>
                </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Create Button */}
        <button
          onClick={handleCreate}
          disabled={!name.trim() || !!nameError || isCreating}
          className="fantasy-button flex items-center gap-2 rounded-lg px-12 py-5 font-cinzel text-xl font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              Creating...
            </>
          ) : (
            'Begin Adventure'
          )}
        </button>

        <button
          onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'menu' })}
          className="mt-6 text-lg text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to Menu
        </button>
      </div>
    </div>
  );
}
