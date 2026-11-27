import raw from './lexicon.json';

// Vocabulário da língua dos Contáveis (gerado por tools/lexicon.mjs; não editar o JSON à mão).
export interface GlyphDef {
  F?: '' | 'full' | 'U' | 'N' | 'R' | 'L' | 'V';
  s?: number; // 1 = símbolo pequeno (modificador)
  p: number[]; // pontos (células 0..8)
  ring: number[]; // pontos vazios
  big: number[]; // pontos maiores
  l: [number, number][]; // ligações entre células
}

export interface Word {
  id: string;
  pt: string;
  en: string;
  fam: string;
  cap: number;
  uso: 'puzzle' | 'historia';
  g?: GlyphDef; // símbolo próprio
  c?: string[]; // palavra composta: sequência de outras palavras
}

export const WORDS = raw as unknown as Word[];
export const LEX: Record<string, Word> = Object.fromEntries(WORDS.map((w) => [w.id, w]));

// Os símbolos que realmente se escrevem (compostos viram uma sequência de símbolos próprios).
export function glyphsOf(id: string): GlyphDef[] {
  const w = LEX[id];
  if (!w) return [];
  if (w.g) return [w.g];
  return (w.c ?? []).flatMap(glyphsOf);
}
