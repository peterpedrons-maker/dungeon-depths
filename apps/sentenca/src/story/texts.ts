// Textos de lore que o jogador acha (em português: são vozes humanas, de outros condenados).
// ATENÇÃO: os textos abaixo são EXEMPLOS para ver o diário funcionando; a lore real será escrita depois.
export interface TextEntry {
  id: string;
  title: string;
  by: string;
  body: string[];
}

export const TEXTS: Record<string, TextEntry> = {
  'demo-pagina': {
    id: 'demo-pagina',
    title: 'Página solta',
    by: 'alguém que passou por aqui antes',
    body: [
      '[Texto de exemplo: a lore real será escrita depois.]',
      'Achei o triângulo ao lado das tochas de novo. Anotei "acender", mas sinto que é mais "fogo". Se alguém ler isto: teste antes de confiar em mim.',
    ],
  },
};
