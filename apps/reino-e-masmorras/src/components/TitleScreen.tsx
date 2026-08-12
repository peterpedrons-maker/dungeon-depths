import { Button } from './Button';
import florao from '../assets/florao.webp';

interface Props {
  hasCharacter: boolean;
  onContinue: () => void;
  onNewGame: () => void;
}

export function TitleScreen({ hasCharacter, onContinue, onNewGame }: Props) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 px-4 text-center bg-nightsky">
      <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold text-gold tracking-[0.05em] sm:tracking-[0.08em] [text-shadow:0_2px_0_rgba(0,0,0,0.8)]">
        Reino &amp; Masmorras
      </h1>
      <img src={florao} alt="" className="w-48 sm:w-64 opacity-90" />
      <p className="text-parchment/70 max-w-md italic">
        Forje um herói, desça às masmorras, torne-se mais forte a cada expedição
        e conquiste seu lugar no ranking do reino.
      </p>
      <div className="flex flex-col gap-3 w-56 mt-4">
        {hasCharacter && (
          <Button onClick={onContinue}>Continuar Jornada</Button>
        )}
        <Button onClick={onNewGame}>
          {hasCharacter ? 'Nova Jornada' : 'Iniciar Jornada'}
        </Button>
      </div>
    </div>
  );
}
