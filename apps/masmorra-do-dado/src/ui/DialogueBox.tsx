import { useCallback, useEffect, useState } from 'react';
import { diary, diaryStore } from '../story/diary';
import { dialogue, dialogueStore, SPEAKER_WORD } from '../story/dialogue';
import { useStore } from '../story/store';
import { WordGlyph } from './Glyph';
import './story.css';

// Janela de conversa estilo RPG clássico, no rodapé. O mundo fala em glifos (aparecem um a um);
// os pensamentos do jogador vêm em português, letra a letra.
export function DialogueBox({ onSound }: { onSound?: (name: 'uiblip' | 'uinew', v?: number) => void }) {
  const c = useStore(dialogueStore);
  const line = c ? c.lines[c.i] : null;
  const total = line ? (line.glyphs ? line.glyphs.length : (line.text?.length ?? 0)) : 0;
  const key = c ? `${c.id}:${c.i}` : '';
  const [shown, setShown] = useState(0);

  useEffect(() => setShown(0), [key]);

  // "digitação": um glifo por vez (mais lento) ou uma letra por vez
  useEffect(() => {
    if (!line || shown >= total) return;
    const t = window.setTimeout(
      () => {
        setShown(shown + 1);
        onSound?.('uiblip', shown);
      },
      line.glyphs ? 260 : 32,
    );
    return () => window.clearTimeout(t);
  }, [line, shown, total, onSound]);

  // o que aparece na conversa vai para o diário como "avistado"
  useEffect(() => {
    if (!line) return;
    const here = diaryStore.get().here;
    if (line.who !== 'thought') diary.markSeen(SPEAKER_WORD[line.who], here);
    line.glyphs?.slice(0, shown).forEach((id) => diary.markSeen(id, here));
  }, [line, shown]);

  const done = shown >= total;
  const block = !!c?.block;
  const advance = useCallback(() => {
    if (!done) setShown(total);
    else dialogue.next();
  }, [done, total]);

  // enquanto bloqueia o jogo: Espaço/Enter/E ou um toque/clique avançam
  useEffect(() => {
    if (!c || !block) return;
    const kd = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key.toLowerCase() === 'e') {
        e.preventDefault();
        e.stopPropagation();
        if (!e.repeat) advance();
      }
    };
    const pd = (e: Event) => {
      e.stopPropagation();
      advance();
    };
    window.addEventListener('keydown', kd, true);
    window.addEventListener('pointerdown', pd, true);
    return () => {
      window.removeEventListener('keydown', kd, true);
      window.removeEventListener('pointerdown', pd, true);
    };
  }, [c, block, advance]);

  // pensamentos que não bloqueiam somem sozinhos depois de lidos
  useEffect(() => {
    if (!c || block || !done) return;
    const t = window.setTimeout(() => dialogue.next(), Math.max(2200, total * 55));
    return () => window.clearTimeout(t);
  }, [c, block, done, total, key]);

  if (!c || !line) return null;
  const thought = line.who === 'thought';
  return (
    <div key={c.id} className={`dlg ${thought ? 'thought' : 'world'}${block ? '' : ' free'}`} role="dialog" aria-live="polite">
      {!thought && (
        <div className="dlg-plate">
          <WordGlyph id={SPEAKER_WORD[line.who as Exclude<typeof line.who, 'thought'>]} size={38} color="#ffd36b" />
        </div>
      )}
      <div className="dlg-body">
        {line.glyphs ? (
          <div className="dlg-glyphs">
            {line.glyphs.slice(0, shown).map((id, k) => (
              <span className="dlg-tile" key={`${key}-${k}`}>
                <WordGlyph id={id} size={50} />
              </span>
            ))}
          </div>
        ) : (
          <p className={done ? 'done' : ''}>{(line.text ?? '').slice(0, shown)}</p>
        )}
      </div>
      {block && done && <span className="dlg-next">▼</span>}
    </div>
  );
}
