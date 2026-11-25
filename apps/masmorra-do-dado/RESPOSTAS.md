# Gabarito — Masmorra do Dado (só para o Pedro)

> Todas as respostas, curtas, na ordem do jogo. Atualizado a cada sala nova pela sessão de puzzles.
> O raciocínio completo de cada sala está em `PUZZLES_PROPOSTAS.md`; as provas de unicidade, em `tools/verify_*.mjs`.
> Estado: ✅ resposta fechada (com verificador) · 📝 resposta fechada, sem verificador (puzzle simples ou de cenário) · ⏳ ainda em esboço.

**Como ler as posições:** toda grade 3×3 (lousas, chão, colunas) é numerada como os glifos, vista de frente (lousa) ou de cima com a porta
em cima (sala):
```
0 1 2      (fundo / em cima)
3 4 5
6 7 8      (frente / embaixo)
```
Números = faces do dado: UM = 4 · DOIS = 0, 8 · TRÊS = 0, 4, 8 · QUATRO = 0, 2, 6, 8 · CINCO = 0, 2, 4, 6, 8.

---

## Capítulo 1 (só Fogo)

### Sala 1 — O Poço 📝 (já no jogo)
Tentar a porta → o Escrivão joga o dado pelo poço → pegar o dado (E) → acender o único braseiro.

### Sala 2 — O Vestíbulo 📝 (já no jogo)
Acender exatamente **dois** dos três braseiros.
- Cena do caderno (o diário do jogador): o 1º braseiro aceso revela o caderno → pegar (E) → abrir o diário (o ícone brilha) → escrever
  qualquer coisa na página de BRASEIRO → fechar.

### Sala 3 — A Lousa ✅
- Lousa 1: **0, 8** (DOIS). Lousa 2: **0, 4, 8** (TRÊS).
- Porta: **QUATRO = 0, 2, 6, 8** (há 4 braseiros acesos; o 4º está num nicho alto em cima da entrada). TRÊS é recusado.
- **S1 (gema):** lousa atrás da coluna esquerda → **CINCO = 0, 2, 4, 6, 8**.

### Sala 4 — O Fio de Fogo ✅
- Lousa 1: fogo no lampião de cima (demonstração).
- Lousa 2 («ACENDER UM», TRÊS): fogo no **centro (4)**.
- Lousa 3 (triângulo ACENDER): fogo em **qualquer ponta**.
- Porta (chão, «ACENDER DOIS», CINCO): fogo em **2** (canto do fundo à direita) e **6** (canto da frente à esquerda).
- **S10 (gema, voltar depois do diário com «DIZER IGUAL FAZER»):** acender o soquete frio do balcão e pôr fogo **só em 2** → o chão escreve FAZER.

### R1 — O Corredor dos Nichos e o Pátio da Cisterna 📝 (1ª área livre, grande)
- Corredor: escrever **QUATRO (0, 2, 6, 8)** na lousa ao lado do nicho vazio → página arrancada.
- Pátio (reflexo): acender os braseiros dos cantos **2 e 6** (a diagonal contrária); na água aparece DOIS → gema.
- Semente: tapeçaria pequena num nicho → queimar depois da sala 8 → palavra talhada para o diário.
- Atalho: grade para o balcão da sala 4.

### Sala 5 — A Casa Escreve ✅
- Mural da ordem ao lado da lousa: «UM ANTES DOIS» (ensino, sem puzzle).
- Laço da lousa (começa depois do escuro): **meio-direita, fundo-esquerda, frente-meio, fundo-direita** = casas **5, 0, 7, 2**.
- Acender os braseiros ao pé dessas colunas nessa ordem.
- **C1 (gema + diário):** depois de a porta abrir, o laço mostra CINCO → acender as tochas das colunas **0, 2, 4, 6, 8** (nenhuma outra,
  nenhuma de parede) → braseiro sobe no centro → acendê-lo.

### Sala 6 — A Chama Curta ✅
- Antecâmara: acender o braseiro pequeno e passar pelo portão enquanto ele queima.
- Galeria: o pavio certo é o labirinto do **médio** (setinhas apontando para o mínimo); o do grande corre ao contrário.
- Acender o **grande** e o **médio** (o médio acende o pavio), voltar ao **mínimo da entrada** e acendê-lo **quando o mínimo
  do fundo pegar fogo sozinho**. (Também vale: médio → grande → mínimo da entrada.) O mínimo do fundo **nunca** à mão.
- **S3 (diário, voltar depois da sala 8):** a fumaça do grande entorta para um "muro" que balança → queimar o pano-parede → corredor com diário.

### Sala 7 — O Que a Casa Confirma ✅ (refeita)
- Parte 1: escrever **QUATRO = 0, 2, 6, 8** na lousa (a frase CONFIRMADA); TRÊS é o boato.
- Parte 2: acender as frases **«1 ANTES 3»**, **«4 DEPOIS 2»**, **«1 DEPOIS 4»** (as CONFIRMADAS); pilares **2, 4, 1, 3**.

### R2 — Os Banhos Secos 📝 (respiro)
- Puzzle opcional: na piscina mais funda, acender **exatamente dois** braseiros (a frase CONFIRMADA) → gema.
- Semente: estandarte de pano na parede da fonte → queimar depois da sala 8 → porta secreta (diário + gema).
- Atalho: grade de uma câmara de banho para o fundo da sala 6.

### Sala 8 — O Pano ✅
- Queimar o pano da **porta** (TODOS → DOIS) e o pano da **parede esquerda** (UM → TRÊS). O pano da direita é boato puro (pedra lisa).
- Acender **TRÊS, depois QUATRO**.
- **C2 (gema + diário):** frisos do teto = triângulo → tochas dos pilares **1, 6, 8** (meio do fundo e os dois cantos da frente), nenhuma outra.

### Sala 9 — Os Apelidos ✅
- GRANDE = o braseiro sem número (glifo GRANDE no pedestal); PEQUENO = o **QUATRO**.
- Ordem: **TRÊS, GRANDE, QUATRO, DOIS, UM**.

### A Biblioteca (térreo, cap. 1) ⏳ (respiro grande; puzzles opcionais a fechar)
- Caminho: atravessar o átrio até a porta da sala 9 (sempre aberta).
- Lousas da sala de aula: (a) **QUATRO = 0, 2, 6, 8**; (b) **DOIS = 0, 8**; (c) trancada até voltar depois da sala 9.
- Mural de encaixe nº 1: pôr em cada desenho o bloco com o nome dele (PORTA, LIVRO, CHAVE, SINO; os nomes estão no Museu).
- Ala do Papel: queimar só livros com a marca BOATO na lombada; nunca os cadernos dos condenados.

### Sala 10 — A Ponte de Madeira ✅
- Fogo no **3** (meio da borda esquerda; queima a ponte) e **depois** no **7** (meio da frente) → a cruz (MAIS = 1, 3, 4, 5, 7). A ordem contrária falha.
- **C3 (gema):** de cima, acender só as **4 tochas da borda sobre os cantos (0, 2, 6, 8)** → grade inteira vista do alto → braseiro sobe na rampa.
### Sala 11 — O Boato Verdadeiro ✅
- Acender **«1 DEPOIS 3»**, **«4 DEPOIS 2»** (confirmadas), **«3 ANTES 4»**, **«2 DEPOIS 3»** (boatos verdadeiros); depois acender a frase da porta.
- Pilares: **3, 1, 2, 4**.

### R3 — A Galeria dos Condenados ⏳ (respiro; a lei da contagem opcional ainda vai ser fechada)
### Sala 12 — A Sombra ⏳
### Sala 13 — O Escuro ⏳ (errar de propósito; o glifo aparece no teto no escuro)
### Sala 14 — A Lei Pequena ⏳
### R4 — A Escadaria 📝 (respiro)
- Puzzle opcional: da janela da sala 5, ver as colunas de cima (dica da C1). Porta de seis pontos no topo: só num capítulo posterior.
### Sala 15 — O Fogo que Corre ⏳
### Sala 16 — Os Que Dizem o Mesmo ⏳
### Sala 17 — A Memória da Casa ⏳
### Sala 18 — O Tribunal dos Rumores ✅ (já no jogo)
- Ordem: **5, 3, 2, 4, 1** (GRANDE = 3, PEQUENO = 2; lei: dois boatos são verdade).

---

## Perguntas do dado (capítulo 1)
1 ACENDER = **acender** · 2 QUATRO = **quatro** · 3 ANTES = **antes** · 4 CONFIRMADO = **confirmado (é verdade)** · 5 BOATO = **boato (dizem que)** ·
6 DEPOIS = **depois** · 7 PEQUENO = **pequeno** (não "um") · 8 VERDADE = **verdade** · 9 IGUAL = **igual** · 10 TODOS = **todos**.
Apontar: pátio → um braseiro · Banhos → o dado do relevo · Museu → a chave, depois o livro · Sala de Aula → escrever QUATRO.

## Segredos grandes e finais
- **S5 · A frase do escuro ⏳:** cada sala da 2 à 17 tem uma palavra fosforescente que só aparece no escuro da punição (errar de propósito).
  Juntas formam uma frase que manda voltar ao poço (texto final a escrever).
- **S6–S8 · O poço no escuro ⏳:** na sala 1, acender o soquete frio sob o poço e errar de propósito → no escuro, o texto do Escrivão: a
  sentença do jogador sem a marca de confirmação.
- **S9 · A Casa é um dado:** o poço da sala 1 é o ponto da face UM; cada capítulo tem tantos poços quanto a sua face; as câmaras secretas
  de cada capítulo ficam nas posições dos pontos daquela face no mapa.
- **S11 · O rosto do Boato (capítulo final) ⏳:** do ponto certo perto da saída alta, as ruínas formam o rosto do dado (com os dois braseiros-olhos acesos).
- **4º final ⏳:** escrever **«LANÇAR CASA»** no veredito. Exige: as palavras LANÇAR e CASA (diários das câmaras secretas), entender que a
  Casa é um dado, e as seis faces completas no mapa (todas as gemas).
