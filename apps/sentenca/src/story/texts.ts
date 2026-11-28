// Textos de lore que o jogador acha (vozes humanas, de outros condenados; nos três idiomas, src/i18n.ts).
// ATENÇÃO: os textos abaixo são EXEMPLOS para ver o diário funcionando; a lore real será escrita depois.
import { T, type Tx } from '../i18n';

export interface TextEntry {
  id: string;
  title: Tx;
  by: Tx;
  body: Tx[];
}

export const TEXTS: Record<string, TextEntry> = {
  'demo-pagina': {
    id: 'demo-pagina',
    title: T('Página solta', 'Loose page', 'Página suelta'),
    by: T('alguém que passou por aqui antes', 'someone who came through here before', 'alguien que pasó por aquí antes'),
    body: [
      T(
        '[Texto de exemplo: a lore real será escrita depois.]',
        '[Sample text: the real lore will be written later.]',
        '[Texto de ejemplo: el lore real se escribirá después.]',
      ),
      T(
        'Achei o triângulo ao lado das tochas de novo. Anotei "acender", mas sinto que é mais "fogo". Se alguém ler isto: teste antes de confiar em mim.',
        'Found the triangle by the torches again. I wrote down "ignite", but it feels more like "fire". If anyone reads this: test it before you trust me.',
        'Encontré otra vez el triángulo junto a las antorchas. Anoté "encender", pero siento que es más "fuego". Si alguien lee esto: prueba antes de confiar en mí.',
      ),
    ],
  },
};
