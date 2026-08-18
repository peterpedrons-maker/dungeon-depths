import { useState } from 'react';
import { Character } from '../types/game';
import { MAX_CHARACTER_SLOTS } from '../lib/storage';
import { CLASSES } from '../lib/classes';
import { SmallButton } from './Button';
import { Modal } from './Modal';
import { IconEmptySlot } from './icons';
import gameLogo from '../assets/reino-masmorras-logo.webp';

interface Props {
  slots: (Character | null)[]; // length MAX_CHARACTER_SLOTS — index is the slot number
  onSelect: (slot: number) => void;
  onCreateNew: (slot: number) => void;
  onDelete: (slot: number) => void;
}

// The account-level hub shown right after login, before any character is
// active — up to MAX_CHARACTER_SLOTS heroes per account, each an
// independent save (own class, level, inventory, dungeon progress...).
// Picking an empty slot goes straight to CharacterCreation for that slot;
// picking a filled one loads it and enters the kingdom.
export function CharacterSelect({ slots, onSelect, onCreateNew, onDelete }: Props) {
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const deleteTarget = confirmDelete !== null ? slots[confirmDelete] : null;

  return (
    <div className="flex-1 flex flex-col items-center gap-5 px-4 py-6 bg-nightsky overflow-y-auto">
      <img src={gameLogo} alt="Reino & Masmorras" className="w-40 sm:w-52 max-w-full" draggable={false} />
      <div className="text-center -mt-2">
        <h2 className="font-display text-2xl md:text-3xl text-gold tracking-[0.1em] uppercase [text-shadow:0_2px_0_rgba(0,0,0,0.8)]">
          Seus Heróis
        </h2>
        <p className="text-xs text-parchment/50 max-w-md mt-1">
          Escolha um herói para continuar a jornada, ou crie um novo num espaço vazio.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 w-full max-w-3xl">
        {Array.from({ length: MAX_CHARACTER_SLOTS }, (_, slot) => {
          const c = slots[slot];
          if (c) {
            const cls = CLASSES[c.classId];
            return (
              <div
                key={slot}
                className={`relative flex flex-col items-center gap-1.5 p-3 pt-4 rounded border bg-black/30 ${
                  c.ironMode ? 'border-crimson/60' : 'border-panelborder'
                }`}
              >
                <button
                  onClick={() => setConfirmDelete(slot)}
                  className="absolute top-1 right-1.5 text-parchment/30 hover:text-red-400 text-sm leading-none px-1"
                  aria-label={`Excluir ${c.name}`}
                >
                  ×
                </button>
                {c.ironMode && (
                  <span className="absolute top-1 left-1.5 text-crimson text-[10px] font-bold" title="Modo Ferro">☠</span>
                )}
                <span className="w-10 h-10 rounded-full ring-2 ring-gold/50 shrink-0" style={{ background: cls.color }} />
                <span className="text-parchment font-bold text-sm truncate w-full text-center">{c.name}</span>
                <span className="text-parchment/50 text-[11px]">{cls.name} · Nv.{c.level}</span>
                <SmallButton onClick={() => onSelect(slot)}>Continuar</SmallButton>
              </div>
            );
          }
          return (
            <button
              key={slot}
              onClick={() => onCreateNew(slot)}
              className="flex flex-col items-center justify-center gap-2 p-3 min-h-[132px] rounded border border-dashed border-panelborder text-parchment/30 hover:text-gold hover:border-gold/50 transition"
            >
              <IconEmptySlot className="w-8 h-8" />
              <span className="text-xs">Criar Personagem</span>
            </button>
          );
        })}
      </div>

      {deleteTarget && confirmDelete !== null && (
        <Modal
          title="Excluir Herói?"
          onClose={() => setConfirmDelete(null)}
          footer={
            <>
              <SmallButton onClick={() => setConfirmDelete(null)} variant="ghost">Cancelar</SmallButton>
              <SmallButton onClick={() => { onDelete(confirmDelete); setConfirmDelete(null); }}>Excluir</SmallButton>
            </>
          }
        >
          <p>Isso apaga permanentemente <strong>{deleteTarget.name}</strong> e todo o progresso dele. Essa ação não pode ser desfeita.</p>
        </Modal>
      )}
    </div>
  );
}
