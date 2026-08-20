import { Character, EnemyShape } from '../types/game';
import { TIERS } from '../lib/enemies';
import { HUNTS } from '../lib/hunts';
import { enemySprite, hasOwnEnemyArt } from '../game/sprites';
import { Panel } from './Panel';

const HUNT_SHAPES = new Set(HUNTS.map((h) => h.boss));

// Kill-count milestones — purely a flavor label, no mechanical effect,
// same spirit as the rarity tiers on equipment.
const TIER_LABELS: [number, string, string][] = [
  [200, 'Exterminador', '#e0a030'],
  [50, 'Predador', '#9b4fc9'],
  [10, 'Caçador', '#3f7ab8'],
  [1, 'Avistado', '#4f9d4f'],
];
function tierFor(kills: number): [string, string] | null {
  for (const [threshold, label, color] of TIER_LABELS) {
    if (kills >= threshold) return [label, color];
  }
  return null;
}

function EntryCard({ shape, name, kills }: { shape: EnemyShape; name: string; kills: number }) {
  const discovered = kills > 0;
  const tier = tierFor(kills);
  const hasArt = hasOwnEnemyArt(shape);
  return (
    <div className={`rounded border p-2.5 flex flex-col items-center gap-1.5 text-center ${
      discovered ? 'border-panelborder/40 bg-black/20' : 'border-panelborder/20 bg-black/10'
    }`}>
      {hasArt ? (
        <img
          src={enemySprite(shape).image.src}
          alt=""
          className={`h-14 w-auto object-contain ${discovered ? '' : 'grayscale brightness-[0.35]'}`}
          style={{ imageRendering: 'pixelated' }}
        />
      ) : (
        // No dedicated art yet — a reused/placeholder sprite here would
        // otherwise look like a duplicate of some unrelated entry's
        // picture, which reads as a bug rather than "art not in yet".
        <div className={`h-14 w-14 flex items-center justify-center font-display text-2xl font-bold ${
          discovered ? 'text-parchment/40' : 'text-parchment/20'
        }`}>
          ?
        </div>
      )}
      <span className={`text-xs font-bold leading-tight ${discovered ? 'text-parchment' : 'text-parchment/30'}`}>
        {discovered ? name : '???'}
      </span>
      {discovered ? (
        <>
          <span className="text-[11px] text-parchment/50 tabular-nums">{kills} abatidos</span>
          {tier && <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: tier[1] }}>{tier[0]}</span>}
        </>
      ) : (
        <span className="text-[11px] text-parchment/30">Não encontrado</span>
      )}
    </div>
  );
}

export function Bestiario({ character }: { character: Character }) {
  const kills = character.kills ?? {};
  const regulars = TIERS.filter((t) => !t.isBoss);
  const bosses = TIERS.filter((t) => t.isBoss && !HUNT_SHAPES.has(t.shape));
  const huntBosses = TIERS.filter((t) => HUNT_SHAPES.has(t.shape));
  const discoveredCount = TIERS.filter((t) => (kills[t.shape] ?? 0) > 0).length;

  return (
    <Panel title="Bestiário">
      <p className="text-parchment/60 text-sm mb-1">
        Registro de todas as criaturas já enfrentadas. Continue abatendo para descobrir seus nomes e avançar de patamar.
      </p>
      <p className="text-gold/80 text-xs font-bold mb-4">{discoveredCount}/{TIERS.length} descobertas</p>

      <Section title="Inimigos">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {regulars.map((t) => <EntryCard key={t.shape} shape={t.shape} name={t.name} kills={kills[t.shape] ?? 0} />)}
        </div>
      </Section>

      <Section title="Chefes">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {bosses.map((t) => <EntryCard key={t.shape} shape={t.shape} name={t.name} kills={kills[t.shape] ?? 0} />)}
        </div>
      </Section>

      <Section title="Alvos de Caçada">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {huntBosses.map((t) => <EntryCard key={t.shape} shape={t.shape} name={t.name} kills={kills[t.shape] ?? 0} />)}
        </div>
      </Section>
    </Panel>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 last:mb-0">
      <h3 className="font-display text-xs uppercase tracking-[0.15em] text-gold/80 mb-2">{title}</h3>
      {children}
    </div>
  );
}
