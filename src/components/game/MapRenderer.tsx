import { DiscoveredRoom, PathDirection, PathChoice } from '@/types/game';
import { Skull, ShoppingBag, Gem, Swords, Shield, AlertTriangle } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const ENCOUNTER_ICONS_SMALL: Record<string, React.ReactNode> = {
  battle: <Skull className="h-3 w-3 text-danger" />,
  merchant: <ShoppingBag className="h-3 w-3 text-safe" />,
  treasure: <Gem className="h-3 w-3 text-gold" />,
};

const ENCOUNTER_ICONS_LARGE: Record<string, React.ReactNode> = {
  battle: <Skull className="h-5 w-5 text-danger" />,
  merchant: <ShoppingBag className="h-5 w-5 text-safe" />,
  treasure: <Gem className="h-5 w-5 text-gold" />,
};

const RISK_LABELS: Record<1 | 2 | 3, { label: string; color: string; icon: React.ReactNode }> = {
  1: { label: 'Low Risk', color: 'text-safe', icon: <Shield className="h-3 w-3" /> },
  2: { label: 'Medium Risk', color: 'text-warning', icon: <AlertTriangle className="h-3 w-3" /> },
  3: { label: 'High Risk', color: 'text-danger', icon: <Skull className="h-3 w-3" /> },
};

const ENCOUNTER_LABELS: Record<string, string> = {
  battle: 'Combat',
  merchant: 'Merchant',
  treasure: 'Treasure',
};

interface MapNode {
  room: DiscoveredRoom;
  x: number;
  y: number;
}

type Facing = 0 | 1 | 2 | 3;

const DIRECTION_VECTORS: Record<Facing, [number, number]> = {
  0: [0, -1],
  1: [1, 0],
  2: [0, 1],
  3: [-1, 0],
};

function getMovementFacing(currentFacing: Facing, direction: PathDirection): Facing {
  if (direction === 'forward') return currentFacing;
  if (direction === 'left') return ((currentFacing + 3) % 4) as Facing;
  return ((currentFacing + 1) % 4) as Facing;
}

interface MapRendererProps {
  rooms: DiscoveredRoom[];
  currentRoomName: string;
  currentRoomId: string;
  cellSize?: number;
  isFullscreen?: boolean;
}

export function MapRenderer({ 
  rooms, 
  currentRoomName, 
  currentRoomId, 
  cellSize = 40,
  isFullscreen = false 
}: MapRendererProps) {
  const { dispatch } = useGame();
  
  const ENCOUNTER_ICONS = isFullscreen ? ENCOUNTER_ICONS_LARGE : ENCOUNTER_ICONS_SMALL;
  const nodeSize = isFullscreen ? 'w-10 h-10' : 'w-6 h-6';
  const dotSize = isFullscreen ? 'w-4 h-4' : 'w-2 h-2';
  const strokeWidth = isFullscreen ? 3 : 2;
  const padding = isFullscreen ? 24 : 12;
  
  // Calculate node positions
  const nodes: MapNode[] = [];
  let currentX = 0;
  let currentY = 0;
  let facing: Facing = 0;
  
  const roomPositions: Record<string, { x: number; y: number; facing: Facing }> = {};

  rooms.forEach((room) => {
    nodes.push({ room, x: currentX, y: currentY });
    roomPositions[room.id] = { x: currentX, y: currentY, facing };
    
    const movementFacing = getMovementFacing(facing, room.directionTaken);
    const [dx, dy] = DIRECTION_VECTORS[movementFacing];
    
    currentX += dx;
    currentY += dy;
    facing = movementFacing;
  });
  
  const currentRoomPosition = roomPositions[currentRoomId];
  const currentNode = currentRoomPosition 
    ? { x: currentRoomPosition.x, y: currentRoomPosition.y }
    : { x: currentX, y: currentY };

  const allX = [...nodes.map(n => n.x), currentNode.x];
  const allY = [...nodes.map(n => n.y), currentNode.y];
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);
  
  const width = Math.max(maxX - minX + 1, 3);
  const height = Math.max(maxY - minY + 1, 3);

  const normalizedNodes = nodes.map(n => ({
    ...n,
    x: n.x - minX,
    y: n.y - minY,
  }));
  const normalizedCurrent = {
    x: currentNode.x - minX,
    y: currentNode.y - minY,
  };

  const mapWidth = width * cellSize + padding * 2;
  const mapHeight = height * cellSize + padding * 2;

  return (
    <TooltipProvider delayDuration={100}>
      <div 
        className="relative"
        style={{ 
          width: mapWidth,
          height: mapHeight,
          minWidth: mapWidth,
          minHeight: mapHeight,
        }}
      >
        {/* Connection lines */}
        <svg 
          className="absolute inset-0" 
          width={mapWidth}
          height={mapHeight}
          style={{ overflow: 'visible' }}
        >
          {normalizedNodes.map((node, index) => {
            const nextNode = normalizedNodes[index + 1] || normalizedCurrent;
            const x1 = padding + node.x * cellSize + cellSize / 2;
            const y1 = padding + node.y * cellSize + cellSize / 2;
            const x2 = padding + nextNode.x * cellSize + cellSize / 2;
            const y2 = padding + nextNode.y * cellSize + cellSize / 2;
            
            return (
              <line
                key={`line-${index}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="hsl(var(--primary) / 0.5)"
                strokeWidth={strokeWidth}
                strokeDasharray={isFullscreen ? "8 4" : "4 2"}
              />
            );
          })}
        </svg>

        {/* Discovered rooms */}
        {normalizedNodes.map((node) => {
          const pathTaken = node.room.paths.find(p => p.direction === node.room.directionTaken);
          const encounterType = pathTaken?.encounterType || 'battle';
          const isCurrentRoom = node.room.id === currentRoomId;
          
          return (
            <Tooltip key={node.room.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => !isCurrentRoom && dispatch({ type: 'BACKTRACK_TO_ROOM', roomId: node.room.id })}
                  className={`absolute flex items-center justify-center ${nodeSize} rounded-lg border-2 transition-all shadow-md ${
                    isCurrentRoom 
                      ? 'bg-primary border-primary-foreground animate-pulse cursor-default shadow-primary/50' 
                      : 'bg-muted border-border hover:bg-primary/30 hover:border-primary hover:scale-110 cursor-pointer hover:shadow-lg'
                  }`}
                  style={{
                    left: padding + node.x * cellSize + (cellSize - (isFullscreen ? 40 : 24)) / 2,
                    top: padding + node.y * cellSize + (cellSize - (isFullscreen ? 40 : 24)) / 2,
                  }}
                >
                  {isCurrentRoom ? (
                    <div className={`${dotSize} rounded-full bg-primary-foreground`} />
                  ) : (
                    ENCOUNTER_ICONS[encounterType]
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className={`p-3 ${isFullscreen ? 'max-w-xs' : ''}`}>
                <div className="font-bold text-foreground">{node.room.name}</div>
                <div className="text-muted-foreground text-xs mt-1">{node.room.description}</div>
                {isFullscreen && pathTaken && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <div className="text-xs text-muted-foreground mb-1">Path taken: {pathTaken.name}</div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={RISK_LABELS[pathTaken.riskLevel].color}>
                        {RISK_LABELS[pathTaken.riskLevel].label}
                      </span>
                      <span>•</span>
                      <span>{ENCOUNTER_LABELS[pathTaken.encounterType]}</span>
                    </div>
                  </div>
                )}
                <div className="text-muted-foreground text-xs mt-1">
                  Floor {node.room.floor} • {isCurrentRoom ? 'Current Location' : 'Click to backtrack'}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* Current room indicator */}
        {!rooms.some(r => r.id === currentRoomId) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={`absolute flex items-center justify-center ${nodeSize} rounded-lg bg-primary border-2 border-primary-foreground animate-pulse cursor-default shadow-lg shadow-primary/50`}
                style={{
                  left: padding + normalizedCurrent.x * cellSize + (cellSize - (isFullscreen ? 40 : 24)) / 2,
                  top: padding + normalizedCurrent.y * cellSize + (cellSize - (isFullscreen ? 40 : 24)) / 2,
                }}
              >
                <div className={`${dotSize} rounded-full bg-primary-foreground`} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-sm p-2">
              <div className="font-bold text-foreground">{currentRoomName}</div>
              <div className="text-muted-foreground text-xs mt-0.5">Current Location</div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
