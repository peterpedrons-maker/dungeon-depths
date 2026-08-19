import bgMusicUrl from '../assets/audio/musica-fundo.mp3';
import battleMusicUrl from '../assets/audio/musica-batalha.mp3';
import bossMusicUrl from '../assets/audio/musica-chefe.mp3';
import magicAttackUrl from '../assets/audio/ataque-magico.mp3';
import physicalAttackUrl from '../assets/audio/ataque-fisico.mp3';
import hurtUrl from '../assets/audio/dano-recebido.mp3';
import buySellUrl from '../assets/audio/compra-venda.mp3';
import upgradeUrl from '../assets/audio/aprimoramento.mp3';
import clickUrl from '../assets/audio/clique-menu.mp3';

const MUSIC_VOLUME = 0.35;
const SFX_VOLUME = 0.6;

let musicEl: HTMLAudioElement | null = null;
let musicStarted = false;

function getMusicEl(): HTMLAudioElement {
  if (!musicEl) {
    musicEl = new Audio(bgMusicUrl);
    musicEl.loop = true;
    musicEl.volume = MUSIC_VOLUME;
  }
  return musicEl;
}

// Browsers refuse to autoplay audio before any user gesture, so the loop
// can't just start on mount — this arms a listener that starts it on the
// first tap/click/keypress anywhere in the app (the title screen's own
// "toque para pular" already trains the player to do this).
//
// musicStarted only flips to true once play() actually resolves — a first
// gesture that's too early (audio not yet decodable, or the browser not
// yet convinced it counts as activation) used to mark the music "started"
// regardless and permanently give up retrying, leaving the kingdom loop
// silent until something else (returning from a dungeon) called play()
// again on its own. Listeners now stay armed across a failed attempt so
// the very next gesture gets another shot.
export function armBackgroundMusic() {
  if (musicStarted) return;
  const start = () => {
    if (musicStarted) return;
    getMusicEl().play().then(() => {
      musicStarted = true;
      window.removeEventListener('pointerdown', start);
      window.removeEventListener('keydown', start);
      window.removeEventListener('click', start);
    }).catch(() => {});
  };
  window.addEventListener('pointerdown', start);
  window.addEventListener('keydown', start);
  window.addEventListener('click', start);
}

export function pauseBackgroundMusic() {
  musicEl?.pause();
}

export function resumeBackgroundMusic() {
  if (musicStarted) getMusicEl().play().catch(() => {});
}

// Combat music swaps in for the kingdom loop for the duration of a fight,
// handing playback back to the kingdom loop (picking up where it left off)
// only once combat ends entirely. Regular encounters play the battle track;
// bosses play their own track — switching between the two within the same
// dungeon run doesn't touch the kingdom loop at all.
let battleMusicEl: HTMLAudioElement | null = null;
let bossMusicEl: HTMLAudioElement | null = null;
let activeCombatTrack: 'battle' | 'boss' | null = null;

function getBattleMusicEl(): HTMLAudioElement {
  if (!battleMusicEl) {
    battleMusicEl = new Audio(battleMusicUrl);
    battleMusicEl.loop = true;
    battleMusicEl.volume = MUSIC_VOLUME;
  }
  return battleMusicEl;
}

function getBossMusicEl(): HTMLAudioElement {
  if (!bossMusicEl) {
    bossMusicEl = new Audio(bossMusicUrl);
    bossMusicEl.loop = true;
    bossMusicEl.volume = MUSIC_VOLUME;
  }
  return bossMusicEl;
}

export function playBattleMusic() {
  if (activeCombatTrack === 'battle') return;
  if (activeCombatTrack === null) pauseBackgroundMusic();
  bossMusicEl?.pause();
  activeCombatTrack = 'battle';
  getBattleMusicEl().play().catch(() => {});
}

export function playBossMusic() {
  if (activeCombatTrack === 'boss') return;
  if (activeCombatTrack === null) pauseBackgroundMusic();
  battleMusicEl?.pause();
  activeCombatTrack = 'boss';
  getBossMusicEl().play().catch(() => {});
}

export function stopCombatMusic() {
  if (activeCombatTrack === null) return;
  battleMusicEl?.pause();
  bossMusicEl?.pause();
  activeCombatTrack = null;
  resumeBackgroundMusic();
}

// Each call gets its own throwaway <audio> element so overlapping one-shots
// (e.g. two hits landing in the same round) don't cut each other off.
function playOneShot(url: string, volume: number) {
  const el = new Audio(url);
  el.volume = volume;
  el.play().catch(() => {});
}

export function playMagicAttackSfx() { playOneShot(magicAttackUrl, SFX_VOLUME); }
export function playPhysicalAttackSfx() { playOneShot(physicalAttackUrl, SFX_VOLUME); }
export function playHurtSfx() { playOneShot(hurtUrl, SFX_VOLUME); }
export function playBuySellSfx() { playOneShot(buySellUrl, SFX_VOLUME); }
export function playUpgradeSfx() { playOneShot(upgradeUrl, SFX_VOLUME); }
export function playClickSfx() { playOneShot(clickUrl, 0.25); }
