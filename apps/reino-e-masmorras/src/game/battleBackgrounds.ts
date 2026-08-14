// Per-dungeon combat backdrops (see KIT-DE-ARTE.md "Fundos de Batalha") —
// only a subset of dungeons have art so far; DungeonPanel falls back to its
// procedural canvas background for any dungeon id not listed here.
import ruinasUrl from '../assets/battle-bg/ruinas.webp';

const SOURCES: Partial<Record<string, string>> = {
  ruinas: ruinasUrl,
};

const cache: Partial<Record<string, HTMLImageElement>> = {};

export function battleBackground(dungeonId: string): HTMLImageElement | undefined {
  const url = SOURCES[dungeonId];
  if (!url) return undefined;
  if (!cache[dungeonId]) {
    const image = new Image();
    image.src = url;
    cache[dungeonId] = image;
  }
  return cache[dungeonId];
}
