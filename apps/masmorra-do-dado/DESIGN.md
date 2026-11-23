# Masmorra do Dado — Documento de design (rascunho v0.1)

> Rascunho para discussão. Tudo aqui pode mudar. Itens marcados **[DECIDIR]** esperam a sua escolha.

## 1. Pitch

Você acorda dentro de **A Casa**, uma masmorra que é, na verdade, um **tabuleiro de jogo** gigante.
No mundo lá fora tudo é decidido pelo **Acaso** — ninguém escolhe nada, tudo "cai como cair". Você
é a única pessoa que carrega um dado **que obedece**: você escolhe a face de cima. Cada face é uma
*lei do mundo* (fogo, peso, ricochete…) que o Acaso esqueceu. Para sair, você precisa reaprender
as seis leis e chegar ao salão onde o dono da Casa joga para sempre contra ninguém.

Um puzzle de exploração em primeira pessoa, sem combate, melancólico e com humor seco.
Referências de tom: *The Talos Principle*, *Return of the Obra Dinn*, *Hollow Knight*, *Outer Wilds*.

## 2. Lore (proposta)

**O Dado Primeiro.** Antes de haver mundo, seis irmãos — **os Seis** — jogaram um único dado. Cada
lançamento escrevia uma lei: o Fogo, o Peso, o Ricochete, a Troca, o Deslizar, a Travessia. Cansados
da própria criação, deixaram o dado cair. Ele **rachou em seis**, e desde então o mundo é regido
pelo **Acaso cego**: coisas acontecem sem que ninguém decida.

**A Casa.** O **Crupiê** — o último servo dos Seis — construiu A Casa para prender os cacos e quem se
aproximar deles. Cada ala guarda um caco (uma face) e um enigma. O Crupiê não é cruel: é **solitário**
e acredita que a escolha é uma doença. Joga sozinho, todas as noites, no **Salão do Último Lançamento**.

**Os Jogadores Perdidos.** Os que vieram antes ficaram presos como **ecos**: fantasmas que repetem a
última aposta que fizeram. São os NPCs. Cada um guarda uma pista (ou a própria face) e fala por
balões de conversa. Alguns querem ajudar, outros só querem ser lembrados.

### Quem é você — **[DECIDIR]**
- **A) O Escrevente** *(recomendada)* — anotava as apostas na casa de jogo do Crupiê, **com giz**
  (por isso o giz!). Viu o Crupiê trapacear a própria casa e foi lançado na masmorra como "aposta
  final". Carrega um **Dado Quebrado**, sem números, e o giz do ofício. Ligação direta com a mecânica.
- B) A Herdeira — filha de uma talhadora de dados que sumiu na Casa; procura a mãe.
- C) Sem nome — memória apagada (clichê, mas barato de escrever).

### O que é o dado — **[DECIDIR]**
- **A) O Dado Quebrado** *(recomendada)* — um caco que *escolheu* você. Não fala, mas **reage**: brilha,
  esquenta, vibra. Seu "comportamento" vira linguagem (e dá personalidade ao HUD).
- B) Um companheiro que fala por balões, com humor seco.
- C) Um objeto mudo; toda a narrativa vem das paredes e dos ecos.

### Objetivo e finais
Reunir as seis faces e chegar ao Salão do Último Lançamento. Não há luta: o "chefe" é um puzzle em que
você precisa **escolher** onde o Acaso mandaria. Três finais:
1. **Devolver o dado** — o Acaso volta a reinar (ordem, mas sem escolha).
2. **Quebrar a mesa** — o mundo passa a ser decidido por quem vive nele (liberdade, e o risco dela).
3. **Sentar no lugar do Crupiê** — você vira o novo guardião (poder, solidão).

### Regiões (mundo estilo Metroidvania, com volta livre)
| Região | Tema | Face / mecânica |
|---|---|---|
| **A Antecâmara** | tutorial: a mesa de apostas | todas as três iniciais |
| Salões das Brasas | calor, sinos, tochas | **Fogo** |
| O Mirante | alturas, ventos | **Ricochete** |
| A Cisterna | água, eco | **Deslizar** |
| A Biblioteca de Dados | lore, giz, anotações | pistas |
| A Casa dos Espelhos | reflexos | **Troca** |
| O Poço | queda, silêncio | **Atravessar** |
| O Salão do Último Lançamento | final | as seis juntas |

Salas já feitas (A Entrada, O Selo, Salão das Brasas, O Mirante) viram a **Antecâmara** e as primeiras
alas; os nomes serão ajustados.

## 3. Como a história é contada (balões de conversa)
- **Balões** com nome do falante, texto que digita e pausa curta; tocar/Espaço avança.
- **Ecos dos Jogadores Perdidos**: fantasmas translúcidos que falam ao chegar perto.
- **Inscrições** nas paredes (giz do Escrevente aparece em *lousas* e livros-caixa).
- **Diário de pistas** (já planejado): cada fala-chave vira uma página.
- Nada de cinemática longa: a história se descobre andando e lendo.
- Textos ficam em arquivo próprio (`src/story/`) para traduzir (PT-BR primeiro, depois EN).

## 4. Primeiro puzzle — **A Mesa do Crupiê** (proposta) — **[DECIDIR]**
Objetivo de design: ensinar *três* ideias (a face de **cima** é a escolhida; faces **opostas somam 7**;
o **giz** serve de memória) e contar a premissa, **sem** parecer tutorial.

**Cena:** um salão com uma longa **mesa de apostas** e seis cadeiras. Em cada cadeira, um **eco**
imóvel e, à frente dele, uma **aposta** gravada: três nichos com símbolos de **pontos** (3 pontos,
5 pontos, 6 pontos). Na parede, o **Livro-Caixa** do Crupiê, com colunas de apostas apagadas pela metade.

**Regra escondida:** o altar de cada nicho só aceita o dado se a face **de baixo** mostrar aquele número.
O jogador só tem as faces 1, 2 e 3 liberadas… e o dado repousa com uma face para baixo que ele *não vê*.
Ele precisa deduzir que **baixo = 7 − cima** (1↔6, 2↔5, 3↔4).

**Solução (resumo):**
1. Ler o Livro-Caixa: a última aposta do Crupiê foi **3 – 5 – 6** (nessa ordem).
2. Em cada nicho, **posicionar** o dado com a face de baixo pedida, ou seja, escolher a de cima
   **4, 2, 1** (7−3, 7−5, 7−6).
3. Os eco(s) confirmam cada acerto falando uma frase da história. A porta abre ao acertar na ordem
   (o giz serve pra anotar a ordem enquanto se circula pela sala).

**Camada extra (opcional):** um nicho está atrás de uma grade que só abre acendendo o braseiro (Fogo) —
liga o puzzle ao que o jogador já aprendeu.

Alternativas se não gostar: (B) *O Relicário dos Quatro Sinos* (som/ordem) · (C) *A Roleta* (sala giratória).

## 5. Rumo ao produto (Steam / app)
| Área | Plano |
|---|---|
| **Empacotar PC** | Electron (ou Tauri) com o build web atual; atualização via Steam. |
| **Steam** | `steamworks.js`: conquistas, nuvem de saves, overlay; página da loja, trailer, capsule art. |
| **Celular** | PWA hoje; Capacitor para Play Store / App Store depois. |
| **Salvar** | progresso, giz e configurações (arquivo no PC, `localStorage` na web). |
| **Menu/Opções** | tela inicial, continuar, qualidade gráfica, volume, sensibilidade, teclas, idioma. |
| **Controle** | Gamepad API (Xbox/PlayStation/Steam Deck), dicas na tela por dispositivo. |
| **Acessibilidade** | legendas para falas, redução de brilho/flash, tamanho de texto, daltonismo. |
| **Localização** | tabela de textos (PT-BR → EN → ES), sem texto fixo no código. |
| **Qualidade** | metas: 60 fps em PC médio e 30–60 em celular; modos Baixo/Médio/Alto. |
| **Legal** | créditos dos sons (CC BY exige), licenças de terceiros, classificação etária. |
| **Pipeline** | GitHub Actions gerando instaladores; testes de jogabilidade e de regressão. |

## 6. Próximos passos sugeridos
1. Você escolhe: protagonista, natureza do dado, primeiro puzzle.
2. Implementar: balões + falas do primeiro puzzle + a sala nova (Antecâmara).
3. Menu inicial + salvar + opções + qualidade gráfica.
4. Pesquisa de arte: texturas, sombras e vida no cenário (em andamento).
5. Primeira versão "de vitrine" para a página da Steam (3–4 min de jogo polido).
