import { glyphsOf, type GlyphDef } from '../story/lexicon';

// Desenha um símbolo da língua dos Contáveis (grade 3x3): giz branco sobre o escuro, bordas "serrilhadas"
// de propósito, no mesmo clima pixelado do jogo.
const S = 34;
const CX = 75;
const CY = 58;
const H = S + 22;
const pt = (i: number): [number, number] => [CX + ((i % 3) - 1) * S, CY + (Math.floor(i / 3) - 1) * S];

export function Glyph({ g, size = 64, color = '#f2e6c9' }: { g: GlyphDef; size?: number; color?: string }) {
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
  return (
    <svg viewBox="0 0 150 130" width={Math.round((size * 150) / 130)} height={size} shapeRendering="crispEdges" aria-hidden="true">
      {g.F === 'full' && <rect x={x0} y={y0} width={2 * H} height={2 * H} rx={4} {...frame} />}
      {g.F === 'V' && (
        <>
          <polyline points={`${x0},${y0} ${x0},${y1}`} {...frame} />
          <polyline points={`${x1},${y0} ${x1},${y1}`} {...frame} />
        </>
      )}
      {g.F && poly[g.F] && <polyline points={poly[g.F]} {...frame} />}
      {g.l.map(([a, b], k) => {
        const [xa, ya] = pt(a);
        const [xb, yb] = pt(b);
        return <line key={k} x1={xa} y1={ya} x2={xb} y2={yb} stroke={color} strokeWidth={lw} strokeLinecap="round" />;
      })}
      {g.p.map((i) => {
        const [x, y] = pt(i);
        return <circle key={`p${i}`} cx={x} cy={y} r={g.big.includes(i) ? 10 : R} fill={color} />;
      })}
      {g.ring.map((i) => {
        const [x, y] = pt(i);
        return <circle key={`r${i}`} cx={x} cy={y} r={10} fill="none" stroke={color} strokeWidth={4} />;
      })}
    </svg>
  );
}

// Uma palavra inteira (as compostas viram uma sequência de símbolos).
export function WordGlyph({ id, size = 64, color }: { id: string; size?: number; color?: string }) {
  const parts = glyphsOf(id);
  const sz = parts.length > 2 ? size * 0.8 : size;
  return (
    <span className="wg" style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {parts.map((g, k) => (
        <Glyph key={k} g={g} size={sz} color={color} />
      ))}
    </span>
  );
}
