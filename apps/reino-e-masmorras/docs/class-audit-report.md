# Auditoria real de combate — Patch 4

Relatório regenerado em 2026-08-28 a partir do `main` atual. A validação usa `createCombatState()`, `runCombat()`, `runFullDungeon()` e `spawnEnemy()` do engine de produção. O painel e o harness compartilham as regras de condição, plano de resolução, payload de Bis e contrato dos efeitos.

## Resultado

| Verificação | Resultado |
|---|---:|
| Classes / caminhos / nós | 14/14 · 42/42 · 630/630 |
| Ativas / passivas / atributos | 210/210 · 126/126 · 294/294 |
| Condições e cooldowns estruturais | 210/210 |
| Ativas executadas em combate real | 210/210 |
| Casts observados nas 210 ativas | 11.508 |
| Eventos de prova do engine | 367.299 |
| Árvores puras com os cinco ativos lançados | 42/42 |
| Builds legais com cinco ativos lançados | 98/98 |
| Builds com ativo sem cast | 0/98 |
| Dungeons percorridas por build | 33/33 |
| Clears nos full-runs das 98 builds | 1.972 de 3.234 |
| Tipos de efeito resolvidos | 51/51 |

Uma build só passa com cinco IDs equipados, cast real dos cinco e a simulação dos 33 encontros. A cobertura não é convertida em vitória: os clears são medidos separadamente. Não há geração artificial de recursos, estado-testemunha ou progressão básica fabricada.

## Mecânicas verificadas

O engine produz e consome naturalmente Postura, Determinação, Fé, Dor, Feridas, Brechas, Calor, Pulso, Fraturas, Dívida, Crédito, Estigmas, Partitura, Eco, Ovação, Almas e Decomposição. Também são exercitados HP persistente, gear, poções, cura, barreira, DOT, summons, fases de boss e cooldowns.

Foram cobertos explicitamente os riders de Bárbaro, Bardo, Feiticeiro, Druida, Paladino, Ladino, Guerreiro, Cavaleiro, Arqueiro, Caçador, Clérigo, Mago, Bruxo e Necromante. Campos compostos de `AbilityEffect` passam pelo contrato de runtime; um kind ou campo desconhecido falha a auditoria.

## Validação

```bash
npm test
npx tsc -p tsconfig.app.json --noEmit
npm run build
git diff --check
```
