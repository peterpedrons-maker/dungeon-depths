// Medidas do desenho de uma palavra talhada (canvas): cada símbolo ocupa uma célula de CELL px, com PAD px de margem.
// Compartilhadas pela inscrição (inscription.ts), pelo fogo das palavras (firefx.ts) e pelas frases acendíveis (burnline.ts).
export const CELL = 96; // pixels por símbolo
export const PAD = 14;
export const GLYPH_SIZE = (CELL / 0.86) * 0.94; // o `size` de drawGlyph dentro de uma célula
