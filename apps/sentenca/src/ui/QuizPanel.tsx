import { useEffect } from 'react';
import { IDK, optLabel, quiz, quizStore } from '../story/quiz';
import { useStore } from '../story/store';
import { WordGlyph } from './Glyph';
import { useUiScale } from './scale';
import { T, tx, useLang } from '../i18n';

// A PERGUNTA DO DADO: o glifo grande ao lado do dado (escrito traço a traço) e, embaixo, as 5 opções em português
// (4 significados embaralhados + "não sei"). No PC: clique ou teclas 1 a 5. Quem diz se acertou é o DADO, não este painel.
export function QuizPanel({ onSound }: { onSound?: (name: 'uiblip', v?: number) => void }) {
  const q = useStore(quizStore);
  useLang();
  const k = useUiScale();
  const asking = q?.phase === 'ask';

  useEffect(() => {
    if (!asking) return;
    const kd = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (!(n >= 1 && n <= 5) || e.repeat) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      onSound?.('uiblip', 1);
      quiz.answer(n - 1);
    };
    window.addEventListener('keydown', kd, true);
    return () => window.removeEventListener('keydown', kd, true);
  }, [asking, onSound]);

  if (!q) return null;
  const ok = q.result === 'ok';
  return (
    <div className="quiz">
      {/* o glifo perguntado; se o jogador acertou, só a marca CONFIRMADO, brilhando */}
      <div className={`quiz-glyph${ok ? ' ok' : ''}${q.result === 'bad' ? ' gone' : ''}`} key={ok ? 'ok' : 'q'} aria-hidden="true">
        <WordGlyph id={ok ? 'conf' : q.def.word} size={Math.round(84 * k)} color={ok ? '#ffe9a8' : '#f2e6c9'} draw={ok ? 500 : 1150} />
      </div>
      {q.phase !== 'glyph' && (
        <div className={`quiz-opts${q.phase === 'done' ? ' answered' : ''}`} role="group" aria-label={tx(T('O que este símbolo quer dizer?', 'What does this symbol mean?', '¿Qué quiere decir este símbolo?'))}>
          {q.options.map((label, i) => (
            <button
              key={label}
              className={`${label === IDK ? 'idk' : ''}${q.picked === i ? ' picked' : ''}`}
              disabled={!asking}
              onPointerDown={(e) => {
                e.preventDefault();
                if (!asking) return;
                onSound?.('uiblip', 1);
                quiz.answer(i);
              }}
            >
              <i className="hint-pc">{i + 1}</i>
              <span>{optLabel(label)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
