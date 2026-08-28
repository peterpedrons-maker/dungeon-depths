# PATCH 4 — relatório de balanceamento de combate

## Estado

- Base: `origin/main` após Patch 3, com o motor real de combate do Patch 4
- Harness: `src/lib/combatBalance.ts` + `src/lib/combatEngine.ts`
- Sementes: `1..300`, amostra completa por cenário
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

## Resultado do motor completo

O motor completo executou `277.200` lutas: 300 sementes × 14 classes × 33 dungeons × regular/boss. Houve `68.199` vitórias, taxa agregada de `24,60%`, média de `8,76` ações, `1.090,92` dano do jogador e `546,03` dano inimigo por luta.

Cada combate usa as cinco habilidades de um loadout legal, prioridades, cooldowns, recursos, cura, barreiras, DOT/CC, summons, equipamento e o `CombatEvent[]` do resolvedor. As execuções de dungeon também preservam HP entre encontros; a tabela abaixo é uma amostra de lutas isoladas, enquanto `runDungeonCoverage()` cobre a sequência completa.

Os perfis de equipamento disponíveis são `recem-chegado`, `farmado`, `bem-equipado`, `endgame-realista` e `stress`. O resultado de 300 sementes usa `bem-equipado`, com geração determinística por semente, tier/raridade/qualidade e Forja aplicados ao loadout.

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
node --experimental-strip-types --input-type=module -e "import {runCombatBalance} from './src/lib/combatBalance.ts'; const s=runCombatBalance(300,1); console.log({fights:s.fights,wins:s.wins,winRate:s.wins/s.fights,averageActions:s.averageActions,averagePlayerDamage:s.averagePlayerDamage,averageEnemyDamage:s.averageEnemyDamage})"
node --experimental-strip-types --input-type=module -e "import {runDungeonCoverage} from './src/lib/combatBalance.ts'; console.log(runDungeonCoverage(1).length)"
```

## Escopo e leitura dos números

Esta amostra é uma validação automatizada de regressão e cobertura, não uma promessa de dificuldade final para jogadores. A taxa agregada mistura dungeons e perfis de progressão; decisões de balanceamento devem usar as linhas por classe/dungeon e o perfil de equipamento correspondente. O ponto principal do Patch 4 é que as métricas agora vêm de um resolvedor de habilidades executável e reproduzível, com os contratos end-to-end cobertos por testes.
