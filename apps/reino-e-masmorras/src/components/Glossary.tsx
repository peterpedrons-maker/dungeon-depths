import { useState } from 'react';
import { AbilityDef, Character } from '../types/game';
import { computeCombatStats, effectiveMaxHp } from '../lib/combatStats';
import { CLASSES } from '../lib/classes';
import { attrTotal } from '../lib/combatConditions';
import { clericBaseHp } from '../lib/clerigo';
import { formatGameMultiplier, formatGameNumber, formatGamePercent } from '../lib/format';
import { GLOSSARY, getGlossaryEntry } from '../lib/glossary';
import { Modal } from './Modal';

interface GlossaryContext {
  character?: Character;
  ability?: AbilityDef;
}

function currentGlossaryValue(id: string, context: GlossaryContext): string | null {
  const ch = context.character;
  if (!ch) return null;
  const stats = computeCombatStats(ch);
  const values: Record<string, string> = {
    atk: formatGameNumber(stats.atk), matk: formatGameNumber(stats.matk),
    def: formatGameNumber(stats.def), mdef: formatGameNumber(stats.mdef),
    hp: `${formatGameNumber(ch.hp)} / ${formatGameNumber(effectiveMaxHp(ch))}`,
    'base-hp': formatGameNumber(clericBaseHp(CLASSES[ch.classId].baseHp, ch.level)),
    'max-hp': formatGameNumber(effectiveMaxHp(ch)), accuracy: formatGamePercent(stats.accuracy),
    evasion: formatGamePercent(stats.evasion), crit: formatGamePercent(stats.critChance),
    'crit-dmg': formatGameMultiplier(stats.critDmgMult), block: formatGamePercent(stats.blockChance),
    tenacity: formatGamePercent(stats.tenacityPct), speed: formatGamePercent(stats.speedPct),
    support: formatGamePercent(stats.supportPowerPct), lifesteal: formatGamePercent(stats.lifestealPct),
    cooldown: formatGamePercent(stats.cooldownReductionPct),
    str: formatGameNumber(attrTotal(ch, 'str')), dex: formatGameNumber(attrTotal(ch, 'dex')),
    agi: formatGameNumber(attrTotal(ch, 'agi')), vit: formatGameNumber(attrTotal(ch, 'vit')),
    int: formatGameNumber(attrTotal(ch, 'int')), wis: formatGameNumber(attrTotal(ch, 'wis')),
    luk: formatGameNumber(attrTotal(ch, 'luk')),
  };
  return values[id] ?? null;
}

function GlossaryModal({ entryId, context, onClose }: { entryId: string; context: GlossaryContext; onClose: () => void }) {
  const entry = getGlossaryEntry(entryId);
  if (!entry) return null;
  const current = currentGlossaryValue(entry.id, context);
  const mult = context.ability?.effect.dmgMult;
  const stats = context.character ? computeCombatStats(context.character) : null;
  const baseEstimate = mult && stats && (entry.id === 'atk' || entry.id === 'matk')
    ? (entry.id === 'atk' ? stats.atk : stats.matk) * mult : null;
  return (
    <Modal title={entry.title} onClose={onClose}>
      <p className="text-parchment/80">{entry.shortDescription}</p>
      {current && <p className="rounded border border-gold/25 bg-panel2/60 p-2"><span className="text-parchment/50">Valor atual: </span><strong className="text-gold">{current}</strong></p>}
      <p className="text-xs text-parchment/65">{entry.fullDescription}</p>
      {baseEstimate !== null && mult && (
        <div className="rounded border border-panelborder/60 bg-black/20 p-2 text-xs">
          <p><span className="text-parchment/50">Nesta habilidade: </span>{formatGameMultiplier(mult)}</p>
          <p><span className="text-parchment/50">Estimativa bruta: </span>{formatGameNumber(baseEstimate)} antes de defesa, crítico e modificadores.</p>
        </div>
      )}
    </Modal>
  );
}

function GlossaryTerm({ entryId, label, context }: { entryId: string; label: string; context: GlossaryContext }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" onClick={(event) => { event.stopPropagation(); setOpen(true); }} className="underline decoration-dotted decoration-sky-400/60 underline-offset-2 hover:text-sky-300">{label}</button>
    {open && <GlossaryModal entryId={entryId} context={context} onClose={() => setOpen(false)} />}
  </>;
}

export function GlossaryText({ text, character, ability }: { text: string; character?: Character; ability?: AbilityDef }) {
  const aliases = GLOSSARY.flatMap((entry) => entry.aliases.map((alias) => ({ alias, id: entry.id }))).sort((a, b) => b.alias.length - a.alias.length);
  const pattern = new RegExp(`(${aliases.map(({ alias }) => alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  return <>{text.split(pattern).map((part, index) => {
    const match = aliases.find(({ alias }) => alias.toLocaleLowerCase('pt-BR') === part.toLocaleLowerCase('pt-BR'));
    return match ? <GlossaryTerm key={index} entryId={match.id} label={part} context={{ character, ability }} /> : <span key={index}>{part}</span>;
  })}</>;
}
