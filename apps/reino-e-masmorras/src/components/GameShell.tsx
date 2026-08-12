import { useState } from 'react';
import { Character, RankEntry, Section } from '../types/game';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { KingdomOverview } from './KingdomOverview';
import { CharacterOverview } from './CharacterOverview';
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
  const [dungeonStartDepth, setDungeonStartDepth] = useState(1);

  function enterDungeon(startDepth: number) {
    setDungeonStartDepth(startDepth);
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

  return (
    <div className="min-h-screen flex flex-col bg-nightsky">
      <TopBar character={character} />
      <div className="flex flex-1">
        <Sidebar section={section} onNavigate={setSection} onEnterDungeon={enterDungeon} onAbandon={onAbandon} />
        <main className="flex-1 p-5 max-w-3xl">
          {section === 'kingdom' && <KingdomOverview character={character} />}
          {section === 'character' && <CharacterOverview character={character} />}
          {section === 'merchant' && <Merchant character={character} onBuyPotion={handleBuyPotion} />}
          {section === 'highscore' && <RankingScreen ranking={ranking} />}
          {section === 'dungeon' && (
            <DungeonPanel character={character} startDepth={dungeonStartDepth} onRunEnd={handleRunEnd} />
          )}
        </main>
      </div>
    </div>
  );
}
