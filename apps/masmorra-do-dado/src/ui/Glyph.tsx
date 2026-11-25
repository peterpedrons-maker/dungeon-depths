import { glyphsOf, type GlyphDef } from '../story/lexicon';

// Desenha um símbolo da língua dos Contáveis (grade 3x3): giz branco sobre o escuro, bordas "serrilhadas"
// de propósito, no mesmo clima pixelado do jogo.
const S = 34;
const CX = 75;
const CY = 58;
const H = S + 22;
const pt = (i: number): [number, number] => [CX + ((i % 3) - 1) * S, CY + (Math.floor(i / 3) - 1) * S];

// `draw` (ms): o símbolo se FORMA como se estivesse sendo escrito: primeiro a moldura, depois cada traço (do começo ao fim) e por último os pontos.
export function Glyph({ g, size = 64, color = '#f2e6c9', draw = 0, delay = 0 }: { g: GlyphDef; size?: number; color?: string; draw?: number; delay?: number }) {
  const small = !!g.s;
  const R = small ? 4.2 : 7;
  const lw = small ? 3.4 : 5;
  const x0 = CX - H;
  const x1 = CX + H;
  const y0 = CY - H;
  const y1 = CY + H;
  const frame = { fill: 'none', stroke: color, strokeWidth: 4, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  const poly: Record<string, string> = {
    U: `${x0},${y0} ${x0},${y1} ${x1},${y1} ${x1},${y0}`,
    N: `${x0},${y1} ${x0},${y0} ${x1},${y0} ${x1},${y1}`,
    R: `${x1},${y0} ${x0},${y0} ${x0},${y1} ${x1},${y1}`,
    L: `${x0},${y0} ${x1},${y0} ${x1},${y1} ${x0},${y1}`,
  };
  // ESCRITA: os traços são riscados UM DEPOIS DO OUTRO, na ordem (moldura, ligações, pontos, anéis), cada um do começo ao fim, com a mão acelerando e
  // desacelerando (como quem escreve). O tempo de cada traço é proporcional ao comprimento; entre um traço e outro a mão levanta (pequena pausa).
  const frameLens: number[] = g.F === 'full' ? [8 * H] : g.F === 'V' ? [2 * H, 2 * H] : g.F ? [6 * H] : [];
  const linkLens = g.l.map(([a, b]) => {
    const [xa, ya] = pt(a);
    const [xb, yb] = pt(b);
    return Math.hypot(xb - xa, yb - ya);
  });
  const ringLens = g.ring.map(() => 62);
  const DOT = 0.07; // fração do tempo para cada ponto "carimbar"
  const GAP = 0.04; // fração do tempo da mão levantada entre traços
  const nStrokes = frameLens.length + linkLens.length + ringLens.length + g.p.length;
  const lineTotal = [...frameLens, ...linkLens, ...ringLens].reduce((a, b) => a + b, 0);
  const lineShare = Math.max(0.2, 1 - DOT * g.p.length - GAP * Math.max(0, nStrokes - 1));
  const timeOf = (len: number) => (lineTotal ? (len / lineTotal) * lineShare : 0);
  let cursor = 0; // fração do tempo já usada
  const anim = (kind: 'line' | 'dot', len = 0): React.CSSProperties | undefined => {
    if (!draw) return undefined;
    const startF = cursor;
    const durF = kind === 'dot' ? DOT : timeOf(len);
    cursor += durF + GAP;
    const at = delay + draw * startF;
    const dur = Math.max(50, draw * durF);
    // comprimento REAL do traço (sem `pathLength`, que o Safari do iPhone ignora em retângulos e círculos: lá os traços sumiam)
    const L = Math.ceil(len) + 2;
    return kind === 'line'
      ? { strokeDasharray: `${L} ${L}`, strokeDashoffset: L, animation: `gdraw ${dur}ms cubic-bezier(0.45, 0, 0.55, 1) ${at}ms forwards` }
      : { opacity: 0, transformBox: 'fill-box', transformOrigin: 'center', animation: `gdot ${dur}ms ease-out ${at}ms forwards` };
  };
  let fi = 0;
  let li = 0;
  let ri = 0;
  return (
    <svg viewBox="0 0 150 130" width={Math.round((size * 150) / 130)} height={size} shapeRendering="crispEdges" aria-hidden="true">
      {g.F === 'full' && <rect x={x0} y={y0} width={2 * H} height={2 * H} rx={4} {...frame} style={anim('line', frameLens[fi++])} />}
      {g.F === 'V' && (
        <>
          <polyline points={`${x0},${y0} ${x0},${y1}`} {...frame} style={anim('line', frameLens[fi++])} />
          <polyline points={`${x1},${y0} ${x1},${y1}`} {...frame} style={anim('line', frameLens[fi++])} />
        </>
      )}
      {g.F && poly[g.F] && <polyline points={poly[g.F]} {...frame} style={anim('line', frameLens[fi++])} />}
      {g.l.map(([a, b], k) => {
        const [xa, ya] = pt(a);
        const [xb, yb] = pt(b);
        return <line key={k} x1={xa} y1={ya} x2={xb} y2={yb} stroke={color} strokeWidth={lw} strokeLinecap="round" style={anim('line', linkLens[li++])} />;
      })}
      {g.p.map((i) => {
        const [x, y] = pt(i);
        return <circle key={`p${i}`} cx={x} cy={y} r={g.big.includes(i) ? 10 : R} fill={color} style={anim('dot')} />;
      })}
      {g.ring.map((i) => {
        const [x, y] = pt(i);
        return <circle key={`r${i}`} cx={x} cy={y} r={10} fill="none" stroke={color} strokeWidth={4} style={anim('line', ringLens[ri++])} />;
      })}
    </svg>
  );
}

// Uma palavra inteira (as compostas viram uma sequência de símbolos).
export function WordGlyph({ id, size = 64, color, draw = 0 }: { id: string; size?: number; color?: string; draw?: number }) {
  const parts = glyphsOf(id);
  const sz = parts.length > 2 ? size * 0.8 : size;
  return (
    <span className="wg" style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {parts.map((g, k) => (
        <Glyph key={k} g={g} size={sz} color={color} draw={draw} delay={k * (draw + 100)} />
      ))}
    </span>
  );
}
