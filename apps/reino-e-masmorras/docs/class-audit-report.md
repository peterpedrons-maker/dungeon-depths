# PATCH 4 — auditoria real das 14 classes

## Escopo

Base auditada antes das alterações: `origin/main` em `947c1f10e958ab2479403ef3212bc78e69a486bb`.

O harness usa `createCombatState()`, `runCombat()`, `runFullDungeon()` e `spawnEnemy()` do motor de produção. Não há `progressBasicState()`, `witnessContext`, `maxResources()` ou sondagem não letal. Recursos, dano, cura, barreira, DOT, controle, summons, fases de boss, poções e HP persistente são produzidos pelo combate real. `DungeonPanel` e o harness compartilham o avaliador de condições e o contrato de eventos (`buildAbilityConditionContext()` / `consumeCombatEvents()`).

## Resultado reproduzível

| Verificação | Resultado |
|---|---:|
| Classes / caminhos / nós | 14/14 · 42/42 · 630/630 |
| Ativas / passivas / atributos | 210/210 · 126/126 · 294/294 |
| Condições e cooldowns estruturais | 210/210 |
| Ativas ativadas em combate real | 210/210 |
| Casts reais observados nas 210 ativas | 12.880 |
| Eventos de prova emitidos | 311.488 |
| Caminhos puros com os cinco ativos lançados | 42/42 |
| Builds legais (42 puras + 42 pares + 14 tri-híbridas) | 98/98 |
| Builds com cinco ativos lançados | 98/98 |
| Builds com zero ativo sem cast | 98/98 |
| Dungeons simuladas por build | 33/33 |
| Clears observados no full-run das 98 builds | 1.842 de 3.234 |
| Tipos de efeito resolvidos exaustivamente | 51/51 |

O PASS de uma build exige cinco habilidades equipadas, cinco IDs distintos, cast observado para cada ID e 33 dungeons atravessadas. Cobertura de habilidade não é convertida em vitória: os 1.842 clears são reportados separadamente. Para alcançar habilidades que não cabem no caminho puro, o teste usa encontros reais do catálogo `DUNGEONS`/`HUNTS`, nunca recursos ou estados injetados.

## Recursos e mecânicas

Os testes confirmam geração e consumo natural de Postura, Determinação, Fé, Dor, Feridas, Brechas, Calor, Pulso, Fraturas, Dívida, Crédito, Estigmas, Partitura, Eco, Ovação, Almas, Decomposição e demais estados. Poções são consumidas pelo limiar/cooldown real e carregadas entre encontros; não são cura gratuita do harness.

O Arqueiro foi corrigido para que Flecha Balística cause dano apenas na aterrissagem, com snapshot de acerto/defesa válido. As condições de Tensão, Distância e Cadência foram ajustadas para as habilidades alcançarem seus estados durante lutas normais.

## Comandos executados

```bash
npm test
npx tsc --noEmit -p tsconfig.json
npm run build
git diff --check
```
