import { useSyncExternalStore } from 'react';

// Armazenamento minúsculo e observável (sem biblioteca): o motor 3D e o React leem o mesmo estado.
export interface Store<T> {
  get(): T;
  set(next: T | ((s: T) => T)): void;
  subscribe(fn: () => void): () => void;
}

export function createStore<T>(initial: T): Store<T> {
  let state = initial;
  const subs = new Set<() => void>();
  return {
    get: () => state,
    set(next) {
      const v = typeof next === 'function' ? (next as (s: T) => T)(state) : next;
      if (Object.is(v, state)) return;
      state = v;
      subs.forEach((f) => f());
    },
    subscribe(fn) {
      subs.add(fn);
      return () => {
        subs.delete(fn);
      };
    },
  };
}

export const useStore = <T,>(s: Store<T>): T => useSyncExternalStore(s.subscribe, s.get);
