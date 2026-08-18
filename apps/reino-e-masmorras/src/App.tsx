import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { Character, RankEntry, Screen } from './types/game';
import { loadCharacter, saveCharacter, clearCharacter } from './lib/storage';
import { supabase } from './lib/supabaseClient';
import { fetchCloudCharacter, saveCloudCharacter, deleteCloudCharacter, fetchGlobalRanking, insertGlobalRankEntry } from './lib/cloudSave';
import { armBackgroundMusic } from './lib/audio';
import { TitleScreen } from './components/TitleScreen';
import { AuthScreen } from './components/AuthScreen';
import { CharacterCreation } from './components/CharacterCreation';
import { GameShell } from './components/GameShell';
import { ScreenFrame } from './components/ScreenFrame';

export default function App() {
  const [screen, setScreen] = useState<Screen>('title');
  const [session, setSession] = useState<Session | null | undefined>(undefined); // undefined = still checking
  const [character, setCharacter] = useState<Character | null>(null);
  const [charLoading, setCharLoading] = useState(true);
  const [ranking, setRanking] = useState<RankEntry[]>([]);

  // Autoplay is blocked until the player interacts with the page at all —
  // this arms a one-time listener so the kingdom loop starts on whatever
  // they touch first (even the title splash's skip tap), instead of
  // needing its own dedicated "enable sound" button.
  useEffect(() => { armBackgroundMusic(); }, []);

  // Supabase's own listener is the single source of truth for the session —
  // it fires once immediately with whatever's already in storage (or null),
  // then again on every sign-in/sign-out, so there's no separate "check on
  // mount" call needed.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Once signed in, the cloud save is authoritative. If the account has
  // none yet (first login ever) but this browser already has a local save
  // from before accounts existed, that local progress is uploaded once as
  // a one-time migration instead of silently discarded.
  useEffect(() => {
    if (!session) { setCharLoading(false); return; }
    let cancelled = false;
    setCharLoading(true);
    (async () => {
      const cloud = await fetchCloudCharacter(session.user.id);
      if (cancelled) return;
      if (cloud) {
        setCharacter(cloud);
        saveCharacter(cloud);
      } else {
        const local = loadCharacter();
        if (local) {
          await saveCloudCharacter(session.user.id, local);
          if (cancelled) return;
        }
        setCharacter(local);
      }
      setCharLoading(false);
    })();
    return () => { cancelled = true; };
  }, [session]);

  useEffect(() => {
    fetchGlobalRanking().then(setRanking);
  }, []);

  function persist(c: Character) {
    setCharacter(c);
    saveCharacter(c);
    if (session) saveCloudCharacter(session.user.id, c);
  }

  function handleCreated(c: Character) {
    persist(c);
    setScreen('game');
  }

  function handleRunEnd(finalCharacter: Character, depthReached: number) {
    const healed = { ...finalCharacter, hp: finalCharacter.maxHp };
    persist(healed);
    const entry: RankEntry = {
      name: healed.name, classId: healed.classId, depth: depthReached,
      level: healed.level, date: new Date().toISOString().slice(0, 10),
    };
    if (session) {
      insertGlobalRankEntry(session.user.id, entry).then(() => fetchGlobalRanking().then(setRanking));
    }
  }

  function handleAbandon() {
    clearCharacter();
    if (session) deleteCloudCharacter(session.user.id);
    setCharacter(null);
    setScreen('create');
  }

  function handleSignOut() {
    supabase.auth.signOut();
    setCharacter(null);
    setScreen('title');
  }

  if (session === undefined || (session && charLoading)) {
    return (
      <ScreenFrame>
        <div className="flex-1 flex items-center justify-center bg-nightsky text-parchment/50 text-sm">Carregando...</div>
      </ScreenFrame>
    );
  }

  if (!session) {
    return (
      <ScreenFrame>
        <AuthScreen />
      </ScreenFrame>
    );
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
          onSignOut={handleSignOut}
        />
      );
      break;
  }

  return <ScreenFrame>{content}</ScreenFrame>;
}
