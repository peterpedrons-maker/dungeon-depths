import type { Stamp, Stroke } from '../story/diary';
import { CELL_H, CELL_W, getWorld, mockWorld, setWorld } from '../story/worldmap';
import { mapOrigin } from './pages';

// ?demo=mapa — só para ver como ficaria um mapa grande (3 andares, dezenas de salas) com
// anotações à mão perto de uma porta trancada. Nada disso existe no jogo ainda.
export function startMapDemo(): { rooms: string[]; here: string; strokes: Stroke[]; stamps: Stamp[] } {
  setWorld(mockWorld());
  const w = getWorld();
  const r = (i: number) => ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
  const share = [0.9, 0.62, 0.34];
  const rooms = w.rooms.filter((room, i) => r(i + 3) < share[room.floor]).map((x) => x.key);
  // a primeira porta trancada do 1º andar: é ali que o jogador escreve o que não entendeu
  const link = w.links.find((l) => l.locked && w.rooms.find((x) => x.key === l.a)!.floor === 0) ?? w.links[0];
  const a = w.rooms.find((x) => x.key === link.a)!;
  const b = w.rooms.find((x) => x.key === link.b)!;
  for (const k of [a.key, b.key]) if (!rooms.includes(k)) rooms.push(k);
  const { ox, oy } = mapOrigin();
  const door = link.path[0];
  const px = ox + door[0] * CELL_W + CELL_W / 2;
  const py = oy + door[1] * CELL_H + CELL_H / 2;
  const h = (pts: [number, number][], c = 0): Stroke => ({ f: a.floor, c, p: pts.flatMap(([x, y]) => [Math.round(x * 2), Math.round(y * 2)]) });
  const dot = (x: number, y: number, c = 0) => h([[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1], [x, y]], c);
  const strokes: Stroke[] = [
    // um triângulo (o jogador copiou o símbolo que viu na porta)
    h([[px - 24, py - 14], [px - 20, py - 22], [px - 16, py - 14], [px - 24, py - 14]]),
    // cinco pontos
    dot(px - 12, py - 22), dot(px - 6, py - 22), dot(px - 9, py - 18), dot(px - 12, py - 14), dot(px - 6, py - 14),
    // seta até a porta
    h([[px - 14, py - 10], [px - 3, py - 2], [px - 7, py - 2], [px - 3, py - 2], [px - 3, py - 6]], 1),
    // "?"
    h([[px + 4, py - 17], [px + 7, py - 20], [px + 10, py - 17], [px + 7, py - 14], [px + 7, py - 12]], 1),
    dot(px + 7, py - 9, 1),
  ];
  // dois carimbos (símbolos que o jogador já avistou) ao lado da porta
  const stamps: Stamp[] = [
    { f: a.floor, id: 'porta', x: Math.round(px + 22), y: Math.round(py - 18) },
    { f: a.floor, id: 'acender', x: Math.round(px + 22), y: Math.round(py + 14) },
  ];
  return { rooms, here: a.key, strokes, stamps };
}
