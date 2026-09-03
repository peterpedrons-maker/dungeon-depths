import { useState } from 'react';
import { Character, Section } from '../types/game';
import townImg from '../assets/reino-hub.webp';
import slotFrame from '../assets/slot-habilidade.webp';
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
// v2 (compact courtyard, 1122×1402) — measured fresh after the composition
// changed from a tall winding trail to a plaza viewed from above: Portal
// dead-center-back, Baú/Forja down the left side, Taverna/Mercador down the
// right side.
const BUILDINGS: { id: string; xPct: number; yPct: number; wPct: number; hPct: number }[] = [
  { id: 'portal', xPct: 49.5, yPct: 30.0, wPct: 27, hPct: 33 },
  { id: 'bau', xPct: 14.7, yPct: 33.5, wPct: 29, hPct: 26 },
  { id: 'taverna', xPct: 85.6, yPct: 34.2, wPct: 29, hPct: 25 },
  { id: 'forja', xPct: 15.2, yPct: 72.8, wPct: 34, hPct: 35 },
  { id: 'mercador', xPct: 82.9, yPct: 74.9, wPct: 34, hPct: 29 },
];

// Warm flickering glow dots dropped over the scene's own light sources
// (torches, the forge's mouth, the courtyard brazier, the portal's swirl) —
// pure CSS (see index.css's emberFlicker keyframe), no new art. Each gets
// its own animation-delay so they don't pulse in lockstep, which is what
// would give the trick away immediately.
const EMBERS: { xPct: number; yPct: number; size: number; color: string; delay: number }[] = [
  { xPct: 49.5, yPct: 28.5, size: 60, color: 'rgba(90,190,255,0.85)', delay: 0.9 },
  { xPct: 37.4, yPct: 30.7, size: 28, color: 'rgba(255,160,60,0.9)', delay: 0 },
  { xPct: 63.7, yPct: 30.7, size: 28, color: 'rgba(255,160,60,0.9)', delay: 0.5 },
  { xPct: 16.9, yPct: 42.4, size: 30, color: 'rgba(255,160,60,0.9)', delay: 1.1 },
  { xPct: 83.3, yPct: 42.4, size: 30, color: 'rgba(255,160,60,0.9)', delay: 1.6 },
  { xPct: 49.5, yPct: 57.1, size: 42, color: 'rgba(255,140,40,0.95)', delay: 0.3 },
  { xPct: 20.1, yPct: 74.5, size: 40, color: 'rgba(255,110,40,0.95)', delay: 0.7 },
  { xPct: 92.3, yPct: 74.5, size: 26, color: 'rgba(255,170,70,0.9)', delay: 1.3 },
];

export function KingdomHub({ character, onNavigate, onOpenFerreiro, onOpenMercador, onOpenBau }: Props) {
  const [tavernaHint, setTavernaHint] = useState(false);
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
          own title bar and padding.
          Outer wrapper fills `main`'s exact height (the space between the
          TopBar and the viewport bottom) and vertically CENTERS the art —
          the current art's aspect ratio doesn't perfectly match every phone's
          available space, so on a device where it renders shorter than that
          space, the leftover splits evenly above/below instead of dumping
          entirely below the art as a single gap in front of the icon bar
          (see KIT-DE-ARTE.md's "Reino — Cena Única (v3)" for the follow-up
          art request that shrinks this leftover further). */}
      <div className="relative h-full flex flex-col items-center justify-center overflow-hidden">
        <div className="relative w-full shrink-0">
          <img
            src={townImg}
            alt="Reino"
            className="w-full h-auto block"
            style={{ imageRendering: 'pixelated' }}
            draggable={false}
          />

          {EMBERS.map((e, i) => (
            <div
              key={i}
              aria-hidden
              className="absolute rounded-full pointer-events-none"
              style={{
                left: `${e.xPct}%`,
                top: `${e.yPct}%`,
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
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded transition hover:bg-gold/10 hover:ring-2 hover:ring-gold/40"
              style={{ left: `${b.xPct}%`, top: `${b.yPct}%`, width: `${b.wPct}%`, height: `${b.hPct}%` }}
            />
          ))}

          {tavernaHint && (
            <div
              className="absolute -translate-x-1/2 -translate-y-full rounded border border-gold/50 bg-black/85 px-3 py-1.5 text-xs font-bold text-gold whitespace-nowrap pointer-events-none [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]"
              style={{ left: `${BUILDINGS.find((b) => b.id === 'taverna')!.xPct}%`, top: `${BUILDINGS.find((b) => b.id === 'taverna')!.yPct - 8}%` }}
            >
              Em construção — chega em breve
            </div>
          )}
        </div>
      </div>

      {/* Fixed to the VIEWPORT, docked along the bottom edge and centered —
          a row instead of the earlier left-side column, sitting right where
          a thumb naturally rests. Fixed positioning (not part of the hub
          image's own flow) means this stays put regardless of image size.
          items-start (not items-end): "Loja de Prestígio" is the only label
          that wraps to 2 lines, which makes its button taller overall — with
          items-end that extra height pushed its icon circle up relative to
          the other 6 buttons' single-line siblings. items-start pins every
          icon circle to the same top edge regardless of label height. */}
      <div
        className="fixed bottom-0 inset-x-0 z-20 flex flex-row justify-center items-start gap-1 pt-3"
        style={{
          paddingBottom: 'max(4px, env(safe-area-inset-bottom))',
          background: 'linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0.35) 60%, transparent)',
        }}
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
              <span
                className="relative block w-10 h-10 shrink-0 rounded-full"
                style={{ animation: attention ? `${attention === 'sky' ? 'navAttentionGlowSky' : 'navAttentionGlow'} 1.8s ease-in-out infinite` : undefined }}
              >
                <span className="absolute inset-[6px] rounded-full bg-[#19120c] shadow-[inset_0_0_6px_rgba(0,0,0,0.8)]" />
                <img src={s.icon} alt="" className="absolute inset-[8px] w-[calc(100%-16px)] h-[calc(100%-16px)] object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" draggable={false} />
                <img src={slotFrame} alt="" className="absolute inset-0 w-full h-full transition group-hover:brightness-125" draggable={false} />
              </span>
              <span className="mt-0.5 text-[8px] leading-tight font-bold text-center text-gold [text-shadow:0_1px_2px_rgba(0,0,0,0.95)]">
                {s.label}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
