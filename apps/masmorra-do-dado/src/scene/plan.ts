// A PLANTA DO MUNDO (DESIGN.md §73): onde fica cada sala e de que parede saem a porta e a entrada dela. Os números estão em `planta.json`,
// gravado pela ferramenta `tools/planta/planta_cap1.py` (não edite o JSON à mão). As salas perguntam aqui onde pôr a porta (`planDoors`); o
// motor, onde pôr a sala (`planPlace`).
import PLANTA from './planta.json';
import type { DoorSide, EntrySide } from './kit';

const Q = new URLSearchParams(location.search);
// ?planta=1: o mundo pela planta nova (em construção: passo 3 do §73). Sem isso, a fila de sempre.
export const PLANTA_ON = !Q.has('lab') && !Q.has('vitrine') && Q.get('planta') === '1';

interface Entry {
  n: string;
  d: string;
  x: number;
  z: number;
  andar: string;
  saida: (string | number)[];
  entrada: (string | number)[];
}
const SALAS = (PLANTA as { salas: Entry[] }).salas;
// PONTES: caminhos especiais entre duas salas, que passam por dentro de uma terceira (a Escadaria sai na passarela alta da Biblioteca e uma
// ponte leva às salas do claustro). `via` = pontos do caminho depois da porta (plano); `aberto` = trechos [i, i+1] que são de outra sala (a
// passarela: sem paredes, com parapeito); `ver` = as salas que ficam desenhadas enquanto o jogador está no caminho; `largura` do trecho aberto.
export interface Ponte {
  de: string;
  via: [number, number][];
  aberto: [number, number][];
  ver: string[];
  largura: number;
  y?: number; // (a altura do trecho aberto, local da sala que ele atravessa: a passarela)
}
const PONTES_ALL = ((PLANTA as unknown as { pontes?: Ponte[] }).pontes ?? []) as Ponte[];
export const PONTES: Ponte[] = PLANTA_ON ? PONTES_ALL : [];
// a ponte que atravessa a sala `name` (para ela abrir os vãos e baixar a passarela)
export const ponteThrough = (name: string) => PONTES.find((p) => p.ver.includes(name));

// a sala `name` na planta (sem o "Sala N · " do começo), ou nada (fora da planta: em fila)
export function planPlace(name: string): Entry | undefined {
  return PLANTA_ON ? SALAS.find((e) => e.n === name) : undefined;
}

// de que parede sai a porta da sala (e em que ponto dela: o z local, na parede do lado; o x local, no fundo) e por onde se entra
export function planDoors(name: string): { exit: { side: DoorSide; at: number }; entry: { side: EntrySide; at: number } } {
  const e = planPlace(name);
  return {
    exit: { side: ((e?.saida[0] as DoorSide) ?? 'B'), at: Number(e?.saida[1] ?? 0) },
    entry: { side: ((e?.entrada[0] as EntrySide) ?? 'F'), at: Number(e?.entrada[1] ?? 0) },
  };
}

export const PLAN_ORIGIN = SALAS.find((e) => e.n === 'O Poço');
