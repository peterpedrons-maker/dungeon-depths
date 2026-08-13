# Kit de Arte do Reino

Prompts prontos para gerar as peças de interface e os sprites de personagens/inimigos de **Reino & Masmorras**. Copie o conteúdo de qualquer bloco abaixo (o botão de copiar aparece ao passar o mouse sobre o bloco, no GitHub) e cole direto no seu gerador de imagens.

## Antes de usar

- **Fundo magenta:** todo prompt de recorte já pede fundo sólido `#FF00FF` — assim dá pra remover o fundo depois, já que a maioria das IAs de imagem não exporta com transparência real.
- **Nas folhas de sprite, cuidado especial:** como os personagens/inimigos ficam bem próximos da cor de fundo, todo prompt de sprite pede explicitamente para **não** usar magenta/rosa/fúcsia em nada do personagem (pele, roupa, armadura, arma, brilho de magia) — só o fundo deve ser magenta. Isso evita que o recorte "coma" pedaços do próprio personagem.
- **Sobre os slots:** a moldura de equipamento (quadrada) e a de habilidade (circular) pedem exatamente o mesmo material/estilo, só muda o formato — gere as duas na mesma sessão/conversa com a IA se possível, para saírem parecidas. O centro magenta é onde o ícone do jogo aparece por baixo da moldura.
- **Pixel art, mas nítida:** os personagens e inimigos do jogo são pixel art (desenhados no código), mas a técnica original saía borrada. Por isso os prompts de sprite abaixo pedem pixel art de verdade — pixels nítidos, sem anti-aliasing/borrão, contorno escuro definido e paleta de cores limitada, no estilo de RPGs pixel art modernos (Octopath Traveler, Stardew Valley, Eastward) — em resolução alta o bastante para ficar nítido mesmo ampliado no jogo.
- **Inimigos sempre virados para a esquerda:** no jogo o personagem do jogador fica à esquerda da tela e o inimigo à direita, olhando um para o outro — os prompts de inimigos exigem que toda criatura seja desenhada de perfil (ou 3/4) virada para a esquerda, nunca de frente ou para a direita.
- **Sobre a moldura principal:** os *cantos* têm entalhes ornamentados únicos, mas as *bordas retas* entre os cantos são um padrão de madeira uniforme e repetitivo — de propósito, para permitir esticar a moldura em caixas de tamanhos diferentes sem distorcer os desenhos ornamentados.

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
