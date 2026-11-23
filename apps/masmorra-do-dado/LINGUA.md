# A Língua dos Contáveis (v0.2)

Fonte única: **`tools/lexicon.mjs`** (vocabulário + desenho de cada símbolo). Ele gera `src/story/lexicon.json`
(que o jogo vai ler) e `docs/lingua/LEXICON.md` (tabela completa). Para ver as folhas visuais:
`node tools/lexicon.mjs --sheet <pasta>` (precisa do playwright). **Para mudar uma palavra, edite o script.**

## Decisão: escrita por palavra, não por letras
- Cada símbolo é **uma palavra** (logográfico), com composição: palavras novas nascem de combinar outras.
- A língua é **independente de idioma**: não é uma cifra de português nem de inglês. O jogo todo (cenário, NPCs,
  entalhes) é igual em qualquer idioma; só o diário, os pensamentos do jogador e a interface são traduzidos
  (PT e EN; as chaves `pt`/`en` já estão no vocabulário).
- Por que não letras: viraria decifrar um código (e o jogador já saberia as palavras), amarraria o jogo a um idioma,
  e escrever "acender" letra por letra no giz, principalmente no celular, seria cansativo.

## O alfabeto
- Todo símbolo cabe numa grade **3×3** (no máximo 9 pontos), assimétrico, com um lado "de baixo" claro.
- A **moldura** diz a família antes de o jogador saber o significado:

| Moldura | Família |
|---|---|
| sem moldura, só pontos | números e quantidades |
| sem moldura, pontos ligados por linhas | **verbos** |
| moldura fechada (□) | **coisas** |
| aberta em cima (⊔) | **seres** |
| aberta embaixo (⊓) | **conceitos** |
| aberta à direita (⊏) | **ligações** (esperam continuação) |
| aberta à esquerda (⊐) | **posição e tempo** |
| uma barra com o dado em cima/embaixo | **marcas do dado** (fecham a frase) |
| símbolo pequeno | **modificadores** |

## Como as palavras crescem
- **Compostas:** uma sequência de símbolos. Ex.: ESCRIVÃO = ESCREVER + AGENTE; LER = ESCREVER + O CONTRÁRIO;
  SABER = VER + CONFIRMADO; CONDENADO = JULGAR + PRENDER + FEITO; O BOATO (o dado) = DADO + BOATO.
- **Modificadores** (5): AGENTE (quem faz), FEITO, O CONTRÁRIO, MUITOS, LUGAR DE.
- **A negação** é o verbo ATRAVESSAR antes de outra palavra (NUNCA = NÃO + SEMPRE, FORA = NÃO + DENTRO, SEM = NÃO + COM).
- **Os conceitos VERDADE, MENTIRA, DÚVIDA e MEMÓRIA** repetem o desenho das marcas do dado dentro da moldura ⊓.
  É o dado "em abstrato".
- **Números em base 6:** o seis se escreve "10" (UM + ZERO).

## Gramática
Ordem: **verbo, número, coisa, marca.** SE (frase) ENTÃO (frase). IGUAL liga uma coisa a um número ou a outra coisa.
EM VEZ DE + duas coisas. Marca MEMÓRIA para o passado, PERGUNTA para perguntas, BOATO para o que foi dito
e não lançado.

## Tamanho
**115 palavras** (84 símbolos próprios e 31 compostas). Cada palavra tem um **capítulo** provisório de introdução
(1 a 7, ligados às faces do dado: 1 Fogo, 2 Peso, 3 Eco, 4 Troca, 5 Deslizar, 6 Atravessar, 7 o veredito).
O vocabulário completo, com português, inglês e capítulo, está em `docs/lingua/LEXICON.md`.

## Próximos passos da língua
1. Revisar os símbolos (alguns são parecidos entre si e precisam ser testados com jogadores).
2. Escrever as frases de cada região e checar que só usam palavras já introduzidas.
3. Planilha de ensino: onde cada palavra aparece pela primeira vez (ver `DESIGN.md` §4).
