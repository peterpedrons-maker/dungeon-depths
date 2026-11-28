// CONFIGURAÇÕES (INTERFACE.md §3.3): valem para o APARELHO, fora dos espaços de jogo. Lidas pelo motor e pela interface.
import { createStore } from './store';

const KEY = 'mdd-config-v1';

export type Quality = 'baixa' | 'media' | 'alta';
export type ShadowLevel = 'desligadas' | 'baixas' | 'medias' | 'altas';
export type PixelSize = 'fino' | 'medio' | 'grosso';
export type TextSpeed = 'lenta' | 'normal' | 'rapida';
export type Action = 'frente' | 'tras' | 'esquerda' | 'direita' | 'correr' | 'agir' | 'posicionar' | 'diario' | 'reiniciar';

// as teclas de cada ação (o motor lê as teclas pelo nome padrão; a configuração traduz)
export const DEFAULT_KEYS: Record<Action, string> = {
  frente: 'w',
  tras: 's',
  esquerda: 'a',
  direita: 'd',
  correr: 'shift',
  agir: 'e',
  posicionar: 'g',
  diario: 'j',
  reiniciar: 'r',
};
export const ACTION_LABEL: Record<Action, string> = {
  frente: 'Andar para a frente',
  tras: 'Andar para trás',
  esquerda: 'Andar para a esquerda',
  direita: 'Andar para a direita',
  correr: 'Correr',
  agir: 'Agir / recolher o dado',
  posicionar: 'Posicionar o dado',
  diario: 'Abrir o caderno',
  reiniciar: 'Reiniciar a sala',
};

export interface Config {
  // áudio (0 a 10)
  volMaster: number;
  volMusic: number;
  volSfx: number;
  // imagem
  quality: Quality;
  shadows: ShadowLevel; // sombras de verdade nas chamas (DESIGN.md §66): quantas, de que tamanho, com borda suave ou dura
  pixel: PixelSize;
  brightness: number; // -5 a 5
  fov: number; // campo de visão horizontal, em graus
  fpsCap: 0 | 30 | 60; // 0 = sem limite
  // controles
  mouseSens: number; // 1 a 10
  touchSens: number;
  invertY: boolean;
  vibration: boolean;
  keys: Record<Action, string>;
  // acessibilidade
  uiSize: number; // 80 a 160 (%)
  textSpeed: TextSpeed;
  reduceFlash: boolean; // reduzir tremores e clarões
  reduceMotion: boolean; // reduzir o movimento da câmera
  highContrast: boolean; // glifos com mais contraste
  crosshair: boolean; // mira sempre visível
  glyphNotes: boolean; // as anotações do jogador embaixo dos símbolos (conversas, balões e a tira de leitura das paredes; DESIGN.md §99)
  // idioma
  lang: 'pt';
}

export const DEFAULT_CONFIG: Config = {
  volMaster: 8,
  volMusic: 6,
  volSfx: 8,
  quality: 'alta',
  // no celular (toque) as sombras começam em "médias": metade das luzes com sombra e mapas menores
  shadows: typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches ? 'medias' : 'altas',
  pixel: 'medio',
  brightness: 0,
  fov: 95,
  fpsCap: 0,
  mouseSens: 5,
  touchSens: 5,
  invertY: false,
  vibration: true,
  keys: { ...DEFAULT_KEYS },
  uiSize: 100,
  textSpeed: 'normal',
  reduceFlash: false,
  reduceMotion: false,
  highContrast: false,
  crosshair: true,
  glyphNotes: false,
  lang: 'pt',
};

function load(): Config {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const j = JSON.parse(raw);
      // antes, a Qualidade decidia também as sombras (média: 2 chamas; baixa: nenhuma): quem já tinha escolhido continua com o mesmo
      if (!j.shadows && j.quality === 'baixa') j.shadows = 'desligadas';
      if (!j.shadows && j.quality === 'media') j.shadows = 'medias';
      return { ...DEFAULT_CONFIG, ...j, keys: { ...DEFAULT_KEYS, ...(j.keys ?? {}) } };
    }
    // o botão de som antigo (♫/♪/∅) vira os volumes
    const a = Number(localStorage.getItem('mdd-audio'));
    if (a === 1) return { ...DEFAULT_CONFIG, volMusic: 0 };
    if (a === 2) return { ...DEFAULT_CONFIG, volMaster: 0 };
  } catch {
    /* sem armazenamento: o padrão */
  }
  return { ...DEFAULT_CONFIG, keys: { ...DEFAULT_KEYS } };
}

export const configStore = createStore<Config>(load());
configStore.subscribe(() => {
  try {
    localStorage.setItem(KEY, JSON.stringify(configStore.get()));
  } catch {
    /* ok */
  }
});

export const config = {
  get: () => configStore.get(),
  set<K extends keyof Config>(k: K, v: Config[K]) {
    configStore.set((s) => ({ ...s, [k]: v }));
  },
  setKey(a: Action, key: string) {
    configStore.set((s) => {
      const keys = { ...s.keys };
      // a tecla que já era de outra ação troca de lugar com a antiga desta
      for (const other of Object.keys(keys) as Action[]) if (other !== a && keys[other] === key) keys[other] = s.keys[a];
      keys[a] = key;
      return { ...s, keys };
    });
  },
  resetKeys() {
    configStore.set((s) => ({ ...s, keys: { ...DEFAULT_KEYS } }));
  },
  // a tecla apertada → a tecla PADRÃO da ação dela (o que o motor entende); teclas padrão que foram trocadas por outra ficam mudas
  translate(k: string): string | null {
    const keys = configStore.get().keys;
    for (const a of Object.keys(keys) as Action[]) if (keys[a] === k) return DEFAULT_KEYS[a];
    if ((Object.values(DEFAULT_KEYS) as string[]).includes(k)) return null;
    return k;
  },
};

// o nome de uma tecla para mostrar na tela
export const keyName = (k: string) =>
  ({ ' ': 'Espaço', shift: 'Shift', control: 'Ctrl', alt: 'Alt', tab: 'Tab', enter: 'Enter', arrowup: 'Seta p/ cima', arrowdown: 'Seta p/ baixo', arrowleft: 'Seta esq.', arrowright: 'Seta dir.', backspace: 'Apagar' })[k] ?? k.toUpperCase();
