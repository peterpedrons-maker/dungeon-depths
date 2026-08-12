interface Props {
  hasCharacter: boolean;
  onContinue: () => void;
  onNewGame: () => void;
}

export function TitleScreen({ hasCharacter, onContinue, onNewGame }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center bg-nightsky">
      <div className="flex items-center gap-4">
        <span className="w-2.5 h-2.5 bg-gold/70 rotate-45 shrink-0" aria-hidden />
        <h1 className="font-display text-4xl md:text-5xl font-bold text-gold tracking-[0.08em] [text-shadow:0_2px_0_rgba(0,0,0,0.8)]">
          Reino &amp; Masmorras
        </h1>
        <span className="w-2.5 h-2.5 bg-gold/70 rotate-45 shrink-0" aria-hidden />
      </div>
      <p className="text-parchment/70 max-w-md italic">
        Forje um herói, desça às masmorras, torne-se mais forte a cada expedição
        e conquiste seu lugar no ranking do reino.
      </p>
      <div className="flex flex-col gap-3 w-56 mt-4">
        {hasCharacter && (
          <button onClick={onContinue} className="px-4 py-2 bg-gold text-ink rounded-sm font-bold tracking-wide hover:brightness-110">
            Continuar Jornada
          </button>
        )}
        <button onClick={onNewGame} className="px-4 py-2 bg-crimson rounded-sm font-bold tracking-wide hover:brightness-110">
          {hasCharacter ? 'Nova Jornada' : 'Iniciar Jornada'}
        </button>
      </div>
    </div>
  );
}
