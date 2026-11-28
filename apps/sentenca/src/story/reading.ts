// AS ANOTAÇÕES JUNTO DOS SÍMBOLOS (DESIGN.md §101, pedido do Pedro). O que o jogador escreveu sobre um glifo (`diary.notes`) só aparecia no
// caderno. Agora aparece em três lugares, sempre com as palavras DELE (o jogo continua sem traduzir e sem corrigir; sem anotação, nada aparece):
//   1. a CÓPIA (sempre): abrir o caderno lendo uma escrita (ou logo depois de uma conversa) abre numa página com a frase copiada e a anotação
//      embaixo de cada símbolo; tocar num símbolo da cópia deixa anotar ali (book/pages.ts, book/book3d.ts). Uma cópia só, a última: um
//      histórico de cópias apagaria a "informação espalhada" de salas como a Lei Pequena, a Memória e o Tribunal (§17);
//   2. APONTAR (sempre): a mira parada numa palavra da parede mostra a anotação só daquela palavra (`aimNoteStore`, ui/AimNote.tsx); numa
//      conversa, tocar num símbolo (ou passar o mouse) mostra a dele (ui/DialogueBox.tsx);
//   3. EMBAIXO DOS SÍMBOLOS (opção, desligada por padrão: Configurações → Acessibilidade): em toda conversa e balão do dado, e numa tira de
//      papel quando o jogador olha uma escrita da parede (`lookingStore`, ui/ReadingStrip.tsx).
// A pergunta do dado («VOCÊ SABER ?») e os pedidos dele («BRASEIRO ONDE ?») nunca mostram anotação, e as anotações DELA (sépia) ficam só
// no caderno. Ficam de fora, de propósito (o enigmista conferiu): a cal (só aparece no escuro; copiar faria a anotação pelo jogador), os
// desenhos de fogo e luz (lousas de lampiões, a moldura da Sombra, as constelações: não são escrita) e a página do C-Bib (é um desenho).
import { createStore } from './store';
import { diaryStore } from './diary';

// a última coisa LIDA: uma escrita da parede (enquanto o jogador olha para ela) ou as falas da última conversa. `t` = quando (ms)
export interface Reading {
  lines: string[][]; // as frases (ids do léxico), uma por linha
  from: 'parede' | 'conversa';
  room: string;
  t: number;
  chalk?: boolean; // escrita A GIZ (os boatos da Galeria): a cópia diz de onde veio, porque o giz é a pista
}
export const readingStore = createStore<Reading | null>(null);
// a escrita que o jogador está olhando agora, parado (para a tira da opção 3); null = nenhuma
export const lookingStore = createStore<{ words: string[]; key: string; chalk?: boolean } | null>(null);
// a palavra da parede sob a mira (forma 2): o id e a anotação curta
export const aimNoteStore = createStore<{ id: string; text: string } | null>(null);

// quanto tempo depois de uma conversa abrir o caderno ainda vai para a cópia dela (ms)
export const TALK_COPY_MS = 20000;

// A ANOTAÇÃO CURTA de um símbolo: a ÚLTIMA linha que ele escreveu (as respostas às perguntas do dado entram numa linha nova, embaixo: a
// última é o que ele acha agora), cortada em `max` letras. '' = nada anotado.
export function shortNote(id: string, max = 11): string {
  if (!id) return ''; // (a lacuna)
  const raw = diaryStore.get().notes[id] ?? '';
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  const last = lines[lines.length - 1] ?? '';
  return last.length > max ? `${last.slice(0, max - 1).trimEnd()}…` : last;
}

// junta as falas de uma mesma conversa (até 4 frases) na leitura
export function readTalk(words: string[], room: string, convo: string) {
  if (!words.length) return;
  const cur = readingStore.get();
  const same = cur && cur.from === 'conversa' && (cur as Reading & { convo?: string }).convo === convo;
  const prev = same ? cur.lines.filter((l) => l.join(' ') !== words.join(' ')) : [];
  readingStore.set({ lines: [...prev, words].slice(-4), from: 'conversa', room, t: performance.now(), convo } as Reading);
}
