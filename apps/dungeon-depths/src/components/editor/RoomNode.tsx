import { EditorRoom } from '@/types/editor';
import { Home, Skull, Flame, Snowflake, TreeDeciduous } from 'lucide-react';

interface RoomNodeProps {
  room: EditorRoom;
  isSelected: boolean;
  isStartRoom: boolean;
  isConnecting: boolean;
  onSelect: (id: string) => void;
  onDragStart: (id: string, e: React.MouseEvent) => void;
}

const THEME_CONFIG = {
  mossy: { icon: TreeDeciduous, color: 'bg-green-600', border: 'border-green-400' },
  crypt: { icon: Skull, color: 'bg-purple-600', border: 'border-purple-400' },
  lava: { icon: Flame, color: 'bg-orange-600', border: 'border-orange-400' },
  ice: { icon: Snowflake, color: 'bg-cyan-600', border: 'border-cyan-400' },
};

export function RoomNode({ 
  room, 
  isSelected, 
  isStartRoom,
  isConnecting,
  onSelect, 
  onDragStart 
}: RoomNodeProps) {
  const config = THEME_CONFIG[room.theme];
  const Icon = config.icon;

  return (
    <div
      className={`absolute cursor-pointer select-none transition-all duration-150 ${
        isSelected ? 'ring-4 ring-primary ring-offset-2 ring-offset-background z-20' : 'z-10'
      } ${isConnecting ? 'ring-2 ring-warning animate-pulse' : ''}`}
      style={{ 
        left: room.x, 
        top: room.y,
        transform: 'translate(-50%, -50%)'
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(room.id);
      }}
      onMouseDown={(e) => {
        if (e.button === 0) {
          onDragStart(room.id, e);
        }
      }}
    >
      <div className={`relative flex flex-col items-center gap-1 rounded-lg border-2 ${config.border} ${config.color} p-3 shadow-lg`}>
        {isStartRoom && (
          <div className="absolute -top-2 -right-2 rounded-full bg-gold p-1">
            <Home className="h-3 w-3 text-background" />
          </div>
        )}
        <Icon className="h-6 w-6 text-white" />
        <span className="max-w-20 truncate text-xs font-bold text-white">
          {room.name}
        </span>
        <span className="text-[10px] text-white/70">
          F{room.floor}
        </span>
      </div>
    </div>
  );
}
