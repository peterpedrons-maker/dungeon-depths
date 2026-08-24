import { useEffect, useState } from 'react';
import { Character, EquipmentItem, Rarity, RuneStack } from '../types/game';
import { RuneShelf } from './RuneShelf';
import { rarityColor, rarityName, slotTintStyle, SLOT_NAMES } from '../lib/equipment';
import {
  enhanceCost, enhancedItem, itemDisplayName, MAX_ENHANCE_LEVEL, primaryStatLines, resetItemCost, secondaryStatLabels, successChanceForLevel,
} from '../lib/enhancement';
import { pickBestRuneFor } from '../lib/runes';
import { fmt } from '../lib/format';
import { Button, SmallButton } from './Button';
import { Modal } from './Modal';
import { ItemIcon as ItemIconGlyph } from './ItemIcon';
import { ItemCompareGrid } from './ItemCompare';
import { IconHammer } from './icons';
import pergaminho from '../assets/pergaminho.webp';
import moedaIcon from '../assets/moeda.webp';
import ferreiroCena from '../assets/ferreiro-cena.webp';
import marteloParado from '../assets/aprimoramento-martelo-parado.webp';
import marteloAnimado from '../assets/aprimoramento-martelo.webp';
import { playUpgradeSfx } from '../lib/audio';

// The item's level never drops on a failed attempt — a fail only costs the
// gold/tentativa already spent (see lib/enhancement.ts), so this only ever
// needs to report whether the push actually landed.
export interface EnhanceResult { success: boolean }

interface Props {
  character: Character;
  onEnhance: (item: EquipmentItem, runeChoice?: { rune: RuneStack; affixIndex?: number }) => EnhanceResult | undefined;
  onReset: (item: EquipmentItem) => void;
  onSellRunes: (rarity: Rarity, tier: number, count: number) => void;
  onClose: () => void;
}

const ROLL_MS = 2000;

function findLiveItem(ch: Character, id: string): EquipmentItem | null {
  for (const eq of Object.values(ch.equipment)) if (eq?.id === id) return eq;
  return ch.inventory.find((i) => i.id === id) ?? null;
}

// One item's circular icon, reused for the grid and for the before/after
// preview cards — `dim` grays it out for "outcome not decided yet" and
// "attempt failed", `lit` briefly pulses it for "attempt succeeded",
// `equipped` adds a small ribbon marking this exact item as currently worn
// (so browsing the grid always shows at a glance what's equipped, without
// needing to open it or compare it against anything).
function ItemIcon({ item, dim, lit, equipped }: { item: EquipmentItem; dim?: boolean; lit?: boolean; equipped?: boolean }) {
  const color = rarityColor(item.rarity);
  return (
    <div
      style={slotTintStyle(item)}
      className={`relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center rounded-[2px] bg-[var(--slot-bg)] border border-[var(--slot-border)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.35)] transition-[filter,opacity] duration-500 ${dim ? 'grayscale opacity-40' : 'opacity-100'} ${lit ? 'animate-[buildingGlow_0.9s_ease-out]' : ''}`}
    >
      <div className="w-[88%] h-[88%] flex items-center justify-center">
        <ItemIconGlyph item={item} className="w-full h-full" style={{ color }} />
      </div>
      {item.enhanceLevel > 0 && (
        <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-gold text-ink rounded-full px-1 min-w-[16px] text-center border border-black/40 shadow">
          +{item.enhanceLevel}
        </span>
      )}
      {equipped && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold uppercase tracking-wide bg-emerald-600 text-white rounded-full px-1.5 py-px border border-black/40 shadow whitespace-nowrap">
          Equipado
        </span>
      )}
    </div>
  );
}

// The pick → roll → result screen opened when the player taps "Aprimorar"
// on an item. Nothing is spent until "Confirmar" — the "pick" phase reads
// like the item's own detail view (icon/name/rarity, its actual stat
// lines) rather than a separate small panel, and the affix lines themselves
// ARE the picker: tap one to mark it as what you want to improve. A rune is
// resolved automatically behind the scenes (see pickBestRuneFor — the
// smallest owned stack that still qualifies for this item) the moment an
// affix is picked; nothing is asked about WHICH rune, only which affix. If
// no owned rune qualifies for this item at all, none of the affix lines are
// tappable and the push always improves a random existing affix instead
// (still true on a zero-affix item — nothing to improve without a rune to
// grant a first one).
//
// Confirming rolls immediately (so gold is spent and the result is already
// known), but the reveal is held back until the hammer animation finishes
// playing, so the drama matches what's actually happening instead of
// racing ahead of it.
function EnhanceFlow({ item, character, onEnhance, onDone }: {
  item: EquipmentItem; character: Character; onEnhance: Props['onEnhance']; onDone: (success: boolean) => void;
}) {
  const [phase, setPhase] = useState<'pick' | 'rolling' | 'result'>('pick');
  const [result, setResult] = useState<EnhanceResult>({ success: false });
  const [affixIndex, setAffixIndex] = useState<number | null>(null);
  const cost = enhanceCost(item);
  const chance = successChanceForLevel(item.enhanceLevel);
  const bestRune = pickBestRuneFor(character.runes, item);
  // The item as currently displayed everywhere else (its already-applied
  // enhanceLevel scaling and any past affix growth) — NOT the raw stored
  // item, which only ever holds the original roll. Reading straight off
  // `item` here made a +2 item's pick screen show its +0 base value again,
  // hiding every earlier successful push instead of building on top of it.
  const displayItem = enhancedItem(item);
  const affixLabels = secondaryStatLabels(displayItem);
  const primaryLine = primaryStatLines(displayItem)[0];
  // The item as it actually came back from onEnhance (affix growth and all)
  // — NOT a locally-guessed `{...item, enhanceLevel: +1}`, which would only
  // ever show the base-stat bump and silently hide whichever affix just
  // improved. onEnhance already applied the real change via onCharacterChange
  // before this re-renders, so `character` here already reflects it.
  const nextItem = (result.success && findLiveItem(character, item.id)) || { ...item, enhanceLevel: item.enhanceLevel + 1 };
  const previewItem = result.success ? nextItem : item;

  useEffect(() => {
    if (phase !== 'rolling') return;
    const t = window.setTimeout(() => setPhase('result'), ROLL_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  function handleConfirm() {
    const runeChoice = bestRune && affixIndex !== null ? { rune: bestRune, affixIndex } : undefined;
    const outcome = onEnhance(item, runeChoice) ?? { success: false };
    setResult(outcome);
    setPhase('rolling');
    playUpgradeSfx();
  }

  if (phase === 'pick') {
    return (
      <div className="rounded border border-black/50 bg-black/30 p-4 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3 mb-3">
          <ItemIcon item={item} />
          <div>
            <div className="font-bold text-base" style={{ color: rarityColor(item.rarity) }}>{itemDisplayName(item)}</div>
            <div className="text-xs text-parchment/50">{rarityName(item.rarity)} · Tier {item.tier} · {SLOT_NAMES[item.slot]}</div>
          </div>
        </div>

        <p className="text-xs text-parchment/60 mb-1">+{item.enhanceLevel} → +{item.enhanceLevel + 1}</p>
        <p className="text-xs text-parchment/50 mb-3">
          Chance de sucesso: {Math.round(chance * 100)}% · Custo: {fmt(cost)} ouro
          {item.enhanceLevel >= 7 && ' · Falhar só custa a tentativa — o item nunca retrocede'}
        </p>

        <p className="text-[11px] text-parchment/50 mb-1.5">
          {bestRune
            ? 'Toque num atributo pra escolher qual melhora, gastando uma Runa de Aprimoramento — ou toque em "Sem runa" pra melhorar um aleatório sem gastar nenhuma:'
            : 'Sem Runa de Aprimoramento disponível pra esse item — vai melhorar um atributo aleatório no sucesso:'}
        </p>
        <div className="flex flex-col gap-1.5 mb-3">
          {primaryLine && (
            <div className="text-xs text-parchment/70 rounded px-2.5 py-1.5 border border-panelborder/30 bg-black/20">
              {primaryLine} <span className="text-parchment/40 italic">(atributo base — sempre melhora)</span>
            </div>
          )}
          {/* Explicit "skip the rune" choice, only shown when one is
              actually available to skip — the game already fell back to a
              random pick with no rune spent whenever nothing was selected,
              but that only worked as an unlabeled default state. A player
              who owns a usable rune but doesn't want to spend it on this
              particular push needs a real button to say so, not just
              "don't click anything" (and without a rune at all, this would
              be the only reachable option anyway, so it'd just be noise). */}
          {bestRune && (
            <button
              onClick={() => setAffixIndex(null)}
              className={`text-left text-xs rounded px-2.5 py-1.5 border ${affixIndex === null ? 'bg-gold/25 border-gold text-gold' : 'border-panelborder/50 text-parchment/70 hover:border-gold/50'}`}
            >
              Sem runa — melhora um afixo aleatório (não gasta runa)
            </button>
          )}
          {affixLabels.length === 0 ? (
            <button
              disabled={!bestRune}
              onClick={() => setAffixIndex((i) => (i === 0 ? null : 0))}
              className={`text-left text-xs rounded px-2.5 py-1.5 border ${affixIndex === 0 ? 'bg-gold/25 border-gold text-gold' : 'border-panelborder/50 text-parchment/70'} ${bestRune ? 'hover:border-gold/50' : 'opacity-40 cursor-not-allowed'}`}
            >
              Sem afixos — a runa concede um novo
            </button>
          ) : (
            affixLabels.map((label, i) => (
              <button
                key={i}
                disabled={!bestRune}
                onClick={() => setAffixIndex((cur) => (cur === i ? null : i))}
                className={`text-left text-xs rounded px-2.5 py-1.5 border ${affixIndex === i ? 'bg-gold/25 border-gold text-gold' : 'border-panelborder/50 text-parchment/70'} ${bestRune ? 'hover:border-gold/50' : 'opacity-40 cursor-not-allowed'}`}
              >
                {label}
              </button>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={() => onDone(false)} className="flex-1">Cancelar</Button>
          <Button onClick={handleConfirm} disabled={character.gold < cost} className="flex-1">Confirmar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded border border-black/50 bg-black/30 p-4 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] text-center">
      <div className="flex items-center justify-center gap-3 mb-3">
        <ItemIcon item={item} />
        <img
          src={phase === 'rolling' ? marteloAnimado : marteloParado}
          alt=""
          className="h-20 sm:h-24 w-auto shrink-0"
          style={{ imageRendering: 'pixelated' }}
          draggable={false}
        />
        <ItemIcon item={previewItem} dim={phase !== 'result' || !result.success} lit={phase === 'result' && result.success} />
      </div>

      {phase === 'result' ? (
        <>
          <p className={`text-sm font-bold mb-1 ${result.success ? 'text-emerald-400' : 'text-crimson'}`}>
            {result.success ? 'Deu certo! Ficou até melhor.' : 'Não dessa vez... o metal não aguentou.'}
          </p>
          <p className="text-xs text-parchment/50 mb-3">
            {result.success ? `${item.name} agora está +${nextItem.enhanceLevel}.` : `${item.name} continua +${item.enhanceLevel}.`}
          </p>
          {/* A successful push used to only show the already-upgraded icon
              with its new "+N" badge — no indication of WHAT actually got
              better. Same Antes/Depois compare window CharacterOverview and
              the Mercador already use, just relabeled for a before/after
              reveal instead of an equip-a-new-item decision. */}
          {result.success && (
            <div className="mb-3">
              <ItemCompareGrid equipped={item} candidate={nextItem} labels={{ left: 'Antes', right: 'Depois' }} />
            </div>
          )}
          <Button onClick={() => onDone(result.success)} className="w-full">Continuar</Button>
        </>
      ) : (
        <p className="text-xs text-gold italic">Batendo o martelo...</p>
      )}
    </div>
  );
}

// Full-screen scene opened from the Forja's "Conversar com o Ferreiro"
// balloon action, replacing the old plain item-grid Modal. The banner is a
// full-bleed hero area sized to a near-square crop that stays safe across
// phone aspect ratios (see KIT-DE-ARTE.md's Cena do Ferreiro prompt for why
// the source art is a 1536x1536 square).
export function Ferreiro({ character: ch, onEnhance, onReset, onSellRunes, onClose }: Props) {
  const [openItem, setOpenItem] = useState<EquipmentItem | null>(null);
  const [enhancingItem, setEnhancingItem] = useState<EquipmentItem | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const forgeableItems = [...Object.values(ch.equipment).filter((i): i is EquipmentItem => i !== null), ...ch.inventory];
  const equippedIds = new Set(Object.values(ch.equipment).filter((i): i is EquipmentItem => i !== null).map((i) => i.id));

  return (
    <div className="fixed inset-0 z-40 bg-nightsky overflow-y-auto flex flex-col">
      <div className="relative w-full shrink-0 overflow-hidden" style={{ height: '44vh', minHeight: 260 }}>
        <img
          src={ferreiroCena}
          alt="O Ferreiro em sua forja"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ imageRendering: 'pixelated' }}
          draggable={false}
        />
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
        <div className="absolute top-3 inset-x-3 flex items-center justify-between">
          <h2 className="font-display text-gold text-sm sm:text-base font-bold tracking-[0.12em] sm:tracking-[0.18em] uppercase [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">
            Ferreiro
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/70 border-2 border-gold/70 text-gold hover:bg-black/85 hover:border-gold text-2xl font-black leading-none flex items-center justify-center shrink-0 shadow-[0_2px_10px_rgba(0,0,0,0.6)]"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
      </div>

      <div className="max-w-md w-full mx-auto p-3 sm:p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-11 h-11 rounded-full bg-panel border-2 border-gold/50 flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            <IconHammer className="w-5 h-5 text-gold" />
          </div>
          <div
            className="relative bg-panel border-2 border-gold/40 rounded-sm px-4 py-3 text-sm text-parchment/90 shadow-[0_6px_16px_rgba(0,0,0,0.5)]"
            style={{ backgroundImage: `url(${pergaminho})`, backgroundSize: '200px', backgroundBlendMode: 'multiply' }}
          >
            <span className="absolute -left-[7px] top-4 w-3 h-3 bg-panel border-l-2 border-b-2 border-gold/40 rotate-45" />
            {enhancingItem
              ? 'Bora ver o que dá pra fazer com essa peça.'
              : openItem
              ? 'Boa escolha. Deixa eu ver o que consigo fazer com essa peça...'
              : `Fala, ${ch.name}. Qual peça você quer que eu aprimore hoje?`}
          </div>
        </div>

        {/* Kept down here with the items/actions that actually cost gold,
            not just in the hero banner up top — that one scrolls out of
            view together with the banner, so the player couldn't see their
            balance anymore once they scrolled down to the item grid. */}
        <div className="flex items-center gap-1.5 bg-black/40 border border-gold/40 rounded-full pl-1.5 pr-3 py-1 w-fit mb-3 shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
          <img src={moedaIcon} alt="" className="w-4 h-4" />
          <span className="font-bold tabular-nums text-gold text-xs">{fmt(ch.gold)} ouro</span>
        </div>

        {!enhancingItem && <RuneShelf runes={ch.runes} onSell={onSellRunes} />}

        {enhancingItem ? (
          <EnhanceFlow
            item={enhancingItem}
            character={ch}
            onEnhance={onEnhance}
            onDone={() => {
              const live = findLiveItem(ch, enhancingItem.id);
              setOpenItem(live);
              setEnhancingItem(null);
            }}
          />
        ) : openItem ? (
          <div className="rounded border border-black/50 bg-black/30 p-4 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
            <button
              onClick={() => setOpenItem(null)}
              className="flex items-center gap-1 text-sm font-bold text-gold bg-black/40 border border-gold/40 rounded-full pl-2 pr-3 py-1 mb-3 hover:bg-black/60 hover:border-gold active:brightness-90"
            >
              <span className="text-base leading-none">‹</span> Voltar
            </button>
            <div className="flex items-center gap-3">
              <ItemIcon item={openItem} equipped={equippedIds.has(openItem.id)} />
              <div>
                <div className="font-bold text-base" style={{ color: rarityColor(openItem.rarity) }}>{itemDisplayName(openItem)}</div>
                <div className="text-xs text-parchment/50">{rarityName(openItem.rarity)} · Tier {openItem.tier} · {SLOT_NAMES[openItem.slot]}</div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-panelborder/40">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-parchment/60">Aprimoramento na Forja</span>
                <span className="font-bold tabular-nums text-gold">+{openItem.enhanceLevel}/{MAX_ENHANCE_LEVEL}</span>
              </div>
              {openItem.enhanceLevel >= MAX_ENHANCE_LEVEL ? (
                <p className="text-xs text-parchment/40 italic">Nível máximo de aprimoramento atingido.</p>
              ) : (
                <Button onClick={() => setEnhancingItem(openItem)} className="w-full">
                  Aprimorar para +{openItem.enhanceLevel + 1}
                </Button>
              )}
              {openItem.enhanceLevel > 0 && (
                <button
                  onClick={() => setConfirmingReset(true)}
                  className="w-full mt-2 text-center text-xs font-bold text-crimson/80 border border-crimson/40 rounded px-2 py-1.5 hover:text-crimson hover:border-crimson"
                >
                  Resetar para +0 — {fmt(resetItemCost(openItem))} ouro
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-parchment/60 mb-3">Toque num item pra aprimorar.</p>
            {forgeableItems.length === 0 ? (
              <p className="text-parchment/40 text-sm italic">Nenhum item pra aprimorar ainda.</p>
            ) : (
              <div className="rounded border border-black/50 bg-black/30 p-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
                <div className="grid grid-cols-5 gap-2.5">
                  {forgeableItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setOpenItem(item)}
                      title={itemDisplayName(item)}
                      className="transition-transform duration-150 hover:scale-105"
                    >
                      <ItemIcon item={item} equipped={equippedIds.has(item.id)} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {confirmingReset && openItem && (
        <Modal
          title="Resetar item"
          onClose={() => setConfirmingReset(false)}
          footer={
            <>
              <SmallButton onClick={() => setConfirmingReset(false)} variant="ghost">Cancelar</SmallButton>
              <SmallButton
                onClick={() => {
                  onReset(openItem);
                  setConfirmingReset(false);
                  setOpenItem(null);
                }}
              >
                Confirmar — {fmt(resetItemCost(openItem))} ouro
              </SmallButton>
            </>
          }
        >
          <p>
            Isso vai reverter {itemDisplayName(openItem)} pra +0, desfazendo o atributo base aprimorado e qualquer
            afixo melhorado ao longo do caminho. O ouro já gasto nas tentativas não é devolvido.
          </p>
        </Modal>
      )}
    </div>
  );
}
