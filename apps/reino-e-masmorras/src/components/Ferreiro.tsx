import { useEffect, useState } from 'react';
import { Character, EquipmentItem } from '../types/game';
import { rarityColor, rarityName, SLOT_NAMES } from '../lib/equipment';
import { enhanceCost, itemDisplayName, MAX_ENHANCE_LEVEL, successChanceForLevel } from '../lib/enhancement';
import { fmt } from '../lib/format';
import { Button } from './Button';
import { ItemIcon as ItemIconGlyph } from './ItemIcon';
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
  onEnhance: (item: EquipmentItem) => EnhanceResult | undefined;
  onClose: () => void;
}

const ROLL_MS = 2000;

function findLiveItem(ch: Character, id: string): EquipmentItem | null {
  for (const eq of Object.values(ch.equipment)) if (eq?.id === id) return eq;
  return ch.inventory.find((i) => i.id === id) ?? null;
}

// One item's circular icon, reused for the grid and for the before/after
// preview cards — `dim` grays it out for "outcome not decided yet" and
// "attempt failed", `lit` briefly pulses it for "attempt succeeded".
function ItemIcon({ item, dim, lit }: { item: EquipmentItem; dim?: boolean; lit?: boolean }) {
  const color = rarityColor(item.rarity);
  return (
    <div
      className={`relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center rounded-[2px] bg-[rgba(96,148,210,0.09)] border border-[rgba(96,148,210,0.4)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.35)] transition-[filter,opacity] duration-500 ${dim ? 'grayscale opacity-40' : 'opacity-100'} ${lit ? 'animate-[buildingGlow_0.9s_ease-out]' : ''}`}
    >
      <div className="w-[88%] h-[88%] flex items-center justify-center">
        <ItemIconGlyph item={item} className="w-full h-full" style={{ color }} />
      </div>
      {item.enhanceLevel > 0 && (
        <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-gold text-ink rounded-full px-1 min-w-[16px] text-center border border-black/40 shadow">
          +{item.enhanceLevel}
        </span>
      )}
    </div>
  );
}

// The confirm → roll → result screen opened when the player taps "Aprimorar"
// on an item. Nothing is spent until "Confirmar" — before that, the hammer
// sprite sits on its first frame (paused) and the right-hand preview icon is
// dimmed since the outcome isn't decided yet. Confirming rolls immediately
// (so gold is spent and the result is already known), but the reveal is
// held back until the hammer animation finishes playing, so the drama
// matches what's actually happening instead of racing ahead of it.
function EnhanceFlow({ item, gold, forjaLevel, onEnhance, onDone }: {
  item: EquipmentItem; gold: number; forjaLevel: number; onEnhance: (item: EquipmentItem) => EnhanceResult | undefined; onDone: (success: boolean) => void;
}) {
  const [phase, setPhase] = useState<'confirm' | 'rolling' | 'result'>('confirm');
  const [result, setResult] = useState<EnhanceResult>({ success: false });
  const cost = enhanceCost(item);
  const chance = successChanceForLevel(item.enhanceLevel, forjaLevel);
  const nextItem = { ...item, enhanceLevel: item.enhanceLevel + 1 };
  const previewItem = result.success ? nextItem : item;

  useEffect(() => {
    if (phase !== 'rolling') return;
    const t = window.setTimeout(() => setPhase('result'), ROLL_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  function handleConfirm() {
    const outcome = onEnhance(item) ?? { success: false };
    setResult(outcome);
    setPhase('rolling');
    playUpgradeSfx();
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
          <Button onClick={() => onDone(result.success)} className="w-full">Continuar</Button>
        </>
      ) : (
        <>
          <p className="text-xs text-parchment/60 mb-1">+{item.enhanceLevel} → +{nextItem.enhanceLevel}</p>
          <p className="text-xs text-parchment/50 mb-3">
            Chance de sucesso: {Math.round(chance * 100)}% · Custo: {fmt(cost)} ouro
            {item.enhanceLevel >= 7 && ' · Falhar só custa a tentativa — o item nunca retrocede'}
          </p>
          {phase === 'confirm' ? (
            <div className="flex gap-2">
              <Button onClick={() => onDone(false)} className="flex-1">Cancelar</Button>
              <Button onClick={handleConfirm} disabled={gold < cost} className="flex-1">Confirmar</Button>
            </div>
          ) : (
            <p className="text-xs text-gold italic">Batendo o martelo...</p>
          )}
        </>
      )}
    </div>
  );
}

// Full-screen scene opened from the Forja's "Conversar com o Ferreiro"
// balloon action, replacing the old plain item-grid Modal. The banner is a
// full-bleed hero area sized to a near-square crop that stays safe across
// phone aspect ratios (see KIT-DE-ARTE.md's Cena do Ferreiro prompt for why
// the source art is a 1536x1536 square).
export function Ferreiro({ character: ch, onEnhance, onClose }: Props) {
  const [openItem, setOpenItem] = useState<EquipmentItem | null>(null);
  const [enhancingItem, setEnhancingItem] = useState<EquipmentItem | null>(null);
  const forjaLevel = ch.buildings.forja ?? 0;
  const forgeableItems = [...Object.values(ch.equipment).filter((i): i is EquipmentItem => i !== null), ...ch.inventory];

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
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 bg-black/55 border border-gold/50 rounded-full pl-1.5 pr-2.5 py-1 shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
              <img src={moedaIcon} alt="" className="w-4 h-4" />
              <span className="font-bold tabular-nums text-gold text-xs [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]">{fmt(ch.gold)}</span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/50 border border-gold/40 text-parchment/80 hover:text-parchment hover:border-gold text-lg leading-none flex items-center justify-center shrink-0"
              aria-label="Fechar"
            >
              ×
            </button>
          </div>
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

        {enhancingItem ? (
          <EnhanceFlow
            item={enhancingItem}
            gold={ch.gold}
            forjaLevel={forjaLevel}
            onEnhance={onEnhance}
            onDone={() => {
              const live = findLiveItem(ch, enhancingItem.id);
              setOpenItem(live);
              setEnhancingItem(null);
            }}
          />
        ) : openItem ? (
          <div className="rounded border border-black/50 bg-black/30 p-4 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
            <button onClick={() => setOpenItem(null)} className="text-xs text-parchment/50 hover:text-parchment mb-2">‹ Voltar</button>
            <div className="flex items-center gap-3">
              <ItemIcon item={openItem} />
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
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-parchment/60 mb-3">
              {forjaLevel > 0
                ? `Nível da Forja: ${forjaLevel}/5 — melhora sua chance de sucesso ao aprimorar. Toque num item pra aprimorar.`
                : 'Toque num item pra aprimorar. Melhore a Forja pra aumentar sua chance de sucesso.'}
            </p>
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
                      <ItemIcon item={item} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
