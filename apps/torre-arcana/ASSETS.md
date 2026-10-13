# Créditos de arte

Os sprites de inimigos/chefe e os ícones de runa vêm de [game-icons.net](https://game-icons.net),
um banco de ~4100 ícones de jogo licenciado **CC BY 3.0** (uso livre, inclusive
comercial, desde que com crédito à coleção/autores).

Obtidos via o pacote npm `@iconify-json/game-icons` (registry.npmjs.org — o site
game-icons.net/kenney.nl/itch.io não são alcançáveis a partir do ambiente onde
esse código foi escrito). Esse pacote não carrega o autor individual de cada
ícone — a página de cada ícone abaixo mostra quem o desenhou.

Caminho no código: `src/game/icons.ts` (dados SVG embutidos), consumido por
`src/game/sprites.ts` (inimigos/chefe, recoloridos + contorno) e
`src/components/Game.tsx` (barra de runas).

**Regra de design obrigatória pra qualquer ícone de inimigo/chefe trocado no
futuro:** o jogo é em câmera fixa, a horda vem direto na direção do jogador —
todo ícone tem que estar de frente/encarando a câmera (face simétrica), nunca
um perfil lateral ou pose de caminhada de lado.

## Ícones usados

Nome do ícone na coleção `game-icons` (busque por esse nome em
[game-icons.net](https://game-icons.net) pra ver a página/autor de cada um —
não coloquei o link direto de cada ícone aqui porque não deu pra confirmar a
URL/autor exatos a partir deste ambiente):

| Uso | Nome do ícone |
|---|---|
| Corrompido (husk) | `goblin-head` |
| Espectro (wisp) | `ghost` |
| Brutamontes (brute) | `ogre` |
| Chefe — O Devorador de Luz | `daemon-skull` |
| Runa — Mísseis Arcanos | `magic-swirl` |
| Runa — Rajada de Gelo | `ice-spear` |
| Runa — Corrente de Raio | `chain-lightning` |
| Runa — Núcleo de Fogo | `flame` |

Licença completa: [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).
