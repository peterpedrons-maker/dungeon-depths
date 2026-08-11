import { Upgrade } from './types';

export const ALL_UPGRADES: Upgrade[] = [
  { id: 'dmg',    icon: '⚔️', title: 'Sharpen Blade', desc: '+30% damage',           apply: s => { s.damage *= 1.3; } },
  { id: 'aspd',   icon: '⚡', title: 'Swift Casting',  desc: '+20% attack speed',     apply: s => { s.attackCd *= 0.83; } },
  { id: 'count',  icon: '🎯', title: 'Extra Bolt',     desc: '+1 projectile',         apply: s => { s.boltCount += 1; } },
  { id: 'pierce', icon: '🏹', title: 'Piercing Shot',  desc: 'Bolts pierce +1 enemy', apply: s => { s.pierce += 1; } },
  { id: 'speed',  icon: '👟', title: 'Fleet Feet',     desc: '+15% move speed',       apply: s => { s.moveSpeed *= 1.15; } },
  { id: 'hp',     icon: '❤️', title: 'Vitality',       desc: '+25 max HP & heal',     apply: s => { s.maxHp += 25; } },
  { id: 'pickup', icon: '🧲', title: 'Magnet',         desc: '+40% pickup range',     apply: s => { s.pickupRadius *= 1.4; } },
  { id: 'knock',  icon: '💥', title: 'Heavy Impact',   desc: '+50% knockback',        apply: s => { s.knockback *= 1.5; } },
  { id: 'crit',   icon: '✨', title: 'Keen Eye',       desc: '+10% crit chance',      apply: s => { s.critChance += 0.1; } },
  { id: 'boltspd',icon: '🌀', title: 'Velocity',       desc: '+30% bolt speed',       apply: s => { s.boltSpeed *= 1.3; } },
];

export function rollUpgrades(count = 3): Upgrade[] {
  const pool = [...ALL_UPGRADES];
  const result: Upgrade[] = [];
  for (let i = 0; i < count && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return result;
}
