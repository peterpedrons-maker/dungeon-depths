import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { Character, RankEntry, Screen } from './types/game';
import { loadCharacter, saveCharacter, clearCharacter, MAX_CHARACTER_SLOTS } from './lib/storage';
import { supabase } from './lib/supabaseClient';
import { fetchCloudCharacterSlots, saveCloudCharacter, deleteCloudCharacter, fetchGlobalRanking, insertGlobalRankEntry } from './lib/cloudSave';
import { armBackgroundMusic } from './lib/audio';
import { TitleScreen } from './components/TitleScreen';
import { AuthScreen } from './components/AuthScreen';
import { CharacterSelect } from './components/CharacterSelect';
import { CharacterCreation } from './components/CharacterCreation';
import { GameShell } from './components/GameShell';
import { ScreenFrame } from './components/ScreenFrame';

const EMPTY_SLOTS: (Character | null)[] = Array(MAX_CHARACTER_SLOTS).fill(null);

export default function App() {
  const [screen, setScreen] = useState<Screen>('title');
  const [session, setSession] = useState<Session | null | undefined>(undefined); // undefined = still checking
  const [slots, setSlots] = useState<(Character | null)[]>(EMPTY_SLOTS);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [ranking, setRanking] = useState<RankEntry[]>([]);

  const character = activeSlot !== null ? slots[activeSlot] : null;

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

  // Once signed in, the cloud save is authoritative for every slot. A slot
  // with no cloud row yet but a local save from before accounts (or before
  // multiple slots) existed gets uploaded once as a one-time migration
  // instead of silently discarded — loadCharacter(0) itself already falls
  // back to the old single-save key, so this naturally picks up an account's
  // very first pre-existing character into slot 0.
  useEffect(() => {
    if (!session) { setSlotsLoading(false); return; }
    let cancelled = false;
    setSlotsLoading(true);
    (async () => {
      const cloudMap = await fetchCloudCharacterSlots(session.user.id);
      if (cancelled) return;
      const next: (Character | null)[] = [];
      for (let slot = 0; slot < MAX_CHARACTER_SLOTS; slot++) {
        let c = cloudMap.get(slot) ?? null;
        if (c) {
          saveCharacter(slot, c);
        } else {
          const local = loadCharacter(slot);
          if (local) {
            await saveCloudCharacter(session.user.id, slot, local);
            if (cancelled) return;
            c = local;
          }
        }
        next.push(c);
      }
      if (cancelled) return;
      setSlots(next);
      setSlotsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [session]);

  useEffect(() => {
    fetchGlobalRanking().then(setRanking);
  }, []);

  function persist(c: Character) {
    if (activeSlot === null) return;
    setSlots((prev) => prev.map((old, i) => (i === activeSlot ? c : old)));
    saveCharacter(activeSlot, c);
    if (session) saveCloudCharacter(session.user.id, activeSlot, c);
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

  // Wipes the currently active hero for good and drops back to the
  // character-select hub — used by the Sidebar's "Abandonar Herói".
  function handleAbandon() {
    if (activeSlot === null) { setScreen('select'); return; }
    clearCharacter(activeSlot);
    if (session) deleteCloudCharacter(session.user.id, activeSlot);
    setSlots((prev) => prev.map((c, i) => (i === activeSlot ? null : c)));
    setActiveSlot(null);
    setScreen('select');
  }

  // Same wipe, but for a slot picked straight from the select screen — the
  // player never has to open a hero just to delete it.
  function handleDeleteSlot(slot: number) {
    clearCharacter(slot);
    if (session) deleteCloudCharacter(session.user.id, slot);
    setSlots((prev) => prev.map((c, i) => (i === slot ? null : c)));
  }

  function handleSignOut() {
    supabase.auth.signOut();
    setActiveSlot(null);
    setSlots(EMPTY_SLOTS);
    setScreen('title');
  }

  if (session === undefined || (session && slotsLoading)) {
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
      content = <TitleScreen onEnter={() => setScreen('select')} />;
      break;
    case 'select':
      content = (
        <CharacterSelect
          slots={slots}
          onSelect={(slot) => { setActiveSlot(slot); setScreen('game'); }}
          onCreateNew={(slot) => { setActiveSlot(slot); setScreen('create'); }}
          onDelete={handleDeleteSlot}
        />
      );
      break;
    case 'create':
      content = <CharacterCreation onCreated={handleCreated} />;
      break;
    case 'game':
      if (!character) { setScreen('select'); break; }
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
