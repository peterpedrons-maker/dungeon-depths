// (só em desenvolvimento) Grava o motor de som de verdade num OfflineAudioContext, mais rápido que o tempo real, para as FAIXAS DE
// DEMONSTRAÇÃO (DESIGN.md §79): a mesma classe Sfx, os mesmos arquivos e a mesma música composta na hora; o tempo anda em passos de ~53 ms
// (suspend/resume) e, a cada passo, o motor recebe um tick() como no jogo. Devolve um WAV estéreo em base64.
import { Sfx, type AmbientState, type MusicScene, type SfxName, type StepKind } from './audio';

// [tempo (s), operação, ...argumentos]
export type RenderOp =
  | [number, 'scene', MusicScene, number?]
  | [number, 'leaveTitle', 'new' | 'go' | 'out']
  | [number, 'play', SfxName, number?, string?]
  | [number, 'steps', StepKind, number, number] // tipo, quantos, intervalo (s)
  | [number, 'ambient', Partial<AmbientState>]
  | [number, 'fire', number, number?]
  | [number, 'musicTest', Parameters<Sfx['musicTest']>[0]]
  | [number, 'breath']
  | [number, 'old', 'piece' | 'door' | 'error'];

type Priv = {
  sample(name: string, vol?: number, rate?: number, delay?: number, verb?: number): void;
  fxNote(inst: string, midi: number, vol: number, delay?: number, verb?: number, echo?: number): void;
  nextBreath: number;
  ac: BaseAudioContext;
};

export async function renderAudio(secs: number, ops: RenderOp[], sr = 48000): Promise<string> {
  const oac = new OfflineAudioContext(2, Math.ceil(secs * sr), sr);
  const s = new Sfx();
  await s.init(oac, false);
  const p = s as unknown as Priv;
  let amb: AmbientState = { wind: 0, size: 0.5, drip: 0, dripPan: 0, calm: true, paused: false };
  // os passos viram uma sequência de passos separados
  const list: RenderOp[] = [];
  for (const o of ops) {
    if (o[1] === 'steps') for (let i = 0; i < o[3]; i++) list.push([o[0] + i * o[4], 'steps', o[2], 1, 0]);
    else list.push(o);
  }
  list.sort((a, b) => a[0] - b[0]);
  let k = 0;
  const run = (t: number) => {
    while (k < list.length && list[k][0] <= t + 1e-6) {
      const o = list[k++];
      switch (o[1]) {
        case 'scene':
          s.scene(o[2], { wait: o[3] });
          break;
        case 'leaveTitle':
          s.leaveTitle(o[2]);
          break;
        case 'play':
          s.play(o[2], o[3] ?? 1, o[4]);
          break;
        case 'steps':
          s.step(o[2]);
          break;
        case 'ambient':
          amb = { ...amb, ...o[2] };
          break;
        case 'fire':
          s.fire(o[2], o[3] ?? 0);
          break;
        case 'musicTest':
          s.musicTest(o[2]);
          break;
        case 'breath':
          p.nextBreath = p.ac.currentTime;
          break;
        case 'old':
          // os sons de ANTES (para comparar na faixa), com os mesmos parâmetros que tinham
          if (o[2] === 'piece') {
            p.fxNote('celesta', 79, 0.45, 0, 0.7, 0.3);
            p.fxNote('celesta', 91, 0.4, 0.12, 0.7, 0.3);
            p.sample('bell', 0.25, 1.2, 0.05, 0.7);
          } else if (o[2] === 'door') {
            p.sample('door_open', 1, 0.95, 0, 0.35);
            p.fxNote('cello', 36, 0.42, 0.1, 0.8);
          } else p.sample('error', 0.8, 0.8);
          break;
      }
    }
    s.ambient(amb);
  };
  const STEP = 2560; // (múltiplo de 128 amostras: cada suspend cai num quantum)
  const dt = STEP / sr;
  run(0);
  s.tick(0);
  const n = Math.floor((secs * sr) / STEP);
  for (let i = 1; i < n; i++) {
    const t = (i * STEP) / sr;
    void oac.suspend(t).then(() => {
      run(t);
      s.tick(dt);
      void oac.resume();
    });
  }
  const buf = await oac.startRendering();
  return wavB64(buf);
}

function wavB64(b: AudioBuffer) {
  const ch = b.numberOfChannels;
  const n = b.length;
  const out = new DataView(new ArrayBuffer(44 + n * ch * 2));
  const w = (o: number, s: string) => [...s].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF');
  out.setUint32(4, 36 + n * ch * 2, true);
  w(8, 'WAVEfmt ');
  out.setUint32(16, 16, true);
  out.setUint16(20, 1, true);
  out.setUint16(22, ch, true);
  out.setUint32(24, b.sampleRate, true);
  out.setUint32(28, b.sampleRate * ch * 2, true);
  out.setUint16(32, ch * 2, true);
  out.setUint16(34, 16, true);
  w(36, 'data');
  out.setUint32(40, n * ch * 2, true);
  const data = [...Array(ch)].map((_, c) => b.getChannelData(c));
  let o = 44;
  for (let i = 0; i < n; i++)
    for (let c = 0; c < ch; c++) {
      const v = Math.max(-1, Math.min(1, data[c][i]));
      out.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true);
      o += 2;
    }
  // base64 em pedaços (uma string só estouraria a pilha)
  const bytes = new Uint8Array(out.buffer);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
