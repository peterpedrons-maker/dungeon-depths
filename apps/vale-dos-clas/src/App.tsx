import { useEffect, useMemo, useRef, useState } from "react";
import { useGame } from "@/hooks/useGame";
import HexCanvas from "@/components/HexCanvas";
import Hud from "@/components/Hud";
import BuildPanel from "@/components/BuildPanel";
import Barracks from "@/components/Barracks";
import HexPanel from "@/components/HexPanel";
import CombatModal from "@/components/CombatModal";
import Onboarding from "@/components/Onboarding";
import { getPacoLevel, popCapFor, queuedTroopCount, totalTroopCount, type BuildingId, type TroopId } from "@/lib/types";
import Icon from "@/components/Icon";
import { ensureMusic, isMuted, playSfx, setMuted } from "@/lib/audio";

type Tab = "build" | "barracks";

const INTRO_SEEN_KEY = "vale_dos_clas_intro_seen";

export default function App() {
  const [state, dispatch] = useGame();
  const [tab, setTab] = useState<Tab>("build");
  const [buildMode, setBuildMode] = useState<BuildingId | null>(null);
  const [attackTarget, setAttackTarget] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [muted, setMutedState] = useState(() => isMuted());
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return localStorage.getItem(INTRO_SEEN_KEY) !== "1";
    } catch {
      return true;
    }
  });
  const [raidBanner, setRaidBanner] = useState(false);

  const hasQuartel = useMemo(
    () => Object.values(state.tiles).some((t) => t.owner === "jogador" && t.building?.id === "quartel" && !t.building.upgrading),
    [state.tiles],
  );
  const pacoLevel = useMemo(() => getPacoLevel(state.tiles), [state.tiles]);
  const popCap = popCapFor(pacoLevel);
  const popUsed = totalTroopCount(state.troops) + queuedTroopCount(state.trainQueue);

  // aviso de invasão: mostra um banner por alguns segundos quando o reducer sinaliza raidWarned
  const prevRaidWarned = useRef(false);
  useEffect(() => {
    if (state.raidWarned && !prevRaidWarned.current) {
      setRaidBanner(true);
      const id = window.setTimeout(() => setRaidBanner(false), 7000);
      prevRaidWarned.current = true;
      return () => window.clearTimeout(id);
    }
    if (!state.raidWarned) prevRaidWarned.current = false;
  }, [state.raidWarned]);

  function dismissIntro() {
    setShowIntro(false);
    try {
      localStorage.setItem(INTRO_SEEN_KEY, "1");
    } catch {
      /* ok ignorar */
    }
  }

  // navegadores só deixam tocar áudio depois do primeiro gesto do usuário — liga a trilha nesse momento
  useEffect(() => {
    const unlock = () => {
      ensureMusic();
      window.removeEventListener("pointerdown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  // toca vitória/derrota quando uma entrada NOVA aparece no log de combate
  const lastLogId = useRef<string | null>(null);
  useEffect(() => {
    const latest = state.combatLog[0];
    if (!latest || latest.id === lastLogId.current) return;
    lastLogId.current = latest.id;
    if (latest.victory) {
      playSfx("victory");
      playSfx("coins", 0.4);
    } else {
      playSfx("defeat");
    }
  }, [state.combatLog]);

  function handlePlace(key: string) {
    if (!buildMode) return;
    dispatch({ type: "BUILD", key, building: buildMode });
    setBuildMode(null);
    dispatch({ type: "SELECT", key });
    playSfx("build");
  }

  function handleSelect(key: string) {
    dispatch({ type: "SELECT", key });
  }

  function handleAttackConfirm(sent: Partial<Record<TroopId, number>>) {
    if (!attackTarget) return;
    dispatch({ type: "ATTACK", key: attackTarget, sent });
    setAttackTarget(null);
    playSfx("clash");
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  }

  return (
    <div id="app-root">
      <Hud state={state} />

      <div className="stage">
        <HexCanvas tiles={state.tiles} selected={state.selected} buildMode={buildMode} onSelect={handleSelect} onPlace={handlePlace} />

        {state.selected && !buildMode && (
          <HexPanel
            state={state}
            onUpgrade={(key) => {
              dispatch({ type: "UPGRADE", key });
              playSfx("mine");
            }}
            onAttack={(key) => {
              setAttackTarget(key);
              playSfx("click");
            }}
            onClose={() => dispatch({ type: "SELECT", key: null })}
          />
        )}

        <div className="combat-toasts">
          {raidBanner && (
            <div className="toast warning">
              <span>⚠️ Exploradores inimigos foram avistados nas bordas do vale! Reforce as defesas.</span>
              <button onClick={() => setRaidBanner(false)}>✕</button>
            </div>
          )}
          {state.combatLog.map((l) => (
            <div key={l.id} className={`toast ${l.victory ? "good" : "danger"}`}>
              <span>{l.message}</span>
              <button onClick={() => dispatch({ type: "DISMISS_LOG", id: l.id })}>✕</button>
            </div>
          ))}
        </div>
      </div>

      <nav className="tabs">
        <button
          className={tab === "build" ? "active" : ""}
          onClick={() => {
            setTab("build");
            playSfx("click");
          }}
        >
          🏗️ Construir
        </button>
        <button
          className={tab === "barracks" ? "active" : ""}
          onClick={() => {
            setTab("barracks");
            playSfx("click");
          }}
        >
          <Icon id="quartel" size={15} /> Quartel
        </button>
        <button className="reset-btn" title={muted ? "Ativar som" : "Mudo"} onClick={toggleMute}>
          {muted ? "🔇" : "🔊"}
        </button>
        <button
          className="reset-btn"
          onClick={() => {
            if (confirmReset) {
              dispatch({ type: "RESET" });
              setConfirmReset(false);
            } else {
              setConfirmReset(true);
              setTimeout(() => setConfirmReset(false), 3000);
            }
          }}
        >
          {confirmReset ? "confirmar? ⚠️" : "↺"}
        </button>
      </nav>

      <div className="bottom-sheet">
        {tab === "build" && (
          <BuildPanel
            resources={state.resources}
            pacoLevel={pacoLevel}
            buildMode={buildMode}
            onPick={(id) => {
              setBuildMode((cur) => (cur === id ? null : id));
              playSfx("click");
            }}
            onCancel={() => setBuildMode(null)}
          />
        )}
        {tab === "barracks" && (
          <Barracks
            state={state}
            hasQuartel={hasQuartel}
            popCap={popCap}
            popUsed={popUsed}
            onTrain={(troop, count) => {
              dispatch({ type: "TRAIN", troop, count });
              playSfx("confirm");
            }}
          />
        )}
      </div>

      {attackTarget && <CombatModal state={state} tileKey={attackTarget} onConfirm={handleAttackConfirm} onClose={() => setAttackTarget(null)} />}
      {showIntro && <Onboarding onDismiss={dismissIntro} />}
    </div>
  );
}
