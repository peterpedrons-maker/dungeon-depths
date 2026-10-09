import { BUILDINGS, RESOURCE_META, type BuildingId, type ResourceKind } from "@/lib/types";

const ORDER: BuildingId[] = ["fazenda", "serraria", "pedreira", "mercado", "quartel", "torre", "muralha"];

export default function BuildPanel({
  resources,
  buildMode,
  onPick,
  onCancel,
}: {
  resources: Record<ResourceKind, number>;
  buildMode: BuildingId | null;
  onPick: (id: BuildingId) => void;
  onCancel: () => void;
}) {
  return (
    <div className="build-panel">
      <div className="build-panel-head">
        <h3>🏗️ Construir</h3>
        {buildMode && (
          <button className="ghost-btn" onClick={onCancel}>
            cancelar seleção ✕
          </button>
        )}
      </div>
      <div className="build-list">
        {ORDER.map((id) => {
          const def = BUILDINGS[id];
          const afford = (Object.entries(def.cost) as [ResourceKind, number][]).every(([k, v]) => resources[k] >= v);
          const active = buildMode === id;
          return (
            <button
              key={id}
              className={`build-card${active ? " active" : ""}${!afford ? " cant-afford" : ""}`}
              onClick={() => onPick(id)}
              disabled={!afford}
            >
              <span className="bc-icon">{def.icon}</span>
              <span className="bc-name">{def.name}</span>
              <span className="bc-cost">
                {(Object.entries(def.cost) as [ResourceKind, number][]).map(([k, v]) => (
                  <span key={k} className="bc-cost-item">
                    {RESOURCE_META[k].icon}
                    {v}
                  </span>
                ))}
                {Object.keys(def.cost).length === 0 && <span className="bc-cost-item">grátis</span>}
              </span>
              <span className="bc-time">⏱ {def.buildSeconds}s</span>
            </button>
          );
        })}
      </div>
      {buildMode && <p className="build-hint">Toque num hexágono com borda verde brilhante no mapa pra construir ali.</p>}
    </div>
  );
}
