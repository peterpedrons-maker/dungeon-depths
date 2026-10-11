import { EnemyKind } from './types';

export interface WaveDef {
  id: number;
  name: string;
  duration: number; // seconds of regular spawns before the boss appears
  pool: EnemyKind[];
  bossName: string;
  bossHp: number;
  bossDamage: number;
  intro: string;
}

// A single wave for this vertical slice — enough to prove the aim+rune loop
// is fun before investing in more content.
export const WAVES: WaveDef[] = [
  {
    id: 0, name: 'Floresta Amaldiçoada', duration: 70,
    pool: ['husk', 'wisp', 'brute'],
    bossName: 'O Devorador de Luz', bossHp: 420, bossDamage: 16,
    intro: 'Algo corrompeu a floresta além dos muros da torre.',
  },
];
