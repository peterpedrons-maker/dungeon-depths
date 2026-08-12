import { useState } from 'react';
import { Character, RankEntry, Section, DungeonDef, Weapon } from '../types/game';
import { DUNGEONS } from '../lib/dungeons';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { KingdomOverview } from './KingdomOverview';
import { CharacterOverview } from './CharacterOverview';
import { SkillTree } from './SkillTree';
import { Merchant } from './Merchant';
import { RankingScreen } from './RankingScreen';
import { DungeonPanel } from './DungeonPanel';

const POTION_COST = 15;

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

  function handleEquip(weapon: Weapon) {
    const prevEquipped = character.equipment.weapon;
    const inventory = character.inventory.filter((w) => w.id !== weapon.id);
    if (prevEquipped) inventory.push(prevEquipped);
    onCharacterChange({ ...character, equipment: { weapon }, inventory });
  }

  function handleUnlockSkill(nodeId: string) {
    if (character.skillPoints <= 0 || character.unlockedSkills.includes(nodeId)) return;
    onCharacterChange({
      ...character,
      skillPoints: character.skillPoints - 1,
      unlockedSkills: [...character.unlockedSkills, nodeId],
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-nightsky">
      <TopBar character={character} />
      <div className="flex flex-1">
        <Sidebar section={section} onNavigate={setSection} onEnterDungeon={enterDungeon} onAbandon={onAbandon} />
        <main className="flex-1 p-5 max-w-3xl">
          {section === 'kingdom' && <KingdomOverview character={character} />}
          {section === 'character' && <CharacterOverview character={character} onEquip={handleEquip} />}
          {section === 'skills' && <SkillTree character={character} onUnlock={handleUnlockSkill} />}
          {section === 'merchant' && <Merchant character={character} onBuyPotion={handleBuyPotion} onCharacterChange={onCharacterChange} />}
          {section === 'highscore' && <RankingScreen ranking={ranking} />}
          {section === 'dungeon' && (
            <DungeonPanel
              character={character}
              dungeon={dungeon}
              onLiveUpdate={onCharacterChange}
              onRunEnd={handleRunEnd}
            />
          )}
        </main>
      </div>
    </div>
  );
}
