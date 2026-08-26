import { useState } from 'react';
import { AbilityDef, Character, ClassId } from '../types/game';
import {
  classHasMechanics, getClassAttributeNotes, getClassCombinations, getClassMechanics,
  getClassSpecializations, getMechanicById,
} from '../lib/classMechanics';
import { CLASSES } from '../lib/classes';
import { Modal } from './Modal';
import { SmallButton } from './Button';
import { GlossaryText } from './Glossary';
import { formatGameNumber } from '../lib/format';

const CATEGORY_LABEL: Record<string, string> = {
  resource: 'Recurso', state: 'Estado', stack: 'Stack', mark: 'Marca', other: 'Mecânica',
};

// ── Generic "tap to explain" popup for a single mechanic ──
// Takes only a mechanicId and looks everything else up — never branches on
// which class or which mechanic it's showing. Reused by inline term
// highlights, the "MECÂNICAS:" chip row on a skill node, and any tappable
// combat-UI element (Fúria bar, Feridas badge, etc.).
export function MechanicQuickModal({ mechanicId, currentValue, maxValue, duration, detail, onClose }: {
  mechanicId: string; currentValue?: number; maxValue?: number; duration?: number; detail?: string; onClose: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const mechanic = getMechanicById(mechanicId);
  if (!mechanic) return null;
  const className = CLASSES[mechanic.classId]?.name ?? mechanic.classId;
  return (
    <Modal title={mechanic.name} onClose={onClose}>
      <span className="inline-block text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-panel2 text-parchment/60 border border-panelborder/60">
        {CATEGORY_LABEL[mechanic.category] ?? 'Mecânica'} exclusivo(a) do {className}
      </span>
      {currentValue !== undefined && (
        <p className="rounded border border-gold/25 bg-panel2/60 p-2">
          <span className="text-parchment/50">Estado atual: </span>
          <strong className="text-gold">{formatGameNumber(currentValue)}{maxValue !== undefined ? ` / ${formatGameNumber(maxValue)}` : ''}</strong>
          {duration !== undefined && duration > 0 && <span className="text-parchment/50"> · {duration} {duration === 1 ? 'ciclo restante' : 'ciclos restantes'}</span>}
          {detail && <span className="block text-xs text-parchment/60 mt-1">{detail}</span>}
        </p>
      )}
      <p className="text-parchment/80 whitespace-pre-line"><GlossaryText text={expanded ? mechanic.fullDescription : mechanic.shortDescription} /></p>
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="text-xs text-gold/80 hover:text-gold underline underline-offset-2"
        >
          Ver explicação completa
        </button>
      )}
    </Modal>
  );
}

// A small tappable pill naming one mechanic — tap opens MechanicQuickModal.
// Self-contained (owns its own open/closed state) so any call site can drop
// one in without wiring shared modal state.
export function MechanicChip({ mechanicId }: { mechanicId: string }) {
  const [open, setOpen] = useState(false);
  const mechanic = getMechanicById(mechanicId);
  if (!mechanic) return null;
  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/40 hover:bg-gold/25"
      >
        {mechanic.name}
      </button>
      {open && <MechanicQuickModal mechanicId={mechanicId} onClose={() => setOpen(false)} />}
    </>
  );
}

// Renders `children`'s ability/node desc text as a row of tappable term
// chips at the bottom, per the redesign spec's "MECÂNICAS:" block — never
// hardcodes which ids to show, just renders whatever the node declared.
export function MechanicRefsRow({ mechanicRefs }: { mechanicRefs?: string[] }) {
  if (!mechanicRefs || mechanicRefs.length === 0) return null;
  return (
    <div className="mt-1 pt-1 border-t border-panelborder/40">
      <p className="text-[10px] uppercase tracking-wide text-parchment/50 mb-1">Mecânicas:</p>
      <div className="flex flex-wrap gap-1.5">
        {mechanicRefs.map((id) => <MechanicChip key={id} mechanicId={id} />)}
      </div>
    </div>
  );
}

// Highlights, inline, any of `mechanicRefs`' names found in `text` as a
// tappable underlined term (spec section 2-B). Only ever matches names the
// caller explicitly declared via mechanicRefs — never scans free text
// against the whole mechanic database, so it can't misfire on an unrelated
// word that happens to share a mechanic's name.
export function MechanicText({ text, mechanicRefs, character, ability }: { text: string; mechanicRefs?: string[]; character?: Character; ability?: AbilityDef }) {
  const names = (mechanicRefs ?? [])
    .map((id) => getMechanicById(id))
    .filter((m): m is NonNullable<typeof m> => !!m)
    .sort((a, b) => b.name.length - a.name.length); // longest first, avoids partial-overlap matches
  if (names.length === 0) return <GlossaryText text={text} character={character} ability={ability} />;

  const pattern = new RegExp(`(${names.map((m) => m.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
  const parts = text.split(pattern);
  return (
    <>
      {parts.map((part, i) => {
        const match = names.find((m) => m.name === part);
        if (!match) return <GlossaryText key={i} text={part} character={character} ability={ability} />;
        return (
          <span key={i} className="inline-block">
            <MechanicUnderline mechanicId={match.id} label={part} />
          </span>
        );
      })}
    </>
  );
}

function MechanicUnderline({ mechanicId, label }: { mechanicId: string; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="underline decoration-dotted decoration-gold/70 underline-offset-2 text-gold/90 hover:text-gold"
      >
        {label}
      </button>
      {open && <MechanicQuickModal mechanicId={mechanicId} onClose={() => setOpen(false)} />}
    </>
  );
}

// The full "Mecânicas da Classe" panel — mechanics list, atributos
// importantes, especializações and combinações, all read generically from
// lib/classMechanics.ts. Works unmodified for any future class: it renders
// nothing extra when a section has no data for that class.
export function ClassMechanicsModal({ classId, onClose }: { classId: ClassId; onClose: () => void }) {
  const mechanics = getClassMechanics(classId);
  const attrNotes = getClassAttributeNotes(classId);
  const specs = getClassSpecializations(classId);
  const combos = getClassCombinations(classId);
  const className = CLASSES[classId]?.name ?? classId;
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setExpandedIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <Modal title={`Mecânicas do ${className}`} onClose={onClose}>
      {mechanics.length === 0 && <p className="text-parchment/60 italic text-xs">Esta classe ainda não tem mecânicas exclusivas documentadas.</p>}

      {mechanics.length > 0 && (
        <div className="space-y-2">
          {mechanics.map((m) => {
            const isOpen = expandedIds.has(m.id);
            return (
              <div key={m.id} className="rounded border border-panelborder/50 bg-panel2/60 p-2">
                <button type="button" onClick={() => toggle(m.id)} className="w-full flex items-center justify-between gap-2 text-left">
                  <span className="font-display text-gold text-xs font-bold uppercase tracking-wide">{m.name}</span>
                  <span className="text-parchment/40 text-xs shrink-0">{isOpen ? '▲' : '▼'}</span>
                </button>
                <p className="text-xs text-parchment/70 mt-1"><GlossaryText text={m.shortDescription} /></p>
                {isOpen && <p className="text-xs text-parchment/70 mt-2 whitespace-pre-line border-t border-panelborder/30 pt-2"><GlossaryText text={m.fullDescription} /></p>}
              </div>
            );
          })}
        </div>
      )}

      {attrNotes.length > 0 && (
        <div className="pt-2">
          <p className="font-display text-gold text-xs font-bold uppercase tracking-wide mb-1.5">Atributos importantes</p>
          <div className="space-y-1.5">
            {attrNotes.map((a) => (
              <p key={a.attribute} className="text-xs text-parchment/70">
                <span className="text-parchment font-bold"><GlossaryText text={a.label} /></span>
                <span className="text-parchment/50"> — {a.role}. </span>
                {a.description}
              </p>
            ))}
          </div>
        </div>
      )}

      {specs.length > 0 && (
        <div className="pt-2">
          <p className="font-display text-gold text-xs font-bold uppercase tracking-wide mb-1.5">Especializações</p>
          <div className="space-y-2">
            {specs.map((s) => (
              <div key={s.pathId} className="text-xs text-parchment/70">
                <p className="text-parchment font-bold uppercase tracking-wide text-[11px] mb-0.5">{s.pathId}</p>
                <p><span className="text-parchment/50">Identidade: </span>{s.identity}</p>
                <p><span className="text-parchment/50">Estilo: </span>{s.style}</p>
                <p><span className="text-parchment/50">Loop: </span>{s.loop}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {combos.length > 0 && (
        <div className="pt-2">
          <p className="font-display text-gold text-xs font-bold uppercase tracking-wide mb-1.5">Combinações de especializações</p>
          <div className="space-y-1">
            {combos.map((c) => (
              <p key={c.name} className="text-xs text-parchment/70">
                <span className="text-parchment font-bold">{c.name}</span>
                <span className="text-parchment/50"> — </span>
                {c.description}
              </p>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

// Header button for the skill tree screen — hidden entirely for a class with
// no documented mechanics yet, so it never appears as a dead end.
export function ClassMechanicsButton({ classId }: { classId: ClassId }) {
  const [open, setOpen] = useState(false);
  if (!classHasMechanics(classId)) return null;
  return (
    <>
      <SmallButton onClick={() => setOpen(true)} variant="ghost">Mecânicas da Classe</SmallButton>
      {open && <ClassMechanicsModal classId={classId} onClose={() => setOpen(false)} />}
    </>
  );
}
