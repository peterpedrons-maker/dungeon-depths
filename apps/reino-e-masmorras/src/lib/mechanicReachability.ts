/**
 * Pequena infraestrutura determinística para provar alcançabilidade de
 * recursos em lutas longas. Ela não simula dano/RNG: cada passo representa
 * uma ação legítima escolhida pela árvore e captura checkpoints reutilizáveis.
 */
export const REACHABILITY_CHECKPOINTS = [4, 8, 12, 16] as const;
export type ReachabilityCheckpoint = (typeof REACHABILITY_CHECKPOINTS)[number];

export function simulateReachability<T>(initial: T, actions: readonly unknown[], step: (state: T, action: unknown, index: number) => T): Map<number, T> {
  let state = initial;
  const snapshots = new Map<number, T>();
  actions.forEach((action, index) => {
    state = step(state, action, index);
    const count = index + 1;
    if ((REACHABILITY_CHECKPOINTS as readonly number[]).includes(count)) snapshots.set(count, state);
  });
  return snapshots;
}

export function reaches<T>(snapshots: Map<number, T>, predicate: (state: T) => boolean): boolean {
  return [...snapshots.values()].some(predicate);
}

export function latestAtOrBefore<T>(snapshots: Map<number, T>, checkpoint: ReachabilityCheckpoint): T | undefined {
  let result: T | undefined;
  for (const [count, state] of snapshots) if (count <= checkpoint) result = state;
  return result;
}
