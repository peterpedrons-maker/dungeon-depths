import { useEffect, useRef, useState } from 'react';
import { LOAD_BAR, loadStore } from '../story/loading';
import { useStore } from '../story/store';

// A TELA DE CARREGAMENTO (pedido do Pedro, DESIGN.md §77): depois de Novo jogo / Continuar / Carregar. Tela preta, o dado no canto de baixo
// à direita olhando para o jogador (desenhado pela cena, com o rosto vivo) e, embaixo, a barra: um SULCO talhado em pedra, cheio de marfim
// fosco, por onde a luz dourada corre como nas frases que acendem; a ponta da luz tem o clarão. O dado espia a ponta de vez em quando.
// Espera os modelos, os primeiros quadros e as GRAVAÇÕES DE SOM (antes elas às vezes chegavam tarde). No fim, se o som ainda não foi
// liberado (a página acabou de recarregar), pede um clique ou toque: é o gesto que o navegador exige para o som sair e para prender o mouse.

const coarse = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

export function LoadingScreen({ onGo }: { onGo: () => void }) {
  const st = useStore(loadStore);
  const ref = useRef<HTMLCanvasElement>(null);
  const shown = useRef(0);
  const [asked, setAsked] = useState(false);
  const goRef = useRef(onGo);
  goRef.current = onGo;
  const gone = useRef(false);
  const go = () => {
    if (gone.current) return;
    gone.current = true;
    goRef.current();
  };
  // pronto: com o som já liberado, segue sozinho; senão, espera o gesto
  useEffect(() => {
    if (!st.ready) return;
    if (st.live) {
      const t = window.setTimeout(go, 350);
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

  // a barra: desenhada em pixel, no tamanho de pixel do jogo
  useEffect(() => {
    const cv = ref.current!;
    const g = cv.getContext('2d')!;
    let raf = 0;
    let t = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      const px = Math.max(2, Math.round(window.innerHeight / (window.innerHeight < 520 ? 200 : 240)));
      const W = Math.max(40, Math.round(((LOAD_BAR.x1 - LOAD_BAR.x0) * window.innerWidth) / px));
      const H = 9;
      if (cv.width !== W) cv.width = W;
      if (cv.height !== H) cv.height = H;
      cv.style.width = `${W * px}px`;
      cv.style.height = `${H * px}px`;
      const p = loadStore.get().p;
      shown.current += (p - shown.current) * Math.min(1, dt * 6);
      const done = loadStore.get().ready;
      const fill = done ? 1 : shown.current;
      g.clearRect(0, 0, W, H);
      // a pedra em volta do sulco (borda de cima escura, de baixo clara: o sulco é fundo)
      for (let x = 0; x < W; x++) {
        const end = x === 0 || x === W - 1;
        g.fillStyle = end ? '#2a2633' : '#3b3646';
        g.fillRect(x, 2, 1, 5);
        g.fillStyle = '#191520';
        g.fillRect(x, 2, 1, 1); // sombra da borda de cima
        g.fillStyle = '#5a5366';
        g.fillRect(x, 6, 1, 1); // luz na borda de baixo
      }
      // o sulco: 3 px de marfim fosco (apagado) e a luz dourada até a ponta
      const head = Math.round(1 + fill * (W - 3));
      for (let x = 1; x < W - 1; x++) {
        const lit = x <= head;
        const k = (x * 7 + 3) % 5 === 0; // grão do marfim
        if (!lit) {
          g.fillStyle = k ? '#bdb39a' : '#cfc5aa';
          g.fillRect(x, 3, 1, 3);
          g.fillStyle = '#a99f87';
          g.fillRect(x, 3, 1, 1); // a fuligem velha em cima
          continue;
        }
        // aceso: dourado com um pulso que anda (o clarão assentando atrás da ponta)
        const dist = head - x;
        const pulse = 0.5 + 0.5 * Math.sin(x * 0.35 - t * 6);
        const hot = dist < 3 ? 2 : dist < 8 ? 1 : 0;
        g.fillStyle = hot === 2 ? '#fff6cf' : hot === 1 ? '#ffd970' : pulse > 0.8 ? '#ffcf5a' : '#e9a93a';
        g.fillRect(x, 3, 1, 3);
        g.fillStyle = hot ? '#fff3c4' : '#ffd36b';
        g.fillRect(x, 4, 1, 1); // o fio do meio, mais claro
      }
      // o clarão da ponta (sai um pouco por cima e por baixo do sulco)
      if (!done || Math.sin(t * 3) > 0) {
        g.fillStyle = '#fff6cf';
        g.fillRect(head, 2, 1, 5);
        g.fillStyle = 'rgba(255, 214, 120, 0.55)';
        g.fillRect(head - 1, 1, 3, 1);
        g.fillRect(head - 1, 7, 3, 1);
        if ((t * 10) % 1 < 0.5) g.fillRect(head + 1, 0, 1, 1);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className={`loadscr${asked ? ' asked' : ''}`} onPointerDown={() => asked && go()}>
      <div className="loadbar" style={{ left: `${LOAD_BAR.x0 * 100}%`, top: `${LOAD_BAR.y * 100}%` }}>
        <canvas ref={ref} />
        {asked && <b className="loadgo">{coarse ? 'Toque para começar' : 'Clique para começar'}</b>}
      </div>
    </div>
  );
}
