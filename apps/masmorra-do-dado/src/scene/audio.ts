// Som do jogo com GRAVAÇÕES REAIS (nada sintetizado): efeitos de pacotes livres (CC0) e
// instrumentos reais (violoncelo, contrabaixo, cordas, coros, harpa, celesta, flauta, tímpano, sinos, garrafa soprada...)
// do soundfont FluidR3_GM. A música é composta em tempo real, tocando essas notas gravadas: uma para a tela inicial ("O Poço")
// e uma para o jogo, que toca em FRASES com silêncios entre elas (DESIGN.md §79). Créditos em public/audio/CREDITS.txt.
// O navegador só libera áudio depois de um toque/tecla: unlock() cria tudo nesse momento.

export type SfxName =
  | 'throw'
  | 'catch'
  | 'recall'
  | 'put'
  | 'rest'
  | 'face'
  | 'locked'
  | 'swap'
  | 'sweep'
  | 'ignite'
  | 'plate'
  | 'gem'
  | 'door'
  | 'doorClose'
  | 'piece' // um passo certo do puzzle (não o fim)
  | 'solved' // o puzzle da sala RESOLVIDO (uma vez por sala; o motor decide quando, DESIGN.md §79)
  | 'secret' // um SEGREDO achado: o nicho escondido que se abre (com uma folha dela ou uma gema), menor e mais misterioso que o resolvido
  | 'error'
  | 'burnout'
  | 'land'
  | 'room'
  | 'fanfare'
  | 'uiblip'
  | 'uiflip'
  | 'uiopen'
  | 'uiclose'
  | 'uinew'
  | 'write'
  | 'shaftRumble'
  | 'shaftFall'
  | 'rise' // pilar subindo do chão
  | 'dark' // a Casa apaga tudo (o escuro): a chama sugada e um grave abafado
  // a cena da gema (DESIGN.md §69): ela vem e brilha; estala e vira pó; encaixa no furo do caderno; uma face do dado se completa
  | 'gemShine'
  | 'gemBreak'
  | 'gemSet'
  | 'gemFace'
  // o altar do Tribunal (DESIGN.md §77): a pedra racha; a pedra é empurrada e desce; o dado desliza para dentro; a pedra fecha; a luz lá dentro;
  // a pedra abre de novo
  | 'altarCrack'
  | 'altarPush'
  | 'altarSlide'
  | 'altarShut'
  | 'altarGlow'
  | 'altarOpen';

// 0 = tudo ligado, 1 = só efeitos, 2 = mudo
export type AudioMode = 0 | 1 | 2;

// o que soa sob os pés: o piso (Room.surfaceAt) ou, se o passo subiu/desceu, o degrau
export type StepKind = 'stone' | 'rug' | 'plate' | 'water' | 'rubble' | 'stair';

// qual música: a da tela inicial (e dos créditos) ou a do jogo
export type MusicScene = 'title' | 'game';

// como está o lugar onde o jogador está (o motor calcula a partir de Room.ambience; DESIGN.md §60)
export interface AmbientState {
  wind: number; // 0..1 vento aqui (cresce perto das aberturas)
  size: number; // 0 = cubículo abafado .. 1 = salão enorme (reverberação e o "ar" da sala)
  drip: number; // 0..1 gotas por perto (0 = nenhuma)
  dripPan: number; // -1..1 de que lado pinga
  calm: boolean; // sem conversa, sem cena, sem escuro: a Casa pode "respirar"
  paused: boolean; // menu de pausa: o ambiente baixa
  dark?: number; // 0..1 o escuro da Casa: a música também recua
  quiet?: boolean; // área livre / respiro: menos música (frases curtas, silêncios longos; §79)
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

// Muda quando qualquer arquivo de áudio é trocado: força o navegador/PWA a baixar de novo
const AUDIO_VERSION = 7;

const SFX_FILES = [
  'step_stone_l', 'step_stone_r', 'step_stair_l', 'step_stair_r', 'step_rubble_l', 'step_rubble_r', 'step_rug', 'step_plate', 'step_water',
  'land', 'throw1', 'throw2', 'recall', 'catch', 'put1', 'put2',
  'bounce1', 'bounce2', 'bounce3', 'bounce4', 'roll', 'locked', 'swap1', 'swap2', 'sweep', 'chalk1', 'chalk2',
  'erase', 'ignite', 'ignite_small', 'ignite_cloth', 'plate1', 'plate2', 'gem1', 'gem2', 'bell', 'gong', 'door_open', 'door_shut', 'rise',
  'doorclose1', 'error', 'burnout', 'fire', 'crackle', 'wind', 'gust', 'drip', 'boom', 'creak', 'settle',
];
// as gotas do arquivo drip.mp3 (início em s; cada uma dura ~0,55 s)
const DRIPS = [0, 0.6, 1.2, 1.8, 2.4, 3.0];
// a ordem é a de carregar: primeiro o que a tela inicial usa (ela pode ser a 1ª coisa que se ouve), depois o resto do jogo
const INSTRUMENTS = ['orchestral_harp', 'celesta', 'voice_oohs', 'contrabass', 'cello', 'string_ensemble_1', 'choir_aahs', 'tubular_bells', 'glockenspiel', 'flute', 'timpani', 'blown_bottle'];

// notas (MIDI) das faces 1–6 no glockenspiel: pentatônica de lá menor
const FACE_MIDI = [76, 79, 81, 84, 86, 88];

// ── a música do JOGO: Lá menor → Fá → Ré menor → Mi; cada acorde dura 16 s ──
interface Chord {
  root: number; // baixo (violoncelo)
  pad: number[]; // acorde das cordas/coro
  scale: number[]; // notas da harpa / celesta / flauta
}
const PROG: Chord[] = [
  { root: 45, pad: [57, 60, 64], scale: [57, 60, 62, 64, 67, 69, 72, 74, 76] },
  { root: 41, pad: [53, 57, 60], scale: [57, 60, 62, 65, 67, 69, 72, 74, 77] },
  { root: 38, pad: [50, 53, 57], scale: [57, 59, 62, 65, 67, 69, 71, 74, 77] },
  { root: 40, pad: [52, 56, 59], scale: [56, 59, 62, 64, 68, 71, 74, 76, 80] },
];
const CHORD_LEN = 16;

// ── a música da TELA INICIAL, "O Poço" (DESIGN.md §79): o dado no fundo do poço, a luz pálida lá em cima. Ré, grave e aberto; cada acorde
// dura 12 s, oito acordes por volta (96 s). O contrabaixo segura o chão, o coro (oohs) respira, a harpa cai devagar como gotas de luz, a
// celesta brilha de longe, um sino lá em cima e, de vez em quando, o sopro de uma garrafa: o ar passando pela boca do poço. O Lá maior
// (com o dó sustenido) é a luz. Ao fim de cada metade, o tema: lá, ré, mi, FÁ... e, na segunda, sobe até o lá (olhar para cima).
interface TChord {
  bass: number;
  pad: number[];
  arp: number[]; // notas da harpa (de cima para baixo) e da celesta
  light?: boolean; // o acorde da luz: entra um fio de cordas por cima
  sus?: number; // acorde suspenso: na metade, esta nota do pad vira a de baixo (a resolução)
}
const TPROG: TChord[] = [
  { bass: 38, pad: [50, 57, 64], arp: [62, 64, 65, 69, 72, 74, 76, 81] }, // Ré aberto (ré, lá, mi)
  { bass: 34, pad: [50, 53, 57], arp: [58, 62, 65, 69, 70, 74, 77, 81] }, // Si bemol com a sétima
  { bass: 36, pad: [52, 55, 60], arp: [60, 64, 67, 69, 72, 74, 76, 79] }, // Dó
  { bass: 33, pad: [52, 57, 61], arp: [57, 61, 64, 69, 73, 76, 81], light: true }, // Lá maior: a luz
  { bass: 38, pad: [50, 53, 57, 64], arp: [62, 65, 69, 72, 74, 76, 77, 81] }, // Ré menor com a nona
  { bass: 31, pad: [50, 55, 58], arp: [55, 58, 62, 65, 67, 70, 74, 77] }, // Sol menor
  { bass: 34, pad: [53, 58, 62], arp: [58, 62, 65, 70, 74, 77, 81] }, // Si bemol
  { bass: 33, pad: [52, 57, 62], arp: [57, 62, 64, 69, 74, 76, 81], light: true, sus: 61 }, // Lá suspenso que vira Lá maior
];
const T_LEN = 12;
// (a peça é rala: um pouco mais de volume na faixa para ela ficar perto da música do jogo. Era 1,35; com o coro sem invadir o acorde
// seguinte, a peça perdeu ~1,2 dB, e 1,55 devolve parte disso (o compressor da mesa achata: medido, −26,7 LUFS contra −22,7 da música do
// jogo, ~4 dB abaixo; antes da revisão, −25,7). DESIGN.md §79)
const TITLE_GAIN = 1.55;
// o tema (nota, tempo em s, nota longa?) na harpa, com a celesta uma oitava acima nas notas longas
const MOTIF_A: [number, number, boolean?][] = [[69, 0], [74, 0.9], [76, 1.6], [77, 2.3, true], [76, 4.0], [74, 4.8, true]];
const MOTIF_B: [number, number, boolean?][] = [[69, 0], [74, 0.9], [76, 1.6], [77, 2.3], [79, 3.0], [81, 3.7, true], [77, 5.6], [76, 6.4, true]];

interface Inst {
  notes: number[];
  bufs: Map<number, AudioBuffer>;
}
// as duas músicas têm cada uma a sua "faixa" (seco, reverberação e eco), com volume próprio: uma some enquanto a outra entra
type LaneName = 'game' | 'title';
interface Lane {
  dry: GainNode;
  verb: GainNode;
  echo: GainNode;
}
interface NoteHandle {
  s: AudioBufferSourceNode;
  g: GainNode;
  t: number;
}
// o estado da música do jogo: tocando uma frase, sumindo (o fim da frase), ou em silêncio (o ambiente na frente)
type GameMusic = 'play' | 'fade' | 'rest';

// segura o valor de agora (para uma rampa nova sair dele, sem pulo)
const holdParam = (p: AudioParam, now: number) => {
  if (typeof p.cancelAndHoldAtTime === 'function') p.cancelAndHoldAtTime(now);
  else {
    const v = p.value;
    p.cancelScheduledValues(now);
    p.setValueAtTime(v, now);
  }
};

export class Sfx {
  private ac: BaseAudioContext | null = null;
  private live = true; // false = contexto offline (testes: gravar a faixa de demonstração)
  private master!: GainNode;
  private bus!: GainNode;
  private musicBus!: GainNode;
  private musicVerb!: GainNode; // a reverberação da música (segue o volume de música, como o som seco)
  private mDuck!: GainNode; // a música abre espaço (o "resolvido", a porta)
  private mDuckV!: GainNode;
  private mDelay!: DelayNode;
  private lanes!: Record<LaneName, Lane>;
  private verbSend!: GainNode;
  private echoSend!: GainNode; // o eco dos EFEITOS (celesta e harpa das falas, da escrita...)
  // reverberação dos sons do MUNDO (passos, portas, fogo, gotas): mistura uma sala curta e a longa conforme o tamanho da sala
  private space!: GainNode;
  private shortRet!: GainNode;
  private longSend!: GainNode;
  private mode: AudioMode = 0;
  private buf = new Map<string, AudioBuffer>();
  private inst: Record<string, Inst> = {};
  // laços contínuos
  private rollSrc: AudioBufferSourceNode | null = null;
  private rollG: GainNode | null = null;
  private fireG: GainNode | null = null;
  private fireLP: BiquadFilterNode | null = null;
  private firePanN: StereoPannerNode | null = null;
  private fireTarget = 0;
  private fireLevel = 0;
  private firePan = 0;
  private nextCrackle = 0;
  // ambiente: o vento (perto das aberturas), o "ar" da sala (o mesmo vento, bem grave e baixo), gotas, rajadas e a Casa respirando
  private windG: GainNode | null = null;
  private windLP: BiquadFilterNode | null = null;
  private toneG: GainNode | null = null;
  private amb: AmbientState = { wind: 0, size: 0.4, drip: 0, dripPan: 0, calm: false, paused: false };
  private windLevel = 0;
  private sizeLevel = 0.4;
  private windMod = 1; // o vento nunca fica igual: sobe e desce devagar (o laço não se percebe)
  private windModTo = 1;
  private windModAt = 0;
  private ambBoost = 1; // no silêncio da música, o ambiente sobe (~2,5 dB)
  private darkLevel = 0;
  private darkApplied = 0;
  private duckHold = 0; // até quando a música está aberta para um efeito, e quanto
  private duckDepth = 1;
  private fadedAll = false;
  private nextGust = 0;
  private nextDrip = 0;
  private nextBreath = 0;
  private breathKind = 0;
  private paramAt = 0;
  private foot = 0; // pé esquerdo / direito (alternam sempre na mesma ordem)
  private duckUntil = 0; // até quando o ambiente fica mais baixo (uma porta, um erro)
  private lastStep = 0;
  // giz
  private scratchNext = 0;
  private scratchNode: GainNode | null = null;
  private lastBounce = 0;
  // o resolvido e a porta (o violoncelo da porta dá lugar ao do resolvido)
  private solvedAt = -99;
  // música do jogo
  private musicScene: MusicScene = 'game';
  private wantScene: { s: MusicScene; wait?: number } | null = null;
  private gm = { st: 'rest' as GameMusic, until: 6, left: 0, phraseEnd: 0, fadeAt: 0, faded: false, started: false };
  private mt: { chords?: number; rest?: number } = {}; // (testes) frases e silêncios mais curtos
  private chordAt = 0;
  private chordIdx = 0;
  private nextHarp = 0;
  private nextCelesta = 0;
  private nextFlute = 0;
  private nextTimpani = 0;
  // música da tela inicial
  private titleOn = false;
  private tAt = 0;
  private tIdx = 0;
  private nextTHarp = 0;
  private nextTCel = 0;
  private nextTBell = 0;
  private nextTBottle = 0;
  private tMotifFrom = 0;
  private tMotifUntil = 0;
  played = 0; // só pra testes
  steps = 0;
  log: string[] = []; // (testes, só em desenvolvimento) as últimas gravações que tocaram
  logN = 0; // quantas já tocaram (testes)
  private dbg(n: string) {
    if (!import.meta.env.DEV) return;
    this.logN++;
    this.log.push(n);
    if (this.log.length > 60) this.log.shift();
  }
  // (testes) o ambiente como o motor de som o vê agora
  debug() {
    return { wind: +this.windLevel.toFixed(2), size: +this.sizeLevel.toFixed(2), fire: +this.fireLevel.toFixed(2), firePan: +this.firePan.toFixed(2), drip: +this.amb.drip.toFixed(2), calm: this.amb.calm, boost: +this.ambBoost.toFixed(2), nextBreath: this.ac ? +(this.nextBreath - this.ac.currentTime).toFixed(1) : null, nextGust: this.ac ? +(this.nextGust - this.ac.currentTime).toFixed(1) : null };
  }
  // (testes) o estado da música: qual toca, em que fase, quanto falta
  music() {
    const now = this.ac ? this.ac.currentTime : 0;
    const lv = (n: LaneName) => (this.lanes ? +this.lanes[n].dry.gain.value.toFixed(2) : null);
    return {
      scene: this.musicScene,
      title: this.titleOn,
      titleChords: this.tIdx, // quantos acordes da peça do menu já foram agendados
      gameChords: this.chordIdx,
      st: this.gm.st,
      chordsLeft: this.gm.left,
      untilIn: +(this.gm.until - now).toFixed(1),
      phraseEndIn: +(this.gm.phraseEnd - now).toFixed(1),
      game: lv('game'),
      titleLane: lv('title'),
      duck: this.mDuck ? +this.mDuck.gain.value.toFixed(2) : null,
      bus: this.musicBus ? +this.musicBus.gain.value.toFixed(3) : null, // o canal da música (volume, modo e o escuro da Casa)
      verbBus: this.musicVerb ? +this.musicVerb.gain.value.toFixed(3) : null,
      dark: +this.darkApplied.toFixed(2),
      boost: +this.ambBoost.toFixed(2),
      quiet: !!this.amb.quiet,
      solvedAgo: +(now - this.solvedAt).toFixed(1),
    };
  }
  // (testes) encurta as frases (`chords` acordes antes do fim) e os silêncios (`rest` s); `end` termina a frase já
  musicTest(o: { chords?: number; rest?: number; end?: boolean; restNow?: number }) {
    this.mt = { chords: o.chords ?? this.mt.chords, rest: o.rest ?? this.mt.rest };
    if (o.end && this.gm.st === 'play') this.gm.left = 0;
    if (o.restNow !== undefined && this.ac) {
      this.gm.st = 'rest';
      this.gm.until = this.ac.currentTime + o.restNow;
      this.laneTo('game', 0, 1);
    }
  }
  private loaded = 0;
  private loadP: Promise<void> | null = null;
  get state() {
    return this.ac ? this.ac.state : 'sem-contexto';
  }
  get ready() {
    return this.loaded;
  }

  private vol = { master: 0.8, music: 0.6, sfx: 0.8 };
  setMode(m: AudioMode) {
    this.mode = m;
    this.applyMode();
  }
  // volumes da aba Áudio (0 a 1): geral, música, efeitos
  setVolumes(master: number, music: number, sfx: number) {
    this.vol = { master, music, sfx };
    this.mode = master <= 0 ? 2 : music <= 0 ? 1 : 0;
    this.applyMode();
  }

  // o volume da música: o botão de música (1 = o padrão) e o escuro da Casa (a música recua com a luz)
  private musicK() {
    return (this.mode === 0 ? this.vol.music / 0.6 : 0) * (1 - 0.6 * this.darkApplied);
  }
  private applyMusic(tc: number) {
    if (!this.ac) return;
    const t = this.ac.currentTime;
    const k = this.musicK();
    // (o seco da música sempre foi 0,2 do canal; a reverberação ia inteira: as proporções continuam, mas agora a reverberação também segue o
    // volume de música e some com ela)
    this.musicBus.gain.setTargetAtTime(0.2 * k, t, tc);
    this.musicVerb.gain.setTargetAtTime(k, t, tc);
  }
  private applyMode() {
    if (!this.ac) return;
    const t = this.ac.currentTime;
    this.master.gain.setTargetAtTime(this.mode === 2 ? 0 : this.vol.master / 0.8, t, 0.05);
    this.applyMusic(0.4);
    this.bus.gain.setTargetAtTime(0.85 * (this.vol.sfx / 0.8), t, 0.05);
  }

  // cria o contexto de áudio (precisa de um gesto do usuário) e começa a baixar as gravações
  unlock() {
    if (!this.ac) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.init(new AC());
    }
    if (this.live && this.ac!.state !== 'running') void (this.ac as AudioContext).resume();
  }

  // monta a mesa de som num contexto (o de verdade, ou um OfflineAudioContext nos testes) e carrega tudo; a promessa resolve quando acabou
  init(ac: BaseAudioContext, live = true) {
    this.ac = ac;
    this.live = live;
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 3;
    this.master = ac.createGain();
    this.master.connect(comp).connect(ac.destination);
    this.bus = ac.createGain();
    this.bus.gain.value = 0.85;
    this.bus.connect(this.master);

    // reverb de sala (só processamento: o som continua sendo o das gravações)
    const len = Math.floor(ac.sampleRate * 3.2);
    const ir = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4);
    }
    const conv = ac.createConvolver();
    conv.buffer = ir;
    this.verbSend = ac.createGain();
    this.verbSend.gain.value = 1;
    const verbRet = ac.createGain();
    verbRet.gain.value = 0.55;
    this.verbSend.connect(conv).connect(verbRet).connect(this.master);
    // eco dos efeitos (celesta e harpa): sai pelo canal dos efeitos (antes saía pelo da música e sumia com ela)
    const fd = ac.createDelay(1.5);
    fd.delayTime.value = 0.52;
    const ffb = ac.createGain();
    ffb.gain.value = 0.34;
    this.echoSend = ac.createGain();
    this.echoSend.connect(fd);
    fd.connect(ffb).connect(fd);
    const fOut = ac.createGain();
    fOut.gain.value = 0.24; // (o mesmo nível de antes, quando passava pelo canal da música a 0,2)
    fd.connect(fOut).connect(this.bus);
    fd.connect(this.verbSend);

    // MÚSICA: o canal seco e o da reverberação, cada um com o "abrir espaço"; o eco próprio; e as duas faixas (jogo, tela inicial)
    this.musicBus = ac.createGain();
    this.musicBus.gain.value = 0;
    this.mDuck = ac.createGain();
    this.musicBus.connect(this.mDuck).connect(this.master);
    this.musicVerb = ac.createGain();
    this.musicVerb.gain.value = 0;
    this.mDuckV = ac.createGain();
    this.musicVerb.connect(this.mDuckV).connect(this.verbSend);
    this.mDelay = ac.createDelay(1.5);
    this.mDelay.delayTime.value = 0.52;
    const mfb = ac.createGain();
    mfb.gain.value = 0.34;
    this.mDelay.connect(mfb).connect(this.mDelay);
    this.mDelay.connect(this.musicBus);
    this.mDelay.connect(this.musicVerb);
    const lane = (): Lane => {
      const dry = ac.createGain();
      const verb = ac.createGain();
      const echo = ac.createGain();
      for (const g of [dry, verb, echo]) g.gain.value = 0;
      dry.connect(this.musicBus);
      verb.connect(this.musicVerb);
      echo.connect(this.mDelay);
      return { dry, verb, echo };
    };
    this.lanes = { game: lane(), title: lane() };

    // a sala curta (~0,9 s, só processamento como a longa): corredores e câmaras pequenas abafam; salões altos vão para a longa
    const sl = Math.floor(ac.sampleRate * 0.9);
    const irS = ac.createBuffer(2, sl, ac.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = irS.getChannelData(c);
      for (let i = 0; i < sl; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / sl, 3.2);
    }
    const convS = ac.createConvolver();
    convS.buffer = irS;
    this.space = ac.createGain();
    this.shortRet = ac.createGain();
    this.longSend = ac.createGain();
    this.space.connect(convS).connect(this.shortRet).connect(this.master);
    this.space.connect(this.longSend).connect(this.verbSend);
    this.setSpace(this.sizeLevel);

    const t0 = ac.currentTime;
    this.nextBreath = t0 + rand(70, 120);
    this.nextGust = t0 + rand(6, 14);
    this.gm = { st: 'rest', until: t0 + 6, left: 0, phraseEnd: 0, fadeAt: 0, faded: false, started: false };
    this.applyMode();
    // a música pedida antes de o som ligar (a tela inicial, ou o jogo)
    const w = this.wantScene;
    this.wantScene = null;
    if (w) this.scene(w.s, { wait: w.wait });
    this.loadP = this.loadAll();
    return this.loadP;
  }

  suspend(on: boolean) {
    if (!this.ac || !this.live) return;
    const ac = this.ac as AudioContext;
    if (on) void ac.suspend();
    else void ac.resume();
  }

  // ── carregamento das gravações ──────────────────────────────────────────
  private async decode(url: string): Promise<AudioBuffer | null> {
    try {
      const r = await fetch(url);
      if (!r.ok) return null;
      return await this.ac!.decodeAudioData(await r.arrayBuffer());
    } catch {
      return null;
    }
  }

  private async loadAll() {
    const base = `${import.meta.env.BASE_URL}audio/`;
    // efeitos primeiro (são pequenos), depois os instrumentos da música
    await Promise.all(
      SFX_FILES.map(async (n) => {
        const b = await this.decode(`${base}sfx/${n}.mp3?v=${AUDIO_VERSION}`);
        if (b) this.buf.set(n, b);
        this.loaded++;
      }),
    );
    this.startLoops();
    try {
      const man = (await (await fetch(`${base}inst/manifest.json?v=${AUDIO_VERSION}`)).json()) as Record<string, number[]>;
      for (const name of INSTRUMENTS) {
        const notes = man[name] ?? [];
        const inst: Inst = { notes, bufs: new Map() };
        await Promise.all(
          notes.map(async (m) => {
            const b = await this.decode(`${base}inst/${name}/${m}.mp3?v=${AUDIO_VERSION}`);
            if (b) inst.bufs.set(m, b);
          }),
        );
        this.inst[name] = inst; // (só entra quando todas as notas chegaram: a música não começa com um instrumento pela metade)
        this.loaded++;
      }
    } catch {
      /* sem instrumentos: só os efeitos tocam */
    }
  }

  // tamanho da sala (0..1): quanto vai para a sala curta e quanto para a longa
  private setSpace(size: number) {
    if (!this.ac || !this.space) return;
    const t = this.ac.currentTime;
    this.shortRet.gain.setTargetAtTime(0.42 * (1 - size) + 0.08, t, 0.5);
    this.longSend.gain.setTargetAtTime(0.15 + 0.95 * size, t, 0.5);
  }

  private startLoops() {
    const ac = this.ac!;
    // um laço que toca sempre (o volume muda, a fonte não se recria); `pre` = filtros/pan entre a fonte e o volume
    const loop = (name: string, rate = 1, pre: AudioNode[] = []) => {
      const b = this.buf.get(name);
      if (!b) return null;
      const s = ac.createBufferSource();
      s.buffer = b;
      s.loop = true;
      s.playbackRate.value = rate;
      const g = ac.createGain();
      g.gain.value = 0;
      let n: AudioNode = s;
      for (const p of pre) n = n.connect(p);
      n.connect(g).connect(this.bus);
      s.start(0, Math.random() * b.duration);
      return { s, g };
    };
    const r = loop('roll');
    if (r) {
      this.rollSrc = r.s;
      this.rollG = r.g;
    }
    // o fogo por perto: abafa quando está longe e vem do lado em que está
    this.fireLP = ac.createBiquadFilter();
    this.fireLP.type = 'lowpass';
    this.fireLP.frequency.value = 2000;
    const pre: AudioNode[] = [this.fireLP];
    if (ac.createStereoPanner) {
      this.firePanN = ac.createStereoPanner();
      pre.push(this.firePanN);
    }
    const f = loop('fire', 1, pre);
    if (f) this.fireG = f.g;
    // o vento (perto das aberturas fica mais claro e mais forte)
    this.windLP = ac.createBiquadFilter();
    this.windLP.type = 'lowpass';
    this.windLP.frequency.value = 600;
    const w = loop('wind', 1, [this.windLP]);
    if (w) this.windG = w.g;
    // o ar da sala: o mesmo vento, mais lento e só o grave, quase no limite do audível (lá fora, do outro lado da pedra)
    const toneLP = ac.createBiquadFilter();
    toneLP.type = 'lowpass';
    toneLP.frequency.value = 170;
    toneLP.Q.value = 0.4;
    const tn = loop('wind', 0.62, [toneLP]);
    if (tn) this.toneG = tn.g;
  }

  // ── tocar gravações ─────────────────────────────────────────────────────
  // `verb` vai para a reverberação do MUNDO (curta ou longa conforme a sala; `far` = sempre a longa, para o que soa lá longe, como o poço
  // da abertura); `lp` = abafar (Hz); `off`/`dur` = tocar só um trecho
  private sample(name: string, vol = 1, rate = 1, delay = 0, verb = 0, pan = 0, lp = 0, off = 0, dur = 0, far = false) {
    const ac = this.ac;
    const b = this.buf.get(name);
    if (!ac || !b) return;
    this.dbg(name);
    const s = ac.createBufferSource();
    s.buffer = b;
    s.playbackRate.value = rate;
    const g = ac.createGain();
    const t = ac.currentTime + delay;
    let node: AudioNode = s;
    if (lp > 0) {
      const f = ac.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = lp;
      f.Q.value = 0.5;
      node = node.connect(f);
    }
    node.connect(g);
    node = g;
    if (dur > 0) {
      // trecho: entra e sai suave (sem estalo)
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + Math.min(0.012, dur * 0.2));
      g.gain.setValueAtTime(vol, t + dur * 0.6);
      g.gain.linearRampToValueAtTime(0, t + dur);
    } else g.gain.value = vol;
    if (pan !== 0 && ac.createStereoPanner) {
      const p = ac.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, pan));
      g.connect(p);
      node = p;
    }
    node.connect(this.bus);
    if (verb > 0) {
      const v = ac.createGain();
      v.gain.value = verb;
      node.connect(v).connect(far ? this.verbSend : this.space);
    }
    if (dur > 0) s.start(t, off, dur * rate + 0.02);
    else s.start(t);
  }

  // uma nota de instrumento real: usa a gravação mais próxima e ajusta a altura (rate). `lane` = a faixa da música (jogo ou tela inicial);
  // `toMusic: false` = é um EFEITO (canal dos efeitos)
  private note(instName: string, midi: number, t: number, vol: number, opts: { fadeIn?: number; hold?: number; fadeOut?: number; verb?: number; echo?: number; pan?: number; toMusic?: boolean; lane?: LaneName } = {}): NoteHandle | null {
    const ac = this.ac;
    const inst = this.inst[instName];
    if (!ac || !inst || inst.bufs.size === 0) return null;
    let best = inst.notes[0];
    for (const n of inst.notes) if (inst.bufs.has(n) && Math.abs(n - midi) < Math.abs(best - midi)) best = n;
    const b = inst.bufs.get(best);
    if (!b) return null;
    const s = ac.createBufferSource();
    s.buffer = b;
    s.playbackRate.value = Math.pow(2, (midi - best) / 12);
    const g = ac.createGain();
    let fi = opts.fadeIn ?? 0.01;
    let fo = opts.fadeOut ?? 0.3;
    let hold = opts.hold ?? b.duration / s.playbackRate.value - fi - fo;
    // (as notas longas gravadas, coro, cordas, baixo, acabam ainda soando, sem cauda: se o envelope pedido passa do fim da gravação, a nota é
    // cortada no meio do som. Encolhe o envelope para ele chegar a zero antes; acontecia no coro da música do menu, entrada e saída de 1,6 s
    // numa nota de ~3 s, DESIGN.md §79)
    const len = b.duration / s.playbackRate.value - 0.04;
    if (fi + Math.max(0, hold) + fo > len) {
      hold = Math.max(0, len - fi - fo);
      if (fi + fo > len) {
        const k = len / (fi + fo);
        fi *= k;
        fo *= k;
      }
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + fi);
    g.gain.setValueAtTime(vol, t + fi + Math.max(0, hold));
    g.gain.linearRampToValueAtTime(0.0001, t + fi + Math.max(0, hold) + fo);
    let node: AudioNode = g;
    s.connect(g);
    if (opts.pan && ac.createStereoPanner) {
      const p = ac.createStereoPanner();
      p.pan.value = opts.pan;
      g.connect(p);
      node = p;
    }
    const L = opts.toMusic === false ? null : this.lanes[opts.lane ?? 'game'];
    node.connect(L ? L.dry : this.bus);
    if (opts.verb) {
      const v = ac.createGain();
      v.gain.value = opts.verb;
      node.connect(v).connect(L ? L.verb : this.verbSend);
    }
    if (opts.echo) {
      const e = ac.createGain();
      e.gain.value = opts.echo;
      node.connect(e).connect(L ? L.echo : this.echoSend);
    }
    s.start(t);
    s.stop(t + fi + Math.max(0, hold) + fo + 0.05);
    return { s, g, t };
  }

  // nota de instrumento como EFEITO (sai pelo canal dos efeitos, mesmo com a música desligada)
  private fxNote(inst: string, midi: number, vol: number, delay = 0, verb = 0.5, echo = 0) {
    if (!this.ac) return null;
    return this.note(inst, midi, this.ac.currentTime + delay, vol, { fadeIn: 0.005, fadeOut: 0.5, verb, echo, toMusic: false });
  }

  // a música abre espaço: cai até `depth` (0..1) depressa, fica `hold` s e volta em ~`release` s
  private duckMusic(depth: number, hold: number, release: number) {
    if (!this.ac || !this.mDuck) return;
    const now = this.ac.currentTime;
    if (now < this.duckHold && depth >= this.duckDepth) return; // (já está mais aberta para outro efeito: não sobe no meio dele)
    this.duckHold = now + hold;
    this.duckDepth = depth;
    for (const p of [this.mDuck.gain, this.mDuckV.gain]) {
      holdParam(p, now);
      p.setTargetAtTime(depth, now, 0.04);
      p.setTargetAtTime(1, now + hold, release / 3);
    }
  }
  // o volume de uma faixa de música (0..1), chegando lá com a constante de tempo `tc` (s), a partir de `at`
  private laneTo(name: LaneName, v: number, tc: number, at = 0) {
    const ac = this.ac;
    if (!ac || !this.lanes) return;
    const now = ac.currentTime;
    for (const p of [this.lanes[name].dry.gain, this.lanes[name].verb.gain, this.lanes[name].echo.gain]) {
      holdParam(p, now);
      p.setTargetAtTime(v, Math.max(now, at), Math.max(0.01, tc));
    }
  }
  private echoTime(s: number) {
    if (this.ac && this.mDelay) this.mDelay.delayTime.setTargetAtTime(s, this.ac.currentTime, 0.2);
  }

  // ── qual música toca ────────────────────────────────────────────────────
  // 'title' = a tela inicial (e os créditos); 'game' = o jogo, que começa em silêncio por `wait` s e entra devagar
  scene(s: MusicScene, o: { wait?: number } = {}) {
    if (!this.ac) {
      this.wantScene = { s, wait: o.wait };
      return;
    }
    const now = this.ac.currentTime;
    this.musicScene = s;
    if (this.fadedAll) {
      // (tudo tinha sumido para a página recarregar, e ela não recarregou: o som volta)
      this.fadedAll = false;
      this.applyMode();
    }
    if (s === 'title') {
      this.gm.st = 'rest';
      this.gm.until = Infinity;
      this.laneTo('game', 0, 1.5, now + (o.wait ?? 0));
      if (!this.titleOn) this.startTitle(now + (o.wait ?? 0)); // (já tocando: segue, sem recomeçar por cima das notas agendadas)
    } else {
      if (this.titleOn) {
        this.titleOn = false;
        this.laneTo('title', 0, 0.8);
      }
      if (this.gm.st !== 'play') {
        this.gm.st = 'rest';
        this.gm.until = now + (o.wait ?? 6);
      }
    }
  }
  // sair da tela inicial: 'new' = jogo novo (a câmera sobe pelo feixe até o branco e a página recarrega: um arpejo sobe para a luz e tudo
  // some até ~3,1 s); 'go' = continuar aqui (a música do menu some e a do jogo entra depois); 'out' = outro espaço (some e recarrega)
  leaveTitle(kind: 'new' | 'go' | 'out') {
    const ac = this.ac;
    if (!ac) return;
    const now = ac.currentTime;
    this.titleOn = false;
    if (kind === 'new') {
      if (this.mode === 0) {
        // o Lá maior subindo, da harpa à celesta, com o coro crescendo por baixo; o sino na entrada do branco
        const up = [57, 61, 64, 69, 73, 76, 81, 85, 88];
        up.forEach((m, i) => this.note(m > 84 ? 'celesta' : 'orchestral_harp', m, now + 0.85 + i * 0.22, 0.28 - i * 0.012, { fadeIn: 0.004, fadeOut: 0.9, verb: 0.8, echo: 0.25, pan: -0.4 + i * 0.1, lane: 'title' }));
        [57, 64, 73].forEach((m, i) => this.note('voice_oohs', m, now + 0.6 + i * 0.15, 0.22, { fadeIn: 1.6, hold: 0.4, fadeOut: 0.6, verb: 0.9, pan: (i - 1) * 0.4, lane: 'title' }));
        this.note('tubular_bells', 81, now + 2.75, 0.2, { fadeIn: 0.004, fadeOut: 0.4, verb: 1, lane: 'title' });
      }
      this.fadeAll(0.4, 2.75);
    } else if (kind === 'go') {
      this.laneTo('title', 0, 0.7);
    } else {
      this.laneTo('title', 0, 0.4);
      this.fadeAll(0.35, 0.95);
    }
  }
  // tudo some (antes de a página recarregar: sem corte seco)
  fadeAll(dur = 0.3, delay = 0) {
    if (!this.ac) return;
    const now = this.ac.currentTime;
    this.fadedAll = true;
    holdParam(this.master.gain, now);
    this.master.gain.setTargetAtTime(0, now + delay, dur / 3);
  }

  // ── efeitos ─────────────────────────────────────────────────────────────
  // `key` (opcional) diz O QUE acendeu: tocha ('tocha'), pano/estandarte ('pano', 'dm0'...): muda a gravação do 'ignite'
  play(name: SfxName, v = 1, key?: string) {
    if (!this.ac || this.mode === 2) return;
    this.played++;
    const now = this.ac.currentTime;
    if (name === 'door' || name === 'doorClose' || name === 'rise' || name === 'error' || name === 'dark' || name === 'gem' || name === 'gemBreak' || name === 'piece') this.duckUntil = Math.max(this.duckUntil, now + 1.6);
    switch (name) {
      case 'throw':
        this.sample(pick(['throw1', 'throw2']), 0.9 * Math.min(1, 0.4 + v), rand(0.93, 1.07));
        break;
      case 'recall':
        this.sample('recall', 0.85, rand(0.95, 1.05));
        break;
      case 'catch':
        this.sample('catch', 0.9, rand(0.95, 1.05));
        this.fxNote('celesta', 88, 0.22, 0.04, 0.6, 0.2);
        break;
      case 'put':
        this.sample(pick(['put1', 'put2']), 0.9, rand(0.92, 1.05));
        break;
      case 'rest':
        this.sample(pick(['bounce1', 'bounce2', 'bounce3']), 0.7 * Math.min(1, v), rand(0.75, 0.9));
        break;
      case 'face':
        {
          const m = FACE_MIDI[Math.max(0, Math.min(5, Math.round(v) - 1))];
          this.fxNote('glockenspiel', m, 0.45, 0, 0.5, 0.15);
        }
        break;
      case 'locked':
        this.sample('locked', 0.7, rand(0.75, 0.85));
        break;
      // interface (conversa e diário): sons suaves, sempre com os instrumentos reais
      case 'uiblip':
        this.fxNote('celesta', 79 + (Math.round(v) % 5) * 2, 0.07, 0, 0.15, 0);
        break;
      case 'uiopen':
        this.sample('swap1', 0.45, rand(0.85, 0.95));
        this.fxNote('orchestral_harp', 67, 0.25, 0.05, 0.5, 0.2);
        break;
      case 'uiflip':
        this.sample('swap2', 0.32, rand(1.15, 1.35));
        break;
      case 'uiclose':
        this.sample('swap2', 0.4, rand(0.8, 0.9));
        break;
      case 'uinew':
        this.fxNote('glockenspiel', 88, 0.3, 0, 0.6, 0.25);
        this.fxNote('glockenspiel', 95, 0.26, 0.11, 0.6, 0.25);
        break;
      case 'swap':
        this.sample(pick(['swap1', 'swap2']), 0.7, rand(0.95, 1.05));
        break;
      case 'sweep':
        this.sample('sweep', 0.8, 1);
        break;
      case 'ignite':
        // a chama pegando ("fff") com o corpo grave; a tocha é menor; o pano pega com uma lufada e estala
        if (key && /^(pano|dm\d)/.test(key)) this.sample('ignite_cloth', 0.95 * v, 1, 0, 0.3);
        else if (key && /tocha|torch/.test(key)) this.sample('ignite_small', 0.85 * v, 1.04, 0, 0.25);
        else {
          this.sample('ignite', 0.95 * v, 1, 0, 0.3);
          if (v > 0.6) this.fxNote('timpani', 36, 0.3, 0.03, 0.6);
        }
        this.sample('crackle', 0.35 * v, 1, 0.25, 0.2, 0, 0, rand(0, 4.5), 0.5); // as primeiras faíscas
        break;
      case 'plate':
        this.sample('plate1', 1, 0.85);
        this.sample('plate2', 0.7, 0.9, 0.03);
        this.fxNote('timpani', 36, 0.3, 0, 0.5);
        break;
      case 'gem':
        this.sample('gem1', 0.7, 1.1, 0, 0.5);
        this.sample('gem2', 0.5, 1, 0.05, 0.5);
        [84, 88, 91, 96].forEach((m, i) => this.fxNote('celesta', m, 0.4, 0.08 + i * 0.12, 0.7, 0.3));
        break;
      // a cena da gema, só com gravações e instrumentos reais: o sino de vidro e a celesta sobem quando ela vem; o vidro estala (em tom alto)
      // e o ar leva o pó; ao encaixar, um toque de latão e a harpa; a face completa ganha os sinos
      case 'gemShine':
        [84, 88, 91, 96].forEach((m, i) => this.fxNote('celesta', m, 0.2, i * 0.1, 0.7, 0.3));
        this.sample('gem1', 0.35, 1.2, 0.25, 0.6);
        break;
      case 'gemBreak':
        this.sample('gem2', 0.75, 1.35, 0, 0.5);
        this.sample('gem1', 0.4, 1.6, 0.02, 0.6);
        this.fxNote('glockenspiel', 100, 0.22, 0.01, 0.6, 0.2);
        this.fxNote('glockenspiel', 103, 0.16, 0.06, 0.6, 0.2);
        this.sample('sweep', 0.28, 1.7, 0.08, 0.5);
        break;
      case 'gemSet':
        this.sample('put1', 0.55, 1.35, 0, 0.3);
        [64, 69, 76].forEach((m, i) => this.fxNote('orchestral_harp', m, 0.4, 0.02 + i * 0.07, 0.6, 0.2));
        this.fxNote('celesta', 88, 0.3, 0.2, 0.7, 0.3);
        break;
      case 'gemFace':
        [72, 76, 79].forEach((m, i) => this.fxNote('tubular_bells', m, 0.3, 0.35 + i * 0.22, 0.9));
        break;
      // O ALTAR (§77), só com as gravações que o jogo já tem: pedra (o pilar, a laje da porta, o baque), o dado (pousar, rolar) e os
      // instrumentos reais. Racha: um estalo grave e pedrinhas. Empurrar: a pedra arrasta para dentro e desce. O dado desliza devagar.
      // Fecha: a laje bate. A luz: o coro baixinho, o violoncelo e os sinos. Abre: a laje sobe arrastando.
      case 'altarCrack':
        this.sample('boom', 0.5, 1.25, 0, 0.5);
        this.sample('rise', 0.55, 1.5, 0.05, 0.4, 0, 0, 1.6, 0.7);
        this.fxNote('cello', 31, 0.3, 0.05, 0.8);
        break;
      case 'altarPush':
        this.sample('rise', 0.75, 1.2, 0, 0.4, 0, 0, 0, 1.3);
        this.sample('door_shut', 0.35, 1.3, 1.05, 0.3);
        break;
      case 'altarSlide':
        this.sample('roll', 0.3, 0.55, 0, 0.3, 0, 1800, 0, 2.4);
        this.sample('put2', 0.45, 0.8, 0, 0.3);
        break;
      case 'altarShut':
        this.sample('door_shut', 0.9, 1.05, 0, 0.4);
        this.sample('boom', 0.35, 0.9, 0.02, 0.6, 0, 500);
        break;
      case 'altarGlow':
        this.duckMusic(0.4, 3, 2.5);
        this.fxNote('choir_aahs', 57, 0.22, 0, 0.9);
        this.fxNote('choir_aahs', 64, 0.16, 0.25, 0.9);
        this.fxNote('cello', 33, 0.4, 0, 0.9);
        [69, 76, 81].forEach((m, i) => this.fxNote('tubular_bells', m, 0.26, 0.5 + i * 0.3, 0.9));
        [84, 88, 91, 96].forEach((m, i) => this.fxNote('celesta', m, 0.18, 1.2 + i * 0.1, 0.8, 0.3));
        break;
      case 'altarOpen':
        this.sample('door_open', 0.85, 1.15, 0, 0.35);
        break;
      // porta de pedra: a laje sobe arrastando e trava lá em cima (com pó caindo); a Casa aceita (violoncelo grave). Logo depois do
      // "resolvido", quem fala pela Casa é ele: a porta fica só com a pedra
      case 'door':
        this.duckMusic(0.65, 1.2, 1.6);
        this.sample('door_open', 1, 0.95, 0, 0.35);
        this.fxNote('cello', 36, 0.42, 0.1, 0.8); // (a porta, aprovada pelo Pedro: a pedra e o violoncelo grave, sempre)
        break;
      // a laje desce raspando e bate no chão
      case 'doorClose':
        this.sample('door_shut', 0.9, 0.95, 0, 0.35);
        break;
      // pilar subindo do chão (2,2 s): arrasto grave, pedrinhas soltando e o baque no fim
      case 'rise':
        this.duckMusic(0.65, 1.8, 1.6);
        this.sample('rise', 1, 1, 0, 0.4);
        this.fxNote('cello', 33, 0.35, 0.2, 0.8);
        break;
      // o escuro: a chama sugada e, por baixo, um grave abafado e distante
      case 'dark':
        this.sample('burnout', 0.75, 0.9, 0, 0.3);
        this.sample('boom', 0.55, 0.85, 0.05, 0.6, 0, 400, 0, 0, true);
        break;
      // um passo CERTO, não o fim (DESIGN.md §79). Só pedra e mecanismo (pedido do Pedro: nada de harpa, celesta ou sino, "nada de mágico"):
      // uma lingueta de pedra caindo no lugar. O estalo da placa, o chocalho curto da trava e uma pedrinha que bate
      case 'piece':
        this.duckMusic(0.6, 0.5, 1.0);
        this.sample('plate2', 0.66, 0.9, 0, 0.3, 0, 3000);
        this.sample('locked', 0.54, 1.0, 0.02, 0.3);
        this.sample('bounce2', 0.25, 0.7, 0.08, 0.3, 0, 2000);
        // um FIO de descoberta, bem baixo (pedido do Pedro: "um pouco, bem pouco mesmo"): uma nota de harpa grave, quase escondida na pedra
        this.note('orchestral_harp', 57, now + 0.06, 0.042, { fadeIn: 0.004, fadeOut: 0.9, verb: 0.5, toMusic: false });
        break;
      case 'solved':
        this.solved();
        break;
      // um SEGREDO achado (DESIGN.md §79): o nicho escondido se abre. Só pedra: uma laje pequena correndo de lado (o arrasto do pilar, mais
      // agudo e curto), poeira e pedrisco escorrendo, a pedra assentando e um toque oco quando ela para. Mais baixo e mais perto que o resolvido
      case 'secret':
        this.duckMusic(0.5, 1.2, 1.4);
        this.sample('rise', 0.42, 1.3, 0, 0.35, 0, 2600, 0.2, 1.0);
        this.sample('step_rubble_l', 0.13, 1.5, 0.3, 0.3, -0.2, 3500);
        this.sample('step_rubble_r', 0.1, 1.7, 0.55, 0.3, 0.2, 3500);
        this.sample('settle', 0.18, 1.2, 0.85, 0.35, 0, 3000);
        this.sample('bounce4', 0.22, 0.55, 0.95, 0.35, 0, 900);
        // o fio de descoberta, bem baixo: as cordas entram devagar num Lá maior aberto e uma nota de harpa
        [57, 64, 73].forEach((m, i) => this.note('string_ensemble_1', m, now + 0.35 + i * 0.12, 0.03, { fadeIn: 0.5, hold: 0.4, fadeOut: 1.1, verb: 0.7, pan: (i - 1) * 0.3, toMusic: false }));
        this.note('orchestral_harp', 69, now + 0.5, 0.036, { fadeIn: 0.004, fadeOut: 1.0, verb: 0.6, echo: 0.15, toMusic: false });
        break;
      // a Casa recusa: o "toc" seco de madeira e, por baixo, um baque de pedra abafado (curto: repete-se quando o braseiro está frio)
      case 'error':
        this.sample('error', 0.72, 0.8);
        this.sample('bounce4', 0.32, 0.55, 0.004, 0.2, 0, 650);
        break;
      case 'burnout':
        this.sample('burnout', 0.6 * v, 1, 0, 0.2);
        break;
      // a escrita (letras e símbolos aparecendo): um pedaço curto e suave de uma gravação de giz, a cada vez em outro ponto, volume e altura
      case 'write':
        this.scribble(0.12 * v * (0.6 + 0.7 * Math.random()));
        break;
      // o barulho de algo se mexendo lá em cima, no poço (só gravações, mais graves e com muito eco): um estrondo surdo, duas batidas e o arrastar
      case 'shaftRumble':
        this.fxNote('timpani', 38, 0.5, 0, 0.95);
        this.sample('doorclose1', 0.5, 0.5, 0.05, 1, 0, 0, 0, 0, true);
        this.sample('bounce3', 0.5, 0.5, 0.5, 1, 0, 0, 0, 0, true);
        this.sample('bounce1', 0.4, 0.58, 0.85, 1, 0, 0, 0, 0, true);
        this.sample('sweep', 0.35, 0.55, 0.1, 0.9, 0, 0, 0, 0, true);
        break;
      // o dado despenca pelo poço: um assobio de ar que cai e a pancada grave no chão
      case 'shaftFall':
        this.sample('sweep', 0.5, 0.8, 0, 0.6, 0, 0, 0, 0, true);
        this.sample('land', 1, 0.6, 0.5, 0.8, 0, 0, 0, 0, true);
        this.fxNote('timpani', 43, 0.35, 0.5, 0.9);
        break;
      case 'land':
        this.sample('land', 0.8 * Math.min(1, v + 0.25), rand(0.85, 1));
        break;
      case 'room':
        this.sample('gong', 0.6, 0.85, 0, 0.7);
        this.fxNote('cello', 45, 0.45, 0.15, 0.8);
        break;
      // O FIM DO CAPÍTULO: a Casa inteira se mexe. Só pedra (pedido do Pedro): um estrondo grave e longo lá no fundo, um arrasto enorme e
      // lento, uma laje correndo ao longe, a pedra assentando, pedrisco caindo e, por fim, uma laje que bate longe
      case 'fanfare':
        this.duckMusic(0.25, 5, 3);
        this.sample('boom', 0.88, 0.7, 0, 0.7, 0, 260, 0, 0, true);
        this.sample('rise', 0.95, 0.75, 0.2, 0.6);
        this.sample('door_open', 0.72, 0.7, 1.4, 0.7, 0, 1800, 0, 0, true);
        this.sample('settle', 0.64, 0.7, 2.6, 0.6, 0, 2200);
        this.sample('step_rubble_l', 0.26, 1.2, 2.8, 0.5, -0.3, 3500);
        this.sample('step_rubble_r', 0.21, 1.4, 3.05, 0.5, 0.3, 3500);
        this.sample('door_shut', 0.56, 0.6, 3.3, 0.8, 0, 1500, 0, 0, true);
        // o fio de descoberta, bem baixo: o violoncelo grave (o mesmo da porta) e as cordas abrindo num Lá maior, por baixo do arrasto
        this.note('cello', 45, now + 0.4, 0.085, { fadeIn: 0.6, hold: 2.0, fadeOut: 2.0, verb: 0.8, toMusic: false });
        [57, 61, 64].forEach((m, i) => this.note('string_ensemble_1', m, now + 1.2 + i * 0.25, 0.033, { fadeIn: 1.0, hold: 1.4, fadeOut: 2.0, verb: 0.8, pan: (i - 1) * 0.3, toMusic: false }));
        break;
    }
  }

  // O RESOLVIDO (DESIGN.md §79): o mecanismo da Casa destravando, ~2,2 s. Só pedra e peso (pedido do Pedro: as versões com coro, harpa,
  // celesta, sino e gongo soavam sintéticas e "mágicas demais" para o jogo; o que ele aprovou foram a porta e o erro, de pedra e madeira).
  // Três linguetas caindo uma depois da outra (o estalo da placa, cada vez mais grave), o ferrolho correndo (a trava), um baque pesado com o
  // grave surdo lá no fundo, a pedra arrastando e assentando, e pedrisco caindo. A música abre espaço e depois sai, para ele respirar.
  private solved() {
    const ac = this.ac!;
    const now = ac.currentTime;
    this.dbg('solved');
    this.solvedAt = now;
    this.duckUntil = Math.max(this.duckUntil, now + 3.2);
    this.duckMusic(0.18, 2.6, 2.4);
    this.musicBreak(now);
    // as linguetas
    [0, 0.16, 0.3].forEach((at, i) => this.sample('plate2', 0.52 + i * 0.06, 0.95 - i * 0.05, at, 0.3, (i - 1) * 0.15, 3200));
    // o ferrolho e o baque
    this.sample('locked', 0.6, 0.8, 0.42, 0.35);
    this.sample('plate1', 0.9, 0.65, 0.5, 0.4, 0, 2200);
    this.sample('boom', 0.6, 0.85, 0.5, 0.5, 0, 300);
    // a pedra arrastando, assentando, e o pedrisco
    this.sample('rise', 0.68, 1.1, 0.55, 0.4, 0, 0, 0.3, 1.0);
    this.sample('settle', 0.52, 0.85, 1.2, 0.4, 0, 2400);
    this.sample('step_rubble_l', 0.22, 1.2, 1.35, 0.35, -0.25, 4000);
    this.sample('step_rubble_r', 0.18, 1.4, 1.55, 0.35, 0.25, 4000);
    // um FIO de descoberta, bem baixo (pedido do Pedro: "um pouco, bem pouco mesmo"): depois do baque, o violoncelo grave (o mesmo da porta,
    // que ele aprovou) e as cordas abrindo devagar num Lá maior, por baixo da pedra; e uma nota de harpa no fim. Nada de celesta, sino ou coro
    const n = (inst: string, m: number, at: number, vol: number, o: { fadeIn?: number; hold?: number; fadeOut?: number; verb?: number; echo?: number; pan?: number }) => this.note(inst, m, now + at, vol, { toMusic: false, ...o });
    n('cello', 45, 0.55, 0.072, { fadeIn: 0.25, hold: 0.9, fadeOut: 1.4, verb: 0.75 });
    [57, 61, 64].forEach((m, i) => n('string_ensemble_1', m, 0.7 + i * 0.1, 0.033, { fadeIn: 0.45, hold: 0.7, fadeOut: 1.3, verb: 0.75, pan: (i - 1) * 0.3 }));
    n('orchestral_harp', 69, 1.15, 0.036, { fadeIn: 0.004, fadeOut: 1.0, verb: 0.6, echo: 0.15 });
  }

  // passo: SEMPRE a mesma gravação para cada tipo de piso (decisão do Pedro: nada de sorteio). Pedra, degrau e entulho têm duas tomadas,
  // pé esquerdo e pé direito, que se alternam sempre na mesma ordem. Pedra = sapato de couro em pedra (sem o "toque-toque" de bota);
  // degrau = o mesmo sapato com o peso do corpo; entulho = pedrinhas soltas sob o sapato. A reverberação segue o tamanho da sala.
  step(surface: StepKind) {
    const ac = this.ac;
    if (!ac || this.mode === 2) return;
    this.steps++;
    const now = ac.currentTime;
    if (now - this.lastStep > 1.2) this.foot = 0; // parou e voltou a andar: começa sempre com o mesmo pé
    this.lastStep = now;
    const side = this.foot === 0 ? 'l' : 'r';
    this.foot ^= 1;
    const b = this.buf.get(`step_${surface}_${side}`) ?? this.buf.get(`step_${surface}`) ?? this.buf.get(`step_stone_${side}`);
    if (!b) return;
    this.dbg(`step_${surface}_${side}`);
    const vol = { stone: 0.36, stair: 0.42, rubble: 0.4, rug: 0.4, plate: 0.5, water: 0.42 }[surface];
    const rate = { stone: 0.94, stair: 0.9, rubble: 0.95, rug: 0.86, plate: 0.84, water: 0.9 }[surface];
    const cut = { stone: 2600, stair: 2300, rubble: 3600, rug: 700, plate: 950, water: 2400 }[surface];
    const verb = { stone: 0.16, stair: 0.18, rubble: 0.14, rug: 0.03, plate: 0.14, water: 0.12 }[surface];
    const s = ac.createBufferSource();
    s.buffer = b;
    s.playbackRate.value = rate;
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = cut;
    lp.Q.value = 0.5;
    const g = ac.createGain();
    g.gain.value = vol;
    s.connect(lp).connect(g);
    // um pé um pouco à esquerda, o outro um pouco à direita (bem pouco: só dá corpo)
    let out: AudioNode = g;
    if (ac.createStereoPanner) {
      const p = ac.createStereoPanner();
      p.pan.value = side === 'l' ? -0.12 : 0.12;
      g.connect(p);
      out = p;
    }
    out.connect(this.bus);
    const v = ac.createGain();
    // no silêncio da música os passos ganham um pouco mais de sala (o eco da pedra fica na frente)
    v.gain.value = verb * (0.6 + 0.8 * this.sizeLevel) * (1 + (this.ambBoost - 1) * 0.8);
    out.connect(v).connect(this.space);
    s.start(now);
  }

  // um "risquinho": pedaço curto de uma gravação de giz (início e fim suaves), em ponto aleatório
  scribble(vol: number) {
    const ac = this.ac;
    if (!ac || this.mode === 2) return;
    const b = this.buf.get(pick(['chalk1', 'chalk2']));
    if (!b) return;
    const dur = rand(0.06, 0.13);
    const off = rand(0.02, Math.max(0.03, b.duration - dur - 0.05));
    const t = ac.currentTime;
    const s = ac.createBufferSource();
    s.buffer = b;
    s.playbackRate.value = rand(0.92, 1.15);
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.018);
    g.gain.linearRampToValueAtTime(0, t + dur);
    s.connect(g).connect(this.bus);
    s.start(t, off, dur + 0.03);
  }

  // batida do dado (impact em m/s)
  bounce(impact: number) {
    const ac = this.ac;
    if (!ac || this.mode === 2 || impact < 1.4) return;
    const now = ac.currentTime;
    if (now - this.lastBounce < 0.07) return;
    this.lastBounce = now;
    const k = Math.min(1, impact / 9);
    this.sample(pick(['bounce1', 'bounce2', 'bounce3', 'bounce4']), 0.2 + 0.8 * k, rand(0.85, 1.15) * (1.1 - 0.25 * k), 0, 0.15);
  }

  // dado rolando (0..1): gravação de uma bola rolando, mais rápida quando o dado corre
  roll(level: number) {
    if (!this.ac || !this.rollG || !this.rollSrc) return;
    const t = this.ac.currentTime;
    this.rollG.gain.setTargetAtTime(this.mode === 2 ? 0 : level * 0.55, t, 0.06);
    this.rollSrc.playbackRate.setTargetAtTime(0.7 + level * 0.7, t, 0.1);
  }

  // giz riscando / borracha (0..1): gravações de giz na pedra e de borracha, repetidas enquanto você arrasta
  scratch(level: number, erase: boolean) {
    const ac = this.ac;
    if (!ac || this.mode === 2) return;
    const now = ac.currentTime;
    if (level > 0.5) {
      if (now >= this.scratchNext) {
        const name = erase ? 'erase' : pick(['chalk1', 'chalk2']);
        const b = this.buf.get(name);
        if (!b) return;
        const s = ac.createBufferSource();
        s.buffer = b;
        s.playbackRate.value = rand(0.92, 1.1);
        const g = ac.createGain();
        g.gain.value = erase ? 0.7 : 0.85;
        s.connect(g).connect(this.bus);
        s.start();
        this.scratchNode?.gain.setTargetAtTime(0.0001, now, 0.04);
        this.scratchNode = g;
        this.scratchNext = now + (erase ? 0.5 : 0.3);
      }
    } else if (this.scratchNode) {
      this.scratchNode.gain.setTargetAtTime(0.0001, now, 0.05); // parou de arrastar: a gravação some rápido
      this.scratchNode = null;
      this.scratchNext = 0;
    }
  }

  // fogo por perto (0..1) e de que lado ele está (-1 esquerda .. 1 direita): o laço da chama + estalos soltos, nunca iguais
  fire(level: number, pan = 0) {
    this.fireTarget = Math.min(1, level);
    this.firePan = Math.max(-1, Math.min(1, pan));
  }

  // o lugar onde o jogador está (chamar todo quadro; ver AmbientState)
  ambient(a: AmbientState) {
    this.amb = a;
  }

  // a luz que ESCREVE uma frase acesa passa pelo símbolo i de n (da esquerda para a direita): uma nota de celesta que sobe, com a harpa
  // por baixo, do lado em que está a frase; no último símbolo, a harpa assenta num acorde (a Casa leu)
  glyph(i: number, n: number, pan = 0) {
    if (!this.ac || this.mode === 2) return;
    this.dbg(`glyph${i + 1}/${n}`);
    const SCALE = [69, 72, 74, 76, 79, 81, 84, 86, 88]; // lá menor pentatônica, como as faces do dado
    const k = n <= 1 ? 0 : i / (n - 1);
    const m = SCALE[Math.min(SCALE.length - 1, Math.round(k * Math.min(SCALE.length - 1, n + 1)))];
    const p = Math.max(-0.8, Math.min(0.8, pan));
    this.note('celesta', m, this.ac.currentTime, 0.13, { fadeIn: 0.005, fadeOut: 0.7, verb: 0.55, echo: 0.18, pan: p, toMusic: false });
    this.note('orchestral_harp', m - 12, this.ac.currentTime + 0.01, 0.12, { fadeIn: 0.004, fadeOut: 0.8, verb: 0.5, pan: p, toMusic: false });
    if (i === n - 1) [57, 64, 69].forEach((mm, j) => this.note('orchestral_harp', mm, this.ac!.currentTime + 0.16 + j * 0.07, 0.16, { fadeIn: 0.004, fadeOut: 1.2, verb: 0.7, echo: 0.2, pan: p * 0.5, toMusic: false }));
  }

  // ── ambiente: vento, o ar da sala, rajadas, gotas, estalos do fogo e a Casa respirando ──
  private ambientTick(dt: number, now: number) {
    const a = this.amb;
    const on = this.mode !== 2 && this.loaded > 0;
    // o ambiente abre espaço para o que importa: pausa, porta, erro, o escuro (baixa por ~1,6 s)
    const duck = (a.paused ? 0.45 : 1) * (now < this.duckUntil ? 0.5 : 1);
    // no SILÊNCIO da música (§79) o ambiente sobe ~2,5 dB, devagar: os passos, o vento, as gotas e o fogo ficam na frente
    const resting = this.mode === 0 && this.musicScene === 'game' && (this.gm.st === 'rest' || (this.gm.st === 'fade' && this.gm.faded));
    this.ambBoost += ((resting ? 1.33 : 1) - this.ambBoost) * Math.min(1, dt * 0.25);
    const boost = this.ambBoost;
    // vento: segue o lugar devagar (não "pula" ao virar uma esquina); perto da abertura, mais forte e mais claro
    this.windLevel += (a.wind - this.windLevel) * Math.min(1, dt * 0.9);
    const w = this.windLevel;
    this.sizeLevel += (a.size - this.sizeLevel) * Math.min(1, dt * 0.8);
    // o vento respira: um passeio lento entre 70% e 115% (volume e brilho), para o laço de 16 s nunca soar igual
    if (now >= this.windModAt) {
      this.windModTo = rand(0.7, 1.15);
      this.windModAt = now + rand(2.5, 6);
    }
    this.windMod += (this.windModTo - this.windMod) * Math.min(1, dt * 0.45);
    this.darkLevel += ((a.dark ?? 0) - this.darkLevel) * Math.min(1, dt * 6);
    // (os volumes e filtros mudam só ~10 vezes por segundo: menos trabalho para o celular; as rampas suaves cobrem o resto)
    if (now >= this.paramAt) {
      this.paramAt = now + 0.1;
      const wm = this.windMod;
      if (this.windG) this.windG.gain.setTargetAtTime(on ? 0.38 * Math.pow(w, 1.3) * duck * boost * wm : 0, now, 0.25);
      if (this.windLP) this.windLP.frequency.setTargetAtTime((350 + 4200 * w * w) * (0.8 + 0.3 * wm), now, 0.3);
      // o ar da sala: sempre um fio, um pouco mais presente nas salas grandes e onde venta
      if (this.toneG) this.toneG.gain.setTargetAtTime(on ? (0.06 + 0.05 * this.sizeLevel + 0.08 * w) * duck * (1 + (boost - 1) * 0.7) * (0.85 + 0.15 * wm) : 0, now, 0.4);
      this.setSpace(this.sizeLevel);
      const fl = this.fireLevel;
      if (this.fireG) this.fireG.gain.setTargetAtTime(this.mode === 2 ? 0 : fl * 0.95 * duck * Math.sqrt(boost), now, 0.1);
      if (this.fireLP) this.fireLP.frequency.setTargetAtTime(900 + 6000 * fl * fl, now, 0.15);
      if (this.firePanN) this.firePanN.pan.setTargetAtTime(this.firePan * (1 - 0.5 * fl), now, 0.2); // bem perto, o fogo "abraça" (menos lateral)
      // o escuro: a música recua junto com a luz (e volta com ela)
      const dk = this.darkLevel < 0.002 ? 0 : this.darkLevel;
      if (this.musicBus && Math.abs(dk - this.darkApplied) > 0.01) {
        this.darkApplied = dk;
        this.applyMusic(0.12);
      }
    }
    if (!on || a.paused) return;
    // rajadas: só onde venta de verdade, de tempos em tempos, de um lado ou do outro
    if (now >= this.nextGust) {
      if (w > 0.22) {
        this.sample('gust', 0.32 * Math.pow(w, 1.2) * boost, rand(0.85, 1.1), 0, 0, rand(-0.6, 0.6), 600 + 4500 * w * w);
        this.nextGust = now + rand(9, 22) / (w + 0.3);
      } else this.nextGust = now + rand(3, 6); // aqui não venta: olha de novo daqui a pouco (ao chegar num lugar aberto, a rajada não demora)
    }
    // gotas: espaçadas, com eco de pedra, do lado em que pingam; às vezes duas seguidas, às vezes uma lá longe (abafada, na sala longa)
    if (now >= this.nextDrip) {
      if (a.drip > 0.02) {
        const far = Math.random() < 0.22;
        if (far) this.sample('drip', 0.13 * a.drip * boost, rand(0.8, 0.95), 0, 0.9, rand(-0.8, 0.8), 2200, pick(DRIPS), 0.55, true);
        else {
          this.sample('drip', 0.3 * a.drip * boost, rand(0.88, 1.12), 0, 0.7, a.dripPan, 0, pick(DRIPS), 0.55);
          if (Math.random() < 0.2) this.sample('drip', 0.13 * a.drip * boost, rand(1.0, 1.2), rand(0.22, 0.5), 0.7, a.dripPan, 0, pick(DRIPS), 0.55);
        }
      }
      this.nextDrip = now + rand(1.8, 6.5);
    }
    // estalos do fogo (pedacinhos de gravações de fogo, ao acaso): mais e mais altos perto; longe, abafados
    const fl = this.fireLevel;
    if (now >= this.nextCrackle) {
      if (fl > 0.06) {
        const crk = this.buf.get('crackle');
        const dur = rand(0.06, 0.22);
        if (crk) this.sample('crackle', 0.32 * fl * rand(0.5, 1) * Math.sqrt(boost), rand(0.85, 1.2), 0, 0.12, this.firePan + rand(-0.15, 0.15), 1500 + 8000 * fl, rand(0, crk.duration - dur - 0.02), dur);
      }
      this.nextCrackle = now + rand(0.12, 0.7) / Math.max(0.25, fl);
    }
    // a Casa respira: um grave distante, pedra rangendo, pedrinhas caindo lá longe, um arrasto surdo. Raro (1 a 2,5 min; no silêncio da
    // música, 40 s a 1,5 min), só num momento calmo, e nunca duas vezes o mesmo seguido
    if (now >= this.nextBreath) {
      if (a.calm) {
        this.breathKind = (this.breathKind + 1 + Math.floor(Math.random() * 4)) % 5;
        const pan = rand(-0.7, 0.7);
        if (this.breathKind === 0) {
          // um grave que vem de longe: o tambor de tronco abafado e, por baixo, o violoncelo que cresce e some (um suspiro)
          this.sample('boom', 0.3, rand(0.85, 1.0), 0, 0.9, pan, 380, 0, 0, true);
          this.note('cello', pick([33, 36]), now + 0.1, 0.1, { fadeIn: 1.4, hold: 0.6, fadeOut: 1.6, verb: 0.9, pan: pan * 0.5, toMusic: false });
        } else if (this.breathKind === 1) this.sample('creak', 0.13, rand(0.8, 1.0), 0, 0.8, pan, 900, 0, 0, true);
        else if (this.breathKind === 2) {
          this.sample('boom', 0.2, 0.8, 0, 0.9, pan, 300, 0, 0, true);
          this.sample('creak', 0.09, 0.75, 1.1, 0.9, -pan, 700, 0, 0, true);
        } else if (this.breathKind === 3) {
          // pedrinhas e pó caindo em outra sala (a Casa assentando)
          this.sample('settle', 0.14, rand(0.8, 0.95), 0, 1, pan, 1800, 0, 0, true);
        } else {
          // um bloco arrastado lá longe, devagar, quase só o grave
          this.sample('rise', 0.16, 0.5, 0, 1, pan, 380, 0.2, 2.4, true);
        }
        this.nextBreath = now + (resting ? rand(40, 90) : rand(70, 150));
      } else this.nextBreath = now + rand(8, 20); // não era calmo: tenta de novo daqui a pouco
    }
  }

  // chamar todo quadro
  tick(dt: number) {
    const ac = this.ac;
    if (!ac) return;
    const now = ac.currentTime;
    this.fireLevel += (this.fireTarget - this.fireLevel) * Math.min(1, dt * 3);
    this.ambientTick(dt, now);
    if (this.mode !== 0) return;
    this.titleMusic(now);
    this.gameMusic(now);
  }

  // ── a música do jogo, em FRASES (DESIGN.md §79) ─────────────────────────
  // Uma frase = uma ou duas voltas da progressão (64 ou 128 s) e a coda (o Lá menor, que resolve e some): 1min20 a 2min30. Depois, um
  // silêncio de 45 s a 2 min (nas áreas livres, mais longo) em que o ambiente fica na frente; e a música volta devagar. Um puzzle resolvido
  // encerra a frase na hora (o resolvido respira) e o silêncio que vem é mais curto.
  private gameMusic(now: number) {
    if (this.musicScene !== 'game' || !this.inst.cello || this.inst.cello.bufs.size === 0) return;
    const g = this.gm;
    if (g.st === 'rest') {
      if (now < g.until) return;
      this.startPhrase(now);
    }
    if (g.st === 'fade') {
      if (!g.faded && now >= g.fadeAt) {
        g.faded = true;
        this.laneTo('game', 0, 3.2);
      }
      if (now >= g.until) {
        g.st = 'rest';
        g.until = now + (this.mt.rest ?? rand(45, 120)) * (this.amb.quiet ? 1.5 : 1);
      }
      return;
    }
    // ── tocando: acordes de baixo + cordas + coro, harpa, celesta, flauta e tímpano ──
    if (this.chordAt < now - 0.5) {
      // (a música esteve desligada no meio da frase: ela segue daqui, sem tocar de uma vez os acordes que ficaram para trás)
      const d = now + 0.2 - this.chordAt;
      this.chordAt += d;
      g.phraseEnd += d;
      this.nextHarp = Math.max(this.nextHarp, now + 2);
      this.nextCelesta = Math.max(this.nextCelesta, now + 4);
      this.nextFlute = Math.max(this.nextFlute, now + 10);
      this.nextTimpani = Math.max(this.nextTimpani, now + 20);
    }
    while (this.chordAt < now + 2) {
      if (g.left <= 0) {
        // fim da frase: a coda (o Lá menor) e a música some no meio dela
        this.scheduleCoda(this.chordAt);
        g.st = 'fade';
        g.fadeAt = this.chordAt + 4;
        g.faded = false;
        g.until = this.chordAt + CHORD_LEN;
        return;
      }
      this.scheduleChord(PROG[this.chordIdx % PROG.length], this.chordAt, this.chordIdx);
      this.chordAt += CHORD_LEN;
      this.chordIdx++;
      g.left--;
    }
    const ch = PROG[(this.chordIdx - 1 + PROG.length) % PROG.length];
    const end = g.phraseEnd - 1.5; // (os enfeites param antes da coda)
    while (this.nextHarp < now + 0.5) {
      if (this.nextHarp < end) this.harpPhrase(ch, Math.max(now, this.nextHarp));
      this.nextHarp += rand(5, 9);
    }
    while (this.nextCelesta < now + 0.5) {
      const m = pick(ch.scale) + 24;
      if (this.nextCelesta < end) this.note('celesta', m, Math.max(now, this.nextCelesta), 0.3, { fadeIn: 0.005, fadeOut: 0.6, verb: 0.8, echo: 0.55, pan: rand(-0.5, 0.5) });
      this.nextCelesta += rand(7, 14);
    }
    while (this.nextFlute < now + 0.5) {
      if (this.nextFlute < end - 6) this.flutePhrase(ch, Math.max(now, this.nextFlute));
      this.nextFlute += rand(24, 40);
    }
    while (this.nextTimpani < now + 0.5) {
      if (this.nextTimpani < end) this.note('timpani', pick([33, 36, 38]), Math.max(now, this.nextTimpani), 0.28, { fadeIn: 0.005, fadeOut: 0.8, verb: 0.9 });
      this.nextTimpani += rand(40, 70);
    }
  }

  private startPhrase(now: number) {
    const g = this.gm;
    const first = !g.started;
    g.started = true;
    // a 1ª frase do jogo tem duas voltas; depois, uma ou duas; nas áreas livres, uma
    const cycles = this.amb.quiet ? 1 : first ? 2 : 1 + Math.floor(Math.random() * 2);
    this.chordIdx = 0;
    this.chordAt = now + 0.2;
    g.left = this.mt.chords ?? cycles * PROG.length;
    g.st = 'play';
    g.phraseEnd = this.chordAt + g.left * CHORD_LEN;
    this.nextHarp = now + rand(5, 8);
    this.nextCelesta = now + rand(9, 13);
    this.nextFlute = now + rand(20, 30);
    this.nextTimpani = now + rand(35, 55);
    this.echoTime(0.52);
    // volta devagar: ~10 s até o volume cheio
    this.laneTo('game', 1, 3.5);
  }

  // o fim de uma frase da música do jogo, ou a saída por um puzzle resolvido
  private musicBreak(now: number) {
    if (this.musicScene !== 'game') return;
    const g = this.gm;
    const rest = this.mt.rest ?? rand(35, 60);
    if (g.st === 'play' || g.st === 'fade') {
      // a música já abriu espaço para o resolvido; em vez de voltar, ela vai embora por baixo dele
      this.laneTo('game', 0, 1.3, now + 0.4);
      g.st = 'rest';
      g.until = now + 4 + rest;
    } else g.until = Math.max(g.until, now + 0.6 * rest);
  }

  private scheduleChord(c: Chord, t: number, idx: number) {
    // baixo: violoncelo, nota longa renovada a cada ~2,7 s (a gravação dura ~3 s)
    for (let k = 0; t + k * 2.7 < t + CHORD_LEN; k++) {
      this.note('cello', c.root, t + k * 2.7, 0.85, { fadeIn: 0.5, fadeOut: 0.7, verb: 0.5 });
      if (k % 2 === 0) this.note('cello', c.root + 7, t + k * 2.7 + 0.2, 0.4, { fadeIn: 0.7, fadeOut: 0.8, verb: 0.5 });
    }
    // colchão: cordas num acorde, coro no seguinte (entradas escalonadas, bem suaves)
    const pad = idx % 2 === 0 ? 'string_ensemble_1' : 'choir_aahs';
    c.pad.forEach((m, i) => {
      for (let k = 0; t + i * 0.7 + k * 2.6 < t + CHORD_LEN + 1.5; k++) {
        this.note(pad, m, t + i * 0.7 + k * 2.6, 0.5, { fadeIn: 1.1, fadeOut: 1.3, verb: 0.8, pan: (i - 1) * 0.35 });
      }
    });
  }

  // a coda: o Lá menor, cada vez mais fino (o baixo e as cordas diminuindo), e uma última frase da harpa que desce
  private scheduleCoda(t: number) {
    const c = PROG[0];
    for (let k = 0; k < 5; k++) this.note('cello', c.root, t + k * 2.7, 0.85 * (1 - k * 0.16), { fadeIn: 0.5, fadeOut: 0.9, verb: 0.55 });
    this.note('cello', c.root + 7, t + 0.2, 0.35, { fadeIn: 0.7, fadeOut: 1.0, verb: 0.55 });
    c.pad.forEach((m, i) => {
      for (let k = 0; k < 3; k++) this.note('string_ensemble_1', m, t + i * 0.7 + k * 2.6, 0.5 * (1 - k * 0.25), { fadeIn: 1.1, fadeOut: 1.5, verb: 0.85, pan: (i - 1) * 0.35 });
    });
    [76, 72, 69, 64, 57].forEach((m, i) => this.note('orchestral_harp', m, t + 1.4 + i * 1.05, 0.42, { fadeIn: 0.004, fadeOut: 1.0, verb: 0.75, echo: 0.35, pan: 0.3 - i * 0.12 }));
    this.note('celesta', 93, t + 7.4, 0.18, { fadeIn: 0.005, fadeOut: 0.8, verb: 0.9, echo: 0.5 });
  }

  private harpPhrase(c: Chord, t: number) {
    const n = 4 + Math.floor(Math.random() * 3);
    let idx = Math.floor(Math.random() * 4);
    const up = Math.random() < 0.6;
    const pan = rand(-0.5, 0.5);
    for (let i = 0; i < n; i++) {
      idx = Math.max(0, Math.min(c.scale.length - 1, idx + (up ? 1 : -1) * (Math.random() < 0.7 ? 1 : 2)));
      this.note('orchestral_harp', c.scale[idx], t + i * rand(0.7, 1.2), 0.5, { fadeIn: 0.004, fadeOut: 0.8, verb: 0.7, echo: 0.3, pan });
    }
  }

  private flutePhrase(c: Chord, t: number) {
    const n = 3 + Math.floor(Math.random() * 2);
    let at = t;
    let idx = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      idx = Math.max(0, Math.min(c.scale.length - 1, idx + pick([-2, -1, 1, 2])));
      this.note('flute', c.scale[idx] + 12, at, 0.38, { fadeIn: 0.25, fadeOut: 0.9, verb: 0.9, echo: 0.3 });
      at += rand(1.6, 2.6);
    }
  }

  // ── a música da tela inicial, "O Poço" ──────────────────────────────────
  private startTitle(t: number) {
    this.titleOn = true;
    this.tIdx = 0;
    this.tAt = t + 0.3;
    this.nextTHarp = t + 7;
    this.nextTCel = t + 10;
    this.nextTBell = t + rand(26, 34);
    this.nextTBottle = t + rand(16, 22);
    this.tMotifFrom = 0;
    this.tMotifUntil = 0;
    this.echoTime(0.78); // o eco do poço: mais longo que o das salas
    this.laneTo('title', TITLE_GAIN, 1.2, t);
  }

  private titleMusic(now: number) {
    if (!this.titleOn) return;
    const pad = this.inst.voice_oohs ? 'voice_oohs' : 'choir_aahs';
    if (!this.inst[pad] || !this.inst.orchestral_harp) return;
    if (this.tAt < now) {
      // (os instrumentos chegaram depois da hora marcada: a peça começa agora, sem empilhar o que ficou para trás)
      const d = now + 0.3 - this.tAt;
      this.tAt += d;
      this.nextTHarp += d;
      this.nextTCel += d;
      this.nextTBell += d;
      this.nextTBottle += d;
    }
    // (agenda 4 s à frente: o tema fica conhecido antes de a harpa decidir se cai por cima dele)
    while (this.tAt < now + 4) {
      this.scheduleTChord(TPROG[this.tIdx % TPROG.length], this.tAt, this.tIdx, pad);
      this.tAt += T_LEN;
      this.tIdx++;
    }
    // a harpa cai devagar, de cima para baixo, como gotas de luz no poço (nunca por cima do tema)
    while (this.nextTHarp < now + 0.5) {
      const at = Math.max(now, this.nextTHarp);
      if (at + 6 > this.tMotifFrom && at < this.tMotifUntil) {
        this.nextTHarp = this.tMotifUntil + rand(1, 3);
        continue;
      }
      this.tHarpDrops(at);
      this.nextTHarp += rand(9, 15);
    }
    // a celesta, lá no alto: uma nota, às vezes uma quinta acima logo depois (o eco a faz soar ~3 s: a nota tem de caber também no acorde
    // seguinte, se ele chegar nesse meio-tempo; a quinta, só se também couber)
    while (this.nextTCel < now + 0.5) {
      const at = Math.max(now, this.nextTCel);
      const arp = this.tSafe(at, 3);
      const m = Math.min(93, pick(arp) + 12);
      this.note('celesta', m, at, 0.2, { fadeIn: 0.005, fadeOut: 0.8, verb: 0.85, echo: 0.5, pan: rand(-0.6, 0.6), lane: 'title' });
      if (Math.random() < 0.4 && m + 7 <= 96 && arp.some((x) => (x - (m + 7)) % 12 === 0)) this.note('celesta', m + 7, at + 0.42, 0.14, { fadeIn: 0.005, fadeOut: 0.8, verb: 0.85, echo: 0.5, pan: rand(-0.6, 0.6), lane: 'title' });
      this.nextTCel += rand(11, 19);
    }
    // um sino lá em cima, longe
    while (this.nextTBell < now + 0.5) {
      // (lá ou ré, o que couber no acorde de agora e no dos próximos 4 s: o ré do sino não cai em cima do dó sustenido da luz)
      const at = Math.max(now, this.nextTBell);
      const a = this.tNotes(at).pcs;
      const b = this.tNotes(at + 4).pcs;
      const m = pick([57, 62, 69].filter((x) => a.has(x % 12) && b.has(x % 12)));
      if (m) this.note('tubular_bells', m, at, 0.17, { fadeIn: 0.005, fadeOut: 1.2, verb: 1, echo: 0.3, pan: rand(-0.3, 0.3), lane: 'title' });
      this.nextTBell += rand(45, 80);
    }
    // o sopro na boca do poço: uma garrafa soprada, uma nota longa do acorde, quase vento
    while (this.nextTBottle < now + 0.5) {
      const at = Math.max(now, this.nextTBottle);
      if (this.inst.blown_bottle) {
        // (os dois sopros duram ~5,5 s: a nota tem de ser do acorde de agora e do que estiver soando no fim deles)
        const pcs = this.tNotes(at + 5.5).pcs;
        const m = pick(this.tNotes(at).pad.map((p) => p + 12).filter((p) => p >= 62 && p <= 76 && pcs.has(p % 12)));
        if (m) {
          const pan = rand(-0.5, 0.5);
          this.note('blown_bottle', m, at, 0.13, { fadeIn: 1.8, hold: 0.3, fadeOut: 0.9, verb: 0.95, echo: 0.2, pan, lane: 'title' });
          this.note('blown_bottle', m, at + 2.6, 0.11, { fadeIn: 0.4, hold: 0.6, fadeOut: 1.6, verb: 0.95, echo: 0.2, pan, lane: 'title' });
        }
      }
      this.nextTBottle += rand(28, 50);
    }
  }

  private scheduleTChord(c: TChord, t: number, idx: number, pad: string) {
    const bassInst = this.inst.contrabass ? 'contrabass' : 'cello';
    // (revisão, §79) cada acorde se cala até ~0,7 s depois do fim dele: antes, o coro do acorde que saía ainda estava no auge 2 s dentro do
    // seguinte e raspava meio tom nele (o dó natural do Dó por cima do dó sustenido da luz; fá e mi; lá e si bemol). A reverberação cobre a
    // passagem, e o coro "respira" entre um acorde e outro.
    const end = t + T_LEN + 0.7;
    const upTo = (at: number, fi: number, fo: number) => ({ fadeIn: fi, hold: 0, fadeOut: Math.max(0.5, Math.min(fo, end - at - fi)) });
    // o chão: o contrabaixo, nota longa renovada; o violoncelo uma oitava acima, de vez em quando
    for (let k = 0; t + k * 2.6 < t + T_LEN; k++) {
      const at = t + k * 2.6;
      const last = at + 2.6 >= t + T_LEN;
      // (a última nota do baixo some no fim do acorde, sem ficar meio tom embaixo do baixo novo: si bemol e lá)
      this.note(bassInst, c.bass, at, 0.72, last ? { fadeIn: 0.9, hold: Math.max(0, end - 0.2 - at - 1.7), fadeOut: 0.8, verb: 0.6 } : { fadeIn: 0.9, fadeOut: 1.1, verb: 0.6 });
      if (k % 2 === 1) this.note('cello', c.bass + 12, at + 0.3, 0.2, { fadeIn: 1.0, fadeOut: 1.0, verb: 0.7 });
    }
    // o coro respira o acorde (entradas escalonadas, bem lentas); no suspenso, a nota de cima resolve na metade
    c.pad.forEach((m0, i) => {
      for (let k = 0; t + i * 0.9 + k * 2.7 < t + T_LEN - 1.4; k++) {
        const at = t + i * 0.9 + k * 2.7;
        const m = c.sus !== undefined && i === c.pad.length - 1 && at > t + T_LEN / 2 ? c.sus : m0;
        this.note(pad, m, at, 0.4, { ...upTo(at, 1.6, 1.6), verb: 0.9, pan: (i - (c.pad.length - 1) / 2) * 0.4, lane: 'title' });
      }
    });
    // a luz: um fio de cordas, uma oitava acima do coro
    if (c.light) {
      const top = c.pad[c.pad.length - 1] + 12;
      for (let k = 0; k < 4; k++) {
        const at = t + 1.5 + k * 2.6;
        this.note('string_ensemble_1', k >= 2 && c.sus !== undefined ? c.sus + 12 : top, at, 0.16, { fadeIn: 1.4, hold: Math.max(0, Math.min(0.3, end - at - 2.8)), fadeOut: Math.max(0.5, Math.min(1.4, end - at - 1.4)), verb: 0.95, pan: 0.2, lane: 'title' });
      }
    }
    // o tema, no começo de cada metade (a segunda versão só nas voltas ímpares, para não cansar)
    const k8 = idx % TPROG.length;
    const loop = Math.floor(idx / TPROG.length);
    if (k8 === 0 || (k8 === 4 && loop % 2 === 1)) this.motif(k8 === 0 ? MOTIF_A : MOTIF_B, t + 3);
  }

  private motif(m: [number, number, boolean?][], t: number) {
    const pan = rand(-0.25, 0.25);
    for (const [n, at, long] of m) {
      this.note('orchestral_harp', n, t + at, 0.4, { fadeIn: 0.004, fadeOut: 1.0, verb: 0.8, echo: 0.35, pan, lane: 'title' });
      if (long) this.note('celesta', n + 12, t + at + 0.02, 0.12, { fadeIn: 0.004, fadeOut: 0.9, verb: 0.85, echo: 0.4, pan: -pan, lane: 'title' });
    }
    this.tMotifFrom = t;
    this.tMotifUntil = t + m[m.length - 1][1] + 2.5;
  }

  // as notas da peça do menu no instante `x` (também nos acordes que ainda não foram agendados: a ordem é fixa). No acorde suspenso, da
  // metade em diante a quarta já resolveu (o ré vira dó sustenido também na harpa, na celesta e na garrafa)
  private tNotes(x: number): { arp: number[]; pad: number[]; pcs: Set<number> } {
    const j = this.tIdx + Math.floor((x - this.tAt) / T_LEN);
    const c = TPROG[((j % TPROG.length) + TPROG.length) % TPROG.length];
    const start = this.tAt + (j - this.tIdx) * T_LEN;
    const top = c.pad[c.pad.length - 1] % 12;
    const down = c.sus !== undefined && x >= start + T_LEN / 2 ? top - (c.sus % 12) : 0;
    const fix = (m: number) => (down && m % 12 === top ? m - down : m);
    const arp = c.arp.map(fix);
    const pad = c.pad.map(fix);
    return { arp, pad, pcs: new Set([c.bass, ...pad, ...arp].map((m) => m % 12)) };
  }
  // as notas de `arp` que cabem nos dois instantes, `at` e `at + ring` (uma nota que ainda soa quando o acorde muda não pode raspar no
  // seguinte); se nenhuma cabe, já usa as do seguinte (antecipa)
  private tSafe(at: number, ring: number): number[] {
    const a = this.tNotes(at);
    const b = this.tNotes(at + ring);
    const both = a.arp.filter((m) => b.pcs.has(m % 12));
    return both.length ? both : b.arp;
  }

  // (revisão, §79) cada gota escolhe a nota do acorde que soa quando ela cai: antes, as cinco gotas saíam do acorde em que a frase começou e,
  // perto da troca, caíam por cima do acorde seguinte (um dó natural da harpa dentro do Lá maior da luz)
  private tHarpDrops(t: number) {
    const n = 3 + Math.floor(Math.random() * 3);
    const a0 = this.tNotes(t).arp;
    let m = a0[a0.length - 1 - Math.floor(Math.random() * 2)];
    let at = t;
    let pan = rand(-0.5, 0.5);
    for (let i = 0; i < n; i++) {
      const arp = this.tSafe(at, 1.6);
      const below = arp.filter((x) => x <= m);
      if (!below.length) break;
      const note = below[below.length - 1];
      this.note('orchestral_harp', note, at, 0.36 - i * 0.03, { fadeIn: 0.004, fadeOut: 0.9, verb: 0.85, echo: 0.45, pan, lane: 'title' });
      // a próxima: um ou dois degraus abaixo (se o acorde mudar até lá, a mais alta dele que fica abaixo desta)
      const k = below.length - 1 - (Math.random() < 0.65 ? 1 : 2);
      if (k < 0) break;
      m = below[k];
      at += rand(0.9, 1.5);
      pan = Math.max(-0.7, Math.min(0.7, pan + rand(-0.25, 0.25)));
    }
  }
}
