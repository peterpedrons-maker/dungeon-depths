import { useEffect, useReducer, useRef } from "react";
import { gameReducer, loadGame, persistGame, type Action } from "@/lib/gameReducer";
import type { GameState } from "@/lib/types";

export function useGame(): [GameState, React.Dispatch<Action>] {
  const [state, dispatch] = useReducer(gameReducer, undefined, loadGame);
  const stateRef = useRef(state);
  stateRef.current = state;

  // loop de produção: um tick por frame, convertido em segundos reais dentro do reducer
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      dispatch({ type: "TICK", now: Date.now() });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // persistência: salva a cada 2s e ao fechar/trocar de aba
  useEffect(() => {
    const id = window.setInterval(() => persistGame(stateRef.current), 2000);
    const onHide = () => persistGame(stateRef.current);
    window.addEventListener("beforeunload", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("beforeunload", onHide);
      document.removeEventListener("visibilitychange", onHide);
      persistGame(stateRef.current);
    };
  }, []);

  return [state, dispatch];
}
