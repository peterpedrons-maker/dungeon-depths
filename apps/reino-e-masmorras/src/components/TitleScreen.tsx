interface Props {
  hasCharacter: boolean;
  onContinue: () => void;
  onNewGame: () => void;
  onRanking: () => void;
}

export function TitleScreen({ hasCharacter, onContinue, onNewGame, onRanking }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-5xl font-bold text-gold tracking-wide">Reino &amp; Masmorras</h1>
      <p className="text-parchment/70 max-w-md">
        Forje um herói, desça às masmorras, torne-se mais forte a cada expedição
        e conquiste seu lugar no ranking do reino.
      </p>
      <div className="flex flex-col gap-3 w-56 mt-4">
        {hasCharacter && (
          <button onClick={onContinue} className="px-4 py-2 bg-gold text-ink rounded font-bold hover:brightness-110">
            Continuar Jornada
          </button>
        )}
        <button onClick={onNewGame} className="px-4 py-2 bg-crimson rounded font-bold hover:brightness-110">
          {hasCharacter ? 'Nova Jornada' : 'Iniciar Jornada'}
        </button>
        <button onClick={onRanking} className="px-4 py-2 bg-neutral-700 rounded hover:brightness-110">
          Ranking do Reino
        </button>
      </div>
    </div>
  );
}
