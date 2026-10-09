// =============================================================================
// ÁUDIO — efeitos (arquivos .ogg do Kenney, CC0 — ver src/assets/audio/CREDITS.md)
// + música ambiente sintetizada em Web Audio (nenhuma trilha CC0/aberta decente
// foi encontrada hospedada em domínio alcançável por esta sessão — ver o CREDITS
// de áudio pra detalhes).
// =============================================================================
import sfxUiClick from "@/assets/audio/ui-click.ogg";
import sfxUiConfirm from "@/assets/audio/ui-confirm.ogg";
import sfxCoins from "@/assets/audio/coins.ogg";
import sfxBuildStart from "@/assets/audio/build-start.ogg";
import sfxMine from "@/assets/audio/mine.ogg";
import sfxCombatClash from "@/assets/audio/combat-clash.ogg";
import sfxVictory from "@/assets/audio/victory.ogg";
import sfxDefeat from "@/assets/audio/defeat.ogg";

const SFX_SRC = {
  click: sfxUiClick,
  confirm: sfxUiConfirm,
  coins: sfxCoins,
  build: sfxBuildStart,
  mine: sfxMine,
  clash: sfxCombatClash,
  victory: sfxVictory,
  defeat: sfxDefeat,
} as const;
export type SfxName = keyof typeof SFX_SRC;

const MUTE_KEY = "vale_dos_clas_mute";
let muted = false;
try {
  muted = localStorage.getItem(MUTE_KEY) === "1";
} catch {
  /* localStorage indisponível — segue com som ligado */
}

export function isMuted() {
  return muted;
}

export function setMuted(next: boolean) {
  muted = next;
  try {
    localStorage.setItem(MUTE_KEY, next ? "1" : "0");
  } catch {
    /* ok ignorar */
  }
  if (musicGain) musicGain.gain.value = muted ? 0 : MUSIC_VOLUME;
}

// --------------------------------------------------------------- efeitos sonoros
const sfxPool: Partial<Record<SfxName, HTMLAudioElement[]>> = {};
function sfxElement(name: SfxName): HTMLAudioElement {
  const pool = (sfxPool[name] ??= []);
  const free = pool.find((a) => a.paused || a.ended);
  if (free) return free;
  const el = new Audio(SFX_SRC[name]);
  pool.push(el);
  return el;
}

export function playSfx(name: SfxName, volume = 0.55) {
  if (muted) return;
  try {
    const el = sfxElement(name);
    el.currentTime = 0;
    el.volume = volume;
    void el.play().catch(() => {});
  } catch {
    /* áudio bloqueado antes do primeiro gesto do usuário — tudo bem, ignora */
  }
}

// --------------------------------------------------------------- música ambiente sintetizada
let actx: AudioContext | null = null;
let musicGain: GainNode | null = null;
let musicStarted = false;
let musicTimer = 0;
const MUSIC_VOLUME = 0.16;

// escala pentatônica (ré menor) pras notas de harpa — soa "medieval" sem precisar de amostras
const SCALE = [146.83, 174.61, 196.0, 220.0, 261.63, 293.66, 349.23]; // D3 F3 G3 A3 C4 D4 F4
const DRONE_ROOT = 73.42; // D2

function pluck(a: AudioContext, bus: GainNode, freq: number, t: number, dur: number, vol: number) {
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = "triangle";
  o.frequency.value = freq;
  o.connect(g);
  g.connect(bus);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function scheduleLoop() {
  if (!actx || !musicGain) return;
  const a = actx;
  const bus = musicGain;
  const t0 = a.currentTime + 0.1;
  // nota de harpa a cada ~1.8-3.2s, escolhida da escala pentatônica — dá uma melodia solta e ambiente
  let t = t0;
  for (let i = 0; i < 6; i++) {
    const freq = SCALE[Math.floor(Math.random() * SCALE.length)];
    pluck(a, bus, freq, t, 2.2, 0.07 + Math.random() * 0.04);
    t += 1.8 + Math.random() * 1.4;
  }
  musicTimer = window.setTimeout(scheduleLoop, (t - t0) * 1000 - 200);
}

export function ensureMusic() {
  if (musicStarted) return;
  try {
    actx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    musicGain = actx.createGain();
    musicGain.gain.value = muted ? 0 : MUSIC_VOLUME;
    musicGain.connect(actx.destination);

    // drone grave contínuo (dois osciladores levemente dessintonizados, com um filtro
    // passa-baixa respirando devagar) — dá o "fundo" ambiente sem precisar de amostras
    const droneGain = actx.createGain();
    droneGain.gain.value = 0.5;
    droneGain.connect(musicGain);
    const filter = actx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 500;
    filter.connect(droneGain);
    for (const detune of [-4, 4]) {
      const o = actx.createOscillator();
      o.type = "sine";
      o.frequency.value = DRONE_ROOT;
      o.detune.value = detune;
      o.connect(filter);
      o.start();
    }
    const lfo = actx.createOscillator();
    const lfoGain = actx.createGain();
    lfo.frequency.value = 0.05;
    lfoGain.gain.value = 220;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    musicStarted = true;
    scheduleLoop();
  } catch {
    /* Web Audio indisponível — segue o jogo sem trilha */
  }
}

export function stopMusic() {
  if (musicTimer) window.clearTimeout(musicTimer);
  musicStarted = false;
  if (actx) {
    void actx.close().catch(() => {});
    actx = null;
    musicGain = null;
  }
}
