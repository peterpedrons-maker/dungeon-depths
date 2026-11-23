import { useEffect, useMemo, useState } from 'react';
import { FACES } from '../faces';
import { diary, diaryStore } from '../story/diary';
import { glyphsOf } from '../story/lexicon';
import { useStore } from '../story/store';
import { TEXTS } from '../story/texts';
import type { PageRect } from '../story/ui';
import { WordGlyph } from './Glyph';
import './story.css';

type Tab = 'dict' | 'faces' | 'texts' | 'map' | 'notes';
type Filter = 'all' | 'open' | 'noted';

// Ícone de livro em "pixels" (para o botão do canto)
export function BookIcon() {
  return (
    <svg viewBox="0 0 16 16" width="20" height="20" shapeRendering="crispEdges" aria-hidden="true">
      <path d="M2 3h5v10H2zM9 3h5v10H9z" fill="#c9a35a" />
      <path d="M3 4h3v8H3zM10 4h3v8h-3z" fill="#16110d" />
      <path d="M4 6h1v1H4zM4 8h1v1H4zM11 6h1v1h-1zM11 8h1v1h-1z" fill="#f2e6c9" />
      <path d="M7 3h2v10H7z" fill="#5a3d2b" />
    </svg>
  );
}

// As páginas do diário. O livro é 3D (aberto pelo motor); isto é só o que está escrito nele,
// encaixado exatamente por cima das duas páginas.
export function Diary({ rect, onClose, onSound }: { rect: PageRect; onClose: () => void; onSound?: (n: 'uiclose') => void }) {
  const d = useStore(diaryStore);
  const [tab, setTab] = useState<Tab>('dict');
  const [filter, setFilter] = useState<Filter>('all');
  const [sel, setSel] = useState<string | null>(null);

  useEffect(() => {
    diary.clearUnread();
  }, []);

  const close = () => {
    onSound?.('uiclose');
    onClose();
  };

  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement | null)?.tagName === 'TEXTAREA';
      if (e.key === 'Escape' || (!typing && e.key.toLowerCase() === 'j')) {
        e.preventDefault();
        e.stopPropagation();
        onSound?.('uiclose');
        onClose();
      }
    };
    window.addEventListener('keydown', kd, true);
    return () => window.removeEventListener('keydown', kd, true);
  }, [onClose, onSound]);

  const list = useMemo(
    () => d.order.filter((id) => (filter === 'all' ? true : filter === 'noted' ? !!d.notes[id]?.trim() : !d.notes[id]?.trim())),
    [d.order, d.notes, filter],
  );
  const cur = sel && d.seen[sel] ? sel : (list[0] ?? null);
  const noted = d.order.filter((id) => d.notes[id]?.trim()).length;

  const fs = Math.max(11, Math.min(17, rect.h / 29));
  const cardSz = Math.round(Math.max(24, Math.min(44, rect.h * 0.082)));
  const gsize = (id: string) => Math.round(cardSz * [0, 1, 0.68, 0.52][Math.min(3, glyphsOf(id).length)]);

  const tabs: [Tab, string, string][] = [
    ['dict', 'Símbolos', `${d.order.length}`],
    ['faces', 'Faces', `${FACES.filter((f) => f.unlocked).length}/6`],
    ['texts', 'Textos', `${d.texts.length}`],
    ['map', 'Mapa', `${d.rooms.length}`],
    ['notes', 'Notas', ''],
  ];

  return (
    <div className="diary" onPointerDown={close}>
      <div
        className={`bk${rect.h < 340 ? ' compact' : ''}`}
        style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h, fontSize: fs }}
        onPointerDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Diário"
      >
        <nav className="bk-tabs">
          {tabs.map(([t, label, n]) => (
            <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
              {label}
              {n && <i>{n}</i>}
            </button>
          ))}
          <button className="bk-x" onClick={close} aria-label="Fechar o diário" title="Fechar (J ou Esc)">
            ✕
          </button>
        </nav>

        <div className="bk-body">
          {tab === 'dict' && (
            <div className="spread">
              <section className="pg">
                <h2>Símbolos avistados</h2>
                <p className="sub">
                  {d.order.length === 0
                    ? 'Nada ainda. Quando você vir um símbolo, ele entra aqui sozinho.'
                    : `${d.order.length} avistados · ${noted} anotados. O diário não diz se você acertou: isso se descobre usando.`}
                </p>
                {d.order.length > 0 && (
                  <>
                    <div className="chips">
                      {(
                        [
                          ['all', 'Todos'],
                          ['open', 'Sem nota'],
                          ['noted', 'Anotados'],
                        ] as [Filter, string][]
                      ).map(([f, label]) => (
                        <button key={f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="grid">
                      {list.map((id) => (
                        <button key={id} className={`card${cur === id ? ' on' : ''}`} onClick={() => setSel(id)} aria-label="Símbolo">
                          <WordGlyph id={id} size={gsize(id)} />
                          <b className={d.notes[id]?.trim() ? 'dot noted' : 'dot'} />
                        </button>
                      ))}
                      {list.length === 0 && <p className="empty">Nenhum símbolo neste filtro.</p>}
                    </div>
                  </>
                )}
              </section>
              <section className="pg">
                {cur ? (
                  <div className="detail">
                    <div className="big">
                      <WordGlyph id={cur} size={Math.round(rect.h * 0.2 * [0, 1, 0.72, 0.55][Math.min(3, glyphsOf(cur).length)])} />
                    </div>
                    <small>
                      {d.notes[cur]?.trim() ? 'anotado' : 'avistado'} em <em>{d.seen[cur].room || 'um lugar que esqueci'}</em>
                    </small>
                    <label htmlFor="note">O que eu acho que significa</label>
                    <textarea
                      id="note"
                      key={cur}
                      value={d.notes[cur] ?? ''}
                      maxLength={90}
                      rows={3}
                      placeholder="ainda não sei…"
                      onChange={(e) => diary.setNote(cur, e.target.value)}
                    />
                    <small className="mute">Só você lê isto. Mude quando entender melhor.</small>
                  </div>
                ) : (
                  <p className="sub">Os símbolos que você ver pelo caminho vão sendo guardados aqui, com um espaço para anotar o que você acha que significam.</p>
                )}
              </section>
            </div>
          )}

          {tab === 'faces' && (
            <div className="flow">
              <h2>Faces do dado</h2>
              <p className="sub">O que você descobriu de cada face. As outras seguem seladas.</p>
              {FACES.map((f) => (
                <div key={f.n} className={`face${f.unlocked ? '' : ' locked'}`} style={{ ['--c' as string]: f.color }}>
                  <b>{f.n}</b>
                  <div>
                    <strong>{f.unlocked ? f.name : '???'}</strong>
                    <span>{f.unlocked ? f.desc : 'Face selada.'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'texts' && (
            <div className="flow">
              <h2>Textos achados</h2>
              {d.texts.length === 0 ? (
                <p className="sub">Nada ainda. Diários, bilhetes e páginas soltas que você achar ficam guardados aqui.</p>
              ) : (
                d.texts.map((id) => {
                  const t = TEXTS[id];
                  return t ? (
                    <article key={id}>
                      <h3>{t.title}</h3>
                      <small>de {t.by}</small>
                      {t.body.map((p, k) => (
                        <p key={k}>{p}</p>
                      ))}
                    </article>
                  ) : null;
                })
              )}
            </div>
          )}

          {tab === 'map' && (
            <div className="flow">
              <h2>Mapa</h2>
              <p className="sub">As salas que você já viu, em ordem. O desenho do mapa, com as suas marcas de giz, vem depois.</p>
              {d.rooms.map((r) => (
                <div key={r} className={`rm${d.here === r ? ' here' : ''}`}>
                  <b>{r}</b>
                  {d.here === r && <em>você está aqui</em>}
                </div>
              ))}
            </div>
          )}

          {tab === 'notes' && (
            <div className="spread one">
              <section className="pg full">
                <h2>Anotações</h2>
                <textarea
                  className="free"
                  value={d.free}
                  maxLength={2000}
                  placeholder="Escreva o que quiser lembrar…"
                  onChange={(e) => diary.setFree(e.target.value)}
                />
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
