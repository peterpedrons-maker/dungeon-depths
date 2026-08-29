# Balanceamento real — motor final

Relatório regenerado em 2026-08-29 exclusivamente pelo motor final compartilhado. Cada checkpoint usa 100 seeds × 14 classes (1.400 runs por linha), equipamento real, atributos distribuídos, cinco habilidades, HP/recursos persistentes, recuperação real de 2% entre encontros, poções consumíveis, cura, barreira, DOT, summons e fases de boss.

## Win rate de dungeon completa

| Faixa / perfil | Dungeon | Vitórias | Win rate | Target | Resultado |
|---|---|---:|---:|---:|---:|
| D1–D6 especial / Farmado | D6 Torre | 101/1.400 | 7,21% | 5–25% | PASS |
| D1–D6 especial / Bem Equipado | D6 Torre | 917/1.400 | 65,50% | 65–90% | PASS |
| D7–D12 especial / Farmado | D12 Arena | 568/1.400 | 40,57% | 30–65% | PASS |
| D7–D12 especial / Bem Equipado | D12 Arena | 1.252/1.400 | 89,43% | 75–95% | PASS |
| D13–D18 / Farmado | D18 Catacumbas Reais | 136/1.400 | 9,71% | 5–25% | PASS |
| D13–D18 / Bem Equipado | D18 Catacumbas Reais | 862/1.400 | 61,57% | 50–78% | PASS |
| D19–D24 / Farmado | D24 Selva Esquecida | 50/1.400 | 3,57% | 1–15% | PASS |
| D19–D24 / Bem Equipado | D24 Selva Esquecida | 338/1.400 | 24,14% | 22–50% | PASS |
| D25–D30 / Bem Equipado | D30 Salão dos Titãs | 52/1.400 | 3,71% | 1–15% | PASS |
| D25–D30 / Endgame | D30 Salão dos Titãs | 650/1.400 | 46,43% | 45–72% | PASS |
| D31–D32 / Bem Equipado | D32 Palácio Submerso | 60/1.400 | 4,29% | 1–15% | PASS |
| D31–D32 / Endgame | D32 Palácio Submerso | 768/1.400 | 54,86% | 50–78% | PASS |
| D33 opcional / Endgame | D33 Arena do Campeão | 422/1.400 | 30,14% | 25–50% | PASS |

As bandas mantêm progressão: um perfil abaixo da faixa ainda pode vencer, mas não transforma conteúdo late/endgame em farm fácil. O checkpoint citado no bug, D24 com Bem Equipado, saiu de 0% na linha de base para 24,14% sem reset de HP ou recurso.

## Duração real

Mediana de ações nas vitórias; `wins/samples` permanece visível para uma mediana curta não esconder baixa sobrevivência.

| Faixa / perfil | Regular | Elite | Boss |
|---|---:|---:|---:|
| D1–D6 / Farmado | 4 (1.400/1.400), alvo 3–5 | 5 (1.387/1.400), alvo 5–8 | 8 (1.384/1.400), alvo 8–14 |
| D7–D18 / Bem Equipado | 5 (1.400/1.400), alvo 4–6 | 7 (1.400/1.400), alvo 6–10 | 13 (1.375/1.400), alvo 12–18 |
| D19–D30 / Bem Equipado | 6 (1.400/1.400), alvo 4–7 | 9 (1.385/1.400), alvo 7–11 | 19 (1.354/1.400), alvo 14–22 |
| D31–D33 / Endgame | 6 (1.399/1.400), alvo 5–8 | 9 (1.375/1.400), alvo 8–13 | 17 (1.363/1.400), alvo 16–26 |

Resultado: 12/12 medianas dentro do target. O boss isolado da D32 superou o mínimo de 70% nas 14 classes (100/100 por classe); a dungeon completa D32 permaneceu em 54,86%, pois conserva HP, recursos e poções ao longo de toda a run.

## Perfis

- Recém-chegado distribui normalmente todos os pontos de atributo.
- Farmado usa aproximadamente `levelReq + 2`, gear raro +3 e quatro poções.
- Bem Equipado usa `levelReq + 4`, gear raro +5 e oito poções.
- Endgame realista usa `levelReq + 8`, gear épico +7 e doze poções.

Nenhum perfil recebe HP, recurso ou condição diretamente. A curva mantém HP inimigo linear no anchor e DEF em 0,62; apenas o crescimento de ATK usa raiz quadrada para evitar que a pressão seja multiplicada novamente por doze encontros persistentes.

## Reprodução

```bash
npm test
npx tsc -b --pretty false
npm run build
git diff --check
```
