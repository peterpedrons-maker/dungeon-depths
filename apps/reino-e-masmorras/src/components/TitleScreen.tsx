import { useEffect, useState } from 'react';
import { Button } from './Button';
import gameLogo from '../assets/reino-masmorras-logo.webp';
import publisherLogo from '../assets/thornrune-logo.webp';

interface Props {
  hasCharacter: boolean;
  onContinue: () => void;
  onNewGame: () => void;
}

type Phase = 'dark' | 'publisher' | 'title';

// Choreography (ms), all relative to mount: a beat of black, a brief soft
// pulse of the publisher mark, another beat of black, then the game logo
// settles in with the menu trailing a step behind it.
const PUBLISHER_IN_AT = 400;
const PUBLISHER_FADE_MS = 700;
const PUBLISHER_HOLD_MS = 900;
const PUBLISHER_OUT_MS = 600;
const GAP_MS = 500;
const TITLE_AT = PUBLISHER_IN_AT + PUBLISHER_FADE_MS + PUBLISHER_HOLD_MS + PUBLISHER_OUT_MS + GAP_MS;
const MENU_DELAY_MS = 450;

export function TitleScreen({ hasCharacter, onContinue, onNewGame }: Props) {
  const [phase, setPhase] = useState<Phase>('dark');
  const [publisherVisible, setPublisherVisible] = useState(false);
  const [titleVisible, setTitleVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    if (skipped) return;
    const timers = [
      window.setTimeout(() => { setPhase('publisher'); setPublisherVisible(true); }, PUBLISHER_IN_AT),
      window.setTimeout(() => setPublisherVisible(false), PUBLISHER_IN_AT + PUBLISHER_FADE_MS + PUBLISHER_HOLD_MS),
      window.setTimeout(() => { setPhase('title'); setTitleVisible(true); }, TITLE_AT),
      window.setTimeout(() => setMenuVisible(true), TITLE_AT + MENU_DELAY_MS),
    ];
    return () => timers.forEach(clearTimeout);
  }, [skipped]);

  function skipIntro() {
    if (phase === 'title') return;
    setSkipped(true);
    setPhase('title');
    setPublisherVisible(false);
    setTitleVisible(true);
    setMenuVisible(true);
  }

  const introRunning = phase !== 'title';

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center gap-6 px-4 text-center bg-nightsky relative overflow-hidden"
      onClick={introRunning ? skipIntro : undefined}
      role={introRunning ? 'button' : undefined}
    >
      {phase === 'publisher' && (
        <img
          src={publisherLogo}
          alt="Thornrune"
          className={`w-40 sm:w-52 transition-opacity ease-in-out ${publisherVisible ? 'opacity-80' : 'opacity-0'}`}
          style={{ transitionDuration: `${publisherVisible ? PUBLISHER_FADE_MS : PUBLISHER_OUT_MS}ms` }}
          draggable={false}
        />
      )}

      {phase === 'title' && (
        <div className={`flex flex-col items-center gap-6 transition-opacity duration-700 ease-in-out ${titleVisible ? 'opacity-100' : 'opacity-0'}`}>
          <img src={gameLogo} alt="Reino & Masmorras" className="w-72 sm:w-[26rem] max-w-full" draggable={false} />
          <div className={`flex flex-col items-center gap-6 transition-opacity duration-500 ease-in-out ${menuVisible ? 'opacity-100' : 'opacity-0'}`}>
            <p className="text-parchment/70 max-w-md italic">
              Forje um herói, desça às masmorras, torne-se mais forte a cada expedição
              e conquiste seu lugar no ranking do reino.
            </p>
            <div className="flex flex-col gap-3 w-56">
              {hasCharacter && (
                <Button onClick={onContinue}>Continuar Jornada</Button>
              )}
              <Button onClick={onNewGame}>
                {hasCharacter ? 'Nova Jornada' : 'Iniciar Jornada'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {introRunning && (
        <span className="absolute bottom-4 inset-x-0 text-center text-[11px] text-parchment/30 tracking-wide">
          toque para pular
        </span>
      )}
    </div>
  );
}
