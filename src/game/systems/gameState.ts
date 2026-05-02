import { create } from "zustand";

export interface EnemyState {
  id: string;
  type: "skeleton";
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  state: "idle" | "chase" | "attack" | "hurt" | "dead";
  facing: number;
  stateTimer: number;
  hitCooldown: number;
}

interface GameState {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  enemies: EnemyState[];
  // weapon swing
  swingActive: boolean;
  swingT: number; // 0..1
  damageFlash: number;
  message: string | null;
  messageT: number;
}

interface Actions {
  setEnemies: (e: EnemyState[]) => void;
  updateEnemy: (id: string, patch: Partial<EnemyState>) => void;
  damagePlayer: (n: number) => void;
  damageEnemy: (id: string, n: number) => void;
  startSwing: () => void;
  setSwing: (active: boolean, t: number) => void;
  showMessage: (m: string) => void;
  tickMessage: (dt: number) => void;
  tickFlash: (dt: number) => void;
  reset: () => void;
}

export const useGame = create<GameState & Actions>((set, get) => ({
  hp: 100,
  maxHp: 100,
  mp: 50,
  maxMp: 50,
  enemies: [],
  swingActive: false,
  swingT: 0,
  damageFlash: 0,
  message: null,
  messageT: 0,
  setEnemies: (e) => set({ enemies: e }),
  updateEnemy: (id, patch) =>
    set({
      enemies: get().enemies.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }),
  damagePlayer: (n) => {
    const hp = Math.max(0, get().hp - n);
    set({ hp, damageFlash: 1 });
  },
  damageEnemy: (id, n) => {
    const enemies = get().enemies.map((e) => {
      if (e.id !== id) return e;
      const hp = Math.max(0, e.hp - n);
      return {
        ...e,
        hp,
        state: hp <= 0 ? ("dead" as const) : ("hurt" as const),
        stateTimer: hp <= 0 ? 0 : 0.3,
      };
    });
    set({ enemies });
  },
  startSwing: () => {
    if (get().swingActive) return;
    set({ swingActive: true, swingT: 0 });
  },
  setSwing: (active, t) => set({ swingActive: active, swingT: t }),
  showMessage: (m) => set({ message: m, messageT: 3 }),
  tickMessage: (dt) => {
    const t = get().messageT - dt;
    if (t <= 0) set({ message: null, messageT: 0 });
    else set({ messageT: t });
  },
  tickFlash: (dt) => {
    const f = Math.max(0, get().damageFlash - dt * 2);
    set({ damageFlash: f });
  },
  reset: () =>
    set({
      hp: 100,
      mp: 50,
      enemies: [],
      swingActive: false,
      swingT: 0,
      damageFlash: 0,
      message: null,
      messageT: 0,
    }),
}));
