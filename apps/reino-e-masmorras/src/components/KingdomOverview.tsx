import { Character } from '../types/game';
import { fmt } from '../lib/format';
import { effectiveMaxHp } from '../lib/combatStats';
import { Panel } from './Panel';
import { KingdomScene } from './KingdomScene';
import { StatChip } from './StatChip';
import { IconHeart, IconCoin, IconActive } from './icons';
import pocaoIcon from '../assets/pocao.webp';

export function KingdomOverview({ character: ch }: { character: Character }) {
  const maxHp = effectiveMaxHp(ch);
  return (
    <Panel title="Reino — Visão Geral">
      <KingdomScene />
      <p className="mt-4 mb-4 text-parchment/80 leading-relaxed">
        As torres do reino se erguem sob a lua, {ch.name}. Nas profundezas
        além das muralhas, criaturas cada vez mais fortes aguardam quem tiver
        coragem de descer. Prepare-se no mercador, escolha uma caçada no menu
        à esquerda e prove seu valor.
      </p>

      <div className="grid grid-cols-3 gap-2">
        <StatChip icon={<IconActive className="w-full h-full" />} color="#c89a2e" label="Nível" value={fmt(ch.level)} />
        <StatChip icon={<IconHeart className="w-full h-full" />} color="#e0574a" label="Vida" value={`${fmt(ch.hp)}/${fmt(maxHp)}`} />
        <StatChip icon={<IconCoin className="w-full h-full" />} color="#e0b93c" label="Ouro" value={fmt(ch.gold)} />
      </div>

      {ch.potions > 0 && (
        <div className="mt-2 flex items-center gap-2 text-xs text-parchment/50">
          <img src={pocaoIcon} alt="" className="w-4 h-5" />
          {ch.potions} poção{ch.potions !== 1 ? 'ões' : ''} pronta{ch.potions !== 1 ? 's' : ''} pra levar na próxima expedição.
        </div>
      )}
    </Panel>
  );
}
