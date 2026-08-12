import { useState } from 'react';
import { Character, RankEntry, Screen } from './types/game';
import { loadCharacter, saveCharacter, clearCharacter, loadRanking, addRankEntry } from './lib/storage';
import { TitleScreen } from './components/TitleScreen';
import { CharacterCreation } from './components/CharacterCreation';
import { Hub } from './components/Hub';
import { DungeonPanel } from './components/DungeonPanel';
import { RankingScreen } from './components/RankingScreen';

const POTION_COST = 15;

export default function App() {
  const [screen, setScreen] = useState<Screen>('title');
  const [character, setCharacter] = useState<Character | null>(() => loadCharacter());
  const [ranking, setRanking] = useState<RankEntry[]>(() => loadRanking());

  function persist(c: Character) {
    setCharacter(c);
    saveCharacter(c);
  }

  function handleCreated(c: Character) {
    persist(c);
    setScreen('hub');
  }

  function handleRunEnd(finalCharacter: Character, depthReached: number) {
    const healed = { ...finalCharacter, hp: finalCharacter.maxHp };
    persist(healed);
    const updatedRanking = addRankEntry({
      name: healed.name, classId: healed.classId, depth: depthReached,
      level: healed.level, date: new Date().toISOString().slice(0, 10),
    });
    setRanking(updatedRanking);
    setScreen('hub');
  }

  function handleBuyPotion() {
    if (!character || character.gold < POTION_COST) return;
    persist({ ...character, gold: character.gold - POTION_COST, potions: character.potions + 1 });
  }

  function handleNewGame() {
    clearCharacter();
    setCharacter(null);
    setScreen('create');
  }

  switch (screen) {
    case 'title':
      return (
        <TitleScreen
          hasCharacter={!!character}
          onContinue={() => setScreen('hub')}
          onNewGame={handleNewGame}
          onRanking={() => setScreen('ranking')}
        />
      );
    case 'create':
      return <CharacterCreation onCreated={handleCreated} />;
    case 'hub':
      if (!character) { setScreen('create'); return null; }
      return (
        <Hub
          character={character}
          onEnterDungeon={() => setScreen('dungeon')}
          onBuyPotion={handleBuyPotion}
          onRanking={() => setScreen('ranking')}
          onNewGame={handleNewGame}
        />
      );
    case 'dungeon':
      if (!character) { setScreen('create'); return null; }
      return <DungeonPanel character={character} onRunEnd={handleRunEnd} />;
    case 'ranking':
      return <RankingScreen ranking={ranking} onBack={() => setScreen(character ? 'hub' : 'title')} />;
    default:
      return null;
  }
}
