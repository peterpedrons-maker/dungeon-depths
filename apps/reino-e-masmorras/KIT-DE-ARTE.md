# Kit de Arte do Reino

Prompts prontos para gerar as peças de interface e os sprites de personagens/inimigos de **Reino & Masmorras**. Copie o conteúdo de qualquer bloco abaixo (o botão de copiar aparece ao passar o mouse sobre o bloco, no GitHub) e cole direto no seu gerador de imagens.

## Configuração da Conta (Supabase)

Passo único de configuração pra ativar contas/login/save na nuvem/ranking global — nada a ver com arte, mas fica aqui pra ficar fácil de achar. Rode isso uma vez no painel do Supabase do projeto (**Dashboard → SQL Editor → New query**, cole e clique em **Run**). O mesmo conteúdo também vive em `apps/reino-e-masmorras/supabase/schema.sql`, versionado no repo.

```sql
-- Reino & Masmorras — schema for account/cloud-save/global-ranking.
-- Run this once in the Supabase project's SQL Editor (Dashboard → SQL Editor
-- → New query → paste → Run). Safe to re-run (every statement is idempotent).

-- One row per account, holding the full character save as JSON — mirrors
-- exactly what used to live under the browser's localStorage key
-- rm_character_v1, just keyed by the authenticated user instead of the
-- browser. auth.users is Supabase's own built-in table; we never touch it
-- directly, only reference its id.
create table if not exists public.characters (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.characters enable row level security;

drop policy if exists "characters_select_own" on public.characters;
create policy "characters_select_own" on public.characters
  for select using (auth.uid() = user_id);

drop policy if exists "characters_insert_own" on public.characters;
create policy "characters_insert_own" on public.characters
  for insert with check (auth.uid() = user_id);

drop policy if exists "characters_update_own" on public.characters;
create policy "characters_update_own" on public.characters
  for update using (auth.uid() = user_id);

drop policy if exists "characters_delete_own" on public.characters;
create policy "characters_delete_own" on public.characters
  for delete using (auth.uid() = user_id);

-- One row per completed/retreated run, across every account — the global
-- leaderboard the Ranking screen reads from. Anyone can read it (it's a
-- public leaderboard); only the run's own owner can insert their own row.
create table if not exists public.ranking (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  class_id text not null,
  depth integer not null,
  level integer not null,
  created_at timestamptz not null default now()
);

alter table public.ranking enable row level security;

drop policy if exists "ranking_select_all" on public.ranking;
create policy "ranking_select_all" on public.ranking
  for select using (true);

drop policy if exists "ranking_insert_own" on public.ranking;
create policy "ranking_insert_own" on public.ranking
  for insert with check (auth.uid() = user_id);
```

Depois de rodar: se quiser testar login sem precisar confirmar e-mail toda vez, vá em **Authentication → Settings** e desative "Confirm email" (opcional, só facilita testes).

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
Hand-painted medieval fantasy game UI asset, rich digital painting style, in the style of a clean, minimal Diablo-esque equipment/inventory slot frame. A square frame in bronze/gold metal with a THIN, simple uniform border — only about 5-7% of the canvas width on each side, much thinner than an ornate picture-frame. Flat bevel, soft warm gold gradient, no engraved knotwork or filigree pattern running along the rim — keep the border clean and understated. A single small diamond-shaped rivet accent sits at each of the four corners only, slightly overlapping the border, and that's the only ornamentation.

The entire flat center of the frame (where an item icon will be placed by the game) is a solid magenta color (#FF00FF) — no texture, no gradient, no shadow inside that area, just a clean hollow square hole. Square canvas, 256×256 px, viewed perfectly flat-on, thin frame border only (see the 5-7% note above — this is the main thing distinguishing it from the old, much thicker frame this replaces). No text, no watermark, no drop shadow floating outside the frame.
```

### Ícones de Slot Vazio — Paperdoll de Equipamentos (slot sem item)
**Tamanho:** 1536×1024 px · **Uso:** 6 ícones (recortar em grade 3×2) pros 6 slots do paperdoll (Arma, Corpo, Pernas, Mãos, Mão Secundária, Acessório) quando estão vazios — substitui o glifo de linha simples usado hoje, que destoa da arte pintada dos itens reais.

```
Hand-painted medieval fantasy game UI asset, rich digital painting style — same painted style as the game's other item icons (weapons, armor), NOT flat vector, NOT pixel art. Each icon is a faint, pale gray-blue engraved silhouette of an empty equipment slot — like a dim chalk outline or a ghostly afterimage of the item shape, NOT a fully rendered colorful item. Soft and subtle, low contrast, meant to read as "nothing equipped here" rather than as a real piece of loot — no rich color, no material detail, no shading variation, just a single muted silhouette tone per icon with a faint soft inner glow along the outline.

One single wide image containing SIX separate icons arranged in an even 3-column × 2-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 70% of that cell, same faint pale silhouette style and rendering weight across all six.

Row 1: 1) a simple straight sword silhouette, point down. 2) a simple sleeveless tunic/vest silhouette, front view. 3) a simple pair of trousers silhouette, front view.

Row 2: 4) a simple pair of gloves silhouette, front view, oriented cuff-up with the fingers pointing straight down. 5) a simple round shield silhouette, front view. 6) a simple ring silhouette, viewed at a three-quarter angle like a jewelry icon.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Wide canvas, 1536×1024 px. No text, no labels, no numbers, no watermark, no border or frame around any icon (the game already has its own equipment-slot frame it composites on top).
```

### Slot de Habilidade — Nós da árvore e barra de habilidades equipadas
**Tamanho:** 256×256 px · **Uso:** moldura circular de cada nó/ícone na tela de Habilidades

```
Hand-painted medieval fantasy game UI asset, rich digital painting style, in the style of a clean, minimal talent tree node frame. The exact same thin bronze/gold metal border, flat bevel and small corner-only diamond rivet accents as the equipment slot frame from the same UI kit (a thin ~5-7%-of-canvas-width border, NOT an ornate filigree-covered rim) — but this one is a perfect CIRCLE instead of a square, like a round medallion or coin border, with the rivet accents spaced evenly around the ring instead of just at corners. Warm bronze-to-gold gradient with a soft specular highlight along the top of the ring.

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

### Ícones de Habilidades — Ativas por Classe + Biblioteca de Passivas

Reformulado a pedido do usuário: antes, essas duas folhas ("Grade I/II") cobriam só **temas** de efeito (fogo, veneno, crítico, cura...), e cada nó da árvore — ativo ou passivo — era associado ao tema mais parecido, então habilidades bem diferentes entre si (de classes diferentes, ou até dentro da mesma classe) podiam acabar reaproveitando exatamente o mesmo ícone. Agora a divisão é outra:

- **Habilidades ativas (nó tipo `active`, 5 por trilha × 3 trilhas = 15 por classe):** cada uma tem seu **próprio ícone único**, desenhado pro nome e efeito específico dela — nenhuma reutilização entre habilidades ativas, nem dentro da mesma classe nem entre classes. São 14 folhas abaixo, uma por classe, cada uma com as 15 habilidades ativas daquela classe (as 3 trilhas empilhadas, uma por linha da grade).
- **Nós de atributo secundário e passivas genéricas (nó tipo `attribute`/`passive`, 10 por trilha × 3 trilhas = 30 por classe):** esses são pequenos bônus percentuais que se repetem MUITO entre classes (ex: "+1% crítico" aparece em praticamente toda trilha do jogo) — pra esses, uma **única folha compartilhada** de 18 ícones (por conceito de efeito, não por nó) cobre o jogo inteiro. Um nó de "+3% dano crítico" no Guerreiro usa o mesmo ícone que um nó idêntico no Mago.

Isso leva o total de **630 nós** (14 classes × 3 trilhas × 15 nós) pra **228 ícones reais** (210 ativos únicos + 18 passivos compartilhados) — ainda um esforço grande, mas cada habilidade ativa (o que o jogador realmente vê brilhando na barra de combate) ganha identidade visual própria.

**Convenção comum a todas as 15 folhas abaixo:** mesmo estilo pintado das outras folhas de ícone deste kit (moeda, poção, coração, runa — pintura digital rica, NÃO vetor liso, NÃO pixel art), fundo e vãos em magenta sólido (#FF00FF), sem texto/número/rótulo em nenhum ícone, luz vindo de cima-esquerda em todos.

#### Biblioteca de Passivas — reutilizável entre todas as classes
**Tamanho:** 1536×768 px · **Uso:** 18 ícones (recortar em grade 6×3) pros nós de atributo secundário e passivas genéricas de TODAS as trilhas do jogo — substitui as folhas "Grade I" e "Grade II" antigas

```
Hand-painted medieval fantasy game UI asset, rich digital painting style, icon set for a talent/ability tree — same painted style as the game's other UI icons (gold coin, health potion, ruby heart), NOT flat vector, NOT pixel art. Each icon is a single small object or symbol, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single wide image containing EIGHTEEN separate icons arranged in an even 6-column × 3-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all eighteen.

Row 1 (offense stats): 1) "chance de crítico" — a red-and-gold circular target reticle with a small crosshair. 2) "dano crítico" — a bright golden critical-hit starburst. 3) "precisão" — a single sharp arrow piercing dead-center of a small wooden target ring. 4) "dano físico bônus" — two small crossed silver swords. 5) "dano mágico bônus" — a small floating violet-blue arcane spark/ember. 6) "dano contra queimado" — a small orange fireball with a sharp "+" impact-burst overlapping it.

Row 2 (defense/mitigation stats): 7) "defesa" — a round wooden-and-iron shield, plain and sturdy. 8) "defesa mágica" — a translucent blue hexagonal ward/barrier facet. 9) "chance de bloqueio" — a round shield catching a small spark of impact on its face. 10) "evasão" — a swirling spiral of pale wind suggesting a quick dodge. 11) "reflete dano (espinhos)" — a round shield ringed with small sharp iron spikes, a deflected spark bouncing off. 12) "dano contra envenenado" — a small pale skull dripping green venom with a sharp "+" impact-burst overlapping it.

Row 3 (sustain/utility stats): 13) "vida máxima" — a small glowing red heart with a faint outward-pulsing rim. 14) "roubo de vida" — a crimson blood-drop being drawn upward in a faint red siphon-swirl. 15) "cura ao acertar crítico" — a small heart overlapping a golden crit-starburst. 16) "mais dano com vida baixa" — a clenched fist wreathed in a wild red rage-aura, veins glowing. 17) "recarga de habilidade reduzida" — a small hourglass with a faint lightning-swirl around it, sand flowing unusually fast. 18) "genérico / atributo primário" — a single faceted gold gemstone/rhombus, catching a bright specular highlight.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Wide canvas, 1536×768 px. No text, no labels, no numbers, no watermark, no border, no frame around any icon (the game already has its own frame it composites on top).
```

#### Habilidades Ativas — Guerreiro
**Tamanho:** 1280×768 px · **Uso:** 15 ícones (grade 5×3) — as 15 habilidades ativas do Guerreiro, uma linha por trilha

```
Hand-painted medieval fantasy game UI asset, rich digital painting style, icon set for a talent/ability tree — same painted style as the game's other UI icons (gold coin, health potion, ruby heart), NOT flat vector, NOT pixel art. Each icon is a single small weapon, effect, or symbol illustrating one specific combat ability, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single image containing FIFTEEN separate icons arranged in an even 5-column × 3-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all fifteen.

Row 1 ("Furioso" path, rage-red theme): 1) "Golpe Brutal" — a heavy gauntleted fist slamming down with a cracked-impact burst, red motion streaks. 2) "Golpe Atordoante" — a mace strike leaving a ring of small white stun-stars circling above the impact point. 3) "Fúria Cega" — a raging eye squinting through a blindfold, a golden crit-starburst bursting through it. 4) "Lâmina Sanguinária" — a crimson-stained greatsword slash arc with a dripping blood-red motion trail. 5) "Fúria Imparável" — a berserker's clenched fist wreathed in a wild red battle-aura, glowing veins.

Row 2 ("Guardião" path, steel-grey theme): 6) "Postura Defensiva" — a round shield planted into the ground, glowing blue-white defensive aura ring. 7) "Muralha Viva" — a row of overlapping shields forming a small fortress silhouette. 8) "Instinto Blindado" — a shield wrapped in a shimmering protective dome, deflecting small dark arrows. 9) "Bastião Inabalável" — a massive tower-shield with reinforced golden rivets and a bright aura. 10) "Fortaleza Viva" — a fortress-shaped shield radiating a powerful golden nimbus.

Row 3 ("Duelista" path, gold-precision theme): 11) "Fúria do Duelo" — a rapier tip glinting with a golden crit-starburst. 12) "Estocada Rápida" — a quick rapier thrust leaving a sharp straight motion-streak. 13) "Golpe de Misericórdia" — a dagger poised for a downward finishing strike over a cracked skull. 14) "Fúria Absoluta" — twin rapiers crossed in an X with a blazing gold crit-starburst behind them. 15) "Execução Perfeita" — a rapier piercing straight through a shattering skull silhouette.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Canvas 1280×768 px. No text, no labels, no numbers, no watermark, no border, no frame around any icon (the game already has its own frame it composites on top).
```

#### Habilidades Ativas — Mago
**Tamanho:** 1280×768 px · **Uso:** 15 ícones (grade 5×3) — as 15 habilidades ativas do Mago, uma linha por trilha (nota: as 3 trilhas do Mago já são elementalmente distintas — fogo/gelo/raio — então cada linha abaixo pode virar uma imagem separada também, se preferir gerar uma de cada vez)

```
Hand-painted medieval fantasy game UI asset, rich digital painting style, icon set for a talent/ability tree — same painted style as the game's other UI icons (gold coin, health potion, ruby heart), NOT flat vector, NOT pixel art. Each icon is a single small magical effect or symbol illustrating one specific combat ability, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single image containing FIFTEEN separate icons arranged in an even 5-column × 3-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all fifteen.

Row 1 ("Piromante" path, fire theme): 1) "Queimadura" — a wand tip igniting a small enemy silhouette into orange flame. 2) "Névoa Onírica" — a swirling lavender dream-mist with small drooping "Zzz" wisps and an impact spark. 3) "Chuva de Fogo" — a shower of small falling fireball streaks raining down. 4) "Detonação" — a burning enemy silhouette exploding outward in a fiery burst. 5) "Cataclismo Ardente" — a massive fire mushroom-cloud eruption filling the frame.

Row 2 ("Gélido" path, ice theme): 6) "Barreira de Gelo" — a crystalline ice-shield dome forming around a small figure. 7) "Névoa Congelante" — a swirling frost-mist cloud with faint ice-shard glints. 8) "Casca Endurecida" — a body silhouette encased in a glowing translucent ice-armor shell. 9) "Fortaleza de Gelo" — a jagged ice fortress-wall bursting upward. 10) "Eternidade Glacial" — a towering glacier spire radiating a pale-blue aura.

Row 3 ("Eletromante" path, lightning theme): 11) "Sobrecarga" — a crackling ball of electricity with a golden crit-starburst at its core. 12) "Choque em Cadeia" — a lightning bolt striking a burning enemy silhouette, a branching chain-arc. 13) "Raio Perfurante" — a single narrow lightning bolt piercing straight through. 14) "Fúria Elétrica" — twin crossed lightning bolts crackling around a golden starburst. 15) "Tempestade Devastadora" — a swirling storm-vortex of lightning bolts converging on a burning point.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Canvas 1280×768 px. No text, no labels, no numbers, no watermark, no border, no frame around any icon (the game already has its own frame it composites on top).
```

#### Habilidades Ativas — Ladino
**Tamanho:** 1280×768 px · **Uso:** 15 ícones (grade 5×3) — as 15 habilidades ativas do Ladino, uma linha por trilha

```
Hand-painted medieval fantasy game UI asset, rich digital painting style, icon set for a talent/ability tree — same painted style as the game's other UI icons (gold coin, health potion, ruby heart), NOT flat vector, NOT pixel art. Each icon is a single small weapon, effect, or symbol illustrating one specific combat ability, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single image containing FIFTEEN separate icons arranged in an even 5-column × 3-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all fifteen.

Row 1 ("Veneno" path, toxic-green theme): 1) "Golpe Peçonhento" — a curved dagger dripping sickly green venom onto a small skull. 2) "Corte Tóxico" — a quick green-tinged dagger slash arc. 3) "Veneno Mortal" — a vial of toxic green liquid shattering over a skull. 4) "Golpe Fatal" — a dagger stabbing into a green-glowing poisoned wound mark. 5) "Execução Venenosa" — a dagger plunging through a skull wreathed in thick green venom mist.

Row 2 ("Sombras" path, shadow-grey theme): 6) "Passo nas Sombras" — a shadowy silhouette splitting into a wispy dark after-image mid-step. 7) "Golpe Cegante" — a dagger slash trailing a burst of dark sparkles across a small eye symbol. 8) "Salto para as Sombras" — a figure dissolving into a swirl of dark smoke, leaving only an outline. 9) "Véu das Sombras" — a cloak of swirling black shadow-wisps wrapping around a silhouette. 10) "Um com a Escuridão" — a fully shadow-merged silhouette, barely visible, faint violet glowing eyes.

Row 3 ("Lâminas Gêmeas" path, gold-precision theme): 11) "Investida Precisa" — twin curved daggers crossed with a golden crit-starburst behind them. 12) "Golpe Perfurante" — a dagger punching straight through a cracking armor plate. 13) "Golpe de Misericórdia" — twin daggers poised for a downward finishing strike over a cracked skull. 14) "Fúria das Lâminas" — a whirlwind blur of twin daggers spinning around a bright gold starburst. 15) "Execução Perfeita" — twin daggers piercing through a shattering skull silhouette.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Canvas 1280×768 px. No text, no labels, no numbers, no watermark, no border, no frame around any icon (the game already has its own frame it composites on top).
```

#### Habilidades Ativas — Clérigo
**Tamanho:** 1280×768 px · **Uso:** 15 ícones (grade 5×3) — as 15 habilidades ativas do Clérigo, uma linha por trilha

```
Hand-painted medieval fantasy game UI asset, rich digital painting style, icon set for a talent/ability tree — same painted style as the game's other UI icons (gold coin, health potion, ruby heart), NOT flat vector, NOT pixel art. Each icon is a single small holy effect, weapon, or symbol illustrating one specific combat ability, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single image containing FIFTEEN separate icons arranged in an even 5-column × 3-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all fifteen.

Row 1 ("Devoção" path, holy-gold healing theme): 1) "Cura Divina" — a golden holy chalice overflowing with radiant light, small healing sparkles rising. 2) "Renovação" — a glowing golden cross with soft healing rays fanning outward. 3) "Escudo Sagrado" — a translucent golden holy-barrier dome. 4) "Milagre" — descending beams of golden holy light converging on a kneeling silhouette. 5) "Ressurreição Menor" — a bright golden phoenix-feather-like light burst rising upward.

Row 2 ("Retidão" path, holy-bronze defense theme): 6) "Escudo da Retidão" — a golden holy shield absorbing an impact with a bright flash. 7) "Golpe Sagrado" — a mace strike wreathed in golden holy light with a small impact burst. 8) "Voto de Proteção" — a golden shield emblazoned with a glowing cross-sigil. 9) "Martelo da Fé" — a warhammer strike wreathed in radiant golden light, a ground-crack impact. 10) "Muralha Divina" — a towering wall of golden holy light-pillars.

Row 3 ("Provação" path, holy-purple fire theme): 11) "Chama Purificadora" — a golden-white holy flame igniting a small enemy silhouette. 12) "Purificação Divina" — a burst of cleansing golden light dissolving small dark chain-link debuff icons. 13) "Sentença Final" — a golden holy hammer descending onto a cracked skull marked with a judgment sigil. 14) "Ira Consumidora" — golden holy fire engulfing a burning enemy silhouette in a bright flash. 15) "Apocalipse Sagrado" — a massive golden-white holy fire eruption with radiant judgment beams.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Canvas 1280×768 px. No text, no labels, no numbers, no watermark, no border, no frame around any icon (the game already has its own frame it composites on top).
```

#### Habilidades Ativas — Cavaleiro
**Tamanho:** 1280×768 px · **Uso:** 15 ícones (grade 5×3) — as 15 habilidades ativas do Cavaleiro, uma linha por trilha

```
Hand-painted medieval fantasy game UI asset, rich digital painting style, icon set for a talent/ability tree — same painted style as the game's other UI icons (gold coin, health potion, ruby heart), NOT flat vector, NOT pixel art. Each icon is a single small weapon, effect, or symbol illustrating one specific combat ability, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single image containing FIFTEEN separate icons arranged in an even 5-column × 3-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all fifteen.

Row 1 ("Bastião" path, steel-blue defense theme): 1) "Postura de Bastião" — a heater-shield planted into the ground, steel-blue aura ring. 2) "Guarda Total" — a steel-blue shield absorbing a heavy impact with sparks. 3) "Bastião Pessoal" — a shield wrapped in a shimmering warding-rune dome. 4) "Provocar" — a roaring warhorn with small red arrows converging on it. 5) "Bastião Absoluto" — a massive fortress-shaped steel shield radiating a powerful blue-white aura.

Row 2 ("Investida" path, charge-red theme): 6) "Investida Montada" — a lance striking forward, a sharp horizontal motion-streak. 7) "Golpe de Lança" — a lance-tip thrust with a small impact-burst. 8) "Fúria da Cavalaria" — a lance crossed with a golden crit-starburst, a small dust-cloud beneath. 9) "Carga Devastadora" — a charging lance leaving a long red motion-streak with a cracked-ground impact. 10) "Última Carga" — a lance strike wreathed in a desperate red battle-aura.

Row 3 ("Comando" path, command-gold theme): 11) "Rugido de Comando" — a warhorn with golden sound-wave rings radiating outward. 12) "Escudo Inabalável" — a golden banner-emblem shield wrapped in a warding-rune glow. 13) "Cadência de Comando" — a golden hourglass spinning fast, a small lightning-swirl around it. 14) "Comando Defensivo" — a golden war-banner planted beside overlapping shields. 15) "Estandarte Inabalável" — a tall golden war-banner radiating a wide protective aura.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Canvas 1280×768 px. No text, no labels, no numbers, no watermark, no border, no frame around any icon (the game already has its own frame it composites on top).
```

#### Habilidades Ativas — Paladino
**Tamanho:** 1280×768 px · **Uso:** 15 ícones (grade 5×3) — as 15 habilidades ativas do Paladino, uma linha por trilha

```
Hand-painted medieval fantasy game UI asset, rich digital painting style, icon set for a talent/ability tree — same painted style as the game's other UI icons (gold coin, health potion, ruby heart), NOT flat vector, NOT pixel art. Each icon is a single small holy weapon, effect, or symbol illustrating one specific combat ability, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single image containing FIFTEEN separate icons arranged in an even 5-column × 3-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all fifteen.

Row 1 ("Voto Sagrado" path, holy-gold defense theme): 1) "Escudo do Voto" — a golden holy heater-shield with a small cross-sigil and a protective aura ring. 2) "Toque Restaurador" — a gauntleted hand glowing gold, small healing sparkles rising from it. 3) "Aegis Sagrado" — a golden aegis-shield emblazoned with radiant light rays. 4) "Muralha da Fé" — a towering wall of golden light-pillars marked with holy sigils. 5) "Milagre do Voto" — descending golden holy light beams converging on a kneeling knight silhouette.

Row 2 ("Martelo da Fé" path, holy-red hammer theme): 6) "Martelo Consagrado" — a warhammer strike wreathed in golden holy light with a small impact burst. 7) "Martelo Flamejante" — a warhammer wreathed in golden-orange holy fire, mid-swing. 8) "Silêncio Sagrado" — a warhammer strike with a small golden "mute" rune shattering above the impact. 9) "Martelo do Juízo" — a massive warhammer strike with a radiant golden judgment-burst. 10) "Sentença Divina" — a warhammer descending onto a cracked skull marked with a glowing judgment sigil.

Row 3 ("Luz Purificadora" path, holy-white heal theme): 11) "Toque de Luz" — an open palm glowing with soft golden-white healing light, small sparkles rising. 12) "Barreira de Luz" — a radiant golden-white light-barrier dome with a small impact spark. 13) "Renascimento" — a golden-white phoenix-like light burst rising from a kneeling silhouette. 14) "Explosão de Luz" — a bright golden-white radiant light explosion, healing sparkles scattering outward. 15) "Radiância" — a golden holy cross wreathed in a crit-starburst.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Canvas 1280×768 px. No text, no labels, no numbers, no watermark, no border, no frame around any icon (the game already has its own frame it composites on top).
```

#### Habilidades Ativas — Bárbaro
**Tamanho:** 1280×768 px · **Uso:** 15 ícones (grade 5×3) — as 15 habilidades ativas do Bárbaro, uma linha por trilha

```
Hand-painted medieval fantasy game UI asset, rich digital painting style, icon set for a talent/ability tree — same painted style as the game's other UI icons (gold coin, health potion, ruby heart), NOT flat vector, NOT pixel art. Each icon is a single small weapon, effect, or symbol illustrating one specific combat ability, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single image containing FIFTEEN separate icons arranged in an even 5-column × 3-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all fifteen.

Row 1 ("Fúria" path, rage-red theme): 1) "Golpe Selvagem" — a massive two-handed axe strike with a cracked-ground impact. 2) "Corte Sangrento" — an axe slash leaving a trail of dripping blood-red streaks. 3) "Grito de Guerra" — a roaring barbarian silhouette with a golden crit-starburst bursting from an open mouth. 4) "Massacre" — a wide brutal axe-cleave arc with a heavy impact-burst. 5) "Fúria Berserker" — a berserker's clenched fist wreathed in a raging red battle-aura, glowing veins.

Row 2 ("Resistência" path, rugged-brown defense theme): 6) "Postura Selvagem" — a crude iron shield planted into the ground, rugged brown-red aura. 7) "Couro Curtido" — a thick leather-and-hide shield with a small impact spark. 8) "Fúria Berserker" — a clenched fist wreathed in swirling red-and-black rage-aura, cracked ground beneath. 9) "Fome Sanguinária" — a red vampiric siphon-swirl being drawn into a clenched fist. 10) "Muralha Selvagem" — a jagged wall of crude wooden-and-iron shields lashed together.

Row 3 ("Selvageria" path, gold-crit theme): 11) "Fúria Explosiva" — a roaring barbarian face wreathed in a golden crit-starburst explosion. 12) "Investida Selvagem" — a charging barbarian silhouette leaving a rugged brown motion-streak. 13) "Golpe de Caça" — an axe poised for a downward finishing strike over a cracked skull. 14) "Fúria Total" — a double-bladed axe whirling around a bright gold crit-starburst. 15) "Aniquilação" — a massive axe strike shattering a skull silhouette entirely.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Canvas 1280×768 px. No text, no labels, no numbers, no watermark, no border, no frame around any icon (the game already has its own frame it composites on top).
```

#### Habilidades Ativas — Arqueiro
**Tamanho:** 1280×768 px · **Uso:** 15 ícones (grade 5×3) — as 15 habilidades ativas do Arqueiro, uma linha por trilha

```
Hand-painted medieval fantasy game UI asset, rich digital painting style, icon set for a talent/ability tree — same painted style as the game's other UI icons (gold coin, health potion, ruby heart), NOT flat vector, NOT pixel art. Each icon is a single small arrow, effect, or symbol illustrating one specific combat ability, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single image containing FIFTEEN separate icons arranged in an even 5-column × 3-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all fifteen.

Row 1 ("Precisão" path, gold-crit theme): 1) "Tiro Certeiro" — an arrow striking dead-center of a target with a golden crit-starburst. 2) "Flecha na Perna" — an arrow lodged in a leg silhouette with a small chain-link "slowed" mark. 3) "Tiro Fatal" — an arrow piercing a cracked skull silhouette. 4) "Disparo Perfeito" — two crossed arrows around a bright gold crit-starburst. 5) "Flecha da Morte" — a black-fletched arrow piercing straight through a shattering skull.

Row 2 ("Tiro Rápido" path, forest-green damage theme): 6) "Rajada de Flechas" — three arrows loosed in rapid succession, motion-streaked. 7) "Chuva de Flechas" — a shower of arrows raining down onto a small target zone. 8) "Tiro Instintivo" — a single arrow mid-flight with a golden crit-starburst trailing behind. 9) "Rajada Mortal" — a dense volley of arrows striking one point with a heavy impact-burst. 10) "Última Flecha" — a single glowing arrow drawn taut on a bow, a desperate red-tinged aura.

Row 3 ("Instinto de Caça" path, teal evasion theme): 11) "Esquiva do Caçador" — a swift teal wind-swirl trailing behind a leaping figure silhouette. 12) "Tiro de Retirada" — an arrow loosed backward while leaping away, motion-blurred. 13) "Corrida Silenciosa" — a silhouette dissolving into a fast teal wind-streak. 14) "Sombra da Mata" — a figure blending into leafy teal-green foliage silhouette. 15) "Um com a Trilha" — a nearly invisible figure outlined only by a faint teal wind-swirl.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Canvas 1280×768 px. No text, no labels, no numbers, no watermark, no border, no frame around any icon (the game already has its own frame it composites on top).
```

#### Habilidades Ativas — Caçador
**Tamanho:** 1280×768 px · **Uso:** 15 ícones (grade 5×3) — as 15 habilidades ativas do Caçador, uma linha por trilha

```
Hand-painted medieval fantasy game UI asset, rich digital painting style, icon set for a talent/ability tree — same painted style as the game's other UI icons (gold coin, health potion, ruby heart), NOT flat vector, NOT pixel art. Each icon is a single small trap, weapon, or symbol illustrating one specific combat ability, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single image containing FIFTEEN separate icons arranged in an even 5-column × 3-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all fifteen.

Row 1 ("Armadilhas Venenosas" path, toxic-green theme): 1) "Armadilha de Veneno" — a small iron bear-trap dripping sickly green venom. 2) "Tiro Envenenado" — a crossbow bolt tipped with dripping green venom. 3) "Armadilha Mortal" — a spiked iron trap glowing with thick green venom mist. 4) "Golpe de Misericórdia" — a hunting knife stabbing into a green-glowing poisoned wound. 5) "Execução da Presa" — a crossbow bolt piercing a skull wreathed in green venom mist.

Row 2 ("Rastreio" path, grey-green evasion theme): 6) "Sumir na Mata" — a hunter's silhouette blending into dense gray-green foliage. 7) "Armadilha de Ferro" — a spiked iron snare trap clamping onto a leg silhouette. 8) "Passo Etéreo" — a silhouette fading into a swirl of pale gray mist. 9) "Manto das Sombras" — a hooded cloak silhouette merging with shadow. 10) "Um com a Caça" — a nearly invisible tracker silhouette, only sharp eyes visible in shadow.

Row 3 ("Precisão da Caça" path, gold-crit theme): 11) "Disparo Preciso" — a crossbow bolt striking dead-center with a golden crit-starburst. 12) "Tiro Duplo" — two crossbow bolts loosed together, crossed motion-streaks. 13) "Abate" — a hunting knife poised over a cracked skull, a downward finishing strike. 14) "Disparo Mortal" — a crossbow bolt with a bright gold crit-starburst trailing behind. 15) "Caça Perfeita" — a crossbow bolt piercing straight through a shattering skull.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Canvas 1280×768 px. No text, no labels, no numbers, no watermark, no border, no frame around any icon (the game already has its own frame it composites on top).
```

#### Habilidades Ativas — Feiticeiro
**Tamanho:** 1280×768 px · **Uso:** 15 ícones (grade 5×3) — as 15 habilidades ativas do Feiticeiro, uma linha por trilha

```
Hand-painted medieval fantasy game UI asset, rich digital painting style, icon set for a talent/ability tree — same painted style as the game's other UI icons (gold coin, health potion, ruby heart), NOT flat vector, NOT pixel art. Each icon is a single small arcane effect or symbol illustrating one specific combat ability, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single image containing FIFTEEN separate icons arranged in an even 5-column × 3-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all fifteen.

Row 1 ("Explosão Arcana" path, violet-burst theme): 1) "Explosão Arcana" — a violet arcane orb bursting outward in jagged energy shards. 2) "Selo Arcano" — a violet rune-seal shattering with a small "mute" symbol above it. 3) "Pico de Energia" — a violet arcane spark with a golden crit-starburst at its core. 4) "Implosão" — a violet energy vortex collapsing inward into a small bright point. 5) "Cataclismo Pessoal" — a massive violet arcane explosion wreathed in a desperate dark-purple aura.

Row 2 ("Sobrecarga Mística" path, gold-crit-arcane theme): 6) "Pico Arcano" — a small violet spark-orb with a golden crit-starburst. 7) "Drenar Poder" — a violet energy tendril siphoning power from a weakening enemy silhouette. 8) "Colapso Dirigido" — a focused violet energy beam striking a cracked skull. 9) "Singularidade" — a tiny violet-black singularity point with a bright gold crit-starburst around it. 10) "Big Bang Pessoal" — an explosive violet-white energy burst radiating outward.

Row 3 ("Domínio Arcano" path, fire-arcane theme): 11) "Marca Arcana" — a violet arcane sigil igniting a small enemy silhouette in orange-violet flame. 12) "Detonação Menor" — a small violet-orange arcane fireburst with sharp jagged edges. 13) "Chama Persistente" — a swirling violet-orange flame sigil burning steadily. 14) "Detonação Total" — a burning enemy silhouette detonating in a violet-orange arcane blast. 15) "Combustão Absoluta" — a massive violet-orange arcane fire eruption.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Canvas 1280×768 px. No text, no labels, no numbers, no watermark, no border, no frame around any icon (the game already has its own frame it composites on top).
```

#### Habilidades Ativas — Bruxo
**Tamanho:** 1280×768 px · **Uso:** 15 ícones (grade 5×3) — as 15 habilidades ativas do Bruxo, uma linha por trilha

```
Hand-painted medieval fantasy game UI asset, rich digital painting style, icon set for a talent/ability tree — same painted style as the game's other UI icons (gold coin, health potion, ruby heart), NOT flat vector, NOT pixel art. Each icon is a single small cursed effect or symbol illustrating one specific combat ability, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single image containing FIFTEEN separate icons arranged in an even 5-column × 3-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all fifteen.

Row 1 ("Maldição" path, curse-purple theme): 1) "Maldição Debilitante" — a dark purple curse-sigil dripping sickly violet-green mist onto a skull. 2) "Maldição Amplificada" — a purple curse-mark burning on an enemy silhouette, small crack-lines radiating outward. 3) "Maldição Mortal" — a dark purple skull-sigil wreathed in swirling violet-black smoke. 4) "Colheita de Almas" — a clawed shadowy hand reaching into a cursed, violet-glowing skull. 5) "Ruína Final" — a massive dark-purple curse-explosion consuming a skull silhouette.

Row 2 ("Pacto Sombrio" path, dark defense theme): 6) "Escudo das Trevas" — a dark violet-black shield wreathed in wisps of shadow. 7) "Sifão Vital" — a dark violet vampiric siphon-swirl drawn into a shadowy hand. 8) "Manto das Trevas" — a cloak of swirling dark purple-black shadow-wisps. 9) "Barreira Infernal" — a jagged obsidian-black barrier wreathed in a faint violet glow. 10) "Abraço da Escuridão" — a figure fully enveloped in swirling dark shadow, faint violet glowing eyes.

Row 3 ("Corrupção" path, gold-crit-corrupt theme): 11) "Golpe Corrompido" — a dark violet energy strike with a golden-purple crit-starburst. 12) "Amplificação Corrupta" — a cracked violet-black rune pulsing with corrupted energy. 13) "Explosão Sombria" — a dark violet-black energy burst with jagged corrupted edges. 14) "Colapso das Trevas" — a shadowy tendril striking a cracked skull silhouette. 15) "Aniquilação Sombria" — a massive dark violet-black annihilation burst consuming a skull.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Canvas 1280×768 px. No text, no labels, no numbers, no watermark, no border, no frame around any icon (the game already has its own frame it composites on top).
```

#### Habilidades Ativas — Druida
**Tamanho:** 1280×768 px · **Uso:** 15 ícones (grade 5×3) — as 15 habilidades ativas do Druida, uma linha por trilha

```
Hand-painted medieval fantasy game UI asset, rich digital painting style, icon set for a talent/ability tree — same painted style as the game's other UI icons (gold coin, health potion, ruby heart), NOT flat vector, NOT pixel art. Each icon is a single small nature effect or symbol illustrating one specific combat ability, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single image containing FIFTEEN separate icons arranged in an even 5-column × 3-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all fifteen.

Row 1 ("Cura Natural" path, green-heal theme): 1) "Bênção da Floresta" — a small glowing green leaf-sprout unfurling with healing sparkles. 2) "Chuva de Cura" — a gentle rain of glowing green healing droplets falling from leaves. 3) "Casca de Árvore" — a figure's silhouette wrapped in glowing green bark-like armor. 4) "Renovação da Vida" — a great tree-root bursting upward wreathed in green healing light. 5) "Bênção da Grande Árvore" — a massive glowing green world-tree silhouette radiating healing light.

Row 2 ("Fúria da Natureza" path, feral-red theme): 6) "Golpe de Garras" — a bear-claw swipe leaving three sharp red slash-marks. 7) "Investida Feral" — a charging feral beast-silhouette leaving a rugged brown-green motion streak. 8) "Fúria da Ursa" — a roaring bear-head silhouette wreathed in a golden crit-starburst. 9) "Dilaceramento" — a set of deep claw-slashes tearing across the frame. 10) "Fúria Total da Natureza" — a feral beast silhouette wreathed in a wild green-red rage-aura.

Row 3 ("Equilíbrio" path, nature-poison defense theme): 11) "Esporos Tóxicos" — a small cluster of glowing green toxic mushroom-spores drifting. 12) "Chicote de Vinhas" — a thorny green vine lashing forward like a whip. 13) "Praga da Floresta" — a cluster of dark green toxic spores bursting outward. 14) "Colheita Venenosa" — a thorny vine constricting a skull wreathed in green venom mist. 15) "Fúria da Terra Envenenada" — roots bursting from the ground wreathed in toxic green mist, engulfing a skull.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Canvas 1280×768 px. No text, no labels, no numbers, no watermark, no border, no frame around any icon (the game already has its own frame it composites on top).
```

#### Habilidades Ativas — Bardo
**Tamanho:** 1280×768 px · **Uso:** 15 ícones (grade 5×3) — as 15 habilidades ativas do Bardo, uma linha por trilha

```
Hand-painted medieval fantasy game UI asset, rich digital painting style, icon set for a talent/ability tree — same painted style as the game's other UI icons (gold coin, health potion, ruby heart), NOT flat vector, NOT pixel art. Each icon is a single small musical or magical effect illustrating one specific combat ability, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single image containing FIFTEEN separate icons arranged in an even 5-column × 3-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all fifteen.

Row 1 ("Canção de Guerra" path, orange-bronze support theme): 1) "Canção do Escudo" — a golden musical note wreathed in a protective orange-bronze shield aura. 2) "Sinfonia da Esquiva" — three musical notes swirling into a small deflecting shield shape. 3) "Melodia Curativa" — a musical note trailing soft healing sparkles over a small heart. 4) "Hino da Fortaleza" — a lute radiating concentric orange sound-wave rings shaped like fortress walls. 5) "Sinfonia Épica" — a burst of golden musical notes forming a radiant shield-dome.

Row 2 ("Melodia Sombria" path, curse-purple support theme): 6) "Canção da Discórdia" — a dark violet musical note dripping sickly purple mist onto a skull. 7) "Nota Dissonante" — a jarring broken musical note shattering small dark chain-link debuff icons. 8) "Réquiem Sombrio" — a dark violet lute wreathed in swirling black-purple sound-waves. 9) "Crescendo Fatal" — a musical note striking a skull wreathed in violet curse-mist. 10) "Sinfonia da Perdição" — a massive burst of dark violet discordant sound-waves consuming a skull.

Row 3 ("Inspiração" path, gold-heal support theme): 11) "Melodia Restauradora" — a golden musical note trailing warm healing sparkles upward. 12) "Compasso Acelerado" — a golden hourglass wreathed in swirling musical notes, spinning fast. 13) "Última Canção" — a lute radiating a wide golden healing-light burst. 14) "Sinfonia da Vida" — a golden tree-of-notes bursting upward with radiant healing light. 15) "Aplauso Vital" — a pair of golden hands clapping, a small healing sparkle-burst and a crit-star above.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Canvas 1280×768 px. No text, no labels, no numbers, no watermark, no border, no frame around any icon (the game already has its own frame it composites on top).
```

#### Habilidades Ativas — Necromante
**Tamanho:** 1280×768 px · **Uso:** 15 ícones (grade 5×3) — as 15 habilidades ativas do Necromante, uma linha por trilha

```
Hand-painted medieval fantasy game UI asset, rich digital painting style, icon set for a talent/ability tree — same painted style as the game's other UI icons (gold coin, health potion, ruby heart), NOT flat vector, NOT pixel art. Each icon is a single small necrotic effect, bone, or symbol illustrating one specific combat ability, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single image containing FIFTEEN separate icons arranged in an even 5-column × 3-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all fifteen.

Row 1 ("Decomposição" path, plague-green theme): 1) "Praga Necrótica" — a small pale skull dripping sickly green-black necrotic ooze. 2) "Toque Corrosivo" — a skeletal hand corroding a small armor-plate silhouette with green-black rot. 3) "Praga Devastadora" — a cluster of decayed bones wreathed in thick green-black plague-mist. 4) "Colheita das Almas" — a skeletal hand reaching into a decaying, green-glowing skull. 5) "Apocalipse Necrótico" — a massive eruption of green-black necrotic plague engulfing a skull.

Row 2 ("Drenar Vida" path, bone-violet theme): 6) "Escudo de Ossos" — a shield formed from interlocking bleached bones, a faint violet glow. 7) "Sangue Pelo Sangue" — a dark red vampiric siphon-swirl drawn into a skeletal hand. 8) "Véu da Morte" — a tattered dark shroud wrapping around a skeletal silhouette. 9) "Fortaleza de Ossos" — a wall built from stacked bleached bones and skulls. 10) "Voracidade Mortal" — a skeletal hand gripping a dark red pulsing heart, draining it.

Row 3 ("Ceifador" path, gold-violet crit theme): 11) "Golpe da Foice" — a curved scythe blade with a golden-violet crit-starburst along its edge. 12) "Golpe do Terror" — a scythe swing leaving a ring of small dark terror-stars circling above the impact. 13) "Toque Final" — a scythe blade poised over a cracked skull for a finishing strike. 14) "Dança da Ceifa" — a whirling scythe blur around a bright gold-violet crit-starburst. 15) "Ceifa da Morte" — a massive scythe strike shattering a skull silhouette entirely.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Canvas 1280×768 px. No text, no labels, no numbers, no watermark, no border, no frame around any icon (the game already has its own frame it composites on top).
```

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

## Ícones de Itens — Armas, Armaduras, Mão Secundária & Acessórios

Os ícones que aparecem dentro de cada slot de equipamento/inventário (hoje são só os glifos genéricos de `icons.tsx` — uma espada simples pra qualquer arma, um peitoral simples pra qualquer armadura de corpo etc, sem diferenciar classe nem tier). Mesmo estilo pintado dos outros ícones de UI do jogo (moeda de ouro, poção, coração, runa, ícones de habilidade) — **não** é o pixel art usado nos sprites de personagem/inimigo/cenas nem nos emblemas de classe, já que esses ícones representam objetos dentro de um slot pequeno, igual a moeda e a poção, não um personagem.

**Como o tier e a raridade viram arte:** cada tipo de item (`baseNoun` — ex. "Espada", "Peitoral", "Anel") tem uma escada de **10 tiers**, e cada tier tem sua própria arte — é isso que este kit gera, uma folha de 10 ícones por tipo de item. A **Raridade** (Comum/Incomum/Raro/Épico/Legendário) **não** precisa de arte própria: no jogo ela já é aplicada por código como um brilho/tingimento de cor atrás do ícone (`rarityColor()`, o mesmo círculo colorido que já aparece atrás de cada ícone equipado/no inventário hoje) — uma Espada de Aço comum e uma Espada de Aço lendária usam exatamente o mesmo ícone de tier 3, só o brilho de fundo muda. Isso corta o trabalho de arte de 1400 pra 280 ícones (14 armas + 9 armaduras + 2 mão-secundária + 3 acessórios, × 10 tiers cada).

**Escala visual dos 10 tiers** (aplicada ao mesmo objeto-base em toda folha, da esquerda pra direita / topo pra baixo — cada folha abaixo já aplica essa escala ao objeto específico, mas é assim que ela evolui de forma geral):

1. **Sucata** — improvisado, metal cinza-marrom fosco enferrujado, bordas lascadas/entalhadas, sem ornamento.
2. **Ferro** — ferro escuro sólido e simples, forma funcional, sem adorno.
3. **Aço** — aço azul-acinzentado polido, linhas mais limpas, brilho sutil de espelho.
4. **Prata** — acabamento prateado brilhante, gravações finas, um pequeno acento de gema ou fio.
5. **Ouro** — base de aço/prata com filigrana de ouro incrustada, um pouco mais de presença.
6. **Mithril** — metal azul-esbranquiçado pálido e luminoso, parece quase sem peso, brilho suave.
7. **Adamantina** — metal quase preto ultra-duro, facetas angulares nítidas, brilho violeta escuro fraco.
8. **Obsidiana** — vidro vulcânico preto, bordas naturais irregulares e afiadas, brilho vermelho-brasa fraco por dentro.
9. **Escamas de Dragão** — textura de escama de dragão incorporada ao material, brilho laranja-brasa quente nas bordas.
10. **Lendas** — dourado-branco radiante, envolto numa aura suave, gravações rúnicas brilhantes, pequenos motivos de asa/chama/coroa — claramente a peça mais lendária da folha.

**Convenção de cada folha:** imagem única 1280×512 px, grade de 10 ícones em 5 colunas × 2 linhas (linha 1 = tiers 1-5, linha 2 = tiers 6-10), fundo e vãos em magenta sólido (#FF00FF), sem texto/número/rótulo em nenhum ícone.

### Armas — 14 folhas, uma por classe

Cada classe tem sua própria arma exclusiva (nome já usado no jogo em `classes.ts`/`weaponBase`) — a folha cobre os 10 tiers dela.

#### Espada — Guerreiro
**Tamanho:** 1280×512 px · **Uso:** 10 ícones (grade 5×2), tiers 1-10 da arma do Guerreiro

```
Hand-painted medieval fantasy game UI asset, rich digital painting style — same painted style as the game's other UI icons (gold coin, health potion, ability icons), NOT flat vector, NOT pixel art. Each icon is a single straight sword, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single wide image containing TEN separate icons arranged in an even 5-column × 2-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all ten — this is a power progression from tier 1 (weakest, top-left) to tier 10 (strongest, bottom-right), so make the visual richness escalate clearly from plain/crude to ornate/radiant across the grid.

Row 1 (tiers 1-5): 1) a crude notched shortsword, dull rusted iron blade, chipped edge, frayed cord-wrapped hilt. 2) a plain solid iron longsword blade, straight edge, plain leather-wrapped grip. 3) a polished blue-steel longsword, clean sharp edge, subtle fuller groove. 4) a bright silver blade with a fuller groove, wire-wrapped hilt, small polished pommel gem. 5) a steel blade with ornate gold filigree along the fuller and a gold-inlaid crossguard.

Row 2 (tiers 6-10): 6) a pale luminous blue-white blade that seems to shimmer, impossibly thin, slender elegant crossguard. 7) a near-black blade with sharp angular facets, faint dark violet glow along the edge. 8) a glassy volcanic-black blade, jagged natural edge, faint ember-red glow deep inside the glass. 9) a blade patterned with overlapping dragon-scale texture along the flat, warm ember-orange glow along the edge. 10) a radiant white-gold blade wreathed in a soft golden aura, glowing rune engravings along the fuller, small angel-wing motifs on the crossguard.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Wide canvas, 1280×512 px. No text, no labels, no tier numbers, no watermark, no border or frame around any icon (the game already has its own equipment-slot frame it composites on top).
```

#### Cajado — Mago
**Tamanho:** 1280×512 px · **Uso:** 10 ícones (grade 5×2), tiers 1-10 da arma do Mago

```
Hand-painted medieval fantasy game UI asset, rich digital painting style — same painted style as the game's other UI icons (gold coin, health potion, ability icons), NOT flat vector, NOT pixel art. Each icon is a single wizard's staff topped with a crystal, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single wide image containing TEN separate icons arranged in an even 5-column × 2-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all ten — this is a power progression from tier 1 (weakest, top-left) to tier 10 (strongest, bottom-right), so make the visual richness escalate clearly from plain/crude to ornate/radiant across the grid.

Row 1 (tiers 1-5): 1) a crooked scrap-wood staff, rough bark, a dull cracked gray stone lashed to the top with frayed cord. 2) a plain straight iron-shod wooden staff, a small unpolished gray stone set in an iron claw at the top. 3) a smooth polished dark wood staff, a faceted steel-blue crystal set at the top. 4) a silver-banded wood staff, a brighter clear crystal orb cradled in a silver claw at the top. 5) a wood staff wrapped in gold filigree bands, an ornate gold claw holding a glowing amber crystal.

Row 2 (tiers 6-10): 6) a pale luminous staff that looks carved from mithril itself, a softly glowing white-blue crystal orb at the top. 7) a near-black adamantine staff with sharp angular facets, a dark violet-glowing crystal orb at the top. 8) a glassy obsidian staff, jagged natural facets, a crystal orb glowing faint ember-red at the top. 9) a staff wrapped in overlapping dragon-scale plating, a crystal orb wreathed in warm ember-orange flame-glow at the top. 10) a radiant white-gold staff wreathed in a soft aura, glowing rune engravings down the shaft, a brilliant golden-white crystal orb crowned with small wing motifs.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Wide canvas, 1280×512 px. No text, no labels, no tier numbers, no watermark, no border or frame around any icon (the game already has its own equipment-slot frame it composites on top).
```

#### Adaga — Ladino
**Tamanho:** 1280×512 px · **Uso:** 10 ícones (grade 5×2), tiers 1-10 da arma do Ladino

```
Hand-painted medieval fantasy game UI asset, rich digital painting style — same painted style as the game's other UI icons (gold coin, health potion, ability icons), NOT flat vector, NOT pixel art. Each icon is a single dagger, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single wide image containing TEN separate icons arranged in an even 5-column × 2-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all ten — this is a power progression from tier 1 (weakest, top-left) to tier 10 (strongest, bottom-right), so make the visual richness escalate clearly from plain/crude to ornate/radiant across the grid.

Row 1 (tiers 1-5): 1) a crude notched iron dagger, rust spots, a worn cord-wrapped grip. 2) a plain solid iron dagger, straight edge, plain leather grip. 3) a polished blue-steel dagger, sharp double edge, subtle fuller. 4) a bright silver dagger with a fullered blade and a wire-wrapped grip. 5) a steel dagger with gold filigree along the spine and a gold-capped pommel.

Row 2 (tiers 6-10): 6) a pale luminous mithril dagger, impossibly thin blade, faint soft glow. 7) a near-black adamantine dagger with sharp angular facets, faint dark violet glow along the edge. 8) a glassy obsidian dagger, jagged natural glass edge, faint ember-red glow inside. 9) a dagger blade patterned with dragon-scale texture, warm ember-orange glow along the edge. 10) a radiant white-gold dagger wreathed in a soft golden aura, glowing rune engravings, small wing motifs on the guard.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Wide canvas, 1280×512 px. No text, no labels, no tier numbers, no watermark, no border or frame around any icon (the game already has its own equipment-slot frame it composites on top).
```

#### Maça Sagrada — Clérigo
**Tamanho:** 1280×512 px · **Uso:** 10 ícones (grade 5×2), tiers 1-10 da arma do Clérigo

```
Hand-painted medieval fantasy game UI asset, rich digital painting style — same painted style as the game's other UI icons (gold coin, health potion, ability icons), NOT flat vector, NOT pixel art. Each icon is a single flanged holy mace head on its haft, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single wide image containing TEN separate icons arranged in an even 5-column × 2-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all ten — this is a power progression from tier 1 (weakest, top-left) to tier 10 (strongest, bottom-right), so make the visual richness escalate clearly from plain/crude to ornate/radiant across the grid.

Row 1 (tiers 1-5): 1) a crude blunt iron mace head on a rough wooden haft, dull and pitted. 2) a plain solid iron mace, flanged head, plain wood haft. 3) a polished steel flanged mace head, clean edges, leather-wrapped haft. 4) a bright silver flanged mace head with fine engraved linework, wire-wrapped haft. 5) a steel mace head inlaid with gold filigree, ornate gold-capped haft end.

Row 2 (tiers 6-10): 6) a pale luminous mithril mace head, softly glowing, slender elegant haft. 7) a near-black adamantine mace head with sharp angular flanges, faint dark violet glow. 8) a glassy obsidian mace head, jagged natural facets, faint ember-red glow inside. 9) a mace head wrapped in dragon-scale plating, warm ember-orange glow along the flanges. 10) a radiant white-gold mace head wreathed in a soft holy aura, glowing rune engravings, a small golden halo motif above the head.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Wide canvas, 1280×512 px. No text, no labels, no tier numbers, no watermark, no border or frame around any icon (the game already has its own equipment-slot frame it composites on top).
```

#### Espada Longa — Cavaleiro
**Tamanho:** 1280×512 px · **Uso:** 10 ícones (grade 5×2), tiers 1-10 da arma do Cavaleiro

```
Hand-painted medieval fantasy game UI asset, rich digital painting style — same painted style as the game's other UI icons (gold coin, health potion, ability icons), NOT flat vector, NOT pixel art. Each icon is a single broad chivalric longsword (wider blade and crossguard than a common sword — a knight's weapon), richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single wide image containing TEN separate icons arranged in an even 5-column × 2-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all ten — this is a power progression from tier 1 (weakest, top-left) to tier 10 (strongest, bottom-right), so make the visual richness escalate clearly from plain/crude to ornate/radiant across the grid.

Row 1 (tiers 1-5): 1) a crude notched broadsword, dull rusted iron blade, a plain worn iron crossguard. 2) a plain solid iron longsword, wide straight blade, simple crossguard. 3) a polished blue-steel longsword, broad clean edge, subtle fuller groove. 4) a bright silver longsword with a fullered blade and an engraved silver crossguard. 5) a steel longsword with gold filigree along the fuller and a gold-inlaid wide crossguard.

Row 2 (tiers 6-10): 6) a pale luminous mithril longsword, broad slender blade that seems to shimmer. 7) a near-black adamantine longsword with sharp angular facets, faint dark violet glow. 8) a glassy obsidian longsword, jagged natural edge, faint ember-red glow inside. 9) a longsword blade patterned with dragon-scale texture, warm ember-orange glow along the edge. 10) a radiant white-gold longsword wreathed in a soft aura, glowing rune engravings along the fuller, a small crown motif atop the pommel.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Wide canvas, 1280×512 px. No text, no labels, no tier numbers, no watermark, no border or frame around any icon (the game already has its own equipment-slot frame it composites on top).
```

#### Martelo Sagrado — Paladino
**Tamanho:** 1280×512 px · **Uso:** 10 ícones (grade 5×2), tiers 1-10 da arma do Paladino

```
Hand-painted medieval fantasy game UI asset, rich digital painting style — same painted style as the game's other UI icons (gold coin, health potion, ability icons), NOT flat vector, NOT pixel art. Each icon is a single holy warhammer head (flat striking face and a back spike, distinct from a flanged mace) on its haft, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single wide image containing TEN separate icons arranged in an even 5-column × 2-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all ten — this is a power progression from tier 1 (weakest, top-left) to tier 10 (strongest, bottom-right), so make the visual richness escalate clearly from plain/crude to ornate/radiant across the grid.

Row 1 (tiers 1-5): 1) a crude blunt iron warhammer head on a rough wooden haft, dull and pitted. 2) a plain solid iron warhammer head, flat face and back spike, plain wood haft. 3) a polished steel warhammer head, clean edges, leather-wrapped haft. 4) a bright silver warhammer head with fine engraved linework, wire-wrapped haft. 5) a steel warhammer head inlaid with gold filigree, ornate gold-capped haft end.

Row 2 (tiers 6-10): 6) a pale luminous mithril warhammer head, softly glowing, slender elegant haft. 7) a near-black adamantine warhammer head with sharp angular facets, faint dark violet glow. 8) a glassy obsidian warhammer head, jagged natural facets, faint ember-red glow inside. 9) a warhammer head wrapped in dragon-scale plating, warm ember-orange glow along the face. 10) a radiant white-gold warhammer head wreathed in a soft holy aura, glowing rune engravings, a small golden halo motif above the head.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Wide canvas, 1280×512 px. No text, no labels, no tier numbers, no watermark, no border or frame around any icon (the game already has its own equipment-slot frame it composites on top).
```

#### Machado Bárbaro — Bárbaro
**Tamanho:** 1280×512 px · **Uso:** 10 ícones (grade 5×2), tiers 1-10 da arma do Bárbaro

```
Hand-painted medieval fantasy game UI asset, rich digital painting style — same painted style as the game's other UI icons (gold coin, health potion, ability icons), NOT flat vector, NOT pixel art. Each icon is a single wide-bladed battle axe head on its haft, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single wide image containing TEN separate icons arranged in an even 5-column × 2-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all ten — this is a power progression from tier 1 (weakest, top-left) to tier 10 (strongest, bottom-right), so make the visual richness escalate clearly from plain/crude to ornate/radiant across the grid.

Row 1 (tiers 1-5): 1) a crude notched iron axe head on a rough wooden haft, dull rusted edge. 2) a plain solid iron axe head, wide blade, plain wood haft. 3) a polished steel axe head, curved sharp edge, leather-wrapped haft. 4) a bright silver axe head with engraved linework, wire-wrapped haft. 5) a steel axe head inlaid with gold filigree along the blade, ornate haft cap.

Row 2 (tiers 6-10): 6) a pale luminous mithril axe head, wide curved blade that seems to shimmer. 7) a near-black adamantine axe head with sharp angular facets, faint dark violet glow. 8) a glassy obsidian axe head, jagged natural edge, faint ember-red glow inside. 9) an axe head wrapped in dragon-scale plating, warm ember-orange glow along the edge. 10) a radiant white-gold double-bladed axe head wreathed in a soft aura, glowing rune engravings, small flame motifs along the edge.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Wide canvas, 1280×512 px. No text, no labels, no tier numbers, no watermark, no border or frame around any icon (the game already has its own equipment-slot frame it composites on top).
```

#### Arco Longo — Arqueiro
**Tamanho:** 1280×512 px · **Uso:** 10 ícones (grade 5×2), tiers 1-10 da arma do Arqueiro

```
Hand-painted medieval fantasy game UI asset, rich digital painting style — same painted style as the game's other UI icons (gold coin, health potion, ability icons), NOT flat vector, NOT pixel art. Each icon is a single strung longbow, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single wide image containing TEN separate icons arranged in an even 5-column × 2-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all ten — this is a power progression from tier 1 (weakest, top-left) to tier 10 (strongest, bottom-right), so make the visual richness escalate clearly from plain/crude to ornate/radiant across the grid.

Row 1 (tiers 1-5): 1) a crude bent wooden longbow, rough bark, a frayed worn string. 2) a plain straight wooden longbow, iron-tipped limbs, plain string. 3) a polished dark wood longbow, steel-reinforced limb tips. 4) a silver-banded wood longbow, a fine braided silver-thread string. 5) a wood longbow wrapped in gold filigree bands at the limb tips.

Row 2 (tiers 6-10): 6) a pale luminous mithril-limbed longbow that seems to glow softly along its curve. 7) a near-black adamantine longbow with sharp angular limb facets, faint dark violet glow. 8) a glassy obsidian longbow, jagged natural limb edges, faint ember-red glow inside. 9) a longbow wrapped in dragon-scale plating along the limbs, warm ember-orange glow. 10) a radiant white-gold longbow wreathed in a soft aura, glowing rune engravings down the limbs, small wing motifs at the tips.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Wide canvas, 1280×512 px. No text, no labels, no tier numbers, no watermark, no border or frame around any icon (the game already has its own equipment-slot frame it composites on top).
```

#### Besta — Caçador
**Tamanho:** 1280×512 px · **Uso:** 10 ícones (grade 5×2), tiers 1-10 da arma do Caçador

```
Hand-painted medieval fantasy game UI asset, rich digital painting style — same painted style as the game's other UI icons (gold coin, health potion, ability icons), NOT flat vector, NOT pixel art. Each icon is a single loaded crossbow, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single wide image containing TEN separate icons arranged in an even 5-column × 2-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all ten — this is a power progression from tier 1 (weakest, top-left) to tier 10 (strongest, bottom-right), so make the visual richness escalate clearly from plain/crude to ornate/radiant across the grid.

Row 1 (tiers 1-5): 1) a crude wooden crossbow, rough iron trigger mechanism, a worn frayed string. 2) a plain iron-and-wood crossbow, simple trigger mechanism. 3) a polished steel-limbed crossbow, clean mechanical trigger housing. 4) a bright silver-accented crossbow with fine engraved linework on the stock. 5) a crossbow with gold filigree inlaid along the stock and limbs.

Row 2 (tiers 6-10): 6) a pale luminous mithril-limbed crossbow that seems to shimmer softly. 7) a near-black adamantine crossbow with sharp angular limb facets, faint dark violet glow. 8) a glassy obsidian crossbow, jagged natural limb edges, faint ember-red glow inside. 9) a crossbow wrapped in dragon-scale plating along the stock, warm ember-orange glow. 10) a radiant white-gold crossbow wreathed in a soft aura, glowing rune engravings along the stock, small wing motifs at the limb tips.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Wide canvas, 1280×512 px. No text, no labels, no tier numbers, no watermark, no border or frame around any icon (the game already has its own equipment-slot frame it composites on top).
```

#### Grimório Arcano — Feiticeiro
**Tamanho:** 1280×512 px · **Uso:** 10 ícones (grade 5×2), tiers 1-10 da arma do Feiticeiro

```
Hand-painted medieval fantasy game UI asset, rich digital painting style — same painted style as the game's other UI icons (gold coin, health potion, ability icons), NOT flat vector, NOT pixel art. Each icon is a single closed leather-bound spellbook (arcane grimoire), richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single wide image containing TEN separate icons arranged in an even 5-column × 2-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all ten — this is a power progression from tier 1 (weakest, top-left) to tier 10 (strongest, bottom-right), so make the visual richness escalate clearly from plain/crude to ornate/radiant across the grid.

Row 1 (tiers 1-5): 1) a crude tattered scrap-leather grimoire, rough stitched pages, a dull cracked cover. 2) a plain iron-clasped leather grimoire, unadorned cover. 3) a polished dark leather grimoire with a steel clasp and corner guards. 4) a silver-clasped grimoire with fine engraved cover linework. 5) a grimoire bound in gold filigree corner guards, an ornate gold clasp.

Row 2 (tiers 6-10): 6) a pale luminous mithril-clasped grimoire, its cover softly glowing with faint arcane light. 7) a near-black adamantine-bound grimoire with sharp angular corner facets, faint dark violet glow from the pages. 8) a glassy obsidian-bound grimoire, jagged facet corner guards, faint ember-red glow from within. 9) a grimoire bound in dragon-scale leather, warm ember-orange glow radiating from the pages. 10) a radiant white-gold grimoire wreathed in a soft aura, glowing rune engravings covering the cover, small wing motifs on the clasp.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Wide canvas, 1280×512 px. No text, no labels, no tier numbers, no watermark, no border or frame around any icon (the game already has its own equipment-slot frame it composites on top).
```

#### Grimório Sombrio — Bruxo
**Tamanho:** 1280×512 px · **Uso:** 10 ícones (grade 5×2), tiers 1-10 da arma do Bruxo

```
Hand-painted medieval fantasy game UI asset, rich digital painting style — same painted style as the game's other UI icons (gold coin, health potion, ability icons), NOT flat vector, NOT pixel art. Each icon is a single closed dark, cursed-looking spellbook (bound in black leather with bone accents — distinct from a plain arcane grimoire), richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single wide image containing TEN separate icons arranged in an even 5-column × 2-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all ten — this is a power progression from tier 1 (weakest, top-left) to tier 10 (strongest, bottom-right), so make the visual richness escalate clearly from plain/crude to ornate/radiant across the grid.

Row 1 (tiers 1-5): 1) a crude tattered black-leather grimoire, bound with rusted rings, a cracked bone clasp. 2) a plain iron-clasped dark grimoire, unadorned black cover. 3) a polished dark leather grimoire with a steel clasp and blackened corner guards. 4) a silver-clasped dark grimoire with fine engraved skull-motif cover linework. 5) a grimoire bound in gold filigree corner guards over black leather, an ornate gold-and-bone clasp.

Row 2 (tiers 6-10): 6) a pale luminous mithril-clasped grimoire bound in dark leather, its cover glowing faintly with cold blue-white light. 7) a near-black adamantine-bound grimoire with sharp angular corner facets, faint dark violet glow seeping from the pages. 8) a glassy obsidian-bound grimoire, jagged facet corner guards, faint ember-red glow from within. 9) a grimoire bound in dragon-scale leather with bone accents, warm ember-orange glow radiating from the pages. 10) a radiant grimoire wreathed in a soft violet-gold aura, glowing dark rune engravings covering the black cover, small curved horn motifs on the clasp.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Wide canvas, 1280×512 px. No text, no labels, no tier numbers, no watermark, no border or frame around any icon (the game already has its own equipment-slot frame it composites on top).
```

#### Cajado Élfico — Druida
**Tamanho:** 1280×512 px · **Uso:** 10 ícones (grade 5×2), tiers 1-10 da arma do Druida

```
Hand-painted medieval fantasy game UI asset, rich digital painting style — same painted style as the game's other UI icons (gold coin, health potion, ability icons), NOT flat vector, NOT pixel art. Each icon is a single living-wood nature staff topped with a crystal cradled by carved vines (distinct from a plain wizard's staff — organic, gnarled, vine-wrapped), richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single wide image containing TEN separate icons arranged in an even 5-column × 2-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all ten — this is a power progression from tier 1 (weakest, top-left) to tier 10 (strongest, bottom-right), so make the visual richness escalate clearly from plain/crude to ornate/radiant across the grid.

Row 1 (tiers 1-5): 1) a crude gnarled scrap-wood branch staff, rough bark, a cracked dull stone bound with vine. 2) a plain straight wooden staff, a small unpolished green stone bound with cord at the top. 3) a smooth polished pale wood staff, a faceted green crystal nestled in carved wood at the top. 4) a silver-banded wood staff, a brighter clear-green crystal cradled by living vines at the top. 5) a wood staff wrapped in gold filigree vine-shaped bands, an ornate golden leaf cradling a glowing green crystal.

Row 2 (tiers 6-10): 6) a pale luminous staff that looks carved from living mithril-wood, a softly glowing pale-green crystal orb at the top. 7) a near-black adamantine-veined wood staff with sharp angular facets, a dark violet-glowing crystal orb at the top. 8) a glassy obsidian-veined staff, jagged natural facets, a crystal orb glowing faint ember-red at the top. 9) a staff wrapped in overlapping dragon-scale bark, a crystal orb wreathed in warm ember-orange flame-glow at the top. 10) a radiant white-gold living-wood staff wreathed in a soft aura, glowing rune-etched vines climbing the shaft, a brilliant golden-green crystal orb crowned with small leaf-wing motifs.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Wide canvas, 1280×512 px. No text, no labels, no tier numbers, no watermark, no border or frame around any icon (the game already has its own equipment-slot frame it composites on top).
```

#### Alaúde Encantado — Bardo
**Tamanho:** 1280×512 px · **Uso:** 10 ícones (grade 5×2), tiers 1-10 da arma do Bardo

```
Hand-painted medieval fantasy game UI asset, rich digital painting style — same painted style as the game's other UI icons (gold coin, health potion, ability icons), NOT flat vector, NOT pixel art. Each icon is a single lute, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single wide image containing TEN separate icons arranged in an even 5-column × 2-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all ten — this is a power progression from tier 1 (weakest, top-left) to tier 10 (strongest, bottom-right), so make the visual richness escalate clearly from plain/crude to ornate/radiant across the grid.

Row 1 (tiers 1-5): 1) a crude scrap-wood lute, rough unfinished body, frayed worn strings. 2) a plain polished wood lute, simple sound hole, plain strings. 3) a polished dark wood lute with steel-wound strings and a clean lacquered finish. 4) a silver-inlaid wood lute with fine engraved linework around the sound hole. 5) a lute inlaid with gold filigree along the neck and body, ornate gold tuning pegs.

Row 2 (tiers 6-10): 6) a pale luminous mithril-inlaid lute that seems to shimmer, faintly glowing strings. 7) a near-black adamantine-inlaid lute with sharp angular body facets, faint dark violet glow from the sound hole. 8) a glassy obsidian-inlaid lute, jagged natural facet edges, faint ember-red glow from within. 9) a lute inlaid with dragon-scale plating along the body, warm ember-orange glow along the strings. 10) a radiant white-gold lute wreathed in a soft aura, glowing rune engravings across the body, small wing motifs at the scroll.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Wide canvas, 1280×512 px. No text, no labels, no tier numbers, no watermark, no border or frame around any icon (the game already has its own equipment-slot frame it composites on top).
```

#### Cetro Nigromante — Necromante
**Tamanho:** 1280×512 px · **Uso:** 10 ícones (grade 5×2), tiers 1-10 da arma do Necromante

```
Hand-painted medieval fantasy game UI asset, rich digital painting style — same painted style as the game's other UI icons (gold coin, health potion, ability icons), NOT flat vector, NOT pixel art. Each icon is a single scepter topped with a small animal/humanoid skull, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single wide image containing TEN separate icons arranged in an even 5-column × 2-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all ten — this is a power progression from tier 1 (weakest, top-left) to tier 10 (strongest, bottom-right), so make the visual richness escalate clearly from plain/crude to ornate/radiant across the grid.

Row 1 (tiers 1-5): 1) a crude scrap-metal scepter topped with a cracked, dull animal skull. 2) a plain iron scepter topped with a small polished bone skull. 3) a polished steel scepter topped with a clean-carved bone skull, faint etched detail. 4) a bright silver scepter topped with a silver-capped skull, fine engraved linework. 5) a scepter inlaid with gold filigree, topped with a gold-crowned skull.

Row 2 (tiers 6-10): 6) a pale luminous mithril scepter, topped with a skull that glows with a faint cold blue-white light in its eye sockets. 7) a near-black adamantine scepter with sharp angular facets, topped with a skull glowing dark violet in its eye sockets. 8) a glassy obsidian scepter, jagged natural facets, topped with a skull glowing faint ember-red in its eye sockets. 9) a scepter wrapped in dragon-scale plating, topped with a skull wreathed in warm ember-orange flame-glow. 10) a radiant white-gold scepter wreathed in a soft dark-gold aura, glowing rune engravings down the shaft, topped with a skull crowned in small curved horn motifs, eyes blazing bright gold.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Wide canvas, 1280×512 px. No text, no labels, no tier numbers, no watermark, no border or frame around any icon (the game already has its own equipment-slot frame it composites on top).
```

### Armaduras — 9 folhas, 3 grupos de peso × Corpo/Pernas/Mãos

As 14 classes se agrupam em 3 grupos de peso (leve/médio/pesado, ver `WEIGHT_GROUP` em `itemTiers.ts`) em vez de 14 escadas próprias — leve: Mago, Clérigo, Feiticeiro, Bruxo, Druida, Necromante, Bardo; médio: Ladino, Bárbaro, Arqueiro, Caçador; pesado: Guerreiro, Cavaleiro, Paladino.

#### Robe — Corpo (Leve)
**Tamanho:** 1280×512 px · **Uso:** 10 ícones (grade 5×2), tiers 1-10 da peça de corpo das classes leves

```
Hand-painted medieval fantasy game UI asset, rich digital painting style — same painted style as the game's other UI icons (gold coin, health potion, ability icons), NOT flat vector, NOT pixel art. Each icon is a single folded cloth robe garment, laid out flat and centered like a mannequin display, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single wide image containing TEN separate icons arranged in an even 5-column × 2-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all ten — this is a power progression from tier 1 (weakest, top-left) to tier 10 (strongest, bottom-right), so make the visual richness escalate clearly from plain/crude to ornate/radiant across the grid.

Row 1 (tiers 1-5): 1) a tattered scrap-cloth robe, rough burlap texture, frayed hem, muted dull brown-gray. 2) a plain undyed linen robe, simple stitched seams. 3) a fine steel-gray wool robe with subtle embroidered trim. 4) a silver-trimmed robe with fine embroidered silver thread along the collar and hem. 5) a robe with gold filigree embroidery along the collar, cuffs and hem, rich fabric sheen.

Row 2 (tiers 6-10): 6) a pale luminous mithril-thread robe that seems to shimmer with a faint soft glow. 7) a near-black robe woven with adamantine thread, sharp angular embroidered facet patterns, faint dark violet glow. 8) an obsidian-black robe with glassy faceted clasps, faint ember-red glow along the seams. 9) a robe patterned with overlapping dragon-scale fabric texture, warm ember-orange glow along the trim. 10) a radiant white-gold robe wreathed in a soft aura, glowing rune-embroidered patterns across the fabric, small wing motifs on the shoulders.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Wide canvas, 1280×512 px. No text, no labels, no tier numbers, no watermark, no border or frame around any icon (the game already has its own equipment-slot frame it composites on top).
```

#### Calças — Pernas (Leve)
**Tamanho:** 1280×512 px · **Uso:** 10 ícones (grade 5×2), tiers 1-10 da peça de pernas das classes leves

```
Hand-painted medieval fantasy game UI asset, rich digital painting style — same painted style as the game's other UI icons (gold coin, health potion, ability icons), NOT flat vector, NOT pixel art. Each icon is a single pair of cloth trousers, laid out flat and centered like a mannequin display, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single wide image containing TEN separate icons arranged in an even 5-column × 2-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all ten — this is a power progression from tier 1 (weakest, top-left) to tier 10 (strongest, bottom-right), so make the visual richness escalate clearly from plain/crude to ornate/radiant across the grid.

Row 1 (tiers 1-5): 1) tattered scrap-cloth trousers, rough burlap texture, frayed hems, muted dull brown-gray. 2) plain undyed linen trousers, simple stitched seams. 3) fine steel-gray wool trousers with subtle embroidered trim at the cuffs. 4) silver-trimmed trousers with fine embroidered silver thread along the cuffs. 5) trousers with gold filigree embroidery along the cuffs and waistband, rich fabric sheen.

Row 2 (tiers 6-10): 6) pale luminous mithril-thread trousers that seem to shimmer with a faint soft glow. 7) near-black trousers woven with adamantine thread, sharp angular embroidered facet patterns, faint dark violet glow. 8) obsidian-black trousers with glassy faceted cuff clasps, faint ember-red glow along the seams. 9) trousers patterned with overlapping dragon-scale fabric texture, warm ember-orange glow along the cuffs. 10) radiant white-gold trousers wreathed in a soft aura, glowing rune-embroidered patterns along the seams, small wing motifs at the cuffs.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Wide canvas, 1280×512 px. No text, no labels, no tier numbers, no watermark, no border or frame around any icon (the game already has its own equipment-slot frame it composites on top).
```

#### Luvas — Mãos (Leve)
**Tamanho:** 1280×512 px · **Uso:** 10 ícones (grade 5×2), tiers 1-10 da peça de mãos das classes leves

```
Hand-painted medieval fantasy game UI asset, rich digital painting style — same painted style as the game's other UI icons (gold coin, health potion, ability icons), NOT flat vector, NOT pixel art. Each icon is a single pair of soft cloth gloves, laid out flat and centered like a mannequin display, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

Orientation, critical: each glove hangs cuff-up, fingertips-down — the wrist opening at the TOP of the icon and the fingers pointing straight DOWN toward the bottom of the cell, as if the gloves were hanging from a hook. Do NOT draw the fingers pointing up or the hand facing palm-out/upright — that reads wrong at a glance and must be avoided.

One single wide image containing TEN separate icons arranged in an even 5-column × 2-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style, rendering quality, and cuff-up/fingers-down orientation across all ten — this is a power progression from tier 1 (weakest, top-left) to tier 10 (strongest, bottom-right), so make the visual richness escalate clearly from plain/crude to ornate/radiant across the grid.

Row 1 (tiers 1-5): 1) tattered scrap-cloth fingerless gloves, rough burlap texture, frayed cuffs. 2) plain undyed linen gloves, simple stitched seams. 3) fine steel-gray wool gloves with subtle embroidered trim at the cuffs. 4) silver-trimmed gloves with fine embroidered silver thread along the cuffs. 5) gloves with gold filigree embroidery along the cuffs, rich fabric sheen.

Row 2 (tiers 6-10): 6) pale luminous mithril-thread gloves that seem to shimmer with a faint soft glow. 7) near-black gloves woven with adamantine thread, sharp angular embroidered facet patterns, faint dark violet glow. 8) obsidian-black gloves with glassy faceted cuff clasps, faint ember-red glow along the seams. 9) gloves patterned with overlapping dragon-scale fabric texture, warm ember-orange glow along the cuffs. 10) radiant white-gold gloves wreathed in a soft aura, glowing rune-embroidered cuffs, small wing motifs on the backs of the hands.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Wide canvas, 1280×512 px. No text, no labels, no tier numbers, no watermark, no border or frame around any icon (the game already has its own equipment-slot frame it composites on top).
```

#### Colete — Corpo (Médio)
**Tamanho:** 1280×512 px · **Uso:** 10 ícones (grade 5×2), tiers 1-10 da peça de corpo das classes médias

```
Hand-painted medieval fantasy game UI asset, rich digital painting style — same painted style as the game's other UI icons (gold coin, health potion, ability icons), NOT flat vector, NOT pixel art. Each icon is a single leather vest garment, laid out flat and centered like a mannequin display, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single wide image containing TEN separate icons arranged in an even 5-column × 2-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all ten — this is a power progression from tier 1 (weakest, top-left) to tier 10 (strongest, bottom-right), so make the visual richness escalate clearly from plain/crude to ornate/radiant across the grid.

Row 1 (tiers 1-5): 1) a crude scrap-leather vest, rough stitching, dull cracked hide, patchwork panels. 2) a plain solid leather vest, simple buckled straps. 3) a polished dark leather vest with steel buckles and clean tooled seams. 4) a silver-buckled leather vest with fine tooled linework across the chest. 5) a leather vest inlaid with gold filigree trim and ornate gold buckles.

Row 2 (tiers 6-10): 6) a pale luminous mithril-studded leather vest that seems to shimmer with a faint soft glow. 7) a near-black adamantine-studded leather vest with sharp angular stud facets, faint dark violet glow. 8) a glassy obsidian-studded leather vest, jagged natural facet studs, faint ember-red glow along the seams. 9) a leather vest patterned with overlapping dragon-scale plating, warm ember-orange glow along the trim. 10) a radiant white-gold-trimmed leather vest wreathed in a soft aura, glowing rune-tooled leather, small wing motifs on the shoulder straps.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Wide canvas, 1280×512 px. No text, no labels, no tier numbers, no watermark, no border or frame around any icon (the game already has its own equipment-slot frame it composites on top).
```

#### Culotes — Pernas (Médio)
**Tamanho:** 1280×512 px · **Uso:** 10 ícones (grade 5×2), tiers 1-10 da peça de pernas das classes médias

```
Hand-painted medieval fantasy game UI asset, rich digital painting style — same painted style as the game's other UI icons (gold coin, health potion, ability icons), NOT flat vector, NOT pixel art. Each icon is a single pair of leather breeches, laid out flat and centered like a mannequin display, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single wide image containing TEN separate icons arranged in an even 5-column × 2-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all ten — this is a power progression from tier 1 (weakest, top-left) to tier 10 (strongest, bottom-right), so make the visual richness escalate clearly from plain/crude to ornate/radiant across the grid.

Row 1 (tiers 1-5): 1) crude scrap-leather breeches, rough stitching, dull cracked hide patches. 2) plain solid leather breeches, simple buckled straps at the knee. 3) polished dark leather breeches with steel knee buckles and clean tooled seams. 4) silver-buckled leather breeches with fine tooled linework down the sides. 5) leather breeches inlaid with gold filigree trim and ornate gold knee buckles.

Row 2 (tiers 6-10): 6) pale luminous mithril-studded leather breeches that seem to shimmer with a faint soft glow. 7) near-black adamantine-studded leather breeches with sharp angular stud facets, faint dark violet glow. 8) glassy obsidian-studded leather breeches, jagged natural facet studs, faint ember-red glow along the seams. 9) leather breeches patterned with overlapping dragon-scale plating, warm ember-orange glow along the trim. 10) radiant white-gold-trimmed leather breeches wreathed in a soft aura, glowing rune-tooled leather, small wing motifs at the knees.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Wide canvas, 1280×512 px. No text, no labels, no tier numbers, no watermark, no border or frame around any icon (the game already has its own equipment-slot frame it composites on top).
```

#### Braçadeiras — Mãos (Médio)
**Tamanho:** 1280×512 px · **Uso:** 10 ícones (grade 5×2), tiers 1-10 da peça de mãos das classes médias

```
Hand-painted medieval fantasy game UI asset, rich digital painting style — same painted style as the game's other UI icons (gold coin, health potion, ability icons), NOT flat vector, NOT pixel art. Each icon is a single pair of leather arm bracers, laid out flat and centered like a mannequin display, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single wide image containing TEN separate icons arranged in an even 5-column × 2-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all ten — this is a power progression from tier 1 (weakest, top-left) to tier 10 (strongest, bottom-right), so make the visual richness escalate clearly from plain/crude to ornate/radiant across the grid.

Row 1 (tiers 1-5): 1) crude scrap-leather bracers, rough stitching, dull cracked hide, worn buckle straps. 2) plain solid leather bracers, simple buckled straps. 3) polished dark leather bracers with steel buckles and clean tooled seams. 4) silver-buckled leather bracers with fine tooled linework. 5) leather bracers inlaid with gold filigree trim and ornate gold buckles.

Row 2 (tiers 6-10): 6) pale luminous mithril-studded leather bracers that seem to shimmer with a faint soft glow. 7) near-black adamantine-studded leather bracers with sharp angular stud facets, faint dark violet glow. 8) glassy obsidian-studded leather bracers, jagged natural facet studs, faint ember-red glow along the seams. 9) leather bracers patterned with overlapping dragon-scale plating, warm ember-orange glow along the trim. 10) radiant white-gold-trimmed leather bracers wreathed in a soft aura, glowing rune-tooled leather, small wing motifs at the wrist.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Wide canvas, 1280×512 px. No text, no labels, no tier numbers, no watermark, no border or frame around any icon (the game already has its own equipment-slot frame it composites on top).
```

#### Peitoral — Corpo (Pesado)
**Tamanho:** 1280×512 px · **Uso:** 10 ícones (grade 5×2), tiers 1-10 da peça de corpo das classes pesadas

```
Hand-painted medieval fantasy game UI asset, rich digital painting style — same painted style as the game's other UI icons (gold coin, health potion, ability icons), NOT flat vector, NOT pixel art. Each icon is a single plate armor breastplate, viewed front-on like a mannequin display, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single wide image containing TEN separate icons arranged in an even 5-column × 2-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all ten — this is a power progression from tier 1 (weakest, top-left) to tier 10 (strongest, bottom-right), so make the visual richness escalate clearly from plain/crude to ornate/radiant across the grid.

Row 1 (tiers 1-5): 1) a crude dented scrap-iron breastplate, rusted rivets, uneven patched plates. 2) a plain solid iron breastplate, simple riveted seams. 3) a polished steel breastplate, clean lines, subtle embossed centerline ridge. 4) a bright silver breastplate with fine engraved linework and a polished chest emblem. 5) a steel breastplate inlaid with gold filigree along the edges and an ornate gold chest emblem.

Row 2 (tiers 6-10): 6) a pale luminous mithril breastplate that seems to shimmer, impossibly light-looking, elegant fluted lines. 7) a near-black adamantine breastplate with sharp angular faceted plates, faint dark violet glow along the seams. 8) a glassy obsidian breastplate, jagged natural facet plates, faint ember-red glow along the seams. 9) a breastplate overlaid with dragon-scale plating, warm ember-orange glow along the edges. 10) a radiant white-gold breastplate wreathed in a soft aura, glowing rune engravings across the chest, small angel-wing motifs on the pauldrons.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Wide canvas, 1280×512 px. No text, no labels, no tier numbers, no watermark, no border or frame around any icon (the game already has its own equipment-slot frame it composites on top).
```

#### Grevas — Pernas (Pesado)
**Tamanho:** 1280×512 px · **Uso:** 10 ícones (grade 5×2), tiers 1-10 da peça de pernas das classes pesadas

```
Hand-painted medieval fantasy game UI asset, rich digital painting style — same painted style as the game's other UI icons (gold coin, health potion, ability icons), NOT flat vector, NOT pixel art. Each icon is a single pair of plate leg greaves, viewed front-on like a mannequin display, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single wide image containing TEN separate icons arranged in an even 5-column × 2-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all ten — this is a power progression from tier 1 (weakest, top-left) to tier 10 (strongest, bottom-right), so make the visual richness escalate clearly from plain/crude to ornate/radiant across the grid.

Row 1 (tiers 1-5): 1) crude dented scrap-iron greaves, rusted rivets, uneven patched plates. 2) plain solid iron greaves, simple riveted seams. 3) polished steel greaves, clean lines, subtle embossed ridges. 4) bright silver greaves with fine engraved knee-plate linework. 5) steel greaves inlaid with gold filigree along the edges and ornate gold knee plates.

Row 2 (tiers 6-10): 6) pale luminous mithril greaves that seem to shimmer, impossibly light-looking, elegant fluted lines. 7) near-black adamantine greaves with sharp angular faceted plates, faint dark violet glow along the seams. 8) glassy obsidian greaves, jagged natural facet plates, faint ember-red glow along the seams. 9) greaves overlaid with dragon-scale plating, warm ember-orange glow along the edges. 10) radiant white-gold greaves wreathed in a soft aura, glowing rune engravings down the shins, small wing motifs on the knee plates.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Wide canvas, 1280×512 px. No text, no labels, no tier numbers, no watermark, no border or frame around any icon (the game already has its own equipment-slot frame it composites on top).
```

#### Manoplas — Mãos (Pesado)
**Tamanho:** 1280×512 px · **Uso:** 10 ícones (grade 5×2), tiers 1-10 da peça de mãos das classes pesadas

```
Hand-painted medieval fantasy game UI asset, rich digital painting style — same painted style as the game's other UI icons (gold coin, health potion, ability icons), NOT flat vector, NOT pixel art. Each icon is a single pair of plate gauntlets, viewed front-on like a mannequin display, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

Orientation, critical: each gauntlet hangs cuff-up, fingertips-down — the wrist opening at the TOP of the icon and the fingers pointing straight DOWN toward the bottom of the cell, as if the gauntlets were hanging from a hook. Do NOT draw the fingers pointing up or the hand facing palm-out/upright — that reads wrong at a glance and must be avoided.

One single wide image containing TEN separate icons arranged in an even 5-column × 2-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style, rendering quality, and cuff-up/fingers-down orientation across all ten — this is a power progression from tier 1 (weakest, top-left) to tier 10 (strongest, bottom-right), so make the visual richness escalate clearly from plain/crude to ornate/radiant across the grid.

Row 1 (tiers 1-5): 1) crude dented scrap-iron gauntlets, rusted rivets, uneven patched plates. 2) plain solid iron gauntlets, simple riveted finger plates. 3) polished steel gauntlets, clean lines, subtle embossed knuckle ridges. 4) bright silver gauntlets with fine engraved linework across the knuckles. 5) steel gauntlets inlaid with gold filigree along the cuffs and ornate gold knuckle plates.

Row 2 (tiers 6-10): 6) pale luminous mithril gauntlets that seem to shimmer, impossibly light-looking, elegant fluted finger plates. 7) near-black adamantine gauntlets with sharp angular faceted plates, faint dark violet glow along the seams. 8) glassy obsidian gauntlets, jagged natural facet plates, faint ember-red glow along the seams. 9) gauntlets overlaid with dragon-scale plating, warm ember-orange glow along the knuckles. 10) radiant white-gold gauntlets wreathed in a soft aura, glowing rune engravings across the back of the hand, small wing motifs at the cuffs.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Wide canvas, 1280×512 px. No text, no labels, no tier numbers, no watermark, no border or frame around any icon (the game already has its own equipment-slot frame it composites on top).
```

### Mão Secundária — 2 folhas

Só as classes de uma mão só têm esse slot: Guerreiro/Cavaleiro/Paladino recebem um Escudo, Clérigo/Feiticeiro/Bruxo/Necromante recebem um Relicário — as demais classes (arma de duas mãos ou dual-wield) nunca veem esse slot preenchido.

#### Escudo — Guerreiro, Cavaleiro, Paladino
**Tamanho:** 1280×512 px · **Uso:** 10 ícones (grade 5×2), tiers 1-10 da mão secundária das classes tanque

```
Hand-painted medieval fantasy game UI asset, rich digital painting style — same painted style as the game's other UI icons (gold coin, health potion, ability icons), NOT flat vector, NOT pixel art. Each icon is a single kite-shaped shield, viewed front-on, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single wide image containing TEN separate icons arranged in an even 5-column × 2-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all ten — this is a power progression from tier 1 (weakest, top-left) to tier 10 (strongest, bottom-right), so make the visual richness escalate clearly from plain/crude to ornate/radiant across the grid.

Row 1 (tiers 1-5): 1) a crude dented scrap-iron kite shield, rusted rim, cracked wood backing showing through. 2) a plain solid iron kite shield, simple riveted rim. 3) a polished steel kite shield, clean lines, subtle embossed boss at the center. 4) a bright silver kite shield with fine engraved linework and a polished central boss. 5) a steel kite shield inlaid with gold filigree along the rim and an ornate gold boss emblem.

Row 2 (tiers 6-10): 6) a pale luminous mithril kite shield that seems to shimmer, impossibly light-looking. 7) a near-black adamantine kite shield with sharp angular faceted surface, faint dark violet glow along the rim. 8) a glassy obsidian kite shield, jagged natural facet surface, faint ember-red glow along the rim. 9) a kite shield overlaid with dragon-scale plating, warm ember-orange glow along the edge. 10) a radiant white-gold kite shield wreathed in a soft aura, glowing rune engravings across the face, a small angel-wing motif at the top.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Wide canvas, 1280×512 px. No text, no labels, no tier numbers, no watermark, no border or frame around any icon (the game already has its own equipment-slot frame it composites on top).
```

#### Relicário — Clérigo, Feiticeiro, Bruxo, Necromante
**Tamanho:** 1280×512 px · **Uso:** 10 ícones (grade 5×2), tiers 1-10 da mão secundária das classes de suporte de uma mão

```
Hand-painted medieval fantasy game UI asset, rich digital painting style — same painted style as the game's other UI icons (gold coin, health potion, ability icons), NOT flat vector, NOT pixel art. Each icon is a single hand-held reliquary — a small ornamental frame or claw cradling a glowing orb, meant to be held in an off-hand like a focus, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single wide image containing TEN separate icons arranged in an even 5-column × 2-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all ten — this is a power progression from tier 1 (weakest, top-left) to tier 10 (strongest, bottom-right), so make the visual richness escalate clearly from plain/crude to ornate/radiant across the grid.

Row 1 (tiers 1-5): 1) a crude scrap-metal reliquary orb, cracked dull housing, a rough iron claw. 2) a plain iron reliquary, a small unpolished gray orb held in a simple iron claw. 3) a polished steel reliquary, a faceted steel-blue orb held in a clean claw mount. 4) a bright silver reliquary with fine engraved linework, a brighter clear orb cradled in a silver claw. 5) a reliquary wrapped in gold filigree, an ornate gold claw holding a glowing amber orb.

Row 2 (tiers 6-10): 6) a pale luminous mithril reliquary, a softly glowing white-blue orb cradled in a shimmering claw. 7) a near-black adamantine reliquary with sharp angular facets, a dark violet-glowing orb at its center. 8) a glassy obsidian reliquary, jagged natural facets, an orb glowing faint ember-red at its center. 9) a reliquary wrapped in dragon-scale plating, an orb wreathed in warm ember-orange flame-glow. 10) a radiant white-gold reliquary wreathed in a soft aura, glowing rune engravings, small wing motifs framing a brilliant golden-white orb.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Wide canvas, 1280×512 px. No text, no labels, no tier numbers, no watermark, no border or frame around any icon (the game already has its own equipment-slot frame it composites on top).
```

### Acessórios — 3 folhas

Só existe 1 slot de acessório equipável, mas 3 tipos podem dropar — cada um com seu próprio domínio de stat (Anel: crítico; Amuleto: vida/defesa física/defesa mágica; Bracelete: ataque/ataque mágico), então o jogador escolhe qual prioridade levar.

#### Anel
**Tamanho:** 1280×512 px · **Uso:** 10 ícones (grade 5×2), tiers 1-10 do acessório de anel (foco em crítico)

```
Hand-painted medieval fantasy game UI asset, rich digital painting style — same painted style as the game's other UI icons (gold coin, health potion, ability icons), NOT flat vector, NOT pixel art. Each icon is a single ring, viewed at a slight angle so the band and setting both read clearly, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single wide image containing TEN separate icons arranged in an even 5-column × 2-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all ten — this is a power progression from tier 1 (weakest, top-left) to tier 10 (strongest, bottom-right), so make the visual richness escalate clearly from plain/crude to ornate/radiant across the grid.

Row 1 (tiers 1-5): 1) a crude scrap-iron ring, rough uneven band, no setting. 2) a plain solid iron ring band, simple and unadorned. 3) a polished steel ring band with a small faceted gray stone setting. 4) a bright silver ring band with a small sparkling clear gem setting. 5) a gold-banded ring with an ornate claw setting holding a glowing amber gem.

Row 2 (tiers 6-10): 6) a pale luminous mithril ring band that seems to shimmer, holding a softly glowing white-blue gem. 7) a near-black adamantine ring band with sharp angular facets, holding a dark violet-glowing gem. 8) a glassy obsidian ring band, jagged natural facets, holding a gem glowing faint ember-red. 9) a ring band wrapped in dragon-scale texture, holding a gem wreathed in warm ember-orange glow. 10) a radiant white-gold ring band wreathed in a soft aura, glowing rune engravings around the band, a brilliant golden-white gem blazing with light at its center.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Wide canvas, 1280×512 px. No text, no labels, no tier numbers, no watermark, no border or frame around any icon (the game already has its own equipment-slot frame it composites on top).
```

#### Amuleto
**Tamanho:** 1280×512 px · **Uso:** 10 ícones (grade 5×2), tiers 1-10 do acessório de amuleto (foco em vida/defesa)

```
Hand-painted medieval fantasy game UI asset, rich digital painting style — same painted style as the game's other UI icons (gold coin, health potion, ability icons), NOT flat vector, NOT pixel art. Each icon is a single pendant amulet hanging from a short length of chain or cord, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single wide image containing TEN separate icons arranged in an even 5-column × 2-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all ten — this is a power progression from tier 1 (weakest, top-left) to tier 10 (strongest, bottom-right), so make the visual richness escalate clearly from plain/crude to ornate/radiant across the grid.

Row 1 (tiers 1-5): 1) a crude scrap-iron pendant on a frayed cord, dull cracked stone. 2) a plain iron pendant on a simple chain, a small unpolished gray stone. 3) a polished steel pendant on a fine chain, a faceted steel-blue stone. 4) a bright silver pendant on a silver chain, a brighter clear stone in a silver setting. 5) a gold pendant on a gold chain, ornate filigree setting holding a glowing amber stone.

Row 2 (tiers 6-10): 6) a pale luminous mithril pendant on a shimmering chain, a softly glowing white-blue stone. 7) a near-black adamantine pendant with sharp angular facets on a dark chain, a dark violet-glowing stone. 8) a glassy obsidian pendant, jagged natural facets, a stone glowing faint ember-red on a dark chain. 9) a pendant wrapped in dragon-scale texture on a heavy chain, a stone wreathed in warm ember-orange glow. 10) a radiant white-gold pendant wreathed in a soft aura on a fine gold chain, glowing rune engravings across the pendant, small wing motifs at the top.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Wide canvas, 1280×512 px. No text, no labels, no tier numbers, no watermark, no border or frame around any icon (the game already has its own equipment-slot frame it composites on top).
```

#### Bracelete
**Tamanho:** 1280×512 px · **Uso:** 10 ícones (grade 5×2), tiers 1-10 do acessório de bracelete (foco em ataque/ataque mágico)

```
Hand-painted medieval fantasy game UI asset, rich digital painting style — same painted style as the game's other UI icons (gold coin, health potion, ability icons), NOT flat vector, NOT pixel art. Each icon is a single wrist bracelet/armband, viewed at a slight angle so the band reads as a ring shape, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size.

One single wide image containing TEN separate icons arranged in an even 5-column × 2-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 75% of that cell, same painted lighting style and rendering quality across all ten — this is a power progression from tier 1 (weakest, top-left) to tier 10 (strongest, bottom-right), so make the visual richness escalate clearly from plain/crude to ornate/radiant across the grid.

Row 1 (tiers 1-5): 1) a crude scrap-iron bracelet, rough uneven band, no ornament. 2) a plain solid iron bracelet band, simple and unadorned. 3) a polished steel bracelet band with a subtle embossed pattern. 4) a bright silver bracelet band with fine engraved linework. 5) a gold-banded bracelet with ornate filigree engraving around the whole band.

Row 2 (tiers 6-10): 6) a pale luminous mithril bracelet band that seems to shimmer with a faint soft glow. 7) a near-black adamantine bracelet band with sharp angular facets, faint dark violet glow. 8) a glassy obsidian bracelet band, jagged natural facets, faint ember-red glow. 9) a bracelet band wrapped in dragon-scale texture, warm ember-orange glow along the edges. 10) a radiant white-gold bracelet band wreathed in a soft aura, glowing rune engravings around the entire band, small wing motifs at the clasp.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Wide canvas, 1280×512 px. No text, no labels, no tier numbers, no watermark, no border or frame around any icon (the game already has its own equipment-slot frame it composites on top).
```

**Como isso vai virar arte no jogo:** hoje o ícone dentro de cada slot é só um glifo genérico por tipo de slot (`SLOT_ICON` em `CharacterOverview.tsx`/`Ferreiro.tsx`/`Merchant.tsx` — uma espada simples pra qualquer arma, um peitoral simples pra qualquer corpo etc, ignorando classe/grupo de peso/tier/tipo de acessório). Depois que as 28 folhas acima forem geradas e recortadas em 280 ícones individuais, cada item passa a resolver seu ícone por `baseNoun` (o mesmo texto usado no nome do item — "Espada", "Peitoral", "Escudo", "Anel" etc) + `tier` (1-10), em vez do glifo genérico por slot — essa troca de código é um follow-up separado, depois que a arte estiver pronta (mesmo padrão dos ícones de inimigos/chefes, que também tiveram os prompts escritos primeiro e a integração de código depois).

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
3) "Mercador" — a timber-framed market stall with an awning, wooden crates and barrels stacked beside it, a few visible wares (potions, coiled rope, a shield) hanging or displayed on a simple counter, a lantern lit for evening trade.

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

### Cena do Mercador — Tela do Mercador (aberta pela construção Mercador)
**Tamanho:** 1536×1536 px (quadrado) · **Uso:** banner grande em tela cheia no topo da tela do Mercador (aberta ao tocar "Conversar com o Mercador" no balão da construção) — substitui o placeholder de gradiente liso em CSS usado hoje. Mesmo tratamento do Ferreiro: ocupa ~44% da altura da tela do celular, largura total (`object-fit: cover`), quadrado garante sobra segura pra cortar em telas mais largas ou mais altas. Nome "Mercador" e botão de fechar ficam sobrepostos no canto superior, com gradiente escuro por trás pra legibilidade.

```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and other scenes (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A close view of a market stall at night, lit by a warm lantern hanging from the awning post. A shrewd, friendly merchant NPC (weathered traveling cloak over simple tunic, a coin pouch at the belt, maybe a pair of spectacles pushed up on the forehead) stands behind a wooden counter roughly centered in the frame, gesturing toward their wares or looking toward the viewer with an inviting, sly smile. The counter is covered with goods: a couple of glass potion bottles glowing faintly red, a coiled rope, a small chest with scattered coins, a shield leaning against a crate. Wooden crates and barrels stacked to the sides, a striped canvas awning overhead.

Composition: keep the merchant and counter — the main subject — comfortably within the center 70% of the square canvas, since the image will be cropped to different aspect ratios depending on the player's screen. Don't place anything essential right at the edges.

This is a complete, self-contained illustration meant to fill the canvas edge-to-edge — no magenta background, not a cutout. Square canvas, 1536×1536 px. No text, no watermark, no UI elements, no frame or border.
```

### Cena de Título — Tela Inicial (logo + menu)
**Tamanho:** 1536×1536 px (quadrado) · **Uso:** fundo em tela cheia atrás do logo do jogo, do texto de apresentação e dos botões "Continuar Jornada"/"Nova Jornada" na tela inicial (`TitleScreen.tsx`) — substitui o fundo liso `bg-nightsky` usado hoje. Mesmo tratamento do Ferreiro/Mercador: quadrado garante sobra segura pra cortar (`object-fit: cover`) em telas mais largas ou mais altas. O logo do jogo, o texto e os botões ficam centralizados por cima, então a faixa vertical central da imagem deve ficar visualmente mais calma (menos detalhe, tons mais escuros) pra não brigar com esses elementos — o jogo já aplica um leve gradiente escuro por trás deles, mas a arte não deve depender só disso pra ficar legível.

```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and other scenes (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

An epic wide-shot fantasy vista at night, tying together the game's two halves — "Reino" and "Masmorras". On the upper-left, a fortified castle with lit towers sits atop a distant hill, warm torchlight glowing from its windows. On the lower-right, jagged rocky terrain descends into the mouth of a dark dungeon entrance, faint eerie green-blue light seeping out from within. Between them, a moonlit valley with rolling hills, sparse dead trees, and drifting mist. A large pale moon with faint craters hangs in a deep indigo starry sky, positioned upper-center to upper-right.

Composition: keep the busy, detailed elements (castle, dungeon mouth, silhouetted trees) pushed toward the four corners and edges of the canvas. The vertical center third of the image should read as comparatively calm and dark — open sky, distant mist, or plain shadowed hillside — since the game's logo, tagline and menu buttons sit on top of that area and need to stay readable without a heavy overlay box.

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
