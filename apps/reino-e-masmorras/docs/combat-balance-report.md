# PATCH 2 — relatório de balanceamento de combate

## Estado

- Branch: `patch2-combat-rebalance`
- Base: `origin/main` em `aed89cd432238ef3b03883b526b53f8c5c12e18e`
- Harness: `src/lib/combatBalance.ts`
- Semente: `42`; amostra: `300` sementes por cenário
- Cobertura: 14 classes, 33 dungeons, regular e boss

## Curvas aplicadas

| Canal | Antes | PATCH 2 |
|---|---:|---:|
| Efetividade da DEF | 0,50 | 0,55 |
| Mitigação máxima | 65% | 70% |
| Dificuldade HP | potência 1,00 | 1,00 |
| Dificuldade ATK | 1,00 | 0,82 |
| Dificuldade DEF | raiz quadrada | 0,62 |
| Crescimento por profundidade | HP/ATK 6%; DEF 3,5% | HP 6%; ATK 4,5%; DEF 4% |
| Roubo de Vida | sem cap central | cap global 30% |
| Espinhos | sem cap central | cap global 60% |

## Resultado do harness core

O harness executou `277.200` lutas. Houve `27.215` vitórias, taxa agregada de `9,8%`, média de `4,18` ações, `191,1` dano do jogador e `251,2` dano inimigo por luta.

Esta primeira rodada é um diagnóstico do núcleo — ataques básicos, stats, spawn, curva e mitigação — e não uma aprovação das metas finais de clear. Ela deliberadamente não finge simular os efeitos específicos das 14 árvores de habilidades. A taxa agregada baixa confirma que o relatório final precisa incluir o resolvedor completo de habilidades, recursos, cura, barreiras, DOT, summons e persistência de HP antes de aceitar as metas de vitória do prompt.

| Classe | Vitórias | Ações | Dano jogador | Dano inimigo |
|---|---:|---:|---:|---:|
| Guerreiro | 12,5% | 4,30 | 250,5 | 259,2 |
| Mago | 6,5% | 4,18 | 131,2 | 245,0 |
| Ladino | 11,9% | 3,72 | 234,5 | 242,5 |
| Clérigo | 8,3% | 4,51 | 143,8 | 255,4 |
| Cavaleiro | 12,8% | 4,95 | 249,9 | 275,6 |
| Paladino | 12,3% | 4,15 | 240,6 | 254,5 |
| Bárbaro | 12,6% | 4,20 | 261,9 | 261,7 |
| Arqueiro | 11,6% | 3,67 | 225,6 | 242,0 |
| Caçador | 11,7% | 3,69 | 226,4 | 243,1 |
| Feiticeiro | 5,9% | 4,19 | 129,3 | 245,1 |
| Bruxo | 6,4% | 4,16 | 131,5 | 246,3 |
| Druida | 8,7% | 4,58 | 147,3 | 252,6 |
| Bardo | 10,0% | 4,10 | 172,1 | 247,4 |
| Necromante | 6,4% | 4,15 | 131,2 | 246,2 |

## Reprodução

```bash
node --experimental-strip-types --input-type=module -e "import {runCombatBalance} from './src/lib/combatBalance.ts'; console.log(runCombatBalance(300))"
```

## Próxima etapa obrigatória

Expandir o harness para executar as cinco habilidades legais, prioridades de build, recursos, cura, barreira, DOT, controle, summons, equipamento e full-run com HP persistente. Os números acima não devem ser tratados como aprovação final de duração ou win rate.
