import { hexDistance, keyToHex } from "@/lib/hex";
import { CENTER } from "@/lib/mapgen";
import { BUILDINGS, TERRAINS, buildProgress, type GameState, type ResourceKind } from "@/lib/types";
import Icon from "@/components/Icon";

export default function HexPanel({
  state,
  onUpgrade,
  onAttack,
  onClose,
}: {
  state: GameState;
  onUpgrade: (key: string) => void;
  onAttack: (key: string) => void;
  onClose: () => void;
}) {
  const key = state.selected;
  if (!key) return null;
  const tile = state.tiles[key];
  if (!tile) return null;
  const terrainDef = TERRAINS[tile.terrain];
  const dist = hexDistance(keyToHex(key), CENTER);

  return (
    <div className="hex-panel">
      <button className="hex-panel-close" onClick={onClose}>
        ✕
      </button>
      <div className="hex-panel-title">
        <strong>{terrainDef.name}</strong>
        <span className="hex-panel-sub">
          {tile.owner === "jogador" ? "🏳️ seu território" : dist <= 1 ? "centro do vale" : `a ${dist} hexágonos do Paço`}
        </span>
      </div>

      {tile.deposit && !tile.building && (
        <p className="hex-panel-line">
          <Icon id={tile.deposit === "ouro" ? "deposito-ouro" : "deposito-caca"} size={14} />{" "}
          {tile.deposit === "ouro" ? "Veio de ouro — ótimo pra um Mercado." : "Terreno de caça farta — ótimo pra uma Fazenda."}
        </p>
      )}

      {tile.building && (
        <div className="hex-panel-building">
          <Icon id={tile.building.id} size={34} className="hpb-icon" />
          <div>
            <strong>{BUILDINGS[tile.building.id].name}</strong>
            <div className="hex-panel-sub">Nível {tile.building.level} / {BUILDINGS[tile.building.id].maxLevel}</div>
          </div>
        </div>
      )}

      {tile.building && (
        <>
          {tile.building.upgrading ? (
            <ProgressLine tile={tile} />
          ) : tile.building.level < BUILDINGS[tile.building.id].maxLevel ? (
            <UpgradeButton tileKey={key} level={tile.building.level} buildingId={tile.building.id} resources={state.resources} onUpgrade={onUpgrade} />
          ) : (
            <p className="hex-panel-line good">Construção no nível máximo.</p>
          )}
        </>
      )}

      {tile.camp && (
        <div className="hex-panel-camp">
          <p className="hex-panel-line danger">
            <Icon id="acampamento" size={15} /> Acampamento inimigo — defesa {tile.camp.defense}
          </p>
          <p className="hex-panel-sub loot-row">
            Saque:
            {(Object.entries(tile.camp.loot) as [ResourceKind, number][]).map(([k, v]) => (
              <span className="bc-cost-item" key={k}>
                <Icon id={k} size={12} />
                {v}
              </span>
            ))}
          </p>
          <button className="danger-btn" onClick={() => onAttack(key)}>
            <Icon id="milicia" size={15} /> Organizar ataque
          </button>
        </div>
      )}

      {!tile.building && !tile.camp && (
        <p className="hex-panel-line">{tile.owner === "jogador" || isNearOwned(state, key) ? "Vazio — escolha uma construção no painel abaixo." : "Fora do alcance do seu território por enquanto."}</p>
      )}
    </div>
  );
}

function isNearOwned(state: GameState, key: string) {
  return Object.values(state.tiles).some((t) => t.owner === "jogador" && hexDistance(t.hex, keyToHex(key)) === 1);
}

function ProgressLine({ tile }: { tile: NonNullable<GameState["tiles"][string]> }) {
  const prog = buildProgress(tile, Date.now()) ?? 0;
  const secondsLeft = tile.building!.upgrading ? Math.max(0, Math.round((tile.building!.upgrading.finishesAt - Date.now()) / 1000)) : 0;
  return (
    <div className="hex-panel-progress">
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${prog * 100}%` }} />
      </div>
      <span className="hex-panel-sub">construindo… {secondsLeft}s</span>
    </div>
  );
}

function UpgradeButton({
  tileKey,
  level,
  buildingId,
  resources,
  onUpgrade,
}: {
  tileKey: string;
  level: number;
  buildingId: keyof typeof BUILDINGS;
  resources: Record<ResourceKind, number>;
  onUpgrade: (key: string) => void;
}) {
  const def = BUILDINGS[buildingId];
  const cost: Partial<Record<ResourceKind, number>> = {};
  for (const [k, v] of Object.entries(def.cost) as [ResourceKind, number][]) cost[k] = Math.round(v * (level + 1) * 0.85);
  const afford = (Object.entries(cost) as [ResourceKind, number][]).every(([k, v]) => resources[k] >= v);
  return (
    <div className="hex-panel-upgrade">
      <button className="primary-btn small" disabled={!afford} onClick={() => onUpgrade(tileKey)}>
        ⬆️ Melhorar pra Nível {level + 1}
      </button>
      <span className="tc-cost">
        {(Object.entries(cost) as [ResourceKind, number][]).map(([k, v]) => (
          <span key={k} className="bc-cost-item">
            <Icon id={k} size={12} />
            {v}
          </span>
        ))}
      </span>
    </div>
  );
}
