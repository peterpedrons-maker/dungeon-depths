// Ajudas para montar o SOM DO LUGAR das salas (Room.ambience; DESIGN.md §60). Só descreve o lugar: quem toca é o motor de som (audio.ts).

// Uma abertura por onde o vento entra: céu, boca de poço, janela de grade. Coordenadas locais da sala.
export interface Opening {
  x: number;
  z: number;
  hx?: number; // meia-largura (x) de uma abertura retangular, como um pátio a céu aberto; 0 = um ponto
  hz?: number; // meia-largura (z)
  y?: number; // altura dela (boca do poço lá em cima, janela): a distância vertical até os olhos também conta
  r: number; // até onde, além da borda, ainda se ouve o vento dela (m)
  k: number; // força do vento dentro dela / logo embaixo (0..1)
}

const EYE = 1.6;
const smooth = (u: number) => {
  const v = Math.max(0, Math.min(1, u));
  return v * v * (3 - 2 * v);
};

// o vento num ponto: o maior entre o vento de fundo da sala e o de cada abertura (que cai suave com a distância)
export function windNear(openings: Opening[], base = 0) {
  return (x: number, z: number, feetY: number) => {
    let w = base;
    for (const o of openings) {
      const dx = Math.max(0, Math.abs(x - o.x) - (o.hx ?? 0));
      const dz = Math.max(0, Math.abs(z - o.z) - (o.hz ?? 0));
      const dy = o.y === undefined ? 0 : Math.abs(o.y - (feetY + EYE)) * 0.6;
      const d = Math.hypot(dx, dz, dy);
      w = Math.max(w, o.k * smooth(1 - d / o.r));
    }
    return w;
  };
}
