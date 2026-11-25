import type React from 'react';
// ÍCONES DESENHADOS À MÃO, em pixels (DIRECAO_DE_ARTE.md §4.11): nada de símbolo de fonte do navegador. Cada ícone é uma grade de 12×12
// em texto (um caractere por pixel): '.' vazio, e as letras são cores da paleta do jogo. Tinta clara de giz com sombra escura, como a cal das
// inscrições; o ouro só onde o ícone pede atenção.
const COLORS: Record<string, string> = {
  w: '#efe6d0', // giz
  g: '#b8b0a0', // giz na sombra
  d: '#2a2232', // contorno escuro
  o: '#ffd36b', // ouro
  b: '#c9a35a', // ouro velho
  r: '#a8321a', // brasa
  c: '#5be7ff', // ciano (ação)
};

const ICONS: Record<string, string[]> = {
  // nota musical dupla: música e efeitos
  musica: [
    '............',
    '....wwwwwww.',
    '....wgggggw.',
    '....w.....w.',
    '....w.....w.',
    '....w.....w.',
    '....w.....w.',
    '..www...www.',
    '.wwww..wwww.',
    '.wwww..wwww.',
    '..ww....ww..',
    '............',
  ],
  // nota simples: só efeitos
  efeitos: [
    '............',
    '.....ww.....',
    '.....wgw....',
    '.....w.gw...',
    '.....w..w...',
    '.....w......',
    '.....w......',
    '...www......',
    '..wwww......',
    '..wwww......',
    '...ww.......',
    '............',
  ],
  // nota riscada: mudo
  mudo: [
    '...........r',
    '.....ww...r.',
    '.....wgw.r..',
    '.....w.gr...',
    '.....w.r....',
    '.....wr.....',
    '....rw......',
    '...rww......',
    '..rwww......',
    '.r.www......',
    'r..ww.......',
    '............',
  ],
  // seta em volta: reiniciar a sala
  reiniciar: [
    '............',
    '....wwww.w..',
    '..ww....www.',
    '.w......ww..',
    '.w......w.w.',
    'w...........',
    'w...........',
    '.w.......w..',
    '.w......w...',
    '..ww..ww....',
    '....ww......',
    '............',
  ],
  // "i" numa pedra redonda: informações e recomeçar
  info: [
    '............',
    '....gggg....',
    '..gg....gg..',
    '.g...ww...g.',
    '.g........g.',
    'g....ww....g',
    'g....ww....g',
    '.g...ww...g.',
    '.g...ww...g.',
    '..gg....gg..',
    '....gggg....',
    '............',
  ],
  // quatro cantos: tela cheia
  tela: [
    '............',
    '.www....www.',
    '.w........w.',
    '.w........w.',
    '............',
    '............',
    '............',
    '............',
    '.w........w.',
    '.w........w.',
    '.www....www.',
    '............',
  ],
  // seta para baixo numa bandeja: instalar
  instalar: [
    '............',
    '.....ww.....',
    '.....ww.....',
    '.....ww.....',
    '.....ww.....',
    '..w..ww..w..',
    '...w.ww.w...',
    '....wwww....',
    '.....ww.....',
    '.w........w.',
    '.wwwwwwwwww.',
    '............',
  ],
  // arremessar: arco subindo para a frente
  arremessar: [
    '............',
    '.......cccc.',
    '.........cc.',
    '........c.c.',
    '.......c..c.',
    '......c.....',
    '....cc......',
    '..cc........',
    '.c..........',
    '.c..........',
    '............',
    '............',
  ],
  // recolher: seta que volta
  recolher: [
    '............',
    '...c........',
    '..cc........',
    '.cccccccc...',
    '..cc.....c..',
    '...c......c.',
    '..........c.',
    '..........c.',
    '.........c..',
    '....cccccc..',
    '............',
    '............',
  ],
  // posicionar: alvo
  posicionar: [
    '............',
    '.....oo.....',
    '.....oo.....',
    '...o....o...',
    '..o......o..',
    'oo...oo...oo',
    'oo...oo...oo',
    '..o......o..',
    '...o....o...',
    '.....oo.....',
    '.....oo.....',
    '............',
  ],
  // girar: o dado de lado com uma seta curva
  girar: [
    '............',
    '..wwwwww.w..',
    '.w......www.',
    'w.......w...',
    'w...........',
    'w..gggg.....',
    'w..g..g.....',
    'w..gggg.....',
    '.w.......w..',
    '..ww..www...',
    '....ww......',
    '............',
  ],
  // agir: mão aberta
  agir: [
    '............',
    '...w.w.w....',
    '...w.w.w.w..',
    '...w.w.w.w..',
    '...wwwwwww..',
    '.w.wwwwwww..',
    '.wwwwwwwww..',
    '..wwwwwwww..',
    '...wwwwww...',
    '...wwwwww...',
    '....wwww....',
    '............',
  ],
  // giz (lápis de pedra), dado, apagar, limpar: só aparecem na sala de teste (o giz é do capítulo 2)
  giz: [
    '............',
    '.........ww.',
    '........wgw.',
    '.......wgw..',
    '......wgw...',
    '.....wgw....',
    '....wgw.....',
    '...wgw......',
    '..www.......',
    '..ww........',
    '.w..........',
    '............',
  ],
  dado: [
    '............',
    '.dddddddddd.',
    '.dbbbbbbbbd.',
    '.db.o..o.bd.',
    '.db......bd.',
    '.db..oo..bd.',
    '.db..oo..bd.',
    '.db......bd.',
    '.db.o..o.bd.',
    '.dbbbbbbbbd.',
    '.dddddddddd.',
    '............',
  ],
  apagar: [
    '............',
    '............',
    '......wwww..',
    '.....wgggw..',
    '....wgggw...',
    '...wgggw....',
    '..wwwww.....',
    '..w..w......',
    '..wwww......',
    '............',
    '.wwwwwwwww..',
    '............',
  ],
  limpar: [
    '............',
    '.rr......rr.',
    '..rr....rr..',
    '...rr..rr...',
    '....rrrr....',
    '.....rr.....',
    '....rrrr....',
    '...rr..rr...',
    '..rr....rr..',
    '.rr......rr.',
    '............',
    '............',
  ],
  olhar: [
    '............',
    '............',
    '....wwww....',
    '..ww....ww..',
    '.w...dd...w.',
    'w...dddd...w',
    'w...dddd...w',
    '.w...dd...w.',
    '..ww....ww..',
    '....wwww....',
    '............',
    '............',
  ],
};

export type IconName = keyof typeof ICONS;

// `size` em px (múltiplo de 12 fica nítido); sombra escura de 1 pixel embaixo e à direita, como a cal talhada
export function PixelIcon({ name, size = 24 }: { name: IconName; size?: number }) {
  const rows = ICONS[name];
  const rects: React.ReactElement[] = [];
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === '.') return;
      rects.push(<rect key={`s${x}-${y}`} x={x + 1} y={y + 1} width={1} height={1} fill="#05040a" opacity={0.75} />);
    }),
  );
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === '.') return;
      rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={COLORS[ch] ?? '#efe6d0'} />);
    }),
  );
  return (
    <svg viewBox="0 0 13 13" width={size} height={size} shapeRendering="crispEdges" aria-hidden="true" style={{ display: 'block' }}>
      {rects}
    </svg>
  );
}
