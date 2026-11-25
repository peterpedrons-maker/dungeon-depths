# Propostas de puzzles (sessão de design de puzzles)

> Arquivo da sessão de **projeto de puzzles**. Nada aqui está no jogo ainda: são propostas para o Pedro aprovar e para a
> sessão principal implementar. Quando uma sala for aprovada e implementada, a solução passa para `PUZZLES.md`.
> Cada proposta detalhada tem um verificador em `tools/verify_<nome>.mjs` que prova por força bruta que a solução é única.

## A curva entre a sala 6 e o Tribunal (salas 7 a 15, níveis 6 a 9, só Fogo)

O que o jogador já sabe ao sair da sala 6: ACENDER, UM a QUATRO, BRASEIRO, TEMPO, CONFIRMADO, BOATO, ANTES, DEPOIS; a ordem por
números (sala 4), o tempo e o tamanho da chama (sala 5), acender frases e a cadeia de ANTES/DEPOIS (sala 6).
O que o Tribunal (sala 16, nível 10) ainda exige e ninguém ensinou: **GRANDE e PEQUENO** como nomes de braseiros, **VERDADE**,
**IGUAL** (a lei «DOIS BOATO = VERDADE»), **TODOS**, **ORDEM**, **CINCO**, e duas ideias: **um boato pode ser verdade** e **a lei da contagem**
(exatamente N boatos são verdade), mais o passo do Tribunal em que **dois boatos dizem a mesma coisa** com nomes diferentes.

A curva entrega isso aos poucos, uma ideia por sala:

| # | Nome (provisório) | Nível | A ideia que ensina | Palavra nova |
|---|---|---|---|---|
| 7 | **Os Apelidos** | 6 | o mesmo braseiro tem dois nomes (número e tamanho); a 1ª impressão do glifo engana | GRANDE, PEQUENO |
| 8 | **O Boato Verdadeiro** | 6 | boato não é mentira: é "não confirmado". Acender o que é VERDADE, decidindo cada boato pela cadeia | VERDADE |
| 9 | O Quinto | 7 | 5 braseiros e frases em **três paredes**: a cadeia só fecha juntando parágrafos; a porta diz «ACENDER TODOS BRASEIRO ORDEM» | CINCO, TODOS, ORDEM |
| 10 | O Salão das Três Portas | 7 | **hub** com anexos: a ordem resolvida num anexo é o número que outro anexo pede (informação espalhada por salas) | (nenhuma; reprise) |
| 11 | A Chama que Diz | 8 | ordem + **tempo**: as frases deixam DUAS ordens e só uma é possível com as durações (o pequeno tem de ser o último) | (nenhuma) |
| 12 | A Lei Pequena | 8 | 1ª **lei da contagem**, mínima: «UM BOATO = VERDADE» com 3 boatos e 4 braseiros | IGUAL |
| 13 | Os Que Dizem o Mesmo | 8 | dois boatos equivalentes (um com número, outro com apelido) + a lei: "ou os dois, ou nenhum" | (nenhuma) |
| 14 | A Lei Dobrada | 9 | «DOIS BOATO = VERDADE» com 4 braseiros e 4 boatos; testar as duas hipóteses e achar a contradição | (nenhuma) |
| 15 | A Memória da Casa | 9 | ensaio do Tribunal: 5 braseiros, apelidos, lei e **uma frase vista numa sala anterior** (o diário vira pista) | (nenhuma) |
| 16 | O Tribunal dos Rumores | 10 | (já existe) | — |

Notas da curva:
- 7 e 8 são **nível 6** pela régua (§17): "a primeira impressão engana". Na 7, o desenho do glifo PEQUENO parece UM numa moldura (e o GRANDE parece QUATRO). Na 8, o hábito da sala 6 ("só acender as confirmadas", "boato é mentira") é exatamente o que falha.
- 9 e 10 são **nível 7**: informação espalhada (várias paredes, várias salas) e planejar antes de agir.
- 11 a 13 são **nível 8**: combinações de duas ideias já dadas (ordem + tempo; boato + contagem; nomes + equivalência).
- 14 e 15 são **nível 9**: as peças do Tribunal, uma a uma, já sem ajuda; a 15 exige o diário.
- Entre elas cabem os salões com várias portas e salas abertas para explorar (§20), sem puzzle obrigatório.

---

## Sala 7 — Os Apelidos (NÍVEL 6) · ensina GRANDE e PEQUENO

**A ideia:** um braseiro pode ser chamado pelo **número** ou pelo **tamanho**. As frases misturam os dois nomes, e a cadeia só fecha
quando o jogador percebe quem é quem **olhando a sala**. A armadilha é o próprio desenho dos glifos: no léxico, GRANDE é a moldura de
qualidade (⏐ ⏐) com os **quatro pontos dos cantos** (parece QUATRO) e PEQUENO é a mesma moldura com **um ponto no meio** (parece UM).
Quem lê "PEQUENO = UM" chega a uma **contradição** (não a outra resposta): percebe sozinho que leu errado, sem chutar.

### A sala (formato FireSpec)
```ts
export const FIRE_APELIDOS: FireSpec = {
  name: 'Os Apelidos',
  subtitle: 'Cinco braseiros. Um deles não tem número.',
  hx: 5.6, z0: -17, h: 3.8,
  braziers: [
    { x: -3.4, dz: 13.5, mark: 'n1' },                 // médio
    { x: 3.4, dz: 12, mark: 'n2' },                    // médio
    { x: -3.6, dz: 4.5, mark: 'n3' },                  // médio, perto da porta, à esquerda
    { x: 2.6, dz: 7.5, mark: 'n4', scale: 0.6 },       // PEQUENO (o maior número é o menor braseiro)
    { x: 0, dz: 9.5, mark: 'grande', scale: 1.5 },     // GRANDE, no meio da sala, sem número: o pedestal mostra o glifo GRANDE
  ],
  rule: { kind: 'order', seq: [2, 4, 3, 1, 0], hints: false, penalty: 10 }, // TRÊS, GRANDE, QUATRO, DOIS, UM
  words: ['acender', 'grande', 'antes', 'pequeno', 'conf'],                // a porta: «ACENDER GRANDE ANTES PEQUENO CONFIRMADO»
  tablets: [
    { lines: [{ words: ['n1', 'depois', 'n2', 'conf'] }, { words: ['grande', 'depois', 'n3', 'conf'] }], wall: 'left', dz: 9, size: 0.45 },
    { lines: [{ words: ['pequeno', 'antes', 'n2', 'conf'] }], wall: 'right', dz: 10, size: 0.45 },
  ],
  pillars: [[-1.8, 6.5], [1.8, 12.5]],
};
```
Todas as frases são CONFIRMADAS (nenhum boato: a sala é sobre os nomes, não sobre a marca). A frase da porta também é pista.

### Solução (passo a passo)
1. Olhar a sala: há **um braseiro grande, sem número** (o pedestal tem o glifo GRANDE) e **um braseiro pequeno, o QUATRO**. Os outros três são médios.
2. Ler as quatro frases (a da porta e as três das paredes):
   - porta: **GRANDE antes do PEQUENO** → GRANDE antes do 4;
   - **1 depois do 2** → 2 antes de 1;
   - **GRANDE depois do 3** → 3 antes do GRANDE;
   - **PEQUENO antes do 2** → 4 antes de 2.
3. Juntar a cadeia: 3 → GRANDE → 4 → 2 → 1.
4. **Acender: TRÊS, GRANDE, QUATRO, DOIS, UM.** Errar apaga tudo e deixa os braseiros frios por 10 s (sem gema por passo).

### Por que a solução é única
São 5 braseiros e 4 frases; cada frase liga um par vizinho da cadeia (3–G, G–4, 4–2, 2–1), então há exatamente uma ordem.
`node tools/verify_apelidos.mjs` prova por busca nas 120 ordens:
- com todas as pistas: **uma** ordem (3, GRANDE, 4, 2, 1);
- sem qualquer uma das 4 frases (inclusive a da porta) sobram **5 a 10** ordens: nenhuma é descartável;
- lendo pelo desenho (PEQUENO = UM e/ou GRANDE = QUATRO): **0 ordens** (contradição: «UM DEPOIS DOIS» e «UM ANTES DOIS» juntos);
- só com as frases de número sobram 60 ordens: os apelidos são indispensáveis;
- a ordem não é "do maior para o menor" nem 1-2-3-4.

### Como o jogo ensina GRANDE e PEQUENO sem explicar (§22)
- **GRANDE se explica sozinho**: o glifo está no pedestal do braseiro claramente maior (como os números estavam nos pedestais da sala 4).
- **PEQUENO por contraste**: mesma moldura de qualidade, outro desenho; o único braseiro pequeno da sala é o QUATRO.
- **O glifo reage** (§24): na frase da porta, GRANDE brilha quando o braseiro grande está aceso e PEQUENO brilha quando o pequeno está.
  Tentar já mostra quem é quem.
- O dado pode "traduzir" GRANDE/PEQUENO com um rabisco (§22), se a sessão principal quiser: um braseiro enorme e um mínimo.

### O que ensina e o que prepara
O Tribunal chama os braseiros por número **e** por GRANDE/PEQUENO; aqui o jogador aprende isso sem a lei e sem boatos.
Também ensina que **uma leitura errada se denuncia sozinha** (contradição), o que o Tribunal usa no passo 5 da solução.

### O que já existe no construtor e o que falta
- Já existe: regra `order` com `hints: false` e `penalty`, `scale`, `mark` no pedestal, `tablets` com `lines`.
- **Código novo (pequeno):**
  1. `mark: 'grande'` num pedestal já funciona (o rótulo aceita qualquer palavra do léxico), e o brilho de GRANDE na porta já sai
     sozinho (`glow` procura o braseiro cujo `mark` é a palavra).
  2. **Brilho de PEQUENO na frase da porta**: nenhum pedestal tem PEQUENO, então `glow` cai no caso dos números
     (`Number(p.id.slice(1))` dá NaN). Mapear `pequeno` → braseiro de menor `scale` (e, por simetria, `grande` → maior `scale`).
  3. (opcional) rabisco de GRANDE/PEQUENO em `SKETCH_WORDS`.
- A frase da porta mostra só as palavras novas mais as já conhecidas (ACENDER, ANTES, CONFIRMADO), em linha com §24.

---

## Sala 8 — O Boato Verdadeiro (NÍVEL 6) · ensina VERDADE (e que boato ≠ mentira)

**A ideia:** na sala 6 todo boato era falso, então o jogador aprendeu "boato = mentira". Aqui a porta troca a palavra:
não é mais «ACENDER CONFIRMADO», é **«ACENDER VERDADE»**. O glifo VERDADE é o desenho da marca CONFIRMADO dentro da moldura de
conceito (⊓): "o confirmado em abstrato". É preciso acender **toda frase que é verdade**, inclusive os **boatos verdadeiros**, e nenhuma
falsa. A verdade de cada boato não se adivinha: **as confirmadas dão a ordem, e a ordem decide cada boato**.
É o conceito que o Tribunal exige (lá os boatos têm valor de verdade) e que ninguém ensinou ainda.

### A sala (formato FireSpec + o que falta)
```ts
const f = (a, rel, b, mark, extra = {}) => ({ words: [a, rel, b, mark], ...extra });
export const FIRE_VERDADE: FireSpec = {
  name: 'O Boato Verdadeiro',
  subtitle: 'Algumas frases já estão acesas.',
  hx: 5.6, z0: -19, h: 3.8,
  braziers: [ // pilares escondidos, como na sala 6
    { x: -3.2, dz: 12.5, mark: 'n1', hidden: true },
    { x: 3.4, dz: 6, mark: 'n2', hidden: true },
    { x: 3.0, dz: 13, mark: 'n3', hidden: true },
    { x: -3.0, dz: 4.5, mark: 'n4', hidden: true },
  ],
  rule: { kind: 'order', seq: [2, 0, 1, 3], hints: false, penalty: 8 }, // TRÊS, UM, DOIS, QUATRO
  lock: { judge: 'door', penalty: 10 },                                // NOVO: a Casa só julga quando o jogador acende a frase da porta
  words: ['acender', 'verdade', 'conf'],                               // a porta: «ACENDER VERDADE CONFIRMADO»
  tablets: [
    // DEMONSTRAÇÃO, junto da entrada: a Casa já deixou as duas acesas (NOVO: `preLit`)
    { lines: [f('n1', 'antes', 'n2', 'conf', { preLit: true }), f('n2', 'depois', 'n1', 'boato', { preLit: true })], wall: 'left', dz: 17, size: 0.45, lit: true },
    // as frases do puzzle
    { lines: [f('n1', 'depois', 'n3', 'conf', { good: true }), f('n4', 'antes', 'n1', 'boato')], wall: 'left', dz: 9, size: 0.45, lit: true },
    { lines: [f('n3', 'antes', 'n4', 'boato', { good: true }), f('n4', 'depois', 'n2', 'conf', { good: true })], wall: 'right', dz: 14, size: 0.45, lit: true },
    { lines: [f('n2', 'depois', 'n3', 'boato', { good: true }), f('n3', 'depois', 'n1', 'boato')], wall: 'right', dz: 6, size: 0.45, lit: true },
  ],
};
```

### Solução (passo a passo)
**Passo 0 — a demonstração (sem punição).** Logo na entrada há um parágrafo que a Casa já deixa **aceso**: «UM ANTES DOIS CONFIRMADO»
e, embaixo, «DOIS DEPOIS UM **BOATO**», também aceso, e o glifo VERDADE da porta brilha de leve. O jogador vê, sem ter feito nada,
**um boato aceso**: é verdade porque diz o mesmo que a confirmada. (É também o passo 3 do Tribunal: duas frases que dizem a mesma coisa.)

**Passo 1 — ler e acender a verdade.**
1. As confirmadas: **1 antes 2** (demonstração), **1 depois 3**, **4 depois 2**. Cadeia: **3 → 1 → 2 → 4**.
2. Decidir cada boato com essa ordem:
   - «4 ANTES 1 BOATO» → o 4 é o último: **falso**;
   - «3 ANTES 4 BOATO» → o 3 é o primeiro: **verdade**;
   - «2 DEPOIS 3 BOATO» → 3 → 1 → 2: **verdade**;
   - «3 DEPOIS 1 BOATO» → contradiz «1 depois 3»: **falso**.
3. Acender com o dado de Fogo as **quatro frases verdadeiras**: «1 DEPOIS 3», «4 DEPOIS 2» (as confirmadas) e os boatos «3 ANTES 4» e
   «2 DEPOIS 3». As falsas ficam apagadas.
4. Acender a **frase da porta** («ACENDER VERDADE»): é o jogador "dizendo" à Casa que terminou. Se o conjunto aceso for exatamente o
   verdadeiro, a Casa lê a frase (as palavras acendem uma a uma) e **os quatro pilares sobem**. Se não, todas as frases (menos a
   demonstração) se apagam e a Casa recusa o fogo por 10 s.

**Passo 2 — os pilares.** Acender na ordem da cadeia: **TRÊS, UM, DOIS, QUATRO** (errar: tudo apaga, frios por 8 s).

### Por que a solução é única
`node tools/verify_verdade.mjs` prova:
- as 3 confirmadas dão **uma** ordem (3-1-2-4) e cada uma é necessária (sem uma, sobram 4 a 6 ordens);
- com essa ordem cada boato é decidido: **2 verdadeiros, 2 falsos**; entre as 64 escolhas de frases acesas, **só uma** é consistente;
- **os hábitos da sala 6 falham**: "acender só as confirmadas" é recusado; "boato é sempre mentira" leva a **contradição** (0 ordens);
- os dois boatos verdadeiros **não repetem** nenhuma confirmada (falam de pares 3–4 e 2–3): só se provam **pela cadeia**, não por
  comparar duas frases parecidas;
- a ordem dos pilares não é 1-2-3-4.

### O que ensina e o que prepara
- **VERDADE** (palavra da lei do Tribunal: «DOIS BOATO = VERDADE»), por contraste com a porta da sala 6 e pelo desenho do glifo.
- **Boato ≠ mentira**: um boato pode ser verdade; quem decide é a cadeia das confirmadas. Sem isso, a lei do Tribunal não faz sentido.
- **Duas frases podem dizer a mesma coisa** (a demonstração), passo-chave do Tribunal.
- **Por que não é tentativa e erro:** o julgamento é do conjunto inteiro, só quando o jogador acende a porta; não há resposta por frase.
  São 64 conjuntos, cada erro custa 10 s e reacender as frases; deduzir é muito mais rápido. (Resolve o risco anotado na §21.)

### O que já existe no construtor e o que falta
- Já existe: pilares `hidden`, tablete `lit`, `FireLine.good`, `lock.penalty`, regra `order` com `hints: false`.
- **Código novo:**
  1. **`lock.judge: 'door'`**: no modo atual a Casa julga cada frase na hora em que ela acende (`ok = best.good`). Aqui as frases acendem
     **sem julgamento** (qualquer uma fica acesa) e a Casa só julga quando o dado de Fogo toca a **frase da porta** (precisa de um soquete
     com brasa no começo dela). Certo = conjunto aceso igual ao conjunto `good`. Errado = apaga as frases (menos as `preLit`) + `penalty`.
     Seria bom o jogador poder **apagar** uma frase que acendeu por engano (tocar de novo com o dado?), senão um toque errado custa o recomeço.
  2. **`FireLine.preLit`**: a frase começa acesa, não pode ser apagada e não conta no julgamento (é a demonstração).
  3. **Brilho do glifo VERDADE**: fraco enquanto só a demonstração está acesa; forte quando a Casa aceita o conjunto.

---

## Salas 9 a 15 (esboço; detalhar uma por vez depois da aprovação)
- **9 · O Quinto (nível 7):** cinco braseiros (CINCO no pedestal), «ACENDER TODOS BRASEIRO ORDEM CONFIRMADO»; as frases estão em três paredes e nenhum parágrafo sozinho fecha a cadeia.
- **10 · O Salão das Três Portas (nível 7):** hub com anexos (§20, opção a); o anexo A dá uma ordem, e o número que ficou em 1º lugar é o que o anexo B pede; a porta principal pede o que os dois juntos dizem.
- **11 · A Chama que Diz (nível 8):** ordem + `burn`: as frases deixam duas ordens possíveis; numa delas o PEQUENO não é o último e se apaga antes do fim, então só a outra funciona (regra nova: ordem + todos acesos no fim).
- **12 · A Lei Pequena (nível 8):** primeira lei da contagem, «UM BOATO = VERDADE», com 4 braseiros, 2 confirmadas e 3 boatos; ensina IGUAL.
- **13 · Os Que Dizem o Mesmo (nível 8):** lei + dois boatos equivalentes (um diz o número, o outro o apelido): ou os dois são verdade, ou nenhum.
- **14 · A Lei Dobrada (nível 9):** «DOIS BOATO = VERDADE» com 4 braseiros e 4 boatos; duas hipóteses, uma dá contradição (o raciocínio inteiro do Tribunal, menor).
- **15 · A Memória da Casa (nível 9):** ensaio do Tribunal com 5 braseiros, apelidos e lei; uma das confirmadas só foi vista numa sala anterior (está no diário do jogador).
