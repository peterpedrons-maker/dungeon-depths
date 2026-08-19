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
// Exported for the Bestiário screen (components/Bestiario.tsx), which needs
// every shape's name/color/isBoss to render its grid — nothing else reads
// this from outside the module.
export const TIERS: EnemyTier[] = [
  // ── Genéricos (ainda usados pelas dungeons da Região 2+ sem roster próprio) ──
  { shape: 'goblin',   name: 'Goblin',              color: '#5a8a3c', minDepth: 1,  hp: 12, atk: 4,  def: 1,  xp: 6,  gold: 4,  matk: 2,  mdef: 1,
    proc: { chance: 0.20, label: 'Sua lâmina suja envenena você!', status: 'poison', rounds: 3 },
    abilities: [{ id: 'goblin:steal', name: 'Punhal Furtivo', cooldown: 4, useChance: 0.4, effect: { kind: 'stealGold', goldPct: 0.05 } }] },
  { shape: 'wolf',     name: 'Lobo Selvagem',        color: '#6b6b78', minDepth: 3,  hp: 17, atk: 6,  def: 1,  xp: 9,  gold: 6, evasion: 0.12, matk: 2, mdef: 1,
    proc: { chance: 0.22, label: 'A mordida abre um corte sangrento!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'wolf:lunge', name: 'Investida Feroz', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.7 } }] },
  { shape: 'skeleton', name: 'Esqueleto',            color: '#d8d2b8', minDepth: 1,  hp: 23, atk: 7,  def: 3,  xp: 13, gold: 9,  matk: 3,  mdef: 2,
    proc: { chance: 0.20, label: 'Uma maldição óssea o torna mais vulnerável!', statMod: 'dmgTakenPct', statModPct: 0.15, rounds: 3 },
    abilities: [{ id: 'skeleton:curse', name: 'Maldição Óssea Maior', cooldown: 4, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.7, statMod: 'dmgTakenPct', statModPct: 0.25, statModRounds: 3 } }] },
  { shape: 'orc',      name: 'Orc Guerreiro',        color: '#4f7a3a', minDepth: 8,  hp: 36, atk: 10, def: 5,  xp: 19, gold: 14, matk: 4,  mdef: 3,
    proc: { chance: 0.16, label: 'O golpe brutal o atordoa!', cc: 'stun', rounds: 1 },
    abilities: [{ id: 'orc:smash', name: 'Golpe Esmagador', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
  { shape: 'troll',    name: 'Troll das Cavernas',   color: '#7a5230', minDepth: 12, hp: 58, atk: 14, def: 7,  xp: 28, gold: 22, matk: 5,  mdef: 4,
    proc: { chance: 0.20, label: 'O golpe esmagador quebra sua guarda!', statMod: 'def', statModPct: -0.20, rounds: 3 },
    abilities: [{ id: 'troll:pound', name: 'Pancada Brutal', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.8 } }] },
  { shape: 'horror',   name: 'Aberração das Sombras', color: '#3a2a52', minDepth: 16, hp: 74, atk: 17, def: 6,  xp: 38, gold: 30, evasion: 0.15, matk: 17, mdef: 9, atkType: 'magical',
    proc: { chance: 0.18, label: 'Um horror indescritível o faz adormecer!', cc: 'sleep', rounds: 1 },
    abilities: [{ id: 'horror:whisper', name: 'Sussurro Insano', cooldown: 6, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.6, cc: 'sleep', ccRounds: 1 } }] },
  { shape: 'dragon',   name: 'Dragão Jovem',         color: '#a5271f', minDepth: 20, hp: 105, atk: 21, def: 10, xp: 55, gold: 45, matk: 21, mdef: 12, atkType: 'magical',
    proc: { chance: 0.22, label: 'O sopro de fogo o incendeia!', status: 'burn', rounds: 3 },
    abilities: [{ id: 'dragon:breath', name: 'Baforada de Fogo', cooldown: 5, useChance: 0.45, effect: { kind: 'statusBite', dmgMult: 1.3, status: 'burn', statusRounds: 3 } }] },

  // ── Região 1 — Ruínas Superficiais (skeleton acima também faz parte do pool) ──
  { shape: 'ruinBat', name: 'Morcego das Ruínas', color: '#5a4a68', minDepth: 1, hp: 14, atk: 5, def: 1, xp: 7, gold: 5, evasion: 0.15,
    proc: { chance: 0.22, label: 'As garras afiadas do morcego rasgam sua pele!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'ruinBat:bite', name: 'Mordida Vampírica', cooldown: 4, useChance: 0.5, effect: { kind: 'lifestealHit', dmgMult: 1.0, lifestealPct: 0.5 } }] },
  { shape: 'acidSlime', name: 'Limo Ácido', color: '#7a9a3c', minDepth: 1, hp: 16, atk: 4, def: 1, xp: 7, gold: 5,
    proc: { chance: 0.20, label: 'O ácido corrói sua armadura!', statMod: 'def', statModPct: -0.15, rounds: 3 },
    abilities: [{ id: 'acidSlime:splash', name: 'Respingo Ácido', cooldown: 4, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.7, statMod: 'def', statModPct: -0.25, statModRounds: 3 } }] },
  { shape: 'ruinBandit', name: 'Saqueador Andarilho', color: '#8a6a4a', minDepth: 1, hp: 15, atk: 6, def: 2, xp: 8, gold: 6,
    proc: { chance: 0.18, label: 'Ele joga terra em seus olhos, cegando sua mira!', statMod: 'accuracy', statModPct: -0.15, rounds: 3 },
    abilities: [{ id: 'ruinBandit:steal', name: 'Mão Leve', cooldown: 4, useChance: 0.45, effect: { kind: 'stealGold', goldPct: 0.05 } }] },
  { shape: 'carrionCrow', name: 'Corvo Necrófago', color: '#2a2a2a', minDepth: 1, hp: 12, atk: 5, def: 1, xp: 6, gold: 4, evasion: 0.18,
    proc: { chance: 0.20, label: 'As garras infectadas do corvo o envenenam!', status: 'poison', rounds: 3 },
    abilities: [{ id: 'carrionCrow:peck', name: 'Bicada Infecciosa', cooldown: 4, useChance: 0.45, effect: { kind: 'statusBite', dmgMult: 1.0, status: 'poison', statusRounds: 3 } }] },
  { shape: 'boneKing', name: 'Rei Ossos', color: '#e8e2c8', minDepth: 1, hp: 140, atk: 16, def: 8, xp: 70, gold: 55, matk: 5, mdef: 4, isBoss: true,
    proc: { chance: 0.28, label: 'O Rei Ossos ergue sua lâmina e o atordoa com um golpe brutal!', cc: 'stun', rounds: 1 },
    phases: [
      { hpPct: 0.66, name: 'Ira Óssea', transitionMsg: 'Os ossos do Rei Ossos rangem de fúria — ele ataca com mais força!', atkMult: 1.15,
        extraAbilities: [{ id: 'boneKing:p2', name: 'Lança Óssea', cooldown: 4, useChance: 0.45, effect: { kind: 'bigHit', dmgMult: 1.8 } }] },
      { hpPct: 0.33, name: 'Fúria Ancestral', transitionMsg: 'Com a vida se esvaindo, o Rei Ossos convoca a fúria dos caídos!', atkMult: 1.3, cc: 'stun', ccRounds: 1,
        extraAbilities: [{ id: 'boneKing:p3', name: 'Grito dos Mortos', cooldown: 5, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.7, statMod: 'dmgTakenPct', statModPct: 0.3, statModRounds: 3 } }] },
    ] },

  // ── Região 1 — Caverna dos Goblins (goblin acima também faz parte do pool) ──
  { shape: 'goblinShaman', name: 'Goblin Xamã', color: '#3c6a5a', minDepth: 1, hp: 16, atk: 5, def: 1, xp: 8, gold: 6, matk: 8, mdef: 3, atkType: 'magical',
    proc: { chance: 0.20, label: 'A maldição do xamã o torna mais vulnerável!', statMod: 'dmgTakenPct', statModPct: 0.15, rounds: 3 },
    abilities: [{ id: 'goblinShaman:curse', name: 'Maldição Xamânica', cooldown: 4, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.7, statMod: 'dmgTakenPct', statModPct: 0.25, statModRounds: 3 } }] },
  { shape: 'goblinThrower', name: 'Goblin Arremessador', color: '#6a7a3c', minDepth: 1, hp: 14, atk: 7, def: 1, xp: 8, gold: 6,
    proc: { chance: 0.22, label: 'A faca arremessada corta fundo!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'goblinThrower:knife', name: 'Faca Certeira', cooldown: 4, useChance: 0.45, effect: { kind: 'statusBite', dmgMult: 1.0, status: 'bleed', statusRounds: 3 } }] },
  { shape: 'goblinFanatic', name: 'Goblin Fanático', color: '#8a3c3c', minDepth: 1, hp: 18, atk: 8, def: 0, xp: 9, gold: 6,
    proc: { chance: 0.18, label: 'O ataque descontrolado quebra sua guarda!', statMod: 'def', statModPct: -0.20, rounds: 3 },
    abilities: [{ id: 'goblinFanatic:fury', name: 'Fúria Selvagem', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.6 } }] },
  { shape: 'goblinWolfRider', name: 'Lobo Cavalgado por Goblin', color: '#5a6a4a', minDepth: 1, hp: 20, atk: 7, def: 2, xp: 10, gold: 7, evasion: 0.10,
    proc: { chance: 0.18, label: 'A investida montada o derruba, atordoado!', cc: 'stun', rounds: 1 },
    abilities: [{ id: 'goblinWolfRider:charge', name: 'Investida Montada', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
  { shape: 'grash', name: 'Grash, o Implacável', color: '#3c5a2c', minDepth: 1, hp: 160, atk: 18, def: 6, xp: 80, gold: 65, isBoss: true,
    proc: { chance: 0.28, label: 'Grash golpeia o chão com fúria, atordoando você!', cc: 'stun', rounds: 1 },
    phases: [
      { hpPct: 0.66, name: 'Grash Enraivecido', transitionMsg: 'Grash esmurra o próprio peito e ruge, enlouquecido!', atkMult: 1.15,
        extraAbilities: [{ id: 'grash:p2', name: 'Pisão Selvagem', cooldown: 4, useChance: 0.45, effect: { kind: 'bigHit', dmgMult: 1.8 } }] },
      { hpPct: 0.33, name: 'Grash Implacável', transitionMsg: 'Ferido, Grash entra em fúria cega!', atkMult: 1.3, cc: 'stun', ccRounds: 1,
        extraAbilities: [{ id: 'grash:p3', name: 'Investida Final', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
    ] },

  // ── Região 1 — Cripta do Tesouro ──
  { shape: 'zombieLooter', name: 'Zumbi Saqueador', color: '#5a6a4a', minDepth: 1, hp: 20, atk: 6, def: 2, xp: 10, gold: 14,
    proc: { chance: 0.20, label: 'O zumbi agarra e rasga sua armadura!', statMod: 'def', statModPct: -0.15, rounds: 3 },
    abilities: [{ id: 'zombieLooter:grab', name: 'Mãos Ávidas', cooldown: 4, useChance: 0.45, effect: { kind: 'stealGold', goldPct: 0.05 } }] },
  { shape: 'stoneGuardian', name: 'Guardião de Pedra', color: '#6a6a6a', minDepth: 1, hp: 30, atk: 5, def: 6, xp: 10, gold: 14,
    proc: { chance: 0.14, label: 'O golpe de pedra o atordoa!', cc: 'stun', rounds: 1 },
    abilities: [{ id: 'stoneGuardian:fist', name: 'Punho de Pedra', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
  { shape: 'greedyWraith', name: 'Espectro Ganancioso', color: '#4a3a5a', minDepth: 1, hp: 18, atk: 7, def: 2, xp: 10, gold: 14, evasion: 0.15,
    proc: { chance: 0.20, label: 'O espectro drena parte de sua força!', statMod: 'dmgTakenPct', statModPct: 0.15, rounds: 3 },
    abilities: [{ id: 'greedyWraith:drain', name: 'Dreno Espectral', cooldown: 4, useChance: 0.45, effect: { kind: 'lifestealHit', dmgMult: 1.0, lifestealPct: 0.45 } }] },
  { shape: 'wrappedMummy', name: 'Múmia Enfaixada', color: '#c8b888', minDepth: 1, hp: 22, atk: 6, def: 3, xp: 10, gold: 14,
    proc: { chance: 0.20, label: 'As bandagens podres o envenenam!', status: 'poison', rounds: 3 },
    abilities: [{ id: 'wrappedMummy:touch', name: 'Toque Podre', cooldown: 4, useChance: 0.45, effect: { kind: 'statusBite', dmgMult: 1.0, status: 'poison', statusRounds: 3 } }] },
  { shape: 'mimicChest', name: 'Arca Mímica', color: '#a5772e', minDepth: 1, hp: 16, atk: 9, def: 1, xp: 11, gold: 16,
    proc: { chance: 0.22, label: 'A arca morde com força surpreendente!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'mimicChest:bite', name: 'Mordida da Arca', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.8 } }] },
  { shape: 'cursedCustodian', name: 'Custódio Amaldiçoado', color: '#8a7a3c', minDepth: 1, hp: 150, atk: 17, def: 9, xp: 75, gold: 100, isBoss: true,
    proc: { chance: 0.26, label: 'O Custódio amaldiçoa você, tornando-o mais vulnerável!', statMod: 'dmgTakenPct', statModPct: 0.20, rounds: 3 },
    phases: [
      { hpPct: 0.66, name: 'Custódio Desperto', transitionMsg: 'O Custódio se ergue por completo, runas brilhando em fúria!', atkMult: 1.15,
        extraAbilities: [{ id: 'cursedCustodian:p2', name: 'Toque da Cripta', cooldown: 4, useChance: 0.45, effect: { kind: 'statusBite', dmgMult: 1.0, status: 'poison', statusRounds: 3 } }] },
      { hpPct: 0.33, name: 'Ira da Cripta', transitionMsg: 'A maldição do Custódio se intensifica, sufocando seus movimentos!', atkMult: 1.3, cc: 'silence', ccRounds: 2,
        extraAbilities: [{ id: 'cursedCustodian:p3', name: 'Maldição Final', cooldown: 5, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.7, statMod: 'dmgTakenPct', statModPct: 0.3, statModRounds: 3 } }] },
    ] },

  // ── Região 1 — Pântano Podre ──
  { shape: 'poisonToad', name: 'Sapo Venenoso', color: '#4f7a3a', minDepth: 1, hp: 22, atk: 7, def: 2, xp: 12, gold: 9,
    proc: { chance: 0.24, label: 'A língua venenosa do sapo o envenena!', status: 'poison', rounds: 3 },
    abilities: [{ id: 'poisonToad:tongue', name: 'Língua Venenosa', cooldown: 4, useChance: 0.45, effect: { kind: 'statusBite', dmgMult: 1.0, status: 'poison', statusRounds: 3 } }] },
  { shape: 'swampViper', name: 'Víbora do Pântano', color: '#5a7a3c', minDepth: 1, hp: 18, atk: 8, def: 1, xp: 11, gold: 8, evasion: 0.20,
    proc: { chance: 0.22, label: 'A picada da víbora injeta veneno!', status: 'poison', rounds: 3 },
    abilities: [{ id: 'swampViper:strike', name: 'Bote Certeiro', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.7 } }] },
  { shape: 'crawlingBog', name: 'Lodo Rastejante', color: '#4a5a3a', minDepth: 1, hp: 26, atk: 6, def: 3, xp: 12, gold: 9,
    proc: { chance: 0.18, label: 'O lodo prende seus pés, atrapalhando seus golpes!', statMod: 'accuracy', statModPct: -0.15, rounds: 3 },
    abilities: [{ id: 'crawlingBog:mud', name: 'Lodo Pegajoso', cooldown: 4, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.7, statMod: 'accuracy', statModPct: -0.2, statModRounds: 3 } }] },
  { shape: 'cursedWisp', name: 'Vagalume Amaldiçoado', color: '#6a9a7a', minDepth: 1, hp: 16, atk: 8, def: 1, xp: 12, gold: 9, evasion: 0.20, matk: 9, mdef: 3, atkType: 'magical',
    proc: { chance: 0.18, label: 'A luz amaldiçoada silencia você!', cc: 'silence', rounds: 2 },
    abilities: [{ id: 'cursedWisp:light', name: 'Luz Amaldiçoada', cooldown: 6, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.6, cc: 'silence', ccRounds: 2 } }] },
  { shape: 'rottingGator', name: 'Jacaré Podre', color: '#3c5a3c', minDepth: 1, hp: 30, atk: 9, def: 3, xp: 13, gold: 10,
    proc: { chance: 0.22, label: 'A mordida do jacaré rasga fundo!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'rottingGator:bite', name: 'Mordida Mortal', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.8 } }] },
  { shape: 'mudMother', name: 'Mãe-Lodo', color: '#3a4a2a', minDepth: 1, hp: 190, atk: 19, def: 8, xp: 95, gold: 75, isBoss: true,
    proc: { chance: 0.26, label: 'Mãe-Lodo esmaga sua guarda com um golpe de lama pesada!', statMod: 'def', statModPct: -0.20, rounds: 3 },
    phases: [
      { hpPct: 0.66, name: 'Mãe-Lodo Fervente', transitionMsg: 'O lodo ferve ao redor da Mãe-Lodo, borbulhando veneno!', atkMult: 1.15,
        extraAbilities: [{ id: 'mudMother:p2', name: 'Vômito Tóxico', cooldown: 4, useChance: 0.45, effect: { kind: 'statusBite', dmgMult: 1.0, status: 'poison', statusRounds: 3 } }] },
      { hpPct: 0.33, name: 'Fúria do Pântano', transitionMsg: 'Encurralada, a Mãe-Lodo desaba sobre você com todo o seu peso!', atkMult: 1.3, cc: 'stun', ccRounds: 1,
        extraAbilities: [{ id: 'mudMother:p3', name: 'Esmagamento Lodoso', cooldown: 5, useChance: 0.4, effect: { kind: 'bigHit', dmgMult: 2.0 } }] },
    ] },

  // ── Região 1 — Covil de Aranhas ──
  { shape: 'huntingSpider', name: 'Aranha Caçadora', color: '#3a2a2a', minDepth: 1, hp: 28, atk: 10, def: 3, xp: 16, gold: 12, evasion: 0.15,
    proc: { chance: 0.22, label: 'As presas afiadas rasgam sua pele!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'huntingSpider:pounce', name: 'Investida Caçadora', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.7 } }] },
  { shape: 'venomSpider', name: 'Aranha Venenosa', color: '#4a2a4a', minDepth: 1, hp: 24, atk: 9, def: 2, xp: 15, gold: 11,
    proc: { chance: 0.26, label: 'O veneno potente da aranha corre em suas veias!', status: 'poison', rounds: 3 },
    abilities: [{ id: 'venomSpider:venom', name: 'Veneno Concentrado', cooldown: 4, useChance: 0.5, effect: { kind: 'statusBite', dmgMult: 1.0, status: 'poison', statusRounds: 3 } }] },
  { shape: 'giantSpider', name: 'Aranha Gigante', color: '#2a1a1a', minDepth: 1, hp: 42, atk: 10, def: 5, xp: 18, gold: 13,
    proc: { chance: 0.18, label: 'As patas pesadas esmagam sua guarda!', statMod: 'def', statModPct: -0.15, rounds: 3 },
    abilities: [{ id: 'giantSpider:crush', name: 'Patas Esmagadoras', cooldown: 4, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.7, statMod: 'def', statModPct: -0.2, statModRounds: 3 } }] },
  { shape: 'spiderlingSwarm', name: 'Enxame de Aracnídeos', color: '#5a3a2a', minDepth: 1, hp: 18, atk: 7, def: 1, xp: 13, gold: 9, evasion: 0.25,
    proc: { chance: 0.20, label: 'O enxame de aracnídeos atrapalha sua visão!', statMod: 'accuracy', statModPct: -0.15, rounds: 3 },
    abilities: [{ id: 'spiderlingSwarm:blind', name: 'Enxame Cegante', cooldown: 4, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.7, statMod: 'accuracy', statModPct: -0.2, statModRounds: 3 } }] },
  { shape: 'darkWeaver', name: 'Tecelã Sombria', color: '#1a1a2a', minDepth: 1, hp: 34, atk: 11, def: 4, xp: 19, gold: 14,
    proc: { chance: 0.20, label: 'A teia pegajosa o prende, atordoado!', cc: 'stun', rounds: 1 },
    abilities: [{ id: 'darkWeaver:web', name: 'Teia Sombria', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
  { shape: 'blackMatriarch', name: 'Matriarca Negra', color: '#0f0f18', minDepth: 1, hp: 220, atk: 22, def: 9, xp: 110, gold: 90, isBoss: true,
    proc: { chance: 0.26, label: 'A picada da Matriarca injeta um veneno paralisante!', status: 'poison', rounds: 4 },
    phases: [
      { hpPct: 0.66, name: 'Matriarca Desperta', transitionMsg: 'Teias se espalham pela arena — a Matriarca desperta toda a sua ninhada!', atkMult: 1.15,
        extraAbilities: [{ id: 'blackMatriarch:p2', name: 'Ferrão Duplo', cooldown: 4, useChance: 0.45, effect: { kind: 'statusBite', dmgMult: 1.1, status: 'poison', statusRounds: 4 } }] },
      { hpPct: 0.33, name: 'Fúria da Ninhada', transitionMsg: 'Ferida, a Matriarca ataca sem piedade!', atkMult: 1.3, cc: 'stun', ccRounds: 1,
        extraAbilities: [{ id: 'blackMatriarch:p3', name: 'Investida da Matriarca', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
    ] },

  // ── Bosses da Região 2+ — sem roster próprio ainda, reaproveitam o sprite
  // do shape mais forte do pool da masmorra até ganharem arte dedicada.
  { shape: 'horrorAncient', name: 'Aberração Ancestral', color: '#3a2a52', minDepth: 1, hp: 180, atk: 20, def: 8, xp: 90, gold: 70, evasion: 0.18, matk: 20, mdef: 11, atkType: 'magical', isBoss: true,
    proc: { chance: 0.26, label: 'Uma aberração ancestral o faz adormecer em terror!', cc: 'sleep', rounds: 1 },
    phases: [
      { hpPct: 0.66, name: 'Horror Desperto', transitionMsg: 'A aberração se contorce, sussurros do vazio ecoando ao redor!', atkMult: 1.15,
        extraAbilities: [{ id: 'horrorAncient:p2', name: 'Sussurro do Vazio', cooldown: 4, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.7, statMod: 'dmgTakenPct', statModPct: 0.25, statModRounds: 3 } }] },
      { hpPct: 0.33, name: 'Fúria Ancestral', transitionMsg: 'A aberração descarta toda sutileza e ataca com fúria pura!', atkMult: 1.3, cc: 'silence', ccRounds: 2,
        extraAbilities: [{ id: 'horrorAncient:p3', name: 'Grito Ancestral', cooldown: 5, useChance: 0.4, effect: { kind: 'bigHit', dmgMult: 2.0 } }] },
    ] },
  { shape: 'orcWarlord', name: 'Senhor da Guerra Orc', color: '#4f7a3a', minDepth: 1, hp: 170, atk: 19, def: 9, xp: 85, gold: 65, matk: 5, mdef: 4, isBoss: true,
    proc: { chance: 0.26, label: 'O golpe do senhor da guerra orc o atordoa!', cc: 'stun', rounds: 1 },
    phases: [
      { hpPct: 0.66, name: 'Senhor Enraivecido', transitionMsg: 'O Senhor da Guerra saca seu segundo machado, rugindo de fúria!', atkMult: 1.15,
        extraAbilities: [{ id: 'orcWarlord:p2', name: 'Machado Duplo', cooldown: 4, useChance: 0.45, effect: { kind: 'bigHit', dmgMult: 1.8 } }] },
      { hpPct: 0.33, name: 'Fúria de Guerra', transitionMsg: 'Encurralado, o Senhor da Guerra solta um grito que ecoa pela masmorra!', atkMult: 1.3, cc: 'stun', ccRounds: 1,
        extraAbilities: [{ id: 'orcWarlord:p3', name: 'Grito de Guerra', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
    ] },
  { shape: 'trollChieftain', name: 'Cacique Troll', color: '#7a5230', minDepth: 1, hp: 210, atk: 20, def: 10, xp: 100, gold: 75, matk: 6, mdef: 5, isBoss: true,
    proc: { chance: 0.24, label: 'O cacique troll esmaga sua guarda!', statMod: 'def', statModPct: -0.20, rounds: 3 },
    phases: [
      { hpPct: 0.66, name: 'Cacique Furioso', transitionMsg: 'O Cacique Troll golpeia o próprio porrete contra a pedra, estilhaçando-a!', atkMult: 1.15,
        extraAbilities: [{ id: 'trollChieftain:p2', name: 'Porrete Esmagador', cooldown: 4, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.8, statMod: 'def', statModPct: -0.25, statModRounds: 3 } }] },
      { hpPct: 0.33, name: 'Regeneração Feroz', transitionMsg: 'Ferido, o corpo do Cacique começa a se regenerar diante dos seus olhos!', atkMult: 1.3, cc: 'stun', ccRounds: 1,
        extraAbilities: [{ id: 'trollChieftain:p3', name: 'Vigor Selvagem', cooldown: 5, useChance: 0.45, effect: { kind: 'lifestealHit', dmgMult: 1.2, lifestealPct: 0.4 } }] },
    ] },
  { shape: 'dragonElder', name: 'Dragão Ancião', color: '#a5271f', minDepth: 1, hp: 260, atk: 24, def: 12, xp: 130, gold: 100, matk: 26, mdef: 14, atkType: 'magical', isBoss: true,
    proc: { chance: 0.26, label: 'O sopro ancestral do dragão o incendeia!', status: 'burn', rounds: 3 },
    phases: [
      { hpPct: 0.66, name: 'Dragão Enfurecido', transitionMsg: 'O Dragão Ancião ruge e as chamas em seu peito se intensificam!', atkMult: 1.15,
        extraAbilities: [{ id: 'dragonElder:p2', name: 'Fôlego Ardente', cooldown: 4, useChance: 0.45, effect: { kind: 'statusBite', dmgMult: 1.1, status: 'burn', statusRounds: 3 } }] },
      { hpPct: 0.33, name: 'Fúria Ancestral', transitionMsg: 'O Dragão bate as asas com violência, atordoando você com a rajada!', atkMult: 1.3, cc: 'stun', ccRounds: 1,
        extraAbilities: [{ id: 'dragonElder:p3', name: 'Chamas Ancestrais', cooldown: 5, useChance: 0.4, effect: { kind: 'bigHit', dmgMult: 2.2 } }] },
    ] },
  { shape: 'skeletonLord', name: 'Lorde Esqueleto', color: '#d8d2b8', minDepth: 1, hp: 150, atk: 17, def: 7, xp: 75, gold: 60, matk: 6, mdef: 4, isBoss: true,
    proc: { chance: 0.24, label: 'A maldição do Lorde Esqueleto o torna vulnerável!', statMod: 'dmgTakenPct', statModPct: 0.20, rounds: 3 },
    phases: [
      { hpPct: 0.66, name: 'Lorde Amaldiçoado', transitionMsg: 'O Lorde Esqueleto ergue sua coroa em ruínas, invocando uma maldição maior!', atkMult: 1.15,
        extraAbilities: [{ id: 'skeletonLord:p2', name: 'Maldição Maior', cooldown: 4, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.7, statMod: 'dmgTakenPct', statModPct: 0.3, statModRounds: 3 } }] },
      { hpPct: 0.33, name: 'Fúria dos Ossos', transitionMsg: 'Prestes a desmoronar, o Lorde Esqueleto ataca com fúria antiga!', atkMult: 1.3, cc: 'stun', ccRounds: 1,
        extraAbilities: [{ id: 'skeletonLord:p3', name: 'Fúria dos Ossos Antigos', cooldown: 5, useChance: 0.4, effect: { kind: 'bigHit', dmgMult: 2.0 } }] },
    ] },

  // ── Alvos de Caçada (lib/hunts.ts) — superchefes opcionais, deliberadamente
  // bem mais fortes que o chefe de uma masmorra do mesmo levelReq (ver
  // HUNT_STAT_MULT abaixo). Cada um ganha uma 3ª fase, uma a mais que um
  // chefe normal, para reforçar que a luta é mais longa e mais dura.
  { shape: 'boneTyrant', name: 'Tirano Ossudo', color: '#c9c2a0', minDepth: 1, hp: 180, atk: 20, def: 9, xp: 90, gold: 70, matk: 6, mdef: 4, isBoss: true,
    proc: { chance: 0.28, label: 'O Tirano Ossudo esmaga sua guarda com um golpe descomunal!', statMod: 'def', statModPct: -0.25, rounds: 3 },
    phases: [
      { hpPct: 0.70, name: 'Fúria dos Sepultados', transitionMsg: 'Ossos quebrados se reerguem ao redor do Tirano Ossudo, alimentando sua fúria!', atkMult: 1.2,
        extraAbilities: [{ id: 'boneTyrant:p2', name: 'Investida Sepulcral', cooldown: 4, useChance: 0.45, effect: { kind: 'bigHit', dmgMult: 1.9 } }] },
      { hpPct: 0.40, name: 'Legião Despertada', transitionMsg: 'O Tirano convoca a legião inteira do sepulcro — o ar fica pesado de maldição!', atkMult: 1.35, cc: 'stun', ccRounds: 1,
        extraAbilities: [{ id: 'boneTyrant:p3', name: 'Maldição da Legião', cooldown: 5, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.8, statMod: 'dmgTakenPct', statModPct: 0.3, statModRounds: 3 } }] },
      { hpPct: 0.15, name: 'Última Sepultura', transitionMsg: 'À beira da destruição, o Tirano Ossudo golpeia com força capaz de abrir sepulturas!', atkMult: 1.5,
        extraAbilities: [{ id: 'boneTyrant:p4', name: 'Golpe da Última Sepultura', cooldown: 5, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 2.4 } }] },
    ] },
  { shape: 'swampLeviathan', name: 'Leviatã do Pântano', color: '#2f4a2a', minDepth: 1, hp: 220, atk: 22, def: 11, xp: 110, gold: 85, matk: 7, mdef: 5, isBoss: true,
    proc: { chance: 0.28, label: 'O Leviatã do Pântano arrasta você para as profundezas lodosas!', cc: 'stun', rounds: 1 },
    phases: [
      { hpPct: 0.70, name: 'Despertar do Lodo', transitionMsg: 'O lodo ferve e o Leviatã emerge por completo, maior do que parecia!', atkMult: 1.2,
        extraAbilities: [{ id: 'swampLeviathan:p2', name: 'Coice Lodoso', cooldown: 4, useChance: 0.45, effect: { kind: 'controlSlam', dmgMult: 0.8, cc: 'stun', ccRounds: 1 } }] },
      { hpPct: 0.40, name: 'Fúria Abissal', transitionMsg: 'Encurralado, o Leviatã convoca a fúria de tudo que já afundou no pântano!', atkMult: 1.35,
        extraAbilities: [{ id: 'swampLeviathan:p3', name: 'Engolir', cooldown: 5, useChance: 0.45, effect: { kind: 'lifestealHit', dmgMult: 1.4, lifestealPct: 0.5 } }] },
      { hpPct: 0.15, name: 'Última Maré', transitionMsg: 'O pântano inteiro parece se erguer com o Leviatã em seus estertores finais!', atkMult: 1.5, cc: 'stun', ccRounds: 1,
        extraAbilities: [{ id: 'swampLeviathan:p4', name: 'Última Maré', cooldown: 5, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 2.4 } }] },
    ] },
  { shape: 'infernalWyrm', name: 'Wyrm Infernal', color: '#7a1a12', minDepth: 1, hp: 280, atk: 26, def: 13, xp: 150, gold: 120, matk: 30, mdef: 16, atkType: 'magical', isBoss: true,
    proc: { chance: 0.28, label: 'O sopro do Wyrm Infernal o incendeia até os ossos!', status: 'burn', rounds: 4 },
    phases: [
      { hpPct: 0.70, name: 'Chamas Ascendentes', transitionMsg: 'As escamas do Wyrm incandescem — o calor se torna insuportável!', atkMult: 1.2,
        extraAbilities: [{ id: 'infernalWyrm:p2', name: 'Baforada Infernal', cooldown: 4, useChance: 0.45, effect: { kind: 'statusBite', dmgMult: 1.2, status: 'burn', statusRounds: 4 } }] },
      { hpPct: 0.40, name: 'Fúria do Abismo Flamejante', transitionMsg: 'O Wyrm rasga o céu com um rugido — o próprio ar queima!', atkMult: 1.35, cc: 'stun', ccRounds: 1,
        extraAbilities: [{ id: 'infernalWyrm:p3', name: 'Tempestade de Cinzas', cooldown: 5, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.9, statMod: 'dmgTakenPct', statModPct: 0.3, statModRounds: 3 } }] },
      { hpPct: 0.15, name: 'Cataclismo Final', transitionMsg: 'Prestes a cair, o Wyrm Infernal desata todo o seu poder em um cataclismo final!', atkMult: 1.55,
        extraAbilities: [{ id: 'infernalWyrm:p4', name: 'Cataclismo Final', cooldown: 5, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 2.6 } }] },
    ] },
];

const TIERS_BY_SHAPE: Partial<Record<EnemyShape, EnemyTier>> = {};
for (const t of TIERS) TIERS_BY_SHAPE[t.shape] = t;

// A checkpoint fight at one of the dungeon's miniBossDepths — same shape
// roster, zero new art, just a heavier stat/reward multiplier than a
// regular encounter and its own name so it reads as a step up mid-run.
const ELITE_STAT_MULT = 1.6; // hp/atk/matk
const ELITE_DEF_MULT = 1.25; // def/mdef — dangerous, but still killable, not a wall
const ELITE_REWARD_MULT = 2.2; // xp/gold, so clearing the checkpoint feels worth it

// Alvos de Caçada (lib/hunts.ts) reuse a dungeon's normal boss-scaling curve
// (same `depth` growth formula below) and then stack this on top — deliberately
// steeper than ELITE_STAT_MULT, since a Hunt boss is meant to be the hardest
// fight available at its levelReq, not a mid-run checkpoint.
const HUNT_STAT_MULT = 2.4; // hp/atk/matk
const HUNT_DEF_MULT = 1.6; // def/mdef
const HUNT_REWARD_MULT = 3.0; // xp/gold — the grind-worthy payoff for a fight this much harder

// Modo Pesadelo (DungeonLoadout.tsx) replays an already-cleared dungeon with
// every enemy — regulars and the boss alike, unlike a Caçada's single
// hyper-boss — scaled up. Lower than HUNT_STAT_MULT since this compounds
// across an entire run instead of one fight; reward multipliers live on the
// runtime dungeon copy itself (dropMult/goldMult/xpMult), not here.
const NIGHTMARE_STAT_MULT = 1.7;
const NIGHTMARE_DEF_MULT = 1.3;

function applyNightmare(inst: EnemyInstance): EnemyInstance {
  return {
    ...inst,
    hp: Math.round(inst.hp * NIGHTMARE_STAT_MULT),
    maxHp: Math.round(inst.maxHp * NIGHTMARE_STAT_MULT),
    atk: Math.round(inst.atk * NIGHTMARE_STAT_MULT),
    def: Math.round(inst.def * NIGHTMARE_DEF_MULT),
    matk: inst.matk !== undefined ? Math.round(inst.matk * NIGHTMARE_STAT_MULT) : undefined,
    mdef: inst.mdef !== undefined ? Math.round(inst.mdef * NIGHTMARE_DEF_MULT) : undefined,
  };
}

// Regular (non-boss) tiers' base hp/atk/def, straight from the TIERS table
// above, were tuned for a player power curve the game has long since
// outgrown — a fresh level-1 character in full starter gear was one/two-
// shotting every regular encounter in a dungeon while taking almost no
// cumulative damage over an entire clear, then hitting the dungeon boss
// (tuned as its own, much higher, baseline) as a near-unavoidable wall —
// simulated at 0% boss win rate through level 3 across every class, then
// close to 100% by the time gear caught up, with almost no room in between.
// HP gets the biggest bump (mostly-Comum trash should survive more than
// one hit) and DEF a moderate one (stops instant one-shots outright); ATK
// only "um pouco" per the actual bug report, since regular enemies were
// already lethal to the squishier classes (a Mago died mid-run to trash
// alone over 90% of simulated runs at level 1) — pushing ATK up hard would
// have made that worse while barely registering against a tank. Bosses get
// the opposite treatment: HP/ATK dialed back so an appropriately-leveled
// attempt is a genuine fight instead of an auto-loss, DEF nudged up so
// they don't melt the moment gear catches up either.
// Second HP pass — even after the CP-anchor difficultyMult tuning (see
// dungeons.ts), a hits-to-kill check against real anchor characters showed
// regular enemies dying in 1-2 hits to every class at every checkpoint,
// bosses in as few as 3 — "instakill de qualquer classe" per the actual bug
// report. difficultyMult's own relative shape (Região 1 lenient, Região 2
// tighter, Torre extra dangerous) is already right, so this only pushes the
// shared HP baseline both curves sit on — not ATK or DEF, which the report
// didn't flag — up hard enough that even Região 1 trash takes several real
// hits and a boss is a genuine multi-round fight everywhere, not just late.
const REGULAR_HP_MULT = 5.5;
const REGULAR_ATK_MULT = 1.05;
const REGULAR_DEF_MULT = 1.15;
const BOSS_HP_MULT = 1.5;
const BOSS_ATK_MULT = 0.75;
const BOSS_DEF_MULT = 1.15;

// Second steepening of the per-depth growth curve (was 0.075/0.045, itself
// already a steepening of the original 0.055/0.03) — the player's own power
// has grown faster than this curve since then (equipment's primary-stat
// roll alone went from 2/tier to 6.5/tier), so enemies were falling behind
// a well-geared character at any given depth instead of keeping pace with
// it. minDepth's own base stats are untouched — only how fast enemies scale
// past that floor changes.
function instanceFromTier(tier: EnemyTier, depth: number, mode?: 'elite' | 'hunt', difficultyMult = 1): EnemyInstance {
  const isBossTier = tier.isBoss === true;
  const hpMult = isBossTier ? BOSS_HP_MULT : REGULAR_HP_MULT;
  const atkMult = isBossTier ? BOSS_ATK_MULT : REGULAR_ATK_MULT;
  const baseDefMult = isBossTier ? BOSS_DEF_MULT : REGULAR_DEF_MULT;
  const modeStatMult = mode === 'elite' ? ELITE_STAT_MULT : mode === 'hunt' ? HUNT_STAT_MULT : 1;
  const modeDefMult = mode === 'elite' ? ELITE_DEF_MULT : mode === 'hunt' ? HUNT_DEF_MULT : 1;
  const rewardMult = mode === 'elite' ? ELITE_REWARD_MULT : mode === 'hunt' ? HUNT_REWARD_MULT : 1;
  // difficultyMult is the per-dungeon CP-anchor knob (see DungeonDef) — hits
  // hp/atk/matk in full (that's what actually makes a dungeon feel harder or
  // softer) but def/mdef only at its square root, since defense already
  // compounds non-linearly through rollAttack's mitigation cap and doubling
  // it in lockstep with attack would over-tighten fights at the high end.
  const defDifficultyMult = Math.sqrt(difficultyMult);
  const hpGrowth = (1 + depth * 0.12) * hpMult * modeStatMult * difficultyMult;
  const atkGrowth = (1 + depth * 0.12) * atkMult * modeStatMult * difficultyMult;
  const defGrowth = (1 + depth * 0.07) * baseDefMult * modeDefMult * defDifficultyMult;
  const hp = Math.round(tier.hp * hpGrowth);
  return {
    name: mode === 'elite' ? `${tier.name} Veterano` : tier.name,
    shape: tier.shape,
    color: tier.color,
    hp, maxHp: hp,
    atk: Math.round(tier.atk * atkGrowth),
    def: Math.round(tier.def * defGrowth),
    xpReward: Math.round(tier.xp * (1 + depth * 0.08) * rewardMult),
    goldReward: Math.round(tier.gold * (1 + depth * 0.08) * rewardMult),
    proc: tier.proc,
    abilities: tier.abilities,
    phases: tier.phases,
    evasion: tier.evasion,
    matk: tier.matk !== undefined ? Math.round(tier.matk * atkGrowth) : undefined,
    mdef: tier.mdef !== undefined ? Math.round(tier.mdef * defGrowth) : undefined,
    atkType: tier.atkType,
    isBoss: tier.isBoss,
    isElite: mode === 'elite' || undefined,
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
function spawnRegularOrBoss(depth: number, dungeon: DungeonDef): EnemyInstance {
  const difficultyMult = dungeon.difficultyMult ?? 1;
  if (depth >= dungeon.bossDepth) {
    const bossTier = TIERS_BY_SHAPE[dungeon.boss];
    if (bossTier) return instanceFromTier(bossTier, dungeon.bossDepth, dungeon.isHunt ? 'hunt' : undefined, difficultyMult);
  }
  const tier = randomRegularTier(depth, dungeon.enemyPool);
  const isMiniBossDepth = dungeon.miniBossDepths?.includes(depth) ?? false;
  return instanceFromTier(tier, depth, isMiniBossDepth ? 'elite' : undefined, difficultyMult);
}

export function spawnEnemy(depth: number, dungeon: DungeonDef): EnemyInstance {
  const inst = spawnRegularOrBoss(depth, dungeon);
  return dungeon.isNightmare ? applyNightmare(inst) : inst;
}
