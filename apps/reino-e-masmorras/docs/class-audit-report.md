# Auditoria real de combate — motor final

Relatório regenerado em 2026-08-29 a partir do `main` atual. `DungeonPanel` e harness executam o mesmo `resolvePlayerAction()` stateful, que seleciona a ação e chama o mesmo `executeAbilityEffect()` para habilidades self-target e ofensivas; o painel apenas traduz refs para `CombatState`, sincroniza o resultado e apresenta os eventos.

## Resultado

| Verificação | Resultado |
|---|---:|
| Classes / caminhos / nós | 14/14 · 42/42 · 630/630 |
| Ativas / passivas / atributos | 210/210 · 126/126 · 294/294 |
| Ativas executadas com todos os campos aplicados | 210/210 |
| Casts observados nas provas individuais | 14.873 |
| Eventos reais de prova | 669.723 |
| Árvores puras usando os cinco ativos | 42/42 |
| Builds legais usando os cinco ativos | 98/98 |
| Builds com habilidade sem cast | 0/98 |
| Dungeons simuladas por build | 33/33 |
| Clears nas 3.234 runs das 98 builds | 2.589 |
| Tipos de efeito resolvidos exaustivamente | 51/51 |
| Paridade painel/engine | 210/210 |

Uma árvore/build só passa se cada um dos cinco IDs equipados produzir cast real. A prova percorre encontros reais e deixa o próprio combate produzir Pulso, Brecha, Fé, Dor, Dívida, Almas, Ovação, Convicção e demais condições; não existem `progressBasicState()`, estados-testemunha ou injeções de recursos.

## Fonte única de verdade

- `resolveAbilityEffect()` não recebe callback de execução; ele materializa e rastreia o efeito.
- `executeAbilityEffect()` aplica self, dano físico/mágico, multi-hit, payload misto do Bardo, cura, barreira, status, DOT, summons e riders de classe.
- O harness e o painel chamam `resolvePlayerAction()`; não existe mais resolver self/ofensivo nem multi-hit no painel. Um teste arquitetural impede a volta dessas rotas e compara o estado das 210 ativas com seed idêntica.
- `effectApplied` nasce quando o trecho mecânico lê/aplica o campo. O flush que preenchia automaticamente campos presentes foi removido.
- Kinds e campos desconhecidos falham o contrato; o switch dos 51 kinds não possui `default: break` silencioso.

## Correções encontradas pela auditoria

O perfil antigo da prova era um nível 60 lendário +10 até contra encontros iniciais e impedia condições naturais de HP baixo. A prova final usa perfil realista por dungeon (`levelReq + 8`, épico +7) com atributos distribuídos. Isso revelou e corrigiu três ativas: Milagre, Ressurreição Menor e Veredito da Redenção.

No Paladino, a Virtude extra de Luz que Não Cede passou a usar o snapshot de HP no início do cast, antes da cura da própria habilidade. A árvore pura de Redenção agora gera Misericórdia + Coragem naturalmente e alcança Convicção 2 antes do Veredito.

Também são exercitados HP e recursos persistentes, gear real, poções, cura, barreira, DOT, summons, fases de boss e a recuperação real de 2% entre encontros, compartilhada pelo painel e pelo full-run.

## Reprodução

```bash
npm test
npx tsc -b --pretty false
npm run build
git diff --check
```
