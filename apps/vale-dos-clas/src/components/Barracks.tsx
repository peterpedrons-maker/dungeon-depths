import { useState } from "react";
import { TROOPS, type GameState, type ResourceKind, type TroopId } from "@/lib/types";
import Icon from "@/components/Icon";

export default function Barracks({
  state,
  hasQuartel,
  popCap,
  popUsed,
  onTrain,
}: {
  state: GameState;
  hasQuartel: boolean;
  popCap: number;
  popUsed: number;
  onTrain: (troop: TroopId, count: number) => void;
}) {
  const [counts, setCounts] = useState<Record<TroopId, number>>({ milicia: 1, arqueiros: 1, cavalaria: 1 });
  const room = popCap - popUsed;

  if (!hasQuartel) {
    return (
      <div className="barracks">
        <h3>
          <Icon id="quartel" size={18} /> Quartel
        </h3>
        <p className="build-hint">Construa um Quartel pra poder recrutar tropas (precisa do Paço nível 2).</p>
      </div>
    );
  }

  return (
    <div className="barracks">
      <h3>
        <Icon id="quartel" size={18} /> Recrutar tropas
        <span className="barracks-pop">
          👥 {popUsed}/{popCap}
        </span>
      </h3>
      {room <= 0 && <p className="build-hint warn">População no limite — melhore o Paço pra abrir mais espaço.</p>}
      <div className="troop-list">
        {(Object.keys(TROOPS) as TroopId[]).map((id) => {
          const def = TROOPS[id];
          const count = Math.min(counts[id], Math.max(1, room));
          const totalCost = (Object.entries(def.cost) as [ResourceKind, number][]).map(([k, v]) => [k, v * count] as const);
          const afford = totalCost.every(([k, v]) => state.resources[k] >= v) && room > 0;
          return (
            <div className="troop-card" key={id}>
              <div className="troop-card-top">
                <Icon id={id} size={28} className="tc-icon" />
                <div className="tc-info">
                  <strong>{def.name}</strong>
                  <span className="tc-stats">
                    ⚔{def.attack} 🛡{def.defense} · {def.trainSeconds}s/un.
                  </span>
                </div>
                <span className="tc-owned">×{state.troops[id]}</span>
              </div>
              <div className="troop-card-bottom">
                <div className="stepper">
                  <button onClick={() => setCounts((c) => ({ ...c, [id]: Math.max(1, c[id] - 1) }))}>−</button>
                  <span>{count}</span>
                  <button onClick={() => setCounts((c) => ({ ...c, [id]: Math.min(99, Math.max(1, room), c[id] + 1) }))}>+</button>
                </div>
                <span className="tc-cost">
                  {totalCost.map(([k, v]) => (
                    <span key={k} className="bc-cost-item">
                      <Icon id={k} size={12} />
                      {v}
                    </span>
                  ))}
                </span>
                <button className="primary-btn small" disabled={!afford} onClick={() => onTrain(id, count)}>
                  Recrutar
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {state.trainQueue.length > 0 && (
        <div className="queue">
          <h4>Fila de treino</h4>
          {state.trainQueue.map((o) => (
            <QueueRow key={o.id} troop={o.troop} count={o.count} finishesAt={o.finishesAt} />
          ))}
        </div>
      )}
    </div>
  );
}

function QueueRow({ troop, count, finishesAt }: { troop: TroopId; count: number; finishesAt: number }) {
  const remaining = Math.max(0, Math.round((finishesAt - Date.now()) / 1000));
  return (
    <div className="queue-row">
      <span>
        <Icon id={troop} size={13} /> {count}× {TROOPS[troop].name}
      </span>
      <span className="queue-time">{remaining}s</span>
    </div>
  );
}
