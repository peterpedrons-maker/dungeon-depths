// AS ANOTAÇÕES DO JOGADOR FORA DO CADERNO (DESIGN.md §99; story/reading.ts).
//  · `AimNote`: a etiqueta de papel embaixo da mira, com a anotação da palavra da parede que está sob ela (sempre ligada; só aparece se ele
//    anotou alguma coisa sobre aquela palavra);
//  · `ReadingStrip`: com a opção "Minhas anotações embaixo dos símbolos" ligada, a escrita que ele está olhando sobe numa tira de papel, com
//    a frase copiada a lápis e a anotação dele embaixo de cada símbolo.
// Tudo na letra dele (grafite), nunca no dourado (a verdade da Casa) nem na sépia (a letra dela).
import { aimNoteStore, lookingStore, shortNote } from '../story/reading';
import { diaryStore } from '../story/diary';
import { useStore } from '../story/store';
import { WordGlyph } from './Glyph';
import { useUiScale } from './scale';

export function AimNote() {
  const a = useStore(aimNoteStore);
  if (!a) return null;
  return (
    <div className="aimnote" aria-hidden="true" key={a.id}>
      {a.text}
    </div>
  );
}

export function ReadingStrip() {
  const l = useStore(lookingStore);
  useStore(diaryStore); // (a anotação mudou no caderno: a tira acompanha)
  const k = useUiScale();
  if (!l) return null;
  return (
    <div className="readstrip" aria-hidden="true" key={l.key}>
      {l.chalk && <span className="rs-from">a giz</span>}
      {l.words.map((id, i) => {
        if (!id)
          return (
            <span className="rs-tile" key={i}>
              <span className="rs-gap" style={{ width: Math.round(22 * k), height: Math.round(22 * k) }} />
              <span className="gnote empty">·</span>
            </span>
          ); // (a lacuna da pedra: vazia)
        const n = shortNote(id);
        return (
          <span className="rs-tile" key={i}>
            <WordGlyph id={id} size={Math.round(30 * k)} color="#3a2214" />
            <span className={`gnote${n ? '' : ' empty'}`}>{n || '·'}</span>
          </span>
        );
      })}
    </div>
  );
}
