import * as THREE from 'three';
import { createStore } from './store';

// O CARREGAMENTO (DESIGN.md §79). O que falta para o jogo estar pronto:
// - os modelos 3D (tocha, braseiro, objetos, o Escrivão): o GLTFLoader usa o gerenciador padrão do three, que conta o que já chegou;
// - a fonte do jogo (mdd-pixel);
// - as gravações de som (audio.ts já baixa e decodifica antes do 1º toque; a cena informa quanto falta);
// - e os primeiros quadros desenhados: o 1º desenho de cada material compila o programa de sombreamento, e é isso que deixava a tela preta
//   uns segundos antes de o cenário aparecer.
// A tela da editora e a tela inicial esperam o cenário; a tela de carregamento (depois de Novo jogo / Continuar) espera também o som.

let mDone = 0;
let mTotal = 0;
const mgr = THREE.DefaultLoadingManager;
const onItem = (_u: string, loaded: number, total: number) => {
  mDone = loaded;
  mTotal = total;
};
mgr.onStart = onItem;
mgr.onProgress = onItem; // (o three chama também quando um arquivo falha: ele conta como "chegou", para ninguém esperar à toa)
mgr.onLoad = () => {
  mDone = mTotal;
};

let fontsOk = typeof document === 'undefined' || !document.fonts;
if (!fontsOk)
  document.fonts.ready.then(
    () => (fontsOk = true),
    () => (fontsOk = true),
  );

// `p`: o que a barra mostra (0..1); `ready`: tudo chegou (ou passou do tempo máximo); `live`: o som já está liberado (houve um gesto)
export interface LoadState {
  p: number;
  ready: boolean;
  live: boolean;
}
export const loadStore = createStore<LoadState>({ p: 0, ready: false, live: false });

// onde fica a barra da tela de carregamento (frações da janela): a frase de glifos centrada entre x0 e x1, com o meio da linha em y; a bancada
// começa em `ledge` e o aviso de começar fica em `prompt` (na frente da bancada). A cena usa para o dado olhar a ponta da luz
export const LOAD_BAR = { x0: 0.06, x1: 0.72, y: 0.78, ledge: 0.88, prompt: 0.905 };

export const loading = {
  models: () => (mTotal === 0 ? 1 : Math.min(1, mDone / mTotal)),
  fonts: () => fontsOk,
  set(p: number, ready: boolean, live: boolean) {
    const s = loadStore.get();
    const q = Math.round(p * 100) / 100;
    if (s.p !== q || s.ready !== ready || s.live !== live) loadStore.set({ p: q, ready, live });
  },
};
