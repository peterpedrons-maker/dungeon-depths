import { ClassAttributeNote, ClassCombinationNote, ClassId, ClassMechanic, ClassSpecializationNote } from '../types/game';

// ── Universal class-mechanic explainer system — data only ──
// Every class's exclusive resources/states/stacks/marks/etc. live here, keyed
// by classId. Nothing about "which class has which mechanic" is ever encoded
// in a component — components read this table generically by classId/id.
// Add a future class's kit (Cavaleiro's Determinação/Retaliação/Momentum/
// Ordens/Comando Supremo, Ladino's Combo/Exposição/Furtividade, etc.) purely
// by adding entries here — never by writing new UI.

const MECHANICS: Partial<Record<ClassId, ClassMechanic[]>> = {
  barbaro: [
    {
      id: 'barbaro:fury', classId: 'barbaro', name: 'Fúria', category: 'resource',
      shortDescription: 'Recurso de combate do Bárbaro. É gerado ao atacar, causar críticos e receber golpes. Ao chegar a 100, ativa Frenesi.',
      fullDescription: `Fúria representa a agressividade crescente do Bárbaro durante uma luta.

Ela varia entre 0 e 100.

O Bárbaro ganha Fúria ao acertar ataques básicos, acertar habilidades ofensivas, causar críticos e receber dano direto.

Algumas habilidades consomem Fúria.

Ao alcançar 100 de Fúria, o Bárbaro entra automaticamente em Frenesi.

Isso cria uma escolha constante: gastar Fúria imediatamente para usar habilidades poderosas ou preservá-la para alcançar e sustentar Frenesi.

A Fúria é reiniciada quando um novo inimigo aparece.`,
    },
    {
      id: 'barbaro:frenzy', classId: 'barbaro', name: 'Frenesi', category: 'state',
      shortDescription: 'Estado ativado ao atingir 100 de Fúria. Aumenta dano e velocidade, mas também aumenta o dano recebido.',
      fullDescription: `Frenesi é o estado de agressividade máxima do Bárbaro.

Ele é ativado automaticamente quando a Fúria chega a 100.

Durante Frenesi, o Bárbaro causa mais dano direto e age mais rapidamente, mas também recebe mais dano.

A Fúria diminui a cada ação realizada.

Quando chega a zero, Frenesi termina.

Habilidades que gastam Fúria podem encurtar a duração de Frenesi, portanto o jogador precisa escolher entre conservar o estado ou gastar o recurso em ataques especiais.`,
    },
    {
      id: 'barbaro:pain', classId: 'barbaro', name: 'Dor', category: 'other',
      shortDescription: 'Dano adiado. Parte de um golpe pode virar Dor e ser sofrida gradualmente depois.',
      fullDescription: `Dor representa dano que o Bárbaro conseguiu adiar, mas ainda não eliminou.

Quando uma habilidade redireciona parte de um ataque para Dor, essa quantidade deixa de atingir o HP imediatamente e passa a ser sofrida ao longo dos próximos ciclos.

Dor não é uma barreira e não é cura. O dano continua sendo uma dívida real e pode matar o Bárbaro.

Algumas habilidades permitem remover parte da Dor, utilizá-la ofensivamente ou transformá-la em Fúria.

Ao contrário da Fúria, Dor permanece entre os inimigos durante a mesma tentativa de masmorra.`,
    },
    {
      id: 'barbaro:wounds', classId: 'barbaro', name: 'Feridas', category: 'stack',
      shortDescription: 'Stacks exclusivos do Bárbaro aplicados ao inimigo. Causam dano periódico e fortalecem habilidades de Selvageria.',
      fullDescription: `Feridas são uma mecânica exclusiva do Bárbaro.

Um inimigo pode possuir até 5 Feridas.

Cada stack causa dano periódico baseado no ATK físico atual do Bárbaro.

Aplicar uma nova Ferida aumenta os stacks e renova a duração das Feridas existentes.

Algumas habilidades ficam mais fortes quanto mais Feridas o alvo possui.

Outras consomem todas as Feridas para causar uma grande explosão de dano.

A decisão central é escolher entre manter 5 Feridas para pressão contínua ou consumi-las em um finalizador.

Feridas não são o mesmo efeito que o Sangramento universal do jogo.`,
    },
  ],
};

const ATTRIBUTE_NOTES: Partial<Record<ClassId, ClassAttributeNote[]>> = {
  barbaro: [
    { attribute: 'str', label: 'FOR', role: 'Principal', description: 'Aumenta ATK físico e, através dele, golpes e Feridas.' },
    { attribute: 'vit', label: 'VIT', role: 'Principal defensivo', description: 'Aumenta HP, DEF e fortalece as interações com Dor.' },
    { attribute: 'luk', label: 'SOR', role: 'Secundário', description: 'Aumenta chance de crítico e possui sinergia com Selvageria.' },
    { attribute: 'dex', label: 'DES', role: 'Terciário', description: 'Melhora precisão contra inimigos evasivos.' },
  ],
};

const SPECIALIZATIONS: Partial<Record<ClassId, ClassSpecializationNote[]>> = {
  barbaro: [
    {
      pathId: 'furia',
      identity: 'FOR + Fúria + Frenesi.',
      style: 'Alto risco, alto dano.',
      loop: 'Gerar Fúria → entrar em Frenesi → escolher entre manter ou gastar o recurso.',
    },
    {
      pathId: 'resistencia',
      identity: 'VIT + HP + Dor.',
      style: 'Absorver pressão, adiar dano e sobreviver a bursts.',
      loop: 'Receber dano → acumular Dor → manipular Dor → transformar sofrimento em vantagem.',
    },
    {
      pathId: 'selvageria',
      identity: 'FOR + SOR + Feridas.',
      style: 'Preparação e execução.',
      loop: 'Aplicar Feridas → alcançar stacks altos → manter pressão ou consumir em um finisher.',
    },
  ],
};

const COMBINATIONS: Partial<Record<ClassId, ClassCombinationNote[]>> = {
  barbaro: [
    { pathIds: ['furia', 'selvageria'], name: 'Fúria + Selvageria', description: 'Maior dano, maior risco.' },
    { pathIds: ['furia', 'resistencia'], name: 'Fúria + Resistência', description: 'Berserker resistente.' },
    { pathIds: ['resistencia', 'selvageria'], name: 'Resistência + Selvageria', description: 'Bruiser estável com preparação de Feridas.' },
  ],
};

export function getClassMechanics(classId: ClassId): ClassMechanic[] {
  return MECHANICS[classId] ?? [];
}

export function getMechanicById(id: string): ClassMechanic | undefined {
  for (const list of Object.values(MECHANICS)) {
    const found = list?.find((m) => m.id === id);
    if (found) return found;
  }
  return undefined;
}

export function getClassAttributeNotes(classId: ClassId): ClassAttributeNote[] {
  return ATTRIBUTE_NOTES[classId] ?? [];
}

export function getClassSpecializations(classId: ClassId): ClassSpecializationNote[] {
  return SPECIALIZATIONS[classId] ?? [];
}

export function getClassCombinations(classId: ClassId): ClassCombinationNote[] {
  return COMBINATIONS[classId] ?? [];
}

export function classHasMechanics(classId: ClassId): boolean {
  return (MECHANICS[classId]?.length ?? 0) > 0;
}
