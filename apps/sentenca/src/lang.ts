// Os idiomas do jogo (src/i18n.ts). Fica num arquivo SEM dependências: as configurações (story/config.ts) e o i18n importam daqui
// (se config.ts importasse o i18n, que importa config.ts, a ordem de carga deixava `T` sem valor e a página ficava em branco).
export type Lang = 'pt' | 'en' | 'es';

export interface Tx {
  pt: string;
  en: string;
  es: string;
}
// `string` = sem tradução porque não é língua (um número, um nome próprio, um id); todo o resto é `Tx`
export type Text = string | Tx;

export const T = (pt: string, en: string, es: string): Tx => ({ pt, en, es });

export const isTx = (v: unknown): v is Tx => !!v && typeof v === 'object' && 'pt' in (v as object) && 'en' in (v as object) && 'es' in (v as object);

export const LANGS: { v: Lang; label: string }[] = [
  { v: 'pt', label: 'Português' },
  { v: 'en', label: 'English' },
  { v: 'es', label: 'Español' },
];

// o idioma do aparelho, para a 1ª escolha já vir marcada (português e espanhol pelo nome; qualquer outro, inglês)
export function guessLang(): Lang {
  const l = (typeof navigator !== 'undefined' ? navigator.language || 'pt' : 'pt').toLowerCase();
  if (l.startsWith('pt')) return 'pt';
  if (l.startsWith('es')) return 'es';
  return 'en';
}
