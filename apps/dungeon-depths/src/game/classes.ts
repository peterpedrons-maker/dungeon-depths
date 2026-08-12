import { ClassId, PlayerStats, WeaponKind, WORLD } from './types';

export interface ClassDef {
  id: ClassId;
  name: string;
  emoji: string;
  tagline: string;
  weaponName: string;
  weapon: WeaponKind;
  accent: string;        // UI accent (hex)
  stats: PlayerStats;
}

export const CLASSES: ClassDef[] = [
  {
    id: 'knight',
    name: 'Cavaleiro',
    emoji: '⚔️',
    tagline: 'Resistente. Golpeia em arco tudo ao redor.',
    weaponName: 'Espada Giratória',
    weapon: 'melee',
    accent: '#60a5fa',
    stats: {
      maxHp: 140, moveSpeed: 94, damage: 14, attackCd: 0.46,
      boltSpeed: 0, boltCount: 1, pierce: 0, knockback: 260,
      pickupRadius: 78, critChance: 0.05, range: 68,
    },
  },
  {
    id: 'mage',
    name: 'Maga',
    emoji: '🔮',
    tagline: 'Frágil, mas cada bola de fogo dói muito.',
    weaponName: 'Bola de Fogo',
    weapon: 'fireball',
    accent: '#f472b6',
    stats: {
      maxHp: 85, moveSpeed: 92, damage: 22, attackCd: 0.78,
      boltSpeed: 260, boltCount: 1, pierce: 1, knockback: 150,
      pickupRadius: 92, critChance: 0.05, range: 60,
    },
  },
  {
    id: 'hunter',
    name: 'Caçadora',
    emoji: '🏹',
    tagline: 'Rápida e certeira. Flechas perfuram fileiras.',
    weaponName: 'Flecha Perfurante',
    weapon: 'arrow',
    accent: '#4ade80',
    stats: {
      maxHp: 100, moveSpeed: 116, damage: 9, attackCd: 0.34,
      boltSpeed: 430, boltCount: 1, pierce: 2, knockback: 110,
      pickupRadius: 84, critChance: 0.22, range: 60,
    },
  },
  {
    id: 'necro',
    name: 'Necromante',
    emoji: '💀',
    tagline: 'Crânios giram ao seu redor e ferem sozinhos.',
    weaponName: 'Crânios Orbitais',
    weapon: 'orbit',
    accent: '#a78bfa',
    stats: {
      maxHp: 110, moveSpeed: 98, damage: 13, attackCd: 0.5,
      boltSpeed: 0, boltCount: 2, pierce: 0, knockback: 130,
      pickupRadius: 100, critChance: 0.08, range: 60,
    },
  },
];

export function getClass(id: ClassId): ClassDef {
  return CLASSES.find(c => c.id === id) ?? CLASSES[0];
}

// Class stats above are authored in screen-space units (how they should look
// and feel). Convert the distance/speed ones into world units for the engine.
export function worldStats(id: ClassId): PlayerStats {
  const s = getClass(id).stats;
  return {
    ...s,
    moveSpeed: s.moveSpeed * WORLD,
    boltSpeed: s.boltSpeed * WORLD,
    knockback: s.knockback * WORLD,
    pickupRadius: s.pickupRadius * WORLD,
    range: s.range * WORLD,
  };
}
