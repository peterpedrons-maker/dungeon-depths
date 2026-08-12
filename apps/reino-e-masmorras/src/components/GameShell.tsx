import { useState } from 'react';
import { Character, RankEntry, Section, DungeonDef, EquipmentItem, ItemSlot } from '../types/game';
import { DUNGEONS } from '../lib/dungeons';
import { BUILDINGS, computeKingdomBonuses } from '../lib/buildings';
import { sellValue } from '../lib/equipment';
import { MAX_EQUIPPED_ABILITIES } from '../lib/skills';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { KingdomOverview } from './KingdomOverview';
import { KingdomBuildings } from './KingdomBuildings';
import { CharacterOverview } from './CharacterOverview';
import { SkillTree } from './SkillTree';
import { Merchant } from './Merchant';
import { RankingScreen } from './RankingScreen';
import { DungeonPanel } from './DungeonPanel';

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

  const kingdomBonuses = computeKingdomBonuses(character.buildings);

  function enterDungeon(d: DungeonDef) {
    setDungeon(d);
    setSection('dungeon');
  }

  function handleRunEnd(finalCharacter: Character, depthReached: number) {
    onRunEnd(finalCharacter, depthReached);
    setSection('kingdom');
  }

  function handleBuyPotion() {
    if (character.gold < POTION_COST) return;
    onCharacterChange({ ...character, gold: character.gold - POTION_COST, potions: character.potions + 1 });
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
          onNavigate={setSection}
          onEnterDungeon={enterDungeon}
          onAbandon={onAbandon}
        />
        <main className="relative flex-1 p-3 sm:p-5 max-w-3xl min-w-0 overflow-hidden">
          <EmblemWatermark />
          {section === 'kingdom' && <KingdomOverview character={character} />}
          {section === 'buildings' && <KingdomBuildings character={character} onUpgrade={handleUpgradeBuilding} />}
          {section === 'character' && (
            <CharacterOverview character={character} onEquip={handleEquip} onUnequip={handleUnequip} onSell={handleSellItem} />
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
    </div>
  );
}
