import { useEffect, useRef, useState } from 'react';
import { diary, diaryStore } from '../story/diary';
import { chatter, chatterStore } from '../story/chatter';
import { useStore } from '../story/store';
import { WordGlyph } from './Glyph';
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
const GLYPH_MS = 460;
export function BoatoBubble({ onSound }: { onSound?: (name: 'write', v?: number) => void }) {
  const c = useStore(chatterStore);
  const [shown, setShown] = useState(0);

  useEffect(() => setShown(0), [c?.id]);
  useEffect(() => {
    if (!c) return;
    if (shown < c.glyphs.length + (c.pic ? 1 : 0)) {
      const t = window.setTimeout(() => {
        setShown(shown + 1);
        // um símbolo se forma: 3 risquinhos enquanto ele é desenhado
        onSound?.('write', 1);
        window.setTimeout(() => onSound?.('write', 0.9), 130);
        window.setTimeout(() => onSound?.('write', 0.8), 260);
      }, GLYPH_MS);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => chatter.clear(), 3600); // o balão fica à vista por mais tempo depois do último símbolo
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
          <SketchPic kind={c.pic as SketchKind} size={34} />
        </span>
      )}
      {c.glyphs.slice(0, Math.max(0, shown - (c.pic ? 1 : 0))).map((id, k) => (
        <span className="dlg-tile" key={`${c.id}-${k}`}>
          <WordGlyph id={id} size={26} draw={GLYPH_MS - 40} />
        </span>
      ))}
    </div>
  );
}
