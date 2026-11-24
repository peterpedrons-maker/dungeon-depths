import { useEffect, useState } from 'react';
import { diary, diaryStore } from '../story/diary';
import { chatter, chatterStore } from '../story/chatter';
import { useStore } from '../story/store';
import { WordGlyph } from './Glyph';

// Balão do dado falante: os símbolos aparecem um a um perto do dado e somem sozinhos.
// Cada símbolo que ele "diz" vai para o diário como avistado.
export function BoatoBubble({ left = false }: { left?: boolean }) {
  const c = useStore(chatterStore);
  const [shown, setShown] = useState(0);

  useEffect(() => setShown(0), [c?.id]);
  useEffect(() => {
    if (!c) return;
    if (shown < c.glyphs.length) {
      const t = window.setTimeout(() => setShown(shown + 1), 320);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => chatter.clear(), 2600);
    return () => window.clearTimeout(t);
  }, [c, shown]);
  useEffect(() => {
    if (!c) return;
    const here = diaryStore.get().here;
    c.glyphs.slice(0, shown).forEach((id) => diary.markSeen(id, here));
  }, [c, shown]);

  if (!c) return null;
  return (
    <div className={`boato${left ? ' left' : ''}`} aria-hidden="true">
      {c.glyphs.slice(0, shown).map((id, k) => (
        <span className="dlg-tile" key={`${c.id}-${k}`}>
          <WordGlyph id={id} size={26} />
        </span>
      ))}
    </div>
  );
}
