import { useState, useRef, useCallback, useEffect } from 'react';
import { EditorRoom, EditorConnection, EditorTool, DungeonLayout } from '@/types/editor';
import { RoomNode } from './RoomNode';
import { ConnectionLine } from './ConnectionLine';
import { EditorSidebar } from './EditorSidebar';
import { toast } from 'sonner';

const INITIAL_LAYOUT: DungeonLayout = {
  id: 'layout-1',
  name: 'New Dungeon',
  rooms: [],
  connections: [],
  startRoomId: null,
};

export function DungeonEditor() {
  const [layout, setLayout] = useState<DungeonLayout>(INITIAL_LAYOUT);
  const [tool, setTool] = useState<EditorTool>('select');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [connectingFromId, setConnectingFromId] = useState<string | null>(null);
  const [draggingRoomId, setDraggingRoomId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedRoom = layout.rooms.find(r => r.id === selectedRoomId) || null;
  const selectedConnection = layout.connections.find(c => c.id === selectedConnectionId) || null;

  // Generate unique ID
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  // Add room at click position
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (tool !== 'room') {
      setSelectedRoomId(null);
      setSelectedConnectionId(null);
      setConnectingFromId(null);
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRoom: EditorRoom = {
      id: generateId(),
      name: `Room ${layout.rooms.length + 1}`,
      theme: 'mossy',
      floor: 1,
      x,
      y,
    };

    setLayout(prev => ({
      ...prev,
      rooms: [...prev.rooms, newRoom],
      startRoomId: prev.startRoomId || newRoom.id,
    }));

    toast.success('Room added!');
  }, [tool, layout.rooms.length]);

  // Handle room selection/connection/deletion
  const handleRoomSelect = useCallback((roomId: string) => {
    if (tool === 'delete') {
      setLayout(prev => ({
        ...prev,
        rooms: prev.rooms.filter(r => r.id !== roomId),
        connections: prev.connections.filter(c => c.fromRoomId !== roomId && c.toRoomId !== roomId),
        startRoomId: prev.startRoomId === roomId ? null : prev.startRoomId,
      }));
      toast.success('Room deleted!');
      return;
    }

    if (tool === 'connect') {
      if (!connectingFromId) {
        setConnectingFromId(roomId);
        toast.info('Now click another room to connect');
      } else if (connectingFromId !== roomId) {
        // Check if connection already exists
        const exists = layout.connections.some(
          c => (c.fromRoomId === connectingFromId && c.toRoomId === roomId) ||
               (c.fromRoomId === roomId && c.toRoomId === connectingFromId)
        );

        if (exists) {
          toast.error('Connection already exists!');
          setConnectingFromId(null);
          return;
        }

        const newConnection: EditorConnection = {
          id: generateId(),
          fromRoomId: connectingFromId,
          toRoomId: roomId,
          direction: 'forward',
          encounterType: 'battle',
          riskLevel: 2,
        };

        setLayout(prev => ({
          ...prev,
          connections: [...prev.connections, newConnection],
        }));

        toast.success('Connection created!');
        setConnectingFromId(null);
      }
      return;
    }

    setSelectedRoomId(roomId);
    setSelectedConnectionId(null);
  }, [tool, connectingFromId, layout.connections]);

  // Handle connection selection/deletion
  const handleConnectionSelect = useCallback((connectionId: string) => {
    if (tool === 'delete') {
      setLayout(prev => ({
        ...prev,
        connections: prev.connections.filter(c => c.id !== connectionId),
      }));
      toast.success('Connection deleted!');
      return;
    }

    setSelectedConnectionId(connectionId);
    setSelectedRoomId(null);
  }, [tool]);

  // Drag handling
  const handleDragStart = useCallback((roomId: string, e: React.MouseEvent) => {
    if (tool !== 'select') return;
    
    const room = layout.rooms.find(r => r.id === roomId);
    if (!room) return;

    setDraggingRoomId(roomId);
    setDragOffset({
      x: e.clientX - room.x,
      y: e.clientY - room.y,
    });
  }, [tool, layout.rooms]);

  useEffect(() => {
    if (!draggingRoomId) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = Math.max(30, Math.min(rect.width - 30, e.clientX - rect.left));
      const y = Math.max(30, Math.min(rect.height - 30, e.clientY - rect.top));

      setLayout(prev => ({
        ...prev,
        rooms: prev.rooms.map(r =>
          r.id === draggingRoomId ? { ...r, x, y } : r
        ),
      }));
    };

    const handleMouseUp = () => {
      setDraggingRoomId(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingRoomId]);

  // Update room
  const handleUpdateRoom = useCallback((updatedRoom: EditorRoom) => {
    setLayout(prev => ({
      ...prev,
      rooms: prev.rooms.map(r => r.id === updatedRoom.id ? updatedRoom : r),
    }));
  }, []);

  // Update connection
  const handleUpdateConnection = useCallback((updatedConnection: EditorConnection) => {
    setLayout(prev => ({
      ...prev,
      connections: prev.connections.map(c => 
        c.id === updatedConnection.id ? updatedConnection : c
      ),
    }));
  }, []);

  // Set start room
  const handleSetStartRoom = useCallback((roomId: string) => {
    setLayout(prev => ({ ...prev, startRoomId: roomId }));
    toast.success('Start room set!');
  }, []);

  // Export layout
  const handleExport = useCallback(() => {
    const data = JSON.stringify(layout, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${layout.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Layout exported!');
  }, [layout]);

  // Import layout
  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as DungeonLayout;
        setLayout(data);
        toast.success('Layout imported!');
      } catch {
        toast.error('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  // Clear all
  const handleClear = useCallback(() => {
    setLayout(INITIAL_LAYOUT);
    setSelectedRoomId(null);
    setSelectedConnectionId(null);
    toast.success('Canvas cleared!');
  }, []);

  // Update layout name
  const handleUpdateLayoutName = useCallback((name: string) => {
    setLayout(prev => ({ ...prev, name }));
  }, []);

  return (
    <div className="flex h-screen w-full bg-background">
      {/* Canvas Area */}
      <div className="relative flex-1 overflow-hidden">
        {/* Header */}
        <div className="absolute left-4 top-4 z-30 rounded-lg bg-card/90 backdrop-blur px-4 py-2 shadow-lg">
          <h1 className="font-cinzel-decorative text-xl font-bold text-primary">
            Dungeon Layout Editor
          </h1>
          <p className="text-xs text-muted-foreground">
            {tool === 'room' ? 'Click to place rooms' : 
             tool === 'connect' ? 'Click rooms to connect' :
             tool === 'delete' ? 'Click to delete' : 'Drag rooms to move'}
          </p>
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className={`h-full w-full ${
            tool === 'room' ? 'cursor-crosshair' : 
            tool === 'connect' ? 'cursor-pointer' :
            tool === 'delete' ? 'cursor-not-allowed' : 'cursor-default'
          }`}
          style={{
            backgroundImage: `
              radial-gradient(circle at 1px 1px, hsl(var(--muted-foreground) / 0.15) 1px, transparent 0)
            `,
            backgroundSize: '40px 40px',
          }}
          onClick={handleCanvasClick}
        >
          {/* SVG for connections */}
          <svg className="absolute inset-0 h-full w-full pointer-events-none">
            <g className="pointer-events-auto">
              {layout.connections.map(conn => {
                const fromRoom = layout.rooms.find(r => r.id === conn.fromRoomId);
                const toRoom = layout.rooms.find(r => r.id === conn.toRoomId);
                if (!fromRoom || !toRoom) return null;

                return (
                  <ConnectionLine
                    key={conn.id}
                    connection={conn}
                    fromRoom={fromRoom}
                    toRoom={toRoom}
                    isSelected={selectedConnectionId === conn.id}
                    onSelect={handleConnectionSelect}
                  />
                );
              })}
            </g>
          </svg>

          {/* Room nodes */}
          {layout.rooms.map(room => (
            <RoomNode
              key={room.id}
              room={room}
              isSelected={selectedRoomId === room.id}
              isStartRoom={layout.startRoomId === room.id}
              isConnecting={connectingFromId === room.id}
              onSelect={handleRoomSelect}
              onDragStart={handleDragStart}
            />
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <EditorSidebar
        tool={tool}
        setTool={setTool}
        selectedRoom={selectedRoom}
        selectedConnection={selectedConnection}
        layout={layout}
        onUpdateRoom={handleUpdateRoom}
        onUpdateConnection={handleUpdateConnection}
        onSetStartRoom={handleSetStartRoom}
        onExport={handleExport}
        onImport={handleImport}
        onUpdateLayoutName={handleUpdateLayoutName}
        onClear={handleClear}
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
