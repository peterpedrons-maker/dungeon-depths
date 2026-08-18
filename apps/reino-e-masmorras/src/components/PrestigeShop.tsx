import { ProfileState } from '../types/game';
import { COSMETICS } from '../lib/cosmetics';
import { Panel } from './Panel';
import { SmallButton } from './Button';
import { IconGem } from './icons';

interface Props {
  profile: ProfileState;
  onBuy: (id: string) => void;
  onEquip: (id: string | null) => void;
}

// Loja de Prestígio — puramente cosmético (recolore o avatar/nome na
// TopBar), pago com a moeda de prestígio (ver App.tsx: ganha em vitórias de
// masmorra/Caçada, e triplicada no Modo Ferro). Prestígio e cosméticos
// comprados são da conta inteira, não do personagem — sobrevivem à troca
// ou perda de herói.
export function PrestigeShop({ profile, onBuy, onEquip }: Props) {
  return (
    <Panel title="Loja de Prestígio">
      <div className="flex items-center justify-between mb-4">
        <p className="text-parchment/60 text-sm">
          Cosméticos puramente visuais — recolorem seu avatar e nome. Ganhe prestígio derrotando chefes de masmorra
          (mais ainda em Caçadas, e triplicado no Modo Ferro).
        </p>
      </div>
      <div className="flex items-center gap-2 mb-4 bg-black/25 border border-gold/30 rounded px-3 py-2 w-fit">
        <IconGem className="w-5 h-5 text-sky-300" />
        <span className="font-bold text-sky-200 tabular-nums">{profile.prestige}</span>
        <span className="text-parchment/50 text-xs uppercase tracking-wide">Prestígio</span>
      </div>

      {profile.equippedCosmetic && (
        <div className="mb-4">
          <SmallButton onClick={() => onEquip(null)} variant="ghost">Remover cosmético equipado</SmallButton>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {COSMETICS.map((c) => {
          const owned = profile.ownedCosmetics.includes(c.id);
          const equipped = profile.equippedCosmetic === c.id;
          const affordable = profile.prestige >= c.cost;
          return (
            <div
              key={c.id}
              className={`rounded border p-3 flex flex-col items-center gap-2 text-center ${
                equipped ? 'border-gold bg-gold/10' : 'border-panelborder/40 bg-black/20'
              }`}
            >
              <span
                className="w-9 h-9 rounded-full ring-2 ring-black/40"
                style={{ background: c.color, boxShadow: `0 0 10px 2px ${c.color}80` }}
              />
              <span className="text-xs font-bold text-parchment leading-snug">{c.name}</span>
              {owned ? (
                <SmallButton onClick={() => onEquip(c.id)} disabled={equipped} variant={equipped ? 'solid' : 'ghost'}>
                  {equipped ? 'Equipado' : 'Equipar'}
                </SmallButton>
              ) : (
                <SmallButton onClick={() => onBuy(c.id)} disabled={!affordable}>
                  {affordable ? `Comprar — ${c.cost}` : `${c.cost} prestígio`}
                </SmallButton>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
