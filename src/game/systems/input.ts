import { create } from "zustand";

export interface InputState {
  // movement axis (-1..1)
  moveX: number;
  moveY: number;
  // look delta (consumed each frame)
  lookDX: number;
  lookDY: number;
  // buttons (held)
  run: boolean;
  attack: boolean;
  block: boolean;
  interact: boolean;
  // edge-triggered counters
  attackPressed: number;
  interactPressed: number;
  isTouch: boolean;
}

interface InputActions {
  setMove: (x: number, y: number) => void;
  addLook: (dx: number, dy: number) => void;
  consumeLook: () => { dx: number; dy: number };
  setRun: (v: boolean) => void;
  setBlock: (v: boolean) => void;
  setInteract: (v: boolean) => void;
  pressAttack: () => void;
  pressInteract: () => void;
  setAttackHeld: (v: boolean) => void;
  setTouch: (v: boolean) => void;
}

export const useInput = create<InputState & InputActions>((set, get) => ({
  moveX: 0,
  moveY: 0,
  lookDX: 0,
  lookDY: 0,
  run: false,
  attack: false,
  block: false,
  interact: false,
  attackPressed: 0,
  interactPressed: 0,
  isTouch: false,
  setMove: (x, y) => set({ moveX: x, moveY: y }),
  addLook: (dx, dy) => set({ lookDX: get().lookDX + dx, lookDY: get().lookDY + dy }),
  consumeLook: () => {
    const { lookDX, lookDY } = get();
    set({ lookDX: 0, lookDY: 0 });
    return { dx: lookDX, dy: lookDY };
  },
  setRun: (v) => set({ run: v }),
  setBlock: (v) => set({ block: v }),
  setInteract: (v) => set({ interact: v }),
  pressAttack: () => set({ attackPressed: get().attackPressed + 1, attack: true }),
  pressInteract: () => set({ interactPressed: get().interactPressed + 1, interact: true }),
  setAttackHeld: (v) => set({ attack: v }),
  setTouch: (v) => set({ isTouch: v }),
}));
