import { useState } from 'react';
import { ClassId } from '../types/game';
import { CLASSES, createCharacter } from '../lib/classes';
import { Character } from '../types/game';

interface Props {
  onCreated: (c: Character) => void;
}

export function CharacterCreation({ onCreated }: Props) {
  const [name, setName] = useState('');
  const [classId, setClassId] = useState<ClassId>('guerreiro');

  function confirm() {
    const finalName = name.trim() || 'Aventureiro';
    onCreated(createCharacter(finalName, classId));
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
      <h2 className="text-3xl text-gold font-bold">Crie seu Herói</h2>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome do herói"
        maxLength={18}
        className="w-64 px-3 py-2 rounded bg-black/40 border border-white/20 text-center text-parchment placeholder:text-parchment/40 focus:outline-none focus:border-gold"
      />

      <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
        {Object.values(CLASSES).map((c) => (
          <button
            key={c.id}
            onClick={() => setClassId(c.id)}
            className={`text-left p-3 rounded border-2 transition ${
              classId === c.id ? 'border-gold bg-white/10' : 'border-white/10 bg-black/20 hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-full inline-block" style={{ background: c.color }} />
              <span className="font-bold">{c.name}</span>
            </div>
            <p className="text-xs text-parchment/60 mb-1">{c.desc}</p>
            <p className="text-xs text-parchment/40">
              HP {c.baseHp} · ATQ {c.baseAtk} · DEF {c.baseDef}
              {c.critChance >= 0.15 ? ` · Crítico ${Math.round(c.critChance * 100)}%` : ''}
              {c.lifesteal > 0 ? ` · Roubo de vida ${Math.round(c.lifesteal * 100)}%` : ''}
            </p>
          </button>
        ))}
      </div>

      <button onClick={confirm} className="px-6 py-2 bg-gold text-ink rounded font-bold hover:brightness-110 mt-2">
        Começar Jornada
      </button>
    </div>
  );
}
