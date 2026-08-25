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
  clerigo: [
    {
      id: 'clerigo:faith', classId: 'clerigo', name: 'Fé', category: 'resource',
      shortDescription: 'Recurso de combate do Clérigo, de 0 a 5. É gerado por curas significativas, purificações e barreiras que absorvem o bastante — nunca por ataques básicos.',
      fullDescription: `Fé representa a devoção acumulada do Clérigo durante uma luta.

Ela varia entre 0 e 5 e nunca é gerada por ataques básicos.

Fé é gerada por quatro "Atos de Fé": uma cura direta ativa que restaure uma fração significativa da vida máxima do Clérigo; uma habilidade que realmente remova pelo menos um efeito negativo; uma barreira normal (nunca Graça) que absorva o suficiente antes de se esgotar; e o Julgamento de um inimigo atingindo 3 e depois 5 stacks pela primeira vez.

Diversas habilidades poderosas de todas as três especializações custam Fé, cobrado no início do lance e nunca devolvido caso ele erre.

Ao derrotar um inimigo, o próximo começa com no máximo 2 de Fé (nunca menos que 1) — o primeiro inimigo de uma tentativa sempre começa com 1.

A decisão central é escolher entre acumular Fé com jogo defensivo/utilitário ou gastá-la logo em uma habilidade de alto impacto.`,
    },
    {
      id: 'clerigo:grace', classId: 'clerigo', name: 'Graça', category: 'other',
      shortDescription: 'Reserva extra de HP criada pelo excesso ("overheal") de curas diretas ativas, quando desbloqueada. Absorve dano antes do HP, mas nunca gera Fé nem outra Graça.',
      fullDescription: `Graça é uma reserva de vida extra, separada do HP e de barreiras normais.

Ela só existe depois de desbloqueada em Devoção, e é alimentada pelo overheal (o excedente que ultrapassaria a vida máxima) de curas diretas ATIVAS — nunca de regeneração, roubo de vida ou curas passivas.

Uma parte desse overheal é convertida em Graça, respeitando um teto baseado na vida máxima efetiva, e a Graça criada tem duração limitada, sendo renovada por uma nova conversão.

Ao sofrer dano direto, a ordem de absorção é sempre: mitigação, depois barreira normal, depois Graça, e só então o HP.

Graça nunca gera Fé, nunca conta como cura para outros efeitos, nunca aciona os gatilhos de uma barreira normal e nunca gera mais Graça a partir de si mesma.`,
    },
    {
      id: 'clerigo:consecration', classId: 'clerigo', name: 'Consagração', category: 'state',
      shortDescription: 'Estado defensivo do Clérigo, criado ou renovado por várias habilidades de Retidão. Só pode existir uma instância por vez; talentos de Retidão dão a ela seus efeitos reais.',
      fullDescription: `Consagração é um estado que várias habilidades de Retidão criam ou renovam por alguns ciclos.

Só pode existir uma instância de cada vez — lançar uma nova substitui a anterior em vez de empilhar.

Por si só, Consagração não faz nada: são os talentos de Retidão que dão a ela seus efeitos reais, como bônus de defesa mágica e Tenacidade, redução na duração de efeitos negativos recebidos, redução no primeiro tick de dano contínuo sofrido, cura ao ver uma barreira destruída, e bônus de dano (com extensão de duração ao acertar) para habilidades ofensivas.

Alguns desses efeitos só acontecem uma vez por instância de Consagração.`,
    },
    {
      id: 'clerigo:judgment', classId: 'clerigo', name: 'Julgamento', category: 'stack',
      shortDescription: 'Stacks exclusivos do Clérigo aplicados ao inimigo (máximo 5), da especialização Provação. Não causam dano por si só — talentos de Provação os convertem em dano, precisão ou consumo.',
      fullDescription: `Julgamento é uma mecânica exclusiva da especialização Provação do Clérigo.

Um inimigo pode possuir até 5 Julgamentos.

Aplicar um novo Julgamento renova a duração de TODOS os stacks já presentes no alvo.

Por si só, Julgamento não causa nenhum dano periódico — ele é a base sobre a qual talentos de Provação constroem bônus de dano mágico direto e de precisão.

Algumas habilidades consomem Julgamentos para golpes mais fortes; outras aproveitam os stacks atuais sem consumi-los, mas cortam sua duração restante como custo.

Atingir 3 e depois 5 stacks pela primeira vez em um inimigo gera Fé.`,
    },
  ],
  cavaleiro: [
    {
      id: 'cavaleiro:determination', classId: 'cavaleiro', name: 'Determinação', category: 'resource',
      shortDescription: 'Recurso defensivo de Bastião. Bloqueios e algumas defesas geram Determinação, usada para ativar as técnicas mais poderosas do Cavaleiro.',
      fullDescription: `Determinação representa a capacidade do Cavaleiro de transformar defesa em oportunidade.

Bloqueios bem-sucedidos geram Determinação. Algumas barreiras e posturas defensivas também podem gerar o recurso ao impedir dano.

A Determinação varia de 0 a 100 e é reiniciada contra cada novo inimigo.

Habilidades poderosas de Bastião, como Escudo Colossal, Contra-Ataque Absoluto e Fortaleza Viva, consomem Determinação.

A decisão principal é escolher entre utilizar o recurso para sobreviver imediatamente ou preservá-lo para uma defesa ou contra-ataque mais poderoso.`,
    },
    {
      id: 'cavaleiro:retaliation', classId: 'cavaleiro', name: 'Retaliação', category: 'stack',
      shortDescription: 'Bloquear repetidamente prepara um contra-ataque baseado na DEF do Cavaleiro.',
      fullDescription: `Retaliação transforma a defesa do Cavaleiro em poder ofensivo.

Após bloquear três ataques, o Cavaleiro recebe uma carga de Retaliação.

A próxima ação ofensiva direta consome a carga e causa dano físico adicional baseado na DEF atual, com um limite relacionado ao ATK.

Isso permite que uma build defensiva responda ao inimigo sem transformar DEF em uma fonte ilimitada de dano.`,
    },
    {
      id: 'cavaleiro:momentum', classId: 'cavaleiro', name: 'Momentum', category: 'resource',
      shortDescription: 'Recurso ofensivo de Investida. Ataques consecutivos acumulam Momentum, aumentando dano e velocidade.',
      fullDescription: `Momentum representa o ritmo ofensivo do Cavaleiro durante uma carga.

Ataques diretos acertados acumulam Momentum. O primeiro golpe contra cada inimigo gera uma quantidade maior.

Quanto mais Momentum possuir, maior a pressão ofensiva do Cavaleiro, aumentando gradualmente dano e velocidade.

Golpes inimigos muito pesados podem remover parte do Momentum.

Algumas habilidades preservam o recurso para aproveitar seus bônus, enquanto outras consomem tudo para realizar uma grande carga.

A escolha central é decidir quando continuar pressionando e quando transformar o Momentum acumulado em um ataque decisivo.`,
    },
    {
      id: 'cavaleiro:orders', classId: 'cavaleiro', name: 'Ordens', category: 'resource',
      shortDescription: 'Recurso tático de Comando. Algumas habilidades geram Ordens e outras as consomem para produzir efeitos mais poderosos.',
      fullDescription: `Ordens representam a preparação tática do Cavaleiro.

O Cavaleiro pode armazenar até três Ordens.

Algumas habilidades de Comando geram Ordens, enquanto técnicas como Ordem: Avançar, Ordem: Resistir e Ordem: Executar consomem o recurso.

Como o combate é solo, o Cavaleiro utiliza as Ordens para controlar seu próprio ritmo de batalha.

Ao desbloquear Grande Comandante, alcançar três Ordens prepara um Comando Supremo.`,
    },
    {
      id: 'cavaleiro:commandSupreme', classId: 'cavaleiro', name: 'Comando Supremo', category: 'state',
      shortDescription: 'Ao alcançar três Ordens, a próxima habilidade de Comando recebe uma versão muito mais poderosa.',
      fullDescription: `Comando Supremo é o auge da árvore de Comando.

Ao acumular três Ordens, o Cavaleiro prepara automaticamente um Comando Supremo.

A próxima habilidade de Comando utilizada recebe um efeito adicional específico.

As três Ordens são consumidas no início da habilidade.

A ordem de prioridade das habilidades equipadas determina qual comando receberá o benefício, permitindo que o jogador programe sua estratégia através do sistema de autobattle.`,
    },
    {
      id: 'cavaleiro:block', classId: 'cavaleiro', name: 'Bloqueio', category: 'other',
      shortDescription: 'Bloqueio é uma mecânica universal do jogo, mas o Cavaleiro possui interações exclusivas com ela.',
      fullDescription: `Bloqueio continua sendo a mesma mecânica universal usada por todas as classes: uma chance (até 60%) de reduzir o dano direto de um golpe em 50%.

O Cavaleiro não muda essa regra, mas constrói em cima dela: Guarda Elevada e Escudo Disciplinado aumentam a chance de Bloqueio; um Bloqueio bem-sucedido gera Determinação e alimenta Retaliação; e Fortaleza Viva garante um piso temporário de 45% de Bloqueio.`,
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
  clerigo: [
    { attribute: 'wis', label: 'SAB', role: 'Principal', description: 'Poder de Suporte — amplia toda cura, escudo, regeneração e redução de dano recebido do Clérigo.' },
    { attribute: 'int', label: 'INT', role: 'Secundário ofensivo', description: 'Aumenta MATK, a base de todo o dano sagrado direto — Provação nunca usa um coeficiente próprio por cima disso.' },
    { attribute: 'vit', label: 'VIT', role: 'Secundário defensivo', description: 'Aumenta vida máxima, DEF, parte da defesa mágica e Tenacidade — também amplia o teto de Graça e o tamanho de barreiras.' },
    { attribute: 'luk', label: 'SOR', role: 'Situacional', description: 'Aumenta chance de crítico, útil em Provação — nunca obrigatório para nenhuma build.' },
  ],
  cavaleiro: [
    { attribute: 'vit', label: 'VIT', role: 'Principal defensivo', description: 'Aumenta HP, DEF, barreiras e resistência — nunca concede Bloqueio diretamente.' },
    { attribute: 'str', label: 'FOR', role: 'Secundário ofensivo', description: 'Aumenta ATK físico e o teto de Retaliação/Contra-Ataque baseado nele.' },
    { attribute: 'wis', label: 'SAB', role: 'Especializado em Comando', description: 'Amplia o Support Power usado pelo CommandPotency das Ordens.' },
    { attribute: 'dex', label: 'DES', role: 'Terciário', description: 'Melhora precisão, com sinergia em Pressão Constante.' },
    { attribute: 'agi', label: 'AGI', role: 'Terciário', description: 'Melhora a velocidade de ação, com sinergia em Passo de Guerra.' },
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
  clerigo: [
    {
      pathId: 'devocao',
      identity: 'SAB + Cura + Fé + Graça.',
      style: 'Sustento — o melhor curador do Clérigo, sem ser o de maior dano nem permanecer travado em vida cheia.',
      loop: 'Curar com eficiência → gerar Fé por curas significativas → converter overheal em Graça → gastar Fé em utilidade/purificação.',
    },
    {
      pathId: 'retidao',
      identity: 'SAB + VIT + Escudos + Consagração.',
      style: 'Resistência através de barreiras e do estado de Consagração — não é um tanque de Bloqueio nem um "Cavaleiro com magia".',
      loop: 'Criar barreiras/Consagração → converter isso em mitigação e Fé → manter Consagração ativa para os bônus de seus próprios talentos.',
    },
    {
      pathId: 'provacao',
      identity: 'INT + Julgamento + punição sagrada.',
      style: 'Dano real através de Julgamento, mas sempre um degrau abaixo de um conjurador puro com equipamento equivalente.',
      loop: 'Aplicar Julgamento → escalar dano/precisão com os stacks → escolher entre consumir para um golpe forte ou manter para pressão contínua.',
    },
  ],
  cavaleiro: [
    {
      pathId: 'bastiao',
      identity: 'VIT — Principal. FOR — Secundário para Retaliação.',
      style: 'Sobrevivência e resposta — a maior sobrevivência do Cavaleiro, sem ser seu maior DPS.',
      loop: 'Bloquear → gerar Determinação → preparar Retaliação → escolher entre barreira, postura ou contra-ataque.',
    },
    {
      pathId: 'investida',
      identity: 'FOR — Principal. VIT — Secundário. DES/AGI — Terciários.',
      style: 'Ofensiva sustentada — a maior árvore de dano do Cavaleiro, mas nunca o maior DPS do jogo.',
      loop: 'Atacar → ganhar Momentum → aumentar pressão → manter ou consumir → executar.',
    },
    {
      pathId: 'comando',
      identity: 'VIT — Principal defensivo. SAB — Principal tático. FOR — Secundário ofensivo.',
      style: 'Planejamento e controle do ritmo — o Cavaleiro dá ordens a si mesmo, já que o combate é solo.',
      loop: 'Gerar Ordens → utilizar ordens menores → alcançar 3 → escolher qual habilidade receberá Comando Supremo.',
    },
  ],
};

const COMBINATIONS: Partial<Record<ClassId, ClassCombinationNote[]>> = {
  barbaro: [
    { pathIds: ['furia', 'selvageria'], name: 'Fúria + Selvageria', description: 'Maior dano, maior risco.' },
    { pathIds: ['furia', 'resistencia'], name: 'Fúria + Resistência', description: 'Berserker resistente.' },
    { pathIds: ['resistencia', 'selvageria'], name: 'Resistência + Selvageria', description: 'Bruiser estável com preparação de Feridas.' },
  ],
  clerigo: [
    { pathIds: ['devocao', 'retidao'], name: 'Devoção + Retidão', description: 'Sacerdote de sobrevivência — a melhor defesa do Clérigo, com o menor dano das três combinações.' },
    { pathIds: ['devocao', 'provacao'], name: 'Devoção + Provação', description: 'Sacerdote de batalha — equilíbrio entre sustento e dano, sem ser o melhor em nenhum dos dois.' },
    { pathIds: ['retidao', 'provacao'], name: 'Retidão + Provação', description: 'Inquisidor protegido — o maior dano possível para o Clérigo, mas o menor sustento das três.' },
  ],
  cavaleiro: [
    { pathIds: ['bastiao', 'investida'], name: 'Bastião + Investida', description: 'Cavaleiro de choque — DPS intermediário-alto com alta sobrevivência; o mais consistente das três combinações.' },
    { pathIds: ['bastiao', 'comando'], name: 'Bastião + Comando', description: 'Fortaleza tática — a combinação mais resistente do Cavaleiro, mas também a mais lenta para matar.' },
    { pathIds: ['investida', 'comando'], name: 'Investida + Comando', description: 'Comandante de carga — o maior DPS do Cavaleiro, porém abaixo de um Bárbaro Fúria + Selvageria com equipamento equivalente.' },
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
