export default function Onboarding({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onDismiss}>
      <div className="modal onboarding-modal" onClick={(e) => e.stopPropagation()}>
        <h3>🏔️ Bem-vindo ao Vale dos Clãs</h3>
        <ul className="onboarding-list">
          <li>
            <span className="onboarding-ico">🏗️</span>
            <span>Construa Serrarias, Pedreiras e Fazendas pra fazer a economia do seu clã crescer.</span>
          </li>
          <li>
            <span className="onboarding-ico">🏯</span>
            <span>Melhore o Paço do Vale pra desbloquear Quartel, Mercado, Torre e Muralha — e abrir espaço pra mais recursos e tropas.</span>
          </li>
          <li>
            <span className="onboarding-ico">🛡️</span>
            <span>De tempos em tempos, invasores testam suas defesas. Torres e Muralhas protegem o vale — sem elas, o prejuízo é certo.</span>
          </li>
          <li>
            <span className="onboarding-ico">⚔️</span>
            <span>Treine tropas no Quartel e ataque acampamentos neutros nas bordas pra expandir seu território.</span>
          </li>
        </ul>
        <div className="modal-actions">
          <button className="primary-btn" onClick={onDismiss}>
            Entendido, vamos lá!
          </button>
        </div>
      </div>
    </div>
  );
}
