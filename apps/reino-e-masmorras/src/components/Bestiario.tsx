import { useState } from 'react';
import { Character, CrowdControlKind, EnemyAbility, EnemyAbilityEffect, EnemyShape, EnemyTier, StatModStat, StatusEffectKind } from '../types/game';
import { TIERS, enemySpeedMult } from '../lib/enemies';
import { HUNTS } from '../lib/hunts';
import { enemySprite, hasOwnEnemyArt } from '../game/sprites';
import { Panel } from './Panel';
import { Modal } from './Modal';

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

// Small local label maps for the detail modal — deliberately not shared
// with DungeonPanel's own (private) copies, since this screen only ever
// needs to describe an ability's effect in prose, not render live combat
// badges/icons.
const STATUS_LABEL: Record<StatusEffectKind, string> = { poison: 'Veneno', burn: 'Queimadura', bleed: 'Sangramento', curse: 'Maldição' };
const CC_LABEL: Record<CrowdControlKind, string> = { stun: 'Atordoamento', sleep: 'Sono', silence: 'Silêncio' };
const STAT_MOD_LABEL: Record<StatModStat, string> = {
  atk: 'Ataque', def: 'Defesa', critChance: 'Crítico', critDmgMult: 'Dano Crítico', accuracy: 'Precisão',
  evasion: 'Evasão', dmgTakenPct: 'Dano Recebido', defPenPct: 'Penetração de Defesa', lifestealPct: 'Roubo de Vida',
};

function roundsText(n: number): string {
  return `${n} rodada${n === 1 ? '' : 's'}`;
}

// Prose description of what a skill actually does to the player — this IS
// the "debuff" half of the Bestiário's skill list; kept inline per-skill
// rather than as a separate list, since a debuff only means anything next
// to the skill that causes it.
function abilityEffectDesc(effect: EnemyAbilityEffect): string {
  switch (effect.kind) {
    case 'bigHit':
      return 'Golpe pesado — causa dano bem acima do ataque normal.';
    case 'lifestealHit':
      return `Ataque que rouba ${Math.round((effect.lifestealPct ?? 0) * 100)}% do dano causado como vida.`;
    case 'statusBite':
      return `Aplica ${STATUS_LABEL[effect.status!]} por ${roundsText(effect.statusRounds ?? 0)}.`;
    case 'controlSlam':
      return `Aplica ${CC_LABEL[effect.cc!]} por ${roundsText(effect.ccRounds ?? 0)}.`;
    case 'weakenNova': {
      const pct = effect.statModPct ?? 0;
      const verb = pct < 0 ? 'Reduz' : 'Aumenta';
      return `${verb} ${STAT_MOD_LABEL[effect.statMod!]} do jogador em ${Math.round(Math.abs(pct) * 100)}% por ${roundsText(effect.statModRounds ?? 0)}.`;
    }
    case 'stealGold':
      return `Rouba ${Math.round((effect.goldPct ?? 0) * 100)}% do seu ouro.`;
    default:
      return '';
  }
}

// Bosses gain extra skills as their fight escalates (BossPhase.extraAbilities)
// — those are still skills the boss uses, just not from round one, so they
// belong in the same list as its base abilities.
function abilitiesFor(t: EnemyTier): EnemyAbility[] {
  const base = t.abilities ?? [];
  const phaseAbilities = (t.phases ?? []).flatMap((p) => p.extraAbilities ?? []);
  return [...base, ...phaseAbilities];
}

function speedLabel(shape: EnemyShape): string {
  const mult = enemySpeedMult(shape);
  const pct = Math.round(mult * 100);
  if (mult >= 1.05) return `Rápida (${pct}%)`;
  if (mult <= 0.95) return `Lenta (${pct}%)`;
  return `Normal (${pct}%)`;
}

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-xs border-b border-panelborder/20 py-1.5 last:border-0">
      <span className="text-parchment/60">{label}</span>
      <span className="text-parchment font-bold tabular-nums">{value}</span>
    </div>
  );
}

// The detail view is deliberately restricted to combat-relevant stats a
// player would want before engaging this enemy again — HP/ATK/ATK
// Mágico/Velocidade and its skills (with the debuffs they inflict). No
// DEF/MDEF, evasion, or gold/xp reward here on purpose.
function EnemyDetailModal({ tier, onClose }: { tier: EnemyTier; onClose: () => void }) {
  const abilities = abilitiesFor(tier);
  return (
    <Modal title={tier.name} onClose={onClose}>
      <div className="space-y-0.5 mb-3">
        <StatRow label="HP" value={tier.hp} />
        <StatRow label="Ataque" value={tier.atk} />
        {!!tier.matk && <StatRow label="Ataque Mágico" value={tier.matk} />}
        <StatRow label="Velocidade" value={speedLabel(tier.shape)} />
      </div>
      <div>
        <h4 className="font-display text-[11px] uppercase tracking-wide text-gold/80 mb-1.5">Habilidades</h4>
        {abilities.length === 0 ? (
          <p className="text-parchment/40 text-xs">Nenhuma habilidade especial — apenas ataques básicos.</p>
        ) : (
          <div className="space-y-2">
            {abilities.map((a) => (
              <div key={a.id} className="rounded border border-panelborder/30 bg-black/20 p-2">
                <span className="text-xs font-bold text-parchment block mb-0.5">{a.name}</span>
                <span className="text-[11px] text-parchment/60">{abilityEffectDesc(a.effect)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

function EntryCard({ tier, kills, onSelect }: { tier: EnemyTier; kills: number; onSelect: (t: EnemyTier) => void }) {
  const { shape, name } = tier;
  const discovered = kills > 0;
  const tierLabel = tierFor(kills);
  const hasArt = hasOwnEnemyArt(shape);
  return (
    <div
      onClick={discovered ? () => onSelect(tier) : undefined}
      className={`rounded border p-2.5 flex flex-col items-center gap-1.5 text-center ${
        discovered ? 'border-panelborder/40 bg-black/20 cursor-pointer hover:border-gold/50 hover:bg-black/30 transition-colors' : 'border-panelborder/20 bg-black/10'
      }`}
    >
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
          {tierLabel && <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: tierLabel[1] }}>{tierLabel[0]}</span>}
        </>
      ) : (
        <span className="text-[11px] text-parchment/30">Não encontrado</span>
      )}
    </div>
  );
}

export function Bestiario({ character }: { character: Character }) {
  const [selected, setSelected] = useState<EnemyTier | null>(null);
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
          {regulars.map((t) => <EntryCard key={t.shape} tier={t} kills={kills[t.shape] ?? 0} onSelect={setSelected} />)}
        </div>
      </Section>

      <Section title="Chefes">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {bosses.map((t) => <EntryCard key={t.shape} tier={t} kills={kills[t.shape] ?? 0} onSelect={setSelected} />)}
        </div>
      </Section>

      <Section title="Alvos de Caçada">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {huntBosses.map((t) => <EntryCard key={t.shape} tier={t} kills={kills[t.shape] ?? 0} onSelect={setSelected} />)}
        </div>
      </Section>

      {selected && <EnemyDetailModal tier={selected} onClose={() => setSelected(null)} />}
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
