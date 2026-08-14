import { DUNGEONS } from './dungeons';
import regiao1 from '../assets/dungeon-map/regiao1.webp';
import regiao2 from '../assets/dungeon-map/regiao2.webp';

export interface MapMarker {
  dungeonId: string;
  xPct: number; // % of image width, center of the marker's hotspot
  yPct: number; // % of image height
}

export interface RegionDef {
  region: number;
  name: string;
  image: string | null; // null = art not generated yet, region shows as "em breve"
  markers: MapMarker[];
}

// Coordinates were measured directly from the generated map art (detecting
// the sign-post color and taking each connected component's centroid), not
// eyeballed — keeps hotspots aligned with the actual sign position even if
// the image gets regenerated at a different resolution (still %-based).
export const REGIONS: RegionDef[] = [
  {
    region: 1, name: 'Valdren', image: regiao1,
    markers: [
      { dungeonId: 'ruinas', xPct: 52.5, yPct: 80.6 },
      { dungeonId: 'goblins', xPct: 55.0, yPct: 64.4 },
      { dungeonId: 'cripta', xPct: 55.8, yPct: 46.6 },
      { dungeonId: 'pantano', xPct: 53.3, yPct: 32.1 },
      { dungeonId: 'aranhas', xPct: 65.1, yPct: 22.2 },
    ],
  },
  {
    region: 2, name: 'Umbrália', image: regiao2,
    markers: [
      { dungeonId: 'torre', xPct: 52.4, yPct: 80.6 },
      { dungeonId: 'minas', xPct: 54.9, yPct: 64.4 },
      { dungeonId: 'floresta', xPct: 38.0, yPct: 53.3 },
      { dungeonId: 'necropole', xPct: 56.2, yPct: 46.5 },
      { dungeonId: 'covil', xPct: 53.3, yPct: 32.1 },
      { dungeonId: 'elficas', xPct: 65.2, yPct: 22.2 },
      { dungeonId: 'arena', xPct: 42.0, yPct: 14.0 },
    ],
  },
  { region: 3, name: 'Thurgard', image: null, markers: [] },
  { region: 4, name: 'Xilvana', image: null, markers: [] },
  { region: 5, name: 'Ignares', image: null, markers: [] },
  { region: 6, name: 'Nyxheim', image: null, markers: [] },
  { region: 7, name: 'Aetherion', image: null, markers: [] },
];

// A region unlocks once the character reaches the lowest level requirement
// among its own dungeons — guarantees at least one marker is already
// enterable the moment the region itself becomes visible.
export function regionMinLevel(region: RegionDef): number {
  const reqs = region.markers
    .map((m) => DUNGEONS.find((d) => d.id === m.dungeonId)?.levelReq)
    .filter((n): n is number => n !== undefined);
  return reqs.length > 0 ? Math.min(...reqs) : Infinity;
}
