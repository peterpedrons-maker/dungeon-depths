import { Character } from '../types/game';
import { Panel } from './Panel';
import { KingdomScene } from './KingdomScene';

export function KingdomOverview({ character }: { character: Character }) {
  return (
    <Panel title="Reino — Visão Geral">
      <KingdomScene />
      <p className="mt-4 text-parchment/80 leading-relaxed">
        As torres do reino se erguem sob a lua, {character.name}. Nas profundezas
        além das muralhas, criaturas cada vez mais fortes aguardam quem tiver
        coragem de descer. Prepare-se no mercador, escolha uma caçada no menu
        à esquerda e prove seu valor.
      </p>
    </Panel>
  );
}
