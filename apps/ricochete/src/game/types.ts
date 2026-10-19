export type Phase = 'title' | 'aiming' | 'flying' | 'roundEnd';

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
  particles: Particle[];
  scorePops: ScorePop[];
  score: number;
  blocksBroken: number;
  combo: number;
  comboTimer: number; // seconds left before the combo resets to 1
  roundTime: number; // seconds elapsed since launch
  roundDuration: number; // total seconds the ball stays alive for
  shake: number;
  urgencyTriggered: boolean; // whether the final-seconds audio riser has already fired this round
}
