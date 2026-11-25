import { useEffect, useRef, useState } from 'react';
import { diary, diaryStore } from '../story/diary';
import { chatter, chatterStore } from '../story/chatter';
import { useStore } from '../story/store';
import { WordGlyph } from './Glyph';
import { useUiScale } from './scale';
import { LINGER_MS, PART_MS, PIC_MS, scribbleFor, wordMs } from '../story/writing';
import { sketchCanvas, type SketchKind } from '../scene/sketch';

// o rabisco da palavra (o mesmo que o dado mostra na face), em pixel
function SketchPic({ kind, size }: { kind: SketchKind; size: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const g = cv.getContext('2d')!;
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, 40, 40);
    g.drawImage(sketchCanvas(kind, 8, 40), 0, 0);
  }, [kind]);
  return <canvas ref={ref} width={40} height={40} style={{ width: size, height: size, imageRendering: 'pixelated' }} aria-hidden="true" />;
}

// Balão do dado falante: os símbolos aparecem um a um perto do dado e somem sozinhos.
// Cada símbolo que ele "diz" vai para o diário como avistado.
export function BoatoBubble({ onSound }: { onSound?: (name: 'write', v?: number) => void }) {
  const c = useStore(chatterStore);
  const k = useUiScale();
  const [shown, setShown] = useState(0);

  useEffect(() => setShown(0), [c?.id]);
  useEffect(() => {
    if (!c) return;
    // o desenho e cada símbolo são ESCRITOS um depois do outro: o próximo só começa quando o anterior termina
    const durs = [...(c.pic ? [PIC_MS] : []), ...c.glyphs.map(wordMs)];
    if (shown < durs.length) {
      const t = window.setTimeout(() => {
        setShown(shown + 1);
        scribbleFor(durs[shown], onSound); // risquinhos de giz durante a escrita
      }, shown === 0 ? 150 : durs[shown - 1]);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => chatter.clear(), (durs[durs.length - 1] ?? 0) + LINGER_MS); // o balão fica à vista por mais tempo depois do último símbolo
    return () => window.clearTimeout(t);
  }, [c, shown]);
  useEffect(() => {
    if (!c) return;
    const here = diaryStore.get().here;
    c.glyphs.slice(0, Math.max(0, shown - (c.pic ? 1 : 0))).forEach((id) => diary.markSeen(id, here));
  }, [c, shown]);

  if (!c) return null;
  return (
    <div className="boato" aria-hidden="true">
      {c.pic && shown >= 1 && (
        <span className="dlg-tile" key={`${c.id}-pic`}>
          <SketchPic kind={c.pic as SketchKind} size={Math.round(34 * k)} />
        </span>
      )}
      {c.glyphs.slice(0, Math.max(0, shown - (c.pic ? 1 : 0))).map((id, k) => (
        <span className="dlg-tile" key={`${c.id}-${k}`}>
          <WordGlyph id={id} size={Math.round(26 * k)} draw={PART_MS - 100} />
        </span>
      ))}
    </div>
  );
}
