import { memo } from 'react';
import type React from 'react';
import { ICON_PAL, ICONS16, ICONS24 } from './icons';

// ÍCONES DESENHADOS PIXEL A PIXEL (INTERFACE.md §6; os desenhos estão em tools/build_icons.py, que gera ./icons.ts).
// 16 × 16 no HUD (avisos de ação, botões de toque) e 24 × 24 nos menus; traço de ouro de 1 pixel, pintado só no que se coleta (gema, página).
// Nenhum ícone usa as formas que são palavras da língua (X, +, setas retas, =, duas barras, losango, V, T, Z, pontos em grade): ver a tabela da §6.
export type IconName = keyof typeof ICONS16 | keyof typeof ICONS24;

// `size` em px na tela: múltiplos de 16 (HUD) ou de 24 (menus) ficam nítidos. `grid` força a versão (senão: a de 24 nos tamanhos de menu, se existir).
// (guardado: o mesmo ícone, no mesmo tamanho, não se remonta quando a interface se refaz; são centenas de quadradinhos por ícone; DESIGN.md §106)
export const PixelIcon = memo(function PixelIcon({ name, size = 32, grid }: { name: IconName; size?: number; grid?: 16 | 24 }) {
  const has24 = name in ICONS24;
  const has16 = name in ICONS16;
  const use24 = grid === 24 ? has24 : grid === 16 ? !has16 : has24 && (size % 24 === 0 || !has16);
  const rows: readonly string[] = use24 ? ICONS24[name as keyof typeof ICONS24] : ICONS16[name as keyof typeof ICONS16];
  const n = rows.length;
  const rects: React.ReactElement[] = [];
  // sombra escura de 1 pixel embaixo e à direita (o traço fica "talhado" na plaquinha)
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === '.') return;
      rects.push(<rect key={`s${x}-${y}`} x={x + 1} y={y + 1} width={1} height={1} fill="#05040a" opacity={0.7} />);
    }),
  );
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === '.') return;
      rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={ICON_PAL[ch] ?? '#ffd36b'} />);
    }),
  );
  return (
    <svg viewBox={`0 0 ${n} ${n}`} width={size} height={size} shapeRendering="crispEdges" aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
      {rects}
    </svg>
  );
});
