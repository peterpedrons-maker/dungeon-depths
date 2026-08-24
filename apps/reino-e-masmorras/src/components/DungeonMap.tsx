import { useState } from 'react';
import { Character, DungeonDef } from '../types/game';
import { DUNGEONS, isDungeonUnlocked } from '../lib/dungeons';
import { REGIONS, regionMinLevel } from '../lib/dungeonMap';
import { Panel } from './Panel';
import { IconLock } from './icons';

// Non-special dungeons no longer gate on level — the label under the lock
// icon on the map instead names whichever prior dungeon(s) unlock this one,
// so "farm the first dungeon forever to hit some level number" stops being
// the only way forward. Special dungeons (Cripta, Torre, Arena) keep the
// level number, since they still gate on levelReq (see isDungeonUnlocked).
function unlockHint(dungeon: DungeonDef): string {
  if (dungeon.special) return `Nv. ${dungeon.levelReq}`;
  const names = (dungeon.unlockAfter ?? [])
    .map((id) => DUNGEONS.find((d) => d.id === id)?.name)
    .filter((n): n is string => !!n);
  return names.length > 0 ? names.join(' ou ') : '';
}

interface Props {
  character: Character;
  onEnterDungeon: (dungeon: DungeonDef) => void;
}

export function DungeonMap({ character, onEnterDungeon }: Props) {
  const visibleRegions = REGIONS.slice(0, firstHiddenIndex(character.level));
  const nextRegion = REGIONS[visibleRegions.length];
  // Default to the most recently unlocked region — the one the player is
  // most likely mid-progress through, and specifically the one that used to
  // force a scroll to reach (it rendered above Região 1 in the old
  // always-stacked layout). Re-derived from character.level on every
  // render, not sticky state, so leveling up while this screen is mounted
  // (or switching characters) can't leave the selector pointed at a region
  // that's no longer the newest.
  const [selected, setSelected] = useState(() => visibleRegions.length - 1);
  const activeIndex = Math.min(selected, visibleRegions.length - 1);
  const region = visibleRegions[activeIndex];

  return (
    <Panel title="Mapa de Masmorras">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {visibleRegions.map((r, i) => (
            <button
              key={r.region}
              onClick={() => setSelected(i)}
              className={`px-3 py-1.5 rounded-sm border text-xs font-bold tracking-wide transition ${
                i === activeIndex
                  ? 'border-gold bg-gold/15 text-gold'
                  : 'border-panelborder/50 text-parchment/60 hover:text-parchment hover:border-gold/40'
              }`}
            >
              {r.name} <span className="opacity-70">— {r.region}ª Região</span>
            </button>
          ))}
        </div>

        {region && (
          <div className="flex justify-center">
            {/* Height-capped instead of width-stretched, so the whole region
                map (portrait art, taller than it is wide) fits on screen
                without the player having to scroll to see the dungeons at
                the top/bottom — `inline-block` keeps this wrapper's own box
                shrunk to the image's actual rendered size, so the markers'
                %-based positions below still land exactly where they did. */}
            <div className="relative inline-block rounded overflow-hidden border border-black/50 shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
              <img src={region.image!} alt={region.name} className="w-auto max-w-full block" style={{ maxHeight: '56vh' }} draggable={false} />
              {region.markers.map((marker) => {
                const dungeon = DUNGEONS.find((d) => d.id === marker.dungeonId);
                if (!dungeon) return null;
                const locked = !isDungeonUnlocked(dungeon, character);
                const hint = unlockHint(dungeon);
                return (
                  <button
                    key={marker.dungeonId}
                    onClick={() => !locked && onEnterDungeon(dungeon)}
                    disabled={locked}
                    title={locked ? (dungeon.special ? `Requer nível ${dungeon.levelReq}` : `Complete ${hint} primeiro`) : dungeon.desc}
                    className="absolute w-16 h-16 sm:w-20 sm:h-20 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center transition"
                    style={{ left: `${marker.xPct}%`, top: `${marker.yPct}%` }}
                  >
                    {locked && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 pointer-events-none">
                        <IconLock className="w-8 h-8 text-parchment drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]" />
                        {hint && (
                          <span className="text-[10px] font-bold text-parchment text-center leading-tight px-1 [text-shadow:0_1px_3px_rgba(0,0,0,0.95),0_0_4px_rgba(0,0,0,0.95)]">
                            {hint}
                          </span>
                        )}
                      </div>
                    )}
                    {!locked && <div className="absolute inset-0 rounded-full hover:bg-gold/15 hover:ring-2 hover:ring-gold/50 transition" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {nextRegion && (
          <div className="rounded border border-panelborder/40 bg-black/25 p-4 text-center">
            {nextRegion.image ? (
              <p className="text-parchment/60 text-sm">
                Próxima região — <span className="text-gold font-bold">{nextRegion.name}</span> — libera no nível{' '}
                <span className="text-gold font-bold">{regionMinLevel(nextRegion)}</span>.
              </p>
            ) : (
              <p className="text-parchment/40 text-sm italic">Mais regiões chegando em futuras atualizações.</p>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}

// Regions render bottom-to-top (Iniciante at the bottom) via flex-col-reverse
// above, so the array itself stays in ascending region order here. Only
// regions the character has actually reached (by level) and that already
// have art are shown — the rest stay fully hidden, not just locked.
function firstHiddenIndex(level: number): number {
  for (let i = 0; i < REGIONS.length; i++) {
    const region = REGIONS[i];
    if (!region.image || level < regionMinLevel(region)) return i;
  }
  return REGIONS.length;
}
