// O tempo da ESCRITA na tela (símbolos se formando, traço a traço): compartilhado pela caixa de conversa, pelo balão do dado e pelo motor (scene.ts),
// que usa estes números para espaçar as falas do dado em sequência.
import { glyphsOf } from './lexicon';

export const PART_MS = 950; // tempo para um símbolo (uma "parte" da palavra) ser escrito
export const LINGER_MS = 3600; // quanto o balão do dado fica à vista depois do último símbolo
export const PIC_MS = 500; // o desenho que acompanha uma fala só aparece

// quanto dura escrever uma palavra (as compostas são várias partes, uma depois da outra)
export const wordMs = (id: string) => Math.max(1, glyphsOf(id).length) * PART_MS + 150;

// a duração de uma fala inteira, do primeiro traço ao último símbolo completo (sem o tempo de permanência)
export const lineMs = (glyphs: string[], pic = false) => (pic ? PIC_MS : 0) + glyphs.reduce((a, id) => a + wordMs(id), 0);

// risquinhos de giz enquanto algo é escrito durante `ms`
export function scribbleFor(ms: number, onSound?: (name: 'write', v?: number) => void) {
  if (!onSound) return;
  for (let t = 0; t < ms - 150; t += 150) window.setTimeout(() => onSound('write', 0.7 + Math.random() * 0.6), t);
}
