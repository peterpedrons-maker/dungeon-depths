import { ClassAttributeNote, ClassCombinationNote, ClassId, ClassMechanic, ClassSpecializationNote } from '../types/game';

// ── Universal class-mechanic explainer system — data only ──
// Every class's exclusive resources/states/stacks/marks/etc. live here, keyed
// by classId. Nothing about "which class has which mechanic" is ever encoded
// in a component — components read this table generically by classId/id.
// Add a future class's kit (Cavaleiro's Determinação/Retaliação/Momentum/
// Ordens/Comando Supremo, Ladino's Combo/Exposição/Furtividade, etc.) purely
// by adding entries here — never by writing new UI.

const MECHANICS: Partial<Record<ClassId, ClassMechanic[]>> = {
  bruxo: [
    { id:'bruxo:debt', classId:'bruxo', name:'Dívida Profana', category:'resource', combatDisplay:{owner:'player',displayType:'bar',maxValue:6,icon:'◆',hideWhenZero:false,priority:10,color:'purple'}, shortDescription:'Cada magia geradora toma poder emprestado e aumenta a Dívida até 6.', fullDescription:'A Dívida começa em zero por tentativa e persiste entre inimigos. Cada ponto concede 1,5% de dano mágico direto do Bruxo. Tentar passar de seis ativa Sobrecontrato e prepara a Cobrança.' },
    { id:'bruxo:deadline', classId:'bruxo', name:'Prazo Final', category:'state', combatDisplay:{owner:'player',displayType:'status',icon:'⌛',hideWhenZero:true,priority:11,color:'red'}, shortDescription:'Com 6 de Dívida, a próxima geração adicional pode entrar em Sobrecontrato.', fullDescription:'O Prazo Final não é um turno automático. Ele apenas sinaliza que a próxima magia que realmente gerar Dívida poderá cobrar o preço.' },
    { id:'bruxo:overcontract', classId:'bruxo', name:'Sobrecontrato', category:'state', combatDisplay:{owner:'player',displayType:'status',icon:'⚠',hideWhenZero:true,priority:12,color:'orange'}, shortDescription:'Magia além do limite: +15% de dano direto e Cobrança de 10% da Vida Máxima.', fullDescription:'Sobrecontrato é capturado no início do cast, mantém a Dívida em seis durante a magia e, após todos os efeitos, cobra diretamente HP ignorando escudos e mitigação.' },
    { id:'bruxo:binding', classId:'bruxo', name:'Vínculo', category:'mark', combatDisplay:{owner:'enemy',displayType:'status',icon:'⛓',hideWhenZero:true,priority:13,color:'purple'}, shortDescription:'Nome Proibido marca o alvo sem causar dano periódico.', fullDescription:'Vínculo dura até a morte do inimigo. Habilidades de Nome Proibido que acertam renovam o vínculo e permitem gerar Fragmentos do Nome.' },
    { id:'bruxo:true-name', classId:'bruxo', name:'Nome Verdadeiro', category:'resource', combatDisplay:{owner:'enemy',displayType:'charges',maxValue:3,icon:'◇',hideWhenZero:false,priority:14,color:'gold'}, shortDescription:'Três Fragmentos revelam o Nome Verdadeiro do inimigo.', fullDescription:'Fragmentos são específicos do alvo. Acertos de Nome Proibido e ações reais do inimigo Vinculado podem gerá-los. Consumir o Nome acontece no início do cast.' },
    { id:'bruxo:credit', classId:'bruxo', name:'Crédito Sombrio', category:'resource', combatDisplay:{owner:'player',displayType:'charges',maxValue:3,icon:'▣',hideWhenZero:true,priority:20,color:'sky'}, shortDescription:'Crédito cancela a próxima Dívida gerada e pode financiar uma magia.', fullDescription:'Habilidades de Negociação que pagam Dívida geram Crédito. Um Crédito cancela uma geração de +1 antes do Sobrecontrato; Advogado do Abismo preserva o poder como uma Dívida fantasma.' },
    { id:'bruxo:scars', classId:'bruxo', name:'Estigmas', category:'resource', combatDisplay:{owner:'player',displayType:'charges',maxValue:3,icon:'✥',hideWhenZero:true,priority:30,color:'red'}, shortDescription:'Cobranças reais deixam Estigmas: mais dano de Transgressão, menos MDEF.', fullDescription:'Cada Cobrança que retira ao menos 5% da Vida Máxima gera um Estigma, até três. Cada Estigma concede +3% de dano mágico direto de Transgressão e reduz 2% da MDEF do Bruxo.' },
    { id:'bruxo:forgery', classId:'bruxo', name:'Assinatura Falsa', category:'state', combatDisplay:{owner:'player',displayType:'status',icon:'✎',hideWhenZero:true,priority:31,color:'gold'}, shortDescription:'Após consumir Nome Verdadeiro, cancela uma geração futura de Dívida.', fullDescription:'Assinatura Falsa é consumida antes do Crédito e persiste entre inimigos da mesma tentativa. Ela apenas nega a Dívida, sem conceder o bônus de Bom Pagador.' },
  ],
  druida: [
    { id:'druida:garden', classId:'druida', name:'Jardim Vivo', category:'resource', combatDisplay:{owner:'player',displayType:'charges',maxValue:3,icon:'🌱',hideWhenZero:false,priority:9,color:'emerald'}, shortDescription:'Sementes, Brotos e Frutos cultivados entre ações sintonizadas.', fullDescription:'Sementes crescem em Brotos e Frutos antes de cada magia sintonizada. Frutos são colhidos por Renascimento.' },
    { id:'druida:season', classId:'druida', name:'Estação', category:'state', combatDisplay:{owner:'player',displayType:'status',icon:'☘',hideWhenZero:false,priority:10,color:'emerald'}, shortDescription:'O ciclo alterna Primavera, Verão, Outono e Inverno.', fullDescription:'A Estação atual define a magia sintonizada e a Forma do Druida. Ela persiste entre inimigos da mesma tentativa e reinicia numa nova tentativa.' },
    { id:'druida:attunement', classId:'druida', name:'Sintonia', category:'resource', combatDisplay:{owner:'player',displayType:'bar',maxValue:3,icon:'✦',hideWhenZero:false,priority:11,color:'lime'}, shortDescription:'Ações alinhadas cultivam Sintonia.', fullDescription:'Habilidades da Estação aumentam Sintonia e fortalecem o próximo efeito do Ciclo Vivo.' },
    { id:'druida:perfect_year', classId:'druida', name:'Ano Perfeito', category:'state', combatDisplay:{owner:'player',displayType:'status',icon:'◉',hideWhenZero:true,priority:12,color:'gold'}, shortDescription:'Completar as quatro Estações prepara Renovo.', fullDescription:'Cada Estação pode ser concluída uma vez por Ano. Ao completar as quatro, o Druida gera um Renovo.' },
    { id:'druida:renewal', classId:'druida', name:'Renovo', category:'resource', combatDisplay:{owner:'player',displayType:'charges',maxValue:1,icon:'❖',hideWhenZero:false,priority:13,color:'lime'}, shortDescription:'Uma reserva de renascimento que persiste entre inimigos.', fullDescription:'Renovo pode ser consumido por habilidades de Equilíbrio e persiste durante a tentativa.' },
    { id:'druida:dissonance', classId:'druida', name:'Descompasso', category:'resource', combatDisplay:{owner:'player',displayType:'charges',maxValue:3,icon:'◇',hideWhenZero:true,priority:14,color:'purple'}, shortDescription:'Ações fora do centro acumulam Descompasso.', fullDescription:'Ataques básicos e magias fora da Estação geram Descompasso. Equilíbrio converte esse excesso em poder.' },
    { id:'druida:form', classId:'druida', name:'Forma', category:'state', combatDisplay:{owner:'player',displayType:'status',icon:'🐾',hideWhenZero:true,priority:15,color:'lime'}, shortDescription:'Cervo, Lobo, Urso ou Coruja.', fullDescription:'A Forma atual concede um conjunto diferente de bônus e persiste entre inimigos da tentativa.' },
    { id:'druida:avatar', classId:'druida', name:'Avatar Primordial', category:'state', combatDisplay:{owner:'player',displayType:'counter',icon:'✧',hideWhenZero:true,priority:16,color:'gold'}, shortDescription:'As quatro Formas atuam simultaneamente por ações limitadas.', fullDescription:'Avatar é um estado do próprio Druida, não uma invocação.' },
  ],
  barbaro: [
    {
      id: 'barbaro:fury', classId: 'barbaro', name: 'Fúria', category: 'resource',
      combatDisplay: { owner: 'player', displayType: 'bar', maxValue: 100, icon: '🔥', hideWhenZero: false, priority: 10, color: 'orange' },
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
      combatDisplay: { owner: 'player', displayType: 'status', icon: '⚡', hideWhenZero: true, priority: 11, color: 'amber' },
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
      combatDisplay: { owner: 'player', displayType: 'bar', icon: '◈', hideWhenZero: true, priority: 12, color: 'purple' },
      shortDescription: 'Dano adiado. Parte de um golpe pode virar Dor e ser sofrida gradualmente depois.',
      fullDescription: `Dor representa dano que o Bárbaro conseguiu adiar, mas ainda não eliminou.

Quando uma habilidade redireciona parte de um ataque para Dor, essa quantidade deixa de atingir o HP imediatamente e passa a ser sofrida ao longo de 5 ciclos (6 com Inquebrável), cada pacote com seu próprio relógio.

Dor não é uma barreira e não é cura. O dano continua sendo uma dívida real e pode matar o Bárbaro.

Algumas habilidades permitem remover parte da Dor, utilizá-la ofensivamente ou transformá-la em Fúria.

Ao contrário da Fúria, Dor permanece entre os inimigos durante a mesma tentativa de masmorra.`,
    },
    {
      id: 'barbaro:wounds', classId: 'barbaro', name: 'Feridas', category: 'stack',
      combatDisplay: { owner: 'enemy', displayType: 'stack', maxValue: 5, duration: true, icon: '🩸', hideWhenZero: true, priority: 10, color: 'red' },
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
      combatDisplay: { owner: 'player', displayType: 'charges', maxValue: 5, icon: '◆', hideWhenZero: false, priority: 10, color: 'amber' },
      shortDescription: 'Recurso de combate do Clérigo, de 0 a 5. É gerado por curas significativas, purificações e barreiras que absorvem o bastante — nunca por ataques básicos.',
      fullDescription: `Fé representa a devoção acumulada do Clérigo durante uma luta.

Ela varia entre 0 e 5 e nunca é gerada por ataques básicos.

Fé é gerada por quatro "Atos de Fé": uma cura direta ativa que restaure pelo menos 15% da Vida Base (12% com Mãos Consagradas); uma habilidade que realmente remova pelo menos um efeito negativo; uma barreira normal (nunca Graça) que absorva o suficiente antes de se esgotar; e o Julgamento de um inimigo atingindo 3 e depois 5 stacks pela primeira vez.

Diversas habilidades poderosas de todas as três especializações custam Fé, cobrado no início do lance e nunca devolvido caso ele erre.

Ao derrotar um inimigo, o próximo começa com no máximo 2 de Fé (nunca menos que 1) — o primeiro inimigo de uma tentativa sempre começa com 1.

A decisão central é escolher entre acumular Fé com jogo defensivo/utilitário ou gastá-la logo em uma habilidade de alto impacto.`,
    },
    {
      id: 'clerigo:grace', classId: 'clerigo', name: 'Graça', category: 'other',
      combatDisplay: { owner: 'player', displayType: 'bar', icon: '✧', hideWhenZero: true, priority: 11, color: 'sky' },
      shortDescription: 'Reserva extra de Vida criada pelo excesso de curas diretas ativas, quando desbloqueada. Absorve dano antes da Vida, mas nunca gera Fé nem outra Graça.',
      fullDescription: `Graça é uma reserva de vida extra, separada do HP e de barreiras normais.

Ela só existe depois de desbloqueada em Devoção, e é alimentada pelo excesso que ultrapassaria a Vida Máxima de curas diretas ATIVAS — nunca de regeneração, Roubo de Vida ou curas passivas.

Uma parte desse excesso é convertida em Graça, respeitando um teto baseado na Vida Máxima atual, e a Graça criada tem duração limitada, sendo renovada por uma nova conversão.

Ao sofrer dano direto, a ordem de absorção é sempre: mitigação, depois barreira normal, depois Graça, e só então a Vida.

Graça nunca gera Fé, nunca conta como cura para outros efeitos, nunca aciona os gatilhos de uma barreira normal e nunca gera mais Graça a partir de si mesma.`,
    },
    {
      id: 'clerigo:consecration', classId: 'clerigo', name: 'Consagração', category: 'state',
      combatDisplay: { owner: 'player', displayType: 'counter', duration: true, icon: '✦', hideWhenZero: true, priority: 12, color: 'gold' },
      shortDescription: 'Estado defensivo do Clérigo, criado ou renovado por várias habilidades de Retidão. Só pode existir uma instância por vez; talentos de Retidão dão a ela seus efeitos reais.',
      fullDescription: `Consagração é um estado que várias habilidades de Retidão criam ou renovam por alguns ciclos.

Só pode existir uma instância de cada vez — lançar uma nova substitui a anterior em vez de empilhar.

Por si só, Consagração não faz nada: são os talentos de Retidão que dão a ela seus efeitos reais, como bônus de defesa mágica e Tenacidade, redução na duração de efeitos negativos recebidos, redução no primeiro tick de dano contínuo sofrido, cura ao ver uma barreira destruída, e bônus de dano (com extensão de duração ao acertar) para habilidades ofensivas.

Alguns desses efeitos só acontecem uma vez por instância de Consagração.`,
    },
    {
      id: 'clerigo:judgment', classId: 'clerigo', name: 'Julgamento', category: 'stack',
      combatDisplay: { owner: 'enemy', displayType: 'stack', maxValue: 5, duration: true, icon: '⚖', hideWhenZero: true, priority: 10, color: 'amber' },
      shortDescription: 'Stacks exclusivos do Clérigo aplicados ao inimigo (máximo 5), da especialização Provação. Não causam dano por si só — talentos de Provação os convertem em dano, precisão ou consumo.',
      fullDescription: `Julgamento é uma mecânica exclusiva da especialização Provação do Clérigo.

Um inimigo pode possuir até 5 Julgamentos.

Aplicar um novo Julgamento renova a duração de TODOS os stacks já presentes no alvo.

Por si só, Julgamento não causa nenhum dano periódico — ele é a base sobre a qual talentos de Provação constroem bônus de dano mágico direto e de precisão.

Algumas habilidades consomem Julgamentos para golpes mais fortes; outras aproveitam os stacks atuais sem consumi-los, mas cortam sua duração restante como custo. A duração padrão é 5 ciclos (6 com Convicção).

Atingir 3 e depois 5 stacks pela primeira vez em um inimigo gera Fé.`,
    },
  ],
  guerreiro: [
    { id: 'guerreiro:posture', classId: 'guerreiro', name: 'Postura', category: 'resource', combatDisplay: { owner: 'enemy', displayType: 'bar', maxValue: 100, icon: '⚔', hideWhenZero: false, priority: 10, color: 'amber' }, shortDescription: 'Equilíbrio marcial do inimigo: Firme, Instável ou Aberto.', fullDescription: 'Todo inimigo começa com 100 de Postura. Dano de Postura é separado da Vida e ignora DEF, crítico e efeitos de dano. Após uma ação real, o inimigo recupera Postura.' },
    { id: 'guerreiro:guardbreak', classId: 'guerreiro', name: 'Guarda Quebrada', category: 'state', combatDisplay: { owner: 'enemy', displayType: 'status', icon: '✹', hideWhenZero: true, priority: 11, color: 'red' }, shortDescription: 'Janela curta: ataques físicos diretos recebem Precisão e ignoram DEF.', fullDescription: 'Ao chegar a zero de Postura, o inimigo fica com Guarda Quebrada por duas ações ofensivas do Guerreiro ou quatro ciclos.' },
    { id: 'guerreiro:parry', classId: 'guerreiro', name: 'Guarda Preparada', category: 'state', combatDisplay: { owner: 'player', displayType: 'status', icon: '🛡', hideWhenZero: true, priority: 10, color: 'slate' }, shortDescription: 'O próximo ataque direto que acertar é Aparado.', fullDescription: 'Aparo acontece depois da mitigação normal e antes de barreira e Vida. Ele não é Bloqueio.' },
    { id: 'guerreiro:riposte', classId: 'guerreiro', name: 'Riposta', category: 'resource', combatDisplay: { owner: 'player', displayType: 'charges', maxValue: 1, icon: '↩', hideWhenZero: true, priority: 11, color: 'amber' }, shortDescription: 'A próxima habilidade ofensiva recebe dano e Postura extras.', fullDescription: 'Aparo bem-sucedido prepara uma única Riposta; Aparo Pesado a transforma em Riposta Pesada.' },
    { id: 'guerreiro:reading', classId: 'guerreiro', name: 'Leitura', category: 'resource', combatDisplay: { owner: 'player', displayType: 'charges', maxValue: 1, icon: '◈', hideWhenZero: true, priority: 12, color: 'gold' }, shortDescription: 'Cruzar faixas de Postura prepara a próxima técnica Duelista.', fullDescription: 'Leitura é consumida no início da próxima habilidade Duelista ofensiva, inclusive se ela errar.' },
    { id: 'guerreiro:feint', classId: 'guerreiro', name: 'Finta Pronta', category: 'resource', combatDisplay: { owner: 'player', displayType: 'charges', maxValue: 1, icon: '◇', hideWhenZero: true, priority: 13, color: 'gold' }, shortDescription: 'A próxima ofensiva Duelista ganha Postura e penetração de DEF.', fullDescription: 'Finta Pronta é consumida no início da próxima habilidade Duelista ofensiva, mesmo se o golpe errar.' },
  ],
  mago: [
    { id: 'mago:runes', classId: 'mago', name: 'Runas Arcanas', category: 'resource', combatDisplay: { owner: 'player', displayType: 'charges', maxValue: 2, icon: '◆', hideWhenZero: false, priority: 10, color: 'purple' }, shortDescription: 'Toda terceira habilidade ativa do Mago é Amplificada.', fullDescription: 'Habilidades ativas do Mago formam a sequência 0 → 1 → 2 → Amplificada → 0. A terceira conjuração é consumida mesmo se errar. Runas não contam ataques básicos, itens, DOTs ou procs e levam no máximo 1 para o próximo inimigo.' },
    { id: 'mago:heat', classId: 'mago', name: 'Calor', category: 'resource', combatDisplay: { owner: 'player', displayType: 'bar', maxValue: 100, icon: '🔥', hideWhenZero: false, priority: 11, color: 'orange' }, shortDescription: 'Recurso do Piromante; 100 ativa Superaquecimento.', fullDescription: 'Calor aumenta com magias de Fogo e resfria após qualquer ação sem Fogo. As faixas 30, 60 e 90 fortalecem dano direto de Fogo; de 90 a 99 também há risco defensivo.' },
    { id: 'mago:overheat', classId: 'mago', name: 'Superaquecimento', category: 'state', combatDisplay: { owner: 'player', displayType: 'status', icon: '!', hideWhenZero: true, priority: 12, color: 'red' }, shortDescription: 'Ao chegar a 100 Calor, sofre dano próprio e volta a 50.', fullDescription: 'Depois de a magia resolver e gerar Calor, 100 ou mais causa dano verdadeiro de 5% da Vida Máxima, sem reduzir abaixo de 1 HP, e o Calor fica em 50.' },
    { id: 'mago:thermal_state', classId: 'mago', name: 'Estado Térmico', category: 'state', combatDisplay: { owner: 'enemy', displayType: 'status', icon: '❄', hideWhenZero: true, priority: 10, color: 'sky' }, shortDescription: 'Normal, Resfriado, Frágil ou Congelado — não são stacks.', fullDescription: 'Gelo avança o inimigo por estados. Resfriado reduz velocidade; Frágil reduz velocidade e MDEF; Congelado atrasa somente a próxima ação real do inimigo.' },
    { id: 'mago:frozen', classId: 'mago', name: 'Congelado', category: 'state', combatDisplay: { owner: 'enemy', displayType: 'status', icon: '❄', hideWhenZero: true, priority: 11, color: 'sky' }, shortDescription: 'A próxima ação real do inimigo demora 25% a mais e causa menos dano.', fullDescription: 'Cada ação inimiga pode receber somente um atraso de 25%, mesmo que Congelado seja removido e reaplicado antes da ação. Isso impede lock infinito.' },
    { id: 'mago:polarity', classId: 'mago', name: 'Última Polaridade', category: 'state', combatDisplay: { owner: 'player', displayType: 'status', icon: '±', hideWhenZero: true, priority: 20, color: 'gold' }, shortDescription: 'A última magia elétrica ofensiva foi positiva ou negativa.', fullDescription: 'Alternar polaridades fecha Circuitos. Uma magia elétrica Amplificada é Condutor Perfeito e fecha um Circuito mesmo com polaridade repetida.' },
    { id: 'mago:circuit', classId: 'mago', name: 'Circuito', category: 'resource', combatDisplay: { owner: 'player', displayType: 'charges', maxValue: 3, icon: '⚡', hideWhenZero: false, priority: 21, color: 'amber' }, shortDescription: 'Alternar polaridades acumula até 3 Circuitos e dispara Pulsos.', fullDescription: 'Polaridades opostas aumentam Circuito; iguais reduzem um. Ao fechar Circuito, um Pulso mágico acontece sem nova rolagem de precisão. Circuito 3 prepara Ressonância.' },
    { id: 'mago:resonance', classId: 'mago', name: 'Ressonância', category: 'state', combatDisplay: { owner: 'player', displayType: 'status', icon: '✦', hideWhenZero: true, priority: 22, color: 'gold' }, shortDescription: 'A próxima magia elétrica ofensiva cria um Eco de Ressonância.', fullDescription: 'Depois do Pulso de Circuito 3, Ressonância fica pronta. A próxima magia elétrica ofensiva resolve normalmente e depois cria um Eco mágico; uma nova Ressonância criada nesse mesmo cast permanece pronta.' },
  ],
  ladino: [
    { id: 'ladino:initiative', classId: 'ladino', name: 'Iniciativa', category: 'other', combatDisplay: { owner: 'player', displayType: 'status', icon: '⚡', hideWhenZero: true, priority: 9, color: 'amber' }, shortDescription: 'Após cada Ação Principal, o Ladino pode executar imediatamente uma Ação Rápida disponível.', fullDescription: 'A Janela de Iniciativa percorre as habilidades Rápidas equipadas na ordem escolhida pelo jogador e executa somente a primeira elegível. A Rápida não abre outra janela nem avança DOTs, durações, inimigos ou todos os cooldowns novamente.' },
    { id: 'ladino:stealth', classId: 'ladino', name: 'Furtivo', category: 'state', combatDisplay: { owner: 'player', displayType: 'status', icon: '◐', hideWhenZero: true, priority: 10, color: 'slate' }, shortDescription: 'Reduz a Precisão dos ataques diretos inimigos e prepara uma Emboscada.', fullDescription: 'Furtivo termina ao iniciar uma Principal ofensiva, ao sofrer um ataque direto que acerte ou depois de três Ações Principais. Um ataque inimigo que erre não remove o estado.' },
    { id: 'ladino:ambush', classId: 'ladino', name: 'Emboscada', category: 'other', shortDescription: 'Principal ofensiva iniciada em Furtivo ganha Precisão, Crítico e penetração de DEF.', fullDescription: 'Emboscada concede +8 pontos percentuais de Precisão, +8 pontos percentuais de Crítico e 10% de penetração de DEF naquele cast. Técnicas Assassinas marcadas aplicam Exposto ao acertar.' },
    { id: 'ladino:exposed', classId: 'ladino', name: 'Exposto', category: 'state', combatDisplay: { owner: 'enemy', displayType: 'status', duration: true, icon: '✹', hideWhenZero: true, priority: 10, color: 'red' }, shortDescription: 'Janela de execução criada por uma Emboscada Assassina.', fullDescription: 'Exposto é binário, não acumula, dura até três Ações Principais e só é consumido por habilidades que declaram isso. O consumo acontece no início do cast, mesmo se o golpe errar.' },
    { id: 'ladino:toxin', classId: 'ladino', name: 'Toxina', category: 'state', combatDisplay: { owner: 'enemy', displayType: 'counter', duration: true, icon: '☣', hideWhenZero: true, priority: 11, color: 'lime' }, shortDescription: 'Dano periódico com snapshot do ATK, preparado por Lâmina Envenenada.', fullDescription: 'O próximo golpe Principal físico direto que acertar aplica Toxina por três ciclos: 0,12x ATK por ciclo, ou 0,15x se foi Emboscada. Não critica, não ativa Roubo de Vida, on-hit ou Iniciativa; pode matar pela pipeline central.' },
    { id: 'ladino:images', classId: 'ladino', name: 'Imagens Residuais', category: 'resource', combatDisplay: { owner: 'player', displayType: 'charges', maxValue: 2, icon: '◇', hideWhenZero: true, priority: 20, color: 'sky' }, shortDescription: 'Ecos visuais preparados por Rápidas do Dançarino e consumidos por Principais sincronizáveis.', fullDescription: 'Imagens não são invocações. Uma Principal sincronizável consome as Imagens no início e, se ao menos um golpe original acertar, cria um Eco por Imagem depois da técnica. Ecos não rolam Precisão, não criticam e não ativam outros procs.' },
    { id: 'ladino:sharpened_echo', classId: 'ladino', name: 'Eco Afiado', category: 'state', combatDisplay: { owner: 'player', displayType: 'status', icon: '✧', hideWhenZero: true, priority: 21, color: 'sky' }, shortDescription: 'A próxima habilidade que consumir Imagens recebe +0,05 absoluto no ratio de Eco.', fullDescription: 'Eco Afiado possui uma única carga e não acumula. A carga é consumida junto das Imagens no início da próxima sincronização.' },
    { id: 'ladino:prepared_trick', classId: 'ladino', name: 'Truque Preparado', category: 'state', combatDisplay: { owner: 'player', displayType: 'status', duration: true, icon: '♠', hideWhenZero: true, priority: 30, color: 'gold' }, shortDescription: 'Uma Finta ou um Dado Viciado aguardando o momento certo.', fullDescription: 'Somente um Truque pode existir. Preparar outro substitui o anterior. Finta reage ao próximo ataque direto inimigo; Dado Viciado altera somente a primeira verificação de acerto da próxima Principal ofensiva.' },
    { id: 'ladino:advantage', classId: 'ladino', name: 'Vantagem', category: 'state', combatDisplay: { owner: 'player', displayType: 'status', icon: '★', hideWhenZero: true, priority: 31, color: 'gold' }, shortDescription: 'A próxima Principal ofensiva recebe Precisão e pode liberar efeitos especiais do Trapaceiro.', fullDescription: 'Vantagem é binária e é consumida no início do cast, mesmo se ele errar. Mestre do Improviso fortalece a Precisão, o coeficiente das técnicas Trapaceiras e restaura a Vantagem quando a habilidade inteira erra.' },
    { id: 'ladino:time_stolen', classId: 'ladino', name: 'Tempo Roubado', category: 'state', combatDisplay: { owner: 'enemy', displayType: 'status', icon: '⌛', hideWhenZero: true, priority: 32, color: 'amber' }, shortDescription: 'A próxima ação inimiga já agendada foi atrasada em 18%.', fullDescription: 'Uma mesma ação inimiga pode receber o atraso de Roubar Tempo apenas uma vez. O ticket é limpo quando essa ação acontece, impedindo acúmulos de 18% sobre a mesma ação.' },
  ],
  arqueiro: [
    { id: 'arqueiro:distance', classId: 'arqueiro', name: 'Distância', category: 'resource', combatDisplay: { owner: 'player', displayType: 'bar', maxValue: 3, icon: '↔', hideWhenZero: false, priority: 10, color: 'sky' }, shortDescription: 'Faixa de 0 a 3 que define a posição do Arqueiro perante o inimigo.', fullDescription: 'Todo inimigo começa no Horizonte (3). Ataques diretos inimigos que acertam fecham uma faixa; movimentos voluntários custam Tensão. Encurralado aplica penalidade de Precisão e dano recebido, enquanto Horizonte melhora Precisão e Crítico.' },
    { id: 'arqueiro:tension', classId: 'arqueiro', name: 'Tensão', category: 'resource', combatDisplay: { owner: 'player', displayType: 'bar', maxValue: 100, icon: '🏹', hideWhenZero: false, priority: 11, color: 'amber' }, shortDescription: 'Força acumulada pelos Disparos Precisos; em 100 ativa Arco Pleno.', fullDescription: 'Tensão vai de 0 a 100. Disparos Precisos que acertam geram valores conforme a Distância; erros perdem 8 e golpes inimigos acertando removem 18. Algumas técnicas gastam Tensão no início do cast.' },
    { id: 'arqueiro:full_draw', classId: 'arqueiro', name: 'Arco Pleno', category: 'state', combatDisplay: { owner: 'player', displayType: 'status', icon: '✦', hideWhenZero: true, priority: 12, color: 'gold' }, shortDescription: 'Estado atingido ao chegar a 100 de Tensão.', fullDescription: 'Arco Pleno é um estado informativo: a Tensão permanece em 100 até ser gasta, sem disparo automático.' },
    { id: 'arqueiro:cadence', classId: 'arqueiro', name: 'Cadência', category: 'resource', combatDisplay: { owner: 'player', displayType: 'bar', maxValue: 6, icon: '♫', hideWhenZero: false, priority: 20, color: 'emerald' }, shortDescription: 'Ritmo das Rajadas do caminho Tempestade.', fullDescription: 'Cadência vai de 0 a 6. Acertos de Rajadas aumentam o valor; erros completos reduzem 2. Ao chegar a 6, prepara Ritmo Perfeito.' },
    { id: 'arqueiro:perfect_rhythm', classId: 'arqueiro', name: 'Ritmo Perfeito', category: 'state', combatDisplay: { owner: 'player', displayType: 'status', icon: '♬', hideWhenZero: true, priority: 21, color: 'emerald' }, shortDescription: 'Carga preparada no auge da Cadência para adicionar um impacto à próxima Rajada.', fullDescription: 'Ritmo Perfeito é consumido no início de uma Rajada elegível, mesmo se ela errar, e reduz a Cadência para 2 antes de aplicar a geração normal.' },
    { id: 'arqueiro:steps', classId: 'arqueiro', name: 'Passos', category: 'resource', combatDisplay: { owner: 'player', displayType: 'charges', maxValue: 3, icon: '⇢', hideWhenZero: false, priority: 30, color: 'sky' }, shortDescription: 'Cargas de movimento do Vento Cortante.', fullDescription: 'Até 3 Passos são gerados ao mudar Distância ou quando o inimigo erra completamente. Habilidades que consomem Passos não regeneram pela própria movimentação.' },
    { id: 'arqueiro:reflex', classId: 'arqueiro', name: 'Reflexo', category: 'state', combatDisplay: { owner: 'player', displayType: 'counter', maxValue: 2, icon: '◌', hideWhenZero: true, priority: 31, color: 'sky' }, shortDescription: 'Resposta preparada após um erro completo do inimigo.', fullDescription: 'Reflexo dura até duas ações reais do Arqueiro. A próxima habilidade ofensiva recebe +8pp de Precisão e consome a preparação no início do cast.' },
    { id: 'arqueiro:flight', classId: 'arqueiro', name: 'Flechas em Voo', category: 'other', combatDisplay: { owner: 'enemy', displayType: 'counter', maxValue: 4, icon: '➶', hideWhenZero: true, priority: 40, color: 'sky' }, shortDescription: 'Flechas balísticas aguardando aterrissagem com snapshot próprio.', fullDescription: 'Cada Flecha em Voo guarda os valores ofensivos do lançamento e aterrissa após ações reais do Arqueiro. Até quatro podem existir; aterrissagens na mesma janela formam uma Convergência.' },
    { id: 'arqueiro:convergence', classId: 'arqueiro', name: 'Convergência', category: 'other', combatDisplay: { owner: 'enemy', displayType: 'status', icon: '✺', hideWhenZero: true, priority: 41, color: 'sky' }, shortDescription: 'Bônus aplicado quando várias Flechas em Voo aterrissam juntas.', fullDescription: 'Duas, três ou quatro flechas na mesma janela recebem multiplicadores individuais de 1,10x, 1,20x e 1,30x. Corda Incansável converte essa chegada em Cadência.' },
  ],
  paladino: [
    { id: 'paladino:conviction', classId: 'paladino', name: 'Convicção', category: 'resource', combatDisplay: { owner: 'player', displayType: 'charges', maxValue: 3, icon: '✦', hideWhenZero: false, priority: 10, color: 'gold' }, shortDescription: 'Quantidade de Virtudes diferentes ativas na Liturgia atual.', fullDescription: 'Convicção é derivada de Justiça, Coragem e Misericórdia: vale de zero a três e nunca existe como recurso separado. Vereditos capturam esse valor e consomem todas as Virtudes no início do cast, mesmo se errarem.' },
    { id: 'paladino:virtues', classId: 'paladino', name: 'Virtudes', category: 'state', combatDisplay: { owner: 'player', displayType: 'status', icon: '⚜', hideWhenZero: true, priority: 11, color: 'amber' }, shortDescription: 'Justiça, Coragem e Misericórdia reunidas durante a Liturgia.', fullDescription: 'Cada Virtude é binária. Invocar uma diferente aumenta a Convicção; repetir uma Virtude não renova a duração, mas faz dela a Regente.' },
    { id: 'paladino:liturgy', classId: 'paladino', name: 'Liturgia', category: 'state', combatDisplay: { owner: 'player', displayType: 'counter', duration: true, icon: '◈', hideWhenZero: true, priority: 12, color: 'gold' }, shortDescription: 'Janela de quatro ações do Paladino que mantém as Virtudes ativas.', fullDescription: 'A primeira Virtude inicia uma Liturgia de quatro ações e a ação inicial não reduz o contador. Cada ação real seguinte reduz uma; uma Virtude nova estende em uma, até quatro. Ao expirar, todas as Virtudes somem.' },
    { id: 'paladino:regent', classId: 'paladino', name: 'Virtude Regente', category: 'state', combatDisplay: { owner: 'player', displayType: 'status', icon: '♛', hideWhenZero: true, priority: 13, color: 'amber' }, shortDescription: 'A última Virtude invocada define a forma de um Veredito Pleno.', fullDescription: 'Justiça fortalece o golpe, Coragem cria uma Égide reforçada e Misericórdia restaura Vida perdida. Repetir uma Virtude pode trocar a Regente sem aumentar Convicção.' },
    { id: 'paladino:verdict', classId: 'paladino', name: 'Veredito', category: 'other', shortDescription: 'Finalizador que captura e consome a Liturgia no início do cast.', fullDescription: 'O snapshot guarda Virtudes, Convicção e Regente antes da rolagem de acerto. Por isso um erro não devolve a Liturgia. Com três Virtudes, o Veredito é Pleno e recebe a forma da Regente.' },
    { id: 'paladino:aegis', classId: 'paladino', name: 'Égide', category: 'state', combatDisplay: { owner: 'player', displayType: 'status', duration: true, icon: '🛡', hideWhenZero: true, priority: 14, color: 'sky' }, shortDescription: 'Reduz o próximo golpe direto depois da mitigação, com teto próprio.', fullDescription: 'Égide não é Bloqueio nem barreira. Ela só reage a um golpe inimigo direto, nunca a dano periódico. Uma nova Égide substitui a anterior. A versão Plena de Coragem pode proteger dois golpes, com metade da eficiência no segundo.' },
  ],
  necromante: [
    { id: 'necromante:souls', classId: 'necromante', name: 'Fragmentos de Alma', category: 'resource', combatDisplay: { owner: 'player', displayType: 'charges', maxValue: 6, icon: '◆', hideWhenZero: false, priority: 10, color: 'purple' }, shortDescription: 'Recurso central do Necromante. A essência da presa se fragmenta conforme sua vida atravessa certos limites, permitindo invocações, sacrifícios e técnicas de Ceifa.', fullDescription: 'Fragmentos de Alma são arrancados quando a presa cruza 75%, 50% e 25% de Vida pela primeira vez, e também na morte. O Necromante armazena até 6 e gasta esse recurso em Pragas, Servos, proteção e Ceifa. Apenas uma pequena quantidade passa ao próximo inimigo.' },
    { id: 'necromante:decomposition', classId: 'necromante', name: 'Decomposição', category: 'stack', combatDisplay: { owner: 'enemy', displayType: 'stack', maxValue: 5, duration: true, icon: '☣', hideWhenZero: true, priority: 10, color: 'emerald' }, shortDescription: 'Stack exclusivo que deteriora a presa e aumenta a intensidade da Praga Necrótica.', fullDescription: 'Decomposição acumula até 5 vezes, não causa dano sozinha e dura 4 ciclos. Cada stack fortalece em 4% os ticks da Praga Necrótica. Nova aplicação adiciona stack e renova toda a duração.' },
    { id: 'necromante:plague', classId: 'necromante', name: 'Praga Necrótica', category: 'state', combatDisplay: { owner: 'enemy', displayType: 'counter', duration: true, icon: '☠', hideWhenZero: true, priority: 11, color: 'lime' }, shortDescription: 'Doença sobrenatural exclusiva do Necromante que causa dano periódico e fica mais poderosa conforme a presa se Decompõe.', fullDescription: 'A Praga guarda um snapshot do MATK no momento da aplicação, não critica, não ativa Roubo de Vida nem on-hit, ignora MDEF após seu dano-base e pode matar ou atravessar limites de Alma. Somente uma Praga pode existir na presa.' },
    { id: 'necromante:servants', classId: 'necromante', name: 'Servos Ósseos', category: 'other', combatDisplay: { owner: 'player', displayType: 'counter', maxValue: 2, icon: '♙', hideWhenZero: true, priority: 11, color: 'slate' }, shortDescription: 'Mortos-vivos temporários que atacam independentemente e podem ser sacrificados.', fullDescription: 'Cada Servo possui um relógio próprio e uma quantidade limitada de ataques mágicos necróticos. Eles não criticam, não ativam Roubo de Vida ou on-hit, mas podem matar, atravessar limites de Alma e disparar fases de chefe. Certas técnicas sacrificam ataques ou o Servo inteiro.' },
  ],
  cavaleiro: [
    {
      id: 'cavaleiro:determination', classId: 'cavaleiro', name: 'Determinação', category: 'resource',
      combatDisplay: { owner: 'player', displayType: 'bar', maxValue: 100, icon: '🛡', hideWhenZero: false, priority: 10, color: 'slate' },
      shortDescription: 'Recurso defensivo de Bastião. Bloqueios e algumas defesas geram Determinação, usada para ativar as técnicas mais poderosas do Cavaleiro.',
      fullDescription: `Determinação representa a capacidade do Cavaleiro de transformar defesa em oportunidade.

Bloqueios bem-sucedidos geram Determinação. Algumas barreiras e posturas defensivas também podem gerar o recurso ao impedir dano.

A Determinação varia de 0 a 100 e é reiniciada contra cada novo inimigo.

Habilidades poderosas de Bastião, como Escudo Colossal, Contra-Ataque Absoluto e Fortaleza Viva, consomem Determinação.

A decisão principal é escolher entre utilizar o recurso para sobreviver imediatamente ou preservá-lo para uma defesa ou contra-ataque mais poderoso.`,
    },
    {
      id: 'cavaleiro:retaliation', classId: 'cavaleiro', name: 'Retaliação', category: 'stack',
      combatDisplay: { owner: 'player', displayType: 'charges', maxValue: 1, icon: '↩', hideWhenZero: true, priority: 11, color: 'slate' },
      shortDescription: 'Bloquear repetidamente prepara um contra-ataque baseado na DEF do Cavaleiro.',
      fullDescription: `Retaliação transforma a defesa do Cavaleiro em poder ofensivo.

Após bloquear três ataques, o Cavaleiro recebe uma carga de Retaliação.

A próxima ação ofensiva direta consome a carga e causa dano físico adicional baseado na DEF atual, com um limite relacionado ao ATK.

Isso permite que uma build defensiva responda ao inimigo sem transformar DEF em uma fonte ilimitada de dano.`,
    },
    {
      id: 'cavaleiro:momentum', classId: 'cavaleiro', name: 'Momentum', category: 'resource',
      combatDisplay: { owner: 'player', displayType: 'bar', icon: '➤', hideWhenZero: false, priority: 20, color: 'orange' },
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
      combatDisplay: { owner: 'player', displayType: 'charges', maxValue: 3, icon: '◆', hideWhenZero: false, priority: 30, color: 'gold' },
      shortDescription: 'Recurso tático de Comando. Algumas habilidades geram Ordens e outras as consomem para produzir efeitos mais poderosos.',
      fullDescription: `Ordens representam a preparação tática do Cavaleiro.

O Cavaleiro pode armazenar até três Ordens.

Algumas habilidades de Comando geram Ordens, enquanto técnicas como Ordem: Avançar, Ordem: Resistir e Ordem: Executar consomem o recurso.

Como o combate é solo, o Cavaleiro utiliza as Ordens para controlar seu próprio ritmo de batalha.

Ao desbloquear Grande Comandante, alcançar três Ordens prepara um Comando Supremo.`,
    },
    {
      id: 'cavaleiro:commandSupreme', classId: 'cavaleiro', name: 'Comando Supremo', category: 'state',
      combatDisplay: { owner: 'player', displayType: 'status', icon: '✦', hideWhenZero: true, priority: 31, color: 'gold' },
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
  cacador: [
    {
      id: 'cacador:traps', classId: 'cacador', name: 'Armadilhas', category: 'other',
      combatDisplay: { owner: 'player', displayType: 'charges', maxValue: 3, icon: '◇', hideWhenZero: true, priority: 10, color: 'lime' },
      shortDescription: 'Armadilhas de Armadilhas ficam armadas em silêncio e só disparam quando a presa completa uma ação real (acerto ou erro) — nunca no instante em que são preparadas.',
      fullDescription: `Armadilhas são a mecânica central da especialização Armadilhas.

Uma habilidade de armadilha não causa dano ao ser usada — ela apenas arma um dispositivo, que fica esperando.

O Caçador pode manter até 2 armadilhas armadas ao mesmo tempo (3 com Mestre Armadilheiro).

Assim que o inimigo completa uma ação real — um ataque que acerta ou erra o Caçador, nunca uma ação perdida por atordoamento/sono — a armadilha mais antiga ainda armada dispara automaticamente, no máximo uma vez por ação inimiga.

O dano direto de uma armadilha usa o ATK atual do Caçador no momento em que ela dispara (não no momento em que foi armada), mas nunca rola precisão, crítico, roubo de vida ou gatilhos de acerto direto — apenas a mitigação normal de defesa.

Algumas armadilhas primadas recebem um bônus de dano direto único; outras aplicam Poison, um enfraquecimento no inimigo ou geram Rastro ao disparar.

Armadilhas nunca persistem entre inimigos ou entre tentativas de masmorra.`,
    },
    {
      id: 'cacador:trail', classId: 'cacador', name: 'Rastro', category: 'stack',
      combatDisplay: { owner: 'enemy', displayType: 'stack', maxValue: 5, icon: '●', hideWhenZero: false, priority: 10, color: 'emerald' },
      shortDescription: 'Stacks de 0 a 5 acumulados contra o inimigo atual, ganhos sempre que a presa completa uma ação — nunca quando o Caçador acerta um golpe. Em 3 ou mais, o inimigo se torna Presa Marcada.',
      fullDescription: `Rastro é a mecânica central da especialização Rastreio.

Um inimigo pode acumular de 0 a 5 Rastro. O stack nunca é consumido — ele só sobe até o teto e é reiniciado quando um novo inimigo aparece.

Rastro é ganho quando o INIMIGO completa uma ação real (acerto ou erro), não quando o Caçador o atinge — a mecânica representa estudar os padrões da presa, não golpeá-la.

Algumas habilidades concedem Rastro adicional diretamente.

Ao atingir 3 ou mais Rastro, o inimigo se torna Presa Marcada — um estado sempre calculado a partir do Rastro atual, nunca armazenado separadamente.

Alcançar o Rastro máximo (5) desbloqueia os bônus mais fortes de talentos que exigem "leitura completa" da presa.`,
    },
    {
      id: 'cacador:markedPrey', classId: 'cacador', name: 'Presa Marcada', category: 'mark',
      combatDisplay: { owner: 'enemy', displayType: 'status', icon: '⊙', hideWhenZero: true, priority: 11, color: 'amber' },
      shortDescription: 'Estado automático quando o inimigo atual possui 3 ou mais Rastro. Concede bônus de dano, precisão e dano de armadilhas, e potencializa diversos talentos das três especializações.',
      fullDescription: `Presa Marcada é o estado que representa ter estudado o suficiente sobre o inimigo atual para explorá-lo.

Ele nunca é ativado manualmente — é sempre derivado automaticamente do Rastro atual (3 ou mais).

Enquanto ativo, Presa Marcada concede diretamente mais dano direto do Caçador, mais precisão e mais dano de armadilhas.

Além disso, diversos talentos de todas as três especializações recebem bônus adicionais especificamente contra Presa Marcada — de penetração de defesa a dano crítico.

Presa Marcada nunca amplia dano contínuo (Poison).`,
    },
    {
      id: 'cacador:breaches', classId: 'cacador', name: 'Brechas', category: 'stack',
      combatDisplay: { owner: 'enemy', displayType: 'stack', maxValue: 3, duration: true, icon: '◇', hideWhenZero: true, priority: 12, color: 'sky' },
      shortDescription: 'Stacks de 0 a 3 no inimigo, com duração renovada a cada novo ganho. Não causam dano — abrem oportunidades de precisão, crítico e execuções que as consomem.',
      fullDescription: `Brechas são a mecânica central da especialização Precisão da Caça.

Um inimigo pode possuir de 0 a 3 Brechas, com duração de 6 ciclos — ganhar uma nova Brecha renova a duração de todas as já presentes.

Brechas não causam nenhum dano por si só. Elas representam uma oportunidade tática: aberturas na guarda do inimigo.

Diversos talentos concedem bônus de precisão e dano crítico proporcionais às Brechas ativas no alvo.

Habilidades de execução consomem Brechas — sempre apenas quando o golpe realmente acerta — para causar dano ampliado ou garantir efeitos como crítico automático.

Brechas nunca funcionam como Feridas do Bárbaro: não causam dano por stack, representam oportunidade tática, não acúmulo de sofrimento.`,
    },
  ],
  feiticeiro: [
    { id:'feiticeiro:pulse', classId:'feiticeiro', name:'Pulso Inato', category:'resource', combatDisplay:{owner:'player',displayType:'bar',maxValue:6,icon:'✦',hideWhenZero:false,priority:10,color:'purple'}, shortDescription:'Cada habilidade ativa normal gera Pulso; no 6º ponto a próxima habilidade desperta.', fullDescription:'Pulso vai de 0 a 6, persiste entre inimigos e reinicia numa nova tentativa. Cada cast normal gera 1, mais 1 se houver acerto direto e mais 1 se houver crítico.' },
    { id:'feiticeiro:surge', classId:'feiticeiro', name:'Surto Inato', category:'state', combatDisplay:{owner:'player',displayType:'status',icon:'⚡',hideWhenZero:true,priority:11,color:'gold'}, shortDescription:'Com Pulso 6, a próxima habilidade ativa será Desperta.', fullDescription:'Ao começar um cast com Pulso 6, o Pulso é consumido imediatamente e a magia recebe a transformação da sua especialização.' },
    { id:'feiticeiro:awakened', classId:'feiticeiro', name:'Magia Desperta', category:'state', combatDisplay:{owner:'player',displayType:'status',icon:'✹',hideWhenZero:true,priority:12,color:'orange'}, shortDescription:'Ruptura é Intensificada, Reverberação é Refratada e Moldagem é Moldada.', fullDescription:'A transformação é aplicada uma vez à ação e não cria loops, Pulso ou recursos extras.' },
    { id:'feiticeiro:fracture', classId:'feiticeiro', name:'Fraturas', category:'stack', combatDisplay:{owner:'enemy',displayType:'stack',maxValue:3,icon:'◇',hideWhenZero:true,priority:10,color:'red'}, shortDescription:'Até 3 Fraturas reduzem a MDEF efetiva contra Ruptura e alimentam os finalizadores.', fullDescription:'Fraturas são específicas do inimigo. Cada uma dá 3% de penetração de MDEF para Ruptura e são consumidas por Ponto de Colapso/Supernova.' },
    { id:'feiticeiro:resonance', classId:'feiticeiro', name:'Ressonância', category:'resource', combatDisplay:{owner:'player',displayType:'charges',maxValue:2,icon:'◌',hideWhenZero:false,priority:13,color:'sky'}, shortDescription:'Magias Despertas de Reverberação acumulam até 2 Ressonâncias para fortalecer o próximo cast normal.', fullDescription:'Ressonância persiste entre inimigos. A próxima habilidade normal consome uma carga após ser conjurada e adiciona 2 ao Pulso gerado.' },
    { id:'feiticeiro:control', classId:'feiticeiro', name:'Controle Arcano', category:'resource', combatDisplay:{owner:'player',displayType:'charges',maxValue:2,icon:'◎',hideWhenZero:false,priority:14,color:'lime'}, shortDescription:'Controle guardado dá precisão e penetração a toda magia direta; Moldagem Desperta gera carga.', fullDescription:'Controle persiste entre inimigos. Cada carga concede +2pp de precisão e +2% de penetração de MDEF a habilidades mágicas diretas.' },
  ],
  bardo: [
    { id:'bardo:score', classId:'bardo', name:'Partitura', category:'resource', combatDisplay:{owner:'player',displayType:'status',icon:'♫',hideWhenZero:false,priority:10,color:'gold'}, shortDescription:'As três últimas habilidades normais escrevem Notas Marcato, Dissonante ou Lírica.', fullDescription:'Uma habilidade ativa normal escreve exatamente uma Nota após resolver. Ataques básicos, DOTs, procs, Finales e Bis não escrevem. Três Notas formam uma Frase.' },
    { id:'bardo:phrase', classId:'bardo', name:'Frases Musicais', category:'state', combatDisplay:{owner:'player',displayType:'status',icon:'♪',hideWhenZero:false,priority:11,color:'amber'}, shortDescription:'Refrão, Contracanto e Harmonia Perfeita transformam a Partitura em efeitos.', fullDescription:'Três iguais formam Refrão e geram Ovação; duas iguais formam Contracanto e carregam a minoria; uma de cada forma Harmonia e gera cura/Ovação.' },
    { id:'bardo:ovation', classId:'bardo', name:'Ovação', category:'resource', combatDisplay:{owner:'player',displayType:'charges',maxValue:1,icon:'★',hideWhenZero:false,priority:12,color:'gold'}, shortDescription:'Recurso 0–1 gerado por Refrões e Harmonia e gasto por Finales/Bis.', fullDescription:'Ovação persiste entre inimigos da mesma tentativa e nunca passa de 1. Contracanto, ataques básicos, Finale e Bis não geram Ovação.' },
    { id:'bardo:accent', classId:'bardo', name:'Acento', category:'state', combatDisplay:{owner:'player',displayType:'status',icon:'!',hideWhenZero:true,priority:13,color:'orange'}, shortDescription:'O próximo golpe Marcato recebe um componente físico independente.', fullDescription:'Acento é preparado por básico Marcato acertado ou Frase Marcato. É consumido no início da primeira habilidade Marcato elegível, mesmo se errar.' },
    { id:'bardo:fortissimo', classId:'bardo', name:'Fortíssimo', category:'state', combatDisplay:{owner:'player',displayType:'status',icon:'⚡',hideWhenZero:true,priority:14,color:'red'}, shortDescription:'A próxima ofensiva direta recebe +15% dano e +5pp Crítico.', fullDescription:'Fortíssimo é preparado por Refrão Marcato, consumido no início da próxima ofensiva direta e não afeta cura, DOTs ou procs.' },
    { id:'bardo:countertempo', classId:'bardo', name:'Contratempo', category:'state', combatDisplay:{owner:'enemy',displayType:'status',icon:'◌',hideWhenZero:true,priority:15,color:'purple'}, shortDescription:'Observa a próxima ação real do inimigo para converter acertos/erros em Eco.', fullDescription:'Contratempo só resolve no fim de uma ação real. Algum acerto gera 1 Eco, erro total gera 2 e ação sem hit direto gera 1; depois termina.' },
    { id:'bardo:echo', classId:'bardo', name:'Eco Roubado', category:'resource', combatDisplay:{owner:'enemy',displayType:'charges',maxValue:2,icon:'◇',hideWhenZero:false,priority:16,color:'purple'}, shortDescription:'Recurso 0–2 do inimigo atual, criado por Contratempo e gasto por Dissonância.', fullDescription:'Eco reseta ao surgir novo inimigo. Trítono gasta 1; Ressonância Partida ou uma habilidade com Nota Eco gasta 2.' },
    { id:'bardo:wildcard', classId:'bardo', name:'Nota Coringa', category:'other', combatDisplay:{owner:'player',displayType:'status',icon:'?',hideWhenZero:true,priority:20,color:'amber'}, shortDescription:'Interlúdio e Verso de Improviso escolhem deterministicamente a Nota que a Partitura pede.', fullDescription:'Harmony First completa a voz faltante; Refrain First copia um par igual. A escolha altera somente a Nota, nunca o efeito principal da habilidade.' },
    { id:'bardo:encore', classId:'bardo', name:'Bis', category:'state', combatDisplay:{owner:'player',displayType:'status',icon:'↻',hideWhenZero:true,priority:21,color:'gold'}, shortDescription:'Repete a última habilidade normal elegível a 55% sem duplicar efeitos.', fullDescription:'Bis consome Ovação e repete um payload sanitizado de dano/cura com novas rolagens. Não escreve Nota, não replica CC, debuffs, custos, recursos ou Finale.' },
  ],
};

const ATTRIBUTE_NOTES: Partial<Record<ClassId, ClassAttributeNote[]>> = {
  bruxo: [
    { attribute:'int', label:'INT', role:'Principal', description:'Aumenta MATK e o dano das magias; Anatomia da Alma também converte INT em penetração limitada.' },
    { attribute:'wis', label:'SAB', role:'Secundário', description:'Aumenta MDEF, Poder de Suporte e a eficiência das barreiras de Negociação.' },
    { attribute:'vit', label:'VIT', role:'Defensivo', description:'Aumenta Vida Máxima e ajuda a sobreviver ao preço das Cobranças.' },
    { attribute:'luk', label:'SOR', role:'Secundário ofensivo', description:'Aumenta chance e dano crítico pelo sistema universal.' },
  ],
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
  cacador: [
    { attribute: 'dex', label: 'DES', role: 'Principal', description: 'Aumenta ATK físico, precisão e o dano direto de armadilhas — base de todas as três especializações.' },
    { attribute: 'agi', label: 'AGI', role: 'Secundário', description: 'Aumenta evasão e velocidade de ação, com sinergia forte em Rastreio (armadilha armada, Presa Marcada, Rastro máximo).' },
    { attribute: 'wis', label: 'SAB', role: 'Secundário tático', description: 'Amplia o dano de Poison originado de armadilhas — nunca o dano direto do Caçador.' },
    { attribute: 'luk', label: 'SOR', role: 'Secundário ofensivo', description: 'Aumenta chance e dano crítico, com sinergia em Precisão da Caça (Brechas, Presa Marcada).' },
    { attribute: 'vit', label: 'VIT', role: 'Terciário', description: 'Aumenta vida máxima e reduz dano direto recebido enquanto uma armadilha está armada ou o Rastro está máximo.' },
  ],
  feiticeiro: [
    { attribute:'int', label:'INT', role:'Principal', description:'Aumenta MATK e todo o dano mágico direto das três especializações.' },
    { attribute:'luk', label:'SOR', role:'Secundário ofensivo', description:'Aumenta chance e dano crítico, especialmente em Pulso e Reverberação.' },
    { attribute:'dex', label:'DES', role:'Secundário tático', description:'Melhora a precisão, reforçando a consistência da Moldagem.' },
  ],
  bardo: [
    { attribute:'wis', label:'SAB', role:'Principal', description:'Aumenta Poder de Suporte, MDEF e Tenacidade; melhora curas da composição.' },
    { attribute:'dex', label:'DES', role:'Secundário', description:'Aumenta ATK físico, Precisão e o componente independente do Acento.' },
    { attribute:'luk', label:'SOR', role:'Secundário', description:'Aumenta Crítico e Dano Crítico das performances ofensivas.' },
    { attribute:'int', label:'INT', role:'Base mágica', description:'Aumenta MATK do Alaúde Encantado; não é transformada em atributo principal.' },
  ],
};

const SPECIALIZATIONS: Partial<Record<ClassId, ClassSpecializationNote[]>> = {
  bruxo: [
    { pathId:'maldicao', identity:'INT + Vínculo + Nome Verdadeiro.', style:'Identidade e transferência de Dívida.', loop:'Vincular → reunir Fragmentos → revelar Nome Verdadeiro → consumir no momento certo.' },
    { pathId:'pacto', identity:'VIT/SAB + pagamento voluntário + Crédito.', style:'Negociação segura, ainda ofensiva.', loop:'Gerar Dívida → pagar voluntariamente → financiar a próxima magia → manter barreiras.' },
    { pathId:'corrupcao', identity:'INT + Cobrança + Estigmas.', style:'Maior dano e maior risco.', loop:'Forçar Cobrança → acumular Estigmas → converter cicatrizes em dano → sobreviver ao próximo preço.' },
  ],
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
      loop: 'Curar com eficiência → gerar Fé por curas significativas → converter excesso de cura em Graça → gastar Fé em utilidade/purificação.',
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
  cacador: [
    {
      pathId: 'armadilhas',
      identity: 'DES + Armadilhas.',
      style: 'Preparação silenciosa — a especialização mais segura e a de menor DPS sustentado, mas com o maior burst quando várias armadilhas disparam em sequência.',
      loop: 'Armar armadilhas → esperar a presa agir → deixar a mais antiga disparar → primar/reabastecer para o próximo ciclo.',
    },
    {
      pathId: 'rastreio',
      identity: 'DES + AGI + Rastro/Presa Marcada.',
      style: 'Paciência tática — cresce em lutas longas, nunca compete com um Arqueiro em burst inicial.',
      loop: 'Deixar a presa agir → acumular Rastro → alcançar Presa Marcada (e depois Rastro máximo) → converter a leitura completa em dano/evasão/velocidade.',
    },
    {
      pathId: 'precisao-caca',
      identity: 'DES + SOR + Brechas.',
      style: 'Dano sustentado mais próximo de um atirador puro — a especialização de maior DPS direto do Caçador, sem preparação de armadilhas.',
      loop: 'Abrir Brechas com acertos/críticos/erros do inimigo → manter ou consumir as Brechas → executar com bônus de precisão/crítico/penetração.',
    },
  ],
  feiticeiro: [
    { pathId:'explosao', identity:'INT + Pulso + Fraturas.', style:'Explosão preparada e finalizadores.', loop:'Alcançar Pulso 6 → Despertar → Intensificar e consumir Fraturas.' },
    { pathId:'sobrecarga', identity:'INT + Eco + Ressonância.', style:'Frequência e dano sustentado.', loop:'Despertar → gerar Ressonância → consumir no próximo cast normal.' },
    { pathId:'dominio', identity:'INT + Precisão + Controle.', style:'Consistência, penetração e correção.', loop:'Guardar Controle → moldar a magia → corrigir uma falha decisiva.' },
  ],
  bardo: [
    { pathId:'cancao-guerra', identity:'DES + MATK/ATK + Acento/Fortíssimo.', style:'Marcha de Guerra — híbrido ofensivo.', loop:'Escrever Marcato → fechar Refrão/Contracanto → preparar Acento e Fortíssimo → gastar no pico.' },
    { pathId:'melodia-sombria', identity:'Dissonância + Contratempo/Eco.', style:'Interferência e controle.', loop:'Escrever Dissonantes → observar a ação inimiga → converter erros em Eco → consumir no Trítono/Ressonância.' },
    { pathId:'inspiracao', identity:'Lírica + Coringas/Bis.', style:'Improviso, cura moderada e adaptação.', loop:'Completar Harmonia/Refrão → curar e guardar Ovação → escolher a Nota pedida → repetir payload seguro com Bis.' },
  ],
};

const COMBINATIONS: Partial<Record<ClassId, ClassCombinationNote[]>> = {
  bruxo: [
    { pathIds:['maldicao','pacto'], name:'Nome + Negociação', description:'Paga através do inimigo e do contrato, a combinação mais segura.' },
    { pathIds:['maldicao','corrupcao'], name:'Nome + Transgressão', description:'Alterna Nome Verdadeiro e Cobrança para burst e risco controlados.' },
    { pathIds:['pacto','corrupcao'], name:'Negociação + Transgressão', description:'Crédito posterga o risco e permite escolher quando sofrer a Cobrança.' },
  ],
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
  cacador: [
    { pathIds: ['armadilhas', 'rastreio'], name: 'Armadilhas + Rastreio', description: 'Caçador de emboscada — a combinação mais segura e de menor DPS sustentado, mas a mais resistente das três.' },
    { pathIds: ['armadilhas', 'precisao-caca'], name: 'Armadilhas + Precisão da Caça', description: 'Explosão preparada — o maior burst do Caçador quando várias armadilhas primadas disparam em sequência, sem sustentação de longo prazo.' },
    { pathIds: ['rastreio', 'precisao-caca'], name: 'Rastreio + Precisão da Caça', description: 'Atirador puro — o maior DPS direto sustentado do Caçador, o mais próximo de um Arqueiro em jogo prolongado.' },
  ],
  feiticeiro: [
    { pathIds:['explosao','sobrecarga'], name:'Ruptura + Reverberação', description:'Burst e ecos para alternar execução e frequência.' },
    { pathIds:['explosao','dominio'], name:'Ruptura + Moldagem', description:'Finalizadores explosivos com precisão e penetração.' },
    { pathIds:['sobrecarga','dominio'], name:'Reverberação + Moldagem', description:'Sustentação confiável, ecos e correção de erros.' },
  ],
  bardo: [
    { pathIds:['cancao-guerra','melodia-sombria'], name:'Marcha + Dissonância', description:'Acento e Fortíssimo alternados com Contratempo e Eco; alto dano e utilidade.' },
    { pathIds:['cancao-guerra','inspiracao'], name:'Marcha + Improviso', description:'Coringas fecham Refrões Marcato e a cura sustenta os picos híbridos.' },
    { pathIds:['melodia-sombria','inspiracao'], name:'Dissonância + Improviso', description:'Controle do inimigo, Harmonia e Bis para uma performance segura.' },
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
