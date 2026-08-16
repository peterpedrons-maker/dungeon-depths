# Kit de Arte do Reino

Prompts prontos para gerar as peças de interface e os sprites de personagens/inimigos de **Reino & Masmorras**. Copie o conteúdo de qualquer bloco abaixo (o botão de copiar aparece ao passar o mouse sobre o bloco, no GitHub) e cole direto no seu gerador de imagens.

## Antes de usar

- **Fundo magenta:** todo prompt de recorte já pede fundo sólido `#FF00FF` — assim dá pra remover o fundo depois, já que a maioria das IAs de imagem não exporta com transparência real.
- **Nas folhas de sprite, cuidado especial:** como os personagens/inimigos ficam bem próximos da cor de fundo, todo prompt de sprite pede explicitamente para **não** usar magenta/rosa/fúcsia em nada do personagem (pele, roupa, armadura, arma, brilho de magia) — só o fundo deve ser magenta. Isso evita que o recorte "coma" pedaços do próprio personagem.
- **Sobre os slots:** a moldura de equipamento (quadrada) e a de habilidade (circular) pedem exatamente o mesmo material/estilo, só muda o formato — gere as duas na mesma sessão/conversa com a IA se possível, para saírem parecidas. O centro magenta é onde o ícone do jogo aparece por baixo da moldura.
- **Pixel art, mas nítida:** os personagens e inimigos do jogo são pixel art (desenhados no código), mas a técnica original saía borrada. Por isso os prompts de sprite abaixo pedem pixel art de verdade — pixels nítidos, sem anti-aliasing/borrão, contorno escuro definido e paleta de cores limitada, no estilo de RPGs pixel art modernos (Octopath Traveler, Stardew Valley, Eastward) — em resolução alta o bastante para ficar nítido mesmo ampliado no jogo.
- **Inimigos sempre virados para a esquerda:** no jogo o personagem do jogador fica à esquerda da tela e o inimigo à direita, olhando um para o outro — os prompts de inimigos exigem que toda criatura seja desenhada de perfil (ou 3/4) virada para a esquerda, nunca de frente ou para a direita.
- **Sobre a moldura principal:** os *cantos* têm entalhes ornamentados únicos, mas as *bordas retas* entre os cantos são um padrão de madeira uniforme e repetitivo — de propósito, para permitir esticar a moldura em caixas de tamanhos diferentes sem distorcer os desenhos ornamentados.
- **Sobre o Mapa de Masmorras:** são 7 imagens (uma por região), empilhadas verticalmente no jogo formando um caminho único que sobe da região Valdren até Aetherion — role a tela pra cima pra avançar. Cada uma já reserva 2-3 marcadores "???" (nevoeiro/silhueta, sem nome legível) espalhados nas bordas, reservados pra masmorras futuras além das 52 já planejadas — assim dá pra crescer o conteúdo sem regerar a arte inteira.
- **Sobre os Fundos de Batalha:** cada masmorra tem seu próprio cenário de combate, combinando com o tema dela no Mapa de Masmorras. O personagem fica parado a ~27% da largura e o inimigo a ~73%, os dois em cima de uma faixa de chão perto da base da imagem (~15% da altura) — por isso todo prompt pede uma composição com o centro-baixo livre de objetos grandes, pra não cobrir os sprites.
- **Sobre o Mapa de Construções:** mesmo padrão do Mapa de Masmorras — uma única imagem com as construções já pintadas na cena, e os marcadores clicáveis do jogo ficam posicionados por cima, nas coordenadas certas (medidas depois que a arte for gerada). Já reserva um canteiro de obras vazio (fog-shrouded) pra uma futura construção além das 3 atuais.

---

## Molduras & Texturas

As peças estruturais — moldura das janelas, fundo de pergaminho.

### Moldura Principal — Janelas e painéis
**Tamanho:** 1024×1024 px · **Uso:** borda de toda janela/painel do jogo

```
Hand-painted medieval fantasy game UI asset, rich digital painting style (think Diablo, Baldur's Gate, Divinity: Original Sin inventory screens). Aged dark oak wood carved into an ornate rectangular window frame, with a thin hammered-bronze inlay strip running along the inner edge. Warm candlelit color palette: deep browns, warm gold, muted bronze, iron black — no purple, no blue, no futuristic elements.

The four CORNERS of the frame have unique, ornate raised medieval wood-carving (a small carved rose-and-shield motif in each corner). The STRAIGHT EDGES between the corners are a simple, uniform, repeating wood-grain plank pattern with no unique details — this uniformity is intentional, the edges need to stretch cleanly in software. Frame border is about 12% of the canvas width on each side.

The entire center/interior of the frame (where a parchment background will show through in the app) is a flat solid magenta color (#FF00FF) — no texture, no gradient, no shadow inside that area.

Square canvas, 1024×1024 px, viewed perfectly flat-on (no perspective, no rotation). No text, no watermark, no drop shadow floating outside the frame.
```

### Pergaminho — Fundo dos painéis
**Tamanho:** 512×512 px · **Uso:** preenchimento interno dos painéis, tileável

```
Hand-painted medieval fantasy game UI asset, rich digital painting style. A seamless, tileable texture of aged parchment paper. Warm cream-beige base color with subtle brown mottling and a faint fibrous paper grain. A few small stains, foxing spots, and slightly darkened edges — but kept light and only near the corners, so the middle of the tile still reads as clean and seamless when repeated.

No border, no frame, no vignette, no writing, no illustrations — flat texture fills the entire canvas edge-to-edge. Square canvas, 512×512 px, designed so the left edge matches the right edge and the top edge matches the bottom edge for seamless tiling.
```

---

## Slots de Equipamento & Habilidade

Molduras pequenas para os ícones dos slots — quadrada para o equipamento (paperdoll), circular para os nós da árvore de habilidades, estilo World of Warcraft.

### Slot de Equipamento — Paperdoll de arma/armadura/acessório
**Tamanho:** 256×256 px · **Uso:** moldura de cada slot na tela de Personagem

```
Hand-painted medieval fantasy game UI asset, rich digital painting style, in the style of a World of Warcraft-esque equipment/inventory slot frame. A square frame carved from ornate bronze/gold metal with a beveled raised edge and a subtle engraved knotwork or filigree pattern running around the rim. Small decorative rivets or studs at each of the four corners. Warm bronze-to-gold gradient with a bright specular highlight along the top edge.

The entire flat center of the frame (where an item icon will be placed by the game) is a solid magenta color (#FF00FF) — no texture, no gradient, no shadow inside that area, just a clean hollow square hole. Square canvas, 256×256 px, viewed perfectly flat-on, frame border taking up about 18-22% of the canvas width on each side. No text, no watermark, no drop shadow floating outside the frame.
```

### Slot de Habilidade — Nós da árvore e barra de habilidades equipadas
**Tamanho:** 256×256 px · **Uso:** moldura circular de cada nó/ícone na tela de Habilidades

```
Hand-painted medieval fantasy game UI asset, rich digital painting style, in the style of a World of Warcraft-esque talent tree node frame. The exact same bronze/gold ornate metal material, beveled edge and engraved filigree as an equipment slot frame from the same UI kit — but this one is a perfect CIRCLE instead of a square, like a round medallion or coin border. Small decorative studs spaced evenly around the ring. Warm bronze-to-gold gradient with a bright specular highlight along the top of the ring.

The entire flat circular center (where a skill icon will be placed by the game) is a solid magenta color (#FF00FF) — no texture, no gradient, no shadow inside that area, just a clean hollow circular hole. Square canvas, 256×256 px, the circular frame centered and filling almost the whole canvas, viewed perfectly flat-on. No text, no watermark, no drop shadow floating outside the ring.
```

---

## Botões

1024×384 px cada — retangular com cantos levemente arredondados, visto de frente, sem texto (o texto é adicionado depois pelo código). Hoje o jogo usa só o **Dourado**; os outros dois ficam aqui como alternativa caso queira variar por contexto.

### Dourado — Ação principal, confirmar
```
Hand-painted medieval fantasy game UI asset, rich digital painting style. A rectangular game button with gently rounded corners, carved from polished golden brass with a raised beveled edge and a subtle engraved knotwork border running along the rim. Warm gold-to-amber gradient across the surface with a bright specular highlight along the top edge and a darker warm shadow along the bottom edge, giving it a raised, pressable, 3D metal look.

Solid magenta background (#FF00FF) filling the rest of the canvas around the button. Front-on view, no perspective. No text or icon on the button face — leave the center clear. Canvas 1024×384 px, button centered and filling most of the frame.
```

### Carmesim — Combate, ações perigosas
```
Hand-painted medieval fantasy game UI asset, rich digital painting style. A rectangular game button with gently rounded corners, forged from dark blackened iron with a raised beveled edge, inlaid with a deep red enamel band along the center and small rivets at the corners. Dark iron-to-charcoal gradient with a red enamel glow strip, a subtle warm highlight along the top edge, giving it a raised, pressable, weighty metal look.

Solid magenta background (#FF00FF) filling the rest of the canvas around the button. Front-on view, no perspective. No text or icon on the button face — leave the center clear. Canvas 1024×384 px, button centered and filling most of the frame.
```

### Neutro — Cancelar, voltar, pausar
```
Hand-painted medieval fantasy game UI asset, rich digital painting style. A rectangular game button with gently rounded corners, carved from weathered gray fieldstone with a raised beveled edge and a simple worn rope-carved border. Cool gray stone gradient with a soft highlight along the top edge and a darker mossy shadow along the bottom edge, giving it a raised, pressable, sturdy stone look.

Solid magenta background (#FF00FF) filling the rest of the canvas around the button. Front-on view, no perspective. No text or icon on the button face — leave the center clear. Canvas 1024×384 px, button centered and filling most of the frame.
```

---

## Ícones

256×256 px cada — objeto único centralizado, mesmo estilo pintado, luz vindo de cima-esquerda em todos.

### Moeda de Ouro — Recurso: ouro
```
Hand-painted medieval fantasy game UI asset, rich digital painting style, icon for a game's resource counter. A single thick gold coin, embossed with a crude stamped castle-and-crown emblem, slightly worn and scratched edges, warm gold color with darker recessed engraving details and a bright specular highlight top-left. Soft warm lighting from the upper left.

Centered in frame, filling about 80% of the canvas. Solid magenta background (#FF00FF). No other coins, no pile, no text, no border. Canvas 256×256 px.
```

### Poção de Vida — Recurso: poções
```
Hand-painted medieval fantasy game UI asset, rich digital painting style, icon for a game's resource counter. A small round glass vial corked with a wooden stopper, filled with a glowing translucent red liquid, wrapped with a thin leather strap and a small wax seal. Warm rim-light catching the glass edge, soft glow emanating from the liquid inside. Soft warm lighting from the upper left.

Centered in frame, filling about 80% of the canvas. Solid magenta background (#FF00FF). No other vials, no hand holding it, no text, no border. Canvas 256×256 px.
```

### Coração de Rubi — Barra de vida
```
Hand-painted medieval fantasy game UI asset, rich digital painting style, icon for a game's health bar. A stylized heart shape carved from a single polished ruby gemstone, faceted surface catching warm light, deep red color with bright specular highlights and darker red in the recessed facets. A thin bronze wire wraps around the base like a claw setting. Soft warm lighting from the upper left.

Centered in frame, filling about 80% of the canvas. Solid magenta background (#FF00FF). No text, no border, no other gems. Canvas 256×256 px.
```

### Runa Arcana — Barra de experiência
```
Hand-painted medieval fantasy game UI asset, rich digital painting style, icon for a game's experience bar. A small carved stone rune tablet, roughly circular, etched with a glowing blue-white arcane symbol that emits a soft magical glow. Weathered gray stone texture around the glowing engraving. Soft warm lighting from the upper left, contrasted with the cool glow of the rune itself.

Centered in frame, filling about 80% of the canvas. Solid magenta background (#FF00FF). No text, no border, no hand holding it. Canvas 256×256 px.
```

### Ícones de Habilidades — Grade I: Elementos & Status
**Tamanho:** 1536×768 px · **Uso:** 18 ícones (recortar em grade 6×3) pros nós de habilidade ativa/passiva da árvore que envolvem fogo, gelo, raio, veneno, luz sagrada e magia sombria/amaldiçoada

```
Hand-painted medieval fantasy game UI asset, rich digital painting style, icon set for a talent/ability tree — same painted style as the game's other UI icons (gold coin, health potion, ruby heart), NOT flat vector, NOT pixel art. Each icon is a single small magical object or symbol, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single wide image containing EIGHTEEN separate icons arranged in an even 6-column × 3-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all eighteen.

Row 1 (fire/frost/lightning): 1) a swirling orange-red fireball with trailing embers. 2) a curved blade-shaped arc wreathed in flame. 3) a sharp translucent blue-white ice crystal shard. 4) a glowing hexagonal shield made of blue ice crystal facets. 5) a jagged bright yellow-white lightning bolt. 6) two crackling arcs of blue-white electricity linking together.

Row 2 (poison/holy): 7) a small pale skull with sickly green venom dripping from its jaw. 8) a corked glass vial glowing with toxic green liquid and rising green vapor. 9) a radiant golden sunburst with light rays fanning outward. 10) a glowing golden warhammer head wreathed in holy light rays. 11) a clawed shadowy hand slashing forward, wrapped in wisps of dark purple smoke. 12) a dark skull wreathed in swirling purple-black smoke, faint violet glow in the eye sockets.

Row 3 (arcane/curse/nature/drain): 13) a glowing violet magic rune circle etched with arcane symbols, radiating soft light. 14) a dark purple skull-shaped sigil rune with jagged cracks of black energy. 15) a spiral of swirling bright-green leaves. 16) a coiled thorny green vine wrapped into a circular shape. 17) a swirling wisp of dark red-purple energy being pulled inward toward a center point. 18) a black flame with sickly green edges, corrupted and unnatural looking.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Wide canvas, 1536×768 px. No text, no labels, no numbers, no watermark, no border, no frame around any icon (the game already has its own frame it composites on top).
```

### Ícones de Habilidades — Grade II: Físico & Suporte
**Tamanho:** 1536×768 px · **Uso:** 18 ícones (recortar em grade 6×3) pros nós de habilidade ativa/passiva que envolvem golpes físicos, crítico, defesa, cura e suporte (buffs/bardo)

```
Hand-painted medieval fantasy game UI asset, rich digital painting style, icon set for a talent/ability tree — same painted style as the game's other UI icons (gold coin, health potion, ruby heart), NOT flat vector, NOT pixel art. Each icon is a single small object or symbol, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single wide image containing EIGHTEEN separate icons arranged in an even 6-column × 3-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all eighteen.

Row 1 (melee weapons): 1) two crossed silver swords. 2) a wide silver sword-slash arc, motion-streaked. 3) a warhammer striking the ground with a small cracked-impact burst. 4) a heavy axe mid-swing leaving a curved cleave arc. 5) two crossed curved daggers. 6) an arrow striking dead-center of a small wooden target ring.

Row 2 (ranged/crit/defense): 7) a crossbow bolt hitting with a small burst of impact lines. 8) a bright golden critical-hit starburst. 9) a red-and-gold circular target reticle. 10) a round wooden-and-iron shield with a spark of impact on its face. 11) a translucent blue barrier dome/bubble. 12) a swirling spiral of pale wind, suggesting a quick dodge or burst of speed.

Row 3 (heal/support): 13) a small glowing red heart rising with a sparkle trail above it. 14) a glowing golden cross with soft light rays, a holy healing symbol. 15) a golden musical note with small sound-wave rings around it. 16) three concentric pale sound-wave rings radiating outward. 17) a pale skull with a small curved scythe crossed behind it. 18) a downward-angled dagger strike with sharp motion-impact lines, like a finishing blow.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Wide canvas, 1536×768 px. No text, no labels, no numbers, no watermark, no border, no frame around any icon (the game already has its own frame it composites on top).
```

**Como isso vai virar arte no jogo:** com ~630 nós de habilidade no total (14 classes × 3 trilhas × 15 nós), não dá pra ter um ícone único desenhado pra cada um — essas 36 imagens cobrem os "temas" de efeito que se repetem entre as classes (fogo, veneno, gelo, cura, crítico, etc). Depois de geradas, cada nó do código é associado ao ícone do tema mais parecido com o efeito dele (ex: todo nó que aplica veneno usa a caveira venenosa; todo nó de cura usa a cruz/coração). Hoje os nós usam ícones genéricos (losango pra atributo, escudo pra passiva, estrela pra ativa) — essa é a próxima camada de detalhe em cima disso.

### Ícones de Atributo & Combate — Tela de Personagem
**Tamanho:** 1536×1536 px · **Uso:** 9 ícones (recortar em grade 3×3) pros 7 atributos primários (Força, Destreza, Agilidade, Vitalidade, Inteligência, Sabedoria, Sorte) e os 2 sub-ícones de Físico/Mágico da seção de Combate — hoje esses 9 lugares mostram só texto, sem ícone nenhum

```
Hand-painted medieval fantasy game UI asset, rich digital painting style — same painted style as the game's other UI icons (gold coin, health potion, ruby heart, arcane rune), NOT flat vector, NOT pixel art. Each icon is a small circular enameled badge/token with a bronze rim, catching a bright specular highlight along the upper-left edge of the rim, with a single symbol embossed in pale gold relief at its center. Warm directional lighting from the upper-left throughout, readable and bold even at small size.

One single wide image containing NINE separate badge icons arranged in an even 3-column × 3-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all nine.

Row 1 (physical attributes): 1) "Força" — a badge enameled in warm terracotta-red, with a clenched armored fist embossed at its center. 2) "Destreza" — a badge enameled in forest green, with a single sharp feather quill embossed at its center. 3) "Agilidade" — a badge enameled in teal-blue, with a swift curling wind-gust swirl embossed at its center.

Row 2 (vital/mental attributes): 4) "Vitalidade" — a badge enameled in warm amber-orange, with a glowing heart embossed at its center. 5) "Inteligência" — a badge enameled in deep sapphire blue, with an open spellbook embossed at its center. 6) "Sabedoria" — a badge enameled in soft violet-purple, with a single all-seeing eye embossed at its center.

Row 3 (luck & combat sub-icons): 7) "Sorte" — a badge enameled in warm golden-yellow, with a four-leaf clover embossed at its center. 8) "Físico" — a badge enameled in dark steel-gray, with two crossed silver swords embossed at its center. 9) "Mágico" — a badge enameled in deep violet-black, with a bright arcane sparkle/starburst embossed in pale lavender at its center.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the badges themselves (enamel, gold relief, bronze rim) — that color is reserved only for the background and will be removed later. Wide canvas, 1536×1536 px. No text, no labels, no numbers, no watermark, no extra border beyond each badge's own bronze rim.
```

**Cores de referência** (pra bater com o que o jogo já usa em cada atributo, caso a IA de imagem aceite direcionamento de cor mais preciso): Força `#c1502e`, Destreza `#4f9d4f`, Agilidade `#4fb8b0`, Vitalidade `#c9863c`, Inteligência `#3f7ab8`, Sabedoria `#9b6fc9`, Sorte `#e0b93c`.

### Emblemas de Classe — Avatar no topo da tela
14 emblemas no total, um por classe — vai substituir o círculo de cor lisa que hoje fica ao lado do nome do personagem no topo da tela (`TopBar`), mesmo lugar em todas as telas do jogo. Divididos em 3 folhas de até 5 emblemas cada (em vez de uma folha só com os 14 espremidos) — mais espaço por emblema, e dá pra gerar aos poucos.

**Estilo comum aos três prompts abaixo:** medalhão/crest circular pixel art, no mesmo estilo nítido dos sprites de personagem e das cenas do Reino/Mapa de Masmorras deste jogo — NÃO pintura digital lisa, NÃO vetor, NÃO enamel liso. Reaproveita o mesmo estilo de moldura de metal em pixel art já usado nos slots de equipamento/habilidade.

#### Emblemas de Classe I — Guerreiro, Mago, Ladino, Clérigo e Cavaleiro
**Tamanho:** 1536×768 px

```
Detailed 2D pixel art game UI icon, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and a few sharp specular pixels — the same sharp pixel-art style as this game's character sprites, Kingdom scene and dungeon maps (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT smooth vector art, NOT a soft airbrushed render.

Each emblem is a small circular medallion badge, pixel-art rendered like a chunky in-game icon: a thick pixelated bronze/iron rim (same blocky pixel-art metal-frame technique as this game's equipment slot frames) surrounding a solid enameled color fill in the class's own color, with ONE bold symbol drawn in pale gold/cream pixel-art relief filling most of the center — thick, simplified, high-contrast shapes with clean pixel outlines and only 2-3 shades of each color (base, highlight, shadow), no fine detail or gradients that would turn to noise at small size (this will be displayed as a tiny avatar icon in-game, roughly 32-40px on screen, so bold silhouette matters more than intricate linework).

One single wide image containing FIVE separate emblem medallions standing side by side in a single row, generous magenta gaps between every emblem so each can be cropped out individually later. Every emblem centered in its own cell, filling about 80% of that cell, same pixel-art rendering technique and quality across all five.

1) "Guerreiro" — crest enameled in deep rust-red, with a crossed sword and round shield at its center. 2) "Mago" — crest enameled in deep sapphire blue, with a glowing arcane crystal orb resting atop a small open spellbook at its center. 3) "Ladino" — crest enameled in dark mossy-green, with two crossed curved daggers at its center. 4) "Clérigo" — crest enameled in warm tan-gold, with a radiant sunburst behind a small holy chalice at its center. 5) "Cavaleiro" — crest enameled in steel blue-gray, with a heraldic shield bearing a bold cross at its center.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between emblems — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the emblems themselves (enamel, gold relief, bronze rim) — that color is reserved only for the background and will be removed later. Wide canvas, 1536×768 px. No text, no labels, no numbers, no watermark, no extra border beyond each emblem's own bronze rim.
```

#### Emblemas de Classe II — Paladino, Bárbaro, Arqueiro, Caçador e Feiticeiro
**Tamanho:** 1536×768 px

```
Detailed 2D pixel art game UI icon, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and a few sharp specular pixels — the same sharp pixel-art style as this game's character sprites, Kingdom scene and dungeon maps (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT smooth vector art, NOT a soft airbrushed render.

Each emblem is a small circular medallion badge, pixel-art rendered like a chunky in-game icon: a thick pixelated bronze/iron rim (same blocky pixel-art metal-frame technique as this game's equipment slot frames) surrounding a solid enameled color fill in the class's own color, with ONE bold symbol drawn in pale gold/cream pixel-art relief filling most of the center — thick, simplified, high-contrast shapes with clean pixel outlines and only 2-3 shades of each color (base, highlight, shadow), no fine detail or gradients that would turn to noise at small size (this will be displayed as a tiny avatar icon in-game, roughly 32-40px on screen, so bold silhouette matters more than intricate linework).

One single wide image containing FIVE separate emblem medallions standing side by side in a single row, generous magenta gaps between every emblem so each can be cropped out individually later. Every emblem centered in its own cell, filling about 80% of that cell, same pixel-art rendering technique and quality across all five.

1) "Paladino" — crest enameled in bright gold, with a winged holy warhammer at its center. 2) "Bárbaro" — crest enameled in dark rust-brown, with a crossed great-axe over a small tusk at its center. 3) "Arqueiro" — crest enameled in forest green, with a drawn longbow and arrow at its center. 4) "Caçador" — crest enameled in olive green, with a crossbow crossed with a wolf-paw print at its center. 5) "Feiticeiro" — crest enameled in deep indigo-violet (NOT magenta/pink — lean deep blue-violet), with a swirling arcane flame at its center.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between emblems — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the emblems themselves (enamel, gold relief, bronze rim) — that color is reserved only for the background and will be removed later; this especially applies to the Feiticeiro emblem, which must read as blue-violet, never magenta-pink. Wide canvas, 1536×768 px. No text, no labels, no numbers, no watermark, no extra border beyond each emblem's own bronze rim.
```

#### Emblemas de Classe III — Bruxo, Druida, Bardo e Necromante
**Tamanho:** 1536×768 px

```
Detailed 2D pixel art game UI icon, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and a few sharp specular pixels — the same sharp pixel-art style as this game's character sprites, Kingdom scene and dungeon maps (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT smooth vector art, NOT a soft airbrushed render.

Each emblem is a small circular medallion badge, pixel-art rendered like a chunky in-game icon: a thick pixelated bronze/iron rim (same blocky pixel-art metal-frame technique as this game's equipment slot frames) surrounding a solid enameled color fill in the class's own color, with ONE bold symbol drawn in pale gold/cream pixel-art relief filling most of the center — thick, simplified, high-contrast shapes with clean pixel outlines and only 2-3 shades of each color (base, highlight, shadow), no fine detail or gradients that would turn to noise at small size (this will be displayed as a tiny avatar icon in-game, roughly 32-40px on screen, so bold silhouette matters more than intricate linework).

One single wide image containing FOUR separate emblem medallions standing side by side in a single row, generous magenta gaps between every emblem so each can be cropped out individually later. Every emblem centered in its own cell, filling about 80% of that cell, same pixel-art rendering technique and quality across all four.

1) "Bruxo" — crest enameled in dark violet-black, with a cursed skull sigil wreathed in wisps of purple smoke at its center. 2) "Druida" — crest enameled in mossy green, with a leaf-and-antler emblem at its center. 3) "Bardo" — crest enameled in warm amber-orange, with a golden musical note and lute emblem at its center. 4) "Necromante" — crest enameled in dark slate-gray, with a pale skull glowing faint sickly green at its center.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between emblems — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the emblems themselves (enamel, gold relief, bronze rim) — that color is reserved only for the background and will be removed later. Wide canvas, 1536×768 px. No text, no labels, no numbers, no watermark, no extra border beyond each emblem's own bronze rim.
```

**Cores de referência** (mesmas já usadas em cada classe no jogo hoje): Guerreiro `#a5432f`, Mago `#3f7ab8`, Ladino `#4a5a48`, Clérigo `#c9a86a`, Cavaleiro `#7a8a9a`, Paladino `#e0c060`, Bárbaro `#8a3a2a`, Arqueiro `#5a8a4a`, Caçador `#6a7a4a`, Feiticeiro `#a03fb8`, Bruxo `#4a2a5a`, Druida `#3f8a5a`, Bardo `#c9663c`, Necromante `#3a3a4a`.

---

## Ornamentos

Peças decorativas — faixa de título dos painéis, florão divisor entre seções.

### Banner de Título — Cabeçalho dos painéis
**Tamanho:** 1024×256 px · **Uso:** faixa atrás do título de cada janela

```
Hand-painted medieval fantasy game UI asset, rich digital painting style. A wide horizontal ornamental banner/ribbon carved from dark bronze, shaped like a medieval scroll or heraldic ribbon with pointed, slightly curled ends on both left and right sides. A subtle engraved knotwork pattern runs along the top and bottom edges of the banner. Warm bronze-to-gold gradient with a bright highlight along the top edge.

The flat central area of the banner (where a title will be written in the app) is a solid magenta color (#FF00FF) — no texture there. Wide rectangular canvas, 1024×256 px, viewed flat-on, centered. No text, no watermark.
```

### Florão Divisor — Separador entre seções
**Tamanho:** 512×256 px · **Uso:** enfeite pequeno entre blocos de texto

```
Hand-painted medieval fantasy game UI asset, rich digital painting style. A small ornamental flourish/divider, symmetrical left-to-right, made of carved wrought iron with a central heraldic diamond or shield shape flanked by two curling vine-like iron scrolls extending outward. Dark iron with a warm bronze highlight catching the light along the raised edges.

Centered horizontally in frame, with generous empty magenta space on either side. Solid magenta background (#FF00FF). Wide rectangular canvas, 512×256 px. No text, no watermark.
```

---

## Sprites de Personagens

Pixel art nítida (não estilo pintado/realista) — uma pose estática por personagem, vários personagens juntos na mesma folha (é só recortar cada um depois), sem animação, sem movimento.

**Direção obrigatória:** no jogo, o herói do jogador sempre fica do lado esquerdo da tela e o inimigo do lado direito. Os inimigos ficam de perfil olhando pra **ESQUERDA** (na direção do herói) — isso continua exigido nos prompts de inimigo abaixo. Os heróis/classes, porém, seguem o estilo das 3 artes já integradas no jogo (Guerreiro/Mago/Ladino): **quase de frente**, sem ser um perfil de lado, com o corpo e a arma levemente inclinados pro lado **direito** da imagem. Todo prompt de herói/classe abaixo já pede essa pose — se uma imagem sair de perfil de lado, olhando pra esquerda, ou totalmente simétrica de frente, gere de novo reforçando essa pose no prompt.

### Classes — Guerreiro, Mago e Ladino
**Tamanho:** 1536×768 px · **Uso:** recortar os 3 personagens jogáveis individualmente. (A classe no jogo se chama "Ladino" — o prompt abaixo ainda descreve o personagem como "Assassino" porque é a arte original já integrada; o visual serve para as duas.)

```
Detailed 2D pixel art game character sprite, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outline around every shape, limited but rich color palette with simple flat-shaded highlights and shadows (2-3 tones per surface). The sharp, readable style of high-quality modern pixel-art RPGs (Octopath Traveler, Eastward, Stardew Valley) rendered at a large, highly detailed resolution. This is NOT a painted illustration, NOT a realistic digital painting, NOT anime, NOT a 3D render — it must look like actual pixel art, made of visible square pixel blocks.

One single wide image containing THREE separate full-body character sprites standing side by side, evenly spaced with generous empty gaps between each one so they can be cropped apart later. All three at the same pixel scale and the same ground line, in a calm static idle pose — no motion blur, no action pose, no animation frames, just one clean standing pose each. CRITICAL — pose/direction: each character is nearly front-facing toward the viewer (NOT a side profile), but with the body, shoulders, and weapon-holding side turned in a slight, gentle lean toward the RIGHT side of the frame — the same understated forward-facing-with-a-rightward-lean stance a game hero sprite would use. None of them may be turned to face left, and none may be a strict hard side-profile — keep it close to front-on with just that slight rightward lean.

Left — "Guerreiro" (Warrior): a sturdy human fighter in heavy rust-red and dull iron plate armor, holding a longsword and a round shield, weathered battle-worn look.

Center — "Mago" (Mage): a slender human spellcaster in flowing deep-blue and midnight robes with silver trim, holding a tall wooden staff topped with a glowing pale-blue crystal, hood resting on the shoulders.

Right — "Assassino" (Assassin): a lithe human rogue in dark mossy-green and charcoal leather armor, hood up, gripping two curved daggers, crouched in a ready stance.

Solid flat magenta background (#FF00FF) filling the entire canvas behind and around all three characters — no texture, no gradient, no dithering, no ground shadow, no scenery. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the characters themselves (skin, cloth, metal, weapons, glow effects) — that color is reserved only for the background and will be removed later. Wide canvas, 1536×768 px, simple directional lighting from the upper-left. No text, no labels, no watermark, no border.
```

### Classe — Clérigo
**Tamanho:** 768×768 px · **Uso:** 4ª classe jogável, ainda sem arte própria (usa o sprite do Mago como placeholder no código até esta imagem ser gerada e integrada)

```
Detailed 2D pixel art game character sprite, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outline around every shape, limited but rich color palette with simple flat-shaded highlights and shadows (2-3 tones per surface). The sharp, readable style of high-quality modern pixel-art RPGs (Octopath Traveler, Eastward, Stardew Valley) rendered at a large, highly detailed resolution. This is NOT a painted illustration, NOT a realistic digital painting, NOT anime, NOT a 3D render — it must look like actual pixel art, made of visible square pixel blocks.

One single full-body character sprite, in a calm static idle pose — no motion blur, no action pose, no animation frames. CRITICAL — pose/direction: the character is nearly front-facing toward the viewer (NOT a side profile), but with the body, shoulders, and item-holding side turned in a slight, gentle lean toward the RIGHT side of the frame — the same understated forward-facing-with-a-rightward-lean stance a game hero sprite would use. It may NOT be turned to face left, and may NOT be a strict hard side-profile — keep it close to front-on with just that slight rightward lean.

"Clérigo" (Cleric): a devout human healer in warm ivory-and-gold consecrated robes with subtle holy trim, holding a golden mace or a short holy symbol/censer in one hand, calm serene expression, a faint warm golden glow around the hands. Same body proportions and pixel scale as a typical human adventurer sprite (not oversized, not chibi).

Solid flat magenta background (#FF00FF) filling the entire canvas behind the character — no texture, no gradient, no dithering, no ground shadow, no scenery. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the character (skin, cloth, metal, glow effects) — that color is reserved only for the background and will be removed later. Square canvas, 768×768 px, simple directional lighting from the upper-left. No text, no labels, no watermark, no border.
```

### Classes III — Cavaleiro, Paladino, Bárbaro e Arqueiro
**Tamanho:** 1536×768 px · **Uso:** 4 novas classes jogáveis, ainda sem arte própria (usam sprites de outras classes como placeholder no código até esta imagem ser gerada e integrada)

```
Detailed 2D pixel art game character sprite, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outline around every shape, limited but rich color palette with simple flat-shaded highlights and shadows (2-3 tones per surface). The sharp, readable style of high-quality modern pixel-art RPGs (Octopath Traveler, Eastward, Stardew Valley) rendered at a large, highly detailed resolution. This is NOT a painted illustration, NOT a realistic digital painting, NOT anime, NOT a 3D render — it must look like actual pixel art, made of visible square pixel blocks.

One single wide image containing FOUR separate full-body character sprites standing side by side, evenly spaced with generous empty gaps between each one so they can be cropped apart later. All four at the same pixel scale and the same ground line, in a calm static idle pose — no motion blur, no action pose, no animation frames. CRITICAL — pose/direction: each character is nearly front-facing toward the viewer (NOT a side profile), but with the body, shoulders, and weapon-holding side turned in a slight, gentle lean toward the RIGHT side of the frame — the same understated forward-facing-with-a-rightward-lean stance a game hero sprite would use. None of them may be turned to face left, and none may be a strict hard side-profile — keep it close to front-on with just that slight rightward lean.

1) "Cavaleiro" (Knight): a heavily armored human knight in polished steel-gray plate armor with a tall kite shield and a longsword, sturdy and imposing, tanky silhouette.
2) "Paladino" (Paladin): a holy warrior in radiant gold-and-white consecrated armor, holding a warhammer with a glowing holy symbol on the chest, righteous and noble bearing.
3) "Bárbaro" (Barbarian): a huge muscular human warrior in rough fur and leather with a massive two-handed axe, wild hair, war paint, fierce and reckless stance.
4) "Arqueiro" (Archer): an agile human archer in forest-green leather gear, holding a longbow with an arrow nocked, quiver on the back, alert and focused stance.

Solid flat magenta background (#FF00FF) filling the entire canvas behind and around all four characters — no texture, no gradient, no dithering, no ground shadow, no scenery. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the characters themselves (skin, cloth, metal, weapons, glow effects) — that color is reserved only for the background and will be removed later. Wide canvas, 1536×768 px, simple directional lighting from the upper-left. No text, no labels, no watermark, no border.
```

### Classes IV — Caçador, Feiticeiro, Bruxo e Druida
**Tamanho:** 1536×768 px · **Uso:** 4 novas classes jogáveis, ainda sem arte própria

```
Detailed 2D pixel art game character sprite, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outline around every shape, limited but rich color palette with simple flat-shaded highlights and shadows (2-3 tones per surface). The sharp, readable style of high-quality modern pixel-art RPGs (Octopath Traveler, Eastward, Stardew Valley) rendered at a large, highly detailed resolution. This is NOT a painted illustration, NOT a realistic digital painting, NOT anime, NOT a 3D render — it must look like actual pixel art, made of visible square pixel blocks.

One single wide image containing FOUR separate full-body character sprites standing side by side, evenly spaced with generous empty gaps between each one so they can be cropped apart later. All four at the same pixel scale and the same ground line, in a calm static idle pose — no motion blur, no action pose, no animation frames. CRITICAL — pose/direction: each character is nearly front-facing toward the viewer (NOT a side profile), but with the body, shoulders, and weapon-holding side turned in a slight, gentle lean toward the RIGHT side of the frame — the same understated forward-facing-with-a-rightward-lean stance a game hero sprite would use. None of them may be turned to face left, and none may be a strict hard side-profile — keep it close to front-on with just that slight rightward lean.

1) "Caçador" (Hunter): a rugged human hunter in olive-and-brown camouflage-style leather gear, holding a crossbow, a small trap or snare hanging from the belt, sharp watchful eyes.
2) "Feiticeiro" (Sorcerer): a human spellcaster in flowing violet-and-black arcane robes crackling with faint purple energy, holding an ornate glowing grimoire, intense expression.
3) "Bruxo" (Warlock): a human dark magic user in tattered deep-purple and black robes with bone/skull trinkets, holding a dark grimoire wrapped in chains, an eerie faint purple glow around the hands.
4) "Druida" (Druid): a human nature spellcaster in earthy green-and-brown robes woven with leaves and vines, holding a gnarled wooden staff topped with a glowing green crystal, antlers or a leaf crown on the head.

Solid flat magenta background (#FF00FF) filling the entire canvas behind and around all four characters — no texture, no gradient, no dithering, no ground shadow, no scenery. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the characters themselves (skin, cloth, metal, weapons, glow effects) — that color is reserved only for the background and will be removed later. Wide canvas, 1536×768 px, simple directional lighting from the upper-left. No text, no labels, no watermark, no border.
```

### Classes V — Bardo e Necromante
**Tamanho:** 1024×768 px · **Uso:** 2 novas classes jogáveis, ainda sem arte própria

```
Detailed 2D pixel art game character sprite, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outline around every shape, limited but rich color palette with simple flat-shaded highlights and shadows (2-3 tones per surface). The sharp, readable style of high-quality modern pixel-art RPGs (Octopath Traveler, Eastward, Stardew Valley) rendered at a large, highly detailed resolution. This is NOT a painted illustration, NOT a realistic digital painting, NOT anime, NOT a 3D render — it must look like actual pixel art, made of visible square pixel blocks.

One single wide image containing TWO separate full-body character sprites standing side by side, evenly spaced with a generous empty gap between them so they can be cropped apart later. Both at the same pixel scale and the same ground line, in a calm static idle pose — no motion blur, no action pose, no animation frames. CRITICAL — pose/direction: each character is nearly front-facing toward the viewer (NOT a side profile), but with the body, shoulders, and item-holding side turned in a slight, gentle lean toward the RIGHT side of the frame — the same understated forward-facing-with-a-rightward-lean stance a game hero sprite would use. Neither may be turned to face left, and neither may be a strict hard side-profile — keep it close to front-on with just that slight rightward lean.

1) "Bardo" (Bard): a charismatic human performer in warm amber-and-burgundy travel clothes, holding an ornate enchanted lute with a faint musical-note glow, confident charming pose.
2) "Necromante" (Necromancer): a gaunt human dark spellcaster in tattered slate-gray and black robes, holding a bone-topped scepter, a faint ghostly pale-green glow around the hands, unsettling calm expression.

Solid flat magenta background (#FF00FF) filling the entire canvas behind and around both characters — no texture, no gradient, no dithering, no ground shadow, no scenery. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the characters themselves (skin, cloth, metal, weapons, glow effects) — that color is reserved only for the background and will be removed later. Wide canvas, 1024×768 px, simple directional lighting from the upper-left. No text, no labels, no watermark, no border.
```

### Inimigos I — Goblin, Lobo, Esqueleto e Orc
**Tamanho:** 1536×768 px · **Uso:** inimigos de profundidade baixa/média (Ruínas, Cavernas)

```
Detailed 2D pixel art game character sprite, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outline around every shape, limited but rich color palette with simple flat-shaded highlights and shadows (2-3 tones per surface). The sharp, readable style of high-quality modern pixel-art RPGs (Octopath Traveler, Eastward, Stardew Valley) rendered at a large, highly detailed resolution. This is NOT a painted illustration, NOT a realistic digital painting, NOT anime, NOT a 3D render — it must look like actual pixel art, made of visible square pixel blocks.

One single wide image containing FOUR separate enemy creature sprites standing side by side, evenly spaced with generous empty gaps between each one so they can be cropped apart later. All four sharing the same pixel scale and ground line, static idle/threatening pose — no motion blur, no animation frames. CRITICAL: every single one of the four creatures must be facing LEFT — shown in left-facing profile or a 3/4 view turned toward the left side of the frame, as if all four are looking at/approaching something standing to their left. None of them may face right, face forward, or face the viewer — this is a strict requirement, since in the game these enemies always stand to the player's right and must visually face the player on their left.

1) "Goblin": a small hunched green-skinned goblin in dirty leather rags, gripping a crude rusty dagger, sneaky posture, sharp yellow eyes.
2) "Lobo Selvagem" (Wild Wolf): a lean feral gray wolf on all four legs, patchy fur, bared fangs, snarling.
3) "Esqueleto" (Skeleton): an animated bone skeleton warrior in tattered rags, wielding a corroded rusty sword, faint pale glow in its hollow eye sockets.
4) "Orc Guerreiro" (Orc Warrior): a bulky muscular green-skinned orc with tusks, wearing spiked dark armor, hefting a heavy two-handed axe.

Solid flat magenta background (#FF00FF) filling the entire canvas — no texture, no gradient, no dithering, no ground shadow, no scenery. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the creatures themselves (skin, fur, bone, armor, weapons) — that color is reserved only for the background. Wide canvas, 1536×768 px (roughly one quarter of the width per creature), simple directional lighting from the upper-left. No text, no labels, no watermark, no border.
```

### Inimigos II — Troll, Aberração das Sombras e Dragão Jovem
**Tamanho:** 1536×768 px · **Uso:** inimigos de profundidade alta (Covil dos Dragões, Torre Amaldiçoada)

```
Detailed 2D pixel art game character sprite, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outline around every shape, limited but rich color palette with simple flat-shaded highlights and shadows (2-3 tones per surface). The sharp, readable style of high-quality modern pixel-art RPGs (Octopath Traveler, Eastward, Stardew Valley) rendered at a large, highly detailed resolution. This is NOT a painted illustration, NOT a realistic digital painting, NOT anime, NOT a 3D render — it must look like actual pixel art, made of visible square pixel blocks.

One single wide image containing THREE separate enemy creature sprites standing side by side, evenly spaced with generous empty gaps between each one so they can be cropped apart later. All three sharing the same ground line, static idle/threatening pose — no motion blur, no animation frames. These three are bigger, more menacing late-game monsters — let each one fill more of its portion of the frame than a small goblin would. CRITICAL: every single one of the three creatures must be facing LEFT — shown in left-facing profile or a 3/4 view turned toward the left side of the frame, as if all three are looking at/approaching something standing to their left. None of them may face right, face forward, or face the viewer — this is a strict requirement, since in the game these enemies always stand to the player's right and must visually face the player on their left.

1) "Troll das Cavernas" (Cave Troll): a massive hunched brown-gray troll with thick warty hide, small beady eyes, gripping a huge crude stone club, low ape-like stance.
2) "Aberração das Sombras" (Shadow Horror): an unsettling amorphous eldritch creature made of swirling dark purple-black smoke and shadow, with several glowing pale eyes and long clawed shadow-limbs reaching outward, eerie and otherworldly.
3) "Dragão Jovem" (Young Dragon): a young bipedal red dragon with small folded wings, deep-red overlapping scales, sharp horns, bared teeth, fierce aggressive stance.

Solid flat magenta background (#FF00FF) filling the entire canvas — no texture, no gradient, no dithering, no ground shadow, no scenery. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the creatures themselves (scales, smoke, hide, claws, glow effects) — that color is reserved only for the background. Wide canvas, 1536×768 px, simple directional lighting from the upper-left. No text, no labels, no watermark, no border.
```

### Inimigos III — Ruínas Superficiais: Morcego, Lodo Ácido, Bandido e Corvo
**Tamanho:** 1536×768 px · **Uso:** roster da masmorra Ruínas Superficiais (o Esqueleto já integrado continua fazendo parte do roster, sem prompt novo)

```
Detailed 2D pixel art game character sprite, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outline around every shape, limited but rich color palette with simple flat-shaded highlights and shadows (2-3 tones per surface). The sharp, readable style of high-quality modern pixel-art RPGs (Octopath Traveler, Eastward, Stardew Valley) rendered at a large, highly detailed resolution. This is NOT a painted illustration, NOT a realistic digital painting, NOT anime, NOT a 3D render — it must look like actual pixel art, made of visible square pixel blocks.

One single wide image containing FOUR separate enemy creature sprites standing side by side, evenly spaced with generous empty gaps between each one so they can be cropped apart later. All four sharing the same pixel scale and ground line, static idle/threatening pose — no motion blur, no animation frames. CRITICAL: every single one of the four creatures must be facing LEFT — shown in left-facing profile or a 3/4 view turned toward the left side of the frame, as if all four are looking at/approaching something standing to their left. None of them may face right, face forward, or face the viewer — this is a strict requirement, since in the game these enemies always stand to the player's right and must visually face the player on their left.

1) "Morcego das Ruínas" (Ruin Bat): a small leathery-winged cave bat, mid-flight with wings spread, sharp fangs bared, beady red eyes, dusty gray-brown membrane wings.
2) "Lodo Ácido" (Acid Slime): a translucent sickly-green gelatinous blob creature, bubbling and dripping with corrosive acid, faint glowing motes suspended inside its jelly body, no limbs, low to the ground.
3) "Bandido das Ruínas" (Ruin Bandit): a scruffy human scavenger in ragged dark leathers and a cloth face-wrap, gripping a curved rusty short sword, crouched sneaky stance, scavenged mismatched gear.
4) "Corvo Carniceiro" (Carrion Crow): a large black crow with ragged glossy feathers and a sharp cruel beak, wings half-spread, perched low as if about to lunge.

Solid flat magenta background (#FF00FF) filling the entire canvas — no texture, no gradient, no dithering, no ground shadow, no scenery. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the creatures themselves (skin, fur, feathers, ooze, cloth, weapons) — that color is reserved only for the background. Wide canvas, 1536×768 px (roughly one quarter of the width per creature), simple directional lighting from the upper-left. No text, no labels, no watermark, no border.
```

### Chefe — Ruínas Superficiais: Rei Ossudo
**Tamanho:** 768×768 px · **Uso:** boss da masmorra Ruínas Superficiais, spawna na profundidade 7 com barra de vida própria no topo da tela de batalha

```
Detailed 2D pixel art game character sprite, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outline around every shape, limited but rich color palette with simple flat-shaded highlights and shadows (2-3 tones per surface). The sharp, readable style of high-quality modern pixel-art RPGs (Octopath Traveler, Eastward, Stardew Valley) rendered at a large, highly detailed resolution. This is NOT a painted illustration, NOT a realistic digital painting, NOT anime, NOT a 3D render — it must look like actual pixel art, made of visible square pixel blocks.

One single boss-scale enemy creature sprite, filling most of the frame, in a static idle/threatening pose — no motion blur, no animation frames. CRITICAL: the creature must be facing LEFT — shown in left-facing profile or a 3/4 view turned toward the left side of the frame, as if looking at/approaching something standing to its left. It may NOT face right, face forward, or face the viewer — this is a strict requirement, since in the game this boss always stands to the player's right and must visually face the player on their left.

"Rei Ossudo" (Bone King): a towering imposing skeleton warlord, larger and more elaborate than a common skeleton, wearing a jagged bone crown and tattered regal purple-and-gold burial shrouds over ancient corroded plate armor, gripping a massive two-handed ancient greatsword, wisps of pale ghostly blue-green light glowing from its hollow eye sockets, an aura of dread. Clearly bigger and more menacing than a regular skeleton enemy.

Solid flat magenta background (#FF00FF) filling the entire canvas behind the creature — no texture, no gradient, no dithering, no ground shadow, no scenery. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the creature (bone, cloth, armor, glow effects) — that color is reserved only for the background. Square canvas, 768×768 px, simple directional lighting from the upper-left. No text, no labels, no watermark, no border.
```

### Inimigos IV — Caverna dos Goblins: Xamã, Arremessador, Fanático e Montador de Lobo
**Tamanho:** 1536×768 px · **Uso:** roster da masmorra Caverna dos Goblins (o Goblin comum já integrado continua fazendo parte do roster, sem prompt novo)

```
Detailed 2D pixel art game character sprite, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outline around every shape, limited but rich color palette with simple flat-shaded highlights and shadows (2-3 tones per surface). The sharp, readable style of high-quality modern pixel-art RPGs (Octopath Traveler, Eastward, Stardew Valley) rendered at a large, highly detailed resolution. This is NOT a painted illustration, NOT a realistic digital painting, NOT anime, NOT a 3D render — it must look like actual pixel art, made of visible square pixel blocks.

One single wide image containing FOUR separate enemy creature sprites standing side by side, evenly spaced with generous empty gaps between each one so they can be cropped apart later. All four sharing the same pixel scale and ground line, static idle/threatening pose — no motion blur, no animation frames. CRITICAL: every single one of the four creatures must be facing LEFT — shown in left-facing profile or a 3/4 view turned toward the left side of the frame, as if all four are looking at/approaching something standing to their left. None of them may face right, face forward, or face the viewer — this is a strict requirement, since in the game these enemies always stand to the player's right and must visually face the player on their left.

1) "Xamã Goblin" (Goblin Shaman): a scrawny green-skinned goblin in ragged bone-and-feather trinkets, gripping a crooked wooden staff topped with a glowing sickly-green crystal, chanting pose, crackling dark magic energy around its free hand.
2) "Goblin Arremessador" (Goblin Thrower): a wiry green-skinned goblin with a bandolier of crude spiked javelins across its back, one javelin cocked back ready to throw, sharp grin.
3) "Goblin Fanático" (Goblin Fanatic): a wild-eyed green-skinned goblin strapped with crude sputtering bomb-satchels and lit fuses, manic grin, unstable and twitchy stance.
4) "Goblin Montador de Lobo" (Goblin Wolf Rider): a green-skinned goblin in scrappy leather harness riding atop a snarling gray warg/wolf mount, gripping a short spear, both goblin and mount alert and aggressive.

Solid flat magenta background (#FF00FF) filling the entire canvas — no texture, no gradient, no dithering, no ground shadow, no scenery. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the creatures themselves (skin, fur, cloth, weapons, magic glow) — that color is reserved only for the background. Wide canvas, 1536×768 px (roughly one quarter of the width per creature), simple directional lighting from the upper-left. No text, no labels, no watermark, no border.
```

### Chefe — Caverna dos Goblins: Grash
**Tamanho:** 768×768 px · **Uso:** boss da masmorra Caverna dos Goblins, spawna na profundidade 10 com barra de vida própria no topo da tela de batalha

```
Detailed 2D pixel art game character sprite, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outline around every shape, limited but rich color palette with simple flat-shaded highlights and shadows (2-3 tones per surface). The sharp, readable style of high-quality modern pixel-art RPGs (Octopath Traveler, Eastward, Stardew Valley) rendered at a large, highly detailed resolution. This is NOT a painted illustration, NOT a realistic digital painting, NOT anime, NOT a 3D render — it must look like actual pixel art, made of visible square pixel blocks.

One single boss-scale enemy creature sprite, filling most of the frame, in a static idle/threatening pose — no motion blur, no animation frames. CRITICAL: the creature must be facing LEFT — shown in left-facing profile or a 3/4 view turned toward the left side of the frame, as if looking at/approaching something standing to its left. It may NOT face right, face forward, or face the viewer — this is a strict requirement, since in the game this boss always stands to the player's right and must visually face the player on their left.

"Grash" (goblin chieftain): a huge, muscular green-skinned goblin chieftain, much bigger and stockier than a common goblin, wearing crude spiked iron plate armor patched with trophies and bones, a torn red cloak, gripping a massive studded club in one hand and a jagged cleaver in the other, tusked snarling grin, scars across its face.

Solid flat magenta background (#FF00FF) filling the entire canvas behind the creature — no texture, no gradient, no dithering, no ground shadow, no scenery. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the creature (skin, armor, cloth, weapons) — that color is reserved only for the background. Square canvas, 768×768 px, simple directional lighting from the upper-left. No text, no labels, no watermark, no border.
```

### Inimigos V — Cripta do Tesouro: Zumbi Saqueador, Guardião de Pedra, Espectro Ganancioso, Múmia Enrolada e Baú Mímico
**Tamanho:** 1536×768 px · **Uso:** roster completo da masmorra Cripta do Tesouro (5 inimigos regulares)

```
Detailed 2D pixel art game character sprite, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outline around every shape, limited but rich color palette with simple flat-shaded highlights and shadows (2-3 tones per surface). The sharp, readable style of high-quality modern pixel-art RPGs (Octopath Traveler, Eastward, Stardew Valley) rendered at a large, highly detailed resolution. This is NOT a painted illustration, NOT a realistic digital painting, NOT anime, NOT a 3D render — it must look like actual pixel art, made of visible square pixel blocks.

One single wide image containing FIVE separate enemy creature sprites standing side by side, evenly spaced with generous empty gaps between each one so they can be cropped apart later (roughly one fifth of the width per creature — keep each one simple and readable at that scale). All five sharing the same pixel scale and ground line, static idle/threatening pose — no motion blur, no animation frames. CRITICAL: every single one of the five creatures must be facing LEFT — shown in left-facing profile or a 3/4 view turned toward the left side of the frame, as if all five are looking at/approaching something standing to their left. None of them may face right, face forward, or face the viewer — this is a strict requirement, since in the game these enemies always stand to the player's right and must visually face the player on their left.

1) "Zumbi Saqueador" (Zombie Looter): a decaying gray-green shambling zombie in tattered burial clothes, clutching a fistful of stolen gold coins and a rusty dagger, slack-jawed, milky dead eyes.
2) "Guardião de Pedra" (Stone Guardian): a squat blocky animated stone statue/golem covered in ancient carved runes that glow faintly, cracked gray granite body, heavy stone fists, immobile-looking but menacing stance.
3) "Espectro Ganancioso" (Greedy Wraith): a translucent ghostly wraith wrapped in tattered spectral robes, semi-transparent pale-blue glow, clutching a hoard of ghostly floating gold coins and jewels around itself, hollow mournful face.
4) "Múmia Enrolada" (Wrapped Mummy): a mummified undead figure wrapped head to toe in dusty aged bandages, one arm outstretched, faint dry cursed energy seeping from the wrappings, slow lumbering stance.
5) "Baú Mímico" (Mimic Chest): a wooden treasure chest with a wide toothy monstrous maw where the lid should open, sharp fangs, small beady eyes on the front panel, a long barbed tongue-like tendril, iron bands and a false innocent gleam of treasure inside its mouth.

Solid flat magenta background (#FF00FF) filling the entire canvas — no texture, no gradient, no dithering, no ground shadow, no scenery. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the creatures themselves (skin, bandages, stone, ghostly glow, wood, gold) — that color is reserved only for the background. Wide canvas, 1536×768 px, simple directional lighting from the upper-left. No text, no labels, no watermark, no border.
```

### Chefe — Cripta do Tesouro: Custódio Amaldiçoado
**Tamanho:** 768×768 px · **Uso:** boss da masmorra Cripta do Tesouro, spawna na profundidade 9 com barra de vida própria no topo da tela de batalha

```
Detailed 2D pixel art game character sprite, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outline around every shape, limited but rich color palette with simple flat-shaded highlights and shadows (2-3 tones per surface). The sharp, readable style of high-quality modern pixel-art RPGs (Octopath Traveler, Eastward, Stardew Valley) rendered at a large, highly detailed resolution. This is NOT a painted illustration, NOT a realistic digital painting, NOT anime, NOT a 3D render — it must look like actual pixel art, made of visible square pixel blocks.

One single boss-scale enemy creature sprite, filling most of the frame, in a static idle/threatening pose — no motion blur, no animation frames. CRITICAL: the creature must be facing LEFT — shown in left-facing profile or a 3/4 view turned toward the left side of the frame, as if looking at/approaching something standing to its left. It may NOT face right, face forward, or face the viewer — this is a strict requirement, since in the game this boss always stands to the player's right and must visually face the player on their left.

"Custódio Amaldiçoado" (Cursed Custodian): a massive undead knight bound to guard the crypt's treasure forever, wearing ornate corroded gold-and-black burial armor fused to its skeletal frame, a huge ceremonial ornate key or treasure-bound chain hanging from its belt, gripping a heavy ornamental warhammer, faint cursed purple-green necrotic energy leaking from the armor's joints, imposing regal-but-decayed presence.

Solid flat magenta background (#FF00FF) filling the entire canvas behind the creature — no texture, no gradient, no dithering, no ground shadow, no scenery. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the creature (bone, armor, cloth, glow effects) — that color is reserved only for the background. Square canvas, 768×768 px, simple directional lighting from the upper-left. No text, no labels, no watermark, no border.
```

### Inimigos VI — Pântano Podre: Sapo Venenoso, Víbora do Pântano, Lodaçal Rastejante, Fogo-Fátuo Amaldiçoado e Jacaré Podre
**Tamanho:** 1536×768 px · **Uso:** roster completo da masmorra Pântano Podre (5 inimigos regulares)

```
Detailed 2D pixel art game character sprite, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outline around every shape, limited but rich color palette with simple flat-shaded highlights and shadows (2-3 tones per surface). The sharp, readable style of high-quality modern pixel-art RPGs (Octopath Traveler, Eastward, Stardew Valley) rendered at a large, highly detailed resolution. This is NOT a painted illustration, NOT a realistic digital painting, NOT anime, NOT a 3D render — it must look like actual pixel art, made of visible square pixel blocks.

One single wide image containing FIVE separate enemy creature sprites standing side by side, evenly spaced with generous empty gaps between each one so they can be cropped apart later (roughly one fifth of the width per creature — keep each one simple and readable at that scale). All five sharing the same pixel scale and ground line, static idle/threatening pose — no motion blur, no animation frames. CRITICAL: every single one of the five creatures must be facing LEFT — shown in left-facing profile or a 3/4 view turned toward the left side of the frame, as if all five are looking at/approaching something standing to their left. None of them may face right, face forward, or face the viewer — this is a strict requirement, since in the game these enemies always stand to the player's right and must visually face the player on their left.

1) "Sapo Venenoso" (Poison Toad): a bloated warty dark-green toad with dripping toxic purple secretions on its back, bulging yellow eyes, squat low-to-the-ground stance.
2) "Víbora do Pântano" (Swamp Viper): a long coiled dark-scaled swamp snake with dull olive-and-black patterned scales, reared up ready to strike, flicking forked tongue, narrow slit eyes.
3) "Lodaçal Rastejante" (Crawling Bog): a shapeless creature formed from animated black swamp mud and tangled rotting roots, glowing faint sickly-yellow eyes embedded in the muck, dripping and oozing, crawling low.
4) "Fogo-Fátuo Amaldiçoado" (Cursed Wisp): a small floating ball of eerie flickering pale-green ghostly flame/light with a faint malevolent wisp-like face barely visible inside the glow, trailing wispy smoke tendrils.
5) "Jacaré Podre" (Rotting Gator): a decaying undead alligator with patches of exposed bone and rotting gray-green hide, waterlogged, jaws open showing jagged teeth, low predatory crouch.

Solid flat magenta background (#FF00FF) filling the entire canvas — no texture, no gradient, no dithering, no ground shadow, no scenery. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the creatures themselves (skin, scales, hide, muck, glow effects) — that color is reserved only for the background. Wide canvas, 1536×768 px, simple directional lighting from the upper-left. No text, no labels, no watermark, no border.
```

### Chefe — Pântano Podre: Mãe do Lodo
**Tamanho:** 768×768 px · **Uso:** boss da masmorra Pântano Podre, spawna na profundidade 13 com barra de vida própria no topo da tela de batalha

```
Detailed 2D pixel art game character sprite, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outline around every shape, limited but rich color palette with simple flat-shaded highlights and shadows (2-3 tones per surface). The sharp, readable style of high-quality modern pixel-art RPGs (Octopath Traveler, Eastward, Stardew Valley) rendered at a large, highly detailed resolution. This is NOT a painted illustration, NOT a realistic digital painting, NOT anime, NOT a 3D render — it must look like actual pixel art, made of visible square pixel blocks.

One single boss-scale enemy creature sprite, filling most of the frame, in a static idle/threatening pose — no motion blur, no animation frames. CRITICAL: the creature must be facing LEFT — shown in left-facing profile or a 3/4 view turned toward the left side of the frame, as if looking at/approaching something standing to its left. It may NOT face right, face forward, or face the viewer — this is a strict requirement, since in the game this boss always stands to the player's right and must visually face the player on their left.

"Mãe do Lodo" (Mud Mother): a huge bloated swamp hag creature, part rotting flesh and part living black mud and tangled roots, dripping muck, several long thin root-like tendrils extending from her back like spider legs, a bloated distended torso, glowing sickly yellow-green eyes, crown of thorny reeds, dreadful and ancient presence, clearly the biggest and most menacing creature of the swamp.

Solid flat magenta background (#FF00FF) filling the entire canvas behind the creature — no texture, no gradient, no dithering, no ground shadow, no scenery. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the creature (skin, mud, roots, glow effects) — that color is reserved only for the background. Square canvas, 768×768 px, simple directional lighting from the upper-left. No text, no labels, no watermark, no border.
```

### Inimigos VII — Covil de Aranhas: Aranha Caçadora, Aranha Venenosa, Aranha Gigante, Enxame de Aranhinhas e Tecelã Sombria
**Tamanho:** 1536×768 px · **Uso:** roster completo da masmorra Covil de Aranhas (5 inimigos regulares)

```
Detailed 2D pixel art game character sprite, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outline around every shape, limited but rich color palette with simple flat-shaded highlights and shadows (2-3 tones per surface). The sharp, readable style of high-quality modern pixel-art RPGs (Octopath Traveler, Eastward, Stardew Valley) rendered at a large, highly detailed resolution. This is NOT a painted illustration, NOT a realistic digital painting, NOT anime, NOT a 3D render — it must look like actual pixel art, made of visible square pixel blocks.

One single wide image containing FIVE separate enemy creature sprites standing side by side, evenly spaced with generous empty gaps between each one so they can be cropped apart later (roughly one fifth of the width per creature — keep each one simple and readable at that scale). All five sharing the same pixel scale and ground line, static idle/threatening pose — no motion blur, no animation frames. CRITICAL: every single one of the five creatures must be facing LEFT — shown in left-facing profile or a 3/4 view turned toward the left side of the frame, as if all five are looking at/approaching something standing to their left. None of them may face right, face forward, or face the viewer — this is a strict requirement, since in the game these enemies always stand to the player's right and must visually face the player on their left.

1) "Aranha Caçadora" (Hunting Spider): a medium brown-and-tan hairy spider, low crouched stalking stance, eight legs spread wide, multiple small glinting eyes.
2) "Aranha Venenosa" (Venom Spider): a sleek dark-purple spider with glistening dripping venom-green fangs and faint venom-green markings along its abdomen, alert aggressive stance.
3) "Aranha Gigante" (Giant Spider): a large hulking black-and-gray spider, thick spiky legs, oversized fanged mandibles, clearly bigger and bulkier than the other spiders.
4) "Enxame de Aranhinhas" (Spiderling Swarm): a tight cluster of many small black spiderlings swarming together as a single mass, countless tiny glinting eyes and legs, chaotic skittering arrangement.
5) "Tecelã Sombria" (Dark Weaver): an eerie humanoid-spider hybrid — a gaunt shadowy female torso emerging from a large black spider's thorax/legs, long clawed fingers trailing spun web-silk, pale hollow eyes, unsettling and otherworldly.

Solid flat magenta background (#FF00FF) filling the entire canvas — no texture, no gradient, no dithering, no ground shadow, no scenery. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the creatures themselves (chitin, fur, fangs, silk, skin, glow effects) — that color is reserved only for the background. Wide canvas, 1536×768 px, simple directional lighting from the upper-left. No text, no labels, no watermark, no border.
```

### Chefe — Covil de Aranhas: Matriarca Negra
**Tamanho:** 768×768 px · **Uso:** boss da masmorra Covil de Aranhas, spawna na profundidade 16 com barra de vida própria no topo da tela de batalha

```
Detailed 2D pixel art game character sprite, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outline around every shape, limited but rich color palette with simple flat-shaded highlights and shadows (2-3 tones per surface). The sharp, readable style of high-quality modern pixel-art RPGs (Octopath Traveler, Eastward, Stardew Valley) rendered at a large, highly detailed resolution. This is NOT a painted illustration, NOT a realistic digital painting, NOT anime, NOT a 3D render — it must look like actual pixel art, made of visible square pixel blocks.

One single boss-scale enemy creature sprite, filling most of the frame, in a static idle/threatening pose — no motion blur, no animation frames. CRITICAL: the creature must be facing LEFT — shown in left-facing profile or a 3/4 view turned toward the left side of the frame, as if looking at/approaching something standing to its left. It may NOT face right, face forward, or face the viewer — this is a strict requirement, since in the game this boss always stands to the player's right and must visually face the player on their left.

"Matriarca Negra" (Black Matriarch): a massive black widow spider queen, far bigger than any other spider in the den, glossy jet-black bulbous abdomen marked with a vivid blood-red hourglass symbol, thick spiky segmented legs, oversized venom-dripping fangs, multiple gleaming red eyes, an aura of ancient malevolent intelligence, webbing trailing from its rear legs.

Solid flat magenta background (#FF00FF) filling the entire canvas behind the creature — no texture, no gradient, no dithering, no ground shadow, no scenery. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the creature (chitin, fangs, markings, silk) — that color is reserved only for the background. Square canvas, 768×768 px, simple directional lighting from the upper-left. No text, no labels, no watermark, no border.
```

---

## Cenas

Ilustração completa, preenchendo a tela inteira — sem fundo magenta, não é para recortar.

### Cena do Reino — Tela de Visão Geral do Reino
**Tamanho:** 1536×640 px · **Uso:** substitui o desenho procedural do castelo na tela do Reino

```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A wide nighttime kingdom scene viewed from just outside the walls: a fortified stone castle with two towers and a lit gatehouse, silhouetted against a deep indigo night sky. A large pale moon with faint craters sits above the towers, surrounded by scattered twinkling stars. Rolling dark hills in the distance. Warm orange torchlight glow beside the castle gate. A few thin wisps of ground fog drifting near the base of the walls.

This is a complete, self-contained illustration meant to fill the entire canvas edge-to-edge — unlike the sprite sheets above, this one should NOT have a magenta background and should NOT be treated as a cutout; it's a finished scene, not something to key out. Wide canvas, 1536×640 px. No text, no watermark, no UI elements, no frame or border.
```

### Mapa de Construções — Tela de Reino: Construções
**Tamanho:** 1536×640 px · **Uso:** substitui a lista simples de construções por um mapa clicável (mesmo padrão do Mapa de Masmorras — marcadores por cima da própria arte)

```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and Kingdom scene (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A wide nighttime view of the castle's inner courtyard, seen from just inside the gates — the same fortified stone walls and deep indigo night sky as the Reino overview scene, but now looking IN at the grounds instead of at the gate from outside. Warm torchlight and a pale moon overhead, a few scattered stars. Cobblestone paths connect three distinct structures spread across the courtyard, left to right:

1) "Forja" — a sturdy stone forge building with a chimney glowing orange from an internal furnace, sparks drifting upward, a blacksmith's anvil visible near the open door.
2) "Capela" — a small stone chapel with a modest bell tower and a stained-glass window glowing soft blue-white from within.
3) "Guilda dos Aventureiros" — a timber-and-stone hall with a hanging wooden sign and a banner bearing a simple heraldic emblem over the door.

Each of the three has a small wooden signpost bearing its Portuguese name near its entrance (small spelling mistakes acceptable). Leave one clearly buildable empty plot near the right edge — bare ground with a low stone foundation outline and a fog-shrouded silhouette of scaffolding, suggesting a future construction site, no legible sign.

This is a complete, self-contained illustration meant to fill the canvas edge-to-edge — no magenta background, not a cutout. Wide canvas, 1536×640 px. No text beyond the small signs described, no watermark, no UI elements, no frame or border.
```

### Cena do Ferreiro — Tela do Ferreiro (aberta pela Forja)
**Tamanho:** 1536×1536 px (quadrado) · **Uso:** banner grande em tela cheia no topo da tela do Ferreiro (aberta ao tocar "Conversar com o Ferreiro" no balão da Forja) — substitui o placeholder de brilho em CSS. Ocupa ~44% da altura da tela do celular, largura total (`object-fit: cover`), então o quadrado garante uma sobra segura pra cortar tanto em celulares mais largos quanto mais altos sem perder o assunto principal. O nome "Ferreiro" e o botão de fechar ficam sobrepostos no canto superior, com um gradiente escuro por trás pra legibilidade — não precisa deixar essa área vazia de propósito.

```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and other scenes (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A close interior view of the Forja's workshop at night — not the wide courtyard from the Mapa de Construções scene, but a tighter shot inside the forge building itself. A stocky blacksmith NPC (weathered face, leather apron over simple work clothes, thick forearms) stands at a glowing anvil roughly centered in the frame, mid-swing with a hammer or looking toward the viewer with a friendly, gruff expression. Behind him, a lit furnace glows deep orange, casting warm light and drifting sparks across the scene. Stone walls hung with tool racks, tongs, and a few finished weapons and shields.

Composition: keep the blacksmith and anvil — the main subject — comfortably within the center 70% of the square canvas, since the image will be cropped to different aspect ratios (sometimes wider, sometimes taller) depending on the player's screen. Don't place anything essential right at the edges.

This is a complete, self-contained illustration meant to fill the canvas edge-to-edge — no magenta background, not a cutout. Square canvas, 1536×1536 px. No text, no watermark, no UI elements, no frame or border.
```

### Mapa de Masmorras — Tela de seleção de masmorra (7 imagens, uma por região)

As 7 imagens abaixo empilham verticalmente no jogo formando um único caminho de exploração, com scroll — Região 1 (Valdren) embaixo, Região 7 (Aetherion) no topo, o jogador rola a tela pra cima conforme sobe de nível. Cada prompt já está completo e pronto pra colar, sem precisar combinar com nenhum outro bloco.

### Região 1 — Valdren (nível 1-10)
**Tamanho:** 1024×2560 px · **Uso:** primeiro trecho (mais baixo) do Mapa de Masmorras

```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and Kingdom scene (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A tall vertical dungeon-selection map segment — this is the FIRST (lowest) of 7 stacked regions forming one long exploration path, so the path should exit off the top edge of the canvas continuing upward (no need to connect at the bottom, this is the starting point). A winding dirt path connects distinct location markers from the bottom of the canvas to the top. Sunny grassy plains and moss-covered ancient ruins near the kingdom's entrance, tall grass, warm inviting daylight.

Location markers along the path, bottom to top, each a small distinct landmark with a wooden/parchment sign bearing its Portuguese name (small spelling mistakes in the text are acceptable): 1) "Ruínas Superficiais" — an open sunlit stone ruin. 2) "Caverna dos Goblins" — a cave mouth decorated with crude tribal totems. 3) "Cripta do Tesouro" — a crypt with a half-open golden door, marked with a glowing rune (this one is special — give it a distinct golden magical glow the others don't have). 4) "Pântano Podre" — dead trees rising from stagnant murky water. 5) "Covil de Aranhas" — a rocky crevice thick with spiderwebs.

Scatter 2 extra fog-shrouded silhouette markers with no legible name near the edges of the image — reserved space for future content. This is a complete, self-contained background illustration — no magenta background, not meant to be cut out or keyed. No UI elements, no frame, no extra text beyond the small location name signs described above. Vertical canvas, 1024×2560 px.
```

### Região 2 — Umbrália (nível 11-20)
**Tamanho:** 1024×2560 px · **Uso:** segundo trecho do Mapa de Masmorras

```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and Kingdom scene (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A tall vertical dungeon-selection map segment — this is the SECOND of 7 stacked regions forming one long exploration path, so the path enters from the bottom edge of the canvas and exits off the top edge, continuing both directions. A winding path connects distinct location markers from bottom to top, transitioning into a dense, shadowy forest at dusk, low ground fog drifting between the trees, distant ruined towers silhouetted against an orange-purple sunset sky.

Location markers along the path, bottom to top, each a small distinct landmark with a wooden/parchment sign bearing its Portuguese name (small spelling mistakes in the text are acceptable): 1) "Torre Amaldiçoada" — a crooked tower with glowing purple windows, marked with a distinct glowing runic aura (this one is special). 2) "Minas Abandonadas" — a mineshaft entrance with rusted rail tracks. 3) "Floresta Amaldiçoada" — twisted trees with faint glowing eyes in the darkness. 4) the path visibly FORKS here into two side-by-side markers before rejoining: "Covil dos Dragões" — a volcanic cave mouth ringed with scales, AND "Necrópole Esquecida" — a rusted graveyard gate. 5) "Ruínas Élficas" — vine-covered elven stone columns. 6) "Arena de Sangue" — a circular stone arena with hanging chains, marked with a distinct glowing red runic aura (this one is special).

Scatter 2 extra fog-shrouded silhouette markers with no legible name near the edges of the image — reserved space for future content. This is a complete, self-contained background illustration — no magenta background, not meant to be cut out or keyed. No UI elements, no frame, no extra text beyond the small location name signs described above. Vertical canvas, 1024×2560 px.
```

### Região 3 — Thurgard (nível 21-30)
**Tamanho:** 1024×2560 px · **Uso:** terceiro trecho do Mapa de Masmorras

```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and Kingdom scene (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A tall vertical dungeon-selection map segment — this is the THIRD of 7 stacked regions forming one long exploration path, so the path enters from the bottom edge of the canvas and exits off the top edge, continuing both directions. A winding snow-dusted path connects distinct location markers from bottom to top, through cold windswept mountain slopes, visible drifting wind and snow, abandoned orc war-camps in the snow, overcast grey-blue sky.

Location markers along the path, bottom to top, each a small distinct landmark with a wooden/parchment sign bearing its Portuguese name (small spelling mistakes in the text are acceptable): 1) "Fortaleza Orc" — a wooden palisade decorated with skulls. 2) "Labirinto de Gelo" — walls of translucent blue ice. 3) the path visibly FORKS here into two side-by-side markers before rejoining: "Templo Afundado" — a temple half-submerged in a frozen lake, AND "Cavernas de Cristal" — a cave glittering with blue crystals. 4) "Covil do Lobo Alfa" — a den between rocks with huge paw prints in the snow. 5) "Catacumbas Reais" — stone stairs descending under a royal tomb. 6) "Poço sem Fundo" — a stone well with a chain swinging into darkness, marked with a distinct glowing runic aura (this one is special).

Scatter 2 extra fog-shrouded silhouette markers with no legible name near the edges of the image — reserved space for future content. This is a complete, self-contained background illustration — no magenta background, not meant to be cut out or keyed. No UI elements, no frame, no extra text beyond the small location name signs described above. Vertical canvas, 1024×2560 px.
```

### Região 4 — Xilvana (nível 31-40)
**Tamanho:** 1024×2560 px · **Uso:** quarto trecho do Mapa de Masmorras

```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and Kingdom scene (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A tall vertical dungeon-selection map segment — this is the FOURTH of 7 stacked regions forming one long exploration path, so the path enters from the bottom edge of the canvas and exits off the top edge, continuing both directions. A winding path connects distinct location markers from bottom to top, through a dense humid jungle reclaiming ancient ruins, giant roots swallowing stone, warm green-tinted light filtering through the canopy, thick haze.

Location markers along the path, bottom to top, each a small distinct landmark with a wooden/parchment sign bearing its Portuguese name (small spelling mistakes in the text are acceptable): 1) "Covil da Aranha-Rainha" — a giant web draped over a grotto. 2) "Cidadela em Ruínas" — a crumbling vine-covered wall. 3) the path visibly FORKS here into two side-by-side markers before rejoining: "Santuário Profanado" — a broken altar with defaced symbols, AND "Mina de Obsidiana" — glossy black volcanic rock. 4) "Selva Esquecida" — a stone statue engulfed by roots. 5) "Fortaleza dos Ossos" — a wall built from stacked giant bones. 6) "Torre dos Ecos" — a slender tower with light echoing off its runes, marked with a distinct glowing runic aura (this one is special).

Scatter 2 extra fog-shrouded silhouette markers with no legible name near the edges of the image — reserved space for future content. This is a complete, self-contained background illustration — no magenta background, not meant to be cut out or keyed. No UI elements, no frame, no extra text beyond the small location name signs described above. Vertical canvas, 1024×2560 px.
```

### Região 5 — Ignares (nível 41-50)
**Tamanho:** 1024×2560 px · **Uso:** quinto trecho do Mapa de Masmorras

```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and Kingdom scene (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A tall vertical dungeon-selection map segment — this is the FIFTH of 7 stacked regions forming one long exploration path, so the path enters from the bottom edge of the canvas and exits off the top edge, continuing both directions. A winding path connects distinct location markers from bottom to top, through an arid volcanic landscape meeting a drowned coastline, dramatic red-and-teal sky, distant lava rivers, dark water reclaiming ruins.

Location markers along the path, bottom to top, each a small distinct landmark with a wooden/parchment sign bearing its Portuguese name (small spelling mistakes in the text are acceptable): 1) "Abismo de Gelo" — a deep glacial crevasse with cold mist rising from it. 2) "Ruínas Vulcânicas" — stone pillars cracked by lava. 3) the path visibly FORKS here into two side-by-side markers before rejoining: "Covil do Dragão Ancião" — a cave with giant claw marks gouged into the rock, AND "Salão dos Titãs" — a colossal stone portal. 4) "Necrópole Real" — a golden mausoleum half-buried in ash. 5) "Palácio Submerso" — a stone dome sinking into dark water. 6) "Arena do Campeão" — a raised arena with torn banners, marked with a distinct glowing runic aura (this one is special).

Scatter 2 extra fog-shrouded silhouette markers with no legible name near the edges of the image — reserved space for future content. This is a complete, self-contained background illustration — no magenta background, not meant to be cut out or keyed. No UI elements, no frame, no extra text beyond the small location name signs described above. Vertical canvas, 1024×2560 px.
```

### Região 6 — Nyxheim (nível 51-58)
**Tamanho:** 1024×2560 px · **Uso:** sexto trecho do Mapa de Masmorras

```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and Kingdom scene (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A tall vertical dungeon-selection map segment — this is the SIXTH of 7 stacked regions forming one long exploration path, so the path enters from the bottom edge of the canvas and exits off the top edge, continuing both directions. A winding path connects distinct location markers from bottom to top, across a fractured highland plateau touched by the void, a constant storm brewing in the background, jagged cracks of purple-black energy splitting the stone ground — the last stretch before the top of the world.

Location markers along the path, bottom to top, each a small distinct landmark with a wooden/parchment sign bearing its Portuguese name (small spelling mistakes in the text are acceptable): 1) "Fortaleza do Caos" — a black fortress with twisted spikes. 2) "Torre do Vazio" — a slender tower dissolving into dark smoke at its peak. 3) the path visibly FORKS here into two side-by-side markers before rejoining: "Domínio Sombrio" — a pulsing gate of shadow, AND "Colosso de Pedra" — a fallen colossal statue, half-buried. 4) "Trono Esquecido" — a cracked stone throne in an empty courtyard.

Scatter 2 extra fog-shrouded silhouette markers with no legible name near the edges of the image — reserved space for future content. This is a complete, self-contained background illustration — no magenta background, not meant to be cut out or keyed. No UI elements, no frame, no extra text beyond the small location name signs described above. Vertical canvas, 1024×2560 px.
```

### Região 7 — Aetherion (nível 60)
**Tamanho:** 1024×2560 px · **Uso:** sétimo e último trecho (mais alto) do Mapa de Masmorras

```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and Kingdom scene (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A tall vertical dungeon-selection map segment — this is the SEVENTH and FINAL of 7 stacked regions forming one long exploration path, so the path enters from the bottom edge of the canvas but does NOT exit the top (this is the end of the map). The top of the world: a shattered citadel floating above the clouds, a rupturing sky with suspended rock fragments, dramatic apocalyptic lighting.

Location markers along the path, bottom to top, arranged in four ascending tiers of increasing magical intensity: TIER 1 (bronze glow) — four small structures side by side at the same height: "Abismo Final", "Necrópole dos Reis Caídos", "Covil do Titã Adormecido", "Portal do Vazio" (plain ruined structures with a warm bronze magical glow). TIER 2, directly above tier 1 (silver glow) — the SAME four structures reopened, visually similar but with a brighter silver-white magical glow and small silver runic markings added. TIER 3, directly above tier 2 (gold glow) — the same four structures again, now with an intense golden magical glow and glowing gold runic markings. TIER 4, at the very top (violet-black glow) — a single massive cracked monumental gate pulsing with dark violet-black energy, labeled "Trono do Fim dos Tempos"; beside it, separated by a visible bottomless drop into the clouds below, a circular black hole with a spiral staircase vanishing into darkness, labeled "Abismo Sem Fim" — this is the true end of the map, nothing continues past it.

This is a complete, self-contained background illustration — no magenta background, not meant to be cut out or keyed. No UI elements, no frame, no extra text beyond the small location name labels described above. Vertical canvas, 1024×2560 px.
```

---

## Fundos de Batalha

12 imagens — uma para cada masmorra já existente no jogo, substituindo o fundo genérico desenhado por código na tela de combate. Cada prompt já está completo e pronto pra colar. Todas usam **1536×672 px**, a mesma proporção da tela de combate real (640×280) — o personagem fica parado perto de 27% da largura e o inimigo perto de 73%, os dois sobre uma faixa de chão perto da base da imagem, então a composição deixa esse trecho central-baixo livre de objetos grandes.

### Ruínas Superficiais
```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and other scenes (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A combat arena background for a turn-based RPG: the interior of a sunlit ancient stone ruin near the surface, cracked moss-covered walls, a few warm beams of daylight breaking through gaps above, scattered rubble along the edges only (not the center). A packed dirt-and-stone floor strip runs along the bottom ~15% of the image, spanning the full width, slightly darker than the back wall so a character standing on it reads clearly.

Composition: keep the center-bottom area (roughly from 15% to 85% of the width, near the floor line) clear of large objects — this is where two combat sprites will stand, one near the left third and one near the right third. Ambient warm light glow near both the left and right thirds of the upper-middle area.

This is a complete, self-contained background illustration — no magenta background, not meant to be cut out or keyed. No characters, no UI elements, no frame, no text. Wide canvas, 1536×672 px.
```

### Caverna dos Goblins
```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and other scenes (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A combat arena background for a turn-based RPG: the interior of a rocky goblin-infested cave, crude tribal totems and bone decorations mounted on the rock walls along the edges, warm flickering torchlight glow near both the left and right thirds of the upper-middle area. A packed dirt cave floor strip runs along the bottom ~15% of the image, spanning the full width, slightly darker than the back wall so a character standing on it reads clearly.

Composition: keep the center-bottom area (roughly from 15% to 85% of the width, near the floor line) clear of large objects — this is where two combat sprites will stand, one near the left third and one near the right third.

This is a complete, self-contained background illustration — no magenta background, not meant to be cut out or keyed. No characters, no UI elements, no frame, no text. Wide canvas, 1536×672 px.
```

### Cripta do Tesouro
```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and other scenes (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A combat arena background for a turn-based RPG: the interior of an ornate golden-lit crypt, carved stone walls with gilded engravings, small piles of glinting treasure and coins tucked into alcoves along the edges, warm golden magical glow near both the left and right thirds of the upper-middle area. A polished stone floor strip runs along the bottom ~15% of the image, spanning the full width, slightly darker than the back wall so a character standing on it reads clearly.

Composition: keep the center-bottom area (roughly from 15% to 85% of the width, near the floor line) clear of large objects — this is where two combat sprites will stand, one near the left third and one near the right third.

This is a complete, self-contained background illustration — no magenta background, not meant to be cut out or keyed. No characters, no UI elements, no frame, no text. Wide canvas, 1536×672 px.
```

### Pântano Podre
```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and other scenes (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A combat arena background for a turn-based RPG: a murky swamp clearing, dead leafless trees with hanging moss framing the left and right edges, thick greenish mist drifting low, sickly green-grey ambient light. A muddy waterlogged ground strip runs along the bottom ~15% of the image, spanning the full width, slightly darker than the back wall so a character standing on it reads clearly.

Composition: keep the center-bottom area (roughly from 15% to 85% of the width, near the floor line) clear of large objects — this is where two combat sprites will stand, one near the left third and one near the right third.

This is a complete, self-contained background illustration — no magenta background, not meant to be cut out or keyed. No characters, no UI elements, no frame, no text. Wide canvas, 1536×672 px.
```

### Covil de Aranhas
```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and other scenes (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A combat arena background for a turn-based RPG: a rocky cave interior thick with spider silk, dense webbing draped from the ceiling and along the left and right cave walls, dim cold greenish-white ambient light filtering through the webs. A rough rocky cave floor strip runs along the bottom ~15% of the image, spanning the full width, slightly darker than the back wall so a character standing on it reads clearly.

Composition: keep the center-bottom area (roughly from 15% to 85% of the width, near the floor line) clear of large objects (and clear of thick webbing) — this is where two combat sprites will stand, one near the left third and one near the right third.

This is a complete, self-contained background illustration — no magenta background, not meant to be cut out or keyed. No characters, no UI elements, no frame, no text. Wide canvas, 1536×672 px.
```

### Torre Amaldiçoada
```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and other scenes (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A combat arena background for a turn-based RPG: the interior of a cursed tower chamber, dark stone walls etched with glowing purple runes, a tall arched window near the back center glowing with violet moonlight, floating dust motes catching the light. A dark stone floor strip runs along the bottom ~15% of the image, spanning the full width, slightly lighter than the walls so a character standing on it reads clearly.

Composition: keep the center-bottom area (roughly from 15% to 85% of the width, near the floor line) clear of large objects — this is where two combat sprites will stand, one near the left third and one near the right third.

This is a complete, self-contained background illustration — no magenta background, not meant to be cut out or keyed. No characters, no UI elements, no frame, no text. Wide canvas, 1536×672 px.
```

### Minas Abandonadas
```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and other scenes (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A combat arena background for a turn-based RPG: an abandoned mineshaft tunnel, wooden support beams framing the left and right edges, warm lantern glow near both upper thirds, pickaxes and mining equipment leaning against the walls at the edges only. Rusted rail tracks run along a dirt floor strip along the bottom ~15% of the image, spanning the full width.

Composition: keep the center-bottom area (roughly from 15% to 85% of the width, near the floor line) clear of large objects (rails may pass through but nothing tall) — this is where two combat sprites will stand, one near the left third and one near the right third.

This is a complete, self-contained background illustration — no magenta background, not meant to be cut out or keyed. No characters, no UI elements, no frame, no text. Wide canvas, 1536×672 px.
```

### Floresta Amaldiçoada
```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and other scenes (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A combat arena background for a turn-based RPG: a dark cursed forest clearing at night, gnarled twisted tree trunks framing the left and right edges, faint pale moonlight from above, a few small glowing eyes barely visible in the shadows between distant trees. A dark forest-floor strip of dirt and dead leaves runs along the bottom ~15% of the image, spanning the full width, slightly lighter than the surrounding darkness so a character standing on it reads clearly.

Composition: keep the center-bottom area (roughly from 15% to 85% of the width, near the floor line) clear of large objects — this is where two combat sprites will stand, one near the left third and one near the right third.

This is a complete, self-contained background illustration — no magenta background, not meant to be cut out or keyed. No characters, no UI elements, no frame, no text. Wide canvas, 1536×672 px.
```

### Covil dos Dragões
```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and other scenes (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A combat arena background for a turn-based RPG: a volcanic cave interior, dark scorched rock walls with glowing orange lava veins running through the stone along the left and right edges, warm orange ambient glow, scattered bones on the ground near the edges only. A scorched rocky floor strip runs along the bottom ~15% of the image, spanning the full width, with a faint warm glow reflecting off it.

Composition: keep the center-bottom area (roughly from 15% to 85% of the width, near the floor line) clear of large objects (no lava pools in the center) — this is where two combat sprites will stand, one near the left third and one near the right third.

This is a complete, self-contained background illustration — no magenta background, not meant to be cut out or keyed. No characters, no UI elements, no frame, no text. Wide canvas, 1536×672 px.
```

### Necrópole Esquecida
```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and other scenes (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A combat arena background for a turn-based RPG: an old graveyard within crumbling crypt walls, weathered tombstones and a rusted iron fence along the left and right edges, cold pale blue moonlight, thin ground fog drifting low. A stone-and-dirt floor strip runs along the bottom ~15% of the image, spanning the full width, slightly lighter than the surrounding dark so a character standing on it reads clearly.

Composition: keep the center-bottom area (roughly from 15% to 85% of the width, near the floor line) clear of large objects (no tombstones in the center) — this is where two combat sprites will stand, one near the left third and one near the right third.

This is a complete, self-contained background illustration — no magenta background, not meant to be cut out or keyed. No characters, no UI elements, no frame, no text. Wide canvas, 1536×672 px.
```

### Ruínas Élficas
```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and other scenes (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A combat arena background for a turn-based RPG: the interior of a reclaimed elven ruin, tall carved stone columns wrapped in vines and small pale flowers along the left and right edges, soft blue-green magical glow drifting like fireflies in the upper-middle area. A mossy stone floor strip runs along the bottom ~15% of the image, spanning the full width, slightly lighter than the back wall so a character standing on it reads clearly.

Composition: keep the center-bottom area (roughly from 15% to 85% of the width, near the floor line) clear of large objects — this is where two combat sprites will stand, one near the left third and one near the right third.

This is a complete, self-contained background illustration — no magenta background, not meant to be cut out or keyed. No characters, no UI elements, no frame, no text. Wide canvas, 1536×672 px.
```

### Arena de Sangue
```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and other scenes (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A combat arena background for a turn-based RPG: a stone gladiator arena pit, tiered stone seating and rusted hanging chains framing the left and right edges, dramatic warm torchlight glow, a couple of torn banners hanging from the upper corners. A blood-stained sand-and-stone floor strip runs along the bottom ~15% of the image, spanning the full width, slightly darker reddish tone so a character standing on it reads clearly.

Composition: keep the center-bottom area (roughly from 15% to 85% of the width, near the floor line) clear of large objects — this is where two combat sprites will stand, one near the left third and one near the right third.

This is a complete, self-contained background illustration — no magenta background, not meant to be cut out or keyed. No characters, no UI elements, no frame, no text. Wide canvas, 1536×672 px.
```
