import { BUILDINGS, TERRAINS, type BuildingId, type ResourceKind } from "@/lib/types";
import Icon from "@/components/Icon";
import BuildingThumb from "@/components/BuildingThumb";

const ORDER: BuildingId[] = ["fazenda", "serraria", "pedreira", "mercado", "quartel", "torre", "muralha"];

export default function BuildPanel({
  resources,
  pacoLevel,
  buildMode,
  onPick,
  onCancel,
}: {
  resources: Record<ResourceKind, number>;
  pacoLevel: number;
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
          const locked = !!def.requiresPacoLevel && pacoLevel < def.requiresPacoLevel;
          const active = buildMode === id;
          const terrainLabel = def.terrains ? def.terrains.map((t) => TERRAINS[t].name).join(" / ") : "qualquer terreno";
          return (
            <button
              key={id}
              className={`build-card${active ? " active" : ""}${!afford ? " cant-afford" : ""}${locked ? " locked" : ""}`}
              onClick={() => onPick(id)}
              disabled={!afford || locked}
              title={locked ? `Requer Paço nível ${def.requiresPacoLevel}` : undefined}
            >
              <BuildingThumb id={id} size={52} className="bc-icon" />
              <span className="bc-name">{def.name}</span>
              {locked ? (
                <span className="bc-locked">🔒 Paço Nv.{def.requiresPacoLevel}</span>
              ) : (
                <>
                  <span className="bc-terrain">{terrainLabel}</span>
                  <span className="bc-cost">
                    {(Object.entries(def.cost) as [ResourceKind, number][]).map(([k, v]) => (
                      <span key={k} className="bc-cost-item">
                        <Icon id={k} size={12} />
                        {v}
                      </span>
                    ))}
                    {Object.keys(def.cost).length === 0 && <span className="bc-cost-item">grátis</span>}
                  </span>
                  <span className="bc-time">⏱ {def.buildSeconds}s</span>
                </>
              )}
            </button>
          );
        })}
      </div>
      {buildMode && <p className="build-hint">Toque num hexágono com borda verde brilhante no mapa pra construir ali.</p>}
    </div>
  );
}
