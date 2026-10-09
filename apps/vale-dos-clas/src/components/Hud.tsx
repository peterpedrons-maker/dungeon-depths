import { RESOURCE_META, TROOPS, type GameState } from "@/lib/types";

export default function Hud({ state }: { state: GameState }) {
  const totalTroops = Object.values(state.troops).reduce((a, b) => a + b, 0);
  const tilesOwned = Object.values(state.tiles).filter((t) => t.owner === "jogador").length;

  return (
    <div className="hud">
      <div className="hud-resources">
        {(Object.keys(RESOURCE_META) as (keyof typeof RESOURCE_META)[]).map((k) => (
          <div className="res-chip" key={k} title={RESOURCE_META[k].name}>
            <span className="res-icon">{RESOURCE_META[k].icon}</span>
            <span className="res-val">{Math.floor(state.resources[k]).toLocaleString("pt-BR")}</span>
          </div>
        ))}
      </div>
      <div className="hud-stats">
        <span className="stat-chip" title="Tropas totais">
          ⚔️ {totalTroops}
        </span>
        <span className="stat-chip" title="Território conquistado">
          🗺️ {tilesOwned}
        </span>
      </div>
      <div className="hud-troops-mini">
        {(Object.keys(TROOPS) as (keyof typeof TROOPS)[]).map((id) => (
          <span key={id} className="troop-mini" title={TROOPS[id].name}>
            {TROOPS[id].icon} {state.troops[id]}
          </span>
        ))}
      </div>
    </div>
  );
}
