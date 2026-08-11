import { useState, useRef, useEffect, useMemo } from 'react';
import { DiscoveredRoom, PathDirection } from '@/types/game';
import { Map, Compass, Maximize2, ZoomIn, ZoomOut, ChevronRight, ChevronLeft } from 'lucide-react';
import { MapRenderer } from './MapRenderer';
import { FullscreenMap } from './FullscreenMap';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MiniMapProps {
  rooms: DiscoveredRoom[];
  currentRoomName: string;
  currentRoomId: string;
}

type Facing = 0 | 1 | 2 | 3;

const FACING_LABELS: Record<Facing, string> = {
  0: 'N',
  1: 'E',
  2: 'S',
  3: 'W',
};

const FACING_ROTATION: Record<Facing, number> = {
  0: 0,
  1: 90,
  2: 180,
  3: 270,
};

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

const ZOOM_LEVELS = [24, 32, 40, 48];
const DEFAULT_ZOOM_INDEX = 1;

export function MiniMap({ rooms, currentRoomName, currentRoomId }: MiniMapProps) {
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const cellSize = ZOOM_LEVELS[zoomIndex];
  
  // Calculate current facing for compass
  let facing: Facing = 0;
  const roomPositions: Record<string, { x: number; y: number; facing: Facing }> = {};

  let currentX = 0;
  let currentY = 0;
  
  rooms.forEach((room) => {
    roomPositions[room.id] = { x: currentX, y: currentY, facing };
    const movementFacing = getMovementFacing(facing, room.directionTaken);
    const [dx, dy] = DIRECTION_VECTORS[movementFacing];
    currentX += dx;
    currentY += dy;
    facing = movementFacing;
  });
  
  const currentRoomPosition = roomPositions[currentRoomId];
  const currentFacing = currentRoomPosition ? currentRoomPosition.facing : facing;
  
  // Get normalized current room position for centering
  const currentPos = useMemo(() => {
    if (currentRoomPosition) {
      return { x: currentRoomPosition.x, y: currentRoomPosition.y };
    }
    return { x: currentX, y: currentY };
  }, [currentRoomPosition, currentX, currentY]);
  
  // Calculate min coordinates for normalization
  const bounds = useMemo(() => {
    const allX = rooms.map(r => roomPositions[r.id]?.x ?? 0);
    const allY = rooms.map(r => roomPositions[r.id]?.y ?? 0);
    allX.push(currentPos.x);
    allY.push(currentPos.y);
    return {
      minX: Math.min(...allX),
      minY: Math.min(...allY),
    };
  }, [rooms, currentPos, roomPositions]);
  
  // Auto-center on current room when it changes
  useEffect(() => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const padding = 12;
      
      // Normalized position
      const normX = currentPos.x - bounds.minX;
      const normY = currentPos.y - bounds.minY;
      
      // Calculate pixel position of current room
      const roomCenterX = padding + normX * cellSize + cellSize / 2;
      const roomCenterY = padding + normY * cellSize + cellSize / 2;
      
      // Center the scroll on the current room
      const scrollLeft = roomCenterX - container.clientWidth / 2;
      const scrollTop = roomCenterY - container.clientHeight / 2;
      
      container.scrollTo({
        left: Math.max(0, scrollLeft),
        top: Math.max(0, scrollTop),
        behavior: 'smooth',
      });
    }
  }, [currentRoomId, cellSize, currentPos, bounds]);
  
  const handleZoomIn = () => {
    setZoomIndex(prev => Math.min(prev + 1, ZOOM_LEVELS.length - 1));
  };
  
  const handleZoomOut = () => {
    setZoomIndex(prev => Math.max(prev - 1, 0));
  };

  return (
    <>
      <TooltipProvider delayDuration={100}>
        <div className={`fixed top-4 left-4 z-20 bg-card/95 backdrop-blur-md border-2 border-primary/30 rounded-xl shadow-2xl flex flex-col transition-all duration-300 ${isCollapsed ? 'w-12 p-2' : 'w-80 p-3'}`}>
          {/* Collapsed state */}
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsCollapsed(false)}
                  className="flex flex-col items-center gap-2 p-1 rounded hover:bg-primary/20 transition-colors"
                >
                  <Map className="h-5 w-5 text-primary" />
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <span className="text-xs">Open map</span>
              </TooltipContent>
            </Tooltip>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-2 mb-2 border-b border-border pb-2">
                <Map className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">Map</span>
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{rooms.length}</span>
                
                {/* Compass */}
                <div className="ml-auto flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-lg border border-primary/20">
                  <Compass 
                    className="h-3 w-3 text-primary transition-transform duration-300" 
                    style={{ transform: `rotate(${FACING_ROTATION[currentFacing]}deg)` }}
                  />
                  <span className="text-xs font-bold text-primary">{FACING_LABELS[currentFacing]}</span>
                </div>
                
                {/* Zoom controls */}
                <div className="flex items-center gap-0.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleZoomOut}
                        disabled={zoomIndex === 0}
                        className="p-1 rounded hover:bg-primary/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ZoomOut className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <span className="text-xs">Zoom out</span>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleZoomIn}
                        disabled={zoomIndex === ZOOM_LEVELS.length - 1}
                        className="p-1 rounded hover:bg-primary/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ZoomIn className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <span className="text-xs">Zoom in</span>
                    </TooltipContent>
                  </Tooltip>
                </div>
                
                {/* Expand button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setIsFullscreenOpen(true)}
                      className="p-1 rounded hover:bg-primary/20 transition-colors"
                    >
                      <Maximize2 className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <span className="text-xs">Open fullscreen map</span>
                  </TooltipContent>
                </Tooltip>
                
                {/* Collapse button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setIsCollapsed(true)}
                      className="p-1 rounded hover:bg-primary/20 transition-colors"
                    >
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <span className="text-xs">Collapse map</span>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              {/* Map content */}
              <div 
                ref={scrollRef}
                className="relative bg-background/50 rounded-lg border border-border/50 overflow-auto flex items-center justify-center max-h-64 p-2"
              >
                <MapRenderer
                  rooms={rooms}
                  currentRoomName={currentRoomName}
                  currentRoomId={currentRoomId}
                  cellSize={cellSize}
                  isFullscreen={false}
                />
              </div>
            </>
          )}
        </div>
      </TooltipProvider>
      
      {/* Fullscreen modal */}
      <FullscreenMap
        open={isFullscreenOpen}
        onOpenChange={setIsFullscreenOpen}
        rooms={rooms}
        currentRoomName={currentRoomName}
        currentRoomId={currentRoomId}
        currentFacing={currentFacing}
      />
    </>
  );
}