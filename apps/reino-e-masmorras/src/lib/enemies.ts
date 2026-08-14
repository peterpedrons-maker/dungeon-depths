import { DungeonDef, EnemyInstance, EnemyShape, EnemyTier } from '../types/game';

// Every enemy shape in the game — regular mobs AND dungeon bosses — lives in
// one flat table now. A dungeon's regular encounters are picked uniformly at
// random from whichever of its enemyPool shapes are already unlocked at the
// current depth (minDepth), instead of always resolving to the single
// highest-unlocked tier — that older rule meant a dungeon only ever showed
// ONE shape at a time until crossing the next threshold, never a mix.
// matk/mdef scale roughly with each shape's physical atk/def; only shapes
// tagged atkType: 'magical' actually roll their attacks as spells — everyone
// else's mdef just sits there ready for the day the player's own spells hit
// them. isBoss shapes are never picked by the regular roll — they only ever
// spawn via spawnBoss() at their dungeon's own bossDepth.
const TIERS: EnemyTier[] = [
  // ── Genéricos (ainda usados pelas dungeons da Região 2+ sem roster próprio) ──
  { shape: 'goblin',   name: 'Goblin',              color: '#5a8a3c', minDepth: 1,  hp: 12, atk: 4,  def: 1,  xp: 6,  gold: 4,  matk: 2,  mdef: 1,
    proc: { chance: 0.20, label: 'Sua lâmina suja envenena você!', status: 'poison', rounds: 3 } },
  { shape: 'wolf',     name: 'Lobo Selvagem',        color: '#6b6b78', minDepth: 3,  hp: 17, atk: 6,  def: 1,  xp: 9,  gold: 6, evasion: 0.12, matk: 2, mdef: 1,
    proc: { chance: 0.22, label: 'A mordida abre um corte sangrento!', status: 'bleed', rounds: 3 } },
  { shape: 'skeleton', name: 'Esqueleto',            color: '#d8d2b8', minDepth: 1,  hp: 23, atk: 7,  def: 3,  xp: 13, gold: 9,  matk: 3,  mdef: 2,
    proc: { chance: 0.20, label: 'Uma maldição óssea o torna mais vulnerável!', statMod: 'dmgTakenPct', statModPct: 0.15, rounds: 3 } },
  { shape: 'orc',      name: 'Orc Guerreiro',        color: '#4f7a3a', minDepth: 8,  hp: 36, atk: 10, def: 5,  xp: 19, gold: 14, matk: 4,  mdef: 3,
    proc: { chance: 0.16, label: 'O golpe brutal o atordoa!', cc: 'stun', rounds: 1 } },
  { shape: 'troll',    name: 'Troll das Cavernas',   color: '#7a5230', minDepth: 12, hp: 58, atk: 14, def: 7,  xp: 28, gold: 22, matk: 5,  mdef: 4,
    proc: { chance: 0.20, label: 'O golpe esmagador quebra sua guarda!', statMod: 'def', statModPct: -0.20, rounds: 3 } },
  { shape: 'horror',   name: 'Aberração das Sombras', color: '#3a2a52', minDepth: 16, hp: 74, atk: 17, def: 6,  xp: 38, gold: 30, evasion: 0.15, matk: 17, mdef: 9, atkType: 'magical',
    proc: { chance: 0.18, label: 'Um horror indescritível o faz adormecer!', cc: 'sleep', rounds: 1 } },
  { shape: 'dragon',   name: 'Dragão Jovem',         color: '#a5271f', minDepth: 20, hp: 105, atk: 21, def: 10, xp: 55, gold: 45, matk: 21, mdef: 12, atkType: 'magical',
    proc: { chance: 0.22, label: 'O sopro de fogo o incendeia!', status: 'burn', rounds: 3 } },

  // ── Região 1 — Ruínas Superficiais (skeleton acima também faz parte do pool) ──
  { shape: 'ruinBat', name: 'Morcego das Ruínas', color: '#5a4a68', minDepth: 1, hp: 14, atk: 5, def: 1, xp: 7, gold: 5, evasion: 0.15,
    proc: { chance: 0.22, label: 'As garras afiadas do morcego rasgam sua pele!', status: 'bleed', rounds: 3 } },
  { shape: 'acidSlime', name: 'Limo Ácido', color: '#7a9a3c', minDepth: 1, hp: 16, atk: 4, def: 1, xp: 7, gold: 5,
    proc: { chance: 0.20, label: 'O ácido corrói sua armadura!', statMod: 'def', statModPct: -0.15, rounds: 3 } },
  { shape: 'ruinBandit', name: 'Saqueador Andarilho', color: '#8a6a4a', minDepth: 1, hp: 15, atk: 6, def: 2, xp: 8, gold: 6,
    proc: { chance: 0.18, label: 'Ele joga terra em seus olhos, cegando sua mira!', statMod: 'accuracy', statModPct: -0.15, rounds: 3 } },
  { shape: 'carrionCrow', name: 'Corvo Necrófago', color: '#2a2a2a', minDepth: 1, hp: 12, atk: 5, def: 1, xp: 6, gold: 4, evasion: 0.18,
    proc: { chance: 0.20, label: 'As garras infectadas do corvo o envenenam!', status: 'poison', rounds: 3 } },
  { shape: 'boneKing', name: 'Rei Ossos', color: '#e8e2c8', minDepth: 1, hp: 140, atk: 16, def: 8, xp: 70, gold: 55, matk: 5, mdef: 4, isBoss: true,
    proc: { chance: 0.28, label: 'O Rei Ossos ergue sua lâmina e o atordoa com um golpe brutal!', cc: 'stun', rounds: 1 } },

  // ── Região 1 — Caverna dos Goblins (goblin acima também faz parte do pool) ──
  { shape: 'goblinShaman', name: 'Goblin Xamã', color: '#3c6a5a', minDepth: 1, hp: 16, atk: 5, def: 1, xp: 8, gold: 6, matk: 8, mdef: 3, atkType: 'magical',
    proc: { chance: 0.20, label: 'A maldição do xamã o torna mais vulnerável!', statMod: 'dmgTakenPct', statModPct: 0.15, rounds: 3 } },
  { shape: 'goblinThrower', name: 'Goblin Arremessador', color: '#6a7a3c', minDepth: 1, hp: 14, atk: 7, def: 1, xp: 8, gold: 6,
    proc: { chance: 0.22, label: 'A faca arremessada corta fundo!', status: 'bleed', rounds: 3 } },
  { shape: 'goblinFanatic', name: 'Goblin Fanático', color: '#8a3c3c', minDepth: 1, hp: 18, atk: 8, def: 0, xp: 9, gold: 6,
    proc: { chance: 0.18, label: 'O ataque descontrolado quebra sua guarda!', statMod: 'def', statModPct: -0.20, rounds: 3 } },
  { shape: 'goblinWolfRider', name: 'Lobo Cavalgado por Goblin', color: '#5a6a4a', minDepth: 1, hp: 20, atk: 7, def: 2, xp: 10, gold: 7, evasion: 0.10,
    proc: { chance: 0.18, label: 'A investida montada o derruba, atordoado!', cc: 'stun', rounds: 1 } },
  { shape: 'grash', name: 'Grash, o Implacável', color: '#3c5a2c', minDepth: 1, hp: 160, atk: 18, def: 6, xp: 80, gold: 65, isBoss: true,
    proc: { chance: 0.28, label: 'Grash golpeia o chão com fúria, atordoando você!', cc: 'stun', rounds: 1 } },

  // ── Região 1 — Cripta do Tesouro ──
  { shape: 'zombieLooter', name: 'Zumbi Saqueador', color: '#5a6a4a', minDepth: 1, hp: 20, atk: 6, def: 2, xp: 10, gold: 14,
    proc: { chance: 0.20, label: 'O zumbi agarra e rasga sua armadura!', statMod: 'def', statModPct: -0.15, rounds: 3 } },
  { shape: 'stoneGuardian', name: 'Guardião de Pedra', color: '#6a6a6a', minDepth: 1, hp: 30, atk: 5, def: 6, xp: 10, gold: 14,
    proc: { chance: 0.14, label: 'O golpe de pedra o atordoa!', cc: 'stun', rounds: 1 } },
  { shape: 'greedyWraith', name: 'Espectro Ganancioso', color: '#4a3a5a', minDepth: 1, hp: 18, atk: 7, def: 2, xp: 10, gold: 14, evasion: 0.15,
    proc: { chance: 0.20, label: 'O espectro drena parte de sua força!', statMod: 'dmgTakenPct', statModPct: 0.15, rounds: 3 } },
  { shape: 'wrappedMummy', name: 'Múmia Enfaixada', color: '#c8b888', minDepth: 1, hp: 22, atk: 6, def: 3, xp: 10, gold: 14,
    proc: { chance: 0.20, label: 'As bandagens podres o envenenam!', status: 'poison', rounds: 3 } },
  { shape: 'mimicChest', name: 'Arca Mímica', color: '#a5772e', minDepth: 1, hp: 16, atk: 9, def: 1, xp: 11, gold: 16,
    proc: { chance: 0.22, label: 'A arca morde com força surpreendente!', status: 'bleed', rounds: 3 } },
  { shape: 'cursedCustodian', name: 'Custódio Amaldiçoado', color: '#8a7a3c', minDepth: 1, hp: 150, atk: 17, def: 9, xp: 75, gold: 100, isBoss: true,
    proc: { chance: 0.26, label: 'O Custódio amaldiçoa você, tornando-o mais vulnerável!', statMod: 'dmgTakenPct', statModPct: 0.20, rounds: 3 } },

  // ── Região 1 — Pântano Podre ──
  { shape: 'poisonToad', name: 'Sapo Venenoso', color: '#4f7a3a', minDepth: 1, hp: 22, atk: 7, def: 2, xp: 12, gold: 9,
    proc: { chance: 0.24, label: 'A língua venenosa do sapo o envenena!', status: 'poison', rounds: 3 } },
  { shape: 'swampViper', name: 'Víbora do Pântano', color: '#5a7a3c', minDepth: 1, hp: 18, atk: 8, def: 1, xp: 11, gold: 8, evasion: 0.20,
    proc: { chance: 0.22, label: 'A picada da víbora injeta veneno!', status: 'poison', rounds: 3 } },
  { shape: 'crawlingBog', name: 'Lodo Rastejante', color: '#4a5a3a', minDepth: 1, hp: 26, atk: 6, def: 3, xp: 12, gold: 9,
    proc: { chance: 0.18, label: 'O lodo prende seus pés, atrapalhando seus golpes!', statMod: 'accuracy', statModPct: -0.15, rounds: 3 } },
  { shape: 'cursedWisp', name: 'Vagalume Amaldiçoado', color: '#6a9a7a', minDepth: 1, hp: 16, atk: 8, def: 1, xp: 12, gold: 9, evasion: 0.20, matk: 9, mdef: 3, atkType: 'magical',
    proc: { chance: 0.18, label: 'A luz amaldiçoada silencia você!', cc: 'silence', rounds: 2 } },
  { shape: 'rottingGator', name: 'Jacaré Podre', color: '#3c5a3c', minDepth: 1, hp: 30, atk: 9, def: 3, xp: 13, gold: 10,
    proc: { chance: 0.22, label: 'A mordida do jacaré rasga fundo!', status: 'bleed', rounds: 3 } },
  { shape: 'mudMother', name: 'Mãe-Lodo', color: '#3a4a2a', minDepth: 1, hp: 190, atk: 19, def: 8, xp: 95, gold: 75, isBoss: true,
    proc: { chance: 0.26, label: 'Mãe-Lodo esmaga sua guarda com um golpe de lama pesada!', statMod: 'def', statModPct: -0.20, rounds: 3 } },

  // ── Região 1 — Covil de Aranhas ──
  { shape: 'huntingSpider', name: 'Aranha Caçadora', color: '#3a2a2a', minDepth: 1, hp: 28, atk: 10, def: 3, xp: 16, gold: 12, evasion: 0.15,
    proc: { chance: 0.22, label: 'As presas afiadas rasgam sua pele!', status: 'bleed', rounds: 3 } },
  { shape: 'venomSpider', name: 'Aranha Venenosa', color: '#4a2a4a', minDepth: 1, hp: 24, atk: 9, def: 2, xp: 15, gold: 11,
    proc: { chance: 0.26, label: 'O veneno potente da aranha corre em suas veias!', status: 'poison', rounds: 3 } },
  { shape: 'giantSpider', name: 'Aranha Gigante', color: '#2a1a1a', minDepth: 1, hp: 42, atk: 10, def: 5, xp: 18, gold: 13,
    proc: { chance: 0.18, label: 'As patas pesadas esmagam sua guarda!', statMod: 'def', statModPct: -0.15, rounds: 3 } },
  { shape: 'spiderlingSwarm', name: 'Enxame de Aracnídeos', color: '#5a3a2a', minDepth: 1, hp: 18, atk: 7, def: 1, xp: 13, gold: 9, evasion: 0.25,
    proc: { chance: 0.20, label: 'O enxame de aracnídeos atrapalha sua visão!', statMod: 'accuracy', statModPct: -0.15, rounds: 3 } },
  { shape: 'darkWeaver', name: 'Tecelã Sombria', color: '#1a1a2a', minDepth: 1, hp: 34, atk: 11, def: 4, xp: 19, gold: 14,
    proc: { chance: 0.20, label: 'A teia pegajosa o prende, atordoado!', cc: 'stun', rounds: 1 } },
  { shape: 'blackMatriarch', name: 'Matriarca Negra', color: '#0f0f18', minDepth: 1, hp: 220, atk: 22, def: 9, xp: 110, gold: 90, isBoss: true,
    proc: { chance: 0.26, label: 'A picada da Matriarca injeta um veneno paralisante!', status: 'poison', rounds: 4 } },

  // ── Bosses da Região 2+ — sem roster próprio ainda, reaproveitam o sprite
  // do shape mais forte do pool da masmorra até ganharem arte dedicada.
  { shape: 'horrorAncient', name: 'Aberração Ancestral', color: '#3a2a52', minDepth: 1, hp: 180, atk: 20, def: 8, xp: 90, gold: 70, evasion: 0.18, matk: 20, mdef: 11, atkType: 'magical', isBoss: true,
    proc: { chance: 0.26, label: 'Uma aberração ancestral o faz adormecer em terror!', cc: 'sleep', rounds: 1 } },
  { shape: 'orcWarlord', name: 'Senhor da Guerra Orc', color: '#4f7a3a', minDepth: 1, hp: 170, atk: 19, def: 9, xp: 85, gold: 65, matk: 5, mdef: 4, isBoss: true,
    proc: { chance: 0.26, label: 'O golpe do senhor da guerra orc o atordoa!', cc: 'stun', rounds: 1 } },
  { shape: 'trollChieftain', name: 'Cacique Troll', color: '#7a5230', minDepth: 1, hp: 210, atk: 20, def: 10, xp: 100, gold: 75, matk: 6, mdef: 5, isBoss: true,
    proc: { chance: 0.24, label: 'O cacique troll esmaga sua guarda!', statMod: 'def', statModPct: -0.20, rounds: 3 } },
  { shape: 'dragonElder', name: 'Dragão Ancião', color: '#a5271f', minDepth: 1, hp: 260, atk: 24, def: 12, xp: 130, gold: 100, matk: 26, mdef: 14, atkType: 'magical', isBoss: true,
    proc: { chance: 0.26, label: 'O sopro ancestral do dragão o incendeia!', status: 'burn', rounds: 3 } },
  { shape: 'skeletonLord', name: 'Lorde Esqueleto', color: '#d8d2b8', minDepth: 1, hp: 150, atk: 17, def: 7, xp: 75, gold: 60, matk: 6, mdef: 4, isBoss: true,
    proc: { chance: 0.24, label: 'A maldição do Lorde Esqueleto o torna vulnerável!', statMod: 'dmgTakenPct', statModPct: 0.20, rounds: 3 } },
];

const TIERS_BY_SHAPE: Partial<Record<EnemyShape, EnemyTier>> = {};
for (const t of TIERS) TIERS_BY_SHAPE[t.shape] = t;

function instanceFromTier(tier: EnemyTier, depth: number): EnemyInstance {
  const growth = 1 + depth * 0.055;
  const hp = Math.round(tier.hp * growth);
  return {
    name: tier.name,
    shape: tier.shape,
    color: tier.color,
    hp, maxHp: hp,
    atk: Math.round(tier.atk * growth),
    def: Math.round(tier.def * (1 + depth * 0.03)),
    xpReward: Math.round(tier.xp * (1 + depth * 0.08)),
    goldReward: Math.round(tier.gold * (1 + depth * 0.08)),
    proc: tier.proc,
    evasion: tier.evasion,
    matk: tier.matk !== undefined ? Math.round(tier.matk * growth) : undefined,
    mdef: tier.mdef !== undefined ? Math.round(tier.mdef * (1 + depth * 0.03)) : undefined,
    atkType: tier.atkType,
    isBoss: tier.isBoss,
  };
}

// Picks uniformly at random among every allowed shape already unlocked at
// this depth — replaces the old "always the single highest-unlocked tier"
// rule, which made a dungeon show only one shape at a time between
// thresholds instead of a genuine mix.
function randomRegularTier(depth: number, allowed?: EnemyShape[]): EnemyTier {
  const pool = (allowed ? TIERS.filter((t) => allowed.includes(t.shape)) : TIERS).filter((t) => !t.isBoss && depth >= t.minDepth);
  if (pool.length === 0) return TIERS[0];
  return pool[Math.floor(Math.random() * pool.length)];
}

// Spawns the dungeon's boss at its fixed bossDepth, or a regular enemy drawn
// at random from the dungeon's own pool otherwise.
export function spawnEnemy(depth: number, dungeon: DungeonDef): EnemyInstance {
  if (depth >= dungeon.bossDepth) {
    const bossTier = TIERS_BY_SHAPE[dungeon.boss];
    if (bossTier) return instanceFromTier(bossTier, dungeon.bossDepth);
  }
  const tier = randomRegularTier(depth, dungeon.enemyPool);
  return instanceFromTier(tier, depth);
}
