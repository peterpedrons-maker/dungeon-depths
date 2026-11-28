// OS TRÊS IDIOMAS (pedido do Pedro, DESIGN.md §98): português, inglês e espanhol. TODO texto que o jogador lê (interface, pensamentos,
// legendas, o caderno, as folhas dela) é um `Tx` com os três; os glifos dos Contáveis não mudam (são a língua do mundo).
// Regra do projeto: nada entra no jogo só em português. O TypeScript cobra (um `Tx` sem um dos três não compila) e
// `tools/verify_i18n.mjs` procura texto solto em português nos arquivos do jogo.
import { configStore } from './story/config';
import { useStore } from './story/store';
import type { Lang, Text } from './lang';

export type { Lang, Tx, Text } from './lang';
export { LANGS, guessLang, T, isTx } from './lang';

export const lang = (): Lang => configStore.get().lang;

// o texto no idioma escolhido
export function tx(t: Text | null | undefined, l: Lang = configStore.get().lang): string {
  if (t == null) return '';
  return typeof t === 'string' ? t : (t[l] ?? t.pt);
}

// (React) o idioma atual; o componente se redesenha quando ele muda
export const useLang = (): Lang => useStore(configStore).lang;
