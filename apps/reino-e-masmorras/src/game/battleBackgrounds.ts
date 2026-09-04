// Per-dungeon combat backdrops (see KIT-DE-ARTE.md "Fundos de Batalha") —
// only a subset of dungeons have art so far; DungeonPanel falls back to its
// procedural canvas background for any dungeon id not listed here.
import ruinasUrl from '../assets/battle-bg/ruinas.webp';
import goblinsUrl from '../assets/battle-bg/goblins.webp';
import criptaUrl from '../assets/battle-bg/cripta.webp';
import pantanoUrl from '../assets/battle-bg/pantano.webp';
import aranhasUrl from '../assets/battle-bg/aranhas.webp';
import torreUrl from '../assets/battle-bg/torre.webp';
import minasUrl from '../assets/battle-bg/minas.webp';
import florestaUrl from '../assets/battle-bg/floresta.webp';
import covilUrl from '../assets/battle-bg/covil.webp';
import elficasUrl from '../assets/battle-bg/elficas.webp';
import arenaUrl from '../assets/battle-bg/arena.webp';

const SOURCES: Partial<Record<string, string>> = {
  ruinas: ruinasUrl,
  goblins: goblinsUrl,
  cripta: criptaUrl,
  pantano: pantanoUrl,
  aranhas: aranhasUrl,
  torre: torreUrl,
  minas: minasUrl,
  floresta: florestaUrl,
  covil: covilUrl,
  elficas: elficasUrl,
  arena: arenaUrl,
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
