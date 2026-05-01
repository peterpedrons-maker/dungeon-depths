
# Dungeon Crawler 3D — Estilo King's Field

Jogo web 3D em primeira pessoa rodando no navegador (Three.js + React Three Fiber), com visual PS1 fiel, controles modernos, hub central conectando dungeons e ambientes ricos em arquitetura e props.

## Visão geral da experiência

O jogador acorda numa pequena vila/criptа (hub) com NPCs e baús, recebe sua primeira arma, e desce para masmorras conectadas por portas/escadas. Cada dungeon tem seu tema, inimigos próprios, itens, chaves, segredos e um chefe ao final. Magia, cura, level up e inventário fazem parte do loop principal.

## Estética visual (PS1 fiel)

- Resolução interna baixa (320x240 ou 480x360) escalada para a tela com nearest-neighbor → aparência pixelada característica.
- "Vertex jitter": vértices arredondados por frame, simulando a falta de precisão sub-pixel do PS1.
- "Affine texture mapping" aproximado → texturas com aquele warp típico em superfícies inclinadas.
- Texturas pequenas (64x64 / 128x128), paleta limitada, dithering.
- Neblina densa e escura limitando a visão (essencial pro clima e pra performance).
- Iluminação por vértice, sombras simples (decals circulares sob personagens), tochas com flicker.
- Sem antialiasing. HUD pixelado com fonte bitmap.

## Controles (híbrido moderno)

- **WASD**: andar / strafe.
- **Mouse**: olhar livre (pointer lock).
- **Shift**: correr (consome stamina).
- **Espaço**: pulo curto / esquiva lateral.
- **Botão esquerdo**: ataque (swing pesado, com windup, hitbox da arma e recovery — não é hitscan FPS).
- **Botão direito**: bloquear com escudo / parry (consome stamina ao receber hit).
- **Q / E**: trocar arma / magia equipada.
- **R**: lançar magia equipada (consome MP).
- **F**: interagir (portas, baús, NPCs, alavancas, itens no chão).
- **Tab**: inventário / status / mapa.
- **ESC**: menu de pausa.

Stamina regenera quando parado. Vida só regenera com itens de cura ou descanso em pontos específicos (fontes/fogueiras).

## Estrutura do conteúdo

### Hub — "Vila do Limiar"
Pequena área aberta com:
- Fonte de cura (recupera HP/MP, mas respawna inimigos comuns).
- 2-3 NPCs: ferreiro (melhora armas com materiais), mercador (vende poções/chaves), sábio (lore + dicas).
- Baú de armazenamento.
- 3 portões selados que levam às dungeons (desbloqueados em ordem).

### Dungeon 1 — "Catacumbas Inundadas"
Pedra úmida, água rasa nos corredores, esqueletos e ratos gigantes. Chefe: Cavaleiro Afogado.

### Dungeon 2 — "Biblioteca Esquecida"
Estantes infinitas, velas flutuantes, espectros e golems de livro. Magia gelo abundante. Chefe: Bibliotecário Lich.

### Dungeon 3 — "Forja de Obsidiana"
Lava, ponte estreitas, demônios menores, guardas de armadura. Chefe: Senhor da Forja.

Cada dungeon tem 2-3 andares com escadas, atalhos que se abrem por dentro (tipo Souls), chaves coloridas, alavancas, segredos atrás de paredes falsas, e mensagens em pedras para lore.

## Densidade de ambientes

Cada sala combina **arquitetura rica** + **props decorativos**:

- **Arquitetura**: colunas, arcos góticos, abóbadas, escadarias curvas, nichos com estátuas, altares, balcões, grades, vitrais quebrados, pisos com mosaico, pilastras.
- **Props**: tochas com chama animada, candelabros, mesas com taças/livros/mapas, baús, barris, sacos, ossos espalhados, caixões abertos, correntes pendendo, teias de aranha, pilhas de moedas, pergaminhos, espadas enferrujadas no chão, raízes invadindo paredes, poças d'água, fungos brilhantes.

Sistema de "object scattering" determinístico por sala garante que cada local pareça habitado sem comer performance — props distantes são impostores 2D (billboards) graças à neblina densa.

## Sistemas de jogo

- **Inventário**: grid simples, itens equipáveis (arma, escudo, anel, armadura), consumíveis, chaves, materiais.
- **Stats**: HP, MP, Stamina, ATK, DEF, e níveis de Força/Destreza/Magia.
- **Level up**: inimigos dão XP; ao subir nível na fonte do hub, jogador distribui pontos.
- **Armas**: espada curta, machado pesado, rapieira, cajado mágico — cada uma com moveset diferente (alcance, velocidade, dano).
- **Magias**: bola de fogo, raio de gelo, cura, escudo mágico.
- **Salvamento**: save automático ao tocar nas fontes (hub e checkpoints nas dungeons), persistido em localStorage.
- **Morte**: volta ao último checkpoint, perde XP não-gasto no local da morte (recuperável).

## Fluxo de telas

```text
[Tela título] → [Novo jogo / Continuar] → [Hub: Vila do Limiar]
                                              │
                          ┌───────────────────┼───────────────────┐
                          ▼                   ▼                   ▼
                   [Catacumbas]         [Biblioteca]          [Forja]
                          │                   │                   │
                      [Chefe 1] ─────► [Chefe 2] ─────► [Chefe 3] → [Final]
```

## Roteiro de implementação

Por ser um projeto grande, será construído em fases. Cada fase entrega algo jogável:

1. **Fundação 3D + estética PS1**: Three.js + R3F, shader de vertex jitter, affine texture, render target em baixa resolução, neblina, iluminação por vértice. Cena de teste com uma sala.
2. **Controles e câmera**: pointer lock, WASD + mouse, colisão com paredes (capsule collider), pulo/stamina, headbob sutil.
3. **Sistema de salas e dungeon**: grid modular de tiles (parede, chão, teto, porta, escada), montagem por dados JSON, portas que abrem/fecham, escadas funcionais, transições entre andares.
4. **Densidade visual**: bibliotecas de props (arquitetura + decoração), sistema de scattering por sala, billboards na distância, animações simples (chama, partículas de poeira).
5. **Combate**: arma com swing animado, hitbox, vida do jogador, stamina, bloqueio, primeiro inimigo (esqueleto) com IA básica (patrulha → perseguir → atacar → recuar).
6. **HUD + inventário + status**: barras de HP/MP/Stamina pixeladas, hotbar de armas/magias, tela de inventário/status com fonte bitmap.
7. **Hub jogável**: Vila do Limiar com 3 NPCs (diálogo em caixa de texto), fonte de save/level up, baú, 3 portões.
8. **Dungeon 1 completa**: layout das Catacumbas, 2 tipos de inimigo, chaves/portas, segredos, chefe Cavaleiro Afogado, recompensa.
9. **Magias e ferreiro**: sistema de magia com efeitos visuais, MP, melhora de armas com materiais, mercador funcional.
10. **Dungeon 2 — Biblioteca**: novos inimigos (espectro, golem), magias de gelo, chefe Lich.
11. **Dungeon 3 — Forja**: lava com dano, demônios, chefe Senhor da Forja, final do jogo.
12. **Polimento**: música ambiente sombria, SFX (passos por superfície, swings, hits, ambiente), tela título, créditos, balanceamento.

A primeira entrega cobre as fases 1-4 (fundação + uma sala densa explorável com controles funcionando), pra você validar o feel antes de investirmos em conteúdo. Depois seguimos fase a fase.

## Detalhes técnicos

- **Renderização**: `three` + `@react-three/fiber` + `@react-three/drei`. Render target interno em baixa resolução com `THREE.WebGLRenderTarget` e `NearestFilter`, exibido via fullscreen quad.
- **Shader PS1**: vertex shader com snap de posição (`floor(pos * resolution) / resolution` em clip space) + texturas com `affine` aproximado via `noperspective` workaround.
- **Colisão**: própria, baseada em capsule vs AABB dos tiles do grid (suficiente, leve e previsível). Sem physics engine pesada.
- **IA**: state machines simples por inimigo, pathfinding em grid (BFS) já que dungeons são tile-based.
- **Dados de dungeon**: JSON por andar (grid 2D + lista de entidades + props), fácil de iterar.
- **Persistência**: estado do jogo serializado em `localStorage` (não precisa de backend pra primeira versão; podemos migrar pra Lovable Cloud depois se quiser cloud saves/leaderboards).
- **Áudio**: Howler.js ou Web Audio nativo, faixas em loop + SFX posicionais.
- **Assets**: gerados proceduralmente quando possível (texturas com canvas, geometrias simples), complementados com sprites/texturas livres de royalties; nada de modelos 3D externos pesados — tudo low-poly construído em código.
- **Performance**: frustum culling, neblina densa cortando draw distance, instancing de props repetidos, billboards na distância.
- **Stack**: TanStack Start já configurado. Rota `/` = tela título, `/play` = jogo (canvas fullscreen + pointer lock).
