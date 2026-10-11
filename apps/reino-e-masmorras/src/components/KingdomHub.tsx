import { useEffect, useRef, useState, type RefObject } from 'react';
import { Character, Section } from '../types/game';
import townImg from '../assets/reino-hub.webp';
import iconPersonagem from '../assets/shortcuts/personagem.webp';
import iconHabilidades from '../assets/shortcuts/habilidades.webp';
import iconBestiario from '../assets/shortcuts/bestiario.webp';
import iconTitulos from '../assets/shortcuts/titulos.webp';
import iconCacadas from '../assets/shortcuts/cacadas.webp';
import iconColocacao from '../assets/shortcuts/colocacao.webp';
import iconPrestigio from '../assets/shortcuts/prestigio.webp';

interface Props {
  character: Character;
  onNavigate: (s: Section) => void;
  onOpenFerreiro: () => void;
  onOpenMercador: () => void;
  onOpenBau: () => void;
}

// Personagem/Habilidades/Bestiário/Títulos/Caçadas/Colocação/Loja de
// Prestígio aren't "places" — they're list/grid screens, not buildings — so
// they don't get a spot painted into the hub scene like Forja/Mercador/Baú
// do. Instead they're quick-access icons pinned to the VIEWPORT (not the
// scrolled image — see the fixed bottom-docked row below), reusing the same circular
// ability-slot frame the combat bar uses so they read as part of this
// game's UI instead of a sticker glued onto the artwork.
// `attention` mirrors the old Sidebar nav-item glow (gold = skill points,
// sky = attribute points waiting to be spent) — computed per-render below
// since it depends on live character state, not part of this static list.
const SHORTCUTS: { id: Section; label: string; icon: string }[] = [
  { id: 'character', label: 'Personagem', icon: iconPersonagem },
  { id: 'skills', label: 'Habilidades', icon: iconHabilidades },
  { id: 'bestiary', label: 'Bestiário', icon: iconBestiario },
  { id: 'titles', label: 'Títulos', icon: iconTitulos },
  { id: 'hunts', label: 'Caçadas', icon: iconCacadas },
  { id: 'highscore', label: 'Colocação', icon: iconColocacao },
  { id: 'prestige-shop', label: 'Loja de Prestígio', icon: iconPrestigio },
];

// Coordinates measured directly on the generated hub art (see
// KIT-DE-ARTE.md's "Reino — Cena Única") — %-based, same convention as
// lib/dungeonMap.ts's region markers, so they stay aligned if the image is
// regenerated at a different resolution. Each box is sized to cover both a
// building and its baked-in name plaque, since (unlike the old horizontal
// Construções art) this scene already labels every building — no need to
// render a redundant name tag on the button itself.
// v3 (9:16 portrait, 941×1672) — measured fresh after regenerating the art
// taller (see KIT-DE-ARTE.md's "Reino — Cena Única (v3)") to match a
// typical phone's aspect ratio and close the empty-space-above-the-icons
// gap the v2 (more square, 1122×1402) art left on most devices. Same
// composition as v2, just stretched vertically: Portal up top, Baú/Taverna
// flanking the middle, Forja/Mercador down at the bottom.
const BUILDINGS: { id: string; xPct: number; yPct: number; wPct: number; hPct: number }[] = [
  { id: 'portal', xPct: 50, yPct: 27, wPct: 30, hPct: 26 },
  { id: 'bau', xPct: 18, yPct: 47, wPct: 36, hPct: 38 },
  { id: 'taverna', xPct: 82, yPct: 46, wPct: 36, hPct: 36 },
  { id: 'forja', xPct: 16, yPct: 84, wPct: 32, hPct: 32 },
  { id: 'mercador', xPct: 82, yPct: 87, wPct: 36, hPct: 26 },
];

// Warm flickering glow dots dropped over the scene's own light sources —
// pure CSS (see index.css's emberFlicker keyframe), no new art. Trimmed
// down to just the two that matter most: the portal's blue swirl and the
// courtyard fountain's fire — the torches/forge/lantern glows from the
// earlier art version read as too busy once there were this many going at
// once, per user feedback. Coordinates re-measured by centroid-averaging
// the actual blue/orange pixels in the art (not eyeballed off a grid like
// the rest of this file) after the first pass landed visibly off-center.
const EMBERS: { xPct: number; yPct: number; size: number; color: string; delay: number }[] = [
  { xPct: 49.8, yPct: 25, size: 70, color: 'rgba(90,190,255,0.85)', delay: 0.9 },
  { xPct: 50, yPct: 63, size: 46, color: 'rgba(255,140,40,0.95)', delay: 0.3 },
];

// reino-hub.webp's own intrinsic size (see KIT-DE-ARTE.md's "Reino — Cena
// Única (v4)") — needed to figure out how much of the image object-fit:
// cover below crops off on a given screen, so the building/ember/label
// percentages (all measured against the FULL original image) can be
// remapped onto the actually-visible slice of it.
const IMAGE_ASPECT = 768 / 1376;

// Cover fills the stage completely (no gap below the art, no scrolling) by
// scaling the image up until it overflows one axis, then cropping that
// axis — width on a typical tall phone, height on a short/wide viewport.
// Every %-coordinate in BUILDINGS/EMBERS assumes the FULL image is
// visible, so once cover crops off a slice we have to remap: a point at
// the crop boundary should render at 0%/100% of the stage, not at its
// original (now off-screen) percentage.
function useCoverRange(stageRef: RefObject<HTMLDivElement | null>) {
  const [range, setRange] = useState({ x0: 0, x1: 100, y0: 0, y1: 100 });
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      const boxAspect = w / h;
      if (boxAspect < IMAGE_ASPECT) {
        // Stage is taller (relative to its width) than the art — width
        // overflows and gets cropped evenly off both sides (object-position
        // centers horizontally).
        const visibleWidthPct = (boxAspect / IMAGE_ASPECT) * 100;
        const half = visibleWidthPct / 2;
        setRange({ x0: 50 - half, x1: 50 + half, y0: 0, y1: 100 });
      } else {
        // Stage is wider (relative to its height) than the art — height
        // overflows; cropped off the bottom only (object-position anchors
        // to the top, so the portal/sky stay in frame).
        const visibleHeightPct = (IMAGE_ASPECT / boxAspect) * 100;
        setRange({ x0: 0, x1: 100, y0: 0, y1: visibleHeightPct });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [stageRef]);
  return range;
}
function mapPct(value: number, r0: number, r1: number): number {
  return ((value - r0) / (r1 - r0)) * 100;
}
function mapSize(size: number, r0: number, r1: number): number {
  return (size / (r1 - r0)) * 100;
}

export function KingdomHub({ character, onNavigate, onOpenFerreiro, onOpenMercador, onOpenBau }: Props) {
  const [tavernaHint, setTavernaHint] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const range = useCoverRange(stageRef);
  const left = (pct: number) => mapPct(pct, range.x0, range.x1);
  const top = (pct: number) => mapPct(pct, range.y0, range.y1);
  const width = (pct: number) => mapSize(pct, range.x0, range.x1);
  const height = (pct: number) => mapSize(pct, range.y0, range.y1);
  const portal = BUILDINGS.find((b) => b.id === 'portal')!;
  const taverna = BUILDINGS.find((b) => b.id === 'taverna')!;
  const attentionBySection: Partial<Record<Section, 'gold' | 'sky'>> = {
    character: character.attributePoints > 0 ? 'sky' : undefined,
    skills: character.skillPoints > 0 ? 'gold' : undefined,
  };

  const openActions: Record<string, () => void> = {
    portal: () => onNavigate('dungeon-select'),
    forja: onOpenFerreiro,
    mercador: onOpenMercador,
    bau: onOpenBau,
    taverna: () => {
      setTavernaHint(true);
      window.setTimeout(() => setTavernaHint(false), 2200);
    },
  };
  const titles: Record<string, string> = {
    portal: 'Partir em expedição',
    forja: 'Visitar a Forja',
    mercador: 'Visitar o Mercador',
    bau: 'Abrir o Baú de Armazém',
    taverna: 'Taverna — em breve',
  };

  return (
    <>
      {/* No Panel chrome here on purpose — this is the home screen, so the
          art fills edge-to-edge up to the app's own wooden ScreenFrame
          border instead of sitting inside another parchment panel with its
          own title bar and padding. */}
      <div className="relative h-full overflow-hidden">
        {/* Shortcut row lives up here, right under TopBar, instead of docked
            to the bottom of the viewport — the bottom of the art is where
            Forja/Mercador's own tap zones sit, and the two kept fighting for
            the same thumb space. Absolute (not fixed) because this sits
            inside the hub's own container, which already starts right below
            TopBar in the page's normal flow — no viewport-offset math needed. */}
        <div
          className="absolute top-0 inset-x-0 z-20 flex flex-row justify-center items-start gap-1 pt-2 pb-3"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.75), rgba(0,0,0,0.35) 60%, transparent)' }}
        >
          {SHORTCUTS.map((s) => {
            const attention = attentionBySection[s.id];
            return (
              <button
                key={s.id}
                onClick={() => onNavigate(s.id)}
                title={s.label}
                className="flex flex-col items-center w-12 group"
              >
                <span className="relative block w-10 h-10 shrink-0">
                  {attention && (
                    <span
                      aria-hidden
                      className="absolute -inset-2 rounded-full pointer-events-none"
                      style={{
                        background: `radial-gradient(circle, ${attention === 'sky' ? 'rgba(56,189,248,0.65)' : 'rgba(212,175,55,0.65)'} 0%, transparent 72%)`,
                        filter: 'blur(4px)',
                        animation: 'navAttentionPulse 1.8s ease-in-out infinite',
                      }}
                    />
                  )}
                  <img
                    src={s.icon}
                    alt=""
                    className="absolute inset-0 w-full h-full object-contain transition icon-hover-target group-active:scale-95"
                    draggable={false}
                  />
                </span>
                <span className="mt-0.5 text-[8px] leading-tight font-bold text-center text-gold [text-shadow:0_1px_2px_rgba(0,0,0,0.95)]">
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* The stage fills the full available height (h-full's own
            container, edge to edge) instead of sizing to the image's own
            h-auto height — the previous version left a black gap below the
            art (and below that, an oversized wooden ScreenFrame border)
            whenever a device's aspect ratio was taller than the art's own
            9:16, since the image never grew past its natural height. object-
            cover fills the stage completely (cropping the sides evenly on a
            typical tall phone, or the bottom on a short/wide viewport) —
            useCoverRange (above) works out exactly how much gets cropped so
            every %-positioned element below can be remapped from "percent of
            the full original art" to "percent of the actually-visible
            slice", instead of drifting off past the crop boundary. */}
        <div ref={stageRef} className="absolute inset-0 overflow-hidden">
          <img
            src={townImg}
            alt="Reino"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ imageRendering: 'pixelated', objectPosition: 'center top' }}
            draggable={false}
          />

          {EMBERS.map((e, i) => (
            <div
              key={i}
              aria-hidden
              className="absolute rounded-full pointer-events-none"
              style={{
                left: `${left(e.xPct)}%`,
                top: `${top(e.yPct)}%`,
                width: e.size,
                height: e.size,
                transform: 'translate(-50%, -50%)',
                background: `radial-gradient(circle, ${e.color} 0%, transparent 70%)`,
                filter: 'blur(3px)',
                animation: 'emberFlicker 2.4s ease-in-out infinite',
                animationDelay: `${e.delay}s`,
              }}
            />
          ))}

          {BUILDINGS.map((b) => (
            <button
              key={b.id}
              onClick={openActions[b.id]}
              title={titles[b.id]}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded transition building-hover-target"
              style={{ left: `${left(b.xPct)}%`, top: `${top(b.yPct)}%`, width: `${width(b.wPct)}%`, height: `${height(b.hPct)}%` }}
            />
          ))}

          {/* Only the portal lacks a name baked into the art the way every
              building's own signpost already has one — plain gold text, no
              box/container around it, matching the look every other label in
              this scene already uses. */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none font-display font-bold text-gold text-lg sm:text-xl tracking-wide [text-shadow:0_0_8px_rgba(0,0,0,0.95),0_0_16px_rgba(0,0,0,0.8),0_2px_0_rgba(0,0,0,0.95)]"
            style={{ left: `${left(portal.xPct)}%`, top: `${top(portal.yPct - 11)}%` }}
          >
            Portal
          </div>

          {tavernaHint && (
            <div
              className="absolute -translate-x-1/2 -translate-y-full rounded border border-gold/50 bg-black/85 px-3 py-1.5 text-xs font-bold text-gold whitespace-nowrap pointer-events-none [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]"
              style={{ left: `${left(taverna.xPct)}%`, top: `${top(taverna.yPct - 8)}%` }}
            >
              Em construção — chega em breve
            </div>
          )}
        </div>
      </div>
    </>
  );
}
