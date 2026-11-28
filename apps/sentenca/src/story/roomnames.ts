// O NOME de cada sala nos três idiomas (src/i18n.ts). O nome em português continua sendo o IDENTIFICADOR da sala no código (a planta, as
// perguntas do dado, as gemas, o mapa e os salvamentos procuram a sala por ele); aqui só se traduz o que aparece na tela.
import { T, tx, type Tx } from '../i18n';

export const ROOM_NAMES: Record<string, Tx> = {
  'O Poço': T('O Poço', 'The Well', 'El Pozo'),
  'O Vestíbulo': T('O Vestíbulo', 'The Vestibule', 'El Vestíbulo'),
  'A Lousa': T('A Lousa', 'The Slate', 'La Pizarra'),
  'O Fio de Fogo': T('O Fio de Fogo', 'The Fire Thread', 'El Hilo de Fuego'),
  'Os Nichos e a Cisterna': T('Os Nichos e a Cisterna', 'The Niches and the Cistern', 'Los Nichos y la Cisterna'),
  'A Casa Escreve': T('A Casa Escreve', 'The House Writes', 'La Casa Escribe'),
  'A Chama Curta': T('A Chama Curta', 'The Short Flame', 'La Llama Corta'),
  'O Que a Casa Confirma': T('O Que a Casa Confirma', 'What the House Confirms', 'Lo Que la Casa Confirma'),
  'Os Banhos Secos': T('Os Banhos Secos', 'The Dry Baths', 'Los Baños Secos'),
  'O Pano': T('O Pano', 'The Cloth', 'El Paño'),
  'A Biblioteca': T('A Biblioteca', 'The Library', 'La Biblioteca'),
  'A Balança': T('A Balança', 'The Scale', 'La Balanza'),
  'A Ponte de Madeira': T('A Ponte de Madeira', 'The Wooden Bridge', 'El Puente de Madera'),
  'A Ponte de Frases': T('A Ponte de Frases', 'The Bridge of Sentences', 'El Puente de Frases'),
  'A Galeria dos Condenados': T('A Galeria dos Condenados', 'The Gallery of the Condemned', 'La Galería de los Condenados'),
  'A Sombra': T('A Sombra', 'The Shadow', 'La Sombra'),
  'O Escuro': T('O Escuro', 'The Dark', 'La Oscuridad'),
  'A Lei Pequena': T('A Lei Pequena', 'The Small Law', 'La Ley Pequeña'),
  'A Escadaria': T('A Escadaria', 'The Staircase', 'La Escalinata'),
  'O Fogo que Corre': T('O Fogo que Corre', 'The Running Fire', 'El Fuego que Corre'),
  'O Claustro do Vento': T('O Claustro do Vento', 'The Cloister of the Wind', 'El Claustro del Viento'),
  'A Antecâmara Fria': T('A Antecâmara Fria', 'The Cold Antechamber', 'La Antecámara Fría'),
  'A Memória da Casa': T('A Memória da Casa', 'The Memory of the House', 'La Memoria de la Casa'),
  'O Tribunal dos Rumores': T('O Tribunal dos Rumores', 'The Court of Rumors', 'El Tribunal de los Rumores'),
};
const ROOM = T('Sala', 'Room', 'Sala');

// "Sala 4 · O Fio de Fogo" (o nome completo, como a sala o guarda) -> no idioma escolhido; um nome sem tradução volta como veio
export function roomTitle(name: string): string {
  const m = /^Sala (\d+) · (.+)$/.exec(name);
  if (m) return `${tx(ROOM)} ${m[1]} · ${tx(ROOM_NAMES[m[2]] ?? m[2])}`;
  return tx(ROOM_NAMES[name] ?? name);
}
