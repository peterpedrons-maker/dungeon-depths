import { RESOURCE_META, TROOPS, getPacoLevel, popCapFor, queuedTroopCount, storageCap, totalDefense, totalTroopCount, type GameState } from "@/lib/types";
import Icon from "@/components/Icon";

export default function Hud({ state }: { state: GameState }) {
  const totalTroops = totalTroopCount(state.troops);
  const tilesOwned = Object.values(state.tiles).filter((t) => t.owner === "jogador").length;
  const pacoLevel = getPacoLevel(state.tiles);
  const cap = storageCap(pacoLevel);
  const defense = totalDefense(state.tiles);
  const popCap = popCapFor(pacoLevel);
  const popUsed = totalTroops + queuedTroopCount(state.trainQueue);

  return (
    <div className="hud">
      <div className="hud-resources">
        {(Object.keys(RESOURCE_META) as (keyof typeof RESOURCE_META)[]).map((k) => {
          const raw = state.resources[k];
          const floor = Math.floor(raw);
          const pct = Math.min(100, (raw / cap) * 100);
          return (
            <div className={`res-chip${pct >= 92 ? " near-cap" : ""}`} key={k} title={`${RESOURCE_META[k].name} · ${floor}/${cap}`}>
              <Icon id={k} size={19} className="res-icon" />
              {/* a key muda a cada inteiro ganho — o React remonta o span e a animação de entrada roda de novo, dando o "pulso" de ganho sem precisar de estado extra */}
              <span className="res-val" key={floor}>
                {floor.toLocaleString("pt-BR")}
              </span>
              <span className="res-cap">/{cap}</span>
              <div className="res-bar">
                <div className="res-bar-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="hud-stats">
        <span className="stat-chip" title={`População: ${popUsed}/${popCap} (melhore o Paço pra aumentar)`}>
          👥 {popUsed}/{popCap}
        </span>
        <span className="stat-chip" title="Defesa total do vale — decide o resultado das invasões">
          🛡️ {defense}
        </span>
        <span className="stat-chip" title="Território conquistado">
          🗺️ {tilesOwned}
        </span>
      </div>
      <div className="hud-troops-mini">
        {(Object.keys(TROOPS) as (keyof typeof TROOPS)[]).map((id) => (
          <span key={id} className="troop-mini" title={TROOPS[id].name}>
            <Icon id={id} size={13} /> {state.troops[id]}
          </span>
        ))}
      </div>
    </div>
  );
}
