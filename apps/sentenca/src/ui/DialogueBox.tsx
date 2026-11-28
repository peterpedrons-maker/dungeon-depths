import { useCallback, useEffect, useState } from 'react';
import { diary, diaryStore } from '../story/diary';
import { dialogue, dialogueStore, SPEAKER_WORD } from '../story/dialogue';
import { useStore } from '../story/store';
import { tx, useLang } from '../i18n';
import { WordGlyph } from './Glyph';
import { useUiScale } from './scale';
import { PART_MS, scribbleFor, wordMs } from '../story/writing';
import './story.css';

// Janela de conversa estilo RPG clássico, no rodapé. O mundo fala em glifos (aparecem um a um);
// os pensamentos do jogador vêm em português, letra a letra.
export function DialogueBox({ onSound }: { onSound?: (name: 'uiblip' | 'uinew' | 'write', v?: number) => void }) {
  const c = useStore(dialogueStore);
  const k = useUiScale();
  const line = c ? c.lines[c.i] : null;
  const lang = useLang();
  const text = line?.text != null ? tx(line.text, lang) : undefined;
  const total = line ? (line.glyphs ? line.glyphs.length : (text?.length ?? 0)) : 0;
  const key = c ? `${c.id}:${c.i}` : '';
  const [shown, setShown] = useState(0);
  const [skipped, setSkipped] = useState(false); // o jogador pulou a escrita: tudo aparece de uma vez, sem animação

  useEffect(() => {
    setShown(0);
    setSkipped(false);
  }, [key]);

  // "digitação": um glifo por vez (mais lento) ou uma letra por vez
  useEffect(() => {
    if (!line || shown >= total) return;
    const t = window.setTimeout(
      () => {
        setShown(shown + 1);
        if (line.glyphs) scribbleFor(wordMs(line.glyphs[shown]), onSound); // risquinhos de giz enquanto o símbolo é escrito
        else if (shown % 3 === 0 && /\S/.test(text?.[shown] ?? '')) onSound?.('write', 1); // letras: um risquinho a cada poucas letras, sem espaços
      },
      line.glyphs ? (shown === 0 ? 200 : wordMs(line.glyphs[shown - 1])) : 32, // cada símbolo só começa quando o anterior terminou de ser escrito
    );
    return () => window.clearTimeout(t);
  }, [line, text, shown, total, onSound]);

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
    if (!done) {
      setShown(total);
      setSkipped(true);
    }
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
      if ((e.target as HTMLElement | null)?.closest?.('.skipintro')) return; // (segurar para pular a introdução não passa a fala)
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
    <div key={c.id} className={`dlg ${thought ? 'thought' : `world who-${line.who}`}${block ? '' : ' free'}`} role="dialog" aria-live="polite">
      {!thought && (
        <div className="dlg-plate">
          <WordGlyph id={SPEAKER_WORD[line.who as Exclude<typeof line.who, 'thought'>]} size={Math.round(38 * k)} color="#ffd36b" />
        </div>
      )}
      <div className="dlg-body">
        {line.glyphs ? (
          <div className="dlg-glyphs">
            {line.glyphs.slice(0, shown).map((id, i) => (
              <span className="dlg-tile" key={`${key}-${i}`}>
                <WordGlyph id={id} size={Math.round(50 * k)} draw={skipped ? 0 : PART_MS - 100} />
              </span>
            ))}
          </div>
        ) : (
          <p data-done={done ? '' : undefined}>
            {/* (a tira de papel já diz que é pensamento: sem os parênteses de antes) */}
            {(text ?? '').slice(0, shown)}
            <span className="ghost">{(text ?? '').slice(shown)}</span>
          </p>
        )}
      </div>
      {block && done && <span className="dlg-next" aria-hidden="true" />}
    </div>
  );
}
