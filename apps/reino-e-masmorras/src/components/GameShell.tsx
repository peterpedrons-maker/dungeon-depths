import { useState } from 'react';
import { AttributeKey, Character, ProfileState, RankEntry, Section, DungeonDef, EquipmentItem, ItemSlot, Rarity, RuneStack } from '../types/game';
import { findCosmetic } from '../lib/cosmetics';
import { DUNGEONS, highestAccessibleItemTier } from '../lib/dungeons';
import { rollAffixForItem, sellValue } from '../lib/equipment';
import {
  applyAffixGrowth, enhanceCost, MAX_ENHANCE_LEVEL, resetItem, resetItemCost, successChanceForLevel,
} from '../lib/enhancement';
import { canUseRuneOn, removeRune } from '../lib/runes';
import { canFitInInventory, placeInInventory } from '../lib/inventoryGrid';
import { maybeRefreshMerchantStock } from '../lib/merchantStock';
import { MAX_EQUIPPED_ABILITIES } from '../lib/skills';
import { MAX_POTIONS, potionBasePrice } from '../lib/consumables';
import { playBuySellSfx } from '../lib/audio';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { KingdomOverview } from './KingdomOverview';
import { KingdomBuildings } from './KingdomBuildings';
import { CharacterOverview } from './CharacterOverview';
import { SkillTree } from './SkillTree';
import { Mercador } from './Mercador';
import { RankingScreen } from './RankingScreen';
import { DungeonMap } from './DungeonMap';
import { HuntHall } from './HuntHall';
import { PrestigeShop } from './PrestigeShop';
import { Bestiario } from './Bestiario';
import { Titulos } from './Titulos';
import { DungeonLoadout } from './DungeonLoadout';
import { DungeonPanel, RunStats, EMPTY_RUN_STATS } from './DungeonPanel';
import { Ferreiro } from './Ferreiro';
import { Bau } from './Bau';
import { Modal } from './Modal';
import { SmallButton } from './Button';

// Tracks a "repetir automaticamente" farming sequence in progress —
// `current` is the attempt DungeonPanel is on right now (1-indexed);
// `stats` is the running total across every attempt so far, folded in via
// mergeRunIntoPlan each time one ends. Once the sequence itself is done,
// the same shape gets frozen into `repeatSummary` for the results modal.
interface RepeatPlan {
  total: number;
  current: number;
  wins: number;
  deaths: number;
  retreats: number;
  stats: RunStats;
}

function mergeRunIntoPlan(plan: RepeatPlan, endedReason: 'death' | 'retreat' | 'victory', runStats: RunStats): RepeatPlan {
  return {
    ...plan,
    wins: plan.wins + (endedReason === 'victory' ? 1 : 0),
    deaths: plan.deaths + (endedReason === 'death' ? 1 : 0),
    retreats: plan.retreats + (endedReason === 'retreat' ? 1 : 0),
    stats: {
      kills: plan.stats.kills + runStats.kills,
      goldFromKills: plan.stats.goldFromKills + runStats.goldFromKills,
      xpGained: plan.stats.xpGained + runStats.xpGained,
      itemsDropped: plan.stats.itemsDropped + runStats.itemsDropped,
      itemsAutoSold: plan.stats.itemsAutoSold + runStats.itemsAutoSold,
      goldFromAutoSell: plan.stats.goldFromAutoSell + runStats.goldFromAutoSell,
    },
  };
}

function SummaryRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm py-1 border-b border-panelborder/20 last:border-0">
      <span className="text-parchment/60">{label}</span>
      <span className="font-bold tabular-nums text-parchment">{value}</span>
    </div>
  );
}

// A faint heraldic crest sitting behind the screen content — keeps the
// leftover space below shorter panels from reading as an empty/broken void
// instead of an intentional part of the layout.
function EmblemWatermark() {
  return (
    <svg
      viewBox="0 0 200 240"
      className="absolute left-1/2 bottom-6 -translate-x-1/2 w-[70%] max-w-[360px] opacity-[0.06] pointer-events-none select-none"
      style={{ color: '#c89a2e' }}
      aria-hidden
    >
      <path
        d="M100 4 L184 30 V110 C184 168 148 208 100 236 C52 208 16 168 16 110 V30 Z"
        fill="none" stroke="currentColor" strokeWidth="3"
      />
      <path d="M100 30 V180 M50 60 L150 150 M150 60 L50 150" stroke="currentColor" strokeWidth="2" />
      <circle cx="100" cy="105" r="26" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

interface Props {
  character: Character;
  ranking: RankEntry[];
  rankingError: string | null;
  profile: ProfileState;
  onCharacterChange: (c: Character) => void;
  onRunEnd: (finalCharacter: Character, depthReached: number, endedReason: 'death' | 'retreat' | 'victory', prestigeGained: number) => void;
  onAbandon: () => void;
  onSignOut: () => void;
  onBuyCosmetic: (id: string) => void;
  onEquipCosmetic: (id: string | null) => void;
  onVaultChange: (vaultItems: EquipmentItem[]) => void;
}

export function GameShell({
  character, ranking, rankingError, profile, onCharacterChange, onRunEnd, onAbandon, onSignOut, onBuyCosmetic, onEquipCosmetic,
  onVaultChange,
}: Props) {
  const [section, setSection] = useState<Section>('kingdom');
  const [dungeon, setDungeon] = useState<DungeonDef>(DUNGEONS[0]);
  // Bumped only by handleRestartDungeon — forces DungeonPanel to remount
  // fresh on the same dungeon without ever leaving the 'dungeon' section
  // (any other path back into a dungeon already unmounts/remounts it via
  // the normal section-switch, so this is the one case that needs a key).
  const [dungeonRunKey, setDungeonRunKey] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingDungeon, setPendingDungeon] = useState<DungeonDef | null>(null);
  const [runInProgress, setRunInProgress] = useState(false);
  const [navConfirmTarget, setNavConfirmTarget] = useState<Section | 'abandon' | null>(null);
  const [ferreiroOpen, setFerreiroOpen] = useState(false);
  const [mercadorOpen, setMercadorOpen] = useState(false);
  const [bauOpen, setBauOpen] = useState(false);
  // Armed on the loadout screen (DungeonLoadout.tsx), only offered for a
  // dungeon already in character.clearedDungeons — reset whenever a new
  // dungeon is picked so it never silently carries over to the next one.
  const [nightmareArmed, setNightmareArmed] = useState(false);
  // The rest of the loadout screen's farming options — same reset-per-pick
  // rule as nightmareArmed above, for the same reason.
  const [repeatChoice, setRepeatChoice] = useState(0);
  const [autoSellRarities, setAutoSellRarities] = useState<Rarity[]>([]);
  const [noPotionsArmed, setNoPotionsArmed] = useState(false);
  // Non-null exactly while a repeat sequence is actively running (see
  // confirmDungeonEntry/handleRunEnd/handleRestartDungeon below);
  // repeatSummary is the frozen result shown once it's done.
  const [repeatPlan, setRepeatPlan] = useState<RepeatPlan | null>(null);
  const [repeatSummary, setRepeatSummary] = useState<RepeatPlan | null>(null);

  // Checked on open rather than on a timer — re-rolls the stock only once
  // MERCHANT_REFRESH_MS has actually elapsed since the last refresh.
  function handleOpenMercador() {
    const refreshed = maybeRefreshMerchantStock(character);
    if (refreshed !== character) onCharacterChange(refreshed);
    setMercadorOpen(true);
  }

  function enterDungeon(d: DungeonDef) {
    setDungeon(d);
    setSection('dungeon');
  }

  function toggleAutoSellRarity(r: Rarity) {
    setAutoSellRarities((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  }

  // Clicking a map marker only stages the choice — the run doesn't actually
  // start (and the retreat-penalty guard doesn't arm) until the loadout
  // screen's "Iniciar Expedição" is confirmed.
  function selectDungeon(d: DungeonDef) {
    setPendingDungeon(d); setNightmareArmed(false); setRepeatChoice(0); setAutoSellRarities([]); setNoPotionsArmed(false);
  }
  function cancelDungeonSelect() {
    setPendingDungeon(null); setNightmareArmed(false); setRepeatChoice(0); setAutoSellRarities([]); setNoPotionsArmed(false);
  }
  function confirmDungeonEntry() {
    if (!pendingDungeon) return;
    const d = nightmareArmed
      ? {
          ...pendingDungeon, isNightmare: true,
          dropMult: (pendingDungeon.dropMult ?? 1) * 1.6,
          goldMult: (pendingDungeon.goldMult ?? 1) * 1.5,
          xpMult: (pendingDungeon.xpMult ?? 1) * 1.4,
        }
      : pendingDungeon;
    setRepeatSummary(null);
    setRepeatPlan(repeatChoice > 0 ? { total: repeatChoice, current: 1, wins: 0, deaths: 0, retreats: 0, stats: { ...EMPTY_RUN_STATS } } : null);
    enterDungeon(d);
    setPendingDungeon(null);
    setRunInProgress(true);
  }

  // Prestígio only comes from an actual boss kill (never a retreat or a
  // death) — a Caçada boss is worth much more than a regular dungeon boss,
  // since it's deliberately far harder to reach that victory, and a Modo
  // Ferro character triples every gain as the payoff for playing with
  // permadeath on.
  function prestigeGain(finalCharacter: Character, d: DungeonDef, endedReason: 'death' | 'retreat' | 'victory'): number {
    if (endedReason !== 'victory') return 0;
    const base = d.isHunt ? 5 : 1;
    return finalCharacter.ironMode ? base * 3 : base;
  }

  // Only a real (non-Hunt) dungeon clear counts — a Caçada boss is already
  // the hardest fight at its level, stacking Modo Pesadelo on top of it
  // wouldn't mean anything, so Hunts never enter clearedDungeons and their
  // loadout screen never offers the toggle.
  function withDungeonClear(c: Character, endedReason: 'death' | 'retreat' | 'victory'): Character {
    if (endedReason !== 'victory' || dungeon.isHunt) return c;
    const clearedDungeons = c.clearedDungeons?.includes(dungeon.id) ? c.clearedDungeons : [...(c.clearedDungeons ?? []), dungeon.id];
    const clearedNightmareDungeons = !dungeon.isNightmare || c.clearedNightmareDungeons?.includes(dungeon.id)
      ? c.clearedNightmareDungeons ?? []
      : [...(c.clearedNightmareDungeons ?? []), dungeon.id];
    return { ...c, clearedDungeons, clearedNightmareDungeons };
  }

  function handleRunEnd(finalCharacterIn: Character, depthReached: number, endedReason: 'death' | 'retreat' | 'victory', runStats: RunStats) {
    const finalCharacter = withDungeonClear(finalCharacterIn, endedReason);
    onRunEnd(finalCharacter, depthReached, endedReason, prestigeGain(finalCharacter, dungeon, endedReason));
    setSection('kingdom');
    setRunInProgress(false);
    // This is the sequence's last leg (DungeonPanel only ever routes here
    // instead of onRestart once repeatProgress.current has reached its
    // total, or the player retreated/hit "Parar Sequência") — fold this
    // attempt in and freeze the total as the summary to show.
    if (repeatPlan) {
      setRepeatSummary(mergeRunIntoPlan(repeatPlan, endedReason, runStats));
      setRepeatPlan(null);
    }
  }

  // Same finalization as handleRunEnd, but stays in the dungeon section and
  // remounts DungeonPanel on the same dungeon instead of going to the
  // kingdom — the "Reiniciar Masmorra" shortcut on the ended screen, and
  // also what a "repetir automaticamente" sequence's non-final attempts
  // auto-advance through (see DungeonPanel's repeatProgress effect).
  function handleRestartDungeon(finalCharacterIn: Character, depthReached: number, endedReason: 'death' | 'retreat' | 'victory', runStats: RunStats) {
    const finalCharacter = withDungeonClear(finalCharacterIn, endedReason);
    onRunEnd(finalCharacter, depthReached, endedReason, prestigeGain(finalCharacter, dungeon, endedReason));
    setDungeonRunKey((k) => k + 1);
    if (repeatPlan) {
      const merged = mergeRunIntoPlan(repeatPlan, endedReason, runStats);
      setRepeatPlan({ ...merged, current: merged.current + 1 });
    }
  }

  // Sidebar navigation and "Abandonar" get routed through these while a run
  // is in progress, so leaving any way other than the DungeonPanel's own
  // retreat flow (which heals + records the run via handleRunEnd above)
  // requires an explicit confirmation — and forfeits that safety net.
  function attemptNavigate(next: Section) {
    if (runInProgress && section === 'dungeon') { setNavConfirmTarget(next); return; }
    setSection(next);
  }
  function attemptAbandon() {
    if (runInProgress && section === 'dungeon') { setNavConfirmTarget('abandon'); return; }
    onAbandon();
  }
  function confirmForcedNav() {
    if (navConfirmTarget === 'abandon') onAbandon();
    else if (navConfirmTarget) setSection(navConfirmTarget);
    setRunInProgress(false);
    setNavConfirmTarget(null);
    // Forcing a way out mid-run also cuts short any repeat sequence in
    // progress — DungeonPanel is about to unmount, so nothing would ever
    // resolve it otherwise. No partial summary; the next sequence starts
    // clean regardless (confirmDungeonEntry always resets both anyway).
    setRepeatPlan(null);
  }

  function handleBuyPotion() {
    const cost = potionBasePrice(highestAccessibleItemTier(character));
    if (character.gold < cost || character.potions >= MAX_POTIONS) return;
    onCharacterChange({ ...character, gold: character.gold - cost, potions: character.potions + 1 });
    playBuySellSfx();
  }

  function handleSetPotionThreshold(pct: number) {
    onCharacterChange({ ...character, potionThreshold: pct });
  }

  function handleEquip(item: EquipmentItem) {
    const prevEquipped = character.equipment[item.slot];
    // Free the incoming item's own cells first, then place the outgoing one
    // — swapping two same-slot items (almost always the common case) nets
    // out to the same footprint, so this practically always finds room
    // without needing to gate it behind the 50-cell cap like new pickups.
    let inventory = character.inventory.filter((i) => i.id !== item.id);
    if (prevEquipped) inventory = placeInInventory(inventory, prevEquipped);
    onCharacterChange({ ...character, equipment: { ...character.equipment, [item.slot]: item }, inventory });
  }

  function handleUnequip(slot: ItemSlot) {
    const item = character.equipment[slot];
    if (!item) return;
    onCharacterChange({ ...character, equipment: { ...character.equipment, [slot]: null }, inventory: placeInInventory(character.inventory, item) });
  }

  function handleSellItem(item: EquipmentItem) {
    const inventory = character.inventory.filter((i) => i.id !== item.id);
    onCharacterChange({ ...character, inventory, gold: character.gold + sellValue(item) });
    playBuySellSfx();
  }

  // 1 ouro por runa, não importa raridade/tier — runas dropam bem mais que
  // equipamento (ver RUNE_DROP_CHANCE_REGULAR/BOSS), então isso é só um jeito
  // de não deixar sobra acumulando pra sempre, não uma fonte de ouro de
  // verdade.
  function handleSellRunes(rarity: Rarity, tier: number, count: number) {
    const stack = character.runes.find((r) => r.rarity === rarity && r.tier === tier);
    if (!stack || count <= 0 || count > stack.count) return;
    const runes = count >= stack.count
      ? character.runes.filter((r) => !(r.rarity === rarity && r.tier === tier))
      : character.runes.map((r) => (r.rarity === rarity && r.tier === tier ? { ...r, count: r.count - count } : r));
    onCharacterChange({ ...character, gold: character.gold + count, runes });
    playBuySellSfx();
  }

  // Gold is spent on the ATTEMPT, not the outcome — success rolls against
  // successChanceForLevel(item.enhanceLevel) and gets steeper near +10, so a
  // failed roll still costs the gold. The item's level never drops on a
  // failed roll (Forja never breaks or regresses gear) — a fail only costs
  // what was already spent on the attempt.
  //
  // On a SUCCESS, exactly one affix also improves (see applyAffixGrowth in
  // lib/enhancement.ts): `runeChoice` (from the Ferreiro's rune picker) lets
  // the player consume a Runa de Aprimoramento to pick which one — or, on an
  // item with zero affixes, to roll it a brand-new one instead (see
  // rollAffixForItem) — omitting it falls back to improving a random
  // existing affix (a no-op on a zero-affix item). Returns the roll result
  // so callers (the Ferreiro's confirm/roll screen) can react to it;
  // undefined means the attempt couldn't even be made (shouldn't happen
  // since the UI already disables the button in that case).
  function handleEnhanceItem(
    item: EquipmentItem, runeChoice?: { rune: RuneStack; affixIndex?: number },
  ): { success: boolean } | undefined {
    if (item.enhanceLevel >= MAX_ENHANCE_LEVEL) return undefined;
    const cost = enhanceCost(item);
    if (character.gold < cost) return undefined;
    if (runeChoice && !canUseRuneOn(runeChoice.rune, item)) return undefined;
    const success = Math.random() < successChanceForLevel(item.enhanceLevel);

    let upgraded = item;
    if (success) {
      if (runeChoice) {
        upgraded = item.secondaryStats.length === 0
          ? (() => {
              const rolled = rollAffixForItem(item);
              return rolled ? { ...item, secondaryStats: [...item.secondaryStats, rolled] } : item;
            })()
          : applyAffixGrowth(item, runeChoice.affixIndex ?? 0);
      } else if (item.secondaryStats.length > 0) {
        upgraded = applyAffixGrowth(item, Math.floor(Math.random() * item.secondaryStats.length));
      }
      upgraded = { ...upgraded, enhanceLevel: item.enhanceLevel + 1 };
    }

    const runes = runeChoice ? removeRune(character.runes, runeChoice.rune.rarity, runeChoice.rune.tier) : character.runes;
    const equippedSlot = character.equipment[item.slot]?.id === item.id ? item.slot : null;
    if (equippedSlot) {
      onCharacterChange({ ...character, gold: character.gold - cost, runes, equipment: { ...character.equipment, [equippedSlot]: upgraded } });
    } else {
      onCharacterChange({
        ...character, gold: character.gold - cost, runes,
        inventory: character.inventory.map((i) => (i.id === item.id ? upgraded : i)),
      });
    }
    return { success };
  }

  // Undoes every gold-funded push on `item` back to +0 (see resetItem in
  // lib/enhancement.ts) — costs gold scaled to how much was actually undone
  // (resetItemCost), refunds nothing already spent getting there.
  function handleResetItem(item: EquipmentItem): void {
    if (item.enhanceLevel <= 0) return;
    const cost = resetItemCost(item);
    if (character.gold < cost) return;
    const reset = resetItem(item);
    const equippedSlot = character.equipment[item.slot]?.id === item.id ? item.slot : null;
    if (equippedSlot) {
      onCharacterChange({ ...character, gold: character.gold - cost, equipment: { ...character.equipment, [equippedSlot]: reset } });
    } else {
      onCharacterChange({ ...character, gold: character.gold - cost, inventory: character.inventory.map((i) => (i.id === item.id ? reset : i)) });
    }
  }

  function handleAllocateAttrs(deltas: Partial<Record<AttributeKey, number>>) {
    const total = Object.values(deltas).reduce((s, n) => s + (n ?? 0), 0);
    if (total <= 0 || total > character.attributePoints) return;
    const nextAllocated = { ...character.allocatedAttrs };
    for (const key of Object.keys(deltas) as AttributeKey[]) {
      nextAllocated[key] += deltas[key] ?? 0;
    }
    onCharacterChange({
      ...character,
      attributePoints: character.attributePoints - total,
      allocatedAttrs: nextAllocated,
    });
  }

  function handleUnlockSkill(nodeId: string) {
    if (character.skillPoints <= 0 || character.unlockedSkills.includes(nodeId)) return;
    onCharacterChange({
      ...character,
      skillPoints: character.skillPoints - 1,
      unlockedSkills: [...character.unlockedSkills, nodeId],
    });
  }

  // 300 ouro por ponto já alocado (1 ponto = 300, 2 = 600...) — refunds every
  // point spent so far and clears the loadout (an equipped ability's
  // unlocking node no longer exists once unlockedSkills is wiped, so it has
  // to go too).
  const SKILL_RESET_COST_PER_POINT = 300;
  const skillResetCost = SKILL_RESET_COST_PER_POINT * character.unlockedSkills.length;
  function handleResetSkills() {
    if (character.unlockedSkills.length === 0 || character.gold < skillResetCost) return;
    onCharacterChange({
      ...character,
      gold: character.gold - skillResetCost,
      skillPoints: character.skillPoints + character.unlockedSkills.length,
      unlockedSkills: [],
      equippedAbilities: [],
    });
  }

  function handleEquipAbility(abilityId: string) {
    if (character.equippedAbilities.includes(abilityId) || character.equippedAbilities.length >= MAX_EQUIPPED_ABILITIES) return;
    onCharacterChange({ ...character, equippedAbilities: [...character.equippedAbilities, abilityId] });
  }

  function handleUnequipAbility(abilityId: string) {
    onCharacterChange({ ...character, equippedAbilities: character.equippedAbilities.filter((id) => id !== abilityId) });
  }

  function handleReorderAbility(index: number, dir: -1 | 1) {
    const list = [...character.equippedAbilities];
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    onCharacterChange({ ...character, equippedAbilities: list });
  }

  function handleSetAbilityThreshold(abilityId: string, pct: number) {
    onCharacterChange({ ...character, abilityThresholds: { ...character.abilityThresholds, [abilityId]: pct } });
  }

  // Baú de Armazém — account-wide (see App.tsx's onVaultChange), so these
  // move an item between `character.inventory` (this slot only) and
  // `profile.vaultItems` (shared across every slot on the account) instead
  // of between two character-scoped lists. The Baú's own "Sua Mochila" tab
  // also lists equipped items (with an "Equipado" badge, confirmed before
  // acting on one) — depositing one has to actually unequip it here, or
  // it'd stay worn AND get duplicated into the vault.
  function handleDepositToVault(item: EquipmentItem) {
    const equippedSlot = character.equipment[item.slot]?.id === item.id ? item.slot : null;
    onCharacterChange({
      ...character,
      inventory: character.inventory.filter((i) => i.id !== item.id),
      equipment: equippedSlot ? { ...character.equipment, [equippedSlot]: null } : character.equipment,
    });
    onVaultChange([...profile.vaultItems, { ...item, gridX: undefined, gridY: undefined }]);
  }
  function handleWithdrawFromVault(item: EquipmentItem) {
    if (!canFitInInventory(character.inventory, item.slot)) return;
    onVaultChange(profile.vaultItems.filter((i) => i.id !== item.id));
    onCharacterChange({ ...character, inventory: placeInInventory(character.inventory, item) });
  }

  return (
    <div
      className="flex-1 flex flex-col bg-nightsky"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(120,90,50,0.10) 0%, transparent 60%), radial-gradient(ellipse 90% 60% at 50% 100%, rgba(0,0,0,0.4) 0%, transparent 70%)',
      }}
    >
      <TopBar character={character} accentColor={findCosmetic(profile.equippedCosmetic)?.color} onMenuClick={() => setMenuOpen((o) => !o)} />
      <div className="flex flex-1">
        <Sidebar
          section={section}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          onNavigate={attemptNavigate}
          onAbandon={attemptAbandon}
          onSignOut={onSignOut}
        />
        <main className="relative flex-1 p-3 sm:p-5 max-w-3xl min-w-0 overflow-hidden">
          <EmblemWatermark />
          {section === 'kingdom' && <KingdomOverview character={character} />}
          {section === 'buildings' && (
            <KingdomBuildings
              onOpenFerreiro={() => setFerreiroOpen(true)}
              onOpenMercador={handleOpenMercador}
              onOpenBau={() => setBauOpen(true)}
            />
          )}
          {section === 'character' && (
            <CharacterOverview
              character={character}
              onEquip={handleEquip}
              onUnequip={handleUnequip}
              onSell={handleSellItem}
              onAllocateAttrs={handleAllocateAttrs}
              onSellRunes={handleSellRunes}
            />
          )}
          {section === 'skills' && (
            <SkillTree
              character={character}
              onUnlock={handleUnlockSkill}
              onEquipAbility={handleEquipAbility}
              onUnequipAbility={handleUnequipAbility}
              onReorderAbility={handleReorderAbility}
              onResetSkills={handleResetSkills}
              resetCost={skillResetCost}
            />
          )}
          {section === 'highscore' && <RankingScreen ranking={ranking} debugError={rankingError} />}
          {section === 'dungeon-select' && <DungeonMap character={character} onEnterDungeon={selectDungeon} />}
          {section === 'hunts' && <HuntHall character={character} onEnterHunt={selectDungeon} />}
          {section === 'prestige-shop' && (
            <PrestigeShop profile={profile} onBuy={onBuyCosmetic} onEquip={onEquipCosmetic} />
          )}
          {section === 'bestiary' && <Bestiario character={character} />}
          {section === 'titles' && (
            <Titulos character={character} onEquip={(id) => onCharacterChange({ ...character, equippedTitle: id })} />
          )}
          {section === 'dungeon' && (
            <DungeonPanel
              key={dungeonRunKey}
              character={character}
              dungeon={dungeon}
              onLiveUpdate={onCharacterChange}
              onRunEnd={handleRunEnd}
              onRestart={handleRestartDungeon}
              autoSellRarities={autoSellRarities}
              noPotions={noPotionsArmed}
              repeatCurrent={repeatPlan?.current}
              repeatTotal={repeatPlan?.total}
            />
          )}
        </main>
      </div>

      {ferreiroOpen && (
        <Ferreiro
          character={character}
          onEnhance={handleEnhanceItem}
          onReset={handleResetItem}
          onSellRunes={handleSellRunes}
          onClose={() => setFerreiroOpen(false)}
        />
      )}

      {mercadorOpen && (
        <Mercador
          character={character}
          onBuyPotion={handleBuyPotion}
          onCharacterChange={onCharacterChange}
          onSellRunes={handleSellRunes}
          onClose={() => setMercadorOpen(false)}
        />
      )}

      {bauOpen && (
        <Bau
          character={character}
          vaultItems={profile.vaultItems}
          onDeposit={handleDepositToVault}
          onWithdraw={handleWithdrawFromVault}
          onSellRunes={handleSellRunes}
          onClose={() => setBauOpen(false)}
        />
      )}

      {pendingDungeon && (
        <DungeonLoadout
          character={character}
          dungeon={pendingDungeon}
          onEquipAbility={handleEquipAbility}
          onUnequipAbility={handleUnequipAbility}
          onReorderAbility={handleReorderAbility}
          onSetAbilityThreshold={handleSetAbilityThreshold}
          onSetPotionThreshold={handleSetPotionThreshold}
          onConfirm={confirmDungeonEntry}
          onCancel={cancelDungeonSelect}
          nightmareUnlocked={!pendingDungeon.isHunt && (character.clearedDungeons?.includes(pendingDungeon.id) ?? false)}
          nightmareArmed={nightmareArmed}
          onToggleNightmare={setNightmareArmed}
          repeatCount={repeatChoice}
          onSetRepeatCount={setRepeatChoice}
          autoSellRarities={autoSellRarities}
          onToggleAutoSellRarity={toggleAutoSellRarity}
          noPotionsArmed={noPotionsArmed}
          onToggleNoPotions={setNoPotionsArmed}
        />
      )}

      {repeatSummary && (
        <Modal
          title="Resumo da Expedição"
          onClose={() => setRepeatSummary(null)}
          footer={<SmallButton onClick={() => setRepeatSummary(null)}>Fechar</SmallButton>}
        >
          <div>
            <SummaryRow label="Corridas realizadas" value={`${repeatSummary.current}/${repeatSummary.total}`} />
            <SummaryRow label="Vitórias" value={repeatSummary.wins} />
            <SummaryRow label="Mortes" value={repeatSummary.deaths} />
            {repeatSummary.retreats > 0 && <SummaryRow label="Recuos" value={repeatSummary.retreats} />}
            <SummaryRow label="Inimigos derrotados" value={repeatSummary.stats.kills} />
            <SummaryRow label="XP ganho" value={repeatSummary.stats.xpGained} />
            <SummaryRow label="Ouro de inimigos" value={repeatSummary.stats.goldFromKills} />
            {repeatSummary.stats.itemsAutoSold > 0 && (
              <SummaryRow label="Ouro de itens vendidos" value={repeatSummary.stats.goldFromAutoSell} />
            )}
            <SummaryRow label="Ouro total" value={repeatSummary.stats.goldFromKills + repeatSummary.stats.goldFromAutoSell} />
            <SummaryRow label="Itens obtidos" value={repeatSummary.stats.itemsDropped - repeatSummary.stats.itemsAutoSold} />
            {repeatSummary.stats.itemsAutoSold > 0 && (
              <SummaryRow label="Itens vendidos automaticamente" value={repeatSummary.stats.itemsAutoSold} />
            )}
          </div>
        </Modal>
      )}

      {navConfirmTarget && (
        <Modal
          title="Sair da Expedição?"
          onClose={() => setNavConfirmTarget(null)}
          footer={
            <>
              <SmallButton onClick={() => setNavConfirmTarget(null)} variant="ghost">Continuar na Masmorra</SmallButton>
              <SmallButton onClick={confirmForcedNav}>Sair Mesmo Assim</SmallButton>
            </>
          }
        >
          <p>
            Se você sair agora, perderá o progresso desta expedição — sem cura garantida e sem registrar a
            profundidade alcançada no ranking. Na próxima vez você terá que recomeçar do início.
          </p>
        </Modal>
      )}
    </div>
  );
}
