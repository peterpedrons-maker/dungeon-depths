import { EditorRoom, EditorConnection, EditorTool, DungeonLayout } from '@/types/editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  MousePointer2, 
  Plus, 
  Link2, 
  Trash2, 
  Download, 
  Home,
  Upload
} from 'lucide-react';
import { EncounterType } from '@/types/game';

interface EditorSidebarProps {
  tool: EditorTool;
  setTool: (tool: EditorTool) => void;
  selectedRoom: EditorRoom | null;
  selectedConnection: EditorConnection | null;
  layout: DungeonLayout;
  onUpdateRoom: (room: EditorRoom) => void;
  onUpdateConnection: (connection: EditorConnection) => void;
  onSetStartRoom: (roomId: string) => void;
  onExport: () => void;
  onImport: () => void;
  onUpdateLayoutName: (name: string) => void;
  onClear: () => void;
}

export function EditorSidebar({
  tool,
  setTool,
  selectedRoom,
  selectedConnection,
  layout,
  onUpdateRoom,
  onUpdateConnection,
  onSetStartRoom,
  onExport,
  onImport,
  onUpdateLayoutName,
  onClear,
}: EditorSidebarProps) {
  return (
    <div className="flex h-full w-72 flex-col border-l border-border bg-card p-4">
      {/* Layout Name */}
      <div className="mb-4">
        <Label className="text-xs text-muted-foreground">Layout Name</Label>
        <Input
          value={layout.name}
          onChange={(e) => onUpdateLayoutName(e.target.value)}
          className="mt-1"
        />
      </div>

      <Separator className="mb-4" />

      {/* Tools */}
      <div className="mb-4">
        <Label className="text-xs text-muted-foreground">Tools</Label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant={tool === 'select' ? 'default' : 'outline'}
            onClick={() => setTool('select')}
            className="gap-1"
          >
            <MousePointer2 className="h-4 w-4" />
            Select
          </Button>
          <Button
            size="sm"
            variant={tool === 'room' ? 'default' : 'outline'}
            onClick={() => setTool('room')}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Room
          </Button>
          <Button
            size="sm"
            variant={tool === 'connect' ? 'default' : 'outline'}
            onClick={() => setTool('connect')}
            className="gap-1"
          >
            <Link2 className="h-4 w-4" />
            Connect
          </Button>
          <Button
            size="sm"
            variant={tool === 'delete' ? 'destructive' : 'outline'}
            onClick={() => setTool('delete')}
            className="gap-1"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Separator className="mb-4" />

      {/* Room Properties */}
      {selectedRoom && (
        <div className="mb-4 space-y-3">
          <Label className="text-xs font-bold text-primary">Room Properties</Label>
          
          <div>
            <Label className="text-xs text-muted-foreground">Name</Label>
            <Input
              value={selectedRoom.name}
              onChange={(e) => onUpdateRoom({ ...selectedRoom, name: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Theme</Label>
            <Select
              value={selectedRoom.theme}
              onValueChange={(v) => onUpdateRoom({ ...selectedRoom, theme: v as EditorRoom['theme'] })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mossy">🌿 Mossy</SelectItem>
                <SelectItem value="crypt">💀 Crypt</SelectItem>
                <SelectItem value="lava">🔥 Lava</SelectItem>
                <SelectItem value="ice">❄️ Ice</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Floor</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={selectedRoom.floor}
              onChange={(e) => onUpdateRoom({ ...selectedRoom, floor: parseInt(e.target.value) || 1 })}
              className="mt-1"
            />
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onSetStartRoom(selectedRoom.id)}
            className="w-full gap-1"
            disabled={layout.startRoomId === selectedRoom.id}
          >
            <Home className="h-4 w-4" />
            {layout.startRoomId === selectedRoom.id ? 'Start Room ✓' : 'Set as Start'}
          </Button>
        </div>
      )}

      {/* Connection Properties */}
      {selectedConnection && (
        <div className="mb-4 space-y-3">
          <Label className="text-xs font-bold text-primary">Path Properties</Label>
          
          <div>
            <Label className="text-xs text-muted-foreground">Direction Label</Label>
            <Select
              value={selectedConnection.direction}
              onValueChange={(v) => onUpdateConnection({ 
                ...selectedConnection, 
                direction: v as EditorConnection['direction'] 
              })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="forward">↑ Forward</SelectItem>
                <SelectItem value="left">← Left</SelectItem>
                <SelectItem value="right">→ Right</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Encounter Type</Label>
            <Select
              value={selectedConnection.encounterType}
              onValueChange={(v) => onUpdateConnection({ 
                ...selectedConnection, 
                encounterType: v as EncounterType 
              })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="battle">⚔️ Battle</SelectItem>
                <SelectItem value="merchant">🛒 Merchant</SelectItem>
                <SelectItem value="treasure">💎 Treasure</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Risk Level</Label>
            <Select
              value={String(selectedConnection.riskLevel)}
              onValueChange={(v) => onUpdateConnection({ 
                ...selectedConnection, 
                riskLevel: parseInt(v) as 1 | 2 | 3 
              })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">🟢 Low Risk</SelectItem>
                <SelectItem value="2">🟡 Medium Risk</SelectItem>
                <SelectItem value="3">🔴 High Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {!selectedRoom && !selectedConnection && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground text-center">
            {tool === 'room' && 'Click on canvas to add a room'}
            {tool === 'connect' && 'Click a room, then another to connect'}
            {tool === 'select' && 'Click a room or path to edit'}
            {tool === 'delete' && 'Click a room or path to delete'}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="mt-auto space-y-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>Rooms:</span>
          <span className="font-bold text-foreground">{layout.rooms.length}</span>
        </div>
        <div className="flex justify-between">
          <span>Connections:</span>
          <span className="font-bold text-foreground">{layout.connections.length}</span>
        </div>
        <div className="flex justify-between">
          <span>Start Room:</span>
          <span className="font-bold text-foreground">
            {layout.startRoomId ? '✓ Set' : '✗ None'}
          </span>
        </div>
      </div>

      <Separator className="my-4" />

      {/* Actions */}
      <div className="space-y-2">
        <Button onClick={onExport} className="w-full gap-2">
          <Download className="h-4 w-4" />
          Export JSON
        </Button>
        <Button onClick={onImport} variant="outline" className="w-full gap-2">
          <Upload className="h-4 w-4" />
          Import JSON
        </Button>
        <Button onClick={onClear} variant="destructive" className="w-full gap-2">
          <Trash2 className="h-4 w-4" />
          Clear All
        </Button>
      </div>
    </div>
  );
}
