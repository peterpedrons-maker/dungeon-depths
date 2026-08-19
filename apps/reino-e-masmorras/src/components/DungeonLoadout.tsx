import { Character, DungeonDef, Rarity } from '../types/game';
import { ABILITY_THRESHOLD_OPTIONS, MAX_EQUIPPED_ABILITIES, getUnlockedAbilities, getEquippedAbilities } from '../lib/skills';
import { MAX_POTIONS, POTION_THRESHOLD_OPTIONS } from '../lib/consumables';
import { RARITIES } from '../lib/equipment';
import { Modal } from './Modal';
import { SmallButton } from './Button';
import { IconActive } from './icons';
import skillFrame from '../assets/slot-habilidade.webp';

export const REPEAT_OPTIONS = [5, 10] as const;

interface Props {
  character: Character;
  dungeon: DungeonDef;
  onEquipAbility: (abilityId: string) => void;
  onUnequipAbility: (abilityId: string) => void;
  onReorderAbility: (index: number, dir: -1 | 1) => void;
  onSetAbilityThreshold: (abilityId: string, pct: number) => void;
  onSetPotionThreshold: (pct: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
  nightmareUnlocked: boolean;
  nightmareArmed: boolean;
  onToggleNightmare: (armed: boolean) => void;
  repeatCount: number;
  onSetRepeatCount: (n: number) => void;
  autoSellRarities: Rarity[];
  onToggleAutoSellRarity: (r: Rarity) => void;
  noPotionsArmed: boolean;
  onToggleNoPotions: (armed: boolean) => void;
}

// A section card — every block of this screen (habilidades, poções, and the
// three farming options below) shares this frame instead of just running
// straight into the next h4, so the screen reads as a set of decisions
// instead of one long undifferentiated list.
function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-panelborder/40 bg-black/20 p-3 mb-3">
      <h4 className="font-display text-gold/90 text-xs uppercase tracking-[0.15em] mb-0.5">{title}</h4>
      {hint && <p className="text-[11px] text-parchment/40 mb-2">{hint}</p>}
      {children}
    </div>
  );
}

function ToggleChip({ active, onClick, children, activeClass = 'bg-gold text-ink' }: {
  active: boolean; onClick: () => void; children: React.ReactNode; activeClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide transition border ${
        active ? `${activeClass} border-transparent` : 'bg-panel2 text-parchment/50 border-transparent hover:text-parchment hover:bg-panel2/80'
      }`}
    >
      {children}
    </button>
  );
}

// Shown as a dimmed overlay over the Dungeon Map right before a run actually
// starts — lets the player set their ability loadout/order and the potion
// auto-use threshold without having to bounce out to the Habilidades screen
// first. Unlocking NEW nodes still only happens there; this is just
// re-ordering/equipping what's already unlocked. Also where a farming
// session gets configured: repeat N times, auto-sell junk by rarity, and
// opt out of potions entirely for a run.
export function DungeonLoadout({
  character: ch, dungeon, onEquipAbility, onUnequipAbility, onReorderAbility, onSetAbilityThreshold, onSetPotionThreshold, onConfirm, onCancel,
  nightmareUnlocked, nightmareArmed, onToggleNightmare,
  repeatCount, onSetRepeatCount, autoSellRarities, onToggleAutoSellRarity, noPotionsArmed, onToggleNoPotions,
}: Props) {
  const equipped = getEquippedAbilities(ch.classId, ch.unlockedSkills, ch.equippedAbilities);
  const known = getUnlockedAbilities(ch.classId, ch.unlockedSkills);
  const benched = known.filter((a) => !ch.equippedAbilities.includes(a.id));
  const canEquipMore = ch.equippedAbilities.length < MAX_EQUIPPED_ABILITIES;
  // Modo Ferro's death is permanent (see App.tsx) — an automatic sequence
  // that keeps restarting past a death the character can't actually come
  // back from doesn't make sense, so the option never even shows up for one.
  const repeatAllowed = !ch.ironMode;

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
        {nightmareUnlocked && (
          <label className={`flex items-start gap-2 w-full px-3 py-2 mb-3 rounded border cursor-pointer text-left transition ${
            nightmareArmed ? 'border-crimson bg-crimson/15' : 'border-panelborder/40 bg-black/20 hover:border-crimson/40'
          }`}>
            <input
              type="checkbox"
              checked={nightmareArmed}
              onChange={(e) => onToggleNightmare(e.target.checked)}
              className="mt-0.5 accent-crimson"
            />
            <span>
              <span className={`block text-xs font-bold uppercase tracking-wide ${nightmareArmed ? 'text-crimson' : 'text-parchment/80'}`}>
                ☠ Modo Pesadelo
              </span>
              <span className="block text-[11px] text-parchment/50 mt-0.5">
                Todo inimigo desta masmorra fica bem mais forte — em troca, ouro, XP e chance de item melhoram.
              </span>
            </span>
          </label>
        )}

        <Section title={`Habilidades (${equipped.length}/${MAX_EQUIPPED_ABILITIES})`}>
          {equipped.length === 0 ? (
            <p className="text-parchment/40 text-xs italic">Nenhuma habilidade equipada.</p>
          ) : (
            <div className="space-y-1 mb-2">
              {equipped.map((ab, i) => {
                const isHpGated = ab.condition.type === 'hpBelow';
                const threshold = ch.abilityThresholds[ab.id] ?? ab.condition.pct ?? 0.5;
                return (
                  <div key={ab.id} className="bg-black/25 border border-panelborder/40 rounded px-2 py-1.5">
                    <div className="flex items-center gap-2">
                      <div className="relative w-8 h-8 shrink-0">
                        <IconActive className="absolute inset-[18%] text-gold" />
                        <img src={skillFrame} alt="" className="absolute inset-0 w-full h-full pointer-events-none select-none" draggable={false} />
                      </div>
                      <span className="flex-1 text-xs text-parchment truncate">{ab.name}</span>
                      <button onClick={() => onReorderAbility(i, -1)} disabled={i === 0} className="text-parchment/50 hover:text-parchment disabled:opacity-20 text-xs px-1">▲</button>
                      <button onClick={() => onReorderAbility(i, 1)} disabled={i === equipped.length - 1} className="text-parchment/50 hover:text-parchment disabled:opacity-20 text-xs px-1">▼</button>
                      <button onClick={() => onUnequipAbility(ab.id)} className="text-crimson/80 hover:text-crimson text-xs px-1">✕</button>
                    </div>
                    {isHpGated && (
                      <div className="flex items-center gap-1.5 mt-1.5 pl-10 flex-wrap">
                        <span className="text-[10px] text-parchment/40 uppercase tracking-wide">Ativa abaixo de</span>
                        {ABILITY_THRESHOLD_OPTIONS.map((pct) => (
                          <button
                            key={pct}
                            onClick={() => onSetAbilityThreshold(ab.id, pct)}
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide transition ${
                              threshold === pct ? 'bg-gold text-ink' : 'bg-panel2 text-parchment/50 hover:text-parchment hover:bg-panel2/80'
                            }`}
                          >
                            {Math.round(pct * 100)}%
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {benched.length > 0 && (
            <div className="space-y-1">
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
        </Section>

        <Section title="Poções — usar automaticamente abaixo de">
          <div className={`flex gap-1.5 mb-1.5 flex-wrap transition ${noPotionsArmed ? 'opacity-30 pointer-events-none' : ''}`}>
            {POTION_THRESHOLD_OPTIONS.map((pct) => (
              <ToggleChip key={pct} active={ch.potionThreshold === pct} onClick={() => onSetPotionThreshold(pct)}>
                {Math.round(pct * 100)}%
              </ToggleChip>
            ))}
          </div>
          <p className={`text-[11px] text-parchment/40 mb-2 transition ${noPotionsArmed ? 'opacity-30' : ''}`}>Poções em estoque: {ch.potions}/{MAX_POTIONS}.</p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={noPotionsArmed} onChange={(e) => onToggleNoPotions(e.target.checked)} className="accent-crimson" />
            <span className="text-xs text-parchment/70">Não utilizar Poção de HP nesta expedição</span>
          </label>
        </Section>

        <Section title="Vender Automático" hint="Itens das raridades marcadas vão direto pro ouro ao dropar — nunca ocupam a mochila.">
          <div className="flex gap-1.5 flex-wrap">
            {RARITIES.map((r) => {
              const active = autoSellRarities.includes(r.id);
              return (
                <button
                  key={r.id}
                  onClick={() => onToggleAutoSellRarity(r.id)}
                  className="text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide transition border"
                  style={active
                    ? { background: r.color, borderColor: r.color, color: '#1a140c' }
                    : { background: 'transparent', borderColor: 'rgba(200,180,140,0.25)', color: r.color }}
                >
                  {r.name}
                </button>
              );
            })}
          </div>
        </Section>

        {repeatAllowed && (
          <Section title="Repetir Automaticamente" hint="Mesmo que o herói caia em combate, a masmorra recomeça — até completar o total escolhido.">
            <div className="flex gap-1.5 flex-wrap">
              <ToggleChip active={repeatCount === 0} onClick={() => onSetRepeatCount(0)}>Não</ToggleChip>
              {REPEAT_OPTIONS.map((n) => (
                <ToggleChip key={n} active={repeatCount === n} onClick={() => onSetRepeatCount(n)}>{n}x</ToggleChip>
              ))}
            </div>
          </Section>
        )}
      </div>
    </Modal>
  );
}
