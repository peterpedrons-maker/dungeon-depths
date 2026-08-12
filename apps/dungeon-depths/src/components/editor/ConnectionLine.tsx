import { EditorConnection, EditorRoom } from '@/types/editor';

interface ConnectionLineProps {
  connection: EditorConnection;
  fromRoom: EditorRoom;
  toRoom: EditorRoom;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const RISK_COLORS = {
  1: '#22c55e', // green
  2: '#eab308', // yellow
  3: '#ef4444', // red
};

const ENCOUNTER_LABELS = {
  battle: '⚔️',
  merchant: '🛒',
  treasure: '💎',
};

export function ConnectionLine({ 
  connection, 
  fromRoom, 
  toRoom, 
  isSelected,
  onSelect 
}: ConnectionLineProps) {
  const color = RISK_COLORS[connection.riskLevel];
  
  // Calculate midpoint for label
  const midX = (fromRoom.x + toRoom.x) / 2;
  const midY = (fromRoom.y + toRoom.y) / 2;

  // Calculate angle for arrow
  const angle = Math.atan2(toRoom.y - fromRoom.y, toRoom.x - fromRoom.x);
  const arrowSize = 10;
  
  // Arrow points
  const arrowX = toRoom.x - Math.cos(angle) * 30;
  const arrowY = toRoom.y - Math.sin(angle) * 30;

  return (
    <g 
      className={`cursor-pointer ${isSelected ? 'opacity-100' : 'opacity-70'}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(connection.id);
      }}
    >
      {/* Main line */}
      <line
        x1={fromRoom.x}
        y1={fromRoom.y}
        x2={toRoom.x}
        y2={toRoom.y}
        stroke={color}
        strokeWidth={isSelected ? 4 : 3}
        strokeDasharray={connection.encounterType === 'merchant' ? '8,4' : 'none'}
      />
      
      {/* Arrow head */}
      <polygon
        points={`
          ${arrowX},${arrowY}
          ${arrowX - arrowSize * Math.cos(angle - Math.PI / 6)},${arrowY - arrowSize * Math.sin(angle - Math.PI / 6)}
          ${arrowX - arrowSize * Math.cos(angle + Math.PI / 6)},${arrowY - arrowSize * Math.sin(angle + Math.PI / 6)}
        `}
        fill={color}
      />
      
      {/* Encounter label */}
      <g transform={`translate(${midX}, ${midY})`}>
        <circle r="14" fill="hsl(var(--card))" stroke={color} strokeWidth="2" />
        <text
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="12"
          className="select-none"
        >
          {ENCOUNTER_LABELS[connection.encounterType]}
        </text>
      </g>
      
      {/* Click area (invisible wider line for easier selection) */}
      <line
        x1={fromRoom.x}
        y1={fromRoom.y}
        x2={toRoom.x}
        y2={toRoom.y}
        stroke="transparent"
        strokeWidth="20"
      />
    </g>
  );
}
