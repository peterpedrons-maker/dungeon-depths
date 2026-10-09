import { useMemo, useState } from "react";
import { useGame } from "@/hooks/useGame";
import HexCanvas from "@/components/HexCanvas";
import Hud from "@/components/Hud";
import BuildPanel from "@/components/BuildPanel";
import Barracks from "@/components/Barracks";
import HexPanel from "@/components/HexPanel";
import CombatModal from "@/components/CombatModal";
import type { BuildingId, TroopId } from "@/lib/types";

type Tab = "build" | "barracks";

export default function App() {
  const [state, dispatch] = useGame();
  const [tab, setTab] = useState<Tab>("build");
  const [buildMode, setBuildMode] = useState<BuildingId | null>(null);
  const [attackTarget, setAttackTarget] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const hasQuartel = useMemo(
    () => Object.values(state.tiles).some((t) => t.owner === "jogador" && t.building?.id === "quartel" && !t.building.upgrading),
    [state.tiles],
  );

  function handlePlace(key: string) {
    if (!buildMode) return;
    dispatch({ type: "BUILD", key, building: buildMode });
    setBuildMode(null);
    dispatch({ type: "SELECT", key });
  }

  function handleSelect(key: string) {
    dispatch({ type: "SELECT", key });
  }

  function handleAttackConfirm(sent: Partial<Record<TroopId, number>>) {
    if (!attackTarget) return;
    dispatch({ type: "ATTACK", key: attackTarget, sent });
    setAttackTarget(null);
  }

  return (
    <div id="app-root">
      <Hud state={state} />

      <div className="stage">
        <HexCanvas tiles={state.tiles} selected={state.selected} buildMode={buildMode} onSelect={handleSelect} onPlace={handlePlace} />

        {state.selected && !buildMode && (
          <HexPanel
            state={state}
            onUpgrade={(key) => dispatch({ type: "UPGRADE", key })}
            onAttack={(key) => setAttackTarget(key)}
            onClose={() => dispatch({ type: "SELECT", key: null })}
          />
        )}

        <div className="combat-toasts">
          {state.combatLog.map((l) => (
            <div key={l.id} className={`toast ${l.victory ? "good" : "danger"}`}>
              <span>{l.message}</span>
              <button onClick={() => dispatch({ type: "DISMISS_LOG", id: l.id })}>✕</button>
            </div>
          ))}
        </div>
      </div>

      <nav className="tabs">
        <button className={tab === "build" ? "active" : ""} onClick={() => setTab("build")}>
          🏗️ Construir
        </button>
        <button className={tab === "barracks" ? "active" : ""} onClick={() => setTab("barracks")}>
          ⚔️ Quartel
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
          <BuildPanel resources={state.resources} buildMode={buildMode} onPick={(id) => setBuildMode((cur) => (cur === id ? null : id))} onCancel={() => setBuildMode(null)} />
        )}
        {tab === "barracks" && <Barracks state={state} hasQuartel={hasQuartel} onTrain={(troop, count) => dispatch({ type: "TRAIN", troop, count })} />}
      </div>

      {attackTarget && <CombatModal state={state} tileKey={attackTarget} onConfirm={handleAttackConfirm} onClose={() => setAttackTarget(null)} />}
    </div>
  );
}
