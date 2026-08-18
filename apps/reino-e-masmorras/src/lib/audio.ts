import bgMusicUrl from '../assets/audio/musica-fundo.mp3';
import magicAttackUrl from '../assets/audio/ataque-magico.mp3';
import buySellUrl from '../assets/audio/compra-venda.mp3';
import upgradeUrl from '../assets/audio/aprimoramento.mp3';

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
// can't just start on mount — this arms a one-time listener that starts it
// on the very first tap/click/keypress anywhere in the app (the title
// screen's own "toque para pular" already trains the player to do this).
export function armBackgroundMusic() {
  if (musicStarted) return;
  const start = () => {
    if (musicStarted) return;
    musicStarted = true;
    getMusicEl().play().catch(() => {});
    window.removeEventListener('pointerdown', start);
    window.removeEventListener('keydown', start);
  };
  window.addEventListener('pointerdown', start);
  window.addEventListener('keydown', start);
}

// Combat has no music yet (a dedicated battle track is coming later) —
// DungeonPanel pauses the kingdom loop on mount and resumes it on unmount,
// picking back up mid-track instead of restarting from the top.
export function pauseBackgroundMusic() {
  musicEl?.pause();
}

export function resumeBackgroundMusic() {
  if (musicStarted) getMusicEl().play().catch(() => {});
}

// Each call gets its own throwaway <audio> element so overlapping one-shots
// (e.g. two hits landing in the same round) don't cut each other off.
function playOneShot(url: string, volume: number) {
  const el = new Audio(url);
  el.volume = volume;
  el.play().catch(() => {});
}

export function playMagicAttackSfx() { playOneShot(magicAttackUrl, SFX_VOLUME); }
export function playBuySellSfx() { playOneShot(buySellUrl, SFX_VOLUME); }
export function playUpgradeSfx() { playOneShot(upgradeUrl, SFX_VOLUME); }
