# PATCH 3 — auditoria final das 14 classes

## Estado da entrega

- Base auditada: `origin/main` após o merge do Patch 2 (`92a0b705de0557ef72d23e49a1c95b9c19266f07`).
- Escopo: 14 classes, 42 caminhos, 630 nós, 210 ativas, 126 passivas e 294 atributos.
- Harness estrutural: `src/lib/classAudit.ts`.
- O Patch 2 global não foi alterado: fórmulas de DEF/mitigação, economia, XP, ouro, poções, loot, tier power e crescimento permanecem na base integrada.

## Resultado automático

| Verificação | Resultado |
|---|---:|
| Classes | 14/14 |
| Caminhos | 42/42 |
| Nós e IDs | 630/630 |
| Ativas | 210/210 |
| Passivas | 126/126 |
| Atributos | 294/294 |
| Topologia por caminho | 15/15 em cada caminho |
| Ativas com recarga coerente no tooltip | 210/210 |
| Condições com testemunha alcançável | 210/210 |
| Builds puras | 42/42 legais |
| Builds de dois caminhos | 42/42 legais |
| Tri-híbridos representativos | 14/14 legais |
| Matriz total | 98/98 |
| Variantes de prioridade por ativa | 5 permutações sem IDs duplicados |
| Referências de mecânica válidas | 100% das referências declaradas |
| Mecânicas documentadas | 92/92 |

`castCount` das linhas automáticas significa um cast em cenário testemunha de elegibilidade. Ele comprova que a condição não é impossível; não substitui o harness core do Patch 2 por uma simulação integral de cada efeito em combate.

## Cobertura por classe

| Classe | Caminhos | Nós | Ativas | Passivas | Atributos | Mecânicas | Ativas condicionais |
|---|---:|---:|---:|---:|---:|---:|---:|
| Guerreiro | 3 | 45 | 15 | 9 | 21 | 6 | 6 |
| Mago | 3 | 45 | 15 | 9 | 21 | 8 | 4 |
| Ladino | 3 | 45 | 15 | 9 | 21 | 10 | 9 |
| Clérigo | 3 | 45 | 15 | 9 | 21 | 4 | 11 |
| Cavaleiro | 3 | 45 | 15 | 9 | 21 | 6 | 10 |
| Paladino | 3 | 45 | 15 | 9 | 21 | 6 | 6 |
| Bárbaro | 3 | 45 | 15 | 9 | 21 | 4 | 13 |
| Arqueiro | 3 | 45 | 15 | 9 | 21 | 9 | 10 |
| Caçador | 3 | 45 | 15 | 9 | 21 | 4 | 7 |
| Feiticeiro | 3 | 45 | 15 | 9 | 21 | 6 | 2 |
| Bruxo | 3 | 45 | 15 | 9 | 21 | 8 | 9 |
| Druida | 3 | 45 | 15 | 9 | 21 | 8 | 0 |
| Bardo | 3 | 45 | 15 | 9 | 21 | 9 | 7 |
| Necromante | 3 | 45 | 15 | 9 | 21 | 4 | 12 |

## Checklist de mecânicas

- Guerreiro: Postura, Guarda Quebrada, Aparo, Riposta e finishers são cobertos pela auditoria estrutural e pelos testes de pressão, recuperação e payoff.
- Mago: Calor, Estado Térmico, Circuito, Pulso e Ressonância têm testemunhas de recurso/estado e testes de cap, consumo e sequência.
- Ladino: Iniciativa/Quick, Furtivo, Exposto, Imagens e Truques têm testes de não-recursão, consumo e reset.
- Clérigo: Fé, Graça, Consagração, Julgamento, cura efetiva, barreira e overheal têm testes dedicados.
- Cavaleiro: Determinação, Retaliação, Momentum e Ordens têm testes de geração sem duplicação e consumo.
- Paladino: Virtudes, Liturgia, Convicção, Regente, Vereditos e Égide têm testes de snapshot, expiração e cap.
- Bárbaro: Fúria, Frenesi, Dor em pacotes, Feridas, Postura Selvagem e thresholds têm testes dedicados.
- Arqueiro: Distância, Tensão, Cadência, Passos, Reflexo, multi-hit e Flechas em Voo têm cobertura de caps e relógios.
- Caçador: Armadilhas, Rastro, Presa Marcada, Brechas e Precisão têm testes de disparo em ação real e progressão.
- Feiticeiro: Pulso, Desperta, Fraturas, Echo, Ressonância, Controle e prioridades têm testes de miss/hit/crit e consumo.
- Bruxo: Dívida, Sobrecontrato, Cobrança, Crédito, Nome Verdadeiro, Assinatura Falsa e Estigmas têm testes de ordem e safety.
- Druida: Estações, Sintonia, Jardim, Formas, Ano Perfeito, Renovo e Equilíbrio têm testes de transição, cap e reset.
- Bardo: Partitura, Marcato, Dissonante, Lírico, Frases de três notas, Ovação, Contracanto, Harmonia, Eco, Curinga e Bis têm testes próprios, incluindo o quinto slot e ausência de recursão.
- Necromante: Almas, Decomposição, Praga, Servos, Ceifador, sacrifício, ticks, snapshot, expiração e catch-up têm testes dedicados.

## Arquivo por ativa

`auditActiveAbilities()` produz uma linha para cada ativa com:

`Class | Path | Skill | Cooldown | Condition | Cast count | First cast | Resource | Reachable | Notes`

As cinco variantes de prioridade são generator-first, spender-first, short-cooldown-first, capstone-first e defensive-first. Elas apenas validam permutações legais do loadout; não mudam a ordem do AI em runtime.

## Validação reproduzível

```bash
npm test -- --runInBand
npx tsc -p tsconfig.app.json --noEmit
npm run build
git diff --check
```

O harness de combate do Patch 2 continua explicitamente core-only (ataque básico, stats, spawn, curva e mitigação). A auditoria Patch 3 adiciona a validação real de árvore, tooltip, condições, builds e registry de mecânicas, apoiada pelos testes especializados de cada estado. Uma aprovação de win rate/full-run com todas as habilidades exigiria um simulador de efeitos que ainda não existe no motor fora do fluxo de `DungeonPanel`.
