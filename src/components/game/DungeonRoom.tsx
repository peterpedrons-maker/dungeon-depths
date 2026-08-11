import { useGame } from '@/contexts/GameContext';
import { PathChoice, PathDirection, EncounterType } from '@/types/game';
import { Skull, AlertTriangle, Shield, Flame, Sparkles, ArrowUp, ArrowLeft, ArrowRight, MapPin, Footprints, PackageOpen, ShoppingBag, CheckCircle } from 'lucide-react';
import dungeonBg from '@/assets/dungeon-mossy.jpg';
import { ParticleEffects } from './ParticleEffects';
import { MiniMap } from './MiniMap';
import { EncounterTransition } from './EncounterTransition';
import { useMemo, useState, useCallback } from 'react';

const RISK_CONFIG = {
  1: {
    icon: <Shield className="h-6 w-6 text-safe drop-shadow-[0_0_8px_hsl(var(--safe))]" />,
    label: 'Low Risk',
    labelClass: 'text-safe',
    cardClass: 'risk-card-low',
    glowClass: 'glow-safe',
    decorIcon: <Sparkles className="h-4 w-4 text-safe/60" />,
  },
  2: {
    icon: <AlertTriangle className="h-6 w-6 text-warning drop-shadow-[0_0_8px_hsl(var(--warning))]" />,
    label: 'Medium Risk',
    labelClass: 'text-warning',
    cardClass: 'risk-card-medium',
    glowClass: 'glow-warning',
    decorIcon: <Flame className="h-4 w-4 text-warning/60" />,
  },
  3: {
    icon: <Skull className="h-6 w-6 text-danger drop-shadow-[0_0_10px_hsl(var(--danger))]" />,
    label: 'High Risk',
    labelClass: 'text-danger',
    cardClass: 'risk-card-high',
    glowClass: 'glow-danger',
    decorIcon: <Skull className="h-4 w-4 text-danger/60" />,
  },
};

const DIRECTION_ICONS: Record<PathDirection, React.ReactNode> = {
  forward: <ArrowUp className="h-8 w-8" />,
  left: <ArrowLeft className="h-8 w-8" />,
  right: <ArrowRight className="h-8 w-8" />,
};

const DIRECTION_ORDER: PathDirection[] = ['left', 'forward', 'right'];

export function DungeonRoom() {
  const { state, dispatch } = useGame();
  const { currentRoom, discoveredRooms, clearedPathIds } = state;
  
  // Transition state
  const [showTransition, setShowTransition] = useState(false);
  const [pendingPath, setPendingPath] = useState<{ encounterType: EncounterType; direction: PathDirection; pathId: string } | null>(null);

  // Check if current room was already explored (exists in discoveredRooms)
  const isExplored = useMemo(() => {
    if (!currentRoom) return false;
    return discoveredRooms.some(room => room.id === currentRoom.id);
  }, [currentRoom, discoveredRooms]);

  // Get which paths have been explored from this room (based on discoveredRooms direction)
  const exploredDirections = useMemo(() => {
    if (!currentRoom) return new Set<PathDirection>();
    const roomVisit = discoveredRooms.find(r => r.id === currentRoom.id);
    if (roomVisit) {
      return new Set<PathDirection>([roomVisit.directionTaken]);
    }
    return new Set<PathDirection>();
  }, [currentRoom, discoveredRooms]);

  // Get which paths have been cleared (events completed)
  const clearedPaths = useMemo(() => {
    if (!currentRoom || !currentRoom.paths) return new Set<string>();
    return new Set(currentRoom.paths.filter(p => clearedPathIds.includes(p.id)).map(p => p.id));
  }, [currentRoom, clearedPathIds]);

  // Calculate dominant risk level for ambient particles
  const dominantRisk = useMemo(() => {
    if (!currentRoom || !currentRoom.paths || currentRoom.paths.length === 0) return 1;
    const risks = currentRoom.paths.map(p => p.riskLevel);
    return Math.max(...risks) as 1 | 2 | 3;
  }, [currentRoom]);

  // Sort paths by direction order - with safety check
  const sortedPaths = useMemo(() => {
    if (!currentRoom || !currentRoom.paths || currentRoom.paths.length === 0) return [];
    return [...currentRoom.paths].sort(
      (a, b) => DIRECTION_ORDER.indexOf(a.direction) - DIRECTION_ORDER.indexOf(b.direction)
    );
  }, [currentRoom]);

  // If no room, don't render
  if (!currentRoom) return null;
  
  // If room has no paths (like boss room), show a different UI
  const hasNoPaths = sortedPaths.length === 0;

  const handlePathChoice = (path: PathChoice) => {
    // Check if path is already cleared (skip transition for cleared paths)
    const isPathCleared = clearedPathIds.includes(path.id) && path.encounterType !== 'merchant';
    
    // Only show transition for battle encounters
    if (path.encounterType === 'battle' && !isPathCleared) {
      setPendingPath({ encounterType: path.encounterType, direction: path.direction, pathId: path.id });
      setShowTransition(true);
      return;
    }
    
    // For non-battle encounters or cleared paths, go directly
    dispatch({ type: 'CHOOSE_PATH', encounterType: path.encounterType, direction: path.direction, pathId: path.id });
  };
  
  const handleTransitionComplete = useCallback(() => {
    if (pendingPath) {
      dispatch({ type: 'CHOOSE_PATH', encounterType: pendingPath.encounterType, direction: pendingPath.direction, pathId: pendingPath.pathId });
      setPendingPath(null);
    }
    setShowTransition(false);
  }, [pendingPath, dispatch]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Encounter Transition Effect */}
      <EncounterTransition 
        isActive={showTransition} 
        onComplete={handleTransitionComplete}
        encounterType={pendingPath?.encounterType}
      />
      
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${dungeonBg})` }}
      />
      <div className="absolute inset-0 dungeon-overlay" />
      
      {/* Ambient Particles based on risk */}
      <ParticleEffects riskLevel={dominantRisk} count={35} />
      
      {/* Content - offset for HUD */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pt-24 pb-8">
        {/* Room Title */}
        <div className="mb-8 text-center">
          {isExplored && (
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary animate-fade-in">
              <MapPin className="h-4 w-4" />
              <span className="font-semibold">Already Explored</span>
            </div>
          )}
          <h2 className="game-title mb-2 text-3xl font-bold text-primary md:text-4xl">
            {currentRoom.name}
          </h2>
          <p className="text-lg text-muted-foreground">
            {currentRoom.description}
          </p>
        </div>

        {/* Path Description or No Paths Message */}
        {hasNoPaths ? (
          <div className="mb-8 max-w-md text-center">
            <p className="text-lg text-foreground/80 mb-4">
              You have reached a dead end. There is no way forward from here.
            </p>
            <p className="text-sm text-muted-foreground">
              Use the map to backtrack to a previous room.
            </p>
          </div>
        ) : (
          <p className="mb-8 max-w-md text-center text-foreground/80">
            Multiple passages branch before you. Each shrouded in mystery...
          </p>
        )}

        {/* Mini Map */}
        <MiniMap rooms={discoveredRooms} currentRoomName={currentRoom.name} currentRoomId={currentRoom.id} />

        {/* Path Choices - Directional Layout */}
        {!hasNoPaths && (
        <div className="grid w-full max-w-4xl gap-6 md:grid-cols-3">
        {sortedPaths.map((path) => {
            const config = RISK_CONFIG[path.riskLevel];
            const isPathExplored = exploredDirections.has(path.direction);
            const isPathCleared = clearedPaths.has(path.id);
            const isMerchant = path.encounterType === 'merchant';
            const isTreasure = path.encounterType === 'treasure';
            const isBattle = path.encounterType === 'battle';
            
            // Determine the visual state for cleared paths
            const showClearedState = isPathCleared && !isMerchant;
            const showMerchantRevisit = isPathCleared && isMerchant;
            
            return (
              <button
                key={path.id}
                onClick={() => handlePathChoice(path)}
                className={`group relative rounded-lg p-6 text-left transition-all duration-300 ${
                  showClearedState 
                    ? 'bg-muted/30 border-2 border-muted/50 opacity-70' 
                    : config.cardClass
                } ${
                  showMerchantRevisit ? 'ring-2 ring-gold/50' : 
                  isPathExplored && !showClearedState ? 'ring-2 ring-primary/50' : ''
                }`}
              >
                {/* Status badges */}
                {showClearedState ? (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-[10px] font-bold text-muted-foreground shadow-md">
                    <CheckCircle className="h-3 w-3" />
                    {isBattle ? 'ENEMY DEFEATED' : isTreasure ? 'LOOTED' : 'CLEARED'}
                  </div>
                ) : showMerchantRevisit ? (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 rounded-full bg-gold/90 px-3 py-1 text-[10px] font-bold text-background shadow-md">
                    <ShoppingBag className="h-3 w-3" />
                    MERCHANT OPEN
                  </div>
                ) : isPathExplored ? (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[10px] font-bold text-primary-foreground shadow-md">
                    <Footprints className="h-3 w-3" />
                    EXPLORED
                  </div>
                ) : null}
                
                {/* Animated border glow - disabled for cleared paths */}
                {!showClearedState && (
                  <div className={`absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${config.glowClass}`} />
                )}
                
                {/* Direction Arrow */}
                <div className={`absolute top-3 right-3 transition-colors ${
                  showClearedState ? 'text-muted-foreground/30' : 'text-muted-foreground/50 group-hover:text-primary'
                }`}>
                  {DIRECTION_ICONS[path.direction]}
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className={`font-cinzel-decorative text-xl font-bold transition-colors ${
                      showClearedState ? 'text-muted-foreground' : 'text-foreground group-hover:text-primary'
                    }`}>
                      {path.name}
                    </h3>
                    <div className={showClearedState ? 'opacity-30' : 'animate-pulse-slow'}>
                      {showClearedState ? <CheckCircle className="h-6 w-6 text-muted-foreground" /> : config.icon}
                    </div>
                  </div>
                  
                  <p className={`mb-4 text-sm italic leading-relaxed ${
                    showClearedState ? 'text-muted-foreground/60' : 'text-muted-foreground'
                  }`}>
                    {showClearedState 
                      ? '"The path lies quiet and empty..."'
                      : showMerchantRevisit
                      ? '"The merchant awaits your return..."'
                      : `"${path.description}"`
                    }
                  </p>
                  
                  {/* Risk indicator bar - hidden for cleared */}
                  {!showClearedState && (
                    <div className="mb-3 h-1 w-full rounded-full bg-muted/50 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 group-hover:w-full ${
                          path.riskLevel === 1 ? 'w-1/3 bg-safe' :
                          path.riskLevel === 2 ? 'w-2/3 bg-warning' : 'w-full bg-danger'
                        }`}
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold uppercase tracking-wider ${
                      showClearedState ? 'text-muted-foreground/60' : config.labelClass
                    }`}>
                      {showClearedState ? 'Safe Passage' : showMerchantRevisit ? 'Shop Open' : config.label}
                    </span>
                    <span className={`text-xs ${showClearedState ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}>
                      {showClearedState ? 'No events' :
                       showMerchantRevisit ? 'Trade available' :
                       path.riskLevel === 1 ? 'Safer path' : 
                       path.riskLevel === 2 ? 'Uncertain fate' : 'Great peril'}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        )}
        {/* Inventory hint */}
        <p className="mt-8 text-sm text-muted-foreground">
          Potions: {state.character?.inventory.filter(i => i.slot === 'consumable' && i.mods.some(m => m.type === 'health')).length || 0}
        </p>
      </div>
    </div>
  );
}
