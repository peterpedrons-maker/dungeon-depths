export type Phase = 'title' | 'shop' | 'aiming' | 'flying' | 'levelComplete' | 'gameOver';

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface Block {
  x: number; // top-left corner
  y: number;
  w: number;
  h: number;
  level: number; // hits remaining before it breaks
  maxLevel: number; // level it started at, so render.ts can show cracking
  flash: number; // hit-flash seconds remaining
}

export type Edge = 'top' | 'bottom' | 'left' | 'right';

// A hazard along the true arena boundary. Initially hidden behind the solid
// block shell — it only becomes reachable once the player has broken a path
// to that edge, so danger grows the longer a phase goes on, not from the
// first bounce.
export interface Hole {
  edge: Edge;
  from: number; // start coordinate along the edge (x for top/bottom, y for left/right)
  to: number; // end coordinate
}

// The safe zone the ball needs to reach to clear the phase and advance.
export interface GoalZone {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface ScorePop {
  x: number;
  y: number;
  vy: number;
  life: number;
  value: number;
  combo: number;
}

export interface GameState {
  phase: Phase;
  ball: Ball;
  camera: Camera;
  blocks: Block[];
  holes: Hole[];
  goal: GoalZone;
  particles: Particle[];
  scorePops: ScorePop[];
  score: number; // cumulative across the whole run, never reset mid-run
  goldBankedAt: number; // score already converted to gold, so banking never double-counts
  blocksBroken: number;
  combo: number;
  comboTimer: number; // seconds left before the combo resets to 1
  levelIndex: number; // 0-based, increments every time the player reaches the goal
  shieldsLeft: number; // consumable saves from falling into a hole, refilled each level
  scoreMult: number; // from the "Multiplicador de Pontos" upgrade, set at run start
  roundTime: number; // seconds elapsed since launch, used only for the safety-net cutoff
  shake: number;
}
