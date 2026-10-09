import { useState } from "react";
import { TROOPS, type GameState, type TroopId } from "@/lib/types";
import Icon from "@/components/Icon";

export default function CombatModal({
  state,
  tileKey,
  onConfirm,
  onClose,
}: {
  state: GameState;
  tileKey: string;
  onConfirm: (sent: Partial<Record<TroopId, number>>) => void;
  onClose: () => void;
}) {
  const tile = state.tiles[tileKey];
  const [sent, setSent] = useState<Record<TroopId, number>>({ milicia: 0, arqueiros: 0, cavalaria: 0 });
  if (!tile?.camp) return null;

  const power = (Object.keys(TROOPS) as TroopId[]).reduce((s, id) => s + TROOPS[id].attack * sent[id], 0);
  const totalSent = Object.values(sent).reduce((a, b) => a + b, 0);
  const odds = Math.min(99, Math.max(1, Math.round((power / Math.max(1, tile.camp.defense)) * 50)));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal combat-modal" onClick={(e) => e.stopPropagation()}>
        <h3>
          <Icon id="milicia" size={18} /> Atacar acampamento
        </h3>
        <p className="hex-panel-sub">Defesa inimiga: {tile.camp.defense}</p>
        {(Object.keys(TROOPS) as TroopId[]).map((id) => {
          const def = TROOPS[id];
          const owned = state.troops[id];
          return (
            <div className="combat-row" key={id}>
              <span>
                <Icon id={id} size={24} className="tc-icon" /> {def.name} <span className="hex-panel-sub">(têm {owned})</span>
              </span>
              <div className="stepper">
                <button onClick={() => setSent((s) => ({ ...s, [id]: Math.max(0, s[id] - 1) }))}>−</button>
                <span>{sent[id]}</span>
                <button onClick={() => setSent((s) => ({ ...s, [id]: Math.min(owned, s[id] + 1) }))}>+</button>
              </div>
            </div>
          );
        })}
        <div className="combat-odds">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${odds}%`, background: odds >= 50 ? "var(--good)" : "var(--danger)" }} />
          </div>
          <span className="hex-panel-sub">poder estimado: {Math.round(power)} · chance aproximada: {odds}%</span>
        </div>
        <div className="modal-actions">
          <button className="ghost-btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="danger-btn" disabled={totalSent === 0} onClick={() => onConfirm(sent)}>
            Atacar com {totalSent} tropas
          </button>
        </div>
      </div>
    </div>
  );
}
