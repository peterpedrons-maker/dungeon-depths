import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { Character, ProfileState, RankEntry, Screen } from './types/game';
import { loadCharacter, saveCharacter, clearCharacter, loadProfile, saveProfileLocal, migrateCharacter, MAX_CHARACTER_SLOTS } from './lib/storage';
import { supabase } from './lib/supabaseClient';
import {
  fetchCloudCharacterSlots, saveCloudCharacter, deleteCloudCharacter, fetchGlobalRanking, insertGlobalRankEntry,
  fetchProfile, saveProfile, isCharacterNameTaken,
} from './lib/cloudSave';
import { COSMETICS } from './lib/cosmetics';
import { effectiveMaxHp, computeCombatPower } from './lib/combatStats';
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
  // Surfaced straight in the Ranking screen (see rankingError prop below) —
  // there's no way to reach browser devtools on a phone, so a failed
  // leaderboard write needs to be readable in the UI itself to be
  // diagnosable at all from a mobile session.
  const [rankingError, setRankingError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileState>(loadProfile());

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
  //
  // A momentary null session on some event OTHER than a real SIGNED_OUT used
  // to be treated exactly the same as an explicit sign-out — but Supabase can
  // fire the listener with a null session for a transient reason too (e.g. a
  // background tab's token refresh racing a phone's network reconnecting
  // right as the app comes back to the foreground), not just a real log-out.
  // Since `!session` unconditionally renders the login screen below, that
  // transient null was enough to yank the player out of GameShell — and any
  // dungeon run in progress with it — straight back to AuthScreen, which is
  // exactly what looked like "the run ends by itself" whenever the player
  // switched to another app and back. Only ever clear an established session
  // on a genuine SIGNED_OUT event (or the very first check, where there's
  // nothing to lose yet); any other null is ignored and the existing session
  // stays put.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession((prev) => {
        if (s) return s;
        if (event === 'SIGNED_OUT' || prev === undefined) return null;
        return prev;
      });
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Once signed in, the cloud save is authoritative for every slot. A slot
  // with no cloud row yet but a local save from before accounts (or before
  // multiple slots) existed gets uploaded once as a one-time migration
  // instead of silently discarded — loadCharacter(0) itself already falls
  // back to the old single-save key, so this naturally picks up an account's
  // very first pre-existing character into slot 0.
  //
  // Keyed on the user's id, NOT the session object itself — Supabase hands
  // out a brand-new session object (new access token, new object reference)
  // on every token refresh, which fires just from resuming a backgrounded
  // tab, with the exact same logged-in user. Re-running this on the object
  // reference alone set slotsLoading(true) synchronously, which swapped the
  // entire GameShell subtree out for the "Carregando..." screen below
  // (see the session===undefined||slotsLoading render gate) — unmounting
  // GameShell, and with it any dungeon run in progress inside it. Once the
  // refetch finished, a brand-new GameShell mounted with its section state
  // back at its 'kingdom' default, which is exactly what looked like "my
  // run got abandoned" every time the player switched away and back. The
  // user id is stable across a token refresh, so this now only actually
  // reloads when the logged-in account genuinely changes.
  useEffect(() => {
    if (!session) { setSlotsLoading(false); return; }
    let cancelled = false;
    setSlotsLoading(true);
    (async () => {
      const cloudMap = await fetchCloudCharacterSlots(session.user.id);
      if (cancelled) return;
      const next: (Character | null)[] = [];
      for (let slot = 0; slot < MAX_CHARACTER_SLOTS; slot++) {
        const cloudRaw = cloudMap.get(slot);
        let c = cloudRaw ? migrateCharacter(cloudRaw) : null;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id]);

  useEffect(() => {
    fetchGlobalRanking().then(({ ranking, error }) => {
      setRanking(ranking);
      if (error) setRankingError(error);
    });
  }, []);

  // Loja de Prestígio is account-wide, not per-slot, so this is a single
  // row fetch (not the per-slot reconciliation the characters effect above
  // does) — the cloud row is simply authoritative once a session exists.
  // Same user-id keying as that effect, and for the same reason — a token
  // refresh shouldn't trigger a redundant refetch for the same account.
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    fetchProfile(session.user.id).then((p) => {
      if (cancelled) return;
      setProfile(p);
      saveProfileLocal(p);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id]);

  function persistProfile(p: ProfileState) {
    setProfile(p);
    saveProfileLocal(p);
    if (session) saveProfile(session.user.id, p);
  }

  function handleBuyCosmetic(id: string) {
    const cosmetic = COSMETICS.find((c) => c.id === id);
    if (!cosmetic || profile.ownedCosmetics.includes(id) || profile.prestige < cosmetic.cost) return;
    persistProfile({
      ...profile,
      prestige: profile.prestige - cosmetic.cost,
      ownedCosmetics: [...profile.ownedCosmetics, id],
      equippedCosmetic: id,
    });
  }

  function handleEquipCosmetic(id: string | null) {
    if (id !== null && !profile.ownedCosmetics.includes(id)) return;
    persistProfile({ ...profile, equippedCosmetic: id });
  }

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

  function handleRunEnd(finalCharacter: Character, _depthReached: number, endedReason: 'death' | 'retreat' | 'victory', prestigeGained: number) {
    if (prestigeGained > 0) persistProfile({ ...profile, prestige: profile.prestige + prestigeGained });

    // Modo Ferro's whole point: death inside a dungeon is permanent, not a
    // trip back to the Reino to heal up and try again. The rank entry below
    // still records the run (their best depth before falling), same as any
    // other death — only the character itself doesn't come back.
    if (finalCharacter.ironMode && endedReason === 'death') {
      if (activeSlot !== null) {
        clearCharacter(activeSlot);
        if (session) deleteCloudCharacter(session.user.id, activeSlot);
        setSlots((prev) => prev.map((c, i) => (i === activeSlot ? null : c)));
        setActiveSlot(null);
      }
      setScreen('select');
    } else {
      // effectiveMaxHp, not the raw maxHp field — equipment, attribute
      // points and Kingdom buildings can push the real cap above the
      // character's bare class/level base, so healing to the raw field
      // left the player visibly short of a full bar back in the Reino.
      const healed = { ...finalCharacter, hp: effectiveMaxHp(finalCharacter) };
      persist(healed);
    }

    const entry: RankEntry = {
      name: finalCharacter.name, classId: finalCharacter.classId, cp: computeCombatPower(finalCharacter),
      level: finalCharacter.level, date: new Date().toISOString().slice(0, 10),
      ironMode: finalCharacter.ironMode, equipment: finalCharacter.equipment,
    };
    if (session) {
      insertGlobalRankEntry(session.user.id, entry).then((insertErr) => {
        fetchGlobalRanking().then(({ ranking, error: fetchErr }) => {
          setRanking(ranking);
          setRankingError(insertErr ?? fetchErr);
        });
      });
    }
  }

  // Drops back to the character-select hub — used by the Sidebar's
  // "Abandonar Herói / Novo Jogo". Just navigation: the hero is untouched
  // and still sitting in their slot when the player comes back. Deleting a
  // character for real is a separate, explicit action already offered from
  // the select screen itself (onDelete below), not something this button
  // should do as a side effect of "I want to go pick someone else."
  function handleAbandon() {
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
      content = <CharacterCreation onCreated={handleCreated} checkNameTaken={isCharacterNameTaken} />;
      break;
    case 'game':
      if (!character) { setScreen('select'); break; }
      content = (
        <GameShell
          character={character}
          ranking={ranking}
          rankingError={rankingError}
          profile={profile}
          onCharacterChange={persist}
          onRunEnd={handleRunEnd}
          onAbandon={handleAbandon}
          onSignOut={handleSignOut}
          onBuyCosmetic={handleBuyCosmetic}
          onEquipCosmetic={handleEquipCosmetic}
        />
      );
      break;
  }

  return <ScreenFrame>{content}</ScreenFrame>;
}
