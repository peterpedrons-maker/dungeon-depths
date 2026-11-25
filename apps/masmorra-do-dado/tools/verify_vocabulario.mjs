// Verifica o ENSINO DA LÍNGUA no capítulo 1 (ver PUZZLES_PROPOSTAS.md §2c).
// Para cada palavra que um puzzle EXIGE (o jogador precisa saber o que ela quer dizer para resolver), confere se:
//   (a) a própria sala a ensina por um canal FORTE (o efeito explica: o glifo reage, demonstração sem punição, rótulo no objeto, dedução
//       guiada como "número = face do dado"), ou
//   (b) ela já apareceu ANTES pelo menos 2 vezes, e pelo menos uma dessas vezes por um canal forte.
// Pergunta do dado (§2e): 'pergunta' conta como canal FORTE porque o dado diz se o jogador acertou (vem depois do ensino; reforça).
// Canais fortes: 'efeito' (o glifo brilha quando o significado acontece), 'demo' (demonstração), 'rotulo' (o nome talhado no próprio objeto),
// 'figura' (mural com desenho + frase), 'dado' (o dado mostra o rabisco), 'deducao' (a sala guia a dedução). Fracos: 'frase', 'diario', 'fala'.
// Uso: node tools/verify_vocabulario.mjs        (as salas 12 a 17 ainda são esboço: os dados delas são provisórios)
import { readFileSync } from 'node:fs';
const LEX = JSON.parse(readFileSync(new URL('../src/story/lexicon.json', import.meta.url)));
const IDS = new Set((Array.isArray(LEX) ? LEX : Object.values(LEX)).map((w) => w.id));
const FORTES = new Set(['efeito', 'demo', 'rotulo', 'figura', 'dado', 'deducao', 'pergunta']);
const m = (canal, ...ws) => ws.map((w) => ({ w, canal }));

const CAP1 = [
  { sala: '1 O Poço', mostra: [...m('efeito', 'acender'), ...m('dado', 'brasa'), ...m('fala', 'voce', 'condenado', 'eu', 'boato', 'ajudar', 'viver', 'perg', 'dar', 'dado', 'ler')], exige: ['acender'] },
  { sala: '2 O Vestíbulo', mostra: [...m('efeito', 'acender', 'n2'), ...m('dado', 'livro', 'pegar', 'escrever', 'abrir'), ...m('fala', 'ver'), ...m('diario', 'acender', 'brasa')], exige: ['n2'] },
  { sala: '3 A Lousa', mostra: [...m('figura', 'n1', 'n2', 'n3'), ...m('efeito', 'n3', 'brasa'), ...m('deducao', 'n4'), ...m('frase', 'acender')], exige: ['n4'] },
  { sala: '4 O Fio de Fogo', mostra: [...m('pergunta', 'acender'), ...m('deducao', 'n1', 'n5'), ...m('efeito', 'acender', 'n3'), ...m('frase', 'n2')], exige: ['n1', 'n2'] },
  { sala: 'R1 O Corredor dos Nichos e o Pátio', mostra: [...m('pergunta', 'n4'), ...m('fala', 'onde'), ...m('figura', 'contaveis'), ...m('frase', 'n2'), ...m('figura', 'antes', 'agora', 'depois', 'brasa'), ...m('figura', 'n1', 'n2', 'n3', 'n5'), ...m('frase', 'acender', 'brasa')], exige: [] },
  { sala: '5 A Casa Escreve', mostra: [...m('figura', 'antes', 'depois', 'n1', 'n2'), ...m('efeito', 'ordem'), ...m('rotulo', 'porta'), ...m('frase', 'acender', 'brasa')], exige: [] },
  { sala: '6 A Chama Curta', mostra: [...m('pergunta', 'antes'), ...m('efeito', 'tempo', 'n4'), ...m('frase', 'acender', 'brasa')], exige: ['n4'] },
  { sala: '7 O Que a Casa Confirma', mostra: [...m('efeito', 'conf', 'boato'), ...m('diario', 'conf', 'boato'), ...m('frase', 'acender', 'n3', 'n4', 'antes', 'depois', 'n1', 'n2')], exige: ['conf', 'boato', 'antes', 'depois', 'n1', 'n2', 'n3', 'n4'] },
  { sala: 'R2 Os Banhos Secos', mostra: [...m('pergunta', 'conf'), ...m('rotulo', 'dado'), ...m('figura', 'dizer', 'mentir'), ...m('frase', 'contaveis', 'conf', 'boato', 'acender', 'n2', 'n1'), ...m('diario', 'conf', 'boato')], exige: [] },
  { sala: '8 O Pano', mostra: [...m('demo', 'brasa'), ...m('frase', 'todos', 'n2', 'n3', 'n4', 'antes', 'conf', 'boato')], exige: ['n2', 'n3', 'n4', 'antes', 'conf', 'boato'] },
  { sala: 'Biblioteca (térreo)', mostra: [...m('pergunta', 'boato'), ...m('rotulo', 'livro', 'mesa', 'chave', 'sino', 'porta', 'giz'), ...m('figura', 'escrever', 'ler', 'escrivao', 'sentenca', 'todos', 'mais', 'menos'), ...m('frase', 'condenado', 'julgar')], exige: [] },
  { sala: '9 Os Apelidos', mostra: [...m('efeito', 'grande', 'pequeno'), ...m('rotulo', 'grande'), ...m('frase', 'antes', 'depois', 'conf')], exige: ['grande', 'pequeno', 'antes', 'depois'] },
  { sala: '10 A Ponte de Madeira', mostra: [...m('pergunta', 'depois'), ...m('frase', 'acender', 'n2', 'mais')], exige: ['n2'] },
  { sala: '11 O Boato Verdadeiro', mostra: [...m('pergunta', 'pequeno'), ...m('demo', 'verdade'), ...m('efeito', 'verdade'), ...m('frase', 'antes', 'depois', 'conf', 'boato')], exige: ['verdade', 'antes', 'depois', 'conf', 'boato'] },
  { sala: 'R3 A Galeria dos Condenados', mostra: [...m('pergunta', 'verdade'), ...m('frase', 'condenado', 'ler', 'sentenca'), ...m('figura', 'igual', 'grande', 'pequeno'), ...m('diario', 'pequeno')], exige: [] },
  { sala: '12 A Sombra (esboço)', mostra: [...m('frase', 'acender', 'n4')], exige: ['n4'] },
  { sala: '13 O Escuro (esboço)', mostra: [...m('efeito', 'escuro'), ...m('frase', 'acender', 'brasa')], exige: [] },
  { sala: '14 A Lei Pequena (esboço)', mostra: [...m('deducao', 'igual'), ...m('frase', 'n1', 'boato', 'verdade', 'antes', 'depois')], exige: ['igual', 'n1', 'boato', 'verdade'] },
  { sala: 'R4 A Escadaria', mostra: [...m('pergunta', 'igual'), ...m('frase', 'casa')], exige: [] },
  { sala: '15 O Fogo que Corre (esboço)', mostra: [...m('frase', 'acender', 'n2')], exige: ['n2'] },
  { sala: '16 Os Que Dizem o Mesmo (esboço)', mostra: [...m('frase', 'grande', 'pequeno', 'igual', 'verdade', 'boato', 'conf')], exige: ['grande', 'pequeno', 'igual', 'verdade', 'boato', 'conf'] },
  { sala: 'R5 A Antecâmara Fria', mostra: [...m('efeito', 'abrir', 'porta', 'conf')], exige: [] },
  { sala: '17 A Memória da Casa (esboço)', mostra: [...m('efeito', 'todos', 'ordem'), ...m('frase', 'grande', 'pequeno', 'igual', 'verdade')], exige: ['todos', 'ordem', 'grande', 'pequeno', 'igual', 'verdade'] },
  { sala: '18 O Tribunal', mostra: [...m('pergunta', 'todos'), ...m('frase', 'acender', 'todos', 'brasa', 'ordem', 'conf', 'boato', 'igual', 'verdade', 'antes', 'depois', 'grande', 'pequeno')], exige: ['todos', 'ordem', 'conf', 'boato', 'igual', 'verdade', 'antes', 'depois', 'grande', 'pequeno', 'n1', 'n2', 'n3', 'n4', 'n5'] },
];

let ok = true;
const vistos = new Map(); // palavra -> [{sala, canal}]
for (const s of CAP1) {
  for (const { w } of s.mostra) if (!IDS.has(w)) throw new Error(`palavra fora do léxico: ${w} (${s.sala})`);
  const faltas = [];
  for (const w of s.exige) {
    const aqui = s.mostra.some((x) => x.w === w && FORTES.has(x.canal));
    const antes = vistos.get(w) || [];
    const fortesAntes = antes.filter((x) => FORTES.has(x.canal)).length;
    if (!(aqui || (antes.length >= 2 && fortesAntes >= 1))) faltas.push(`${w} (visto ${antes.length}x antes, ${fortesAntes} forte)`);
  }
  console.log(`${faltas.length ? '✗' : '✓'} ${s.sala}${s.exige.length ? ` — exige: ${s.exige.join(', ')}` : ''}${faltas.length ? `\n     FALTA ENSINAR: ${faltas.join('; ')}` : ''}`);
  if (faltas.length) ok = false;
  for (const x of s.mostra) vistos.set(x.w, [...(vistos.get(x.w) || []), { sala: s.sala, canal: x.canal }]);
}
const exigidas = new Set(CAP1.flatMap((s) => s.exige));
console.log(`\nPalavras exigidas no capítulo 1: ${exigidas.size}. Palavras mostradas: ${vistos.size}.`);
console.log(ok ? 'OK: nenhuma palavra é exigida antes de o jogo dar um jeito de entendê-la.' : 'FALHOU: há palavras exigidas sem ensino.');
process.exit(ok ? 0 : 1);
