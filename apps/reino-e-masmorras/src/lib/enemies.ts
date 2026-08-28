import type { DungeonDef, EnemyInstance, EnemyShape, EnemyTier } from '../types/game.ts';
import { atkDifficultyMultiplier, defDifficultyMultiplier, depthGrowthMultiplier, hpDifficultyMultiplier } from './combatCurves.ts';

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
  // ── Genéricos (goblin/skeleton seguem usados na Região 1; wolf fica de
  // reserva para conteúdo futuro) ──
  { shape: 'goblin',   name: 'Goblin',              color: '#5a8a3c', minDepth: 1,  hp: 12, atk: 4,  def: 1,  xp: 6,  gold: 4,  matk: 2,  mdef: 1,
    proc: { chance: 0.20, label: 'Sua lâmina suja envenena você!', status: 'poison', rounds: 3 },
    abilities: [{ id: 'goblin:steal', name: 'Punhal Furtivo', cooldown: 4, useChance: 0.4, effect: { kind: 'stealGold', goldPct: 0.05 } }] },
  { shape: 'wolf',     name: 'Lobo Selvagem',        color: '#6b6b78', minDepth: 3,  hp: 17, atk: 6,  def: 1,  xp: 9,  gold: 6, evasion: 0.12, matk: 2, mdef: 1,
    proc: { chance: 0.22, label: 'A mordida abre um corte sangrento!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'wolf:lunge', name: 'Investida Feroz', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.7 } }] },
  { shape: 'skeleton', name: 'Esqueleto',            color: '#d8d2b8', minDepth: 1,  hp: 23, atk: 7,  def: 3,  xp: 13, gold: 9,  matk: 3,  mdef: 2,
    proc: { chance: 0.20, label: 'Uma maldição óssea o torna mais vulnerável!', statMod: 'dmgTakenPct', statModPct: 0.15, rounds: 3 },
    abilities: [{ id: 'skeleton:curse', name: 'Maldição Óssea Maior', cooldown: 4, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.7, statMod: 'dmgTakenPct', statModPct: 0.25, statModRounds: 3 } }] },
  // "Dragão Jovem" agora é o CHEFE do Covil dos Dragões (isBoss abaixo, na
  // sua própria seção) — de propósito ainda o dragão mais fraco do jogo,
  // guardando dragões adultos/anciões/lendários bem mais fortes para
  // masmorras de regiões futuras (3-7) reaproveitarem esse tema mais tarde.
  { shape: 'dragon',   name: 'Dragão Jovem',         color: '#a5271f', minDepth: 1, hp: 175, atk: 20, def: 10, xp: 88, gold: 70, matk: 24, mdef: 12, atkType: 'magical', isBoss: true,
    proc: { chance: 0.22, label: 'O sopro de fogo do jovem dragão o incendeia!', status: 'burn', rounds: 3 },
    phases: [
      { hpPct: 0.66, name: 'Fúria Juvenil', transitionMsg: 'O Dragão Jovem ruge e as chamas em seu peito se intensificam!', atkMult: 1.15,
        extraAbilities: [{ id: 'dragon:p2', name: 'Baforada Intensa', cooldown: 4, useChance: 0.45, effect: { kind: 'statusBite', dmgMult: 1.1, status: 'burn', statusRounds: 3 } }] },
      { hpPct: 0.33, name: 'Instinto Selvagem', transitionMsg: 'Ferido, o Dragão Jovem ataca por puro instinto selvagem!', atkMult: 1.3, cc: 'stun', ccRounds: 1,
        extraAbilities: [{ id: 'dragon:p3', name: 'Investida Draconiana', cooldown: 5, useChance: 0.4, effect: { kind: 'bigHit', dmgMult: 2.0 } }] },
    ] },

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

  // ── Região 2 — Torre Amaldiçoada ──
  { shape: 'gargoyle', name: 'Gárgula Desperta', color: '#5a6a72', minDepth: 1, hp: 95, atk: 18, def: 10, xp: 40, gold: 30, matk: 3, mdef: 6, evasion: 0.12,
    proc: { chance: 0.20, label: 'As garras de pedra rachada cortam sua guarda!', statMod: 'def', statModPct: -0.15, rounds: 3 },
    abilities: [{ id: 'gargoyle:dive', name: 'Mergulho de Pedra', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.7 } }] },
  { shape: 'spectralMage', name: 'Espectro do Bibliotecário', color: '#4a3a6a', minDepth: 1, hp: 75, atk: 8, def: 5, xp: 34, gold: 26, matk: 22, mdef: 11, atkType: 'magical', evasion: 0.15,
    proc: { chance: 0.20, label: 'Um sussurro arcano sela seus lábios!', cc: 'silence', rounds: 2 },
    abilities: [{ id: 'spectralMage:page', name: 'Página Amaldiçoada', cooldown: 4, useChance: 0.45, effect: { kind: 'statusBite', dmgMult: 1.0, status: 'curse', statusRounds: 3 } }] },
  { shape: 'cursedKnight', name: 'Cavaleiro Selado', color: '#3a3a42', minDepth: 1, hp: 110, atk: 20, def: 13, xp: 46, gold: 35, matk: 2, mdef: 5,
    proc: { chance: 0.16, label: 'O golpe da armadura amaldiçoada o atordoa!', cc: 'stun', rounds: 1 },
    abilities: [{ id: 'cursedKnight:seal', name: 'Golpe Selado', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
  { shape: 'watchingEye', name: 'Olho Vigilante', color: '#6a4a8a', minDepth: 1, hp: 60, atk: 6, def: 3, xp: 28, gold: 21, matk: 20, mdef: 9, atkType: 'magical', evasion: 0.20,
    proc: { chance: 0.18, label: 'O olhar paralisante atrapalha sua mira!', statMod: 'accuracy', statModPct: -0.15, rounds: 3 },
    abilities: [{ id: 'watchingEye:fixate', name: 'Fixação Arcana', cooldown: 4, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.7, statMod: 'accuracy', statModPct: -0.25, statModRounds: 3 } }] },
  { shape: 'crawlingShadow', name: 'Sombra Rastejante', color: '#2a2438', minDepth: 1, hp: 70, atk: 15, def: 6, xp: 32, gold: 24, matk: 16, mdef: 8, atkType: 'magical', evasion: 0.22,
    proc: { chance: 0.18, label: 'A escuridão sussurrante o faz cochilar!', cc: 'sleep', rounds: 1 },
    abilities: [{ id: 'crawlingShadow:whisper', name: 'Sussurro Sombrio', cooldown: 6, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.6, cc: 'sleep', ccRounds: 1 } }] },
  { shape: 'fallenArchmage', name: 'Arquimago Caído', color: '#4a2a6a', minDepth: 1, hp: 190, atk: 20, def: 9, xp: 95, gold: 75, matk: 28, mdef: 14, atkType: 'magical', isBoss: true,
    proc: { chance: 0.26, label: 'O Arquimago o amaldiçoa com magia proibida!', status: 'curse', rounds: 3 },
    phases: [
      { hpPct: 0.66, name: 'Ira Arcana', transitionMsg: 'O Arquimago Caído ergue seu cajado quebrado, magia proibida crepitando ao redor!', atkMult: 1.15,
        extraAbilities: [{ id: 'fallenArchmage:p2', name: 'Explosão Amaldiçoada', cooldown: 4, useChance: 0.45, effect: { kind: 'statusBite', dmgMult: 1.1, status: 'curse', statusRounds: 3 } }] },
      { hpPct: 0.33, name: 'Último Feitiço', transitionMsg: 'Prestes a cair, o Arquimago desata seu último e mais terrível feitiço!', atkMult: 1.3, cc: 'silence', ccRounds: 2,
        extraAbilities: [{ id: 'fallenArchmage:p3', name: 'Cataclisma Arcano', cooldown: 5, useChance: 0.4, effect: { kind: 'bigHit', dmgMult: 2.0 } }] },
    ] },

  // ── Região 2 — Minas Abandonadas ──
  { shape: 'cursedMiner', name: 'Coveiro Amaldiçoado', color: '#5a4a3a', minDepth: 1, hp: 42, atk: 11, def: 5, xp: 19, gold: 14,
    proc: { chance: 0.22, label: 'A picareta enferrujada abre um corte profundo!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'cursedMiner:pick', name: 'Picareta Amaldiçoada', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.7 } }] },
  { shape: 'oreGolem', name: 'Golem de Minério', color: '#6a5a4a', minDepth: 1, hp: 60, atk: 10, def: 9, xp: 26, gold: 20,
    proc: { chance: 0.18, label: 'O punho de minério esmaga sua guarda!', statMod: 'def', statModPct: -0.15, rounds: 3 },
    abilities: [{ id: 'oreGolem:fist', name: 'Punho de Minério', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
  { shape: 'koboldRaider', name: 'Kobold Saqueador', color: '#7a6a3a', minDepth: 1, hp: 30, atk: 9, def: 3, xp: 15, gold: 12, evasion: 0.18,
    proc: { chance: 0.22, label: 'A adaga enferrujada corta fundo!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'koboldRaider:snatch', name: 'Mão Ligeira', cooldown: 4, useChance: 0.4, effect: { kind: 'stealGold', goldPct: 0.05 } }] },
  { shape: 'batSwarm', name: 'Enxame de Morcegos', color: '#3a3a4a', minDepth: 1, hp: 28, atk: 8, def: 2, xp: 14, gold: 10, evasion: 0.25,
    proc: { chance: 0.20, label: 'O bater de asas atrapalha sua visão!', statMod: 'accuracy', statModPct: -0.15, rounds: 3 },
    abilities: [{ id: 'batSwarm:cloud', name: 'Nuvem de Morcegos', cooldown: 4, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.7, statMod: 'accuracy', statModPct: -0.2, statModRounds: 3 } }] },
  { shape: 'gasWisp', name: 'Espírito do Metano', color: '#7a9a5a', minDepth: 1, hp: 35, atk: 10, def: 2, xp: 17, gold: 13, matk: 12, mdef: 4, atkType: 'magical', evasion: 0.15,
    proc: { chance: 0.24, label: 'O gás tóxico o envenena!', status: 'poison', rounds: 3 },
    abilities: [{ id: 'gasWisp:blast', name: 'Explosão de Gás', cooldown: 4, useChance: 0.45, effect: { kind: 'statusBite', dmgMult: 1.0, status: 'poison', statusRounds: 3 } }] },
  { shape: 'oreTitan', name: 'Titã de Minério', color: '#8a7a5a', minDepth: 1, hp: 165, atk: 18, def: 12, xp: 82, gold: 65, matk: 4, mdef: 5, isBoss: true,
    proc: { chance: 0.26, label: 'O Titã esmaga sua armadura com um golpe de minério!', statMod: 'def', statModPct: -0.20, rounds: 3 },
    phases: [
      { hpPct: 0.66, name: 'Titã Enfurecido', transitionMsg: 'O Titã de Minério golpeia as próprias mãos, estilhaçando pedra!', atkMult: 1.15,
        extraAbilities: [{ id: 'oreTitan:p2', name: 'Avalanche de Minério', cooldown: 4, useChance: 0.45, effect: { kind: 'bigHit', dmgMult: 1.8 } }] },
      { hpPct: 0.33, name: 'Colapso das Minas', transitionMsg: 'O teto da mina racha — o Titã desaba tudo ao seu redor!', atkMult: 1.3, cc: 'stun', ccRounds: 1,
        extraAbilities: [{ id: 'oreTitan:p3', name: 'Desabamento', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
    ] },

  // ── Região 2 — Floresta Amaldiçoada ──
  { shape: 'corruptedEnt', name: 'Ent Corrompido', color: '#3a4a2a', minDepth: 1, hp: 85, atk: 14, def: 11, xp: 37, gold: 28, matk: 4, mdef: 6,
    proc: { chance: 0.20, label: 'Os galhos retorcidos esmagam sua guarda!', statMod: 'def', statModPct: -0.15, rounds: 3 },
    abilities: [{ id: 'corruptedEnt:roots', name: 'Golpe de Raízes', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.7 } }] },
  { shape: 'ghostWolf', name: 'Lobo Espectral', color: '#5a6a7a', minDepth: 1, hp: 55, atk: 16, def: 4, xp: 25, gold: 19, evasion: 0.20,
    proc: { chance: 0.22, label: 'As presas espectrais rasgam sua carne!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'ghostWolf:lunge', name: 'Investida Fantasmagórica', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.8 } }] },
  { shape: 'darkFairy', name: 'Fada Sombria', color: '#5a2a6a', minDepth: 1, hp: 45, atk: 8, def: 3, xp: 21, gold: 16, matk: 18, mdef: 8, atkType: 'magical', evasion: 0.22,
    proc: { chance: 0.18, label: 'O pólen sombrio o faz adormecer!', cc: 'sleep', rounds: 1 },
    abilities: [{ id: 'darkFairy:dust', name: 'Pó dos Sonhos', cooldown: 6, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.6, cc: 'sleep', ccRounds: 1 } }] },
  { shape: 'cursedBear', name: 'Urso Amaldiçoado', color: '#3a2a1a', minDepth: 1, hp: 90, atk: 17, def: 8, xp: 39, gold: 30,
    proc: { chance: 0.16, label: 'A patada brutal o atordoa!', cc: 'stun', rounds: 1 },
    abilities: [{ id: 'cursedBear:swipe', name: 'Patada Selvagem', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
  { shape: 'stranglingVine', name: 'Trepadeira Estranguladora', color: '#4a6a2a', minDepth: 1, hp: 50, atk: 12, def: 5, xp: 23, gold: 17, matk: 6, mdef: 5,
    proc: { chance: 0.18, label: 'As vinhas prendem seus movimentos!', statMod: 'accuracy', statModPct: -0.15, rounds: 3 },
    abilities: [{ id: 'stranglingVine:bind', name: 'Amarras Vivas', cooldown: 4, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.7, statMod: 'accuracy', statModPct: -0.2, statModRounds: 3 } }] },
  { shape: 'forestHeart', name: 'Coração da Floresta', color: '#2a4a1a', minDepth: 1, hp: 205, atk: 19, def: 11, xp: 100, gold: 80, matk: 10, mdef: 8, isBoss: true,
    proc: { chance: 0.26, label: 'O Coração da Floresta amaldiçoa você, tornando-o mais vulnerável!', statMod: 'dmgTakenPct', statModPct: 0.20, rounds: 3 },
    phases: [
      { hpPct: 0.66, name: 'Despertar Selvagem', transitionMsg: 'A floresta ao redor se contorce — o Coração desperta por completo!', atkMult: 1.15,
        extraAbilities: [{ id: 'forestHeart:p2', name: 'Fúria da Floresta', cooldown: 4, useChance: 0.45, effect: { kind: 'bigHit', dmgMult: 1.8 } }] },
      { hpPct: 0.33, name: 'Raízes Ancestrais', transitionMsg: 'Raízes ancestrais brotam do chão, prendendo tudo ao redor!', atkMult: 1.3, cc: 'stun', ccRounds: 1,
        extraAbilities: [{ id: 'forestHeart:p3', name: 'Prisão de Raízes', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
    ] },

  // ── Região 2 — Covil dos Dragões (Dragão Jovem, acima nos Genéricos, é o
  // chefe) ──
  { shape: 'dragonHatchling', name: 'Filhote de Dragão', color: '#c9531f', minDepth: 1, hp: 55, atk: 13, def: 6, xp: 26, gold: 20, matk: 14, mdef: 7, atkType: 'magical',
    proc: { chance: 0.22, label: 'O sopro do filhote o queima!', status: 'burn', rounds: 3 },
    abilities: [{ id: 'dragonHatchling:breath', name: 'Baforada Fraca', cooldown: 4, useChance: 0.45, effect: { kind: 'statusBite', dmgMult: 1.0, status: 'burn', statusRounds: 3 } }] },
  { shape: 'wildWyvern', name: 'Wyvern Selvagem', color: '#4a6a3a', minDepth: 1, hp: 70, atk: 16, def: 7, xp: 32, gold: 25, evasion: 0.15,
    proc: { chance: 0.22, label: 'As garras da wyvern rasgam fundo!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'wildWyvern:dive', name: 'Investida Aérea', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.8 } }] },
  { shape: 'scaledGuardian', name: 'Guardião Escamado', color: '#3a6a5a', minDepth: 1, hp: 80, atk: 15, def: 10, xp: 36, gold: 28,
    proc: { chance: 0.18, label: 'O golpe escamado quebra sua guarda!', statMod: 'def', statModPct: -0.15, rounds: 3 },
    abilities: [{ id: 'scaledGuardian:tail', name: 'Golpe de Cauda', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
  { shape: 'draconicCultist', name: 'Cultista Dracônico', color: '#7a2a2a', minDepth: 1, hp: 50, atk: 10, def: 4, xp: 24, gold: 18, matk: 16, mdef: 7, atkType: 'magical',
    proc: { chance: 0.18, label: 'O cântico dracônico o amaldiçoa!', statMod: 'dmgTakenPct', statModPct: 0.15, rounds: 3 },
    abilities: [{ id: 'draconicCultist:blessing', name: 'Bênção do Dragão', cooldown: 4, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.7, statMod: 'dmgTakenPct', statModPct: 0.25, statModRounds: 3 } }] },
  { shape: 'fireSerpent', name: 'Serpente de Fogo', color: '#a5401f', minDepth: 1, hp: 45, atk: 12, def: 3, xp: 22, gold: 17, matk: 15, mdef: 6, atkType: 'magical', evasion: 0.15,
    proc: { chance: 0.22, label: 'A mordida flamejante o incendeia!', status: 'burn', rounds: 3 },
    abilities: [{ id: 'fireSerpent:bite', name: 'Mordida Flamejante', cooldown: 4, useChance: 0.5, effect: { kind: 'statusBite', dmgMult: 1.0, status: 'burn', statusRounds: 3 } }] },

  // ── Região 2 — Necrópole Esquecida ──
  { shape: 'darkReaper', name: 'Ceifador Sombrio', color: '#2a2a2a', minDepth: 1, hp: 75, atk: 17, def: 7, xp: 34, gold: 26, matk: 8, mdef: 5, evasion: 0.15,
    proc: { chance: 0.20, label: 'A foice amaldiçoada drena sua vitalidade!', status: 'curse', rounds: 3 },
    abilities: [{ id: 'darkReaper:reap', name: 'Ceifar Almas', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.8 } }] },
  { shape: 'deathCrow', name: 'Corvo da Morte', color: '#1a1a1a', minDepth: 1, hp: 40, atk: 11, def: 3, xp: 19, gold: 14, evasion: 0.22,
    proc: { chance: 0.22, label: 'As garras necróticas rasgam fundo!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'deathCrow:strike', name: 'Investida Mortal', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.7 } }] },
  { shape: 'boneExecutioner', name: 'Carrasco Ossudo', color: '#8a8268', minDepth: 1, hp: 95, atk: 18, def: 9, xp: 42, gold: 32,
    proc: { chance: 0.16, label: 'O machado ossudo o atordoa!', cc: 'stun', rounds: 1 },
    abilities: [{ id: 'boneExecutioner:axe', name: 'Golpe do Carrasco', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
  { shape: 'wailingGhost', name: 'Pranteador Fantasma', color: '#6a7a8a', minDepth: 1, hp: 55, atk: 9, def: 4, xp: 26, gold: 20, matk: 17, mdef: 8, atkType: 'magical', evasion: 0.20,
    proc: { chance: 0.18, label: 'O lamento fantasmagórico sela sua voz!', cc: 'silence', rounds: 2 },
    abilities: [{ id: 'wailingGhost:wail', name: 'Lamento Sombrio', cooldown: 6, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.6, cc: 'silence', ccRounds: 2 } }] },
  { shape: 'graveWorm', name: 'Verme Cadavérico', color: '#5a5a3a', minDepth: 1, hp: 60, atk: 13, def: 5, xp: 28, gold: 21,
    proc: { chance: 0.24, label: 'A mordida podre o envenena!', status: 'poison', rounds: 3 },
    abilities: [{ id: 'graveWorm:bite', name: 'Mordida Cadavérica', cooldown: 4, useChance: 0.45, effect: { kind: 'statusBite', dmgMult: 1.0, status: 'poison', statusRounds: 3 } }] },
  { shape: 'skeletonLord', name: 'Lorde Esqueleto', color: '#d8d2b8', minDepth: 1, hp: 150, atk: 17, def: 7, xp: 75, gold: 60, matk: 6, mdef: 4, isBoss: true,
    proc: { chance: 0.24, label: 'A maldição do Lorde Esqueleto o torna vulnerável!', statMod: 'dmgTakenPct', statModPct: 0.20, rounds: 3 },
    phases: [
      { hpPct: 0.66, name: 'Lorde Amaldiçoado', transitionMsg: 'O Lorde Esqueleto ergue sua coroa em ruínas, invocando uma maldição maior!', atkMult: 1.15,
        extraAbilities: [{ id: 'skeletonLord:p2', name: 'Maldição Maior', cooldown: 4, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.7, statMod: 'dmgTakenPct', statModPct: 0.3, statModRounds: 3 } }] },
      { hpPct: 0.33, name: 'Fúria dos Ossos', transitionMsg: 'Prestes a desmoronar, o Lorde Esqueleto ataca com fúria antiga!', atkMult: 1.3, cc: 'stun', ccRounds: 1,
        extraAbilities: [{ id: 'skeletonLord:p3', name: 'Fúria dos Ossos Antigos', cooldown: 5, useChance: 0.4, effect: { kind: 'bigHit', dmgMult: 2.0 } }] },
    ] },

  // ── Região 2 — Ruínas Élficas ──
  { shape: 'corruptedGuardian', name: 'Guardião Élfico Corrompido', color: '#3a6a4a', minDepth: 1, hp: 100, atk: 19, def: 12, xp: 45, gold: 35, matk: 6, mdef: 7,
    proc: { chance: 0.18, label: 'A lâmina corrompida quebra sua guarda!', statMod: 'def', statModPct: -0.15, rounds: 3 },
    abilities: [{ id: 'corruptedGuardian:blade', name: 'Lâmina Ancestral', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.8 } }] },
  { shape: 'whisperingVine', name: 'Vinha Sussurrante', color: '#5a8a3a', minDepth: 1, hp: 65, atk: 13, def: 6, xp: 30, gold: 23, matk: 10, mdef: 6,
    proc: { chance: 0.18, label: 'As vinhas mágicas prendem seus movimentos!', statMod: 'accuracy', statModPct: -0.15, rounds: 3 },
    abilities: [{ id: 'whisperingVine:bind', name: 'Amarras Élficas', cooldown: 4, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.7, statMod: 'accuracy', statModPct: -0.2, statModRounds: 3 } }] },
  { shape: 'ruinBeast', name: 'Fera das Ruínas', color: '#6a5a2a', minDepth: 1, hp: 85, atk: 18, def: 8, xp: 38, gold: 29, evasion: 0.15,
    proc: { chance: 0.22, label: 'As garras selvagens rasgam fundo!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'ruinBeast:pounce', name: 'Investida Selvagem', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.8 } }] },
  { shape: 'elvenWraith', name: 'Espectro Élfico', color: '#4a7a6a', minDepth: 1, hp: 60, atk: 10, def: 5, xp: 28, gold: 22, matk: 20, mdef: 9, atkType: 'magical', evasion: 0.20,
    proc: { chance: 0.18, label: 'O canto espectral sela sua voz!', cc: 'silence', rounds: 2 },
    abilities: [{ id: 'elvenWraith:song', name: 'Canto Élfico Perdido', cooldown: 6, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.6, cc: 'silence', ccRounds: 2 } }] },
  { shape: 'crystalGolem', name: 'Golem de Cristal', color: '#6a9ab8', minDepth: 1, hp: 95, atk: 15, def: 13, xp: 43, gold: 33, matk: 8, mdef: 9,
    proc: { chance: 0.16, label: 'O punho de cristal o atordoa!', cc: 'stun', rounds: 1 },
    abilities: [{ id: 'crystalGolem:fist', name: 'Punho Cristalino', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
  { shape: 'ancestralGuardian', name: 'Guardiã Ancestral', color: '#2a5a4a', minDepth: 1, hp: 220, atk: 20, def: 13, xp: 108, gold: 85, matk: 14, mdef: 10, isBoss: true,
    proc: { chance: 0.26, label: 'A Guardiã Ancestral esmaga sua defesa com força élfica ancestral!', statMod: 'def', statModPct: -0.20, rounds: 3 },
    phases: [
      { hpPct: 0.66, name: 'Fúria da Guardiã', transitionMsg: 'As colunas élficas ao redor ressoam — a Guardiã desperta em fúria!', atkMult: 1.15,
        extraAbilities: [{ id: 'ancestralGuardian:p2', name: 'Investida Ancestral', cooldown: 4, useChance: 0.45, effect: { kind: 'bigHit', dmgMult: 1.8 } }] },
      { hpPct: 0.33, name: 'Última Defesa', transitionMsg: 'Ferida, a Guardiã convoca a última defesa das ruínas!', atkMult: 1.3, cc: 'stun', ccRounds: 1,
        extraAbilities: [{ id: 'ancestralGuardian:p3', name: 'Colapso Élfico', cooldown: 5, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.8, statMod: 'def', statModPct: -0.3, statModRounds: 3 } }] },
    ] },

  // ── Região 2 — Arena de Sangue ──
  { shape: 'cursedGladiator', name: 'Gladiador Amaldiçoado', color: '#7a2a2a', minDepth: 1, hp: 70, atk: 16, def: 8, xp: 32, gold: 25,
    proc: { chance: 0.22, label: 'A espada amaldiçoada corta fundo!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'cursedGladiator:strike', name: 'Golpe da Arena', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.8 } }] },
  { shape: 'arenaBeast', name: 'Fera de Arena', color: '#6a4a2a', minDepth: 1, hp: 80, atk: 17, def: 7, xp: 36, gold: 28, evasion: 0.12,
    proc: { chance: 0.18, label: 'A investida da fera o atordoa!', cc: 'stun', rounds: 1 },
    abilities: [{ id: 'arenaBeast:charge', name: 'Investida Feroz', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
  { shape: 'maskedExecutioner', name: 'Executor Mascarado', color: '#2a2a2a', minDepth: 1, hp: 65, atk: 18, def: 6, xp: 31, gold: 24,
    proc: { chance: 0.22, label: 'O machado do executor corta fundo!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'maskedExecutioner:execute', name: 'Execução', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.9 } }] },
  { shape: 'beastTamer', name: 'Domador de Bestas', color: '#8a6a3a', minDepth: 1, hp: 55, atk: 12, def: 5, xp: 26, gold: 20, matk: 10, mdef: 5,
    proc: { chance: 0.18, label: 'O chicote do domador o enfraquece!', statMod: 'dmgTakenPct', statModPct: 0.15, rounds: 3 },
    abilities: [{ id: 'beastTamer:whip', name: 'Chicote Sangrento', cooldown: 4, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.7, statMod: 'dmgTakenPct', statModPct: 0.2, statModRounds: 3 } }] },
  { shape: 'fallenChampion', name: 'Campeão Caído', color: '#8a8268', minDepth: 1, hp: 75, atk: 17, def: 9, xp: 35, gold: 27, evasion: 0.10,
    proc: { chance: 0.16, label: 'O golpe do campeão o atordoa!', cc: 'stun', rounds: 1 },
    abilities: [{ id: 'fallenChampion:glory', name: 'Glória Perdida', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.8 } }] },
  { shape: 'grandChampion', name: 'Grão-Campeão da Arena', color: '#9a3a2a', minDepth: 1, hp: 230, atk: 22, def: 12, xp: 115, gold: 90, isBoss: true,
    proc: { chance: 0.26, label: 'O Grão-Campeão abre um corte profundo com sua lâmina lendária!', status: 'bleed', rounds: 3 },
    phases: [
      { hpPct: 0.66, name: 'Fúria do Campeão', transitionMsg: 'A arena inteira ruge — o Grão-Campeão entra em fúria de combate!', atkMult: 1.15,
        extraAbilities: [{ id: 'grandChampion:p2', name: 'Golpe Campeão', cooldown: 4, useChance: 0.45, effect: { kind: 'bigHit', dmgMult: 1.9 } }] },
      { hpPct: 0.33, name: 'Glória Final', transitionMsg: 'Ferido mas invicto, o Grão-Campeão ataca por sua glória final!', atkMult: 1.3, cc: 'stun', ccRounds: 1,
        extraAbilities: [{ id: 'grandChampion:p3', name: 'Última Investida', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
    ] },

  // ── Região 3 — Fortaleza Orc ──
  { shape: 'orcWarrior', name: 'Guerreiro Orc', color: '#5a6a3c', minDepth: 1, hp: 100, atk: 20, def: 10, xp: 52, gold: 40, mdef: 4,
    proc: { chance: 0.20, label: 'O machado orc abre um corte profundo!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'orcWarrior:cleave', name: 'Machadada Selvagem', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.8 } }] },
  { shape: 'orcArcher', name: 'Arqueiro Orc', color: '#7a7a4a', minDepth: 1, hp: 80, atk: 22, def: 6, xp: 54, gold: 40, evasion: 0.15,
    proc: { chance: 0.20, label: 'A flecha farpada rasga sua carne!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'orcArcher:volley', name: 'Rajada Certeira', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.7 } }] },
  { shape: 'orcShaman', name: 'Xamã Orc', color: '#3c6a4a', minDepth: 1, hp: 85, atk: 12, def: 6, xp: 55, gold: 41, matk: 24, mdef: 10, atkType: 'magical',
    proc: { chance: 0.20, label: 'A maldição tribal o enfraquece!', statMod: 'dmgTakenPct', statModPct: 0.15, rounds: 3 },
    abilities: [{ id: 'orcShaman:curse', name: 'Maldição da Tribo', cooldown: 4, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.7, statMod: 'dmgTakenPct', statModPct: 0.25, statModRounds: 3 } }] },
  { shape: 'orcBerserker', name: 'Orc Berserker', color: '#8a3c3c', minDepth: 1, hp: 95, atk: 25, def: 4, xp: 56, gold: 41,
    proc: { chance: 0.18, label: 'A fúria descontrolada quebra sua guarda!', statMod: 'def', statModPct: -0.2, rounds: 3 },
    abilities: [{ id: 'orcBerserker:fury', name: 'Fúria Sanguinária', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.9 } }] },
  { shape: 'orcStandardBearer', name: 'Porta-Estandarte Orc', color: '#6a5a3c', minDepth: 1, hp: 110, atk: 18, def: 11, xp: 57, gold: 42,
    proc: { chance: 0.16, label: 'O brado de guerra o atordoa!', cc: 'stun', rounds: 1 },
    abilities: [{ id: 'orcStandardBearer:rally', name: 'Brado de Guerra', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
  { shape: 'orcWarchief', name: 'Warchief Grukmar', color: '#8a2a2a', minDepth: 1, hp: 260, atk: 26, def: 14, xp: 135, gold: 105, isBoss: true,
    proc: { chance: 0.26, label: 'Grukmar esmaga sua guarda com o machado de guerra!', statMod: 'def', statModPct: -0.2, rounds: 3 },
    phases: [
      { hpPct: 0.66, name: 'Fúria de Guerra', transitionMsg: 'Grukmar ergue seu machado e ruge — a fortaleza inteira treme!', atkMult: 1.15,
        extraAbilities: [{ id: 'orcWarchief:p2', name: 'Golpe Devastador', cooldown: 4, useChance: 0.45, effect: { kind: 'bigHit', dmgMult: 1.9 } }] },
      { hpPct: 0.33, name: 'Última Investida', transitionMsg: 'Ferido, Grukmar convoca a fúria de todo o seu clã!', atkMult: 1.3, cc: 'stun', ccRounds: 1,
        extraAbilities: [{ id: 'orcWarchief:p3', name: 'Investida do Warchief', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
    ] },

  // ── Região 3 — Labirinto de Gelo ──
  { shape: 'iceElemental', name: 'Elemental de Gelo', color: '#7ab8d8', minDepth: 1, hp: 105, atk: 14, def: 9, xp: 53, gold: 40, matk: 22, mdef: 12, atkType: 'magical',
    proc: { chance: 0.20, label: 'O sopro gélido o congela por dentro!', status: 'burn', rounds: 3 },
    abilities: [{ id: 'iceElemental:shard', name: 'Estilhaço de Gelo', cooldown: 4, useChance: 0.45, effect: { kind: 'statusBite', dmgMult: 1.0, status: 'burn', statusRounds: 3 } }] },
  { shape: 'frostWolf', name: 'Lobo Gélido', color: '#8aa8c8', minDepth: 1, hp: 95, atk: 22, def: 7, xp: 54, gold: 40, evasion: 0.15,
    proc: { chance: 0.22, label: 'As presas geladas rasgam fundo!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'frostWolf:lunge', name: 'Investida Gélida', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.8 } }] },
  { shape: 'glacialBat', name: 'Morcego Glacial', color: '#5a7a9a', minDepth: 1, hp: 80, atk: 21, def: 6, xp: 52, gold: 39, evasion: 0.22,
    proc: { chance: 0.20, label: 'As garras congelantes atrapalham sua mira!', statMod: 'accuracy', statModPct: -0.15, rounds: 3 },
    abilities: [{ id: 'glacialBat:screech', name: 'Grito Congelante', cooldown: 4, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.7, statMod: 'accuracy', statModPct: -0.2, statModRounds: 3 } }] },
  { shape: 'iceWraith', name: 'Espectro de Gelo', color: '#a8c8e0', minDepth: 1, hp: 90, atk: 13, def: 7, xp: 55, gold: 41, matk: 20, mdef: 11, atkType: 'magical', evasion: 0.18,
    proc: { chance: 0.18, label: 'O toque gélido sela sua voz!', cc: 'silence', rounds: 2 },
    abilities: [{ id: 'iceWraith:touch', name: 'Toque do Vazio Gélido', cooldown: 6, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.6, cc: 'silence', ccRounds: 2 } }] },
  { shape: 'frozenSentinel', name: 'Sentinela Congelada', color: '#6a8aa8', minDepth: 1, hp: 130, atk: 19, def: 13, xp: 56, gold: 42,
    proc: { chance: 0.16, label: 'O punho de gelo o atordoa!', cc: 'stun', rounds: 1 },
    abilities: [{ id: 'frozenSentinel:fist', name: 'Punho Congelado', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
  { shape: 'iceMonarch', name: 'Monarca do Gelo', color: '#bcdff2', minDepth: 1, hp: 280, atk: 20, def: 15, xp: 140, gold: 108, matk: 26, mdef: 14, atkType: 'magical', isBoss: true,
    proc: { chance: 0.26, label: 'O Monarca do Gelo congela seu corpo, atordoando você!', cc: 'stun', rounds: 1 },
    phases: [
      { hpPct: 0.66, name: 'Inverno Eterno', transitionMsg: 'O Monarca do Gelo ergue seu cetro — uma nevasca eterna toma o labirinto!', atkMult: 1.15,
        extraAbilities: [{ id: 'iceMonarch:p2', name: 'Nevasca Cortante', cooldown: 4, useChance: 0.45, effect: { kind: 'bigHit', dmgMult: 1.9 } }] },
      { hpPct: 0.33, name: 'Zero Absoluto', transitionMsg: 'Ferido, o Monarca desata o frio absoluto do labirinto!', atkMult: 1.3, cc: 'stun', ccRounds: 1,
        extraAbilities: [{ id: 'iceMonarch:p3', name: 'Zero Absoluto', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
    ] },

  // ── Região 3 — Templo Afundado (fork com Cavernas de Cristal) ──
  { shape: 'drownedAcolyte', name: 'Acólito Afogado', color: '#3a5a5a', minDepth: 1, hp: 110, atk: 15, def: 8, xp: 58, gold: 44, matk: 21, mdef: 11, atkType: 'magical',
    proc: { chance: 0.22, label: 'A água estagnada em seus pulmões o envenena!', status: 'poison', rounds: 3 },
    abilities: [{ id: 'drownedAcolyte:pray', name: 'Prece Afogada', cooldown: 4, useChance: 0.45, effect: { kind: 'statusBite', dmgMult: 1.0, status: 'poison', statusRounds: 3 } }] },
  { shape: 'frozenPriest', name: 'Sacerdote Congelado', color: '#4a6a7a', minDepth: 1, hp: 120, atk: 14, def: 10, xp: 59, gold: 44, matk: 23, mdef: 13, atkType: 'magical',
    proc: { chance: 0.18, label: 'O cântico congelado sela sua voz!', cc: 'silence', rounds: 2 },
    abilities: [{ id: 'frozenPriest:chant', name: 'Cântico Gélido', cooldown: 6, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.6, cc: 'silence', ccRounds: 2 } }] },
  { shape: 'lakeWraith', name: 'Espectro do Lago', color: '#2a4a5a', minDepth: 1, hp: 100, atk: 20, def: 7, xp: 57, gold: 43, evasion: 0.18,
    proc: { chance: 0.22, label: 'As mãos submersas drenam sua força!', statMod: 'dmgTakenPct', statModPct: 0.15, rounds: 3 },
    abilities: [{ id: 'lakeWraith:drown', name: 'Abraço Afogado', cooldown: 4, useChance: 0.45, effect: { kind: 'lifestealHit', dmgMult: 1.0, lifestealPct: 0.45 } }] },
  { shape: 'submergedGuardian', name: 'Guardião Submerso', color: '#3a5a6a', minDepth: 1, hp: 140, atk: 18, def: 14, xp: 60, gold: 45,
    proc: { chance: 0.16, label: 'O golpe encharcado o atordoa!', cc: 'stun', rounds: 1 },
    abilities: [{ id: 'submergedGuardian:slam', name: 'Golpe do Templo Afundado', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
  { shape: 'iceEel', name: 'Enguia de Gelo', color: '#5a8a9a', minDepth: 1, hp: 90, atk: 21, def: 6, xp: 57, gold: 43, evasion: 0.20,
    proc: { chance: 0.22, label: 'O choque gélido da enguia o paralisa!', cc: 'stun', rounds: 1 },
    abilities: [{ id: 'iceEel:shock', name: 'Choque Congelante', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
  { shape: 'sunkenHighPriest', name: 'Alto Sacerdote Submerso', color: '#2a4a4a', minDepth: 1, hp: 300, atk: 18, def: 13, xp: 145, gold: 112, matk: 32, mdef: 16, atkType: 'magical', isBoss: true,
    proc: { chance: 0.26, label: 'O Alto Sacerdote o amaldiçoa com águas antigas!', status: 'curse', rounds: 3 },
    phases: [
      { hpPct: 0.66, name: 'Prece Afogada', transitionMsg: 'As águas do templo se agitam — o Alto Sacerdote desperta por completo!', atkMult: 1.15,
        extraAbilities: [{ id: 'sunkenHighPriest:p2', name: 'Maré Amaldiçoada', cooldown: 4, useChance: 0.45, effect: { kind: 'statusBite', dmgMult: 1.1, status: 'curse', statusRounds: 3 } }] },
      { hpPct: 0.33, name: 'Abismo Final', transitionMsg: 'Prestes a afundar de vez, o Sacerdote invoca o abismo submerso!', atkMult: 1.3, cc: 'silence', ccRounds: 2,
        extraAbilities: [{ id: 'sunkenHighPriest:p3', name: 'Chamado do Abismo', cooldown: 5, useChance: 0.4, effect: { kind: 'bigHit', dmgMult: 2.0 } }] },
    ] },

  // ── Região 3 — Cavernas de Cristal (fork com Templo Afundado) ──
  { shape: 'crystalBat', name: 'Morcego de Cristal', color: '#8ac8e0', minDepth: 1, hp: 90, atk: 21, def: 6, xp: 58, gold: 43, evasion: 0.22,
    proc: { chance: 0.20, label: 'Os fragmentos cortantes rasgam sua pele!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'crystalBat:shard', name: 'Rajada de Cristal', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.7 } }] },
  { shape: 'crystalSpider', name: 'Aranha de Cristal', color: '#6aa8c8', minDepth: 1, hp: 100, atk: 20, def: 8, xp: 59, gold: 44,
    proc: { chance: 0.22, label: 'As presas cristalinas envenenam seu sangue!', status: 'poison', rounds: 3 },
    abilities: [{ id: 'crystalSpider:venom', name: 'Veneno Cristalizado', cooldown: 4, useChance: 0.5, effect: { kind: 'statusBite', dmgMult: 1.0, status: 'poison', statusRounds: 3 } }] },
  { shape: 'prismGolem', name: 'Golem Prismático', color: '#9ad8f0', minDepth: 1, hp: 145, atk: 17, def: 15, xp: 60, gold: 45,
    proc: { chance: 0.16, label: 'O punho prismático o atordoa!', cc: 'stun', rounds: 1 },
    abilities: [{ id: 'prismGolem:fist', name: 'Punho Prismático', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
  { shape: 'crystalWisp', name: 'Vagalume de Cristal', color: '#bcefff', minDepth: 1, hp: 85, atk: 13, def: 7, xp: 57, gold: 43, matk: 22, mdef: 12, atkType: 'magical', evasion: 0.18,
    proc: { chance: 0.18, label: 'O brilho ofuscante atrapalha sua mira!', statMod: 'accuracy', statModPct: -0.15, rounds: 3 },
    abilities: [{ id: 'crystalWisp:flash', name: 'Lampejo Prismático', cooldown: 4, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.7, statMod: 'accuracy', statModPct: -0.25, statModRounds: 3 } }] },
  { shape: 'glimmeringStalker', name: 'Rastreador Reluzente', color: '#4a8ab8', minDepth: 1, hp: 110, atk: 22, def: 8, xp: 60, gold: 45, evasion: 0.18,
    proc: { chance: 0.22, label: 'O golpe reluzente corta fundo!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'glimmeringStalker:pounce', name: 'Investida Reluzente', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.8 } }] },
  { shape: 'crystalSovereign', name: 'Soberana de Cristal', color: '#7ad0f5', minDepth: 1, hp: 300, atk: 24, def: 17, xp: 145, gold: 112, matk: 18, mdef: 14, isBoss: true,
    proc: { chance: 0.26, label: 'A Soberana de Cristal estilhaça sua defesa!', statMod: 'def', statModPct: -0.2, rounds: 3 },
    phases: [
      { hpPct: 0.66, name: 'Ressonância Cristalina', transitionMsg: 'As cavernas ressoam — a Soberana canaliza o poder de todo o cristal ao redor!', atkMult: 1.15,
        extraAbilities: [{ id: 'crystalSovereign:p2', name: 'Estilhaço Ressonante', cooldown: 4, useChance: 0.45, effect: { kind: 'bigHit', dmgMult: 1.9 } }] },
      { hpPct: 0.33, name: 'Colapso Prismático', transitionMsg: 'Ferida, a Soberana faz as próprias paredes de cristal desabarem!', atkMult: 1.3, cc: 'stun', ccRounds: 1,
        extraAbilities: [{ id: 'crystalSovereign:p3', name: 'Colapso Prismático', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
    ] },

  // ── Região 3 — Covil do Lobo Alfa ──
  { shape: 'alphaWolfPup', name: 'Filhote do Alfa', color: '#7a7a8a', minDepth: 1, hp: 100, atk: 21, def: 7, xp: 58, gold: 44, evasion: 0.15,
    proc: { chance: 0.22, label: 'A mordida do filhote rasga fundo!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'alphaWolfPup:bite', name: 'Mordida Ágil', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.7 } }] },
  { shape: 'direWolf', name: 'Lobo Terrível', color: '#5a5a6a', minDepth: 1, hp: 130, atk: 24, def: 9, xp: 60, gold: 45,
    proc: { chance: 0.18, label: 'A investida terrível o derruba, atordoado!', cc: 'stun', rounds: 1 },
    abilities: [{ id: 'direWolf:charge', name: 'Investida Terrível', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
  { shape: 'snowStalker', name: 'Perseguidor da Neve', color: '#9aa8b8', minDepth: 1, hp: 95, atk: 23, def: 7, xp: 59, gold: 44, evasion: 0.20,
    proc: { chance: 0.22, label: 'As garras nevadas rasgam sua pele!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'snowStalker:pounce', name: 'Salto na Neve', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.8 } }] },
  { shape: 'packHunter', name: 'Caçador da Alcateia', color: '#6a6a7a', minDepth: 1, hp: 105, atk: 22, def: 8, xp: 59, gold: 45,
    proc: { chance: 0.18, label: 'O golpe coordenado da alcateia atrapalha sua guarda!', statMod: 'def', statModPct: -0.15, rounds: 3 },
    abilities: [{ id: 'packHunter:flank', name: 'Flanco da Alcateia', cooldown: 4, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.7, statMod: 'def', statModPct: -0.2, statModRounds: 3 } }] },
  { shape: 'frostFangWolf', name: 'Lobo Presa-Gelo', color: '#8aa0b0', minDepth: 1, hp: 120, atk: 25, def: 8, xp: 60, gold: 45, matk: 10, mdef: 6,
    proc: { chance: 0.20, label: 'As presas geladas cortam fundo!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'frostFangWolf:bite', name: 'Mordida Gélida', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.8 } }] },
  { shape: 'alphaDireWolf', name: 'Alfa, o Terrível', color: '#4a4a5a', minDepth: 1, hp: 310, atk: 30, def: 14, xp: 150, gold: 116, evasion: 0.15, isBoss: true,
    proc: { chance: 0.28, label: 'O Alfa te derruba com uma investida brutal!', cc: 'stun', rounds: 1 },
    phases: [
      { hpPct: 0.66, name: 'Uivo de Guerra', transitionMsg: 'O Alfa uiva — toda a alcateia parece responder ao chamado!', atkMult: 1.15,
        extraAbilities: [{ id: 'alphaDireWolf:p2', name: 'Investida da Alcateia', cooldown: 4, useChance: 0.45, effect: { kind: 'bigHit', dmgMult: 1.9 } }] },
      { hpPct: 0.33, name: 'Fúria do Alfa', transitionMsg: 'Ferido, o Alfa ataca com toda a fúria de seu covil!', atkMult: 1.3, cc: 'stun', ccRounds: 1,
        extraAbilities: [{ id: 'alphaDireWolf:p3', name: 'Mordida Final', cooldown: 5, useChance: 0.4, effect: { kind: 'bigHit', dmgMult: 2.0 } }] },
    ] },

  // ── Região 3 — Catacumbas Reais ──
  { shape: 'royalSkeleton', name: 'Esqueleto Real', color: '#d8c8a8', minDepth: 1, hp: 115, atk: 22, def: 11, xp: 60, gold: 46, matk: 6, mdef: 5,
    proc: { chance: 0.20, label: 'A lâmina real abre um corte profundo!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'royalSkeleton:strike', name: 'Golpe Real', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.8 } }] },
  { shape: 'cryptSentinel', name: 'Sentinela da Cripta', color: '#8a8268', minDepth: 1, hp: 140, atk: 19, def: 14, xp: 61, gold: 46,
    proc: { chance: 0.16, label: 'O golpe da sentinela o atordoa!', cc: 'stun', rounds: 1 },
    abilities: [{ id: 'cryptSentinel:slam', name: 'Golpe da Cripta', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
  { shape: 'boneNoble', name: 'Nobre Ossudo', color: '#c8b898', minDepth: 1, hp: 110, atk: 21, def: 10, xp: 60, gold: 46,
    proc: { chance: 0.18, label: 'A maldição nobre o torna mais vulnerável!', statMod: 'dmgTakenPct', statModPct: 0.15, rounds: 3 },
    abilities: [{ id: 'boneNoble:curse', name: 'Decreto Amaldiçoado', cooldown: 4, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.7, statMod: 'dmgTakenPct', statModPct: 0.25, statModRounds: 3 } }] },
  { shape: 'spectralChamberlain', name: 'Camareiro Espectral', color: '#5a5a7a', minDepth: 1, hp: 100, atk: 12, def: 9, xp: 61, gold: 46, matk: 24, mdef: 13, atkType: 'magical', evasion: 0.18,
    proc: { chance: 0.18, label: 'O sussurro espectral sela sua voz!', cc: 'silence', rounds: 2 },
    abilities: [{ id: 'spectralChamberlain:whisper', name: 'Sussurro da Corte', cooldown: 6, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.6, cc: 'silence', ccRounds: 2 } }] },
  { shape: 'entombedKnight', name: 'Cavaleiro Sepultado', color: '#6a6a5a', minDepth: 1, hp: 150, atk: 23, def: 15, xp: 62, gold: 47,
    proc: { chance: 0.16, label: 'A lâmina sepultada quebra sua guarda!', statMod: 'def', statModPct: -0.2, rounds: 3 },
    abilities: [{ id: 'entombedKnight:strike', name: 'Golpe Sepultado', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.9 } }] },
  { shape: 'royalLich', name: 'Lich Real', color: '#8ad8c8', minDepth: 1, hp: 330, atk: 22, def: 14, xp: 158, gold: 122, matk: 34, mdef: 17, atkType: 'magical', isBoss: true,
    proc: { chance: 0.26, label: 'O Lich Real amaldiçoa você com magia proibida!', status: 'curse', rounds: 3 },
    phases: [
      { hpPct: 0.66, name: 'Coroa Amaldiçoada', transitionMsg: 'O Lich Real ergue sua coroa em ruínas, magia necrótica crepitando ao redor!', atkMult: 1.15,
        extraAbilities: [{ id: 'royalLich:p2', name: 'Decreto Necrótico', cooldown: 4, useChance: 0.45, effect: { kind: 'statusBite', dmgMult: 1.1, status: 'curse', statusRounds: 3 } }] },
      { hpPct: 0.33, name: 'Última Vontade Real', transitionMsg: 'Prestes a desmoronar, o Lich desata sua última e mais terrível vontade!', atkMult: 1.3, cc: 'silence', ccRounds: 2,
        extraAbilities: [{ id: 'royalLich:p3', name: 'Édito Final', cooldown: 5, useChance: 0.4, effect: { kind: 'bigHit', dmgMult: 2.0 } }] },
    ] },

  // ── Região 3 — Poço sem Fundo (especial — em sua maioria minibosses via
  // miniBossDepths, terminando num chefe final bem mais forte que os das
  // outras masmorras da região; ver lib/dungeons.ts) ──
  { shape: 'wellCrawler', name: 'Rastejante do Poço', color: '#2a2a3a', minDepth: 1, hp: 130, atk: 24, def: 10, xp: 62, gold: 47, evasion: 0.15,
    proc: { chance: 0.22, label: 'As garras do poço rasgam fundo!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'wellCrawler:claw', name: 'Garra do Abismo', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.8 } }] },
  { shape: 'voidTendril', name: 'Tentáculo do Vazio', color: '#1a1a2a', minDepth: 1, hp: 120, atk: 14, def: 9, xp: 62, gold: 47, matk: 26, mdef: 13, atkType: 'magical',
    proc: { chance: 0.20, label: 'O toque vazio drena sua força!', statMod: 'dmgTakenPct', statModPct: 0.18, rounds: 3 },
    abilities: [{ id: 'voidTendril:drain', name: 'Dreno do Vazio', cooldown: 4, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.7, statMod: 'dmgTakenPct', statModPct: 0.28, statModRounds: 3 } }] },
  { shape: 'drowningWraith', name: 'Espectro Afogante', color: '#2a3a4a', minDepth: 1, hp: 125, atk: 23, def: 9, xp: 62, gold: 47, evasion: 0.18,
    proc: { chance: 0.22, label: 'O abraço afogante rouba sua vida!', status: 'poison', rounds: 3 },
    abilities: [{ id: 'drowningWraith:grasp', name: 'Abraço Afogante', cooldown: 4, useChance: 0.45, effect: { kind: 'lifestealHit', dmgMult: 1.0, lifestealPct: 0.45 } }] },
  { shape: 'abyssalStalker', name: 'Perseguidor Abissal', color: '#0f0f1a', minDepth: 1, hp: 135, atk: 25, def: 11, xp: 63, gold: 48,
    proc: { chance: 0.16, label: 'O golpe abissal o atordoa!', cc: 'stun', rounds: 1 },
    abilities: [{ id: 'abyssalStalker:slam', name: 'Golpe Abissal', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
  { shape: 'hollowDweller', name: 'Habitante Oco', color: '#3a3a4a', minDepth: 1, hp: 140, atk: 24, def: 12, xp: 63, gold: 48,
    proc: { chance: 0.18, label: 'O uivo oco silencia você!', cc: 'silence', rounds: 2 },
    abilities: [{ id: 'hollowDweller:howl', name: 'Uivo Oco', cooldown: 6, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.6, cc: 'silence', ccRounds: 2 } }] },
  { shape: 'pitDweller', name: 'O Que Habita o Poço', color: '#050508', minDepth: 1, hp: 420, atk: 34, def: 18, xp: 195, gold: 155, matk: 26, mdef: 15, atkType: 'magical', isBoss: true,
    proc: { chance: 0.28, label: 'O Que Habita o Poço arrasta você para a escuridão sem fundo!', cc: 'stun', rounds: 1 },
    phases: [
      { hpPct: 0.70, name: 'Despertar do Abismo', transitionMsg: 'O poço range e algo imenso finalmente desperta por completo!', atkMult: 1.2,
        extraAbilities: [{ id: 'pitDweller:p2', name: 'Investida do Vazio', cooldown: 4, useChance: 0.45, effect: { kind: 'bigHit', dmgMult: 1.9 } }] },
      { hpPct: 0.40, name: 'Fome Sem Fundo', transitionMsg: 'Encurralado, o horror do poço se alimenta da própria escuridão ao redor!', atkMult: 1.35,
        extraAbilities: [{ id: 'pitDweller:p3', name: 'Fome do Abismo', cooldown: 5, useChance: 0.45, effect: { kind: 'lifestealHit', dmgMult: 1.4, lifestealPct: 0.5 } }] },
      { hpPct: 0.15, name: 'Colapso Final', transitionMsg: 'À beira da destruição, o poço inteiro parece desabar sobre você!', atkMult: 1.5, cc: 'stun', ccRounds: 1,
        extraAbilities: [{ id: 'pitDweller:p4', name: 'Colapso do Poço', cooldown: 5, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 2.5 } }] },
    ] },

  // ── Região 4 — Covil da Aranha-Rainha ──
  { shape: 'jungleSpider', name: 'Aranha da Selva', color: '#3a5a2a', minDepth: 1, hp: 175, atk: 29, def: 12, xp: 78, gold: 58, evasion: 0.15,
    proc: { chance: 0.22, label: 'As presas selvagens rasgam fundo!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'jungleSpider:pounce', name: 'Investida da Selva', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.8 } }] },
  { shape: 'silkStalker', name: 'Perseguidor de Seda', color: '#4a3a2a', minDepth: 1, hp: 160, atk: 28, def: 10, xp: 77, gold: 57, evasion: 0.20,
    proc: { chance: 0.20, label: 'A teia pegajosa o prende, atordoado!', cc: 'stun', rounds: 1 },
    abilities: [{ id: 'silkStalker:web', name: 'Rede de Seda', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
  { shape: 'spiderBrood', name: 'Ninhada de Aranhas', color: '#5a4a3a', minDepth: 1, hp: 145, atk: 26, def: 9, xp: 76, gold: 56, evasion: 0.25,
    proc: { chance: 0.20, label: 'A ninhada atrapalha sua visão!', statMod: 'accuracy', statModPct: -0.15, rounds: 3 },
    abilities: [{ id: 'spiderBrood:swarm', name: 'Enxame da Ninhada', cooldown: 4, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.7, statMod: 'accuracy', statModPct: -0.2, statModRounds: 3 } }] },
  { shape: 'webWeaverJungle', name: 'Tecelã da Selva', color: '#2a4a1a', minDepth: 1, hp: 190, atk: 30, def: 13, xp: 79, gold: 59,
    proc: { chance: 0.24, label: 'O veneno da tecelã corre em suas veias!', status: 'poison', rounds: 3 },
    abilities: [{ id: 'webWeaverJungle:venom', name: 'Veneno da Selva', cooldown: 4, useChance: 0.5, effect: { kind: 'statusBite', dmgMult: 1.0, status: 'poison', statusRounds: 3 } }] },
  { shape: 'venomousBroodling', name: 'Cria Venenosa', color: '#6a3a5a', minDepth: 1, hp: 150, atk: 27, def: 9, xp: 76, gold: 56,
    proc: { chance: 0.26, label: 'A picada da cria injeta veneno potente!', status: 'poison', rounds: 3 },
    abilities: [{ id: 'venomousBroodling:sting', name: 'Ferrão Venenoso', cooldown: 4, useChance: 0.5, effect: { kind: 'statusBite', dmgMult: 1.0, status: 'poison', statusRounds: 3 } }] },
  { shape: 'spiderQueen', name: 'Aranha-Rainha', color: '#1a0a1a', minDepth: 1, hp: 460, atk: 38, def: 17, xp: 210, gold: 165, evasion: 0.12, isBoss: true,
    proc: { chance: 0.26, label: 'A picada da Rainha injeta um veneno paralisante!', status: 'poison', rounds: 4 },
    phases: [
      { hpPct: 0.66, name: 'Ninhada Desperta', transitionMsg: 'Teias se espalham por toda a caverna — a Rainha desperta toda a sua ninhada!', atkMult: 1.15,
        extraAbilities: [{ id: 'spiderQueen:p2', name: 'Ferrão Duplo', cooldown: 4, useChance: 0.45, effect: { kind: 'statusBite', dmgMult: 1.1, status: 'poison', statusRounds: 4 } }] },
      { hpPct: 0.33, name: 'Fúria Materna', transitionMsg: 'Ferida, a Rainha ataca sem piedade para proteger sua ninhada!', atkMult: 1.3, cc: 'stun', ccRounds: 1,
        extraAbilities: [{ id: 'spiderQueen:p3', name: 'Investida da Rainha', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
    ] },

  // ── Região 4 — Cidadela em Ruínas ──
  { shape: 'ruinedSentinel', name: 'Sentinela em Ruínas', color: '#5a6a4a', minDepth: 1, hp: 200, atk: 27, def: 16, xp: 79, gold: 59,
    proc: { chance: 0.16, label: 'O golpe em ruínas o atordoa!', cc: 'stun', rounds: 1 },
    abilities: [{ id: 'ruinedSentinel:slam', name: 'Golpe Desmoronado', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
  { shape: 'vineWarrior', name: 'Guerreiro de Vinhas', color: '#3a6a2a', minDepth: 1, hp: 175, atk: 29, def: 12, xp: 78, gold: 58,
    proc: { chance: 0.22, label: 'O golpe de vinhas rasga fundo!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'vineWarrior:strike', name: 'Golpe de Vinhas', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.8 } }] },
  { shape: 'crumblingGolem', name: 'Golem Desmoronado', color: '#6a6a5a', minDepth: 1, hp: 215, atk: 26, def: 17, xp: 80, gold: 60,
    proc: { chance: 0.18, label: 'O punho de pedra quebra sua guarda!', statMod: 'def', statModPct: -0.2, rounds: 3 },
    abilities: [{ id: 'crumblingGolem:fist', name: 'Punho Desmoronado', cooldown: 5, useChance: 0.4, effect: { kind: 'weakenNova', dmgMult: 0.7, statMod: 'def', statModPct: -0.25, statModRounds: 3 } }] },
  { shape: 'junglePhantom', name: 'Fantasma da Selva', color: '#2a4a3a', minDepth: 1, hp: 165, atk: 16, def: 11, xp: 79, gold: 59, matk: 30, mdef: 15, atkType: 'magical', evasion: 0.20,
    proc: { chance: 0.18, label: 'O sussurro da selva sela sua voz!', cc: 'silence', rounds: 2 },
    abilities: [{ id: 'junglePhantom:whisper', name: 'Sussurro da Selva', cooldown: 6, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.6, cc: 'silence', ccRounds: 2 } }] },
  { shape: 'overgrownGuardian', name: 'Guardião Coberto de Vinhas', color: '#3a5a2a', minDepth: 1, hp: 195, atk: 28, def: 15, xp: 79, gold: 59,
    proc: { chance: 0.20, label: 'As vinhas prendem seus movimentos!', statMod: 'accuracy', statModPct: -0.15, rounds: 3 },
    abilities: [{ id: 'overgrownGuardian:bind', name: 'Amarras Vivas', cooldown: 4, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.7, statMod: 'accuracy', statModPct: -0.2, statModRounds: 3 } }] },
  { shape: 'citadelGuardian', name: 'Guardião da Cidadela', color: '#4a5a3a', minDepth: 1, hp: 480, atk: 36, def: 20, xp: 215, gold: 168, isBoss: true,
    proc: { chance: 0.26, label: 'O Guardião da Cidadela esmaga sua defesa!', statMod: 'def', statModPct: -0.2, rounds: 3 },
    phases: [
      { hpPct: 0.66, name: 'Cidadela Desperta', transitionMsg: 'As ruínas ao redor ressoam — o Guardião desperta em fúria!', atkMult: 1.15,
        extraAbilities: [{ id: 'citadelGuardian:p2', name: 'Investida da Cidadela', cooldown: 4, useChance: 0.45, effect: { kind: 'bigHit', dmgMult: 1.9 } }] },
      { hpPct: 0.33, name: 'Última Muralha', transitionMsg: 'Ferido, o Guardião convoca a última defesa da cidadela!', atkMult: 1.3, cc: 'stun', ccRounds: 1,
        extraAbilities: [{ id: 'citadelGuardian:p3', name: 'Colapso da Muralha', cooldown: 5, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.8, statMod: 'def', statModPct: -0.3, statModRounds: 3 } }] },
    ] },

  // ── Região 4 — Santuário Profanado (fork com Mina de Obsidiana) ──
  { shape: 'defiledPriest', name: 'Sacerdote Profanado', color: '#5a2a4a', minDepth: 1, hp: 170, atk: 15, def: 10, xp: 80, gold: 60, matk: 32, mdef: 16, atkType: 'magical',
    proc: { chance: 0.20, label: 'O rito profano o amaldiçoa!', status: 'curse', rounds: 3 },
    abilities: [{ id: 'defiledPriest:rite', name: 'Rito Profano', cooldown: 4, useChance: 0.45, effect: { kind: 'statusBite', dmgMult: 1.0, status: 'curse', statusRounds: 3 } }] },
  { shape: 'profaneIdol', name: 'Ídolo Profano', color: '#6a3a2a', minDepth: 1, hp: 210, atk: 27, def: 18, xp: 81, gold: 61,
    proc: { chance: 0.16, label: 'O golpe do ídolo o atordoa!', cc: 'stun', rounds: 1 },
    abilities: [{ id: 'profaneIdol:smite', name: 'Golpe do Ídolo', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
  { shape: 'corruptedAcolyte', name: 'Acólito Corrompido', color: '#4a2a3a', minDepth: 1, hp: 175, atk: 28, def: 11, xp: 80, gold: 60,
    proc: { chance: 0.22, label: 'A lâmina corrompida rasga fundo!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'corruptedAcolyte:strike', name: 'Golpe Corrompido', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.8 } }] },
  { shape: 'hexedStatue', name: 'Estátua Enfeitiçada', color: '#3a2a2a', minDepth: 1, hp: 220, atk: 25, def: 19, xp: 81, gold: 61,
    proc: { chance: 0.18, label: 'O olhar enfeitiçado o torna mais vulnerável!', statMod: 'dmgTakenPct', statModPct: 0.18, rounds: 3 },
    abilities: [{ id: 'hexedStatue:gaze', name: 'Olhar Enfeitiçado', cooldown: 4, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.7, statMod: 'dmgTakenPct', statModPct: 0.28, statModRounds: 3 } }] },
  { shape: 'ritualCultist', name: 'Cultista Ritualístico', color: '#5a3a3a', minDepth: 1, hp: 165, atk: 26, def: 10, xp: 79, gold: 59, matk: 20, mdef: 12,
    proc: { chance: 0.20, label: 'O canto ritualístico o silencia!', cc: 'silence', rounds: 2 },
    abilities: [{ id: 'ritualCultist:chant', name: 'Canto Ritualístico', cooldown: 6, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.6, cc: 'silence', ccRounds: 2 } }] },
  { shape: 'profaneHighPriest', name: 'Alto Sacerdote Profano', color: '#2a1a2a', minDepth: 1, hp: 470, atk: 30, def: 18, xp: 218, gold: 170, matk: 38, mdef: 19, atkType: 'magical', isBoss: true,
    proc: { chance: 0.26, label: 'O Alto Sacerdote invoca uma maldição ancestral!', status: 'curse', rounds: 4 },
    phases: [
      { hpPct: 0.66, name: 'Rito Final', transitionMsg: 'O altar profanado pulsa — o Alto Sacerdote inicia o rito final!', atkMult: 1.15,
        extraAbilities: [{ id: 'profaneHighPriest:p2', name: 'Explosão Profana', cooldown: 4, useChance: 0.45, effect: { kind: 'statusBite', dmgMult: 1.1, status: 'curse', statusRounds: 3 } }] },
      { hpPct: 0.33, name: 'Sacrifício Final', transitionMsg: 'Prestes a cair, o Sacerdote oferece a própria vida em um último rito!', atkMult: 1.3, cc: 'silence', ccRounds: 2,
        extraAbilities: [{ id: 'profaneHighPriest:p3', name: 'Sacrifício Final', cooldown: 5, useChance: 0.4, effect: { kind: 'bigHit', dmgMult: 2.0 } }] },
    ] },

  // ── Região 4 — Mina de Obsidiana (fork com Santuário Profanado) ──
  { shape: 'obsidianGolem', name: 'Golem de Obsidiana', color: '#1a1a1a', minDepth: 1, hp: 225, atk: 27, def: 19, xp: 81, gold: 61,
    proc: { chance: 0.16, label: 'O punho de obsidiana o atordoa!', cc: 'stun', rounds: 1 },
    abilities: [{ id: 'obsidianGolem:fist', name: 'Punho de Obsidiana', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
  { shape: 'magmaBat', name: 'Morcego de Magma', color: '#8a3a1a', minDepth: 1, hp: 160, atk: 28, def: 10, xp: 79, gold: 59, evasion: 0.22,
    proc: { chance: 0.22, label: 'O sopro de magma o incendeia!', status: 'burn', rounds: 3 },
    abilities: [{ id: 'magmaBat:breath', name: 'Baforada de Magma', cooldown: 4, useChance: 0.45, effect: { kind: 'statusBite', dmgMult: 1.0, status: 'burn', statusRounds: 3 } }] },
  { shape: 'obsidianMiner', name: 'Mineiro de Obsidiana', color: '#4a3a2a', minDepth: 1, hp: 180, atk: 29, def: 12, xp: 80, gold: 60,
    proc: { chance: 0.22, label: 'A picareta afiada abre um corte profundo!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'obsidianMiner:pick', name: 'Picareta Vulcânica', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.8 } }] },
  { shape: 'emberWraith', name: 'Espectro de Brasas', color: '#7a2a1a', minDepth: 1, hp: 165, atk: 16, def: 11, xp: 80, gold: 60, matk: 30, mdef: 15, atkType: 'magical', evasion: 0.18,
    proc: { chance: 0.22, label: 'As brasas espectrais o incendeiam!', status: 'burn', rounds: 3 },
    abilities: [{ id: 'emberWraith:flare', name: 'Labareda Espectral', cooldown: 4, useChance: 0.45, effect: { kind: 'statusBite', dmgMult: 1.0, status: 'burn', statusRounds: 3 } }] },
  { shape: 'obsidianBeetle', name: 'Besouro de Obsidiana', color: '#2a2a2a', minDepth: 1, hp: 210, atk: 26, def: 20, xp: 80, gold: 60,
    proc: { chance: 0.18, label: 'A carapaça pesada quebra sua guarda!', statMod: 'def', statModPct: -0.2, rounds: 3 },
    abilities: [{ id: 'obsidianBeetle:slam', name: 'Investida Blindada', cooldown: 4, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.7, statMod: 'def', statModPct: -0.25, statModRounds: 3 } }] },
  { shape: 'obsidianColossus', name: 'Colosso de Obsidiana', color: '#0f0f0f', minDepth: 1, hp: 480, atk: 34, def: 22, xp: 218, gold: 170, matk: 14, mdef: 12, isBoss: true,
    proc: { chance: 0.26, label: 'O Colosso de Obsidiana esmaga sua guarda com força vulcânica!', statMod: 'def', statModPct: -0.2, rounds: 3 },
    phases: [
      { hpPct: 0.66, name: 'Erupção Interna', transitionMsg: 'Fissuras de magma se abrem no corpo do Colosso — sua fúria vulcânica desperta!', atkMult: 1.15,
        extraAbilities: [{ id: 'obsidianColossus:p2', name: 'Avalanche Vulcânica', cooldown: 4, useChance: 0.45, effect: { kind: 'bigHit', dmgMult: 1.9 } }] },
      { hpPct: 0.33, name: 'Colapso Vulcânico', transitionMsg: 'Rachado quase ao meio, o Colosso desaba sobre você com todo o seu peso!', atkMult: 1.3, cc: 'stun', ccRounds: 1,
        extraAbilities: [{ id: 'obsidianColossus:p3', name: 'Colapso Final', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
    ] },

  // ── Região 4 — Selva Esquecida ──
  { shape: 'forgottenGuardian', name: 'Guardião Esquecido', color: '#3a4a2a', minDepth: 1, hp: 210, atk: 28, def: 17, xp: 81, gold: 61,
    proc: { chance: 0.16, label: 'O golpe de pedra esquecida o atordoa!', cc: 'stun', rounds: 1 },
    abilities: [{ id: 'forgottenGuardian:slam', name: 'Golpe Esquecido', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
  { shape: 'junglePredator', name: 'Predador da Selva', color: '#4a5a2a', minDepth: 1, hp: 180, atk: 30, def: 12, xp: 80, gold: 60, evasion: 0.15,
    proc: { chance: 0.22, label: 'As garras do predador rasgam fundo!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'junglePredator:pounce', name: 'Investida Predatória', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.8 } }] },
  { shape: 'ancientVine', name: 'Vinha Ancestral', color: '#2a5a1a', minDepth: 1, hp: 195, atk: 27, def: 14, xp: 80, gold: 60,
    proc: { chance: 0.18, label: 'As vinhas ancestrais prendem seus movimentos!', statMod: 'accuracy', statModPct: -0.15, rounds: 3 },
    abilities: [{ id: 'ancientVine:bind', name: 'Amarras Ancestrais', cooldown: 4, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.7, statMod: 'accuracy', statModPct: -0.2, statModRounds: 3 } }] },
  { shape: 'feralJaguar', name: 'Jaguar Selvagem', color: '#5a4a1a', minDepth: 1, hp: 175, atk: 31, def: 11, xp: 81, gold: 61, evasion: 0.20,
    proc: { chance: 0.22, label: 'A mordida selvagem rasga fundo!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'feralJaguar:bite', name: 'Mordida Selvagem', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.9 } }] },
  { shape: 'sporeling', name: 'Esporídeo', color: '#6a7a3a', minDepth: 1, hp: 155, atk: 24, def: 9, xp: 79, gold: 59,
    proc: { chance: 0.24, label: 'Os esporos tóxicos o envenenam!', status: 'poison', rounds: 3 },
    abilities: [{ id: 'sporeling:cloud', name: 'Nuvem de Esporos', cooldown: 4, useChance: 0.45, effect: { kind: 'statusBite', dmgMult: 1.0, status: 'poison', statusRounds: 3 } }] },
  { shape: 'forgottenColossus', name: 'Colosso Esquecido', color: '#3a4a1a', minDepth: 1, hp: 485, atk: 35, def: 20, xp: 220, gold: 172, isBoss: true,
    proc: { chance: 0.26, label: 'O Colosso Esquecido esmaga sua guarda com raízes ancestrais!', statMod: 'def', statModPct: -0.2, rounds: 3 },
    phases: [
      { hpPct: 0.66, name: 'Despertar da Selva', transitionMsg: 'A selva ao redor se contorce — o Colosso desperta por completo!', atkMult: 1.15,
        extraAbilities: [{ id: 'forgottenColossus:p2', name: 'Fúria da Selva Esquecida', cooldown: 4, useChance: 0.45, effect: { kind: 'bigHit', dmgMult: 1.9 } }] },
      { hpPct: 0.33, name: 'Raízes do Esquecimento', transitionMsg: 'Raízes antigas brotam do chão, prendendo tudo ao redor!', atkMult: 1.3, cc: 'stun', ccRounds: 1,
        extraAbilities: [{ id: 'forgottenColossus:p3', name: 'Prisão de Raízes Ancestrais', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
    ] },

  // ── Região 4 — Fortaleza dos Ossos ──
  { shape: 'boneSoldier', name: 'Soldado Ossudo', color: '#c8b898', minDepth: 1, hp: 195, atk: 29, def: 15, xp: 81, gold: 61,
    proc: { chance: 0.20, label: 'A lâmina ossuda abre um corte profundo!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'boneSoldier:strike', name: 'Golpe Ossudo', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.8 } }] },
  { shape: 'boneArcher', name: 'Arqueiro Ossudo', color: '#a89878', minDepth: 1, hp: 170, atk: 31, def: 11, xp: 81, gold: 61, evasion: 0.15,
    proc: { chance: 0.20, label: 'A flecha ossuda rasga sua carne!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'boneArcher:volley', name: 'Rajada Ossuda', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.8 } }] },
  { shape: 'marrowGolem', name: 'Golem de Medula', color: '#8a7a5a', minDepth: 1, hp: 230, atk: 27, def: 20, xp: 82, gold: 62,
    proc: { chance: 0.16, label: 'O punho de ossos o atordoa!', cc: 'stun', rounds: 1 },
    abilities: [{ id: 'marrowGolem:fist', name: 'Punho de Medula', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
  { shape: 'boneCatapultBeast', name: 'Fera Catapulta', color: '#7a6a4a', minDepth: 1, hp: 200, atk: 33, def: 13, xp: 82, gold: 62,
    proc: { chance: 0.18, label: 'O impacto catapultado quebra sua guarda!', statMod: 'def', statModPct: -0.2, rounds: 3 },
    abilities: [{ id: 'boneCatapultBeast:launch', name: 'Lançamento Ósseo', cooldown: 5, useChance: 0.4, effect: { kind: 'weakenNova', dmgMult: 0.8, statMod: 'def', statModPct: -0.25, statModRounds: 3 } }] },
  { shape: 'ossuaryWraith', name: 'Espectro do Ossário', color: '#5a5a4a', minDepth: 1, hp: 175, atk: 16, def: 12, xp: 81, gold: 61, matk: 32, mdef: 16, atkType: 'magical', evasion: 0.18,
    proc: { chance: 0.18, label: 'O lamento do ossário sela sua voz!', cc: 'silence', rounds: 2 },
    abilities: [{ id: 'ossuaryWraith:wail', name: 'Lamento do Ossário', cooldown: 6, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.6, cc: 'silence', ccRounds: 2 } }] },
  { shape: 'boneWarlord', name: 'Senhor de Guerra Ossudo', color: '#9a8a68', minDepth: 1, hp: 490, atk: 37, def: 21, xp: 222, gold: 174, isBoss: true,
    proc: { chance: 0.26, label: 'O Senhor de Guerra abre um corte profundo com sua lâmina ossuda!', status: 'bleed', rounds: 3 },
    phases: [
      { hpPct: 0.66, name: 'Legião Ressuscitada', transitionMsg: 'Ossos se erguem por toda a fortaleza — o Senhor de Guerra convoca sua legião!', atkMult: 1.15,
        extraAbilities: [{ id: 'boneWarlord:p2', name: 'Comando da Legião', cooldown: 4, useChance: 0.45, effect: { kind: 'bigHit', dmgMult: 1.9 } }] },
      { hpPct: 0.33, name: 'Última Ordem', transitionMsg: 'Ferido, o Senhor de Guerra dá sua última e mais brutal ordem!', atkMult: 1.3, cc: 'stun', ccRounds: 1,
        extraAbilities: [{ id: 'boneWarlord:p3', name: 'Última Ordem', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
    ] },

  // ── Região 4 — Torre dos Ecos (especial — em sua maioria minibosses via
  // miniBossDepths, terminando num chefe final bem mais forte que os das
  // outras masmorras da região; ver lib/dungeons.ts) ──
  { shape: 'echoWraith', name: 'Espectro do Eco', color: '#5a4a7a', minDepth: 1, hp: 185, atk: 29, def: 13, xp: 82, gold: 62, evasion: 0.18,
    proc: { chance: 0.20, label: 'O eco cortante rasga fundo!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'echoWraith:cut', name: 'Corte Ressoante', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.8 } }] },
  { shape: 'resonantSpecter', name: 'Espectro Ressonante', color: '#4a3a6a', minDepth: 1, hp: 175, atk: 16, def: 12, xp: 82, gold: 62, matk: 33, mdef: 16, atkType: 'magical', evasion: 0.20,
    proc: { chance: 0.18, label: 'A ressonância arcana sela sua voz!', cc: 'silence', rounds: 2 },
    abilities: [{ id: 'resonantSpecter:hum', name: 'Zumbido Ressonante', cooldown: 6, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.6, cc: 'silence', ccRounds: 2 } }] },
  { shape: 'mirroredHorror', name: 'Horror Espelhado', color: '#3a3a3a', minDepth: 1, hp: 200, atk: 30, def: 14, xp: 83, gold: 63,
    proc: { chance: 0.18, label: 'O reflexo distorcido o torna mais vulnerável!', statMod: 'dmgTakenPct', statModPct: 0.18, rounds: 3 },
    abilities: [{ id: 'mirroredHorror:distort', name: 'Distorção Espelhada', cooldown: 4, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.7, statMod: 'dmgTakenPct', statModPct: 0.28, statModRounds: 3 } }] },
  { shape: 'echoSentinel', name: 'Sentinela do Eco', color: '#6a5a8a', minDepth: 1, hp: 220, atk: 28, def: 17, xp: 83, gold: 63,
    proc: { chance: 0.16, label: 'O golpe ressoante o atordoa!', cc: 'stun', rounds: 1 },
    abilities: [{ id: 'echoSentinel:slam', name: 'Golpe Ressoante', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
  { shape: 'hollowChant', name: 'Cântico Oco', color: '#2a2a4a', minDepth: 1, hp: 190, atk: 27, def: 13, xp: 82, gold: 62, matk: 24, mdef: 13,
    proc: { chance: 0.20, label: 'O cântico oco te amaldiçoa!', status: 'curse', rounds: 3 },
    abilities: [{ id: 'hollowChant:chant', name: 'Cântico Amaldiçoado', cooldown: 4, useChance: 0.45, effect: { kind: 'statusBite', dmgMult: 1.0, status: 'curse', statusRounds: 3 } }] },
  { shape: 'echoSovereign', name: 'Soberano dos Ecos', color: '#7a6ab8', minDepth: 1, hp: 500, atk: 40, def: 21, xp: 235, gold: 182, matk: 30, mdef: 18, atkType: 'magical', isBoss: true,
    proc: { chance: 0.28, label: 'O Soberano dos Ecos multiplica seus golpes em ressonância!', cc: 'stun', rounds: 1 },
    phases: [
      { hpPct: 0.70, name: 'Ecos Ressoantes', transitionMsg: 'A torre inteira ressoa — o Soberano canaliza cada eco já aprisionado nela!', atkMult: 1.2,
        extraAbilities: [{ id: 'echoSovereign:p2', name: 'Coro dos Ecos', cooldown: 4, useChance: 0.45, effect: { kind: 'bigHit', dmgMult: 1.9 } }] },
      { hpPct: 0.40, name: 'Ressonância Fatal', transitionMsg: 'Ferido, o Soberano desata uma ressonância capaz de rachar pedra!', atkMult: 1.35, cc: 'silence', ccRounds: 2,
        extraAbilities: [{ id: 'echoSovereign:p3', name: 'Ressonância Fatal', cooldown: 5, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.9, statMod: 'dmgTakenPct', statModPct: 0.3, statModRounds: 3 } }] },
      { hpPct: 0.15, name: 'Silêncio Final', transitionMsg: 'Prestes a cair, o Soberano desata o eco mais alto e final da torre!', atkMult: 1.5,
        extraAbilities: [{ id: 'echoSovereign:p4', name: 'Eco Final', cooldown: 5, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 2.5 } }] },
    ] },

  // ── Região 5 — Abismo de Gelo ──
  { shape: 'glacialWraith', name: 'Espectro Glacial', color: '#7aa8c8', minDepth: 1, hp: 245, atk: 33, def: 15, xp: 108, gold: 80, matk: 20, mdef: 12, evasion: 0.18,
    proc: { chance: 0.20, label: 'O toque glacial o congela por dentro!', status: 'burn', rounds: 3 },
    abilities: [{ id: 'glacialWraith:touch', name: 'Toque Glacial', cooldown: 4, useChance: 0.45, effect: { kind: 'statusBite', dmgMult: 1.0, status: 'burn', statusRounds: 3 } }] },
  { shape: 'abyssalIceElemental', name: 'Elemental de Gelo Abissal', color: '#4a7a9a', minDepth: 1, hp: 270, atk: 20, def: 17, xp: 109, gold: 81, matk: 36, mdef: 18, atkType: 'magical',
    proc: { chance: 0.20, label: 'O sopro abissal congelante o incendeia por dentro!', status: 'burn', rounds: 3 },
    abilities: [{ id: 'abyssalIceElemental:blast', name: 'Explosão Glacial Abissal', cooldown: 4, useChance: 0.45, effect: { kind: 'statusBite', dmgMult: 1.1, status: 'burn', statusRounds: 3 } }] },
  { shape: 'frostcrawler', name: 'Rastejante Gélido', color: '#8ab0c8', minDepth: 1, hp: 230, atk: 35, def: 14, xp: 107, gold: 79, evasion: 0.15,
    proc: { chance: 0.22, label: 'As garras congeladas rasgam fundo!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'frostcrawler:claw', name: 'Garra Congelante', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.8 } }] },
  { shape: 'iceBehemoth', name: 'Behemoth de Gelo', color: '#6a8ab0', minDepth: 1, hp: 300, atk: 30, def: 22, xp: 110, gold: 82,
    proc: { chance: 0.16, label: 'O golpe do behemoth o atordoa!', cc: 'stun', rounds: 1 },
    abilities: [{ id: 'iceBehemoth:slam', name: 'Golpe do Behemoth', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
  { shape: 'hollowFrost', name: 'Gélido Oco', color: '#9ac8e0', minDepth: 1, hp: 220, atk: 34, def: 13, xp: 107, gold: 79,
    proc: { chance: 0.18, label: 'O frio oco quebra sua guarda!', statMod: 'def', statModPct: -0.2, rounds: 3 },
    abilities: [{ id: 'hollowFrost:crack', name: 'Rachadura Gélida', cooldown: 4, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.7, statMod: 'def', statModPct: -0.25, statModRounds: 3 } }] },
  { shape: 'glacialAbyssLord', name: 'Senhor do Abismo Glacial', color: '#bcdff2', minDepth: 1, hp: 640, atk: 44, def: 24, xp: 260, gold: 195, matk: 36, mdef: 20, atkType: 'magical', isBoss: true,
    proc: { chance: 0.26, label: 'O Senhor do Abismo Glacial congela você por completo, atordoado!', cc: 'stun', rounds: 1 },
    phases: [
      { hpPct: 0.66, name: 'Fenda Glacial', transitionMsg: 'O gelo ao redor racha — o Senhor do Abismo desperta em sua forma verdadeira!', atkMult: 1.15,
        extraAbilities: [{ id: 'glacialAbyssLord:p2', name: 'Fenda Glacial', cooldown: 4, useChance: 0.45, effect: { kind: 'bigHit', dmgMult: 1.9 } }] },
      { hpPct: 0.33, name: 'Zero Abissal', transitionMsg: 'Ferido, o Senhor libera o frio absoluto do próprio abismo!', atkMult: 1.3, cc: 'stun', ccRounds: 1,
        extraAbilities: [{ id: 'glacialAbyssLord:p3', name: 'Zero Abissal', cooldown: 5, useChance: 0.4, effect: { kind: 'bigHit', dmgMult: 2.1 } }] },
    ] },

  // ── Região 5 — Ruínas Vulcânicas ──
  { shape: 'magmaGolem', name: 'Golem de Magma', color: '#a5401f', minDepth: 1, hp: 290, atk: 32, def: 20, xp: 109, gold: 81,
    proc: { chance: 0.22, label: 'O golpe de magma o incendeia!', status: 'burn', rounds: 3 },
    abilities: [{ id: 'magmaGolem:fist', name: 'Punho de Magma', cooldown: 4, useChance: 0.45, effect: { kind: 'statusBite', dmgMult: 1.0, status: 'burn', statusRounds: 3 } }] },
  { shape: 'ashWraith', name: 'Espectro de Cinzas', color: '#5a4a4a', minDepth: 1, hp: 240, atk: 20, def: 15, xp: 108, gold: 80, matk: 34, mdef: 17, atkType: 'magical', evasion: 0.18,
    proc: { chance: 0.18, label: 'As cinzas ardentes sufocam sua voz!', cc: 'silence', rounds: 2 },
    abilities: [{ id: 'ashWraith:choke', name: 'Sufoco de Cinzas', cooldown: 6, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.6, cc: 'silence', ccRounds: 2 } }] },
  { shape: 'emberBat', name: 'Morcego de Brasas', color: '#8a3a1a', minDepth: 1, hp: 220, atk: 34, def: 13, xp: 108, gold: 80, evasion: 0.22,
    proc: { chance: 0.22, label: 'As garras em brasa o incendeiam!', status: 'burn', rounds: 3 },
    abilities: [{ id: 'emberBat:claw', name: 'Garra Flamejante', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.8 } }] },
  { shape: 'volcanicStalker', name: 'Perseguidor Vulcânico', color: '#6a2a1a', minDepth: 1, hp: 250, atk: 36, def: 16, xp: 109, gold: 81, evasion: 0.15,
    proc: { chance: 0.22, label: 'As garras vulcânicas rasgam fundo!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'volcanicStalker:pounce', name: 'Investida Vulcânica', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.9 } }] },
  { shape: 'cinderHound', name: 'Cão de Cinzas', color: '#4a2a1a', minDepth: 1, hp: 235, atk: 33, def: 14, xp: 108, gold: 80,
    proc: { chance: 0.18, label: 'O uivo de cinzas o atordoa!', cc: 'stun', rounds: 1 },
    abilities: [{ id: 'cinderHound:howl', name: 'Uivo Cinzento', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
  { shape: 'infernoColossus', name: 'Colosso Infernal', color: '#7a1a12', minDepth: 1, hp: 650, atk: 46, def: 25, xp: 262, gold: 198, matk: 24, mdef: 15, isBoss: true,
    proc: { chance: 0.26, label: 'O Colosso Infernal o incendeia até os ossos!', status: 'burn', rounds: 4 },
    phases: [
      { hpPct: 0.66, name: 'Erupção Total', transitionMsg: 'As ruínas vulcânicas tremem — o Colosso entra em erupção total!', atkMult: 1.15,
        extraAbilities: [{ id: 'infernoColossus:p2', name: 'Avalanche de Lava', cooldown: 4, useChance: 0.45, effect: { kind: 'bigHit', dmgMult: 1.9 } }] },
      { hpPct: 0.33, name: 'Colapso Vulcânico', transitionMsg: 'Rachado por dentro, o Colosso desaba em uma última onda de lava!', atkMult: 1.3, cc: 'stun', ccRounds: 1,
        extraAbilities: [{ id: 'infernoColossus:p3', name: 'Onda de Lava', cooldown: 5, useChance: 0.4, effect: { kind: 'bigHit', dmgMult: 2.1 } }] },
    ] },

  // ── Região 5 — Covil do Dragão Ancião (fork com Salão dos Titãs) ──
  { shape: 'ancientDrakeling', name: 'Draguinho Ancião', color: '#a5271f', minDepth: 1, hp: 250, atk: 22, def: 16, xp: 110, gold: 82, matk: 34, mdef: 17, atkType: 'magical',
    proc: { chance: 0.22, label: 'O sopro ancião o incendeia!', status: 'burn', rounds: 3 },
    abilities: [{ id: 'ancientDrakeling:breath', name: 'Baforada Ancestral', cooldown: 4, useChance: 0.45, effect: { kind: 'statusBite', dmgMult: 1.1, status: 'burn', statusRounds: 3 } }] },
  { shape: 'dragonCultistElder', name: 'Cultista Dracônico Ancião', color: '#7a2a2a', minDepth: 1, hp: 230, atk: 32, def: 14, xp: 109, gold: 81,
    proc: { chance: 0.18, label: 'O cântico ancião o amaldiçoa!', statMod: 'dmgTakenPct', statModPct: 0.18, rounds: 3 },
    abilities: [{ id: 'dragonCultistElder:blessing', name: 'Bênção Dracônica Ancestral', cooldown: 4, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.7, statMod: 'dmgTakenPct', statModPct: 0.28, statModRounds: 3 } }] },
  { shape: 'scaleWyrmling', name: 'Serpente Escamosa', color: '#4a6a3a', minDepth: 1, hp: 260, atk: 35, def: 17, xp: 110, gold: 82, evasion: 0.15,
    proc: { chance: 0.22, label: 'As garras escamosas rasgam fundo!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'scaleWyrmling:claw', name: 'Garra Escamosa', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.9 } }] },
  { shape: 'drakeGuardian', name: 'Guardião Dracônico', color: '#3a6a5a', minDepth: 1, hp: 300, atk: 30, def: 22, xp: 111, gold: 83,
    proc: { chance: 0.18, label: 'O golpe de cauda quebra sua guarda!', statMod: 'def', statModPct: -0.2, rounds: 3 },
    abilities: [{ id: 'drakeGuardian:tail', name: 'Golpe de Cauda Ancestral', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
  { shape: 'emberDrake', name: 'Draque de Brasas', color: '#c9531f', minDepth: 1, hp: 240, atk: 34, def: 15, xp: 109, gold: 81, matk: 24, mdef: 14, atkType: 'magical',
    proc: { chance: 0.22, label: 'O sopro em brasa o incendeia!', status: 'burn', rounds: 3 },
    abilities: [{ id: 'emberDrake:breath', name: 'Baforada em Brasa', cooldown: 4, useChance: 0.45, effect: { kind: 'statusBite', dmgMult: 1.0, status: 'burn', statusRounds: 3 } }] },
  { shape: 'elderDragon', name: 'Dragão Ancião', color: '#8a1a12', minDepth: 1, hp: 660, atk: 42, def: 24, xp: 265, gold: 200, matk: 44, mdef: 22, atkType: 'magical', isBoss: true,
    proc: { chance: 0.26, label: 'O sopro do Dragão Ancião o incendeia até os ossos!', status: 'burn', rounds: 4 },
    phases: [
      { hpPct: 0.66, name: 'Fúria Ancestral', transitionMsg: 'O Dragão Ancião ruge — chamas ancestrais despertam em seu peito!', atkMult: 1.15,
        extraAbilities: [{ id: 'elderDragon:p2', name: 'Baforada Ancestral Intensa', cooldown: 4, useChance: 0.45, effect: { kind: 'statusBite', dmgMult: 1.2, status: 'burn', statusRounds: 4 } }] },
      { hpPct: 0.33, name: 'Fúria Milenar', transitionMsg: 'Ferido pela primeira vez em séculos, o Dragão Ancião ataca sem piedade!', atkMult: 1.3, cc: 'stun', ccRounds: 1,
        extraAbilities: [{ id: 'elderDragon:p3', name: 'Investida Milenar', cooldown: 5, useChance: 0.4, effect: { kind: 'bigHit', dmgMult: 2.2 } }] },
    ] },

  // ── Região 5 — Salão dos Titãs (fork com Covil do Dragão Ancião) ──
  { shape: 'titanGuardian', name: 'Guardião Titânico', color: '#6a6a6a', minDepth: 1, hp: 310, atk: 33, def: 23, xp: 111, gold: 83,
    proc: { chance: 0.16, label: 'O punho titânico o atordoa!', cc: 'stun', rounds: 1 },
    abilities: [{ id: 'titanGuardian:fist', name: 'Punho Titânico', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
  { shape: 'stoneColossus', name: 'Colosso de Pedra', color: '#7a7a6a', minDepth: 1, hp: 330, atk: 31, def: 25, xp: 112, gold: 84,
    proc: { chance: 0.18, label: 'O golpe colossal quebra sua guarda!', statMod: 'def', statModPct: -0.2, rounds: 3 },
    abilities: [{ id: 'stoneColossus:slam', name: 'Golpe Colossal', cooldown: 4, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.8, statMod: 'def', statModPct: -0.25, statModRounds: 3 } }] },
  { shape: 'ancientSentinel', name: 'Sentinela Ancestral', color: '#5a5a5a', minDepth: 1, hp: 270, atk: 20, def: 18, xp: 110, gold: 82, matk: 38, mdef: 19, atkType: 'magical',
    proc: { chance: 0.20, label: 'O raio ancestral o silencia!', cc: 'silence', rounds: 2 },
    abilities: [{ id: 'ancientSentinel:beam', name: 'Raio Ancestral', cooldown: 6, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.6, cc: 'silence', ccRounds: 2 } }] },
  { shape: 'runicGolem', name: 'Golem Rúnico', color: '#8a8a4a', minDepth: 1, hp: 290, atk: 32, def: 21, xp: 111, gold: 83,
    proc: { chance: 0.18, label: 'As runas explosivas o enfraquecem!', statMod: 'dmgTakenPct', statModPct: 0.18, rounds: 3 },
    abilities: [{ id: 'runicGolem:rune', name: 'Explosão Rúnica', cooldown: 4, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.8, statMod: 'dmgTakenPct', statModPct: 0.28, statModRounds: 3 } }] },
  { shape: 'titanWarden', name: 'Vigia Titânico', color: '#6a6a4a', minDepth: 1, hp: 300, atk: 34, def: 22, xp: 111, gold: 83,
    proc: { chance: 0.22, label: 'O golpe do vigia rasga fundo!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'titanWarden:strike', name: 'Golpe do Vigia', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.9 } }] },
  { shape: 'fallenTitan', name: 'Titã Caído', color: '#4a4a3a', minDepth: 1, hp: 665, atk: 40, def: 27, xp: 266, gold: 202, matk: 20, mdef: 15, isBoss: true,
    proc: { chance: 0.26, label: 'O Titã Caído esmaga sua defesa com força primordial!', statMod: 'def', statModPct: -0.22, rounds: 3 },
    phases: [
      { hpPct: 0.66, name: 'Despertar Primordial', transitionMsg: 'O salão inteiro treme — o Titã Caído desperta de seu sono milenar!', atkMult: 1.15,
        extraAbilities: [{ id: 'fallenTitan:p2', name: 'Investida Primordial', cooldown: 4, useChance: 0.45, effect: { kind: 'bigHit', dmgMult: 1.9 } }] },
      { hpPct: 0.33, name: 'Última Ruína', transitionMsg: 'Ferido, o Titã Caído desaba o próprio salão sobre você!', atkMult: 1.3, cc: 'stun', ccRounds: 1,
        extraAbilities: [{ id: 'fallenTitan:p3', name: 'Colapso do Salão', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
    ] },

  // ── Região 5 — Necrópole Real ──
  { shape: 'royalWraith', name: 'Espectro Real', color: '#8a7a5a', minDepth: 1, hp: 260, atk: 22, def: 16, xp: 111, gold: 83, matk: 36, mdef: 18, atkType: 'magical', evasion: 0.18,
    proc: { chance: 0.20, label: 'A maldição real o torna mais vulnerável!', statMod: 'dmgTakenPct', statModPct: 0.18, rounds: 3 },
    abilities: [{ id: 'royalWraith:curse', name: 'Maldição Real', cooldown: 4, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.7, statMod: 'dmgTakenPct', statModPct: 0.28, statModRounds: 3 } }] },
  { shape: 'ashenGuard', name: 'Guarda Acinzentado', color: '#6a6a5a', minDepth: 1, hp: 300, atk: 33, def: 22, xp: 112, gold: 84,
    proc: { chance: 0.16, label: 'O golpe acinzentado o atordoa!', cc: 'stun', rounds: 1 },
    abilities: [{ id: 'ashenGuard:slam', name: 'Golpe Acinzentado', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
  { shape: 'cursedEmbalmer', name: 'Embalsamador Amaldiçoado', color: '#7a6a4a', minDepth: 1, hp: 250, atk: 34, def: 15, xp: 111, gold: 83,
    proc: { chance: 0.24, label: 'As toxinas de embalsamamento o envenenam!', status: 'poison', rounds: 3 },
    abilities: [{ id: 'cursedEmbalmer:toxin', name: 'Toxina de Embalsamamento', cooldown: 4, useChance: 0.45, effect: { kind: 'statusBite', dmgMult: 1.0, status: 'poison', statusRounds: 3 } }] },
  { shape: 'royalMummy', name: 'Múmia Real', color: '#d8c898', minDepth: 1, hp: 280, atk: 32, def: 18, xp: 111, gold: 83,
    proc: { chance: 0.20, label: 'As bandagens reais o envenenam!', status: 'poison', rounds: 3 },
    abilities: [{ id: 'royalMummy:touch', name: 'Toque Real Podre', cooldown: 4, useChance: 0.45, effect: { kind: 'statusBite', dmgMult: 1.0, status: 'poison', statusRounds: 3 } }] },
  { shape: 'deathHerald', name: 'Arauto da Morte', color: '#3a3a3a', minDepth: 1, hp: 240, atk: 36, def: 15, xp: 111, gold: 83, evasion: 0.15,
    proc: { chance: 0.22, label: 'O golpe do arauto rasga fundo!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'deathHerald:strike', name: 'Golpe do Arauto', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.9 } }] },
  { shape: 'royalNecromancer', name: 'Necromante Real', color: '#4a2a5a', minDepth: 1, hp: 660, atk: 26, def: 20, xp: 268, gold: 205, matk: 46, mdef: 22, atkType: 'magical', isBoss: true,
    proc: { chance: 0.26, label: 'O Necromante Real amaldiçoa você com magia proibida!', status: 'curse', rounds: 4 },
    phases: [
      { hpPct: 0.66, name: 'Legião Real Erguida', transitionMsg: 'A Necrópole treme — o Necromante Real ergue toda a sua legião de outrora!', atkMult: 1.15,
        extraAbilities: [{ id: 'royalNecromancer:p2', name: 'Decreto Necromântico', cooldown: 4, useChance: 0.45, effect: { kind: 'statusBite', dmgMult: 1.1, status: 'curse', statusRounds: 4 } }] },
      { hpPct: 0.33, name: 'Última Vontade Real', transitionMsg: 'Prestes a cair, o Necromante desata sua última e mais terrível magia!', atkMult: 1.3, cc: 'silence', ccRounds: 2,
        extraAbilities: [{ id: 'royalNecromancer:p3', name: 'Édito Final', cooldown: 5, useChance: 0.4, effect: { kind: 'bigHit', dmgMult: 2.2 } }] },
    ] },

  // ── Região 5 — Palácio Submerso ──
  { shape: 'drownedCourtier', name: 'Cortesão Afogado', color: '#3a5a6a', minDepth: 1, hp: 250, atk: 22, def: 16, xp: 112, gold: 84, matk: 34, mdef: 17, atkType: 'magical',
    proc: { chance: 0.22, label: 'A água estagnada o envenena!', status: 'poison', rounds: 3 },
    abilities: [{ id: 'drownedCourtier:water', name: 'Água Estagnada', cooldown: 4, useChance: 0.45, effect: { kind: 'statusBite', dmgMult: 1.0, status: 'poison', statusRounds: 3 } }] },
  { shape: 'submergedGuard', name: 'Guarda Submerso', color: '#2a4a5a', minDepth: 1, hp: 300, atk: 33, def: 22, xp: 112, gold: 84,
    proc: { chance: 0.16, label: 'O golpe encharcado o atordoa!', cc: 'stun', rounds: 1 },
    abilities: [{ id: 'submergedGuard:slam', name: 'Golpe Encharcado', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
  { shape: 'tidalWraith', name: 'Espectro das Marés', color: '#4a6a7a', minDepth: 1, hp: 260, atk: 34, def: 17, xp: 112, gold: 84, evasion: 0.18,
    proc: { chance: 0.20, label: 'A maré espectral drena sua força!', statMod: 'dmgTakenPct', statModPct: 0.18, rounds: 3 },
    abilities: [{ id: 'tidalWraith:drain', name: 'Dreno das Marés', cooldown: 4, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.7, statMod: 'dmgTakenPct', statModPct: 0.28, statModRounds: 3 } }] },
  { shape: 'coralHorror', name: 'Horror de Coral', color: '#6a3a5a', minDepth: 1, hp: 280, atk: 32, def: 19, xp: 112, gold: 84,
    proc: { chance: 0.18, label: 'Os espinhos de coral quebram sua guarda!', statMod: 'def', statModPct: -0.2, rounds: 3 },
    abilities: [{ id: 'coralHorror:spike', name: 'Espinho de Coral', cooldown: 4, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.7, statMod: 'def', statModPct: -0.25, statModRounds: 3 } }] },
  { shape: 'deepOneAcolyte', name: 'Acólito das Profundezas', color: '#2a3a4a', minDepth: 1, hp: 255, atk: 21, def: 16, xp: 111, gold: 83, matk: 36, mdef: 18, atkType: 'magical', evasion: 0.15,
    proc: { chance: 0.18, label: 'O cântico abissal sela sua voz!', cc: 'silence', rounds: 2 },
    abilities: [{ id: 'deepOneAcolyte:chant', name: 'Cântico das Profundezas', cooldown: 6, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.6, cc: 'silence', ccRounds: 2 } }] },
  { shape: 'drownedMonarch', name: 'Monarca Afogado', color: '#1a3a4a', minDepth: 1, hp: 665, atk: 42, def: 24, xp: 270, gold: 208, matk: 34, mdef: 18, atkType: 'magical', isBoss: true,
    proc: { chance: 0.26, label: 'O Monarca Afogado arrasta você para as profundezas!', cc: 'stun', rounds: 1 },
    phases: [
      { hpPct: 0.66, name: 'Maré do Trono', transitionMsg: 'O palácio submerso range — o Monarca Afogado ergue-se de seu trono aquático!', atkMult: 1.15,
        extraAbilities: [{ id: 'drownedMonarch:p2', name: 'Maré do Trono', cooldown: 4, useChance: 0.45, effect: { kind: 'bigHit', dmgMult: 1.9 } }] },
      { hpPct: 0.33, name: 'Última Maré Real', transitionMsg: 'Ferido, o Monarca desata a última maré de seu reino afundado!', atkMult: 1.3, cc: 'stun', ccRounds: 1,
        extraAbilities: [{ id: 'drownedMonarch:p3', name: 'Última Maré Real', cooldown: 5, useChance: 0.4, effect: { kind: 'bigHit', dmgMult: 2.2 } }] },
    ] },

  // ── Região 5 — Arena do Campeão (especial — em sua maioria minibosses via
  // miniBossDepths, terminando num chefe final bem mais forte que os das
  // outras masmorras da região; ver lib/dungeons.ts) ──
  { shape: 'championGladiator', name: 'Gladiador Campeão', color: '#8a2a2a', minDepth: 1, hp: 270, atk: 36, def: 19, xp: 113, gold: 85,
    proc: { chance: 0.22, label: 'A espada campeã corta fundo!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'championGladiator:strike', name: 'Golpe Campeão', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.9 } }] },
  { shape: 'arenaChampionBeast', name: 'Fera Campeã da Arena', color: '#6a4a2a', minDepth: 1, hp: 300, atk: 34, def: 18, xp: 113, gold: 85, evasion: 0.15,
    proc: { chance: 0.18, label: 'A investida da fera o atordoa!', cc: 'stun', rounds: 1 },
    abilities: [{ id: 'arenaChampionBeast:charge', name: 'Investida Campeã', cooldown: 5, useChance: 0.4, effect: { kind: 'controlSlam', dmgMult: 0.7, cc: 'stun', ccRounds: 1 } }] },
  { shape: 'veteranDuelist', name: 'Duelista Veterano', color: '#4a4a2a', minDepth: 1, hp: 250, atk: 38, def: 16, xp: 113, gold: 85,
    proc: { chance: 0.22, label: 'O golpe do duelista corta fundo!', status: 'bleed', rounds: 3 },
    abilities: [{ id: 'veteranDuelist:execute', name: 'Execução do Duelista', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 2.0 } }] },
  { shape: 'arenaWarlord', name: 'Senhor de Guerra da Arena', color: '#5a3a2a', minDepth: 1, hp: 280, atk: 30, def: 20, xp: 112, gold: 84, matk: 22, mdef: 12,
    proc: { chance: 0.18, label: 'O grito de guerra o enfraquece!', statMod: 'dmgTakenPct', statModPct: 0.18, rounds: 3 },
    abilities: [{ id: 'arenaWarlord:cry', name: 'Grito de Guerra', cooldown: 4, useChance: 0.45, effect: { kind: 'weakenNova', dmgMult: 0.7, statMod: 'dmgTakenPct', statModPct: 0.28, statModRounds: 3 } }] },
  { shape: 'bloodiedChampion', name: 'Campeão Ensanguentado', color: '#7a2a2a', minDepth: 1, hp: 260, atk: 36, def: 18, xp: 112, gold: 84, evasion: 0.12,
    proc: { chance: 0.18, label: 'O golpe ensanguentado o atordoa!', cc: 'stun', rounds: 1 },
    abilities: [{ id: 'bloodiedChampion:glory', name: 'Glória Ensanguentada', cooldown: 4, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 1.9 } }] },
  { shape: 'eternalChampion', name: 'Campeão Eterno', color: '#9a3a2a', minDepth: 1, hp: 700, atk: 48, def: 26, xp: 285, gold: 225, isBoss: true,
    proc: { chance: 0.28, label: 'O Campeão Eterno abre um corte profundo com sua lâmina lendária!', status: 'bleed', rounds: 4 },
    phases: [
      { hpPct: 0.70, name: 'Fúria do Campeão', transitionMsg: 'A arena inteira ruge — o Campeão Eterno entra em fúria de combate!', atkMult: 1.2,
        extraAbilities: [{ id: 'eternalChampion:p2', name: 'Golpe Eterno', cooldown: 4, useChance: 0.45, effect: { kind: 'bigHit', dmgMult: 1.9 } }] },
      { hpPct: 0.40, name: 'Glória Imortal', transitionMsg: 'Ferido mas invicto após incontáveis eras, o Campeão ataca sem piedade!', atkMult: 1.35, cc: 'stun', ccRounds: 1,
        extraAbilities: [{ id: 'eternalChampion:p3', name: 'Última Investida Eterna', cooldown: 5, useChance: 0.45, effect: { kind: 'controlSlam', dmgMult: 0.8, cc: 'stun', ccRounds: 1 } }] },
      { hpPct: 0.15, name: 'Glória Final', transitionMsg: 'À beira da derrota após uma eternidade invicto, o Campeão desata tudo o que resta!', atkMult: 1.55,
        extraAbilities: [{ id: 'eternalChampion:p4', name: 'Glória Final', cooldown: 5, useChance: 0.5, effect: { kind: 'bigHit', dmgMult: 2.6 } }] },
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

// Every enemy used to act on the exact same fixed pace (ATTACK_INTERVAL in
// DungeonPanel.tsx) regardless of shape — a bat swarm and a stone golem
// landed hits at an identical rate, which read as wrong the moment you
// actually paid attention to what these things are supposed to be. This
// multiplies that base interval the same way the player's own AGI already
// does (see nextPlayerDelay) — >1 acts faster/more often, <1 slower.
// Unlisted shapes (the large majority — goblins, skeletons, most bosses,
// etc.) stay at the original baseline pace; only shapes with an obvious,
// unambiguous agility identity got a number, rather than guessing at every
// one of the ~70 shapes in TIERS above.
const SPEED_MULT_BY_SHAPE: Partial<Record<EnemyShape, number>> = {
  // Fast — small, airborne, or famously quick shapes.
  ruinBat: 1.35, batSwarm: 1.35,
  carrionCrow: 1.3, deathCrow: 1.3,
  cursedWisp: 1.3, gasWisp: 1.3, darkFairy: 1.3,
  huntingSpider: 1.2, venomSpider: 1.2, giantSpider: 1.15, spiderlingSwarm: 1.25, darkWeaver: 1.2,
  swampViper: 1.25, fireSerpent: 1.2,
  wolf: 1.15, goblinWolfRider: 1.15, ghostWolf: 1.2,
  koboldRaider: 1.15,
  wildWyvern: 1.15, dragonHatchling: 1.1,
  greedyWraith: 1.15, elvenWraith: 1.15, wailingGhost: 1.15, crawlingShadow: 1.15,
  watchingEye: 1.1, gargoyle: 1.1,

  // Slow — heavy, armored, massive, or shambling shapes.
  stoneGuardian: 0.8, oreGolem: 0.78, oreTitan: 0.72, crystalGolem: 0.78,
  scaledGuardian: 0.85, corruptedGuardian: 0.82, ancestralGuardian: 0.75,
  boneTyrant: 0.78, swampLeviathan: 0.72, corruptedEnt: 0.75, forestHeart: 0.7,
  wrappedMummy: 0.85, zombieLooter: 0.82, cursedKnight: 0.85,
  boneExecutioner: 0.85, maskedExecutioner: 0.85,
  mudMother: 0.78, crawlingBog: 0.85, graveWorm: 0.8,
  cursedBear: 0.88,
};

export function enemySpeedMult(shape: EnemyShape): number {
  return SPEED_MULT_BY_SHAPE[shape] ?? 1;
}

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
//
// Third pass — 5.5 overshot. It was tuned only against per-hit "does this
// die in one shot" checks, never against a full dungeon clear (11-12 fights
// back to back, HP carrying over, potions not scaling with fight count) —
// a full-clear simulation across every class/dungeon afterward found most
// dungeons landing at 5-35% win rate for an at-level anchor, some (Torre)
// at 0%, against the original "high/forgiving Região 1, moderate Região 2"
// target. Every extra HP point on a regular enemy doesn't just cost one
// fight more damage, it costs that same extra exposure ~11-12 times per
// run, compounding hard. Pulled back to a value that still avoids the
// original 1-2-hit instakill (a hits-to-kill check at 3.0 still lands
// multi-round fights everywhere) without re-inflating total run-length
// chip damage past what the potion economy can keep up with.
// 2026 rebalance, take three: user-specified directly rather than derived —
// regular ATK/DEF were both undertuned relative to HP (a mob that's only
// dangerous because of its health bar isn't "farmável, mas perigoso," it's
// just a longer fight), and the boss ATK/DEF in particular needed to move
// off "mostly a bigger health bar" too — a boss is supposed to be a wall
// because it actually hits harder and shrugs off more damage than the mobs
// around it, not just because it has more HP than they do. Paired with the
// new, much steeper per-dungeon difficultyMult curve in lib/dungeons.ts.
// Doubled again (2.5->5.0, 2.25->4.5) per a later user request to raise the
// game-wide HP baseline by "1x" (i.e. +100%) on top of everything above —
// ATK/DEF and the per-dungeon difficultyMult curve (lib/dungeons.ts) are
// untouched by this, it only makes every fight last longer, not hit harder.
const REGULAR_HP_MULT = 5.0;
const REGULAR_ATK_MULT = 1.25;
const REGULAR_DEF_MULT = 1.25;
const BOSS_HP_MULT = 4.5;
// User specified 1.15 here; simulation caught a severe compounding problem
// (see the depth-growth comment below) where difficultyMult's new 1.0-1.96
// floor stacked with this AND the boss's own already-high base stats made
// literally every boss unbeatable at the intended "just arrived" anchor —
// not "hard," but 0% win rate even in principle (a hits-to-kill check
// showed the boss needing ~20+ hits while the player died in ~2-3). Bosses
// already read as far more dangerous than mobs purely from their TIERS
// table base stats (a boss's own hp/atk dwarfs a regular's before any mult
// is even applied), so trimming this one multiplier back to 1.00 — the
// single largest lever in the compounding stack — was enough to make every
// boss beatable with real but non-absurd overleveling/gear (verified: ~5
// levels above the dungeon's own levelReq plus one rarity tier up from
// what a fresh arrival carries, confirmed per-dungeon via the rebalance
// harness), while a same-level fresh arrival still loses, matching the
// "não deve matar o boss sem equipamento, mas deve conseguir depois de
// algumas melhorias" requirement instead of an impossible one.
const BOSS_ATK_MULT = 1.00;
const BOSS_DEF_MULT = 1.30;

// User-specified cut (~35-40%, using the midpoint) to gold earned per kill —
// gold was accumulating fast enough that a player could stack up thousands
// in a handful of runs; this doesn't touch xpReward (a separate ask — see
// the XP section of the rebalance notes) or any dungeon's own goldMult
// (Cripta's own bonus was separately cut way down — see its goldMult in
// lib/dungeons.ts). Halved again per a later user request (0.625 -> 0.3125)
// after poções and other costs climbed — gold per kill needed to come down
// to match. Cut again, harder this time ("diminua em 300%" — read as "to
// roughly a third" of the current value, not a literal >100% reduction):
// 0.3125 -> 0.1. Gold is meant to be genuinely scarce now, something a
// player has to grind several runs for, not a byproduct of just playing —
// Mercador/potion prices were raised to match in this same pass.
const GOLD_YIELD_MULT = 0.1;

// depth here is now depth WITHIN the current dungeon (0 at its own
// startDepth — see spawnRegularOrBoss's growthDepth), not the game's
// absolute floor counter. It used to be the raw counter, which meant a
// later dungeon's bossDepth being a bigger number (up to 29) than an early
// dungeon's (12) silently multiplied its enemies' toughness on top of the
// per-dungeon difficultyMult curve — two systems both trying to encode
// "this dungeon is harder than the last one," compounding instead of one
// deferring to the other. Coefficients pulled back from 0.12/0.07 to
// 0.06/0.035 alongside this fix — the old steepness was tuned against the
// unbounded 1-29 raw range; the same steepness against the now-bounded
// ~0-11 within-dungeon range would have re-introduced the "boss needs 20+
// hits, player dies in 2-3" problem this pass fixed (see BOSS_ATK_MULT).
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
  const hpGrowth = depthGrowthMultiplier(depth, 'hp') * hpMult * modeStatMult * hpDifficultyMultiplier(difficultyMult);
  const atkGrowth = depthGrowthMultiplier(depth, 'atk') * atkMult * modeStatMult * atkDifficultyMultiplier(difficultyMult);
  const defGrowth = depthGrowthMultiplier(depth, 'def') * baseDefMult * modeDefMult * defDifficultyMultiplier(difficultyMult);
  const hp = Math.round(tier.hp * hpGrowth);
  return {
    name: mode === 'elite' ? `${tier.name} Veterano` : tier.name,
    shape: tier.shape,
    color: tier.color,
    hp, maxHp: hp,
    atk: Math.round(tier.atk * atkGrowth),
    def: Math.round(tier.def * defGrowth),
    xpReward: Math.round(tier.xp * (1 + depth * 0.08) * rewardMult),
    goldReward: Math.round(tier.gold * (1 + depth * 0.08) * rewardMult * GOLD_YIELD_MULT),
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
  // instanceFromTier's own depth-growth curve is keyed to depth WITHIN this
  // dungeon (0 at its own startDepth), not the game's absolute floor
  // counter — a later dungeon's bossDepth being a bigger raw number (up to
  // 29) than an early dungeon's (12) used to double-count progression on
  // top of the per-dungeon difficultyMult curve, which already encodes
  // "this dungeon is harder than the last one." Every dungeon runs roughly
  // the same 0-11 depth range now, so difficultyMult is the one deliberate
  // knob driving how much harder one dungeon is than another.
  const growthDepth = (d: number) => d - dungeon.startDepth;
  if (depth >= dungeon.bossDepth) {
    const bossTier = TIERS_BY_SHAPE[dungeon.boss];
    if (bossTier) return instanceFromTier(bossTier, growthDepth(dungeon.bossDepth), dungeon.isHunt ? 'hunt' : undefined, difficultyMult);
  }
  const tier = randomRegularTier(depth, dungeon.enemyPool);
  const isMiniBossDepth = dungeon.miniBossDepths?.includes(depth) ?? false;
  return instanceFromTier(tier, growthDepth(depth), isMiniBossDepth ? 'elite' : undefined, difficultyMult);
}

export function spawnEnemy(depth: number, dungeon: DungeonDef): EnemyInstance {
  const inst = spawnRegularOrBoss(depth, dungeon);
  return dungeon.isNightmare ? applyNightmare(inst) : inst;
}
