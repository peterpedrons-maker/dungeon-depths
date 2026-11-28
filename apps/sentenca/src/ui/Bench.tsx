// O TESTE DE DESEMPENHO (?bench=1; DESIGN.md §100, pedido do Pedro antes de pensar em app de celular e Steam).
// Qualquer pessoa abre o endereço do jogo com ?bench=1 no aparelho que quer medir: o jogo passeia sozinho por cinco salas pesadas, em quatro
// níveis de qualidade, mede quantos quadros por segundo o aparelho desenha e onde engasga, e mostra um relatório com o aparelho, os números
// e a qualidade que ele recomenda. Nada é gravado: nem o jogo salvo, nem o caderno, nem as configurações (só se a pessoa apertar "Usar a
// recomendada neste aparelho").
//
// Como mede: o motor segura a câmera na entrada de cada sala e a gira devagar uma volta inteira (scene.benchView); aqui, um laço de
// requestAnimationFrame mede o intervalo entre um quadro e o seguinte (é o mesmo ritmo do desenho do jogo). O primeiro 1,2 s de cada sala
// não conta (a troca de sala e de qualidade monta sombras e materiais e engasga uma vez; isso não é o jogo de sempre).
import { useEffect, useRef, useState } from 'react';
import { configStore, type Config } from '../story/config';
import type { SceneApi } from '../scene/scene';

interface Level {
  name: string;
  cfg: Pick<Config, 'quality' | 'shadows' | 'pixel'>;
}
// os quatro níveis, como alguém escolheria em Configurações → Imagem
const LEVELS: Level[] = [
  { name: 'Alta', cfg: { quality: 'alta', shadows: 'altas', pixel: 'medio' } },
  { name: 'Média', cfg: { quality: 'media', shadows: 'medias', pixel: 'medio' } },
  { name: 'Baixa', cfg: { quality: 'baixa', shadows: 'baixas', pixel: 'medio' } },
  { name: 'Mínima', cfg: { quality: 'baixa', shadows: 'desligadas', pixel: 'grosso' } },
];
const LEVEL_DESC: Record<string, string> = {
  Alta: 'qualidade alta, sombras altas',
  Média: 'qualidade média, sombras médias',
  Baixa: 'qualidade baixa, sombras baixas',
  Mínima: 'qualidade baixa, sem sombras, pixel grosso',
};
// as salas mais pesadas do capítulo 1 (muita luz com sombra, abóbadas, objetos, céu aberto com névoa)
const ROOMS: [RegExp, string][] = [
  [/Vestíbulo/, 'Vestíbulo'],
  [/Galeria/, 'Galeria'],
  [/Biblioteca/, 'Biblioteca'],
  [/Claustro/, 'Claustro'],
  [/Tribunal/, 'Tribunal'],
];
// (?bench=rapido: a mesma coisa em tempos curtos, só para conferir que o teste funciona; os números não valem)
const FAST = new URLSearchParams(location.search).get('bench') === 'rapido';
const WARM = FAST ? 0.4 : 1.2; // segundos que não contam, em cada sala
const MEASURE = FAST ? 1 : 5; // segundos medidos, em cada sala
const SLOW = 34; // um quadro que demora mais que isso (ms) é um engasgo (abaixo de 30 por segundo)

interface Shot {
  room: string;
  frames: number;
  ms: number;
  fps: number;
  p95: number; // o quadro mais lento dos 95% mais rápidos (ms)
  slow: number; // fração de engasgos
  worst: number; // o quadro mais lento (ms)
}
interface LevelResult {
  name: string;
  fps: number; // média nas cinco salas
  worstRoom: Shot;
  slow: number;
  verdict: Verdict;
  res: string; // a imagem que o jogo desenha (antes de aumentar para a tela)
  shots: Shot[];
}
type Verdict = 'fluido' | 'bom' | 'jogável' | 'pesado';
const VERDICT_TXT: Record<Verdict, string> = {
  fluido: 'Fluido',
  bom: 'Bom',
  jogável: 'Jogável',
  pesado: 'Pesado',
};
// a nota de uma sala: o que o jogador sente nela
const judge = (fps: number, slow: number): Verdict => (fps >= 50 && slow <= 0.03 ? 'fluido' : fps >= 40 && slow <= 0.08 ? 'bom' : fps >= 28 ? 'jogável' : 'pesado');
const RANK: Verdict[] = ['pesado', 'jogável', 'bom', 'fluido'];

const fmt = (v: number, d = 0) => v.toFixed(d).replace('.', ',');

// o aparelho: o que dá para saber de dentro do navegador
interface Device {
  model: string;
  browser: string;
  gpu: string;
  cores: string;
  memory: string;
  screen: string;
}
function gpuName(): string {
  try {
    const c = document.createElement('canvas');
    const g = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null;
    if (!g) return 'sem WebGL';
    const e = g.getExtension('WEBGL_debug_renderer_info');
    const r = String(e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER));
    g.getExtension('WEBGL_lose_context')?.loseContext();
    return r.replace(/^ANGLE \((.*)\)$/, '$1').slice(0, 90);
  } catch {
    return 'desconhecida';
  }
}
function browserName(ua: string): string {
  const pick = (re: RegExp, name: string) => {
    const m = ua.match(re);
    return m ? `${name} ${m[1]}` : null;
  };
  return (
    pick(/SamsungBrowser\/(\d+)/, 'Samsung Internet') ??
    pick(/Edg\/(\d+)/, 'Edge') ??
    pick(/OPR\/(\d+)/, 'Opera') ??
    pick(/FxiOS\/(\d+)/, 'Firefox (iOS)') ??
    pick(/Firefox\/(\d+)/, 'Firefox') ??
    pick(/CriOS\/(\d+)/, 'Chrome (iOS)') ??
    pick(/Chrome\/(\d+)/, 'Chrome') ??
    pick(/Version\/(\d+).*Safari/, 'Safari') ??
    'navegador desconhecido'
  );
}
async function readDevice(): Promise<Device> {
  const ua = navigator.userAgent;
  let model = '';
  const uad = (navigator as Navigator & { userAgentData?: { getHighEntropyValues(h: string[]): Promise<Record<string, string>> } }).userAgentData;
  if (uad) {
    try {
      const h = await uad.getHighEntropyValues(['model', 'platform', 'platformVersion']);
      model = [h.model, h.platform && `${h.platform} ${h.platformVersion?.split('.')[0] ?? ''}`.trim()].filter(Boolean).join(' · ');
    } catch {
      /* ok */
    }
  }
  if (!model) {
    const ios = ua.match(/(iPhone|iPad)[^)]*OS (\d+)_(\d+)/);
    const and = ua.match(/Android (\d+)(?:; ([^;)]+))?/);
    if (ios) model = `${ios[1]} · iOS ${ios[2]}.${ios[3]}`;
    else if (and) model = `${and[2] && and[2] !== 'K' ? `${and[2]} · ` : ''}Android ${and[1]}`;
    else if (/Windows/.test(ua)) model = 'Windows';
    else if (/Mac OS X/.test(ua)) model = 'Mac';
    else if (/Linux/.test(ua)) model = 'Linux';
    else model = 'desconhecido';
  }
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return {
    model,
    browser: browserName(ua),
    gpu: gpuName(),
    cores: navigator.hardwareConcurrency ? String(navigator.hardwareConcurrency) : '?',
    memory: mem ? `${mem} GB${mem >= 8 ? ' ou mais' : ''}` : 'não informada',
    screen: `${screen.width}x${screen.height}, densidade ${fmt(devicePixelRatio, devicePixelRatio % 1 ? 2 : 0)}`,
  };
}

// espera o próximo quadro
const nextFrame = () => new Promise<number>((r) => requestAnimationFrame(r));

type Phase = 'intro' | 'run' | 'done';

export function Bench({ api, ready }: { api: React.MutableRefObject<SceneApi | null>; ready: boolean }) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [step, setStep] = useState({ level: '', room: '', k: 0, n: 1 });
  const [results, setResults] = useState<LevelResult[]>([]);
  const [device, setDevice] = useState<Device | null>(null);
  const [landscape, setLandscape] = useState(() => window.innerWidth >= window.innerHeight);
  const [note, setNote] = useState('');
  const loadSecs = useRef(0);
  const cancel = useRef(false);
  const original = useRef<Config>(configStore.get());

  useEffect(() => {
    readDevice().then(setDevice);
    const r = () => setLandscape(window.innerWidth >= window.innerHeight);
    window.addEventListener('resize', r);
    return () => window.removeEventListener('resize', r);
  }, []);
  useEffect(() => {
    if (ready && !loadSecs.current) loadSecs.current = performance.now() / 1000;
  }, [ready]);
  useEffect(
    () => () => {
      cancel.current = true;
    },
    [],
  );

  const run = async () => {
    const sc = api.current;
    if (!sc) return;
    setPhase('run');
    // tela cheia e deitado (no celular), como se joga; se o navegador não deixar, segue assim mesmo
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      /* ok */
    }
    try {
      await (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> })?.lock?.('landscape');
    } catch {
      /* ok */
    }
    await new Promise((r) => setTimeout(r, 900)); // (a tela cheia muda o tamanho: espera assentar)
    const names = sc.benchRooms();
    const rooms = ROOMS.map(([re, label]) => ({ i: names.findIndex((n) => re.test(n)), label })).filter((r) => r.i >= 0);
    const total = LEVELS.length * rooms.length;
    const out: LevelResult[] = [];
    let k = 0;
    for (const lv of LEVELS) {
      configStore.set((c) => ({ ...c, ...lv.cfg, fpsCap: 0, fov: 95, reduceMotion: false, brightness: 0 }));
      const shots: Shot[] = [];
      for (let ri = 0; ri < rooms.length; ri++) {
        const r = rooms[ri];
        k++;
        setStep({ level: lv.name, room: r.label, k, n: total });
        let shot: Shot | null = null;
        for (let tries = 0; tries < 3 && !shot; tries++) shot = await measure(sc, r.i, r.label, ri === 0 ? WARM + 0.8 : WARM);
        if (cancel.current) return;
        if (shot) shots.push(shot);
      }
      if (!shots.length) continue;
      const frames = shots.reduce((a, s) => a + s.frames, 0);
      const ms = shots.reduce((a, s) => a + s.ms, 0);
      const worstRoom = shots.reduce((a, s) => (s.fps < a.fps ? s : a), shots[0]);
      const slow = shots.reduce((a, s) => a + s.slow * s.frames, 0) / Math.max(1, frames);
      // a nota do nível é a da PIOR sala: é lá que o jogador vai sentir
      const verdict = shots.map((s) => judge(s.fps, s.slow)).reduce((a, v) => (RANK.indexOf(v) < RANK.indexOf(a) ? v : a), 'fluido' as Verdict);
      const res = sc.benchRes();
      out.push({ name: lv.name, fps: (frames / ms) * 1000, worstRoom, slow, verdict, res: `${res.w}x${res.h}`, shots });
    }
    sc.benchView(null);
    configStore.set(original.current); // (só na memória: o teste não grava configurações)
    setResults(out);
    setPhase('done');
    try {
      await document.exitFullscreen?.();
    } catch {
      /* ok */
    }
  };

  // uma sala: a câmera gira uma volta inteira devagar; mede os quadros depois do aquecimento. Se a página sumir (trocou de aplicativo, a tela
  // apagou), a medida não vale e a sala é medida de novo
  const measure = async (sc: SceneApi, room: number, label: string, warm: number): Promise<Shot | null> => {
    const dur = warm + MEASURE;
    const dts: number[] = [];
    let hidden = false;
    const t0 = await nextFrame();
    let last = t0;
    for (;;) {
      if (cancel.current) return null;
      const now = await nextFrame();
      const e = (now - t0) / 1000;
      const u = Math.min(1, e / dur);
      sc.benchView({ room, yaw: u * Math.PI * 2, pitch: 0.05 + 0.09 * Math.sin(u * Math.PI * 4) });
      if (document.hidden) hidden = true;
      if (e > warm) dts.push(now - last);
      last = now;
      if (e >= dur) break;
    }
    if (hidden || dts.length < 5) return null;
    const ms = dts.reduce((a, b) => a + b, 0);
    const sorted = [...dts].sort((a, b) => a - b);
    return {
      room: label,
      frames: dts.length,
      ms,
      fps: (dts.length / ms) * 1000,
      p95: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))],
      slow: dts.filter((d) => d > SLOW).length / dts.length,
      worst: sorted[sorted.length - 1],
    };
  };

  // a recomendação: o nível mais alto que fica "bom" ou "fluido" na pior sala; se nenhum, o mais alto "jogável"
  const best = results.find((r) => r.verdict === 'fluido' || r.verdict === 'bom') ?? results.find((r) => r.verdict === 'jogável') ?? null;
  const report = (): string => {
    const d = device;
    const lines = [
      'Sentença · teste de desempenho (v1)',
      d ? `Aparelho: ${d.model} · ${d.browser}` : '',
      d ? `Placa de vídeo: ${d.gpu}` : '',
      d ? `Processador: ${d.cores} núcleos · Memória: ${d.memory} · Tela: ${d.screen}` : '',
      `Abrir o jogo: ${fmt(loadSecs.current, 1)} s`,
      ...results.map(
        (r) =>
          `${r.name} (${LEVEL_DESC[r.name]}; imagem ${r.res}): ${fmt(r.fps)} quadros/s em média, pior sala ${r.worstRoom.room} ${fmt(r.worstRoom.fps)}, engasgos ${fmt(r.slow * 100, 1)}% → ${VERDICT_TXT[r.verdict]}`,
      ),
      ...results.map((r) => `  ${r.name} por sala: ${r.shots.map((s) => `${s.room} ${fmt(s.fps)} (95%: ${fmt(s.p95)} ms, pior ${fmt(s.worst)} ms)`).join(' · ')}`),
      best ? `Recomendado: ${best.name}${best.verdict === 'jogável' ? ' (jogável, perto de 30 quadros por segundo)' : ''}` : 'Recomendado: nenhum nível fica jogável neste aparelho',
    ];
    return lines.filter(Boolean).join('\n');
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(report());
      setNote('Copiado. É só colar na conversa.');
    } catch {
      setNote('Não deu para copiar: tire um print desta tela.');
    }
  };
  const useBest = () => {
    if (!best) return;
    const lv = LEVELS.find((l) => l.name === best.name)!;
    try {
      const raw = localStorage.getItem('mdd-config-v1');
      const cur = raw ? JSON.parse(raw) : {};
      localStorage.setItem('mdd-config-v1', JSON.stringify({ ...cur, ...lv.cfg }));
      setNote(`Pronto: o jogo neste aparelho fica em ${best.name}.`);
    } catch {
      setNote('Não deu para gravar a configuração neste navegador.');
    }
  };
  const toGame = () => location.replace(location.pathname);

  if (phase === 'run')
    return (
      <div className="bench-run" aria-live="polite">
        <div className="bench-bar">
          <i style={{ width: `${(step.k / step.n) * 100}%` }} />
        </div>
        <p>
          Teste de desempenho · {step.level} · {step.room} ({step.k}/{step.n})
        </p>
        <p className="bench-dim">Não mexa na tela até o fim.</p>
      </div>
    );

  if (phase === 'done')
    return (
      <div className="mnu-veil bench-veil">
        <div className="board board-w bench-board">
          <h2>Resultado do teste</h2>
          <div className="bench-scroll">
            {device && (
              <p className="bench-dev">
                {device.model} · {device.browser}
                <br />
                Placa de vídeo: {device.gpu}
                <br />
                {device.cores} núcleos · memória {device.memory} · tela {device.screen}
                <br />
                Abriu em {fmt(loadSecs.current, 1)} s
              </p>
            )}
            <table className="bench-t">
              <thead>
                <tr>
                  <th>Qualidade</th>
                  <th>Média</th>
                  <th>Pior sala</th>
                  <th>Engasgos</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.name} className={`v-${r.verdict === 'jogável' ? 'jogavel' : r.verdict}${best?.name === r.name ? ' best' : ''}`}>
                    <td>{r.name}</td>
                    <td>{fmt(r.fps)} q/s</td>
                    <td>
                      {r.worstRoom.room} {fmt(r.worstRoom.fps)}
                    </td>
                    <td>{fmt(r.slow * 100, 1)}%</td>
                    <td>{VERDICT_TXT[r.verdict]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="bench-rec">
              {best
                ? `Recomendado para este aparelho: ${best.name}${best.verdict === 'jogável' ? ' (jogável, perto de 30 quadros por segundo)' : ''}.`
                : 'Nenhum nível ficou jogável neste aparelho.'}
            </p>
            <p className="bench-dim">
              q/s = quadros desenhados por segundo (60 é o normal da maioria das telas). Engasgo = um quadro que demorou mais que 1/30 de segundo.
              Fluido: 50 ou mais e quase sem engasgo · Bom: 40 ou mais · Jogável: perto de 30.
            </p>
            {note && <p className="bench-note">{note}</p>}
          </div>
          <div className="row-btns bench-btns">
            <button className="plq plq-gold" onClick={copy}>
              Copiar o resultado
            </button>
            {best && (
              <button className="plq" onClick={useBest}>
                Usar a recomendada aqui
              </button>
            )}
            <button className="plq" onClick={() => location.reload()}>
              Repetir
            </button>
            <button className="plq" onClick={toGame}>
              Ir para o jogo
            </button>
          </div>
        </div>
      </div>
    );

  return (
    <div className="mnu-veil bench-veil">
      <div className="board board-w bench-board">
        <h2>Teste de desempenho</h2>
        <div className="bench-scroll">
          <p className="board-sub bench-txt">
            Leva uns 2 minutos e meio. O jogo passeia sozinho por cinco salas pesadas, em quatro níveis de qualidade, e mede se a imagem fica
            fluida. No fim aparece o resultado, com a qualidade que funciona melhor neste aparelho.
          </p>
          <p className="board-sub bench-txt">
            Não grava nada: nem o jogo salvo, nem as configurações. Deixe o aparelho deitado, com a tela ligada e, se der, na tomada. O som fica
            ligado de propósito, porque ele também pesa.
          </p>
          {!landscape && <p className="bench-warn">Deite o aparelho (tela na horizontal) para começar.</p>}
        </div>
        <div className="row-btns bench-btns">
          <button className="plq plq-gold" disabled={!ready || !landscape} onClick={run}>
            {ready ? 'Começar' : 'Carregando'}
          </button>
          <button className="plq" onClick={toGame}>
            Ir para o jogo
          </button>
        </div>
      </div>
    </div>
  );
}
