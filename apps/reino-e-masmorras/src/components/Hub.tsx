import { Character } from '../types/game';
import { CLASSES } from '../lib/classes';

const POTION_COST = 15;

interface Props {
  character: Character;
  onEnterDungeon: () => void;
  onBuyPotion: () => void;
  onRanking: () => void;
  onNewGame: () => void;
}

export function Hub({ character: ch, onEnterDungeon, onBuyPotion, onRanking, onNewGame }: Props) {
  const cls = CLASSES[ch.classId];
  const xpPct = Math.min(100, (ch.xp / ch.xpToNext) * 100);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
      <h2 className="text-3xl text-gold font-bold">O Reino</h2>

      <div className="w-full max-w-md bg-black/25 border border-white/10 rounded p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-3 h-3 rounded-full inline-block" style={{ background: cls.color }} />
          <span className="font-bold text-lg">{ch.name}</span>
          <span className="text-parchment/50 text-sm">{cls.name} · Nível {ch.level}</span>
        </div>
        <div className="text-xs text-parchment/50 mb-1">XP {ch.xp}/{ch.xpToNext}</div>
        <div className="h-2 bg-black/50 rounded mb-3"><div className="h-2 bg-sky-500 rounded" style={{ width: `${xpPct}%` }} /></div>

        <div className="grid grid-cols-2 gap-2 text-sm text-parchment/80">
          <div>Vida: {ch.hp}/{ch.maxHp}</div>
          <div>Ataque: {ch.atk}</div>
          <div>Defesa: {ch.def}</div>
          <div>Ouro: {ch.gold}</div>
          <div>Poções: {ch.potions}</div>
          <div>Maior profundidade: {ch.bestDepth}</div>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-56">
        <button onClick={onEnterDungeon} className="px-4 py-2 bg-crimson rounded font-bold hover:brightness-110">
          Entrar na Masmorra
        </button>
        <button
          onClick={onBuyPotion}
          disabled={ch.gold < POTION_COST}
          className="px-4 py-2 bg-emerald-800 rounded disabled:opacity-40 hover:brightness-110"
        >
          Comprar Poção ({POTION_COST} ouro)
        </button>
        <button onClick={onRanking} className="px-4 py-2 bg-neutral-700 rounded hover:brightness-110">
          Ranking do Reino
        </button>
        <button onClick={onNewGame} className="px-4 py-2 bg-neutral-800 text-parchment/60 rounded hover:brightness-110 text-sm">
          Abandonar Herói / Novo Jogo
        </button>
      </div>
    </div>
  );
}
