# PATCH 4 — relatório real de duração e balanceamento

## Método

O relatório foi regenerado no motor `runCombat()` atual, com equipamento determinístico, cinco habilidades, atributos alocados, HP e poções persistentes, cooldowns, cura, barreira, DOT, summons e fases de boss. A amostra global é de 300 sementes × 14 classes × 33 dungeons × regular/boss = 277.200 combates isolados.

## Amostra global

| Métrica | Medição |
|---|---:|
| Combates | 277.200 |
| Vitórias | 218.773 |
| Win rate agregado | 78,92% |
| Média de ações | 9,29 |
| Dano médio do jogador | 2.155,40 |
| Dano médio recebido | 278,09 |

O agregado mistura dungeons e não representa uma progressão única. A progressão persistente é medida por `runFullDungeon()` e reportada separadamente.

## Resultado por classe

`DPS/ação` é dano do jogador dividido por suas ações na amostra global. `Survival` é a taxa de vitória dos combates isolados dessa mesma amostra. `Full Clear` usa 3 sementes do perfil `bem-equipado` em todas as 33 dungeons. O boss final usa D32 e 10 sementes de `endgame-realista`; a Arena do Campeão (D33) é opcional.

| Classe | DPS/ação | Survival | Boss Win D32 | Full Clear | Regular TTK | Boss TTK | Recurso | Notas |
|---|---:|---:|---:|---:|---:|---:|---|---|
| Guerreiro | 294,6 | 85,5% | 9/10 | 43/99 | 5 | 15 | PASS | Postura |
| Mago | 249,3 | 73,6% | 9/10 | 29/99 | 5 | 15 | PASS | Calor |
| Ladino | 214,5 | 72,9% | 8/10 | 25/99 | 7 | 18 | PASS | Imagens |
| Clérigo | 147,8 | 78,6% | 10/10 | 36/99 | 9 | 29 | PASS | Fé/Cura |
| Cavaleiro | 296,6 | 88,3% | 10/10 | 47/99 | 5 | 14 | PASS | Determinação |
| Paladino | 161,4 | 82,6% | 10/10 | 33/99 | 9 | 27 | PASS | Virtudes |
| Bárbaro | 237,4 | 78,0% | 9/10 | 28/99 | 6 | 15 | PASS | Dor/Fúria |
| Arqueiro | 247,1 | 74,2% | 8/10 | 32/99 | 5 | 15 | PASS | Tensão |
| Caçador | 169,4 | 79,0% | 9/10 | 32/99 | 5 | 13 | PASS | Brechas |
| Feiticeiro | 354,3 | 79,8% | 10/10 | 45/99 | 4 | 10 | PASS | Pulso |
| Bruxo | 251,7 | 74,2% | 10/10 | 26/99 | 6 | 14 | PASS | Dívida |
| Druida | 233,4 | 87,8% | 9/10 | 44/99 | 5 | 18 | PASS | Estações |
| Bardo | 248,5 | 74,2% | 9/10 | 31/99 | 5 | 16 | PASS | Partitura/Ovação |
| Necromante | 290,2 | 76,3% | 10/10 | 36/99 | 6 | 13 | PASS | Almas/Servos |

## Targets de duração

As medianas agregadas são de vitórias reais entre as 14 classes, com 10 sementes por checkpoint. Os limites dos testes são os definidos no rebalance:

| Faixa | Perfil | Dungeon real | Regular | Elite | Boss |
|---|---|---|---:|---:|---:|
| D1–D6 | farmado | Torre Amaldiçoada | 4 | 6 | 10 |
| D7–D18 | bem equipado | Catacumbas Reais | 5 | 6 | 14 |
| D19–D30 | bem equipado | Selva Esquecida | 7 | 10 | 20 |
| D31–D33 | endgame realista | Necrópole Real | 7 | 10 | 18 |

Os alvos usados são, respectivamente, regular 3–5 / 4–6 / 4–7 / 5–8, elite 5–8 / 6–10 / 7–11 / 8–13 e boss 8–14 / 12–18 / 14–22 / 16–26. A medição também verifica o boss normal final de D32: todas as 14 classes ficam acima de 70% em 10 sementes.

## Win rates de progressão

Na amostra real de 3 sementes × 14 classes, nas seis primeiras dungeons (incluindo o conteúdo especial da faixa):

| Perfil | Full clear D1–D6 | Bosses especiais da faixa |
|---|---:|---:|
| Recém-chegado | 42/252 = 16,7% | 20/84 = 23,8% |
| Farmado | 182/252 = 72,2% | 41/84 = 48,8% |
| Bem equipado | 218/252 = 86,5% | 50/84 = 59,5% |

Isso mantém os alvos aproximados de 15–35% para recém-chegado, 50–75% para farmado e 75–92% para bem equipado. A faixa especial permanece mais severa; sua margem é mais larga porque Torre e Cripta têm identidades e multiplicadores diferentes.

## Correções aplicadas

- Regular: multiplicador global de HP 2,5; boss: 1,7; boss ATK 0,65; boss DEF 1,30.
- Elite: HP/MATK 1,2, com ataque separado 1,15; elite permanece acima do regular sem virar um segundo boss.
- Flecha Balística só causa dano quando o projétil aterrissa; o snapshot usa defesa e penetração válidas.
- Condições de Arqueiro foram corrigidas para Tensão, retorno à Distância Horizonte e Cadência alcançável.
- O harness usa as cinco habilidades equipadas, prioridades reais e delega a resolução ao mesmo motor do painel.

## Reprodução

```bash
npm test
npx tsc --noEmit -p tsconfig.json
npm run build
git diff --check
```
