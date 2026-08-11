import { EncounterType } from './game';

export interface EditorRoom {
  id: string;
  name: string;
  theme: 'mossy' | 'crypt' | 'lava' | 'ice';
  floor: number;
  x: number;
  y: number;
}

export interface EditorConnection {
  id: string;
  fromRoomId: string;
  toRoomId: string;
  direction: 'forward' | 'left' | 'right';
  encounterType: EncounterType;
  riskLevel: 1 | 2 | 3;
}

export interface DungeonLayout {
  id: string;
  name: string;
  rooms: EditorRoom[];
  connections: EditorConnection[];
  startRoomId: string | null;
}

export type EditorTool = 'select' | 'room' | 'connect' | 'delete';
