import { useState } from 'react';
import { Character, RankEntry, Screen } from './types/game';
import { loadCharacter, saveCharacter, clearCharacter, loadRanking, addRankEntry } from './lib/storage';
import { TitleScreen } from './components/TitleScreen';
import { CharacterCreation } from './components/CharacterCreation';
import { GameShell } from './components/GameShell';
import { ScreenFrame } from './components/ScreenFrame';

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
    setScreen('game');
  }

  function handleRunEnd(finalCharacter: Character, depthReached: number) {
    const healed = { ...finalCharacter, hp: finalCharacter.maxHp };
    persist(healed);
    const updatedRanking = addRankEntry({
      name: healed.name, classId: healed.classId, depth: depthReached,
      level: healed.level, date: new Date().toISOString().slice(0, 10),
    });
    setRanking(updatedRanking);
  }

  function handleAbandon() {
    clearCharacter();
    setCharacter(null);
    setScreen('create');
  }

  let content: React.ReactNode = null;
  switch (screen) {
    case 'title':
      content = (
        <TitleScreen
          hasCharacter={!!character}
          onContinue={() => setScreen('game')}
          onNewGame={handleAbandon}
        />
      );
      break;
    case 'create':
      content = <CharacterCreation onCreated={handleCreated} />;
      break;
    case 'game':
      if (!character) { setScreen('create'); break; }
      content = (
        <GameShell
          character={character}
          ranking={ranking}
          onCharacterChange={persist}
          onRunEnd={handleRunEnd}
          onAbandon={handleAbandon}
        />
      );
      break;
  }

  return <ScreenFrame>{content}</ScreenFrame>;
}
