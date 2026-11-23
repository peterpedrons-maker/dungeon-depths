// Fonte única da língua dos Contáveis: vocabulário + desenho de cada símbolo.
//
//   node tools/lexicon.mjs                 -> grava src/story/lexicon.json e docs/lingua/LEXICON.md
//   node tools/lexicon.mjs --sheet <pasta> -> também gera folhas PNG (precisa do playwright instalado)
//
// Cada símbolo vive numa grade 3x3 (células 0..8, linha a linha):
//     0 1 2
//     3 4 5
//     6 7 8
// p: pontos · l: ligações entre células · ring: ponto vazio · big: ponto maior · s: símbolo pequeno (modificador)
// F: moldura  full = coisa · U = ser (aberta em cima) · N = conceito (aberta embaixo)
//             R = ligação (aberta à direita) · L = posição/tempo (aberta à esquerda)
//             V = qualidade (só as duas laterais)
// Palavras compostas ('c') são escritas como uma sequência de símbolos.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');

const words = [];
let LOTE = 1; // em que leva a palavra entrou (só para mostrar o que é novo)
const W = (id, pt, en, fam, cap, g) => words.push({ id, pt, en, fam, cap, lote: LOTE, g });
const C = (id, pt, en, fam, cap, c) => words.push({ id, pt, en, fam, cap, lote: LOTE, c });

// ── números e quantidades ──────────────────────────────────────────────
W('n0', 'zero', 'zero', 'numero', 1, { ring: [4] });
W('n1', 'um', 'one', 'numero', 1, { p: [4] });
W('n2', 'dois', 'two', 'numero', 1, { p: [0, 8] });
W('n3', 'três', 'three', 'numero', 1, { p: [0, 4, 8] });
W('n4', 'quatro', 'four', 'numero', 2, { p: [0, 2, 6, 8] });
W('n5', 'cinco', 'five', 'numero', 2, { p: [0, 2, 4, 6, 8] });
W('todos', 'todos', 'all', 'numero', 2, { p: [0, 1, 2, 3, 4, 5, 6, 7, 8] });
W('mais', 'mais', 'more', 'numero', 2, { p: [1, 3, 4, 5, 7] });
W('menos', 'menos', 'less', 'numero', 2, { p: [3, 4, 5] });

// ── marcas do dado (fecham a frase) ────────────────────────────────────
W('conf', 'confirmado', 'confirmed', 'marca', 1, { p: [4], big: [4], l: [[3, 5]] });
W('boato', 'boato', 'rumor', 'marca', 1, { p: [1], big: [1], l: [[3, 5]] });
W('mem', 'memória (marca)', 'was true, no longer', 'marca', 3, { p: [7], big: [7], l: [[3, 5]] });
W('perg', 'pergunta', 'question', 'marca', 1, { p: [0, 2], big: [0, 2], l: [[3, 5]] });

// ── modificadores (formam palavras novas a partir de outras) ───────────
W('agente', '-dor (quem faz)', 'doer', 'mod', 3, { s: 1, p: [1] });
W('resultado', '-do (o que foi feito)', 'done to', 'mod', 3, { s: 1, l: [[6, 8]] });
W('oposto', 'o contrário', 'opposite', 'mod', 3, { s: 1, l: [[0, 3]] });
W('muitos', 'muitos', 'many', 'mod', 4, { s: 1, p: [2, 5] });
W('lugar', 'lugar de', 'place of', 'mod', 4, { s: 1, l: [[5, 8], [8, 7]] });

// ── verbos: as seis faces do dado ──────────────────────────────────────
W('acender', 'acender', 'ignite', 'verbo', 1, { l: [[1, 6], [6, 8], [8, 1]] });
W('igual', 'igual / pesar', 'equal / weigh', 'verbo', 2, { l: [[0, 2], [6, 8]] });
W('denovo', 'de novo', 'again', 'verbo', 3, { l: [[0, 2], [2, 6], [6, 8]] });
W('trocar', 'em vez de', 'instead of', 'verbo', 4, { l: [[0, 8], [2, 6]] });
W('seguir', 'então / seguir', 'then / follow', 'verbo', 5, { l: [[3, 5], [5, 1], [5, 7]] });
W('atravessar', 'atravessar / não', 'cross / not', 'verbo', 6, { l: [[1, 7], [6, 2]] });
// ── verbos gerais ──────────────────────────────────────────────────────
W('ver', 'ver', 'see', 'verbo', 3, { p: [4], l: [[1, 3], [3, 7], [7, 5], [5, 1]] });
W('dizer', 'dizer', 'say', 'verbo', 3, { l: [[4, 2], [4, 5], [4, 8]] });
W('escrever', 'escrever', 'write', 'verbo', 2, { p: [3], l: [[6, 2]] });
W('ir', 'ir', 'go', 'verbo', 5, { l: [[7, 1], [1, 3], [1, 5]] });
W('vir', 'vir', 'come', 'verbo', 5, { l: [[1, 7], [7, 3], [7, 5]] });
W('pegar', 'pegar', 'take', 'verbo', 4, { l: [[0, 7], [2, 7]] });
W('colocar', 'colocar', 'place', 'verbo', 2, { l: [[3, 5], [4, 7]] });
W('abrir', 'abrir', 'open', 'verbo', 6, { l: [[0, 6], [2, 8]] });
W('fechar', 'fechar', 'close', 'verbo', 6, { l: [[1, 7], [2, 8]] });
W('quebrar', 'quebrar', 'break', 'verbo', 6, { l: [[1, 4], [4, 5], [5, 8]] });
W('prender', 'prender', 'bind', 'verbo', 7, { l: [[1, 7], [7, 6]] });
W('dar', 'dar', 'give', 'verbo', 4, { l: [[3, 5], [5, 8]] });
W('contar', 'contar', 'count', 'verbo', 2, { p: [5], l: [[0, 6], [1, 7]] });
W('julgar', 'julgar', 'judge', 'verbo', 7, { l: [[1, 7], [3, 5]] });
W('querer', 'querer', 'want', 'verbo', 7, { l: [[6, 4], [4, 5]] });
// ── verbos compostos ───────────────────────────────────────────────────
C('ler', 'ler', 'read', 'verbo', 3, ['escrever', 'oposto']);
C('saber', 'saber', 'know', 'verbo', 3, ['ver', 'conf']);
C('lembrar', 'lembrar', 'remember', 'verbo', 3, ['ver', 'mem']);
C('esquecer', 'esquecer', 'forget', 'verbo', 3, ['lembrar', 'oposto']);
C('mentir', 'mentir', 'lie', 'verbo', 7, ['dizer', 'boato']);
C('escolher', 'escolher', 'choose', 'verbo', 4, ['pegar', 'trocar']);
C('libertar', 'libertar', 'free', 'verbo', 7, ['prender', 'oposto']);
C('absolver', 'absolver', 'absolve', 'verbo', 7, ['julgar', 'oposto']);
C('condenar', 'condenar', 'condemn', 'verbo', 7, ['julgar', 'prender']);

// ── coisas (moldura fechada) ───────────────────────────────────────────
const F = 'full';
W('brasa', 'braseiro', 'brazier', 'coisa', 1, { F, l: [[3, 7], [7, 5]] });
W('porta', 'porta', 'door', 'coisa', 1, { F, l: [[6, 3], [3, 1], [1, 5], [5, 8]] });
W('chao', 'chão', 'floor', 'coisa', 1, { F, l: [[6, 8]] });
W('placa', 'placa', 'plate', 'coisa', 2, { F, p: [4], l: [[6, 8]] });
W('dado', 'dado', 'die', 'coisa', 2, { F, p: [0, 2, 4, 6, 8] });
W('giz', 'giz', 'chalk', 'coisa', 2, { F, l: [[6, 2]] });
W('parede', 'parede', 'wall', 'coisa', 2, { F, l: [[1, 7]] });
W('pedra', 'pedra', 'stone', 'coisa', 2, { F, p: [3, 5, 7] });
W('fogo', 'fogo', 'fire', 'coisa', 1, { F, l: [[1, 6], [6, 8], [8, 1]] });
W('luz', 'luz', 'light', 'coisa', 1, { F, ring: [4], p: [1, 3, 5, 7] });
W('livro', 'livro', 'book', 'coisa', 3, { F, l: [[0, 6], [1, 7], [2, 8]] });
W('mesa', 'mesa', 'table', 'coisa', 4, { F, l: [[0, 2], [0, 6], [2, 8]] });
W('espelho', 'espelho', 'mirror', 'coisa', 4, { F, p: [2], l: [[1, 7]] });
W('chave', 'chave', 'key', 'coisa', 4, { F, ring: [1], l: [[1, 4], [4, 7], [7, 8]] });
W('altar', 'altar', 'altar', 'coisa', 4, { F, l: [[3, 5], [4, 7]] });
W('agua', 'água', 'water', 'coisa', 6, { F, l: [[3, 0], [0, 4], [4, 2], [2, 5]] });
W('poco', 'poço', 'well', 'coisa', 6, { F, ring: [4], p: [0, 2, 6, 8] });
W('caminho', 'caminho', 'path', 'coisa', 5, { F, l: [[6, 1], [8, 1]] });
W('trilho', 'trilho', 'rail', 'coisa', 5, { F, l: [[0, 6], [2, 8], [3, 5]] });
W('ponte', 'ponte', 'bridge', 'coisa', 5, { F, l: [[3, 5], [3, 6], [5, 8]] });
W('sala', 'sala', 'room', 'coisa', 5, { F, l: [[0, 2], [2, 8], [8, 6], [6, 0]] });
W('sino', 'sino', 'bell', 'coisa', 3, { F, l: [[1, 4], [4, 6], [4, 8], [6, 8]] });

// ── seres (moldura aberta em cima) ─────────────────────────────────────
W('voce', 'você', 'you', 'ser', 1, { F: 'U', p: [4] });
W('alguem', 'alguém', 'someone', 'ser', 3, { F: 'U', p: [1] });
W('contaveis', 'os Contáveis', 'the Countables', 'ser', 2, { F: 'U', p: [3, 4, 5] });
W('eco', 'eco', 'echo', 'ser', 3, { F: 'U', ring: [4] });
C('escrivao', 'o Escrivão', 'the Scribe', 'ser', 2, ['escrever', 'agente']);
C('juiz', 'juiz', 'judge', 'ser', 7, ['julgar', 'agente']);
C('condenado', 'condenado', 'condemned', 'ser', 7, ['condenar', 'resultado']);
C('boatodado', 'o Boato (o dado)', 'the Rumor (the die)', 'ser', 1, ['dado', 'boato']);
C('ninguem', 'ninguém', 'no one', 'ser', 3, ['alguem', 'n0']);

// ── conceitos (moldura aberta embaixo) ─────────────────────────────────
const N = 'N';
W('verdade', 'verdade', 'truth', 'conceito', 3, { F: N, p: [4], big: [4], l: [[3, 5]] });
W('mentira', 'mentira', 'falsehood', 'conceito', 3, { F: N, p: [1], big: [1], l: [[3, 5]] });
W('duvida', 'dúvida', 'doubt', 'conceito', 3, { F: N, p: [0, 2], big: [0, 2], l: [[3, 5]] });
W('memoria', 'memória', 'memory', 'conceito', 3, { F: N, p: [7], big: [7], l: [[3, 5]] });
W('acaso', 'acaso', 'chance', 'conceito', 3, { F: N, p: [0, 5, 7] });
W('ordem', 'ordem', 'order', 'conceito', 5, { F: N, l: [[0, 2]], p: [1] });
W('escolha', 'escolha', 'choice', 'conceito', 4, { F: N, l: [[7, 0], [7, 2]] });
W('tempo', 'tempo', 'time', 'conceito', 3, { F: N, l: [[0, 2], [2, 6], [6, 8], [8, 0]] });
W('nome', 'nome', 'name', 'conceito', 2, { F: N, p: [3, 4, 5, 7] });
W('crime', 'crime', 'crime', 'conceito', 7, { F: N, l: [[0, 4], [4, 8]] });
W('sentenca', 'sentença', 'sentence', 'conceito', 7, { F: N, l: [[0, 2], [3, 5], [6, 8]] });
W('pena', 'pena', 'penalty', 'conceito', 7, { F: N, l: [[0, 6], [6, 8]] });
W('medo', 'medo', 'fear', 'conceito', 4, { F: N, p: [1, 3, 5, 7] });
W('liberdade', 'liberdade', 'freedom', 'conceito', 7, { F: N, l: [[6, 1], [1, 8]] });
W('vida', 'vida', 'life', 'conceito', 6, { F: N, l: [[7, 4], [3, 4], [4, 5]] });
W('morte', 'morte', 'death', 'conceito', 6, { F: N, l: [[1, 7], [3, 5]] });
W('lei', 'lei', 'law', 'conceito', 7, { F: N, l: [[0, 6], [2, 8]], p: [3, 5] });
W('culpa', 'culpa', 'guilt', 'conceito', 7, { F: N, l: [[4, 7], [6, 8]] });

// ── ligações (moldura aberta à direita: esperam continuação) ───────────
const R = 'R';
W('se', 'se', 'if', 'ligacao', 2, { F: R, p: [4] });
W('e', 'e', 'and', 'ligacao', 2, { F: R, p: [3, 5] });
W('com', 'com', 'with', 'ligacao', 4, { F: R, l: [[3, 5]] });
W('ou', 'ou', 'or', 'ligacao', 4, { F: R, p: [1, 7] });
W('porque', 'porque', 'because', 'ligacao', 5, { F: R, l: [[4, 3]], p: [5] });
W('para', 'para', 'toward', 'ligacao', 5, { F: R, l: [[3, 5], [5, 1], [5, 7]] });
C('sem', 'sem', 'without', 'ligacao', 6, ['atravessar', 'com']);

// ── posição e tempo (moldura aberta à esquerda) ────────────────────────
const L = 'L';
W('agora', 'agora', 'now', 'posicao', 1, { F: L, p: [4] });
W('antes', 'antes', 'before', 'posicao', 3, { F: L, p: [3] });
W('depois', 'depois', 'after', 'posicao', 3, { F: L, p: [5] });
W('sempre', 'sempre', 'always', 'posicao', 3, { F: L, l: [[3, 5]] });
W('acima', 'acima', 'above', 'posicao', 5, { F: L, p: [1] });
W('abaixo', 'abaixo', 'below', 'posicao', 5, { F: L, p: [7] });
W('dentro', 'dentro', 'inside', 'posicao', 6, { F: L, ring: [4] });
W('perto', 'perto', 'near', 'posicao', 5, { F: L, l: [[3, 4]] });
W('longe', 'longe', 'far', 'posicao', 5, { F: L, p: [3, 5] });
C('nunca', 'nunca', 'never', 'posicao', 3, ['atravessar', 'sempre']);
C('fora', 'fora', 'outside', 'posicao', 6, ['atravessar', 'dentro']);


LOTE = 2;
// ══ segunda leva: o que falta para conversas e lore ═══════════════════
// ── seres: pronomes e relações ─────────────────────────────────────────
W('eu', 'eu', 'I', 'ser', 3, { F: 'U', p: [7] });
W('ele', 'ele / ela', 'he / she', 'ser', 3, { F: 'U', p: [5] });
W('nos', 'nós', 'we', 'ser', 3, { F: 'U', l: [[4, 7]] });
W('amigo', 'amigo', 'friend', 'ser', 4, { F: 'U', l: [[3, 5]] });
// ── coisas gerais ──────────────────────────────────────────────────────
W('coisa', 'coisa', 'thing', 'coisa', 2, { F, p: [4] });
C('mundo', 'mundo', 'world', 'coisa', 5, ['todos', 'coisa']);
C('casa', 'casa', 'house', 'coisa', 5, ['sala', 'muitos']);
C('palavra', 'palavra', 'word', 'coisa', 3, ['dizer', 'resultado']);
// ── perguntas (a marca PERGUNTA junto de outra palavra) ────────────────
C('quem', 'quem', 'who', 'ser', 3, ['alguem', 'perg']);
C('oque', 'o quê', 'what', 'coisa', 3, ['coisa', 'perg']);
C('onde', 'onde', 'where', 'posicao', 3, ['lugar', 'perg']);
C('porquep', 'por quê', 'why', 'ligacao', 3, ['porque', 'perg']);
C('quando', 'quando', 'when', 'posicao', 3, ['tempo', 'perg']);
// ── qualidades (moldura: duas laterais) ────────────────────────────────
const V = 'V';
W('primeiro', 'primeiro', 'first', 'qualidade', 2, { F: V, p: [1] });
W('ultimo', 'último', 'last', 'qualidade', 7, { F: V, p: [7] });
W('grande', 'grande', 'big', 'qualidade', 4, { F: V, p: [0, 2, 6, 8] });
W('pequeno', 'pequeno', 'small', 'qualidade', 4, { F: V, p: [4] });
W('novo', 'novo', 'new', 'qualidade', 3, { F: V, l: [[4, 1]] });
W('velho', 'velho', 'old', 'qualidade', 3, { F: V, l: [[4, 7]] });
W('bom', 'bom', 'good', 'qualidade', 4, { F: V, l: [[3, 7], [7, 2]] });
C('mau', 'mau', 'bad', 'qualidade', 4, ['bom', 'oposto']);
W('outro', 'outro', 'other', 'qualidade', 4, { F: V, p: [3, 5] });
W('vazio', 'vazio', 'empty', 'qualidade', 2, { F: V, ring: [4] });
// ── mais verbos ────────────────────────────────────────────────────────
W('fazer', 'fazer', 'do / make', 'verbo', 2, { l: [[0, 4], [4, 8], [2, 4]] });
W('ter', 'ter', 'have', 'verbo', 4, { l: [[0, 4], [4, 6]] });
W('poder', 'poder', 'can', 'verbo', 4, { l: [[2, 4], [4, 8]] });
W('cair', 'cair', 'fall', 'verbo', 5, { l: [[2, 5], [5, 8], [8, 7]] });
W('voltar', 'voltar', 'return', 'verbo', 5, { l: [[5, 3], [3, 1], [3, 7]] });
W('ficar', 'ficar', 'stay', 'verbo', 3, { ring: [4], l: [[3, 4], [4, 5]] });
C('dever', 'dever', 'must', 'verbo', 7, ['seguir', 'lei']);
C('ajudar', 'ajudar', 'help', 'verbo', 4, ['dar', 'com']);
C('esperar', 'esperar', 'wait', 'verbo', 3, ['ficar', 'depois']);
C('viver', 'viver', 'live', 'verbo', 6, ['igual', 'vida']);
C('morrer', 'morrer', 'die', 'verbo', 6, ['igual', 'morte']);
C('pensar', 'pensar', 'think', 'verbo', 3, ['dizer', 'dentro']);
C('sentir', 'sentir', 'feel', 'verbo', 4, ['pegar', 'dentro']);
C('lancar', 'lançar', 'throw / cast', 'verbo', 2, ['ir', 'dado']);
C('pousar', 'pousar', 'land', 'verbo', 2, ['vir', 'chao']);
// ── sentimentos (compostos) ────────────────────────────────────────────
C('esperanca', 'esperança', 'hope', 'conceito', 6, ['querer', 'depois']);
C('tristeza', 'tristeza', 'sadness', 'conceito', 6, ['vida', 'menos']);
C('alegria', 'alegria', 'joy', 'conceito', 6, ['vida', 'mais']);
C('saudade', 'saudade', 'longing', 'conceito', 6, ['memoria', 'querer']);
C('raiva', 'raiva', 'anger', 'conceito', 6, ['fogo', 'medo']);

LOTE = 3;
// ══ terceira leva: palavras que o roteiro vai pedir de qualquer jeito ═══
W('quente', 'quente', 'hot', 'qualidade', 2, { F: V, l: [[6, 1], [1, 8]] });
C('frio', 'frio', 'cold', 'qualidade', 2, ['quente', 'oposto']);
W('forte', 'forte', 'strong', 'qualidade', 4, { F: V, l: [[1, 7], [3, 5]] });
C('fraco', 'fraco', 'weak', 'qualidade', 4, ['forte', 'oposto']);
C('escuro', 'escuro', 'dark', 'qualidade', 1, ['luz', 'oposto']);
W('som', 'som', 'sound', 'conceito', 3, { F: N, l: [[4, 2], [4, 5], [4, 8]] });
C('silencio', 'silêncio', 'silence', 'conceito', 3, ['som', 'oposto']);
C('dia', 'dia', 'day', 'conceito', 3, ['luz', 'tempo']);
C('noite', 'noite', 'night', 'conceito', 3, ['escuro', 'tempo']);
C('segredo', 'segredo', 'secret', 'conceito', 4, ['palavra', 'dentro']);
C('mestre', 'mestre', 'master', 'ser', 4, ['saber', 'agente']);
C('pai', 'pai', 'father', 'ser', 4, ['alguem', 'velho']);
C('filho', 'filho', 'child', 'ser', 4, ['alguem', 'novo']);
C('achar', 'achar', 'find', 'verbo', 3, ['ver', 'pegar']);
C('perder', 'perder', 'lose', 'verbo', 3, ['achar', 'oposto']);
C('ouvir', 'ouvir', 'hear', 'verbo', 3, ['pegar', 'som']);

// Palavras de HISTÓRIA: o jogador entende a lore se aprendê-las (diários e conversas),
// mas nenhum puzzle depende delas. Todas as outras são palavras de PUZZLE (obrigatórias).
const LORE = new Set([
  'alguem', 'contaveis', 'eco', 'escrivao', 'juiz', 'condenado', 'ninguem', 'eu', 'ele', 'nos', 'amigo', 'quem', 'mestre', 'pai', 'filho',
  'oque', 'onde', 'porquep', 'quando', 'porque',
  'verdade', 'mentira', 'duvida', 'memoria', 'acaso', 'nome', 'crime', 'sentenca', 'pena', 'medo', 'liberdade', 'vida', 'morte', 'lei', 'culpa',
  'esperanca', 'tristeza', 'alegria', 'saudade', 'raiva', 'dia', 'noite', 'segredo', 'silencio',
  'esquecer', 'lembrar', 'mentir', 'libertar', 'absolver', 'condenar', 'julgar', 'prender', 'querer', 'esperar', 'pensar', 'sentir',
  'ajudar', 'viver', 'morrer', 'dever', 'ter', 'poder', 'saber', 'achar', 'perder', 'ouvir', 'lancar', 'pousar',
  'novo', 'velho', 'bom', 'mau', 'forte', 'fraco', 'mundo', 'casa', 'palavra',
]);

const CATS = [
  ['numero', 'Números e quantidades'],
  ['marca', 'Marcas do dado'],
  ['mod', 'Modificadores'],
  ['verbo', 'Verbos'],
  ['coisa', 'Coisas'],
  ['ser', 'Seres'],
  ['conceito', 'Conceitos'],
  ['qualidade', 'Qualidades'],
  ['ligacao', 'Ligações'],
  ['posicao', 'Posição e tempo'],
];

// ── validação ──────────────────────────────────────────────────────────
const byId = new Map();
for (const w of words) {
  if (byId.has(w.id)) throw new Error('id repetido: ' + w.id);
  byId.set(w.id, w);
}
const norm = (g) => {
  const l = (g.l ?? []).map(([a, b]) => (a < b ? [a, b] : [b, a]));
  const p = new Set(g.p ?? []);
  for (const [a, b] of l) {
    if (!(g.ring ?? []).includes(a)) p.add(a);
    if (!(g.ring ?? []).includes(b)) p.add(b);
  }
  return {
    F: g.F ?? '', s: g.s ? 1 : 0,
    p: [...p].sort((a, b) => a - b),
    ring: [...(g.ring ?? [])].sort((a, b) => a - b),
    big: [...(g.big ?? [])].sort((a, b) => a - b),
    l: l.sort((x, y) => x[0] - y[0] || x[1] - y[1]),
  };
};
const seen = new Map();
for (const w of words) {
  if (w.c) {
    for (const x of w.c) if (!byId.has(x)) throw new Error(`${w.id}: componente desconhecido ${x}`);
    continue;
  }
  w.g = norm(w.g);
  const k = JSON.stringify(w.g);
  if (seen.has(k)) console.warn(`aviso: símbolo igual — ${w.id} e ${seen.get(k)}`);
  else seen.set(k, w.id);
}
const flat = (w) => (w.c ? w.c.flatMap((x) => flat(byId.get(x))) : [w.id]);
const ckeys = new Map();
for (const w of words) if (w.c) {
  const k = flat(w).join('+');
  if (ckeys.has(k)) console.warn(`aviso: composto igual — ${w.id} e ${ckeys.get(k)}`);
  ckeys.set(k, w.id);
}

for (const w of words) w.uso = LORE.has(w.id) ? 'historia' : 'puzzle';
for (const id of LORE) if (!byId.has(id)) throw new Error('LORE: palavra desconhecida ' + id);

// ── saídas ─────────────────────────────────────────────────────────────
fs.mkdirSync(path.join(ROOT, 'src/story'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'src/story/lexicon.json'), JSON.stringify(words, null, 1) + '\n');

const famName = Object.fromEntries(CATS);
let md = '# Vocabulário dos Contáveis (gerado por `tools/lexicon.mjs`; não editar à mão)\n\n';
md += `Total: **${words.length} palavras** (${words.filter((w) => !w.c).length} símbolos próprios, ${words.filter((w) => w.c).length} compostas).\n`;
md += `Uso: **${words.filter((w) => w.uso === 'puzzle').length} de puzzle** (obrigatórias) e **${words.filter((w) => w.uso === 'historia').length} de história** (opcionais: só enriquecem a lore).\n`;
md += 'Capítulo = quando a palavra começa a aparecer (provisório).\n';
for (const [f, name] of CATS) {
  md += `\n## ${name}\n\n| id | Português | English | Cap. | Uso | Escrita |\n|---|---|---|---|---|---|\n`;
  for (const w of words.filter((x) => x.fam === f)) {
    const how = w.c ? w.c.join(' + ') : 'símbolo próprio';
    md += `| ${w.id} | ${w.pt} | ${w.en} | ${w.cap} | ${w.uso === 'historia' ? 'história' : 'puzzle'} | ${how} |\n`;
  }
}
fs.mkdirSync(path.join(ROOT, 'docs/lingua'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'docs/lingua/LEXICON.md'), md);
console.log(`${words.length} palavras gravadas.`);

// ── folhas visuais (opcional) ──────────────────────────────────────────
const GLYPH_JS = `
const pt=(i,cx,cy,S)=>[cx+((i%3)-1)*S,cy+(Math.floor(i/3)-1)*S];
function glyph(g,w,fc,dots){
  const S=34,cx=75,cy=58,h=S+22,sm=g.s?1:0,R=sm?4.2:7,lw=sm?3.4:5;
  let o='<svg width="'+w+'" height="'+Math.round(w*130/150)+'" viewBox="0 0 150 130">';
  if(dots!==false)for(let i=0;i<9;i++){const [x,y]=pt(i,cx,cy,S);o+='<circle cx="'+x+'" cy="'+y+'" r="2" fill="#3a312b"/>'}
  const x0=cx-h,x1=cx+h,y0=cy-h,y1=cy+h;
  const pl={U:[[x0,y0],[x0,y1],[x1,y1],[x1,y0]],N:[[x0,y1],[x0,y0],[x1,y0],[x1,y1]],R:[[x1,y0],[x0,y0],[x0,y1],[x1,y1]],L:[[x0,y0],[x1,y0],[x1,y1],[x0,y1]]};
  const st='" fill="none" stroke="'+fc+'" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>';
  if(g.F==='full')o+='<rect x="'+x0+'" y="'+y0+'" width="'+2*h+'" height="'+2*h+'" rx="4'+st;
  else if(g.F==='V')o+='<polyline points="'+x0+','+y0+' '+x0+','+y1+st+'<polyline points="'+x1+','+y0+' '+x1+','+y1+st;
  else if(g.F)o+='<polyline points="'+pl[g.F].map(p=>p.join(',')).join(' ')+st;
  for(const [a,b] of g.l||[]){const [xa,ya]=pt(a,cx,cy,S),[xb,yb]=pt(b,cx,cy,S);o+='<line x1="'+xa+'" y1="'+ya+'" x2="'+xb+'" y2="'+yb+'" stroke="#f2e6c9" stroke-width="'+lw+'" stroke-linecap="round"/>'}
  for(const i of g.p||[]){const [x,y]=pt(i,cx,cy,S);o+='<circle cx="'+x+'" cy="'+y+'" r="'+((g.big||[]).includes(i)?10:R)+'" fill="#f2e6c9"/>'}
  for(const i of g.ring||[]){const [x,y]=pt(i,cx,cy,S);o+='<circle cx="'+x+'" cy="'+y+'" r="10" fill="none" stroke="#f2e6c9" stroke-width="4"/>'}
  return o+'<rect x="63" y="120" width="24" height="4" rx="2" fill="#6f6354"/></svg>';
}`;
const COL = { numero: '#e8c98a', quant: '#e8c98a', marca: '#9fb6e8', mod: '#9fb6e8', verbo: '#9fd1b4', coisa: '#e0a84c', ser: '#7fd0d8', conceito: '#b79df0', qualidade: '#d9d27a', ligacao: '#e8a07a', posicao: '#8fd18f' };
const FRAME = { full: '#e0a84c', U: '#7fd0d8', N: '#b79df0', V: '#d9d27a', R: '#e8a07a', L: '#8fd18f' };

async function shoot(pairs, w, h) {
  try {
    const { chromium } = createRequire(import.meta.url)('playwright');
    const b = await chromium.launch();
    for (const [html, png] of pairs) {
      const pg = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
      await pg.goto('file://' + html);
      await pg.screenshot({ path: png, fullPage: true });
      await pg.close();
    }
    await b.close();
    console.log('imagens:\n  ' + pairs.map((x) => x[1]).join('\n  '));
  } catch (e) {
    console.log('HTML gerado; para o PNG instale o playwright. (' + e.message + ')');
  }
}

const si = process.argv.indexOf('--sheet');
if (si > 0) {
  const out = path.resolve(process.argv[si + 1]);
  fs.mkdirSync(out, { recursive: true });
  const sheets = [
    ['1-base', 'Base: números, marcas, modificadores e verbos', ['numero', 'marca', 'mod', 'verbo']],
    ['2-mundo', 'Mundo: coisas e seres', ['coisa', 'ser']],
    ['3-ideias', 'Ideias: conceitos, qualidades, ligações e posição/tempo', ['conceito', 'qualidade', 'ligacao', 'posicao']],
    ['4-novas', 'Palavras acrescentadas na 3ª leva', CATS.map((c) => c[0]), true],
  ];
  const html = (title, fams, onlyNew) => `<!doctype html><meta charset="utf-8"><style>
  body{margin:0;background:#14110f;color:#f2e6c9;font-family:system-ui,sans-serif;width:1180px;padding:26px 30px 30px}
  h1{font:600 24px Georgia,serif;margin:0 0 4px} .s{color:#b8a98f;font-size:13px;margin-bottom:4px}
  h2{font:600 12px system-ui;letter-spacing:1.8px;text-transform:uppercase;color:#e0a84c;margin:22px 0 10px}
  .g{display:flex;flex-wrap:wrap;gap:8px}
  .t{width:124px;background:#1f1a17;border:1px solid #3a312b;border-bottom:3px solid var(--c);border-radius:8px;padding:5px 3px 7px;text-align:center}
  .t .row{display:flex;justify-content:center;align-items:center;height:84px;gap:1px}
  .n{font:600 12px system-ui;color:#f2e6c9;margin-top:2px} .e{font:10.5px system-ui;color:#8f8272} .k{font:10px system-ui;color:#6f6354}
  </style><h1>${title}</h1><div class="s">${words.length} palavras no total · a moldura (aberta ou fechada) diz a família antes de se saber o significado</div><div id="o"></div>
  <script>${GLYPH_JS}
  const WORDS=${JSON.stringify(words)}, COL=${JSON.stringify(COL)}, FC=${JSON.stringify(FRAME)}, FAMS=${JSON.stringify(fams)}, CATS=${JSON.stringify(CATS)}, ONLY=${onlyNew ? 'true' : 'false'};
  const SEL=ONLY?WORDS.filter(w=>w.lote===3):WORDS;
  const by=Object.fromEntries(WORDS.map(w=>[w.id,w]));
  const flat=w=>w.c?w.c.flatMap(x=>flat(by[x])):[w];
  function tile(w){
    const parts=flat(w),sz=parts.length===1?84:parts.length===2?58:42;
    const gl=parts.map(p=>glyph(p.g,sz*150/130,FC[p.g.F]||'#e0a84c')).join('');
    return '<div class="t" style="--c:'+COL[w.fam]+'"><div class="row">'+gl+'</div><div class="n">'+w.pt+'</div><div class="e">'+w.en+'</div><div class="k">cap. '+w.cap+(w.c?' · composta':'')+(w.uso==='historia'?' · história':'')+'</div></div>';
  }
  document.getElementById('o').innerHTML=CATS.filter(c=>FAMS.includes(c[0])&&SEL.some(w=>w.fam===c[0])).map(([f,n])=>'<h2>'+n+' ('+SEL.filter(w=>w.fam===f).length+')</h2><div class="g">'+SEL.filter(w=>w.fam===f).map(tile).join('')+'</div>').join('');
  </script>`;
  const pairs = [];
  for (const [file, title, fams, only] of sheets) {
    const h = path.join(out, file + '.html');
    fs.writeFileSync(h, html(title, fams, only));
    pairs.push([h, path.join(out, file + '.png')]);
  }
  await shoot(pairs, 1180, 900);
}

// Folha "para mostrar a um amigo": só os símbolos próprios, numerados, sem significado.
const fi = process.argv.indexOf('--friend');
if (fi > 0) {
  const out = path.resolve(process.argv[fi + 1]);
  fs.mkdirSync(out, { recursive: true });
  const own = [];
  for (const [f] of CATS) for (const w of words) if (w.fam === f && !w.c) own.push(w);
  const key = '# Chave da folha do amigo\n\n| nº | id | português |\n|---|---|---|\n' + own.map((w, i) => `| ${i + 1} | ${w.id} | ${w.pt} |`).join('\n') + '\n';
  fs.writeFileSync(path.join(out, 'chave.md'), key);
  const h = path.join(out, 'amigo.html');
  fs.writeFileSync(h, `<!doctype html><meta charset="utf-8"><style>
  body{margin:0;background:#17130f;color:#f2e6c9;font-family:system-ui,sans-serif;width:1180px;padding:28px 32px 32px}
  h1{font:600 26px Georgia,serif;margin:0 0 4px} .s{color:#b8a98f;font-size:14px;margin-bottom:18px}
  .g{display:flex;flex-wrap:wrap;gap:8px}
  .t{width:90px;background:#1f1a17;border:1px solid #3a312b;border-radius:8px;padding:4px 2px 6px;text-align:center}
  .t svg{display:block;margin:0 auto} .n{font:600 12px system-ui;color:#8f8272;margin-top:1px}
  </style><h1>Símbolos de uma língua inventada</h1>
  <div class="s">${own.length} símbolos, cada um é uma palavra. O pezinho cinza marca o lado de baixo.</div><div id="o" class="g"></div>
  <script>${GLYPH_JS}
  const OWN=${JSON.stringify(own.map((w) => w.g))};
  document.getElementById('o').innerHTML=OWN.map((g,i)=>'<div class="t">'+glyph(g,86,'#d8cdb3',false)+'<div class="n">'+(i+1)+'</div></div>').join('');
  </script>`);
  await shoot([[h, path.join(out, 'amigo.png')]], 1180, 900);
}
