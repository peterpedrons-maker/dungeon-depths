import { useEffect, useRef, useState } from 'react';
import { LOAD_BAR, loadStore } from '../story/loading';
import { useStore } from '../story/store';

// A TELA DE CARREGAMENTO (pedidos do Pedro, DESIGN.md §78): depois de Novo jogo / Continuar / Carregar. A imagem é do motor (`ui/loadart.ts`):
// a parede no escuro, a canaleta por onde o fogo corre acendendo cinco braseiros, a frase «ACENDER BRASEIRO» que acende quando os cinco estão
// acesos e, no canto, o dado em 2D com o rosto vivo. Aqui fica só o aviso do fim (embaixo da canaleta) e o clique.
// Espera os modelos, os primeiros quadros e as GRAVAÇÕES DE SOM. No fim, se o som ainda não foi liberado (a página acabou de recarregar), pede
// um clique ou toque: é o gesto que o navegador exige para o som sair e para prender o mouse. Com o som já liberado, segue sozinho.

const coarse = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

export function LoadingScreen({ onGo }: { onGo: () => void }) {
  const st = useStore(loadStore);
  const [asked, setAsked] = useState(false);
  const [gone, setGone] = useState(false);
  const goRef = useRef(onGo);
  goRef.current = onGo;
  const goneRef = useRef(false);
  const go = () => {
    if (goneRef.current) return;
    goneRef.current = true;
    setGone(true);
    goRef.current();
  };
  useEffect(() => {
    if (!st.ready) return;
    if (st.live) {
      const t = window.setTimeout(go, 450);
      return () => window.clearTimeout(t);
    }
    setAsked(true);
  }, [st.ready, st.live]);
  useEffect(() => {
    if (!asked) return;
    const kd = (e: KeyboardEvent) => {
      if (e.repeat || e.key === 'Escape') return;
      go();
    };
    window.addEventListener('keydown', kd);
    return () => window.removeEventListener('keydown', kd);
  }, [asked]);

  return (
    <div className={`loadscr${asked && !gone ? ' asked' : ''}`} onPointerDown={() => asked && go()} role="status" aria-label={asked ? undefined : 'Carregando'}>
      {asked && !gone && (
        <b className="loadgo" style={{ left: `${((LOAD_BAR.x0 + LOAD_BAR.x1) / 2) * 100}%`, top: `${(LOAD_BAR.y + 0.035) * 100}%` }}>
          {coarse ? 'Toque para começar' : 'Clique para começar'}
        </b>
      )}
    </div>
  );
}
