# Balanceamento real — Patch 4

Relatório regenerado em 2026-08-28 pelo `runCombat()` final, com 10 sementes, equipamento determinístico, atributos distribuídos, cinco habilidades, HP/recursos persistentes, poções, cura, barreira, DOT, summons e fases de boss.

## Amostra global

| Métrica | Medição |
|---|---:|
| Combates | 9.240 |
| Vitórias | 7.412 |
| Win rate agregado | 80,22% |
| Média de ações | 9,10 |
| Dano médio do jogador | 2.210,49 |
| Dano médio recebido | 277,17 |

| Classe | Win rate | Ações médias | Dano médio |
|---|---:|---:|---:|
| Guerreiro | 85,0% | 8,81 | 2.438,46 |
| Mago | 75,8% | 8,10 | 2.076,73 |
| Ladino | 73,5% | 9,88 | 2.053,98 |
| Clérigo | 83,5% | 11,30 | 2.385,61 |
| Cavaleiro | 88,0% | 9,67 | 2.535,03 |
| Paladino | 85,6% | 15,56 | 2.454,77 |
| Bárbaro | 79,5% | 8,67 | 2.187,86 |
| Arqueiro | 75,8% | 7,36 | 2.171,00 |
| Caçador | 79,1% | 7,59 | 1.361,48 |
| Feiticeiro | 78,5% | 6,36 | 2.295,48 |
| Bruxo | 77,1% | 7,67 | 2.185,50 |
| Druida | 89,7% | 11,07 | 2.629,78 |
| Bardo | 74,2% | 8,62 | 2.154,21 |
| Necromante | 77,7% | 6,75 | 2.017,01 |

## Duração e boss final

As medianas abaixo são de vitórias reais entre 14 classes e 10 sementes; `wins/samples` permanece visível para não esconder falhas de sobrevivência.

| Faixa / perfil | Regular | Elite | Boss |
|---|---:|---:|---:|
| D1–D6 / farmado | 4 (140/140) | 6 (129/140) | 9 (129/140) |
| D7–D18 / bem equipado | 5 (140/140) | 6 (134/140) | 14 (94/140) |
| D19–D30 / bem equipado | 6 (140/140) | 9 (69/140) | 21 (28/140) |
| D31–D33 / endgame-realista | 6 (136/140) | 9 (78/140) | 18 (77/140) |

Todas as 12 medianas estão dentro dos alvos do rebalance. O boss normal final (D32) atingiu o mínimo de 70% para as 14 classes em 10 sementes: 14/14 classes passaram.

## Progressão D1–D6

| Perfil | Clears | Bosses especiais |
|---|---:|---:|
| Recém-chegado, com atributos distribuídos | 64/252 = 25,4% | 33/84 = 39,3% |
| Farmado, nível `levelReq + 2` | 160/252 = 63,5% | 42/84 = 50,0% |
| Bem equipado | 195/252 = 77,4% | 55/84 = 65,5% |

Os perfis usam distribuição normal de pontos, gear real e consumíveis persistentes. O recém-chegado não é deixado sem atributos; o farmado não recebe nível artificial além da progressão definida.

## Reprodução

```bash
npm test
npx tsc -p tsconfig.app.json --noEmit
npm run build
git diff --check
```
