import { useState } from 'react';
import { AttributeKey, Character, RankEntry, Section, DungeonDef, EquipmentItem, ItemSlot } from '../types/game';
import { DUNGEONS } from '../lib/dungeons';
import { BUILDINGS, computeKingdomBonuses } from '../lib/buildings';
import { sellValue } from '../lib/equipment';
import { enhanceCost, maxEnhanceLevelForForja, successChanceForLevel } from '../lib/enhancement';
import { MAX_EQUIPPED_ABILITIES } from '../lib/skills';
import { MAX_POTIONS } from '../lib/consumables';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { KingdomOverview } from './KingdomOverview';
import { KingdomBuildings } from './KingdomBuildings';
import { CharacterOverview } from './CharacterOverview';
import { SkillTree } from './SkillTree';
import { Merchant } from './Merchant';
import { RankingScreen } from './RankingScreen';
import { DungeonMap } from './DungeonMap';
import { DungeonLoadout } from './DungeonLoadout';
import { DungeonPanel } from './DungeonPanel';
import { Ferreiro } from './Ferreiro';
import { Modal } from './Modal';
import { SmallButton } from './Button';

const POTION_COST = 15;

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
  onCharacterChange: (c: Character) => void;
  onRunEnd: (finalCharacter: Character, depthReached: number) => void;
  onAbandon: () => void;
}

export function GameShell({ character, ranking, onCharacterChange, onRunEnd, onAbandon }: Props) {
  const [section, setSection] = useState<Section>('kingdom');
  const [dungeon, setDungeon] = useState<DungeonDef>(DUNGEONS[0]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingDungeon, setPendingDungeon] = useState<DungeonDef | null>(null);
  const [runInProgress, setRunInProgress] = useState(false);
  const [navConfirmTarget, setNavConfirmTarget] = useState<Section | 'abandon' | null>(null);
  const [ferreiroOpen, setFerreiroOpen] = useState(false);

  const kingdomBonuses = computeKingdomBonuses(character.buildings);

  function enterDungeon(d: DungeonDef) {
    setDungeon(d);
    setSection('dungeon');
  }

  // Clicking a map marker only stages the choice — the run doesn't actually
  // start (and the retreat-penalty guard doesn't arm) until the loadout
  // screen's "Iniciar Expedição" is confirmed.
  function selectDungeon(d: DungeonDef) { setPendingDungeon(d); }
  function cancelDungeonSelect() { setPendingDungeon(null); }
  function confirmDungeonEntry() {
    if (!pendingDungeon) return;
    enterDungeon(pendingDungeon);
    setPendingDungeon(null);
    setRunInProgress(true);
  }

  function handleRunEnd(finalCharacter: Character, depthReached: number) {
    onRunEnd(finalCharacter, depthReached);
    setSection('kingdom');
    setRunInProgress(false);
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
  }

  function handleBuyPotion() {
    if (character.gold < POTION_COST || character.potions >= MAX_POTIONS) return;
    onCharacterChange({ ...character, gold: character.gold - POTION_COST, potions: character.potions + 1 });
  }

  function handleSetPotionThreshold(pct: number) {
    onCharacterChange({ ...character, potionThreshold: pct });
  }

  function handleEquip(item: EquipmentItem) {
    const prevEquipped = character.equipment[item.slot];
    const inventory = character.inventory.filter((i) => i.id !== item.id);
    if (prevEquipped) inventory.push(prevEquipped);
    onCharacterChange({ ...character, equipment: { ...character.equipment, [item.slot]: item }, inventory });
  }

  function handleUnequip(slot: ItemSlot) {
    const item = character.equipment[slot];
    if (!item) return;
    onCharacterChange({ ...character, equipment: { ...character.equipment, [slot]: null }, inventory: [...character.inventory, item] });
  }

  function handleSellItem(item: EquipmentItem) {
    const inventory = character.inventory.filter((i) => i.id !== item.id);
    onCharacterChange({ ...character, inventory, gold: character.gold + sellValue(item) });
  }

  // Gold is spent on the ATTEMPT, not the outcome — success rolls against
  // successChanceForLevel(item.enhanceLevel) and gets steeper near +10, so a
  // failed roll still costs the gold but leaves the item at its current
  // level. Returns the roll result so callers (the Ferreiro's confirm/roll
  // screen, CharacterOverview's quick modal) can react to it; undefined
  // means the attempt couldn't even be made (shouldn't happen since the UI
  // already disables the button in that case).
  function handleEnhanceItem(item: EquipmentItem): boolean | undefined {
    const forjaLevel = character.buildings.forja ?? 0;
    const cap = maxEnhanceLevelForForja(forjaLevel);
    if (item.enhanceLevel >= cap) return undefined;
    const cost = enhanceCost(item);
    if (character.gold < cost) return undefined;
    const success = Math.random() < successChanceForLevel(item.enhanceLevel);
    const upgraded = success ? { ...item, enhanceLevel: item.enhanceLevel + 1 } : item;
    const equippedSlot = character.equipment[item.slot]?.id === item.id ? item.slot : null;
    if (equippedSlot) {
      onCharacterChange({ ...character, gold: character.gold - cost, equipment: { ...character.equipment, [equippedSlot]: upgraded } });
    } else {
      onCharacterChange({
        ...character, gold: character.gold - cost,
        inventory: character.inventory.map((i) => (i.id === item.id ? upgraded : i)),
      });
    }
    return success;
  }

  function handleAllocateAttr(key: AttributeKey) {
    if (character.attributePoints <= 0) return;
    onCharacterChange({
      ...character,
      attributePoints: character.attributePoints - 1,
      allocatedAttrs: { ...character.allocatedAttrs, [key]: character.allocatedAttrs[key] + 1 },
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

  function handleUpgradeBuilding(buildingId: string) {
    const building = BUILDINGS.find((b) => b.id === buildingId);
    if (!building) return;
    const level = character.buildings[buildingId] ?? 0;
    if (level >= building.maxLevel) return;
    const cost = building.costForLevel(level);
    if (character.gold < cost) return;
    onCharacterChange({ ...character, gold: character.gold - cost, buildings: { ...character.buildings, [buildingId]: level + 1 } });
  }

  return (
    <div
      className="flex-1 flex flex-col bg-nightsky"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(120,90,50,0.10) 0%, transparent 60%), radial-gradient(ellipse 90% 60% at 50% 100%, rgba(0,0,0,0.4) 0%, transparent 70%)',
      }}
    >
      <TopBar character={character} onMenuClick={() => setMenuOpen((o) => !o)} />
      <div className="flex flex-1">
        <Sidebar
          section={section}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          onNavigate={attemptNavigate}
          onAbandon={attemptAbandon}
        />
        <main className="relative flex-1 p-3 sm:p-5 max-w-3xl min-w-0 overflow-hidden">
          <EmblemWatermark />
          {section === 'kingdom' && <KingdomOverview character={character} />}
          {section === 'buildings' && <KingdomBuildings character={character} onUpgrade={handleUpgradeBuilding} onOpenFerreiro={() => setFerreiroOpen(true)} />}
          {section === 'character' && (
            <CharacterOverview character={character} onEquip={handleEquip} onUnequip={handleUnequip} onSell={handleSellItem} onEnhance={handleEnhanceItem} onAllocateAttr={handleAllocateAttr} />
          )}
          {section === 'skills' && (
            <SkillTree
              character={character}
              onUnlock={handleUnlockSkill}
              onEquipAbility={handleEquipAbility}
              onUnequipAbility={handleUnequipAbility}
              onReorderAbility={handleReorderAbility}
            />
          )}
          {section === 'merchant' && <Merchant character={character} onBuyPotion={handleBuyPotion} onCharacterChange={onCharacterChange} />}
          {section === 'highscore' && <RankingScreen ranking={ranking} />}
          {section === 'dungeon-select' && <DungeonMap character={character} onEnterDungeon={selectDungeon} />}
          {section === 'dungeon' && (
            <DungeonPanel
              character={character}
              dungeon={dungeon}
              kingdomBonuses={kingdomBonuses}
              onLiveUpdate={onCharacterChange}
              onRunEnd={handleRunEnd}
            />
          )}
        </main>
      </div>

      {ferreiroOpen && (
        <Ferreiro character={character} onEnhance={handleEnhanceItem} onClose={() => setFerreiroOpen(false)} />
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
        />
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
