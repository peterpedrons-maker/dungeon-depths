# A Língua dos Contáveis — vocabulário e gramática (v0.1)

Referência visual: `docs/lingua/lingua-ampliada.png` (desenhos das 28 palavras e 7 frases) e
`docs/lingua/branco.png` (estilo final: escrita branca talhada e o giz do jogador).

## Princípios do alfabeto
- Todo símbolo cabe numa grade **3×3** de pontos (como o rosto de um dado): no máximo **9 pontos e 3 traços**,
  para ficar legível no nosso render pixelado.
- Todo símbolo é **assimétrico**, com um lado "de baixo" claro (sem ambiguidade por espelho ou rotação).
- A **forma** diz a família antes de o jogador saber o significado.

## Famílias
| Família | Aparência | Papel |
|---|---|---|
| Número | pontos soltos, sem linha | quantidade (base 6) |
| Verbo | pontos ligados por linhas | as 6 faces do dado |
| Coisa | dentro de uma moldura quadrada | objetos e pessoas |
| Ligação | moldura aberta, ou grade cheia | SE, TODOS |
| Marca do dado | uma barra + a posição do dado | fecha a frase |

## Vocabulário (primeira amostra: 28 palavras)

### Números (base 6: o seis é "10")
| Palavra | Desenho |
|---|---|
| ZERO | um anel vazio no centro |
| UM | um ponto no centro |
| DOIS | pontos em diagonal (0,0)(2,2) |
| TRÊS | pontos em diagonal e centro |
| QUATRO | os quatro cantos |
| CINCO | os cantos e o centro |

### Verbos (as seis faces)
| Palavra | Face | Desenho |
|---|---|---|
| ACENDER | Fogo | triângulo apontando para cima |
| IGUAL / PESAR | Peso | duas barras paralelas (equilíbrio) |
| DE NOVO | Ricochete | zigue-zague (Z) |
| EM VEZ DE | Troca | X (duas rotas se cruzam) |
| ENTÃO / SEGUIR | Deslizar | seta |
| ATRAVESSAR / NÃO | Atravessar | barra vertical com um traço diagonal cruzando. Antes de outro verbo significa "pule isto" |

### Coisas (moldura)
BRASEIRO (tigela), PORTA (arco), PLACA (chão com peso), DADO (face cinco fechada), GIZ (um traço),
PAREDE (uma barra), VOCÊ (um ponto no centro), OS CONTÁVEIS (três pontos em fila).

### Ligações
SE (moldura aberta à direita; espera um "então"), TODOS (a grade cheia).

### Marcas do dado (a barra fica no meio)
| Marca | Dado | Significado |
|---|---|---|
| CONFIRMADO | pousado na barra | é verdade |
| BOATO | no ar, acima da barra | dito, mas não lançado |
| MEMÓRIA | caído, abaixo da barra | foi verdade, já não é |
| PERGUNTA | dois dados no ar | a frase ainda não foi decidida |

## Gramática
- Ordem: **verbo, número, coisa, marca**.
- Negação: ATRAVESSAR antes do verbo ("não acenda").
- Condição: SE (frase) ENTÃO (frase). A moldura aberta do SE espera o ENTÃO.
- Medida: IGUAL + coisa + número ("a placa pesa três").
- Troca: EM VEZ DE + duas coisas.
- Passado: marca MEMÓRIA ("seis braseiros já arderam aqui" = ACENDER · 1 · 0 · BRASEIRO · MEMÓRIA).
- Pergunta: marca PERGUNTA.

## Frases de exemplo
1. ACENDER · QUATRO · BRASEIRO · CONFIRMADO — "Acenda quatro braseiros."
2. ATRAVESSAR · ACENDER · QUATRO · BRASEIRO · BOATO — "Não acenda quatro braseiros." (só um boato)
3. SE · ACENDER · QUATRO · BRASEIRO · ENTÃO · ATRAVESSAR · PORTA · CONFIRMADO — "Se quatro braseiros acenderem, atravesse a porta."
4. IGUAL · PLACA · TRÊS · CONFIRMADO — "A placa pesa três."
5. EM VEZ DE · BRASEIRO · PLACA · CONFIRMADO — "Em vez do braseiro, a placa."
6. ACENDER · UM · ZERO · BRASEIRO · MEMÓRIA — "Seis braseiros já arderam aqui."
7. IGUAL · VOCÊ · DADO · PERGUNTA — "Você é igual ao dado?"

## Planilha de ensino (a preencher à medida que as salas são desenhadas)
Cada palavra precisa de três encontros (regra 1-2-3, ver `DESIGN.md` §4).

| Palavra | 1ª vez (com o efeito) | 2ª vez (outra coisa) | 3ª vez (sozinha) |
|---|---|---|---|
| ACENDER | Vestíbulo, porta 1 | Vestíbulo, porta 2 | Vestíbulo, porta 3 |
| UM | Vestíbulo, porta 1 | | |
| DOIS | Vestíbulo, porta 2 | | |
| TRÊS | Vestíbulo, porta 3 | | |
| (demais palavras) | a definir | a definir | a definir |
