import { Character, DungeonDef } from '../types/game';
import { MAX_EQUIPPED_ABILITIES, getUnlockedAbilities, getEquippedAbilities } from '../lib/skills';
import { MAX_POTIONS, POTION_THRESHOLD_OPTIONS } from '../lib/consumables';
import { Modal } from './Modal';
import { SmallButton } from './Button';
import { IconActive } from './icons';
import skillFrame from '../assets/slot-habilidade.webp';

interface Props {
  character: Character;
  dungeon: DungeonDef;
  onEquipAbility: (abilityId: string) => void;
  onUnequipAbility: (abilityId: string) => void;
  onReorderAbility: (index: number, dir: -1 | 1) => void;
  onSetPotionThreshold: (pct: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

// Shown as a dimmed overlay over the Dungeon Map right before a run actually
// starts — lets the player set their ability loadout/order and the potion
// auto-use threshold without having to bounce out to the Habilidades screen
// first. Unlocking NEW nodes still only happens there; this is just
// re-ordering/equipping what's already unlocked.
export function DungeonLoadout({
  character: ch, dungeon, onEquipAbility, onUnequipAbility, onReorderAbility, onSetPotionThreshold, onConfirm, onCancel,
}: Props) {
  const equipped = getEquippedAbilities(ch.classId, ch.unlockedSkills, ch.equippedAbilities);
  const known = getUnlockedAbilities(ch.classId, ch.unlockedSkills);
  const benched = known.filter((a) => !ch.equippedAbilities.includes(a.id));
  const canEquipMore = ch.equippedAbilities.length < MAX_EQUIPPED_ABILITIES;

  return (
    <Modal
      title={`Preparar — ${dungeon.name}`}
      onClose={onCancel}
      footer={
        <>
          <SmallButton onClick={onCancel} variant="ghost">Cancelar</SmallButton>
          <SmallButton onClick={onConfirm}>Iniciar Expedição</SmallButton>
        </>
      }
    >
      <div>
        <h4 className="font-display text-gold/90 text-xs uppercase tracking-[0.15em] mb-2">
          Habilidades ({equipped.length}/{MAX_EQUIPPED_ABILITIES})
        </h4>
        {equipped.length === 0 ? (
          <p className="text-parchment/40 text-xs italic mb-3">Nenhuma habilidade equipada.</p>
        ) : (
          <div className="space-y-1 mb-3">
            {equipped.map((ab, i) => (
              <div key={ab.id} className="flex items-center gap-2 bg-black/25 border border-panelborder/40 rounded px-2 py-1.5">
                <div className="relative w-8 h-8 shrink-0">
                  <IconActive className="absolute inset-[18%] text-gold" />
                  <img src={skillFrame} alt="" className="absolute inset-0 w-full h-full pointer-events-none select-none" draggable={false} />
                </div>
                <span className="flex-1 text-xs text-parchment truncate">{ab.name}</span>
                <button onClick={() => onReorderAbility(i, -1)} disabled={i === 0} className="text-parchment/50 hover:text-parchment disabled:opacity-20 text-xs px-1">▲</button>
                <button onClick={() => onReorderAbility(i, 1)} disabled={i === equipped.length - 1} className="text-parchment/50 hover:text-parchment disabled:opacity-20 text-xs px-1">▼</button>
                <button onClick={() => onUnequipAbility(ab.id)} className="text-crimson/80 hover:text-crimson text-xs px-1">✕</button>
              </div>
            ))}
          </div>
        )}

        {benched.length > 0 && (
          <div className="space-y-1 mb-4">
            {benched.map((ab) => (
              <div key={ab.id} className="flex items-center gap-2 bg-black/10 border border-panelborder/20 rounded px-2 py-1.5 opacity-80">
                <div className="relative w-8 h-8 shrink-0">
                  <IconActive className="absolute inset-[18%] text-parchment/40" />
                  <img src={skillFrame} alt="" className="absolute inset-0 w-full h-full pointer-events-none select-none grayscale" draggable={false} />
                </div>
                <span className="flex-1 text-xs text-parchment/60 truncate">{ab.name}</span>
                <SmallButton onClick={() => onEquipAbility(ab.id)} variant="ghost">
                  {canEquipMore ? 'Equipar' : 'Cheio'}
                </SmallButton>
              </div>
            ))}
          </div>
        )}

        <h4 className="font-display text-gold/90 text-xs uppercase tracking-[0.15em] mb-2">
          Poções — usar automaticamente abaixo de
        </h4>
        <div className="flex gap-1.5 mb-1.5 flex-wrap">
          {POTION_THRESHOLD_OPTIONS.map((pct) => (
            <button
              key={pct}
              onClick={() => onSetPotionThreshold(pct)}
              className={`text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide transition ${
                ch.potionThreshold === pct ? 'bg-gold text-ink' : 'bg-panel2 text-parchment/50 hover:text-parchment hover:bg-panel2/80'
              }`}
            >
              {Math.round(pct * 100)}%
            </button>
          ))}
        </div>
        <p className="text-[11px] text-parchment/40">Poções em estoque: {ch.potions}/{MAX_POTIONS}.</p>
      </div>
    </Modal>
  );
}
