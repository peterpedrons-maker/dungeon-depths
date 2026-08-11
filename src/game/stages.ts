import { EnemyKind } from './types';

export interface StageDef {
  id: number;
  name: string;
  biome: number;               // index into BIOMES
  emoji: string;
  duration: number;            // seconds of waves before the boss appears
  pool: EnemyKind[];           // enemies that can spawn here
  bossName: string;
  bossHp: number;
  bossDamage: number;
  bossInvincibleFeel?: boolean; // the "meant to kill you" final boss
  intro: string;
}

export const STAGES: StageDef[] = [
  {
    id: 0, name: 'Catacumbas', biome: 0, emoji: '🦴',
    duration: 90,
    pool: ['slime', 'bat', 'skeleton'],
    bossName: 'Guardião de Osso', bossHp: 320, bossDamage: 20,
    intro: 'Onde os mortos não descansam.',
  },
  {
    id: 1, name: 'Cavernas Úmidas', biome: 1, emoji: '🕷️',
    duration: 110,
    pool: ['slime', 'bat', 'skeleton', 'runner', 'spider', 'bigSlime'],
    bossName: 'Aracnarca', bossHp: 620, bossDamage: 26,
    intro: 'Algo tece nas sombras.',
  },
  {
    id: 2, name: 'O Abismo', biome: 2, emoji: '🔥',
    duration: 130,
    pool: ['bat', 'skeleton', 'runner', 'spider', 'ghost', 'caster', 'brute'],
    bossName: 'Coração das Trevas', bossHp: 1050, bossDamage: 32,
    intro: 'A profundeza tem fome.',
  },
  {
    id: 3, name: 'Trono do Fim', biome: 3, emoji: '👑',
    duration: 150,
    pool: ['runner', 'spider', 'ghost', 'caster', 'brute', 'bigSlime', 'skeleton'],
    bossName: 'Rei Eterno', bossHp: 2600, bossDamage: 40,
    bossInvincibleFeel: true,
    intro: 'Ninguém jamais o venceu. Ainda.',
  },
];

// ── Meta progression (persisted) ──
const KEY = 'dd_progress_v1';

function read(): { maxUnlocked: number } {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { maxUnlocked: 0 };
}
function write(v: { maxUnlocked: number }): void {
  try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* ignore */ }
}

export function getMaxUnlocked(): number {
  return Math.min(read().maxUnlocked, STAGES.length - 1);
}
export function isUnlocked(i: number): boolean {
  return i <= getMaxUnlocked();
}
// Clearing stage i unlocks i+1. Returns true if this cleared a NEW stage.
export function unlockNext(i: number): boolean {
  const cur = read().maxUnlocked;
  const next = i + 1;
  if (next > cur && next < STAGES.length) {
    write({ maxUnlocked: next });
    return true;
  }
  return false;
}
