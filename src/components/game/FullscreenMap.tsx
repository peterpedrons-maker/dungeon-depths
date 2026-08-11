import { DiscoveredRoom } from '@/types/game';
import { Map, Skull, ShoppingBag, Gem, X, Compass } from 'lucide-react';
import { MapRenderer } from './MapRenderer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

interface FullscreenMapProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rooms: DiscoveredRoom[];
  currentRoomName: string;
  currentRoomId: string;
  currentFacing: Facing;
}

export function FullscreenMap({ 
  open, 
  onOpenChange, 
  rooms, 
  currentRoomName, 
  currentRoomId,
  currentFacing 
}: FullscreenMapProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-card/98 backdrop-blur-xl border-2 border-primary/30">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Map className="h-6 w-6 text-primary" />
              <DialogTitle className="font-cinzel text-xl text-foreground">
                Dungeon Map
              </DialogTitle>
              <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">
                {rooms.length} rooms explored
              </span>
            </div>
            <div className="flex items-center gap-3">
              {/* Compass */}
              <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
                <Compass 
                  className="h-5 w-5 text-primary transition-transform duration-300" 
                  style={{ transform: `rotate(${FACING_ROTATION[currentFacing]}deg)` }}
                />
                <span className="text-sm font-bold text-primary">{FACING_LABELS[currentFacing]}</span>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto flex items-center justify-center py-6 min-h-[400px]">
          <div className="bg-background/50 rounded-xl border border-border/50 p-4">
            <MapRenderer
              rooms={rooms}
              currentRoomName={currentRoomName}
              currentRoomId={currentRoomId}
              cellSize={60}
              isFullscreen={true}
            />
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-6 pt-4 border-t border-border text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-lg bg-primary shadow-sm" /> 
            Current Location
          </span>
          <span className="flex items-center gap-2">
            <Skull className="h-4 w-4 text-danger" /> 
            Battle
          </span>
          <span className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-safe" /> 
            Merchant
          </span>
          <span className="flex items-center gap-2">
            <Gem className="h-4 w-4 text-gold" /> 
            Treasure
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
