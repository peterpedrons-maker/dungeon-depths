# Kit de Arte do Reino

Prompts prontos para gerar as peças de interface e os sprites de personagens/inimigos de **Reino & Masmorras**. Copie o conteúdo de qualquer bloco abaixo (o botão de copiar aparece ao passar o mouse sobre o bloco, no GitHub) e cole direto no seu gerador de imagens.


## Índice — o que já está pronto e o que ainda falta

Legenda: ✅ arte já gerada e integrada no jogo · 🕓 prompt já escrito, esperando a arte · 🎨 arte já existe no repositório mas ainda não foi ligada em nenhuma tela · ⛔ ainda nem tem prompt escrito.

### Interface (molduras, botões, ícones, barras)
- ✅ [Moldura Principal — janelas e painéis](#moldura-principal-janelas-e-paineis)
- ✅ [Pergaminho — fundo dos painéis](#pergaminho-fundo-dos-paineis)
- ✅ [Slot de Equipamento — paperdoll](#slot-de-equipamento-paperdoll-de-arma-armadura-acessorio)
- ✅ [Ícones de Slot Vazio](#icones-de-slot-vazio-paperdoll-de-equipamentos-slot-sem-item)
- ✅ [Slot de Habilidade](#slot-de-habilidade-nos-da-arvore-e-barra-de-habilidades-equipadas)
- ✅ [Botão Dourado](#dourado-acao-principal-confirmar)
- 🕓 [Botão Carmesim](#carmesim-combate-acoes-perigosas) — jogo hoje usa cor lisa (CSS) no lugar
- 🕓 [Botão Neutro](#neutro-cancelar-voltar-pausar) — jogo hoje usa cor lisa (CSS) no lugar
- ✅ [Moeda de Ouro](#moeda-de-ouro-recurso-ouro)
- ✅ [Poção de Vida](#pocao-de-vida-recurso-pocoes)
- 🕓 [Coração de Rubi — barra de vida](#coracao-de-rubi-barra-de-vida) — jogo hoje usa barra lisa (CSS) no lugar
- 🕓 [Runa Arcana — barra de XP](#runa-arcana-barra-de-experiencia) — jogo hoje usa barra lisa (CSS) no lugar
- ✅ [Ícones de Efeito (Buffs & Debuffs)](#icones-de-efeito-buffs-debuffs-hud-de-combate)
- 🕓 [Ícones de Habilidades — Ativas por Classe](#icones-de-habilidades-ativas-por-classe-biblioteca-de-passivas) — 13/14 classes prontas — só falta Caçador
- ✅ [Biblioteca de Passivas](#icones-de-habilidades-ativas-por-classe-biblioteca-de-passivas)
- 🕓 [Ícones de Atributo & Combate](#icones-de-atributo-combate-tela-de-personagem) — jogo hoje usa texto no lugar
- ✅ [Emblemas de Classe](#emblemas-de-classe-avatar-no-topo-da-tela) — 14/14 classes
- 🎨 [Banner de Título](#banner-de-titulo-cabecalho-dos-paineis)
- 🎨 [Florão Divisor](#florao-divisor-separador-entre-secoes)

### Ícones de Itens (equipamentos no inventário/loja)
- ✅ [Armas — 14 folhas, uma por classe](#armas-14-folhas-uma-por-classe)
- ✅ [Armaduras — 9 folhas (3 pesos × Corpo/Pernas/Mãos)](#armaduras-9-folhas-3-grupos-de-peso-corpo-pernas-maos)
- ✅ [Mão Secundária — 2 folhas](#mao-secundaria-2-folhas)
- ✅ [Acessórios — 3 folhas](#acessorios-3-folhas)

### Sprites de Personagens — Classes (14/14 ✅)
- ✅ [Guerreiro, Mago e Ladino](#classes-guerreiro-mago-e-ladino)
- ✅ [Clérigo](#classe-clerigo)
- ✅ [Cavaleiro, Paladino, Bárbaro e Arqueiro](#classes-iii-cavaleiro-paladino-barbaro-e-arqueiro)
- ✅ [Caçador, Feiticeiro, Bruxo e Druida](#classes-iv-cacador-feiticeiro-bruxo-e-druida)
- ✅ [Bardo e Necromante](#classes-v-bardo-e-necromante)

### Inimigos & Chefes — Região 1 · Valdren (nível 1-10)
- ✅ [Genéricos: Goblin, Lobo, Esqueleto e Orc](#inimigos-i-goblin-lobo-esqueleto-e-orc)
- ✅ [Genéricos: Troll, Aberração das Sombras e Dragão Jovem](#inimigos-ii-troll-aberracao-das-sombras-e-dragao-jovem)
- ✅ [Ruínas Superficiais — inimigos](#inimigos-iii-ruinas-superficiais-morcego-lodo-acido-bandido-e-corvo)
- ✅ [Ruínas Superficiais — chefe (Rei Ossudo)](#chefe-ruinas-superficiais-rei-ossudo)
- ✅ [Caverna dos Goblins — inimigos](#inimigos-iv-caverna-dos-goblins-xama-arremessador-fanatico-e-montador-de-lobo)
- ✅ [Caverna dos Goblins — chefe (Grash)](#chefe-caverna-dos-goblins-grash)
- ✅ Cripta do Tesouro — inimigos + chefe (Custódio Amaldiçoado) — prompt já usado, removido do kit
- ✅ Pântano Podre — inimigos + chefe (Mãe-Lodo) — prompt já usado, removido do kit
- ✅ Covil de Aranhas — inimigos + chefe (Matriarca Negra) — prompt já usado, removido do kit

### Inimigos & Chefes — Região 2 · Umbrália (nível 11-20)
- ✅ Torre Amaldiçoada — inimigos + chefe (Arquimago Caído) — prompt já usado, removido do kit
- ✅ Minas Abandonadas — inimigos + chefe (Titã de Minério) — prompt já usado, removido do kit
- ✅ Floresta Amaldiçoada — inimigos (Ent Corrompido, Lobo Espectral, Fada Sombria, Urso Amaldiçoado, Trepadeira Estranguladora) — prompt já usado, removido do kit
- 🕓 [Floresta Amaldiçoada — chefe (Coração da Floresta)](#chefe-floresta-amaldicoada-coracao-da-floresta)
- 🕓 [Covil dos Dragões — inimigos](#inimigos-xi-covil-dos-dragoes-filhote-de-dragao-wyvern-selvagem-guardiao-escamado-cultista-draconico-e-serpente-de-fogo)
- ✅ [Covil dos Dragões — chefe (Dragão Jovem)](#inimigos-ii-troll-aberracao-das-sombras-e-dragao-jovem) — reaproveita o Dragão Jovem já pronto acima
- 🕓 [Necrópole Esquecida — inimigos](#inimigos-xii-necropole-esquecida-ceifador-sombrio-corvo-da-morte-carrasco-ossudo-pranteador-fantasma-e-verme-cadaverico)
- ✅ [Necrópole Esquecida — chefe (Lorde Esqueleto)](#chefe-necropole-esquecida-lorde-esqueleto)
- 🕓 [Ruínas Élficas — inimigos](#inimigos-xiii-ruinas-elficas-guardiao-elfico-corrompido-vinha-sussurrante-fera-das-ruinas-espectro-elfico-e-golem-de-cristal)
- 🕓 [Ruínas Élficas — chefe (Guardiã Ancestral)](#chefe-ruinas-elficas-guardia-ancestral)
- 🕓 [Arena de Sangue — inimigos](#inimigos-xiv-arena-de-sangue-gladiador-amaldicoado-fera-de-arena-executor-mascarado-domador-de-bestas-e-campeao-caido)
- 🕓 [Arena de Sangue — chefe (Grão-Campeão da Arena)](#chefe-arena-de-sangue-grao-campeao-da-arena)

### Inimigos & Chefes — Região 3 · Thurgard (nível 21-30) — tudo pendente
- 🕓 [Fortaleza Orc — inimigos](#inimigos-xv-fortaleza-orc-guerreiro-orc-arqueiro-orc-xama-orc-orc-berserker-e-porta-estandarte-orc)
- 🕓 [Fortaleza Orc — chefe (Warchief Grukmar)](#chefe-fortaleza-orc-warchief-grukmar)
- 🕓 [Labirinto de Gelo — inimigos](#inimigos-xvi-labirinto-de-gelo-elemental-de-gelo-lobo-gelido-morcego-glacial-espectro-de-gelo-e-sentinela-congelada)
- 🕓 [Labirinto de Gelo — chefe (Monarca do Gelo)](#chefe-labirinto-de-gelo-monarca-do-gelo)
- 🕓 [Templo Afundado — inimigos](#inimigos-xvii-templo-afundado-acolito-afogado-sacerdote-congelado-espectro-do-lago-guardiao-submerso-e-enguia-de-gelo)
- 🕓 [Templo Afundado — chefe (Alto Sacerdote Submerso)](#chefe-templo-afundado-alto-sacerdote-submerso)
- 🕓 [Cavernas de Cristal — inimigos](#inimigos-xviii-cavernas-de-cristal-morcego-de-cristal-aranha-de-cristal-golem-prismatico-vagalume-de-cristal-e-rastreador-reluzente)
- 🕓 [Cavernas de Cristal — chefe (Soberana de Cristal)](#chefe-cavernas-de-cristal-soberana-de-cristal)
- 🕓 [Covil do Lobo Alfa — inimigos](#inimigos-xix-covil-do-lobo-alfa-filhote-do-alfa-lobo-terrivel-perseguidor-da-neve-cacador-da-alcateia-e-lobo-presa-gelo)
- 🕓 [Covil do Lobo Alfa — chefe (Alfa, o Terrível)](#chefe-covil-do-lobo-alfa-alfa-o-terrivel)
- 🕓 [Catacumbas Reais — inimigos](#inimigos-xx-catacumbas-reais-esqueleto-real-sentinela-da-cripta-nobre-ossudo-camareiro-espectral-e-cavaleiro-sepultado)
- 🕓 [Catacumbas Reais — chefe (Lich Real)](#chefe-catacumbas-reais-lich-real)
- 🕓 [Poço sem Fundo (especial) — inimigos](#inimigos-xxi-poco-sem-fundo-rastejante-do-poco-tentaculo-do-vazio-espectro-afogante-perseguidor-abissal-e-habitante-oco)
- 🕓 [Poço sem Fundo (especial) — chefe final (O Que Habita o Poço)](#chefe-poco-sem-fundo-o-que-habita-o-poco)

### Inimigos & Chefes — Região 4 · Xilvana (nível 31-40) — tudo pendente
- 🕓 [Covil da Aranha-Rainha — inimigos](#inimigos-xxii-covil-da-aranha-rainha-aranha-da-selva-perseguidor-de-seda-ninhada-de-aranhas-tecela-da-selva-e-cria-venenosa)
- 🕓 [Covil da Aranha-Rainha — chefe (Aranha-Rainha)](#chefe-covil-da-aranha-rainha-aranha-rainha)
- 🕓 [Cidadela em Ruínas — inimigos](#inimigos-xxiii-cidadela-em-ruinas-sentinela-em-ruinas-guerreiro-de-vinhas-golem-desmoronado-fantasma-da-selva-e-guardiao-coberto-de-vinhas)
- 🕓 [Cidadela em Ruínas — chefe (Guardião da Cidadela)](#chefe-cidadela-em-ruinas-guardiao-da-cidadela)
- 🕓 [Santuário Profanado — inimigos](#inimigos-xxiv-santuario-profanado-sacerdote-profanado-idolo-profano-acolito-corrompido-estatua-enfeiticada-e-cultista-ritualistico)
- 🕓 [Santuário Profanado — chefe (Alto Sacerdote Profano)](#chefe-santuario-profanado-alto-sacerdote-profano)
- 🕓 [Mina de Obsidiana — inimigos](#inimigos-xxv-mina-de-obsidiana-golem-de-obsidiana-morcego-de-magma-mineiro-de-obsidiana-espectro-de-brasas-e-besouro-de-obsidiana)
- 🕓 [Mina de Obsidiana — chefe (Colosso de Obsidiana)](#chefe-mina-de-obsidiana-colosso-de-obsidiana)
- 🕓 [Selva Esquecida — inimigos](#inimigos-xxvi-selva-esquecida-guardiao-esquecido-predador-da-selva-vinha-ancestral-jaguar-selvagem-e-esporideo)
- 🕓 [Selva Esquecida — chefe (Colosso Esquecido)](#chefe-selva-esquecida-colosso-esquecido)
- 🕓 [Fortaleza dos Ossos — inimigos](#inimigos-xxvii-fortaleza-dos-ossos-soldado-ossudo-arqueiro-ossudo-golem-de-medula-fera-catapulta-e-espectro-do-ossario)
- 🕓 [Fortaleza dos Ossos — chefe (Senhor de Guerra Ossudo)](#chefe-fortaleza-dos-ossos-senhor-de-guerra-ossudo)
- 🕓 [Torre dos Ecos (especial) — inimigos](#inimigos-xxviii-torre-dos-ecos-espectro-do-eco-espectro-ressonante-horror-espelhado-sentinela-do-eco-e-cantico-oco)
- 🕓 [Torre dos Ecos (especial) — chefe final (Soberano dos Ecos)](#chefe-torre-dos-ecos-soberano-dos-ecos)

### Inimigos & Chefes — Região 5 · Ignares (nível 41-50) — tudo pendente
- 🕓 [Abismo de Gelo — inimigos](#inimigos-xxix-abismo-de-gelo-espectro-glacial-elemental-de-gelo-abissal-rastejante-gelido-behemoth-de-gelo-e-gelido-oco)
- 🕓 [Abismo de Gelo — chefe (Senhor do Abismo Glacial)](#chefe-abismo-de-gelo-senhor-do-abismo-glacial)
- 🕓 [Ruínas Vulcânicas — inimigos](#inimigos-xxx-ruinas-vulcanicas-golem-de-magma-espectro-de-cinzas-morcego-de-brasas-perseguidor-vulcanico-e-cao-de-cinzas)
- 🕓 [Ruínas Vulcânicas — chefe (Colosso Infernal)](#chefe-ruinas-vulcanicas-colosso-infernal)
- 🕓 [Covil do Dragão Ancião — inimigos](#inimigos-xxxi-covil-do-dragao-anciao-draguinho-anciao-cultista-draconico-anciao-serpente-escamosa-guardiao-draconico-e-draque-de-brasas)
- 🕓 [Covil do Dragão Ancião — chefe (Dragão Ancião)](#chefe-covil-do-dragao-anciao-dragao-anciao)
- 🕓 [Salão dos Titãs — inimigos](#inimigos-xxxii-salao-dos-titas-guardiao-titanico-colosso-de-pedra-sentinela-ancestral-golem-runico-e-vigia-titanico)
- 🕓 [Salão dos Titãs — chefe (Titã Caído)](#chefe-salao-dos-titas-tita-caido)
- 🕓 [Necrópole Real — inimigos](#inimigos-xxxiii-necropole-real-espectro-real-guarda-acinzentado-embalsamador-amaldicoado-mumia-real-e-arauto-da-morte)
- 🕓 [Necrópole Real — chefe (Necromante Real)](#chefe-necropole-real-necromante-real)
- 🕓 [Palácio Submerso — inimigos](#inimigos-xxxiv-palacio-submerso-cortesao-afogado-guarda-submerso-espectro-das-mares-horror-de-coral-e-acolito-das-profundezas)
- 🕓 [Palácio Submerso — chefe (Monarca Afogado)](#chefe-palacio-submerso-monarca-afogado)
- 🕓 [Arena do Campeão (especial) — inimigos](#inimigos-xxxv-arena-do-campeao-gladiador-campeao-fera-campea-da-arena-duelista-veterano-senhor-de-guerra-da-arena-e-campeao-ensanguentado)
- 🕓 [Arena do Campeão (especial) — chefe final (Campeão Eterno)](#chefe-arena-do-campeao-campeao-eterno)

### Alvos de Caçada (Hunts — 3 superchefes opcionais)
- ⛔ Tirano Ossudo, Leviatã do Pântano, Wyrm Infernal — ainda nem tem prompt escrito — avise se quiser que eu escreva

### Cenas (telas em tela cheia)
- ✅ [Cena do Reino](#cena-do-reino-tela-de-visao-geral-do-reino)
- ✅ [Mapa de Construções](#mapa-de-construcoes-tela-de-reino-construcoes)
- ✅ [Cena do Ferreiro](#cena-do-ferreiro-tela-do-ferreiro-aberta-pela-forja)
- ✅ [Cena do Mercador](#cena-do-mercador-tela-do-mercador-aberta-pela-construcao-mercador)
- ✅ [Cena de Título](#cena-de-titulo-tela-inicial-logo-menu)

### Mapa de Masmorras (fundo de cada região, 7 no total)
- ✅ [Região 1 — Valdren (nível 1-10)](#regiao-1-valdren-nivel-1-10)
- ✅ [Região 2 — Umbrália (nível 11-20)](#regiao-2-umbralia-nivel-11-20)
- 🕓 [Região 3 — Thurgard (nível 21-30)](#regiao-3-thurgard-nivel-21-30)
- 🕓 [Região 4 — Xilvana (nível 31-40)](#regiao-4-xilvana-nivel-31-40)
- 🕓 [Região 5 — Ignares (nível 41-50)](#regiao-5-ignares-nivel-41-50)
- 🕓 [Região 6 — Nyxheim (nível 51-58)](#regiao-6-nyxheim-nivel-51-58) — fora de escopo por enquanto — masmorras dessa região ainda não existem nos dados do jogo
- 🕓 [Região 7 — Aetherion (nível 60)](#regiao-7-aetherion-nivel-60) — fora de escopo por enquanto — masmorras dessa região ainda não existem nos dados do jogo

### Fundos de Batalha (imagem atrás do combate, por masmorra)
- ✅ Ruínas Superficiais, Caverna dos Goblins, Cripta do Tesouro, Pântano Podre, Covil de Aranhas, Torre Amaldiçoada, Minas Abandonadas — 7 masmorras — prompts já usados, removidos do kit
- 🕓 [Floresta Amaldiçoada](#floresta-amaldicoada)
- 🕓 [Covil dos Dragões](#covil-dos-dragoes)
- 🕓 [Necrópole Esquecida](#necropole-esquecida)
- 🕓 [Ruínas Élficas](#ruinas-elficas)
- 🕓 [Arena de Sangue](#arena-de-sangue)
- ⛔ As 21 masmorras das Regiões 3, 4 e 5 (Thurgard/Xilvana/Ignares) — ainda nem tem prompt escrito — avise se quiser que eu escreva

---

<a id="configuracao-da-conta-supabase"></a>
## Configuração da Conta (Supabase)

Passo único de configuração pra ativar contas/login/save na nuvem/ranking global — nada a ver com arte, mas fica aqui pra ficar fácil de achar. Rode isso uma vez no painel do Supabase do projeto (**Dashboard → SQL Editor → New query**, cole e clique em **Run**). O mesmo conteúdo também vive em `apps/reino-e-masmorras/supabase/schema.sql`, versionado no repo.

```sql
-- Reino & Masmorras — schema for account/cloud-save/global-ranking.
-- Run this once in the Supabase project's SQL Editor (Dashboard → SQL Editor
-- → New query → paste → Run). Safe to re-run (every statement is idempotent).

-- Up to 10 rows per account (one per character slot, see
-- MAX_CHARACTER_SLOTS in lib/storage.ts), each holding a full character
-- save as JSON — mirrors what used to live under the browser's
-- localStorage, just keyed by the authenticated user instead of the
-- browser. auth.users is Supabase's own built-in table; we never touch it
-- directly, only reference its id.
create table if not exists public.characters (
  user_id uuid not null references auth.users(id) on delete cascade,
  slot integer not null default 0,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, slot)
);

-- Migration: earlier installs had `user_id` alone as the primary key (one
-- character per account, no slot concept) — bring them up to the composite
-- (user_id, slot) key so multiple characters per account works. No-ops on
-- a fresh install, since the table above is already created with the right
-- shape in that case.
alter table public.characters add column if not exists slot integer not null default 0;
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.characters'::regclass
      and contype = 'p'
      and array_length(conkey, 1) = 1
  ) then
    alter table public.characters drop constraint characters_pkey;
    alter table public.characters add primary key (user_id, slot);
  end if;
end $$;

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

-- One row per account (not per character slot) — prestígio e cosméticos
-- da Loja de Prestígio sobrevivem à exclusão de personagem, inclusive
-- permadeath do Modo Ferro, e são compartilhados entre todos os slots da
-- conta, igual ao próprio login do Supabase.
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  prestige integer not null default 0,
  owned_cosmetics text[] not null default '{}',
  equipped_cosmetic text,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id);
```

Depois de rodar: se quiser testar login sem precisar confirmar e-mail toda vez, vá em **Authentication → Settings** e desative "Confirm email" (opcional, só facilita testes).

<a id="antes-de-usar"></a>
## Antes de usar

- **Fundo magenta:** todo prompt de recorte já pede fundo sólido `#FF00FF` — assim dá pra remover o fundo depois, já que a maioria das IAs de imagem não exporta com transparência real.
- **Nas folhas de sprite, cuidado especial:** como os personagens/inimigos ficam bem próximos da cor de fundo, todo prompt de sprite pede explicitamente para **não** usar magenta/rosa/fúcsia em nada do personagem (pele, roupa, armadura, arma, brilho de magia) — só o fundo deve ser magenta. Isso evita que o recorte "coma" pedaços do próprio personagem.
- **Sobre os slots:** a moldura de equipamento (quadrada) e a de habilidade (circular) pedem exatamente o mesmo material/estilo, só muda o formato — gere as duas na mesma sessão/conversa com a IA se possível, para saírem parecidas. O centro magenta é onde o ícone do jogo aparece por baixo da moldura.
- **Pixel art, mas nítida:** os personagens e inimigos do jogo são pixel art (desenhados no código), mas a técnica original saía borrada. Por isso os prompts de sprite abaixo pedem pixel art de verdade — pixels nítidos, sem anti-aliasing/borrão, contorno escuro definido e paleta de cores limitada, no estilo de RPGs pixel art modernos (Octopath Traveler, Stardew Valley, Eastward) — em resolução alta o bastante para ficar nítido mesmo ampliado no jogo.
- **Inimigos sempre virados para a esquerda:** no jogo o personagem do jogador fica à esquerda da tela e o inimigo à direita, olhando um para o outro — os prompts de inimigos pedem que toda criatura seja desenhada de perfil virada para a esquerda, nunca de frente ou para a direita. A instrução na primeira linha de cada prompt (2026: reforçada) não pede só "vire pra esquerda" — descreve anatomicamente o que isso significa (cabeça/rosto/boca/patas da frente apontando pro lado esquerdo do quadro, costas/rabo/patas de trás pro lado direito) e avisa que uma criatura virada errado inviabiliza a folha inteira — IAs de imagem seguem uma instrução concreta e "com consequência" bem melhor do que uma abstrata. Cada criatura da lista também carrega seu próprio "(facing left)" reforçando individualmente. Ainda assim, se uma criatura específica sair virada errado dentro de uma folha com várias, duas saídas práticas, dos mais rápidos aos mais confiáveis: (1) espelhar horizontalmente só aquela criatura depois de pronta em qualquer editor de imagem (Preview, Photos, GIMP, etc. — "Flip Horizontal") — sprite de perfil sem texto escrito não perde nada nesse espelhamento, é a forma mais rápida de resolver; (2) se preferir gerar de novo, peça só aquela criatura sozinha (prompt de 1 personagem, mesmo texto, só trocando "N creatures" por "one creature") em vez de repetir a folha inteira — IAs de imagem erram mais direção quando têm que controlar vários personagens ao mesmo tempo numa imagem só.
- **Sobre a moldura principal:** os *cantos* têm entalhes ornamentados únicos, mas as *bordas retas* entre os cantos são um padrão de madeira uniforme e repetitivo — de propósito, para permitir esticar a moldura em caixas de tamanhos diferentes sem distorcer os desenhos ornamentados.
- **Sobre o Mapa de Masmorras:** são 7 imagens (uma por região), empilhadas verticalmente no jogo formando um caminho único que sobe da região Valdren até Aetherion — role a tela pra cima pra avançar. Cada uma já reserva 2-3 marcadores "???" (nevoeiro/silhueta, sem nome legível) espalhados nas bordas, reservados pra masmorras futuras além das 52 já planejadas — assim dá pra crescer o conteúdo sem regerar a arte inteira.
- **Sobre os Fundos de Batalha:** cada masmorra tem seu próprio cenário de combate, combinando com o tema dela no Mapa de Masmorras. O personagem fica parado a ~27% da largura e o inimigo a ~73%, os dois em cima de uma faixa de chão perto da base da imagem (~15% da altura) — por isso todo prompt pede uma composição com o centro-baixo livre de objetos grandes, pra não cobrir os sprites.
- **Sobre o Mapa de Construções:** mesmo padrão do Mapa de Masmorras — uma única imagem com as construções já pintadas na cena, e os marcadores clicáveis do jogo ficam posicionados por cima, nas coordenadas certas (medidas depois que a arte for gerada). Já reserva um canteiro de obras vazio (fog-shrouded) pra uma futura construção além das 3 atuais.

---

<a id="molduras-texturas"></a>
## Molduras & Texturas

As peças estruturais — moldura das janelas, fundo de pergaminho.

<a id="moldura-principal-janelas-e-paineis"></a>
### Moldura Principal — Janelas e painéis
**Tamanho:** 1024×1024 px · **Uso:** borda de toda janela/painel do jogo

```
Hand-painted medieval fantasy game UI asset, rich digital painting style (think Diablo, Baldur's Gate, Divinity: Original Sin inventory screens). Aged dark oak wood carved into an ornate rectangular window frame, with a thin hammered-bronze inlay strip running along the inner edge. Warm candlelit color palette: deep browns, warm gold, muted bronze, iron black — no purple, no blue, no futuristic elements.

The four CORNERS of the frame have unique, ornate raised medieval wood-carving (a small carved rose-and-shield motif in each corner). The STRAIGHT EDGES between the corners are a simple, uniform, repeating wood-grain plank pattern with no unique details — this uniformity is intentional, the edges need to stretch cleanly in software. Frame border is about 12% of the canvas width on each side.

The entire center/interior of the frame (where a parchment background will show through in the app) is a flat solid magenta color (#FF00FF) — no texture, no gradient, no shadow inside that area.

Square canvas, 1024×1024 px, viewed perfectly flat-on (no perspective, no rotation). No text, no watermark, no drop shadow floating outside the frame.
```

<a id="pergaminho-fundo-dos-paineis"></a>
### Pergaminho — Fundo dos painéis
**Tamanho:** 512×512 px · **Uso:** preenchimento interno dos painéis, tileável

```
Hand-painted medieval fantasy game UI asset, rich digital painting style. A seamless, tileable texture of aged parchment paper. Warm cream-beige base color with subtle brown mottling and a faint fibrous paper grain. A few small stains, foxing spots, and slightly darkened edges — but kept light and only near the corners, so the middle of the tile still reads as clean and seamless when repeated.

No border, no frame, no vignette, no writing, no illustrations — flat texture fills the entire canvas edge-to-edge. Square canvas, 512×512 px, designed so the left edge matches the right edge and the top edge matches the bottom edge for seamless tiling.
```

---

<a id="slots-de-equipamento-habilidade"></a>
## Slots de Equipamento & Habilidade

Molduras pequenas para os ícones dos slots — quadrada para o equipamento (paperdoll), circular para os nós da árvore de habilidades, estilo World of Warcraft.

<a id="slot-de-equipamento-paperdoll-de-arma-armadura-acessorio"></a>
### Slot de Equipamento — Paperdoll de arma/armadura/acessório
**Tamanho:** 256×256 px · **Uso:** moldura de cada slot na tela de Personagem

```
Hand-painted medieval fantasy game UI asset, rich digital painting style, in the style of a clean, minimal Diablo-esque equipment/inventory slot frame. A square frame in bronze/gold metal with a THIN, simple uniform border — only about 5-7% of the canvas width on each side, much thinner than an ornate picture-frame. Flat bevel, soft warm gold gradient, no engraved knotwork or filigree pattern running along the rim — keep the border clean and understated. A single small diamond-shaped rivet accent sits at each of the four corners only, slightly overlapping the border, and that's the only ornamentation.

The entire flat center of the frame (where an item icon will be placed by the game) is a solid magenta color (#FF00FF) — no texture, no gradient, no shadow inside that area, just a clean hollow square hole. Square canvas, 256×256 px, viewed perfectly flat-on, thin frame border only (see the 5-7% note above — this is the main thing distinguishing it from the old, much thicker frame this replaces). No text, no watermark, no drop shadow floating outside the frame.
```

<a id="icones-de-slot-vazio-paperdoll-de-equipamentos-slot-sem-item"></a>
### Ícones de Slot Vazio — Paperdoll de Equipamentos (slot sem item)
**Tamanho:** 1536×1024 px · **Uso:** 6 ícones (recortar em grade 3×2) pros 6 slots do paperdoll (Arma, Corpo, Pernas, Mãos, Mão Secundária, Acessório) quando estão vazios — substitui o glifo de linha simples usado hoje, que destoa da arte pintada dos itens reais.

```
Hand-painted medieval fantasy game UI asset, rich digital painting style — same painted style as the game's other item icons (weapons, armor), NOT flat vector, NOT pixel art. Each icon is a faint, pale gray-blue engraved silhouette of an empty equipment slot — like a dim chalk outline or a ghostly afterimage of the item shape, NOT a fully rendered colorful item. Soft and subtle, low contrast, meant to read as "nothing equipped here" rather than as a real piece of loot — no rich color, no material detail, no shading variation, just a single muted silhouette tone per icon with a faint soft inner glow along the outline.

One single wide image containing SIX separate icons arranged in an even 3-column × 2-row grid, generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 70% of that cell, same faint pale silhouette style and rendering weight across all six.

Row 1: 1) a simple straight sword silhouette, point down. 2) a simple sleeveless tunic/vest silhouette, front view. 3) a simple pair of trousers silhouette, front view.

Row 2: 4) a simple pair of gloves silhouette, front view, oriented cuff-up with the fingers pointing straight down. 5) a simple round shield silhouette, front view. 6) a simple ring silhouette, viewed at a three-quarter angle like a jewelry icon.

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Wide canvas, 1536×1024 px. No text, no labels, no numbers, no watermark, no border or frame around any icon (the game already has its own equipment-slot frame it composites on top).
```

<a id="slot-de-habilidade-nos-da-arvore-e-barra-de-habilidades-equipadas"></a>
### Slot de Habilidade — Nós da árvore e barra de habilidades equipadas
**Tamanho:** 256×256 px · **Uso:** moldura circular de cada nó/ícone na tela de Habilidades

```
Hand-painted medieval fantasy game UI asset, rich digital painting style, in the style of a clean, minimal talent tree node frame. The exact same thin bronze/gold metal border, flat bevel and small corner-only diamond rivet accents as the equipment slot frame from the same UI kit (a thin ~5-7%-of-canvas-width border, NOT an ornate filigree-covered rim) — but this one is a perfect CIRCLE instead of a square, like a round medallion or coin border, with the rivet accents spaced evenly around the ring instead of just at corners. Warm bronze-to-gold gradient with a soft specular highlight along the top of the ring.

The entire flat circular center (where a skill icon will be placed by the game) is a solid magenta color (#FF00FF) — no texture, no gradient, no shadow inside that area, just a clean hollow circular hole. Square canvas, 256×256 px, the circular frame centered and filling almost the whole canvas, viewed perfectly flat-on. No text, no watermark, no drop shadow floating outside the ring.
```

---

<a id="botoes"></a>
## Botões

1024×384 px cada — retangular com cantos levemente arredondados, visto de frente, sem texto (o texto é adicionado depois pelo código). Hoje o jogo usa só o **Dourado**; os outros dois ficam aqui como alternativa caso queira variar por contexto.

<a id="dourado-acao-principal-confirmar"></a>
### Dourado — Ação principal, confirmar
```
Hand-painted medieval fantasy game UI asset, rich digital painting style. A rectangular game button with gently rounded corners, carved from polished golden brass with a raised beveled edge and a subtle engraved knotwork border running along the rim. Warm gold-to-amber gradient across the surface with a bright specular highlight along the top edge and a darker warm shadow along the bottom edge, giving it a raised, pressable, 3D metal look.

Solid magenta background (#FF00FF) filling the rest of the canvas around the button. Front-on view, no perspective. No text or icon on the button face — leave the center clear. Canvas 1024×384 px, button centered and filling most of the frame.
```

<a id="carmesim-combate-acoes-perigosas"></a>
### Carmesim — Combate, ações perigosas
```
Hand-painted medieval fantasy game UI asset, rich digital painting style. A rectangular game button with gently rounded corners, forged from dark blackened iron with a raised beveled edge, inlaid with a deep red enamel band along the center and small rivets at the corners. Dark iron-to-charcoal gradient with a red enamel glow strip, a subtle warm highlight along the top edge, giving it a raised, pressable, weighty metal look.

Solid magenta background (#FF00FF) filling the rest of the canvas around the button. Front-on view, no perspective. No text or icon on the button face — leave the center clear. Canvas 1024×384 px, button centered and filling most of the frame.
```

<a id="neutro-cancelar-voltar-pausar"></a>
### Neutro — Cancelar, voltar, pausar
```
Hand-painted medieval fantasy game UI asset, rich digital painting style. A rectangular game button with gently rounded corners, carved from weathered gray fieldstone with a raised beveled edge and a simple worn rope-carved border. Cool gray stone gradient with a soft highlight along the top edge and a darker mossy shadow along the bottom edge, giving it a raised, pressable, sturdy stone look.

Solid magenta background (#FF00FF) filling the rest of the canvas around the button. Front-on view, no perspective. No text or icon on the button face — leave the center clear. Canvas 1024×384 px, button centered and filling most of the frame.
```

---

<a id="icones"></a>
## Ícones

256×256 px cada — objeto único centralizado, mesmo estilo pintado, luz vindo de cima-esquerda em todos.

<a id="moeda-de-ouro-recurso-ouro"></a>
### Moeda de Ouro — Recurso: ouro
```
Hand-painted medieval fantasy game UI asset, rich digital painting style, icon for a game's resource counter. A single thick gold coin, embossed with a crude stamped castle-and-crown emblem, slightly worn and scratched edges, warm gold color with darker recessed engraving details and a bright specular highlight top-left. Soft warm lighting from the upper left.

Centered in frame, filling about 80% of the canvas. Solid magenta background (#FF00FF). No other coins, no pile, no text, no border. Canvas 256×256 px.
```

<a id="pocao-de-vida-recurso-pocoes"></a>
### Poção de Vida — Recurso: poções
```
Hand-painted medieval fantasy game UI asset, rich digital painting style, icon for a game's resource counter. A small round glass vial corked with a wooden stopper, filled with a glowing translucent red liquid, wrapped with a thin leather strap and a small wax seal. Warm rim-light catching the glass edge, soft glow emanating from the liquid inside. Soft warm lighting from the upper left.

Centered in frame, filling about 80% of the canvas. Solid magenta background (#FF00FF). No other vials, no hand holding it, no text, no border. Canvas 256×256 px.
```

<a id="coracao-de-rubi-barra-de-vida"></a>
### Coração de Rubi — Barra de vida
```
Hand-painted medieval fantasy game UI asset, rich digital painting style, icon for a game's health bar. A stylized heart shape carved from a single polished ruby gemstone, faceted surface catching warm light, deep red color with bright specular highlights and darker red in the recessed facets. A thin bronze wire wraps around the base like a claw setting. Soft warm lighting from the upper left.

Centered in frame, filling about 80% of the canvas. Solid magenta background (#FF00FF). No text, no border, no other gems. Canvas 256×256 px.
```

<a id="runa-arcana-barra-de-experiencia"></a>
### Runa Arcana — Barra de experiência
```
Hand-painted medieval fantasy game UI asset, rich digital painting style, icon for a game's experience bar. A small carved stone rune tablet, roughly circular, etched with a glowing blue-white arcane symbol that emits a soft magical glow. Weathered gray stone texture around the glowing engraving. Soft warm lighting from the upper left, contrasted with the cool glow of the rune itself.

Centered in frame, filling about 80% of the canvas. Solid magenta background (#FF00FF). No text, no border, no hand holding it. Canvas 256×256 px.
```

<a id="icones-de-efeito-buffs-debuffs-hud-de-combate"></a>
### Ícones de Efeito (Buffs & Debuffs) — HUD de Combate

Pedido do usuário: os badges de status/buff/debuff que aparecem ao lado dos sprites em combate (ver `EffectBadgeRow` em `DungeonPanel.tsx`) hoje são só um círculo colorido com 1-2 letras — placeholder, difícil de identificar de relance. Esta folha cobre TODOS os efeitos que podem aparecer ali: os 4 status periódicos, os 3 de controle, e os 8 atributos que podem ser buffados ou debuffados (2 versões cada, exceto os 2 que só existem como buff no jogo hoje).

**Sem texto — ao contrário de uma versão anterior deste prompt.** A primeira geração incluía o nome do efeito escrito embaixo de cada ícone, e isso não deu certo: o recorte automático em grade 6×4 cortava a arte ou deixava pedaços de letra vazando pra dentro do círculo vizinho, porque a altura real de cada label variava (nomes de 1 linha vs. 2 linhas empurravam o conteúdo visual de forma desigual entre as células). O jogo também não usa o nome do efeito nem precisa dele: o badge em combate já abre um texto explicando o efeito quando o jogador toca no ícone (ver `EffectBadgeRow`/tooltip em `DungeonPanel.tsx`), então a legibilidade tem que vir 100% do desenho do ícone, sem depender de texto — a mesma regra "sem texto" que vale para todo o resto deste kit.

**Tamanho:** 1536×1024 px · **Uso:** 23 ícones (recortar em grade 6×4, a última célula fica reservada/vazia) — os badges de efeito em combate

```
Hand-painted medieval fantasy game UI asset, rich digital painting style, icon set for a combat status-effect HUD — same painted style as the game's other UI icons (gold coin, health potion, ruby heart), NOT flat vector, NOT pixel art. Each icon is a single small symbol illustrating one specific buff or debuff, richly rendered with warm directional lighting from the upper-left and a bright specular highlight, readable and bold even at small size, contained inside a circular badge frame (dark bronze rim for buffs, dark iron rim for debuffs).

NO TEXT ANYWHERE on this sheet — no labels, no names, no captions under or inside any icon. Readability must come entirely from the symbol itself, since the game shows the effect's name as a separate tooltip, not baked into the art.

One single image containing TWENTY-THREE separate icons arranged in an even 6-column × 4-row grid (the last cell of the grid stays empty/reserved), generous magenta gaps between every icon so each can be cropped out individually later. Every icon centered in its own cell, filling about 85% of the cell — big and bold, since there's no label competing for space below it — same painted lighting style and rendering quality across all of them. Debuffs (harmful effects) read in sickly greens/purples/dark reds with a small downward red arrow or crack motif; buffs (helpful effects) read in bright golds/blues/greens with a small upward green arrow or spark motif — the two categories should be instantly tellable apart at a glance, with no label to lean on.

Row 1 (efeitos periódicos, sempre debuff, sickly/toxic palette): 1) Veneno — a skull silhouette with a thick green venom droplet dripping from its jaw, sickly green glow. 2) Queimadura — a small lick of orange-red flame curling upward off a scorched ember. 3) Sangramento — three dark-red blood droplets falling from a shallow diagonal claw-gash. 4) Maldição — a cracked dark-purple skull-sigil wreathed in faint violet mist. 5) Atordoado — a dazed head silhouette with small white stun-stars circling in a ring above it. 6) Dormindo — a drooping crescent moon with soft lavender "Z" wisps rising from it.

Row 2 (controle + primeiros buffs, gold/blue palette): 7) Silenciado — a closed-mouth silhouette with a red diagonal mute-bar slashed across it. 8) Ataque Aumentado — two crossed silver swords with a small bright green upward arrow above them. 9) Defesa Aumentada — a round shield glowing with a golden outward-pulsing rim and a small green upward arrow. 10) Crítico Aumentado — a red-and-gold target reticle with a small green upward arrow beside it. 11) Dano Crítico Aumentado — a golden starburst with a small green upward arrow overlapping its edge. 12) Precisão Aumentada — an arrow piercing dead-center of a target ring, small green upward arrow beside it.

Row 3 (mais buffs + primeiros debuffs de atributo): 13) Evasão Aumentada — a pale wind-swirl suggesting a quick dodge, small green upward arrow beside it. 14) Dano Recebido Reduzido — a round shield deflecting a small incoming spark, green downward arrow (less damage in = good, shown deflecting away). 15) Penetração de Defesa — a spear-tip punching cleanly through a cracked armor plate, small green upward arrow. 16) Roubo de Vida Aumentado — a crimson blood-drop siphoning upward into a small glowing heart, green upward arrow. 17) Ataque Reduzido — a chipped, cracked sword with a small red downward arrow beside it. 18) Defesa Reduzida — a cracked, splintering shield with a small red downward arrow.

Row 4 (resto dos debuffs de atributo): 19) Crítico Reduzido — a cracked, off-center target reticle with a small red downward arrow. 20) Dano Crítico Reduzido — a dim, fading gray starburst with a small red downward arrow. 21) Precisão Reduzida — an arrow missing wide off a target ring, small red downward arrow. 22) Evasão Reduzida — a figure silhouette with heavy shackles/chains at the ankles, small red downward arrow. 23) Dano Recebido Aumentado — a cracked, shattering shield with a small red upward arrow (more damage in = bad, shown as the shield failing).

Solid flat magenta background (#FF00FF) filling the entire canvas and every gap between icons, including the empty 24th cell — no texture, no gradient, no vignette. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the icons themselves — that color is reserved only for the background and will be removed later. Canvas 1536×1024 px. No watermark, no outer border, no frame around the whole sheet (the game already has its own frame it composites on top), no text of any kind — only the per-icon circular badge rims described above.
```

<a id="icones-de-habilidades-ativas-por-classe-biblioteca-de-passivas"></a>
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

<a id="icones-de-atributo-combate-tela-de-personagem"></a>
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

<a id="emblemas-de-classe-avatar-no-topo-da-tela"></a>
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

<a id="icones-de-itens-armas-armaduras-mao-secundaria-acessorios"></a>
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

<a id="armas-14-folhas-uma-por-classe"></a>
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

<a id="armaduras-9-folhas-3-grupos-de-peso-corpo-pernas-maos"></a>
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

<a id="mao-secundaria-2-folhas"></a>
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

<a id="acessorios-3-folhas"></a>
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

<a id="ornamentos"></a>
## Ornamentos

Peças decorativas — faixa de título dos painéis, florão divisor entre seções.

<a id="banner-de-titulo-cabecalho-dos-paineis"></a>
### Banner de Título — Cabeçalho dos painéis
**Tamanho:** 1024×256 px · **Uso:** faixa atrás do título de cada janela

```
Hand-painted medieval fantasy game UI asset, rich digital painting style. A wide horizontal ornamental banner/ribbon carved from dark bronze, shaped like a medieval scroll or heraldic ribbon with pointed, slightly curled ends on both left and right sides. A subtle engraved knotwork pattern runs along the top and bottom edges of the banner. Warm bronze-to-gold gradient with a bright highlight along the top edge.

The flat central area of the banner (where a title will be written in the app) is a solid magenta color (#FF00FF) — no texture there. Wide rectangular canvas, 1024×256 px, viewed flat-on, centered. No text, no watermark.
```

<a id="florao-divisor-separador-entre-secoes"></a>
### Florão Divisor — Separador entre seções
**Tamanho:** 512×256 px · **Uso:** enfeite pequeno entre blocos de texto

```
Hand-painted medieval fantasy game UI asset, rich digital painting style. A small ornamental flourish/divider, symmetrical left-to-right, made of carved wrought iron with a central heraldic diamond or shield shape flanked by two curling vine-like iron scrolls extending outward. Dark iron with a warm bronze highlight catching the light along the raised edges.

Centered horizontally in frame, with generous empty magenta space on either side. Solid magenta background (#FF00FF). Wide rectangular canvas, 512×256 px. No text, no watermark.
```

---

<a id="sprites-de-personagens"></a>
## Sprites de Personagens

Pixel art nítida (não estilo pintado/realista) — uma pose estática por personagem, vários personagens juntos na mesma folha (é só recortar cada um depois), sem animação, sem movimento.

**Direção obrigatória:** no jogo, o herói do jogador sempre fica do lado esquerdo da tela e o inimigo do lado direito. Os inimigos ficam de perfil olhando pra **ESQUERDA** (na direção do herói) — isso continua exigido nos prompts de inimigo abaixo. Os heróis/classes, porém, seguem o estilo das 3 artes já integradas no jogo (Guerreiro/Mago/Ladino): **quase de frente**, sem ser um perfil de lado, com o corpo e a arma levemente inclinados pro lado **direito** da imagem. Todo prompt de herói/classe abaixo já pede essa pose — se uma imagem sair de perfil de lado, olhando pra esquerda, ou totalmente simétrica de frente, gere de novo reforçando essa pose no prompt.

<a id="classes-guerreiro-mago-e-ladino"></a>
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

<a id="classe-clerigo"></a>
### Classe — Clérigo
**Tamanho:** 768×768 px · **Uso:** 4ª classe jogável, ainda sem arte própria (usa o sprite do Mago como placeholder no código até esta imagem ser gerada e integrada)

```
Detailed 2D pixel art game character sprite, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outline around every shape, limited but rich color palette with simple flat-shaded highlights and shadows (2-3 tones per surface). The sharp, readable style of high-quality modern pixel-art RPGs (Octopath Traveler, Eastward, Stardew Valley) rendered at a large, highly detailed resolution. This is NOT a painted illustration, NOT a realistic digital painting, NOT anime, NOT a 3D render — it must look like actual pixel art, made of visible square pixel blocks.

One single full-body character sprite, in a calm static idle pose — no motion blur, no action pose, no animation frames. CRITICAL — pose/direction: the character is nearly front-facing toward the viewer (NOT a side profile), but with the body, shoulders, and item-holding side turned in a slight, gentle lean toward the RIGHT side of the frame — the same understated forward-facing-with-a-rightward-lean stance a game hero sprite would use. It may NOT be turned to face left, and may NOT be a strict hard side-profile — keep it close to front-on with just that slight rightward lean.

"Clérigo" (Cleric): a devout human healer in warm ivory-and-gold consecrated robes with subtle holy trim, holding a golden mace or a short holy symbol/censer in one hand, calm serene expression, a faint warm golden glow around the hands. Same body proportions and pixel scale as a typical human adventurer sprite (not oversized, not chibi).

Solid flat magenta background (#FF00FF) filling the entire canvas behind the character — no texture, no gradient, no dithering, no ground shadow, no scenery. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the character (skin, cloth, metal, glow effects) — that color is reserved only for the background and will be removed later. Square canvas, 768×768 px, simple directional lighting from the upper-left. No text, no labels, no watermark, no border.
```

<a id="classes-iii-cavaleiro-paladino-barbaro-e-arqueiro"></a>
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

<a id="classes-iv-cacador-feiticeiro-bruxo-e-druida"></a>
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

<a id="classes-v-bardo-e-necromante"></a>
### Classes V — Bardo e Necromante
**Tamanho:** 1024×768 px · **Uso:** 2 novas classes jogáveis, ainda sem arte própria

```
Detailed 2D pixel art game character sprite, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outline around every shape, limited but rich color palette with simple flat-shaded highlights and shadows (2-3 tones per surface). The sharp, readable style of high-quality modern pixel-art RPGs (Octopath Traveler, Eastward, Stardew Valley) rendered at a large, highly detailed resolution. This is NOT a painted illustration, NOT a realistic digital painting, NOT anime, NOT a 3D render — it must look like actual pixel art, made of visible square pixel blocks.

One single wide image containing TWO separate full-body character sprites standing side by side, evenly spaced with a generous empty gap between them so they can be cropped apart later. Both at the same pixel scale and the same ground line, in a calm static idle pose — no motion blur, no action pose, no animation frames. CRITICAL — pose/direction: each character is nearly front-facing toward the viewer (NOT a side profile), but with the body, shoulders, and item-holding side turned in a slight, gentle lean toward the RIGHT side of the frame — the same understated forward-facing-with-a-rightward-lean stance a game hero sprite would use. Neither may be turned to face left, and neither may be a strict hard side-profile — keep it close to front-on with just that slight rightward lean.

1) "Bardo" (Bard): a charismatic human performer in warm amber-and-burgundy travel clothes, holding an ornate enchanted lute with a faint musical-note glow, confident charming pose.
2) "Necromante" (Necromancer): a gaunt human dark spellcaster in tattered slate-gray and black robes, holding a bone-topped scepter, a faint ghostly pale-green glow around the hands, unsettling calm expression.

Solid flat magenta background (#FF00FF) filling the entire canvas behind and around both characters — no texture, no gradient, no dithering, no ground shadow, no scenery. IMPORTANT: do not use magenta, pink, or bright fuchsia anywhere on the characters themselves (skin, cloth, metal, weapons, glow effects) — that color is reserved only for the background and will be removed later. Wide canvas, 1024×768 px, simple directional lighting from the upper-left. No text, no labels, no watermark, no border.
```

<a id="inimigos-i-goblin-lobo-esqueleto-e-orc"></a>
### Inimigos I — Goblin, Lobo, Esqueleto e Orc
**Tamanho:** 1536×768 px · **Uso:** inimigos de profundidade baixa/média (Ruínas, Cavernas)

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: every creature must be drawn in strict side profile facing LEFT and only LEFT. For each one individually: head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. None of them may face right, face the viewer, or face away — check every single creature in the row before finishing, since even one facing the wrong way makes the whole sheet unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

Wide image, 4 creatures standing side by side with clear empty gaps between them so they can be cropped apart later. Same scale, same ground line, calm static pose.

1) Goblin (facing left): small hunched green-skinned goblin in dirty leather rags, crude rusty dagger, sneaky posture, sharp yellow eyes.
2) Lobo Selvagem (facing left): lean feral gray wolf on all four legs, patchy fur, bared fangs, snarling.
3) Esqueleto (facing left): bone skeleton warrior in tattered rags, corroded rusty sword, faint pale glow in its eye sockets.
4) Orc Guerreiro (facing left): bulky muscular green-skinned orc with tusks, spiked dark armor, heavy two-handed axe.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creatures. Canvas 1536×768 px, soft light from upper-left. No text, no watermark.
```

<a id="inimigos-ii-troll-aberracao-das-sombras-e-dragao-jovem"></a>
### Inimigos II — Troll, Aberração das Sombras e Dragão Jovem
**Tamanho:** 1536×768 px · **Uso:** inimigos de profundidade alta (Covil dos Dragões, Torre Amaldiçoada)

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: every creature must be drawn in strict side profile facing LEFT and only LEFT. For each one individually: head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. None of them may face right, face the viewer, or face away — check every single creature in the row before finishing, since even one facing the wrong way makes the whole sheet unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

Wide image, 3 creatures standing side by side with clear empty gaps between them so they can be cropped apart later. Same ground line, calm static pose. These are bigger late-game monsters — let each one fill more of its portion of the frame than a small goblin would.

1) Troll das Cavernas (facing left): massive hunched brown-gray troll, thick warty hide, small beady eyes, huge crude stone club, low ape-like stance.
2) Aberração das Sombras (facing left): amorphous eldritch creature of swirling dark purple-black smoke, several glowing pale eyes, long clawed shadow-limbs.
3) Dragão Jovem (facing left): young bipedal red dragon, small folded wings, deep-red overlapping scales, sharp horns, bared teeth.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creatures. Canvas 1536×768 px, soft light from upper-left. No text, no watermark.
```

<a id="inimigos-iii-ruinas-superficiais-morcego-lodo-acido-bandido-e-corvo"></a>
### Inimigos III — Ruínas Superficiais: Morcego, Lodo Ácido, Bandido e Corvo
**Tamanho:** 1536×768 px · **Uso:** roster da masmorra Ruínas Superficiais (o Esqueleto já integrado continua fazendo parte do roster, sem prompt novo)

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: every creature must be drawn in strict side profile facing LEFT and only LEFT. For each one individually: head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. None of them may face right, face the viewer, or face away — check every single creature in the row before finishing, since even one facing the wrong way makes the whole sheet unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

Wide image, 4 creatures standing side by side with clear empty gaps between them so they can be cropped apart later. Same scale, same ground line, calm static pose.

1) Morcego das Ruínas (facing left): small leathery-winged cave bat, mid-flight with wings spread, sharp fangs, beady red eyes, dusty gray-brown wings.
2) Lodo Ácido (facing left): translucent sickly-green gelatinous blob, bubbling corrosive acid, faint glowing motes inside, no limbs, low to the ground.
3) Bandido das Ruínas (facing left): scruffy human scavenger in ragged dark leathers and cloth face-wrap, curved rusty short sword, crouched sneaky stance.
4) Corvo Carniceiro (facing left): large black crow, ragged glossy feathers, sharp cruel beak, wings half-spread, perched low as if about to lunge.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creatures. Canvas 1536×768 px, soft light from upper-left. No text, no watermark.
```

<a id="chefe-ruinas-superficiais-rei-ossudo"></a>
### Chefe — Ruínas Superficiais: Rei Ossudo
**Tamanho:** 768×768 px · **Uso:** boss da masmorra Ruínas Superficiais, spawna na profundidade 7 com barra de vida própria no topo da tela de batalha

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: this creature must be drawn in strict side profile facing LEFT and only LEFT. Head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. It must not face right, face the viewer, or face away — this is a hard requirement, since a wrongly-facing sprite is unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

One large boss creature filling most of the frame, calm static threatening pose.

Rei Ossudo (Bone King), facing left: towering skeleton warlord, bigger and more elaborate than a common skeleton, jagged bone crown, tattered regal purple-and-gold burial shrouds over corroded plate armor, massive two-handed ancient greatsword, pale ghostly blue-green glow in its eye sockets. Clearly bigger and more menacing than a regular skeleton enemy.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creature. Canvas 768×768 px, soft light from upper-left. No text, no watermark.
```

<a id="inimigos-iv-caverna-dos-goblins-xama-arremessador-fanatico-e-montador-de-lobo"></a>
### Inimigos IV — Caverna dos Goblins: Xamã, Arremessador, Fanático e Montador de Lobo
**Tamanho:** 1536×768 px · **Uso:** roster da masmorra Caverna dos Goblins (o Goblin comum já integrado continua fazendo parte do roster, sem prompt novo)

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: every creature must be drawn in strict side profile facing LEFT and only LEFT. For each one individually: head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. None of them may face right, face the viewer, or face away — check every single creature in the row before finishing, since even one facing the wrong way makes the whole sheet unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

Wide image, 4 creatures standing side by side with clear empty gaps between them so they can be cropped apart later. Same scale, same ground line, calm static pose.

1) Xamã Goblin (facing left): scrawny green-skinned goblin, ragged bone-and-feather trinkets, crooked wooden staff topped with a glowing sickly-green crystal, chanting pose.
2) Goblin Arremessador (facing left): wiry green-skinned goblin, bandolier of crude spiked javelins, one javelin cocked back ready to throw.
3) Goblin Fanático (facing left): wild-eyed green-skinned goblin strapped with crude sputtering bomb-satchels and lit fuses, manic grin.
4) Goblin Montador de Lobo (facing left): green-skinned goblin riding a snarling gray warg/wolf mount, gripping a short spear, both alert and aggressive.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creatures. Canvas 1536×768 px, soft light from upper-left. No text, no watermark.
```

<a id="chefe-caverna-dos-goblins-grash"></a>
### Chefe — Caverna dos Goblins: Grash
**Tamanho:** 768×768 px · **Uso:** boss da masmorra Caverna dos Goblins, spawna na profundidade 10 com barra de vida própria no topo da tela de batalha

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: this creature must be drawn in strict side profile facing LEFT and only LEFT. Head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. It must not face right, face the viewer, or face away — this is a hard requirement, since a wrongly-facing sprite is unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

One large boss creature filling most of the frame, calm static threatening pose.

Grash, facing left: huge muscular green-skinned goblin chieftain, much bigger and stockier than a common goblin, crude spiked iron plate armor patched with trophies and bones, torn red cloak, massive studded club in one hand and a jagged cleaver in the other, tusked snarling grin, scars across its face.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creature. Canvas 768×768 px, soft light from upper-left. No text, no watermark.
```

<a id="regiao-2-cada-masmorra-tem-seu-proprio-roster-igual-a-regiao-1"></a>
### Região 2 — cada masmorra tem seu próprio roster, igual à Região 1

As 7 masmorras da Região 2 (Torre Amaldiçoada, Minas Abandonadas, Floresta Amaldiçoada, Covil dos Dragões, Necrópole Esquecida, Ruínas Élficas, Arena de Sangue) deixaram de sortear entre os shapes genéricos Goblin/Lobo/Esqueleto/Orc/Troll/Aberração/Dragão — cada uma agora tem seu próprio roster de 5 inimigos + 1 chefe, combinando com o tema do nome da masmorra, no mesmo padrão da Região 1. Torre Amaldiçoada e Minas Abandonadas já têm arte própria integrada (regulares + chefe); faltam Floresta Amaldiçoada, Covil dos Dragões, Necrópole Esquecida (só falta o roster de regulares — o chefe Lorde Esqueleto já existe), Ruínas Élficas e Arena de Sangue.

**Covil dos Dragões é a única exceção do lado do chefe**: o chefe dela é "Dragão Jovem" — o mesmo dragão já coberto no prompt "Inimigos II" mais acima, cujo sprite já está integrado ao jogo (`dragao.webp`). Não precisa de prompt novo — dragões mais fortes (adultos, anciões, lendários) ficam guardados para masmorras de regiões futuras.

<a id="chefe-floresta-amaldicoada-coracao-da-floresta"></a>
### Chefe — Floresta Amaldiçoada: Coração da Floresta
**Tamanho:** 768×768 px · **Uso:** boss da masmorra Floresta Amaldiçoada, spawna na profundidade 27 com barra de vida própria no topo da tela de batalha

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: this creature must be drawn in strict side profile facing LEFT and only LEFT. Head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. It must not face right, face the viewer, or face away — this is a hard requirement, since a wrongly-facing sprite is unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

One large boss creature filling most of the frame, calm static threatening pose.

Coração da Floresta, facing left: a massive ancient tree spirit, thick gnarled bark body pulsing with a faint glowing red-orange core visible through cracks, many twisted branch-limbs, glowing eyes deep within a hollow in its trunk, an ancient dreadful presence.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creature. Canvas 768×768 px, soft light from upper-left. No text, no watermark.
```

<a id="inimigos-xi-covil-dos-dragoes-filhote-de-dragao-wyvern-selvagem-guardiao-escamado-cultista-draconico-e-serpente-de-fogo"></a>
### Inimigos XI — Covil dos Dragões: Filhote de Dragão, Wyvern Selvagem, Guardião Escamado, Cultista Dracônico e Serpente de Fogo
**Tamanho:** 1536×768 px · **Uso:** roster completo da masmorra Covil dos Dragões (5 inimigos regulares — o chefe é o Dragão Jovem já coberto no prompt "Inimigos II", sem prompt novo)

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: every creature must be drawn in strict side profile facing LEFT and only LEFT. For each one individually: head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. None of them may face right, face the viewer, or face away — check every single creature in the row before finishing, since even one facing the wrong way makes the whole sheet unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

Wide image, 5 creatures standing side by side with clear empty gaps between them so they can be cropped apart later (roughly a fifth of the width each — keep each one simple and readable at that scale). Same scale, same ground line, calm static pose. These are all smaller/weaker than a full young dragon — dragonets and dragon-kin, not adult dragons.

1) Filhote de Dragão (facing left): a small baby dragon (dragonet), stubby half-grown wings, bright orange-red scales, an inquisitive but feisty stance.
2) Wyvern Selvagem (facing left): a wild wyvern, leaner and smaller than a true dragon, dark green scales, sharp claws, wings half-spread.
3) Guardião Escamado (facing left): a reptilian humanoid guardian in scaled hide armor, teal-green scales, gripping a spear, alert protective stance.
4) Cultista Dracônico (facing left): a human cultist in dark red hooded robes decorated with draconic symbols, chanting pose, faint reddish magical glow around its hands.
5) Serpente de Fogo (facing left): a long coiled serpent with fiery orange-red scales, faint heat shimmer, reared up ready to strike.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creatures. Canvas 1536×768 px, soft light from upper-left. No text, no watermark.
```

<a id="inimigos-xii-necropole-esquecida-ceifador-sombrio-corvo-da-morte-carrasco-ossudo-pranteador-fantasma-e-verme-cadaverico"></a>
### Inimigos XII — Necrópole Esquecida: Ceifador Sombrio, Corvo da Morte, Carrasco Ossudo, Pranteador Fantasma e Verme Cadavérico
**Tamanho:** 1536×768 px · **Uso:** roster completo da masmorra Necrópole Esquecida (5 inimigos regulares)

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: every creature must be drawn in strict side profile facing LEFT and only LEFT. For each one individually: head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. None of them may face right, face the viewer, or face away — check every single creature in the row before finishing, since even one facing the wrong way makes the whole sheet unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

Wide image, 5 creatures standing side by side with clear empty gaps between them so they can be cropped apart later (roughly a fifth of the width each — keep each one simple and readable at that scale). Same scale, same ground line, calm static pose.

1) Ceifador Sombrio (facing left): a dark hooded reaper-like undead, tattered black robes, gripping a curved scythe, no visible face beneath the hood.
2) Corvo da Morte (facing left): a large undead crow, patchy decaying black feathers, glowing faint red eyes, wings half-spread.
3) Carrasco Ossudo (facing left): a hulking skeletal executioner, thick bone frame, wielding a heavy bone axe, a crude bone mask over its skull face.
4) Pranteador Fantasma (facing left): a translucent wailing ghost in tattered burial shrouds, pale blue-white glow, an anguished mournful expression.
5) Verme Cadavérico (facing left): a large pale undead grave worm, segmented rotting flesh-toned body, small toothy maw, low crawling posture.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creatures. Canvas 1536×768 px, soft light from upper-left. No text, no watermark.
```

<a id="chefe-necropole-esquecida-lorde-esqueleto"></a>
### Chefe — Necrópole Esquecida: Lorde Esqueleto
**Tamanho:** 768×768 px · **Uso:** boss da masmorra Necrópole Esquecida, spawna na profundidade 29 com barra de vida própria no topo da tela de batalha

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: this creature must be drawn in strict side profile facing LEFT and only LEFT. Head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. It must not face right, face the viewer, or face away — this is a hard requirement, since a wrongly-facing sprite is unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

One large boss creature filling most of the frame, calm static threatening pose.

Lorde Esqueleto, facing left: a tall noble undead skeleton lord, more elaborate than a common skeleton warrior, wearing a tattered regal dark-purple cloak over ornate ancient armor, a jagged crown-like circlet, gripping a ceremonial ornate blade, brighter ghostly pale-blue glow in its hollow eye sockets, a commanding regal-but-decayed presence.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creature. Canvas 768×768 px, soft light from upper-left. No text, no watermark.
```

<a id="inimigos-xiii-ruinas-elficas-guardiao-elfico-corrompido-vinha-sussurrante-fera-das-ruinas-espectro-elfico-e-golem-de-cristal"></a>
### Inimigos XIII — Ruínas Élficas: Guardião Élfico Corrompido, Vinha Sussurrante, Fera das Ruínas, Espectro Élfico e Golem de Cristal
**Tamanho:** 1536×768 px · **Uso:** roster completo da masmorra Ruínas Élficas (5 inimigos regulares)

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: every creature must be drawn in strict side profile facing LEFT and only LEFT. For each one individually: head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. None of them may face right, face the viewer, or face away — check every single creature in the row before finishing, since even one facing the wrong way makes the whole sheet unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

Wide image, 5 creatures standing side by side with clear empty gaps between them so they can be cropped apart later (roughly a fifth of the width each — keep each one simple and readable at that scale). Same scale, same ground line, calm static pose.

1) Guardião Élfico Corrompido (facing left): an animated elven statue-warrior overgrown with vines, cracked pale stone body, faint corrupted green glow in the cracks, gripping an ancient elven blade.
2) Vinha Sussurrante (facing left): a magical animated vine creature coiled and reaching, pale glowing leaves, thin whip-like tendrils.
3) Fera das Ruínas (facing left): a feral overgrown wildcat-like beast, matted fur streaked with moss, sharp claws, low stalking stance.
4) Espectro Élfico (facing left): a translucent ghostly elf in tattered once-elegant robes, pale green-white glow, a sorrowful ancient expression.
5) Golem de Cristal (facing left): a humanoid golem built from glowing pale-blue elven crystal shards, faint inner light, heavy crystalline fists.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creatures. Canvas 1536×768 px, soft light from upper-left. No text, no watermark.
```

<a id="chefe-ruinas-elficas-guardia-ancestral"></a>
### Chefe — Ruínas Élficas: Guardiã Ancestral
**Tamanho:** 768×768 px · **Uso:** boss da masmorra Ruínas Élficas, spawna na profundidade 31 com barra de vida própria no topo da tela de batalha

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: this creature must be drawn in strict side profile facing LEFT and only LEFT. Head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. It must not face right, face the viewer, or face away — this is a hard requirement, since a wrongly-facing sprite is unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

One large boss creature filling most of the frame, calm static threatening pose.

Guardiã Ancestral, facing left: a majestic and imposing elven guardian statue brought to life, elegant weathered stone-and-gold armor overgrown with glowing vines, wielding an ornate ancient elven greatsword, faint glowing green-gold runes across its body, a solemn ancient presence.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creature. Canvas 768×768 px, soft light from upper-left. No text, no watermark.
```

<a id="inimigos-xiv-arena-de-sangue-gladiador-amaldicoado-fera-de-arena-executor-mascarado-domador-de-bestas-e-campeao-caido"></a>
### Inimigos XIV — Arena de Sangue: Gladiador Amaldiçoado, Fera de Arena, Executor Mascarado, Domador de Bestas e Campeão Caído
**Tamanho:** 1536×768 px · **Uso:** roster completo da masmorra Arena de Sangue (5 inimigos regulares)

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: every creature must be drawn in strict side profile facing LEFT and only LEFT. For each one individually: head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. None of them may face right, face the viewer, or face away — check every single creature in the row before finishing, since even one facing the wrong way makes the whole sheet unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

Wide image, 5 creatures standing side by side with clear empty gaps between them so they can be cropped apart later (roughly a fifth of the width each — keep each one simple and readable at that scale). Same scale, same ground line, calm static pose.

1) Gladiador Amaldiçoado (facing left): a battle-scarred human gladiator in dark cursed leather armor, gripping a notched sword and a small round shield, grim aggressive stance.
2) Fera de Arena (facing left): a caged monstrous beast, muscular dark-furred body, chains hanging broken from a spiked collar, snarling.
3) Executor Mascarado (facing left): a hulking masked executioner in dark leather, an iron featureless mask, gripping a massive two-handed axe.
4) Domador de Bestas (facing left): a wiry human beast tamer in worn leather, cracking a long barbed whip, sharp calculating expression.
5) Campeão Caído (facing left): a ghostly translucent fallen gladiator champion, faint pale glow, tattered once-glorious armor, gripping a ghostly blade.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creatures. Canvas 1536×768 px, soft light from upper-left. No text, no watermark.
```

<a id="chefe-arena-de-sangue-grao-campeao-da-arena"></a>
### Chefe — Arena de Sangue: Grão-Campeão da Arena
**Tamanho:** 768×768 px · **Uso:** boss da masmorra Arena de Sangue, spawna na profundidade 34 com barra de vida própria no topo da tela de batalha

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: this creature must be drawn in strict side profile facing LEFT and only LEFT. Head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. It must not face right, face the viewer, or face away — this is a hard requirement, since a wrongly-facing sprite is unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

One large boss creature filling most of the frame, calm static threatening pose.

Grão-Campeão da Arena, facing left: a massive undefeated gladiator champion, heavily muscled, ornate battle-worn dark-red-and-gold armor, a legendary notched greatsword, a horned champion's helm, countless old battle scars, a fierce commanding presence.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creature. Canvas 768×768 px, soft light from upper-left. No text, no watermark.
```

<a id="inimigos-xv-fortaleza-orc-guerreiro-orc-arqueiro-orc-xama-orc-orc-berserker-e-porta-estandarte-orc"></a>
### Inimigos XV — Fortaleza Orc: Guerreiro Orc, Arqueiro Orc, Xamã Orc, Orc Berserker e Porta-Estandarte Orc
**Tamanho:** 1536×768 px · **Uso:** roster completo da masmorra Fortaleza Orc (Região 3 — Thurgard, 5 inimigos regulares)

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: every creature must be drawn in strict side profile facing LEFT and only LEFT. For each one individually: head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. None of them may face right, face the viewer, or face away — check every single creature in the row before finishing, since even one facing the wrong way makes the whole sheet unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

Wide image, 5 creatures standing side by side with clear empty gaps between them so they can be cropped apart later (roughly a fifth of the width each — keep each one simple and readable at that scale). Same scale, same ground line, calm static pose.

1) Guerreiro Orc (facing left): a stocky green-skinned orc warrior in crude fur-and-iron armor, gripping a notched battle axe, tusked scowl.
2) Arqueiro Orc (facing left): a lean orc archer in leather wraps, drawing a short recurve bow, a quiver of crude arrows on the back.
3) Xamã Orc (facing left): a hunched orc shaman draped in bone fetishes and furs, gripping a crooked totem staff glowing with tribal magic.
4) Orc Berserker (facing left): a massive shirtless orc berserker covered in war-paint and scars, wielding two crude cleavers, wild-eyed fury.
5) Porta-Estandarte Orc (facing left): an armored orc standard-bearer holding aloft a tall tribal banner of bones and hide, a curved horn at the belt.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creatures. Canvas 1536×768 px, soft light from upper-left. No text, no watermark.
```

<a id="chefe-fortaleza-orc-warchief-grukmar"></a>
### Chefe — Fortaleza Orc: Warchief Grukmar
**Tamanho:** 768×768 px · **Uso:** boss da masmorra Fortaleza Orc (Região 3), spawna na profundidade 32 com barra de vida própria no topo da tela de batalha

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: this creature must be drawn in strict side profile facing LEFT and only LEFT. Head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. It must not face right, face the viewer, or face away — this is a hard requirement, since a wrongly-facing sprite is unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

One large boss creature filling most of the frame, calm static threatening pose.

Warchief Grukmar, facing left: an enormous battle-hardened orc warchief in heavy spiked iron armor stitched with trophies, wielding a massive double-headed war axe, a jagged war-paint mask, an intimidating commanding stance.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creature. Canvas 768×768 px, soft light from upper-left. No text, no watermark.
```

<a id="inimigos-xvi-labirinto-de-gelo-elemental-de-gelo-lobo-gelido-morcego-glacial-espectro-de-gelo-e-sentinela-congelada"></a>
### Inimigos XVI — Labirinto de Gelo: Elemental de Gelo, Lobo Gélido, Morcego Glacial, Espectro de Gelo e Sentinela Congelada
**Tamanho:** 1536×768 px · **Uso:** roster completo da masmorra Labirinto de Gelo (Região 3, 5 inimigos regulares)

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: every creature must be drawn in strict side profile facing LEFT and only LEFT. For each one individually: head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. None of them may face right, face the viewer, or face away — check every single creature in the row before finishing, since even one facing the wrong way makes the whole sheet unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

Wide image, 5 creatures standing side by side with clear empty gaps between them so they can be cropped apart later (roughly a fifth of the width each — keep each one simple and readable at that scale). Same scale, same ground line, calm static pose.

1) Elemental de Gelo (facing left): a humanoid mass of jagged translucent blue ice with a faint inner glow, frost mist drifting off its body.
2) Lobo Gélido (facing left): a pale frost-furred wolf with icy blue eyes, frozen breath visible, sharp ice-rimed claws.
3) Morcego Glacial (facing left): a small pale-blue bat with crystalline frost-edged wings, sharp icicle-like fangs.
4) Espectro de Gelo (facing left): a translucent frozen ghost trailing frost mist, hollow pale-blue glowing eyes, tattered icy shroud.
5) Sentinela Congelada (facing left): a heavy humanoid statue of solid blue-white ice, cracked glowing runic lines, fists like glacial blocks.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creatures. Canvas 1536×768 px, soft light from upper-left. No text, no watermark.
```

<a id="chefe-labirinto-de-gelo-monarca-do-gelo"></a>
### Chefe — Labirinto de Gelo: Monarca do Gelo
**Tamanho:** 768×768 px · **Uso:** boss da masmorra Labirinto de Gelo (Região 3), spawna na profundidade 34 com barra de vida própria no topo da tela de batalha

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: this creature must be drawn in strict side profile facing LEFT and only LEFT. Head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. It must not face right, face the viewer, or face away — this is a hard requirement, since a wrongly-facing sprite is unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

One large boss creature filling most of the frame, calm static threatening pose.

Monarca do Gelo, facing left: a tall regal ice monarch in a flowing crown and robe of living glacial crystal, wielding a jagged ice-shard cetro/scepter, a crown of frozen spikes, an aura of swirling frost.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creature. Canvas 768×768 px, soft light from upper-left. No text, no watermark.
```

<a id="inimigos-xvii-templo-afundado-acolito-afogado-sacerdote-congelado-espectro-do-lago-guardiao-submerso-e-enguia-de-gelo"></a>
### Inimigos XVII — Templo Afundado: Acólito Afogado, Sacerdote Congelado, Espectro do Lago, Guardião Submerso e Enguia de Gelo
**Tamanho:** 1536×768 px · **Uso:** roster completo da masmorra Templo Afundado (Região 3, fork com Cavernas de Cristal, 5 inimigos regulares)

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: every creature must be drawn in strict side profile facing LEFT and only LEFT. For each one individually: head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. None of them may face right, face the viewer, or face away — check every single creature in the row before finishing, since even one facing the wrong way makes the whole sheet unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

Wide image, 5 creatures standing side by side with clear empty gaps between them so they can be cropped apart later (roughly a fifth of the width each — keep each one simple and readable at that scale). Same scale, same ground line, calm static pose.

1) Acólito Afogado (facing left): a waterlogged drowned acolyte in tattered ceremonial robes, pale bloated skin, dripping wet hair, hollow eyes.
2) Sacerdote Congelado (facing left): a frozen-solid priest still upright in icy ceremonial vestments, frost creeping over his robes, a cracked holy amulet.
3) Espectro do Lago (facing left): a translucent watery specter shaped like a drowned figure, dark rippling form, faint pale-green glow.
4) Guardião Submerso (facing left): a heavy stone guardian statue encrusted with algae and barnacles, dripping wet, a cracked ceremonial shield.
5) Enguia de Gelo (facing left): a long serpentine ice-blue eel with faint electric frost crackling along its body, sharp fanged mouth.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creatures. Canvas 1536×768 px, soft light from upper-left. No text, no watermark.
```

<a id="chefe-templo-afundado-alto-sacerdote-submerso"></a>
### Chefe — Templo Afundado: Alto Sacerdote Submerso
**Tamanho:** 768×768 px · **Uso:** boss da masmorra Templo Afundado (Região 3), spawna na profundidade 36 com barra de vida própria no topo da tela de batalha

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: this creature must be drawn in strict side profile facing LEFT and only LEFT. Head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. It must not face right, face the viewer, or face away — this is a hard requirement, since a wrongly-facing sprite is unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

One large boss creature filling most of the frame, calm static threatening pose.

Alto Sacerdote Submerso, facing left: a towering drowned high priest in ornate waterlogged ceremonial robes trailing kelp, a cracked golden ceremonial mask, gripping a coral-encrusted ritual staff, faint sickly green glow.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creature. Canvas 768×768 px, soft light from upper-left. No text, no watermark.
```

<a id="inimigos-xviii-cavernas-de-cristal-morcego-de-cristal-aranha-de-cristal-golem-prismatico-vagalume-de-cristal-e-rastreador-reluzente"></a>
### Inimigos XVIII — Cavernas de Cristal: Morcego de Cristal, Aranha de Cristal, Golem Prismático, Vagalume de Cristal e Rastreador Reluzente
**Tamanho:** 1536×768 px · **Uso:** roster completo da masmorra Cavernas de Cristal (Região 3, fork com Templo Afundado, 5 inimigos regulares)

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: every creature must be drawn in strict side profile facing LEFT and only LEFT. For each one individually: head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. None of them may face right, face the viewer, or face away — check every single creature in the row before finishing, since even one facing the wrong way makes the whole sheet unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

Wide image, 5 creatures standing side by side with clear empty gaps between them so they can be cropped apart later (roughly a fifth of the width each — keep each one simple and readable at that scale). Same scale, same ground line, calm static pose.

1) Morcego de Cristal (facing left): a small bat with translucent blue crystal wings that catch the light, faceted crystalline body.
2) Aranha de Cristal (facing left): a spider with a body made of glassy blue crystal shards, legs like sharp crystal needles.
3) Golem Prismático (facing left): a tall humanoid golem built from stacked glowing prismatic crystal chunks, faint rainbow refraction along its edges.
4) Vagalume de Cristal (facing left): a tiny floating orb of crystalline light, trailing sparkling prismatic motes.
5) Rastreador Reluzente (facing left): a sleek crystal-scaled predator crouched low, faceted glinting hide, sharp crystal claws.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creatures. Canvas 1536×768 px, soft light from upper-left. No text, no watermark.
```

<a id="chefe-cavernas-de-cristal-soberana-de-cristal"></a>
### Chefe — Cavernas de Cristal: Soberana de Cristal
**Tamanho:** 768×768 px · **Uso:** boss da masmorra Cavernas de Cristal (Região 3), spawna na profundidade 36 com barra de vida própria no topo da tela de batalha

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: this creature must be drawn in strict side profile facing LEFT and only LEFT. Head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. It must not face right, face the viewer, or face away — this is a hard requirement, since a wrongly-facing sprite is unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

One large boss creature filling most of the frame, calm static threatening pose.

Soberana de Cristal, facing left: a majestic feminine crystalline being with a body of faceted glowing blue-white crystal, a jagged crystal crown, trailing shards floating around her like a halo.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creature. Canvas 768×768 px, soft light from upper-left. No text, no watermark.
```

<a id="inimigos-xix-covil-do-lobo-alfa-filhote-do-alfa-lobo-terrivel-perseguidor-da-neve-cacador-da-alcateia-e-lobo-presa-gelo"></a>
### Inimigos XIX — Covil do Lobo Alfa: Filhote do Alfa, Lobo Terrível, Perseguidor da Neve, Caçador da Alcateia e Lobo Presa-Gelo
**Tamanho:** 1536×768 px · **Uso:** roster completo da masmorra Covil do Lobo Alfa (Região 3, 5 inimigos regulares)

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: every creature must be drawn in strict side profile facing LEFT and only LEFT. For each one individually: head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. None of them may face right, face the viewer, or face away — check every single creature in the row before finishing, since even one facing the wrong way makes the whole sheet unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

Wide image, 5 creatures standing side by side with clear empty gaps between them so they can be cropped apart later (roughly a fifth of the width each — keep each one simple and readable at that scale). Same scale, same ground line, calm static pose.

1) Filhote do Alfa (facing left): a young grey wolf pup with oversized paws, alert ears, a scrappy eager stance.
2) Lobo Terrível (facing left): a large muscular dire wolf with shaggy dark-grey fur, oversized fangs, a heavy powerful build.
3) Perseguidor da Neve (facing left): a lean white-furred wolf crouched low in a hunting stance, sharp icy-blue eyes.
4) Caçador da Alcateia (facing left): a battle-scarred grey wolf with a notched ear, alert and coordinated stance, muscular frame.
5) Lobo Presa-Gelo (facing left): a pale blue-grey wolf with frost-rimed fangs and frosty breath, ice crystals clinging to its fur.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creatures. Canvas 1536×768 px, soft light from upper-left. No text, no watermark.
```

<a id="chefe-covil-do-lobo-alfa-alfa-o-terrivel"></a>
### Chefe — Covil do Lobo Alfa: Alfa, o Terrível
**Tamanho:** 768×768 px · **Uso:** boss da masmorra Covil do Lobo Alfa (Região 3), spawna na profundidade 38 com barra de vida própria no topo da tela de batalha

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: this creature must be drawn in strict side profile facing LEFT and only LEFT. Head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. It must not face right, face the viewer, or face away — this is a hard requirement, since a wrongly-facing sprite is unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

One large boss creature filling most of the frame, calm static threatening pose.

Alfa, o Terrível, facing left: an enormous dark-furred dire wolf towering over ordinary wolves, jagged scars across its muzzle, glowing amber eyes, bared oversized fangs, a commanding predatory stance.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creature. Canvas 768×768 px, soft light from upper-left. No text, no watermark.
```

<a id="inimigos-xx-catacumbas-reais-esqueleto-real-sentinela-da-cripta-nobre-ossudo-camareiro-espectral-e-cavaleiro-sepultado"></a>
### Inimigos XX — Catacumbas Reais: Esqueleto Real, Sentinela da Cripta, Nobre Ossudo, Camareiro Espectral e Cavaleiro Sepultado
**Tamanho:** 1536×768 px · **Uso:** roster completo da masmorra Catacumbas Reais (Região 3, 5 inimigos regulares)

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: every creature must be drawn in strict side profile facing LEFT and only LEFT. For each one individually: head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. None of them may face right, face the viewer, or face away — check every single creature in the row before finishing, since even one facing the wrong way makes the whole sheet unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

Wide image, 5 creatures standing side by side with clear empty gaps between them so they can be cropped apart later (roughly a fifth of the width each — keep each one simple and readable at that scale). Same scale, same ground line, calm static pose.

1) Esqueleto Real (facing left): an armored royal skeleton in tarnished gilded plate, gripping an ornate ceremonial longsword, a faded royal crest on the chest.
2) Sentinela da Cripta (facing left): a heavy stone crypt guardian statue holding a ceremonial halberd, weathered engravings across its armor.
3) Nobre Ossudo (facing left): a skeletal noble in tattered fine velvet robes, a rotted crown fragment, bony fingers adorned with rings.
4) Camareiro Espectral (facing left): a translucent ghostly chamberlain in faded court attire, a spectral tray still balanced on one arm, pale mournful glow.
5) Cavaleiro Sepultado (facing left): an entombed knight in rusted ceremonial plate, gripping a chipped royal blade, faint dust falling from the joints.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creatures. Canvas 1536×768 px, soft light from upper-left. No text, no watermark.
```

<a id="chefe-catacumbas-reais-lich-real"></a>
### Chefe — Catacumbas Reais: Lich Real
**Tamanho:** 768×768 px · **Uso:** boss da masmorra Catacumbas Reais (Região 3), spawna na profundidade 40 com barra de vida própria no topo da tela de batalha

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: this creature must be drawn in strict side profile facing LEFT and only LEFT. Head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. It must not face right, face the viewer, or face away — this is a hard requirement, since a wrongly-facing sprite is unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

One large boss creature filling most of the frame, calm static threatening pose.

Lich Real, facing left: a regal skeletal lich draped in tattered royal robes and a tarnished golden crown, glowing teal-green eye sockets, gripping an ornate necrotic scepter crackling with dark magic.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creature. Canvas 768×768 px, soft light from upper-left. No text, no watermark.
```

<a id="inimigos-xxi-poco-sem-fundo-rastejante-do-poco-tentaculo-do-vazio-espectro-afogante-perseguidor-abissal-e-habitante-oco"></a>
### Inimigos XXI — Poço sem Fundo: Rastejante do Poço, Tentáculo do Vazio, Espectro Afogante, Perseguidor Abissal e Habitante Oco
**Tamanho:** 1536×768 px · **Uso:** roster completo da masmorra especial Poço sem Fundo (Região 3, majoritariamente minibosses, 5 inimigos regulares)

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: every creature must be drawn in strict side profile facing LEFT and only LEFT. For each one individually: head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. None of them may face right, face the viewer, or face away — check every single creature in the row before finishing, since even one facing the wrong way makes the whole sheet unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

Wide image, 5 creatures standing side by side with clear empty gaps between them so they can be cropped apart later (roughly a fifth of the width each — keep each one simple and readable at that scale). Same scale, same ground line, calm static pose.

1) Rastejante do Poço (facing left): a hunched pale humanoid horror crawling low, elongated clawed limbs, milky blind eyes.
2) Tentáculo do Vazio (facing left): a writhing mass of dark purple-black tentacles emerging from a shapeless core, faint void-glow along the ridges.
3) Espectro Afogante (facing left): a translucent drowned specter reaching forward, dripping shadowy water, hollow drowning-scream expression.
4) Perseguidor Abissal (facing left): a sleek black many-limbed stalker with faint glowing violet eyes, low predatory crouch.
5) Habitante Oco (facing left): a gaunt hollow-faced humanoid wrapped in tattered dark rags, an unnervingly still posture.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creatures. Canvas 1536×768 px, soft light from upper-left. No text, no watermark.
```

<a id="chefe-poco-sem-fundo-o-que-habita-o-poco"></a>
### Chefe — Poço sem Fundo: O Que Habita o Poço
**Tamanho:** 768×768 px · **Uso:** chefe final da masmorra especial Poço sem Fundo (Região 3) — bem mais forte que os chefes das masmorras regulares da região, spawna na profundidade 42 com barra de vida própria no topo da tela de batalha

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: this creature must be drawn in strict side profile facing LEFT and only LEFT. Head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. It must not face right, face the viewer, or face away — this is a hard requirement, since a wrongly-facing sprite is unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

One large boss creature filling most of the frame, calm static threatening pose — noticeably larger and more menacing than a regular dungeon boss, to read as the strongest thing in the region.

O Que Habita o Poço, facing left: an immense formless horror of writhing black tendrils and a vaguely humanoid torso emerging from a bottomless void, countless faint glowing violet eyes scattered across its mass, an overwhelming ancient dread.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creature. Canvas 768×768 px, soft light from upper-left. No text, no watermark.
```

<a id="inimigos-xxii-covil-da-aranha-rainha-aranha-da-selva-perseguidor-de-seda-ninhada-de-aranhas-tecela-da-selva-e-cria-venenosa"></a>
### Inimigos XXII — Covil da Aranha-Rainha: Aranha da Selva, Perseguidor de Seda, Ninhada de Aranhas, Tecelã da Selva e Cria Venenosa
**Tamanho:** 1536×768 px · **Uso:** roster completo da masmorra Covil da Aranha-Rainha (Região 4 — Xilvana, 5 inimigos regulares)

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: every creature must be drawn in strict side profile facing LEFT and only LEFT. For each one individually: head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. None of them may face right, face the viewer, or face away — check every single creature in the row before finishing, since even one facing the wrong way makes the whole sheet unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

Wide image, 5 creatures standing side by side with clear empty gaps between them so they can be cropped apart later (roughly a fifth of the width each — keep each one simple and readable at that scale). Same scale, same ground line, calm static pose.

1) Aranha da Selva (facing left): a large mottled-green jungle spider with long spindly legs, glistening venomous fangs.
2) Perseguidor de Seda (facing left): a lean silk-wrapped spider-creature trailing loose webbing, quick low crouch.
3) Ninhada de Aranhas (facing left): a small cluster of tiny brown spiderlings scurrying together as one visual unit.
4) Tecelã da Selva (facing left): a large dark jungle weaver-spider with elaborate patterned markings, thick web-spinning abdomen.
5) Cria Venenosa (facing left): a small vividly-colored venomous spiderling with bright warning patterns, raised front legs.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creatures. Canvas 1536×768 px, soft light from upper-left. No text, no watermark.
```

<a id="chefe-covil-da-aranha-rainha-aranha-rainha"></a>
### Chefe — Covil da Aranha-Rainha: Aranha-Rainha
**Tamanho:** 768×768 px · **Uso:** boss da masmorra Covil da Aranha-Rainha (Região 4), spawna na profundidade 42 com barra de vida própria no topo da tela de batalha

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: this creature must be drawn in strict side profile facing LEFT and only LEFT. Head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. It must not face right, face the viewer, or face away — this is a hard requirement, since a wrongly-facing sprite is unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

One large boss creature filling most of the frame, calm static threatening pose.

Aranha-Rainha, facing left: a colossal jungle spider queen with a bulbous glistening dark-purple abdomen, eight sharp segmented legs, rows of gleaming eyes, dripping venomous fangs.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creature. Canvas 768×768 px, soft light from upper-left. No text, no watermark.
```

<a id="inimigos-xxiii-cidadela-em-ruinas-sentinela-em-ruinas-guerreiro-de-vinhas-golem-desmoronado-fantasma-da-selva-e-guardiao-coberto-de-vinhas"></a>
### Inimigos XXIII — Cidadela em Ruínas: Sentinela em Ruínas, Guerreiro de Vinhas, Golem Desmoronado, Fantasma da Selva e Guardião Coberto de Vinhas
**Tamanho:** 1536×768 px · **Uso:** roster completo da masmorra Cidadela em Ruínas (Região 4, 5 inimigos regulares)

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: every creature must be drawn in strict side profile facing LEFT and only LEFT. For each one individually: head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. None of them may face right, face the viewer, or face away — check every single creature in the row before finishing, since even one facing the wrong way makes the whole sheet unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

Wide image, 5 creatures standing side by side with clear empty gaps between them so they can be cropped apart later (roughly a fifth of the width each — keep each one simple and readable at that scale). Same scale, same ground line, calm static pose.

1) Sentinela em Ruínas (facing left): a crumbling stone sentinel statue overtaken by cracks and moss, gripping a broken ceremonial spear.
2) Guerreiro de Vinhas (facing left): a humanoid warrior whose body is woven from thick living jungle vines, thorny knuckles.
3) Golem Desmoronado (facing left): a hulking golem built from crumbling ruined masonry, chunks visibly falling away, glowing cracks.
4) Fantasma da Selva (facing left): a translucent green-glowing jungle phantom drifting low, wisps of mist trailing behind.
5) Guardião Coberto de Vinhas (facing left): a heavy stone guardian entirely swallowed by thick overgrown vines and flowers.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creatures. Canvas 1536×768 px, soft light from upper-left. No text, no watermark.
```

<a id="chefe-cidadela-em-ruinas-guardiao-da-cidadela"></a>
### Chefe — Cidadela em Ruínas: Guardião da Cidadela
**Tamanho:** 768×768 px · **Uso:** boss da masmorra Cidadela em Ruínas (Região 4), spawna na profundidade 44 com barra de vida própria no topo da tela de batalha

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: this creature must be drawn in strict side profile facing LEFT and only LEFT. Head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. It must not face right, face the viewer, or face away — this is a hard requirement, since a wrongly-facing sprite is unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

One large boss creature filling most of the frame, calm static threatening pose.

Guardião da Cidadela, facing left: an immense ancient stone guardian entwined with thick glowing jungle vines, ornate crumbling ceremonial armor plates, gripping a massive vine-wrapped stone warhammer.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creature. Canvas 768×768 px, soft light from upper-left. No text, no watermark.
```

<a id="inimigos-xxiv-santuario-profanado-sacerdote-profanado-idolo-profano-acolito-corrompido-estatua-enfeiticada-e-cultista-ritualistico"></a>
### Inimigos XXIV — Santuário Profanado: Sacerdote Profanado, Ídolo Profano, Acólito Corrompido, Estátua Enfeitiçada e Cultista Ritualístico
**Tamanho:** 1536×768 px · **Uso:** roster completo da masmorra Santuário Profanado (Região 4, fork com Mina de Obsidiana, 5 inimigos regulares)

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: every creature must be drawn in strict side profile facing LEFT and only LEFT. For each one individually: head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. None of them may face right, face the viewer, or face away — check every single creature in the row before finishing, since even one facing the wrong way makes the whole sheet unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

Wide image, 5 creatures standing side by side with clear empty gaps between them so they can be cropped apart later (roughly a fifth of the width each — keep each one simple and readable at that scale). Same scale, same ground line, calm static pose.

1) Sacerdote Profanado (facing left): a gaunt corrupted priest in torn dark ceremonial robes, defaced holy symbols, a faint sickly purple glow.
2) Ídolo Profano (facing left): a squat carved stone idol with a defaced grotesque face, dark ritual markings etched across its body.
3) Acólito Corrompido (facing left): a hooded corrupted acolyte gripping a jagged ritual dagger, eyes glowing faint purple.
4) Estátua Enfeitiçada (facing left): a cracked ceremonial statue animated by dark magic, glowing purple eyes, ritual chains draped across it.
5) Cultista Ritualístico (facing left): a robed cultist chanting with arms raised, dark tattoos glowing faintly along the exposed skin.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creatures. Canvas 1536×768 px, soft light from upper-left. No text, no watermark.
```

<a id="chefe-santuario-profanado-alto-sacerdote-profano"></a>
### Chefe — Santuário Profanado: Alto Sacerdote Profano
**Tamanho:** 768×768 px · **Uso:** boss da masmorra Santuário Profanado (Região 4), spawna na profundidade 46 com barra de vida própria no topo da tela de batalha

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: this creature must be drawn in strict side profile facing LEFT and only LEFT. Head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. It must not face right, face the viewer, or face away — this is a hard requirement, since a wrongly-facing sprite is unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

One large boss creature filling most of the frame, calm static threatening pose.

Alto Sacerdote Profano, facing left: a towering corrupted high priest in ornate torn dark-purple ceremonial vestments, a defaced golden ritual mask, gripping a twisted ceremonial staff crackling with profane energy.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creature. Canvas 768×768 px, soft light from upper-left. No text, no watermark.
```

<a id="inimigos-xxv-mina-de-obsidiana-golem-de-obsidiana-morcego-de-magma-mineiro-de-obsidiana-espectro-de-brasas-e-besouro-de-obsidiana"></a>
### Inimigos XXV — Mina de Obsidiana: Golem de Obsidiana, Morcego de Magma, Mineiro de Obsidiana, Espectro de Brasas e Besouro de Obsidiana
**Tamanho:** 1536×768 px · **Uso:** roster completo da masmorra Mina de Obsidiana (Região 4, fork com Santuário Profanado, 5 inimigos regulares)

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: every creature must be drawn in strict side profile facing LEFT and only LEFT. For each one individually: head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. None of them may face right, face the viewer, or face away — check every single creature in the row before finishing, since even one facing the wrong way makes the whole sheet unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

Wide image, 5 creatures standing side by side with clear empty gaps between them so they can be cropped apart later (roughly a fifth of the width each — keep each one simple and readable at that scale). Same scale, same ground line, calm static pose.

1) Golem de Obsidiana (facing left): a hulking humanoid golem carved from glossy black volcanic obsidian, faint orange glow through cracks.
2) Morcego de Magma (facing left): a small bat with wings that look like thin cooling magma, glowing orange veins across dark leathery skin.
3) Mineiro de Obsidiana (facing left): a soot-covered miner in scorched leather gear, gripping an obsidian-tipped pickaxe.
4) Espectro de Brasas (facing left): a translucent ember-orange specter trailing wisps of smoke and floating embers.
5) Besouro de Obsidiana (facing left): a large armored beetle with a glossy black obsidian shell, glowing orange seams between plates.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creatures. Canvas 1536×768 px, soft light from upper-left. No text, no watermark.
```

<a id="chefe-mina-de-obsidiana-colosso-de-obsidiana"></a>
### Chefe — Mina de Obsidiana: Colosso de Obsidiana
**Tamanho:** 768×768 px · **Uso:** boss da masmorra Mina de Obsidiana (Região 4), spawna na profundidade 46 com barra de vida própria no topo da tela de batalha

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: this creature must be drawn in strict side profile facing LEFT and only LEFT. Head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. It must not face right, face the viewer, or face away — this is a hard requirement, since a wrongly-facing sprite is unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

One large boss creature filling most of the frame, calm static threatening pose.

Colosso de Obsidiana, facing left: an immense hulking colossus of glossy black volcanic glass, deep glowing orange fissures running across its body like molten veins, massive obsidian fists.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creature. Canvas 768×768 px, soft light from upper-left. No text, no watermark.
```

<a id="inimigos-xxvi-selva-esquecida-guardiao-esquecido-predador-da-selva-vinha-ancestral-jaguar-selvagem-e-esporideo"></a>
### Inimigos XXVI — Selva Esquecida: Guardião Esquecido, Predador da Selva, Vinha Ancestral, Jaguar Selvagem e Esporídeo
**Tamanho:** 1536×768 px · **Uso:** roster completo da masmorra Selva Esquecida (Região 4, 5 inimigos regulares)

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: every creature must be drawn in strict side profile facing LEFT and only LEFT. For each one individually: head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. None of them may face right, face the viewer, or face away — check every single creature in the row before finishing, since even one facing the wrong way makes the whole sheet unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

Wide image, 5 creatures standing side by side with clear empty gaps between them so they can be cropped apart later (roughly a fifth of the width each — keep each one simple and readable at that scale). Same scale, same ground line, calm static pose.

1) Guardião Esquecido (facing left): an ancient forgotten stone guardian statue half-swallowed by giant roots, weathered carvings barely visible.
2) Predador da Selva (facing left): a lean muscular jungle predator beast with dark mottled hide, low stalking crouch, sharp claws.
3) Vinha Ancestral (facing left): a massive gnarled living vine creature coiled like a serpent, ancient bark-like texture, small glowing flowers.
4) Jaguar Selvagem (facing left): a powerful spotted wild jaguar crouched low, sharp fangs bared, alert golden eyes.
5) Esporídeo (facing left): a small mushroom-like creature covered in glowing spore pods, stubby fungal limbs.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creatures. Canvas 1536×768 px, soft light from upper-left. No text, no watermark.
```

<a id="chefe-selva-esquecida-colosso-esquecido"></a>
### Chefe — Selva Esquecida: Colosso Esquecido
**Tamanho:** 768×768 px · **Uso:** boss da masmorra Selva Esquecida (Região 4), spawna na profundidade 48 com barra de vida própria no topo da tela de batalha

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: this creature must be drawn in strict side profile facing LEFT and only LEFT. Head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. It must not face right, face the viewer, or face away — this is a hard requirement, since a wrongly-facing sprite is unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

One large boss creature filling most of the frame, calm static threatening pose.

Colosso Esquecido, facing left: an ancient towering colossus of stone and root fused together over untold ages, thick glowing vines pulsing across its cracked ancient surface, moss-covered shoulders.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creature. Canvas 768×768 px, soft light from upper-left. No text, no watermark.
```

<a id="inimigos-xxvii-fortaleza-dos-ossos-soldado-ossudo-arqueiro-ossudo-golem-de-medula-fera-catapulta-e-espectro-do-ossario"></a>
### Inimigos XXVII — Fortaleza dos Ossos: Soldado Ossudo, Arqueiro Ossudo, Golem de Medula, Fera Catapulta e Espectro do Ossário
**Tamanho:** 1536×768 px · **Uso:** roster completo da masmorra Fortaleza dos Ossos (Região 4, 5 inimigos regulares)

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: every creature must be drawn in strict side profile facing LEFT and only LEFT. For each one individually: head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. None of them may face right, face the viewer, or face away — check every single creature in the row before finishing, since even one facing the wrong way makes the whole sheet unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

Wide image, 5 creatures standing side by side with clear empty gaps between them so they can be cropped apart later (roughly a fifth of the width each — keep each one simple and readable at that scale). Same scale, same ground line, calm static pose.

1) Soldado Ossudo (facing left): an armored bone-construct soldier assembled from stacked bones and rib-plates, gripping a bone-hilted sword.
2) Arqueiro Ossudo (facing left): a lanky bone-construct archer drawing a bow carved from a large curved rib bone.
3) Golem de Medula (facing left): a hulking golem built from thick fused marrow-bones, faint pale glow seeping from the joints.
4) Fera Catapulta (facing left): a hunched bony beast with an oversized launching arm made of fused bone, coiled to fling debris.
5) Espectro do Ossário (facing left): a translucent pale specter drifting amid loose rattling bones, hollow mournful expression.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creatures. Canvas 1536×768 px, soft light from upper-left. No text, no watermark.
```

<a id="chefe-fortaleza-dos-ossos-senhor-de-guerra-ossudo"></a>
### Chefe — Fortaleza dos Ossos: Senhor de Guerra Ossudo
**Tamanho:** 768×768 px · **Uso:** boss da masmorra Fortaleza dos Ossos (Região 4), spawna na profundidade 50 com barra de vida própria no topo da tela de batalha

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: this creature must be drawn in strict side profile facing LEFT and only LEFT. Head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. It must not face right, face the viewer, or face away — this is a hard requirement, since a wrongly-facing sprite is unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

One large boss creature filling most of the frame, calm static threatening pose.

Senhor de Guerra Ossudo, facing left: an imposing bone-construct warlord clad in armor forged from fused giant bones, gripping a massive bone-bladed greatsword, a crown of jagged bone spikes.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creature. Canvas 768×768 px, soft light from upper-left. No text, no watermark.
```

<a id="inimigos-xxviii-torre-dos-ecos-espectro-do-eco-espectro-ressonante-horror-espelhado-sentinela-do-eco-e-cantico-oco"></a>
### Inimigos XXVIII — Torre dos Ecos: Espectro do Eco, Espectro Ressonante, Horror Espelhado, Sentinela do Eco e Cântico Oco
**Tamanho:** 1536×768 px · **Uso:** roster completo da masmorra especial Torre dos Ecos (Região 4, majoritariamente minibosses, 5 inimigos regulares)

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: every creature must be drawn in strict side profile facing LEFT and only LEFT. For each one individually: head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. None of them may face right, face the viewer, or face away — check every single creature in the row before finishing, since even one facing the wrong way makes the whole sheet unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

Wide image, 5 creatures standing side by side with clear empty gaps between them so they can be cropped apart later (roughly a fifth of the width each — keep each one simple and readable at that scale). Same scale, same ground line, calm static pose.

1) Espectro do Eco (facing left): a translucent violet-glowing specter that appears to shimmer with faint duplicate afterimages of itself.
2) Espectro Ressonante (facing left): a wavering ghostly figure surrounded by faint concentric sound-ripple glyphs.
3) Horror Espelhado (facing left): a distorted humanoid horror with a fractured mirror-like reflective surface for skin.
4) Sentinela do Eco (facing left): a tall stone sentinel etched with glowing runic sound-wave patterns, faint violet aura.
5) Cântico Oco (facing left): a gaunt hollow-mouthed wraith-like singer, faint musical glyphs drifting from its open jaw.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creatures. Canvas 1536×768 px, soft light from upper-left. No text, no watermark.
```

<a id="chefe-torre-dos-ecos-soberano-dos-ecos"></a>
### Chefe — Torre dos Ecos: Soberano dos Ecos
**Tamanho:** 768×768 px · **Uso:** chefe final da masmorra especial Torre dos Ecos (Região 4) — bem mais forte que os chefes das masmorras regulares da região, spawna na profundidade 52 com barra de vida própria no topo da tela de batalha

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: this creature must be drawn in strict side profile facing LEFT and only LEFT. Head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. It must not face right, face the viewer, or face away — this is a hard requirement, since a wrongly-facing sprite is unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

One large boss creature filling most of the frame, calm static threatening pose — noticeably larger and more menacing than a regular dungeon boss, to read as the strongest thing in the region.

Soberano dos Ecos, facing left: a tall spectral sovereign wrapped in layered translucent violet robes that seem to echo into faint duplicate silhouettes, a crown of resonating glowing runes, an aura of rippling sound-wave energy.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creature. Canvas 768×768 px, soft light from upper-left. No text, no watermark.
```

<a id="inimigos-xxix-abismo-de-gelo-espectro-glacial-elemental-de-gelo-abissal-rastejante-gelido-behemoth-de-gelo-e-gelido-oco"></a>
### Inimigos XXIX — Abismo de Gelo: Espectro Glacial, Elemental de Gelo Abissal, Rastejante Gélido, Behemoth de Gelo e Gélido Oco
**Tamanho:** 1536×768 px · **Uso:** roster completo da masmorra Abismo de Gelo (Região 5 — Ignares, 5 inimigos regulares)

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: every creature must be drawn in strict side profile facing LEFT and only LEFT. For each one individually: head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. None of them may face right, face the viewer, or face away — check every single creature in the row before finishing, since even one facing the wrong way makes the whole sheet unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

Wide image, 5 creatures standing side by side with clear empty gaps between them so they can be cropped apart later (roughly a fifth of the width each — keep each one simple and readable at that scale). Same scale, same ground line, calm static pose.

1) Espectro Glacial (facing left): a translucent deep-blue glacial specter trailing sharp icicle shards, hollow frozen eyes.
2) Elemental de Gelo Abissal (facing left): a hulking mass of dark abyssal ice with faint deep-blue inner glow, jagged frozen edges.
3) Rastejante Gélido (facing left): a low pale-blue crawling ice-beast with elongated frost-covered limbs.
4) Behemoth de Gelo (facing left): a massive hulking beast entirely encased in thick blue glacial ice, heavy lumbering frame.
5) Gélido Oco (facing left): a gaunt hollow ice-wraith with a cracked frozen chest cavity, faint cold mist seeping out.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creatures. Canvas 1536×768 px, soft light from upper-left. No text, no watermark.
```

<a id="chefe-abismo-de-gelo-senhor-do-abismo-glacial"></a>
### Chefe — Abismo de Gelo: Senhor do Abismo Glacial
**Tamanho:** 768×768 px · **Uso:** boss da masmorra Abismo de Gelo (Região 5), spawna na profundidade 52 com barra de vida própria no topo da tela de batalha

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: this creature must be drawn in strict side profile facing LEFT and only LEFT. Head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. It must not face right, face the viewer, or face away — this is a hard requirement, since a wrongly-facing sprite is unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

One large boss creature filling most of the frame, calm static threatening pose.

Senhor do Abismo Glacial, facing left: an immense towering lord of glacial ice, a jagged crown of deep-blue icicles, a body of cracked living glacier pulsing with an inner abyssal glow, trailing freezing mist.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creature. Canvas 768×768 px, soft light from upper-left. No text, no watermark.
```

<a id="inimigos-xxx-ruinas-vulcanicas-golem-de-magma-espectro-de-cinzas-morcego-de-brasas-perseguidor-vulcanico-e-cao-de-cinzas"></a>
### Inimigos XXX — Ruínas Vulcânicas: Golem de Magma, Espectro de Cinzas, Morcego de Brasas, Perseguidor Vulcânico e Cão de Cinzas
**Tamanho:** 1536×768 px · **Uso:** roster completo da masmorra Ruínas Vulcânicas (Região 5, 5 inimigos regulares)

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: every creature must be drawn in strict side profile facing LEFT and only LEFT. For each one individually: head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. None of them may face right, face the viewer, or face away — check every single creature in the row before finishing, since even one facing the wrong way makes the whole sheet unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

Wide image, 5 creatures standing side by side with clear empty gaps between them so they can be cropped apart later (roughly a fifth of the width each — keep each one simple and readable at that scale). Same scale, same ground line, calm static pose.

1) Golem de Magma (facing left): a hulking humanoid golem of cracked dark rock with molten orange magma glowing through the fissures.
2) Espectro de Cinzas (facing left): a translucent grey-ash specter trailing drifting embers and soot.
3) Morcego de Brasas (facing left): a small bat with wings like thin glowing embers, a faint orange-red glow along the edges.
4) Perseguidor Vulcânico (facing left): a lean charcoal-black predator beast with glowing orange cracks along its hide, low stalking crouch.
5) Cão de Cinzas (facing left): a lean ash-grey hound with smoldering ember eyes, faint smoke trailing from its jaws.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creatures. Canvas 1536×768 px, soft light from upper-left. No text, no watermark.
```

<a id="chefe-ruinas-vulcanicas-colosso-infernal"></a>
### Chefe — Ruínas Vulcânicas: Colosso Infernal
**Tamanho:** 768×768 px · **Uso:** boss da masmorra Ruínas Vulcânicas (Região 5), spawna na profundidade 54 com barra de vida própria no topo da tela de batalha

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: this creature must be drawn in strict side profile facing LEFT and only LEFT. Head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. It must not face right, face the viewer, or face away — this is a hard requirement, since a wrongly-facing sprite is unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

One large boss creature filling most of the frame, calm static threatening pose.

Colosso Infernal, facing left: a massive towering colossus of cracked black volcanic rock, glowing molten-orange fissures running across its entire body like veins of fire, embers drifting off its shoulders.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creature. Canvas 768×768 px, soft light from upper-left. No text, no watermark.
```

<a id="inimigos-xxxi-covil-do-dragao-anciao-draguinho-anciao-cultista-draconico-anciao-serpente-escamosa-guardiao-draconico-e-draque-de-brasas"></a>
### Inimigos XXXI — Covil do Dragão Ancião: Draguinho Ancião, Cultista Dracônico Ancião, Serpente Escamosa, Guardião Dracônico e Draque de Brasas
**Tamanho:** 1536×768 px · **Uso:** roster completo da masmorra Covil do Dragão Ancião (Região 5, fork com Salão dos Titãs, 5 inimigos regulares)

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: every creature must be drawn in strict side profile facing LEFT and only LEFT. For each one individually: head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. None of them may face right, face the viewer, or face away — check every single creature in the row before finishing, since even one facing the wrong way makes the whole sheet unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

Wide image, 5 creatures standing side by side with clear empty gaps between them so they can be cropped apart later (roughly a fifth of the width each — keep each one simple and readable at that scale). Same scale, same ground line, calm static pose.

1) Draguinho Ancião (facing left): a small dark-red winged drakeling with old weathered scales, faint smoke curling from its nostrils.
2) Cultista Dracônico Ancião (facing left): a robed elder cultist adorned with dragon-scale trinkets, gripping a scale-wrapped ritual staff.
3) Serpente Escamosa (facing left): a long sinewy dark-green scaled serpent with small clawed forelimbs, sharp fangs.
4) Guardião Dracônico (facing left): a heavily armored draconic guardian beast with thick teal scales and a spiked tail.
5) Draque de Brasas (facing left): a small orange-red winged drake wreathed in faint smoldering embers.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creatures. Canvas 1536×768 px, soft light from upper-left. No text, no watermark.
```

<a id="chefe-covil-do-dragao-anciao-dragao-anciao"></a>
### Chefe — Covil do Dragão Ancião: Dragão Ancião
**Tamanho:** 768×768 px · **Uso:** boss da masmorra Covil do Dragão Ancião (Região 5), spawna na profundidade 56 com barra de vida própria no topo da tela de batalha

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: this creature must be drawn in strict side profile facing LEFT and only LEFT. Head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. It must not face right, face the viewer, or face away — this is a hard requirement, since a wrongly-facing sprite is unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

One large boss creature filling most of the frame, calm static threatening pose — noticeably larger and more ancient-looking than the young dragon boss from Covil dos Dragões in Região 2, with weathered battle-worn scales and a long white beard-like set of chin barbels to sell its great age.

Dragão Ancião, facing left: an immense ancient dark-red dragon with huge weathered scales, long curved horns, glowing amber eyes full of age-old malice, wisps of smoke escaping between its fangs.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creature. Canvas 768×768 px, soft light from upper-left. No text, no watermark.
```

<a id="inimigos-xxxii-salao-dos-titas-guardiao-titanico-colosso-de-pedra-sentinela-ancestral-golem-runico-e-vigia-titanico"></a>
### Inimigos XXXII — Salão dos Titãs: Guardião Titânico, Colosso de Pedra, Sentinela Ancestral, Golem Rúnico e Vigia Titânico
**Tamanho:** 1536×768 px · **Uso:** roster completo da masmorra Salão dos Titãs (Região 5, fork com Covil do Dragão Ancião, 5 inimigos regulares)

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: every creature must be drawn in strict side profile facing LEFT and only LEFT. For each one individually: head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. None of them may face right, face the viewer, or face away — check every single creature in the row before finishing, since even one facing the wrong way makes the whole sheet unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

Wide image, 5 creatures standing side by side with clear empty gaps between them so they can be cropped apart later (roughly a fifth of the width each — keep each one simple and readable at that scale). Same scale, same ground line, calm static pose.

1) Guardião Titânico (facing left): a massive stone-and-bronze titanic guardian statue with weathered ancient engravings, heavy fists.
2) Colosso de Pedra (facing left): a hulking colossus built from stacked ancient grey megaliths, faint glowing seams between the blocks.
3) Sentinela Ancestral (facing left): a tall slender ancient stone sentinel crackling with faint golden arcane energy along its limbs.
4) Golem Rúnico (facing left): a heavy stone golem covered in glowing golden runic engravings across its chest and arms.
5) Vigia Titânico (facing left): a broad-shouldered titanic warden statue gripping a massive ancient stone spear.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creatures. Canvas 1536×768 px, soft light from upper-left. No text, no watermark.
```

<a id="chefe-salao-dos-titas-tita-caido"></a>
### Chefe — Salão dos Titãs: Titã Caído
**Tamanho:** 768×768 px · **Uso:** boss da masmorra Salão dos Titãs (Região 5), spawna na profundidade 56 com barra de vida própria no topo da tela de batalha

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: this creature must be drawn in strict side profile facing LEFT and only LEFT. Head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. It must not face right, face the viewer, or face away — this is a hard requirement, since a wrongly-facing sprite is unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

One large boss creature filling most of the frame, calm static threatening pose.

Titã Caído, facing left: a colossal ancient titan of cracked grey stone and tarnished bronze plating, faint golden runic light glowing from deep fissures, a weathered fallen-god presence, gripping a massive ancient warhammer.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creature. Canvas 768×768 px, soft light from upper-left. No text, no watermark.
```

<a id="inimigos-xxxiii-necropole-real-espectro-real-guarda-acinzentado-embalsamador-amaldicoado-mumia-real-e-arauto-da-morte"></a>
### Inimigos XXXIII — Necrópole Real: Espectro Real, Guarda Acinzentado, Embalsamador Amaldiçoado, Múmia Real e Arauto da Morte
**Tamanho:** 1536×768 px · **Uso:** roster completo da masmorra Necrópole Real (Região 5, 5 inimigos regulares)

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: every creature must be drawn in strict side profile facing LEFT and only LEFT. For each one individually: head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. None of them may face right, face the viewer, or face away — check every single creature in the row before finishing, since even one facing the wrong way makes the whole sheet unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

Wide image, 5 creatures standing side by side with clear empty gaps between them so they can be cropped apart later (roughly a fifth of the width each — keep each one simple and readable at that scale). Same scale, same ground line, calm static pose.

1) Espectro Real (facing left): a translucent royal specter draped in faded once-golden burial shrouds, a faint regal glow.
2) Guarda Acinzentado (facing left): a heavily armored ash-grey mummified guard in ceremonial plate, gripping a ceremonial khopesh.
3) Embalsamador Amaldiçoado (facing left): a gaunt cursed embalmer wrapped in stained ritual bandages, carrying a jar of dark toxins.
4) Múmia Real (facing left): a regal mummy wrapped in gilded ceremonial bandages, a tarnished golden burial mask.
5) Arauto da Morte (facing left): a tall gaunt robed herald with a skeletal face beneath a dark hood, gripping a ceremonial scythe-staff.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creatures. Canvas 1536×768 px, soft light from upper-left. No text, no watermark.
```

<a id="chefe-necropole-real-necromante-real"></a>
### Chefe — Necrópole Real: Necromante Real
**Tamanho:** 768×768 px · **Uso:** boss da masmorra Necrópole Real (Região 5), spawna na profundidade 58 com barra de vida própria no topo da tela de batalha

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: this creature must be drawn in strict side profile facing LEFT and only LEFT. Head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. It must not face right, face the viewer, or face away — this is a hard requirement, since a wrongly-facing sprite is unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

One large boss creature filling most of the frame, calm static threatening pose.

Necromante Real, facing left: a regal skeletal-faced necromancer draped in tattered golden royal burial robes, a jeweled dark crown, gripping an ornate scepter-staff crackling with necrotic green energy.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creature. Canvas 768×768 px, soft light from upper-left. No text, no watermark.
```

<a id="inimigos-xxxiv-palacio-submerso-cortesao-afogado-guarda-submerso-espectro-das-mares-horror-de-coral-e-acolito-das-profundezas"></a>
### Inimigos XXXIV — Palácio Submerso: Cortesão Afogado, Guarda Submerso, Espectro das Marés, Horror de Coral e Acólito das Profundezas
**Tamanho:** 1536×768 px · **Uso:** roster completo da masmorra Palácio Submerso (Região 5, 5 inimigos regulares)

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: every creature must be drawn in strict side profile facing LEFT and only LEFT. For each one individually: head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. None of them may face right, face the viewer, or face away — check every single creature in the row before finishing, since even one facing the wrong way makes the whole sheet unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

Wide image, 5 creatures standing side by side with clear empty gaps between them so they can be cropped apart later (roughly a fifth of the width each — keep each one simple and readable at that scale). Same scale, same ground line, calm static pose.

1) Cortesão Afogado (facing left): a bloated drowned courtier in once-fine waterlogged court attire, pale blue-grey skin, dripping wet.
2) Guarda Submerso (facing left): a heavily armored drowned palace guard encrusted with barnacles, gripping a coral-crusted spear.
3) Espectro das Marés (facing left): a translucent watery specter shaped like a swirling tide, dark teal glow, flowing kelp-like tendrils.
4) Horror de Coral (facing left): a jagged coral-encrusted horror with sharp branching coral limbs, dripping seawater.
5) Acólito das Profundezas (facing left): a robed deep-sea cultist with pale webbed hands, faint bioluminescent markings.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creatures. Canvas 1536×768 px, soft light from upper-left. No text, no watermark.
```

<a id="chefe-palacio-submerso-monarca-afogado"></a>
### Chefe — Palácio Submerso: Monarca Afogado
**Tamanho:** 768×768 px · **Uso:** boss da masmorra Palácio Submerso (Região 5), spawna na profundidade 60 com barra de vida própria no topo da tela de batalha

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: this creature must be drawn in strict side profile facing LEFT and only LEFT. Head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. It must not face right, face the viewer, or face away — this is a hard requirement, since a wrongly-facing sprite is unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

One large boss creature filling most of the frame, calm static threatening pose.

Monarca Afogado, facing left: a towering drowned monarch draped in tattered waterlogged royal robes and a coral-encrusted crown, pale blue-grey bloated skin, gripping an ornate trident-scepter, faint teal bioluminescent glow.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creature. Canvas 768×768 px, soft light from upper-left. No text, no watermark.
```

<a id="inimigos-xxxv-arena-do-campeao-gladiador-campeao-fera-campea-da-arena-duelista-veterano-senhor-de-guerra-da-arena-e-campeao-ensanguentado"></a>
### Inimigos XXXV — Arena do Campeão: Gladiador Campeão, Fera Campeã da Arena, Duelista Veterano, Senhor de Guerra da Arena e Campeão Ensanguentado
**Tamanho:** 1536×768 px · **Uso:** roster completo da masmorra especial Arena do Campeão (Região 5, majoritariamente minibosses, 5 inimigos regulares)

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: every creature must be drawn in strict side profile facing LEFT and only LEFT. For each one individually: head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. None of them may face right, face the viewer, or face away — check every single creature in the row before finishing, since even one facing the wrong way makes the whole sheet unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

Wide image, 5 creatures standing side by side with clear empty gaps between them so they can be cropped apart later (roughly a fifth of the width each — keep each one simple and readable at that scale). Same scale, same ground line, calm static pose.

1) Gladiador Campeão (facing left): a heavily muscled champion gladiator in ornate battle-scarred red-and-bronze armor, gripping a notched longsword.
2) Fera Campeã da Arena (facing left): a powerful muscular arena beast with a dark scarred hide, broken chains hanging from a spiked collar.
3) Duelista Veterano (facing left): a lean scarred veteran duelist in worn leather, gripping twin curved blades, confident stance.
4) Senhor de Guerra da Arena (facing left): a broad-shouldered arena warlord in heavy spiked armor, gripping a massive warhammer.
5) Campeão Ensanguentado (facing left): a blood-spattered battle-worn champion in cracked armor, gripping a notched greatsword, fierce grin.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creatures. Canvas 1536×768 px, soft light from upper-left. No text, no watermark.
```

<a id="chefe-arena-do-campeao-campeao-eterno"></a>
### Chefe — Arena do Campeão: Campeão Eterno
**Tamanho:** 768×768 px · **Uso:** chefe final da masmorra especial Arena do Campeão (Região 5) — bem mais forte que os chefes das masmorras regulares da região, spawna na profundidade 62 com barra de vida própria no topo da tela de batalha

```
IMPORTANT — the single most critical rule in this prompt, more important than any other detail: this creature must be drawn in strict side profile facing LEFT and only LEFT. Head, face, eyes, mouth/snout, and front legs point toward the LEFT edge of the canvas; back, tail, and hind legs point toward the RIGHT edge. It must not face right, face the viewer, or face away — this is a hard requirement, since a wrongly-facing sprite is unusable in the game.

2D pixel art game sprite. Crisp hard-edged pixels, no anti-aliasing, no blur. Thin dark outline. Flat shading, 2-3 tones per surface. Sharp, readable style like Octopath Traveler or Eastward — real pixel art made of visible pixel blocks, not a painting, not anime, not 3D.

One large boss creature filling most of the frame, calm static threatening pose — noticeably larger and more menacing than a regular dungeon boss, to read as the strongest thing in the region.

Campeão Eterno, facing left: an immense legendary undefeated champion in ornate battle-worn dark-red-and-gold armor covered in countless ancient battle scars, a tall horned champion's helm, gripping a massive legendary greatsword wreathed in a faint golden aura.

Flat magenta background (#FF00FF), no scenery, no shadow, no gradient. Magenta only on the background, never on the creature. Canvas 768×768 px, soft light from upper-left. No text, no watermark.
```

---

<a id="cenas"></a>
## Cenas

Ilustração completa, preenchendo a tela inteira — sem fundo magenta, não é para recortar.

<a id="cena-do-reino-tela-de-visao-geral-do-reino"></a>
### Cena do Reino — Tela de Visão Geral do Reino
**Tamanho:** 1536×640 px · **Uso:** substitui o desenho procedural do castelo na tela do Reino

```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A wide nighttime kingdom scene viewed from just outside the walls: a fortified stone castle with two towers and a lit gatehouse, silhouetted against a deep indigo night sky. A large pale moon with faint craters sits above the towers, surrounded by scattered twinkling stars. Rolling dark hills in the distance. Warm orange torchlight glow beside the castle gate. A few thin wisps of ground fog drifting near the base of the walls.

This is a complete, self-contained illustration meant to fill the entire canvas edge-to-edge — unlike the sprite sheets above, this one should NOT have a magenta background and should NOT be treated as a cutout; it's a finished scene, not something to key out. Wide canvas, 1536×640 px. No text, no watermark, no UI elements, no frame or border.
```

<a id="mapa-de-construcoes-tela-de-reino-construcoes"></a>
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

<a id="cena-do-ferreiro-tela-do-ferreiro-aberta-pela-forja"></a>
### Cena do Ferreiro — Tela do Ferreiro (aberta pela Forja)
**Tamanho:** 1536×1536 px (quadrado) · **Uso:** banner grande em tela cheia no topo da tela do Ferreiro (aberta ao tocar "Conversar com o Ferreiro" no balão da Forja) — substitui o placeholder de brilho em CSS. Ocupa ~44% da altura da tela do celular, largura total (`object-fit: cover`), então o quadrado garante uma sobra segura pra cortar tanto em celulares mais largos quanto mais altos sem perder o assunto principal. O nome "Ferreiro" e o botão de fechar ficam sobrepostos no canto superior, com um gradiente escuro por trás pra legibilidade — não precisa deixar essa área vazia de propósito.

```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and other scenes (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A close interior view of the Forja's workshop at night — not the wide courtyard from the Mapa de Construções scene, but a tighter shot inside the forge building itself. A stocky blacksmith NPC (weathered face, leather apron over simple work clothes, thick forearms) stands at a glowing anvil roughly centered in the frame, mid-swing with a hammer or looking toward the viewer with a friendly, gruff expression. Behind him, a lit furnace glows deep orange, casting warm light and drifting sparks across the scene. Stone walls hung with tool racks, tongs, and a few finished weapons and shields.

Composition: keep the blacksmith and anvil — the main subject — comfortably within the center 70% of the square canvas, since the image will be cropped to different aspect ratios (sometimes wider, sometimes taller) depending on the player's screen. Don't place anything essential right at the edges.

This is a complete, self-contained illustration meant to fill the canvas edge-to-edge — no magenta background, not a cutout. Square canvas, 1536×1536 px. No text, no watermark, no UI elements, no frame or border.
```

<a id="cena-do-mercador-tela-do-mercador-aberta-pela-construcao-mercador"></a>
### Cena do Mercador — Tela do Mercador (aberta pela construção Mercador)
**Tamanho:** 1536×1536 px (quadrado) · **Uso:** banner grande em tela cheia no topo da tela do Mercador (aberta ao tocar "Conversar com o Mercador" no balão da construção) — substitui o placeholder de gradiente liso em CSS usado hoje. Mesmo tratamento do Ferreiro: ocupa ~44% da altura da tela do celular, largura total (`object-fit: cover`), quadrado garante sobra segura pra cortar em telas mais largas ou mais altas. Nome "Mercador" e botão de fechar ficam sobrepostos no canto superior, com gradiente escuro por trás pra legibilidade.

```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and other scenes (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A close view of a market stall at night, lit by a warm lantern hanging from the awning post. A shrewd, friendly merchant NPC (weathered traveling cloak over simple tunic, a coin pouch at the belt, maybe a pair of spectacles pushed up on the forehead) stands behind a wooden counter roughly centered in the frame, gesturing toward their wares or looking toward the viewer with an inviting, sly smile. The counter is covered with goods: a couple of glass potion bottles glowing faintly red, a coiled rope, a small chest with scattered coins, a shield leaning against a crate. Wooden crates and barrels stacked to the sides, a striped canvas awning overhead.

Composition: keep the merchant and counter — the main subject — comfortably within the center 70% of the square canvas, since the image will be cropped to different aspect ratios depending on the player's screen. Don't place anything essential right at the edges.

This is a complete, self-contained illustration meant to fill the canvas edge-to-edge — no magenta background, not a cutout. Square canvas, 1536×1536 px. No text, no watermark, no UI elements, no frame or border.
```

<a id="cena-de-titulo-tela-inicial-logo-menu"></a>
### Cena de Título — Tela Inicial (logo + menu)
**Tamanho:** 1536×1536 px (quadrado) · **Uso:** fundo em tela cheia atrás do logo do jogo, do texto de apresentação e dos botões "Continuar Jornada"/"Nova Jornada" na tela inicial (`TitleScreen.tsx`) — substitui o fundo liso `bg-nightsky` usado hoje. Mesmo tratamento do Ferreiro/Mercador: quadrado garante sobra segura pra cortar (`object-fit: cover`) em telas mais largas ou mais altas. O logo do jogo, o texto e os botões ficam centralizados por cima, então a faixa vertical central da imagem deve ficar visualmente mais calma (menos detalhe, tons mais escuros) pra não brigar com esses elementos — o jogo já aplica um leve gradiente escuro por trás deles, mas a arte não deve depender só disso pra ficar legível.

```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and other scenes (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

An epic wide-shot fantasy vista at night, tying together the game's two halves — "Reino" and "Masmorras". On the upper-left, a fortified castle with lit towers sits atop a distant hill, warm torchlight glowing from its windows. On the lower-right, jagged rocky terrain descends into the mouth of a dark dungeon entrance, faint eerie green-blue light seeping out from within. Between them, a moonlit valley with rolling hills, sparse dead trees, and drifting mist. A large pale moon with faint craters hangs in a deep indigo starry sky, positioned upper-center to upper-right.

Composition: keep the busy, detailed elements (castle, dungeon mouth, silhouetted trees) pushed toward the four corners and edges of the canvas. The vertical center third of the image should read as comparatively calm and dark — open sky, distant mist, or plain shadowed hillside — since the game's logo, tagline and menu buttons sit on top of that area and need to stay readable without a heavy overlay box.

This is a complete, self-contained illustration meant to fill the canvas edge-to-edge — no magenta background, not a cutout. Square canvas, 1536×1536 px. No text, no watermark, no UI elements, no frame or border.
```

<a id="mapa-de-masmorras-tela-de-selecao-de-masmorra-7-imagens-uma-por-regiao"></a>
### Mapa de Masmorras — Tela de seleção de masmorra (7 imagens, uma por região)

As 7 imagens abaixo empilham verticalmente no jogo formando um único caminho de exploração, com scroll — Região 1 (Valdren) embaixo, Região 7 (Aetherion) no topo, o jogador rola a tela pra cima conforme sobe de nível. Cada prompt já está completo e pronto pra colar, sem precisar combinar com nenhum outro bloco.

<a id="regiao-1-valdren-nivel-1-10"></a>
### Região 1 — Valdren (nível 1-10)
**Tamanho:** 1024×2560 px · **Uso:** primeiro trecho (mais baixo) do Mapa de Masmorras

```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and Kingdom scene (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A tall vertical dungeon-selection map segment — this is the FIRST (lowest) of 7 stacked regions forming one long exploration path, so the path should exit off the top edge of the canvas continuing upward (no need to connect at the bottom, this is the starting point). A winding dirt path connects distinct location markers from the bottom of the canvas to the top. Sunny grassy plains and moss-covered ancient ruins near the kingdom's entrance, tall grass, warm inviting daylight.

Location markers along the path, bottom to top, each a small distinct landmark with a wooden/parchment sign bearing its Portuguese name (small spelling mistakes in the text are acceptable): 1) "Ruínas Superficiais" — an open sunlit stone ruin. 2) "Caverna dos Goblins" — a cave mouth decorated with crude tribal totems. 3) "Cripta do Tesouro" — a crypt with a half-open golden door, marked with a glowing rune (this one is special — give it a distinct golden magical glow the others don't have). 4) "Pântano Podre" — dead trees rising from stagnant murky water. 5) "Covil de Aranhas" — a rocky crevice thick with spiderwebs.

Scatter 2 extra fog-shrouded silhouette markers with no legible name near the edges of the image — reserved space for future content. This is a complete, self-contained background illustration — no magenta background, not meant to be cut out or keyed. No UI elements, no frame, no extra text beyond the small location name signs described above. Vertical canvas, 1024×2560 px.
```

<a id="regiao-2-umbralia-nivel-11-20"></a>
### Região 2 — Umbrália (nível 11-20)
**Tamanho:** 1024×2560 px · **Uso:** segundo trecho do Mapa de Masmorras

```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and Kingdom scene (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A tall vertical dungeon-selection map segment — this is the SECOND of 7 stacked regions forming one long exploration path, so the path enters from the bottom edge of the canvas and exits off the top edge, continuing both directions. A winding path connects distinct location markers from bottom to top, transitioning into a dense, shadowy forest at dusk, low ground fog drifting between the trees, distant ruined towers silhouetted against an orange-purple sunset sky.

Location markers along the path, bottom to top, each a small distinct landmark with a wooden/parchment sign bearing its Portuguese name (small spelling mistakes in the text are acceptable): 1) "Torre Amaldiçoada" — a crooked tower with glowing purple windows, marked with a distinct glowing runic aura (this one is special). 2) "Minas Abandonadas" — a mineshaft entrance with rusted rail tracks. 3) "Floresta Amaldiçoada" — twisted trees with faint glowing eyes in the darkness. 4) the path visibly FORKS here into two side-by-side markers before rejoining: "Covil dos Dragões" — a volcanic cave mouth ringed with scales, AND "Necrópole Esquecida" — a rusted graveyard gate. 5) "Ruínas Élficas" — vine-covered elven stone columns. 6) "Arena de Sangue" — a circular stone arena with hanging chains, marked with a distinct glowing red runic aura (this one is special).

Scatter 2 extra fog-shrouded silhouette markers with no legible name near the edges of the image — reserved space for future content. This is a complete, self-contained background illustration — no magenta background, not meant to be cut out or keyed. No UI elements, no frame, no extra text beyond the small location name signs described above. Vertical canvas, 1024×2560 px.
```

<a id="regiao-3-thurgard-nivel-21-30"></a>
### Região 3 — Thurgard (nível 21-30)
**Tamanho:** 1024×2560 px · **Uso:** terceiro trecho do Mapa de Masmorras

```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and Kingdom scene (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A tall vertical dungeon-selection map segment — this is the THIRD of 7 stacked regions forming one long exploration path, so the path enters from the bottom edge of the canvas and exits off the top edge, continuing both directions. A winding snow-dusted path connects distinct location markers from bottom to top, through cold windswept mountain slopes, visible drifting wind and snow, abandoned orc war-camps in the snow, overcast grey-blue sky.

Location markers along the path, bottom to top, each a small distinct landmark with a wooden/parchment sign bearing its Portuguese name (small spelling mistakes in the text are acceptable): 1) "Fortaleza Orc" — a wooden palisade decorated with skulls. 2) "Labirinto de Gelo" — walls of translucent blue ice. 3) the path visibly FORKS here into two side-by-side markers before rejoining: "Templo Afundado" — a temple half-submerged in a frozen lake, AND "Cavernas de Cristal" — a cave glittering with blue crystals. 4) "Covil do Lobo Alfa" — a den between rocks with huge paw prints in the snow. 5) "Catacumbas Reais" — stone stairs descending under a royal tomb. 6) "Poço sem Fundo" — a stone well with a chain swinging into darkness, marked with a distinct glowing runic aura (this one is special).

Scatter 2 extra fog-shrouded silhouette markers with no legible name near the edges of the image — reserved space for future content. This is a complete, self-contained background illustration — no magenta background, not meant to be cut out or keyed. No UI elements, no frame, no extra text beyond the small location name signs described above. Vertical canvas, 1024×2560 px.
```

<a id="regiao-4-xilvana-nivel-31-40"></a>
### Região 4 — Xilvana (nível 31-40)
**Tamanho:** 1024×2560 px · **Uso:** quarto trecho do Mapa de Masmorras

```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and Kingdom scene (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A tall vertical dungeon-selection map segment — this is the FOURTH of 7 stacked regions forming one long exploration path, so the path enters from the bottom edge of the canvas and exits off the top edge, continuing both directions. A winding path connects distinct location markers from bottom to top, through a dense humid jungle reclaiming ancient ruins, giant roots swallowing stone, warm green-tinted light filtering through the canopy, thick haze.

Location markers along the path, bottom to top, each a small distinct landmark with a wooden/parchment sign bearing its Portuguese name (small spelling mistakes in the text are acceptable): 1) "Covil da Aranha-Rainha" — a giant web draped over a grotto. 2) "Cidadela em Ruínas" — a crumbling vine-covered wall. 3) the path visibly FORKS here into two side-by-side markers before rejoining: "Santuário Profanado" — a broken altar with defaced symbols, AND "Mina de Obsidiana" — glossy black volcanic rock. 4) "Selva Esquecida" — a stone statue engulfed by roots. 5) "Fortaleza dos Ossos" — a wall built from stacked giant bones. 6) "Torre dos Ecos" — a slender tower with light echoing off its runes, marked with a distinct glowing runic aura (this one is special).

Scatter 2 extra fog-shrouded silhouette markers with no legible name near the edges of the image — reserved space for future content. This is a complete, self-contained background illustration — no magenta background, not meant to be cut out or keyed. No UI elements, no frame, no extra text beyond the small location name signs described above. Vertical canvas, 1024×2560 px.
```

<a id="regiao-5-ignares-nivel-41-50"></a>
### Região 5 — Ignares (nível 41-50)
**Tamanho:** 1024×2560 px · **Uso:** quinto trecho do Mapa de Masmorras

```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and Kingdom scene (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A tall vertical dungeon-selection map segment — this is the FIFTH of 7 stacked regions forming one long exploration path, so the path enters from the bottom edge of the canvas and exits off the top edge, continuing both directions. A winding path connects distinct location markers from bottom to top, through an arid volcanic landscape meeting a drowned coastline, dramatic red-and-teal sky, distant lava rivers, dark water reclaiming ruins.

Location markers along the path, bottom to top, each a small distinct landmark with a wooden/parchment sign bearing its Portuguese name (small spelling mistakes in the text are acceptable): 1) "Abismo de Gelo" — a deep glacial crevasse with cold mist rising from it. 2) "Ruínas Vulcânicas" — stone pillars cracked by lava. 3) the path visibly FORKS here into two side-by-side markers before rejoining: "Covil do Dragão Ancião" — a cave with giant claw marks gouged into the rock, AND "Salão dos Titãs" — a colossal stone portal. 4) "Necrópole Real" — a golden mausoleum half-buried in ash. 5) "Palácio Submerso" — a stone dome sinking into dark water. 6) "Arena do Campeão" — a raised arena with torn banners, marked with a distinct glowing runic aura (this one is special).

Scatter 2 extra fog-shrouded silhouette markers with no legible name near the edges of the image — reserved space for future content. This is a complete, self-contained background illustration — no magenta background, not meant to be cut out or keyed. No UI elements, no frame, no extra text beyond the small location name signs described above. Vertical canvas, 1024×2560 px.
```

<a id="regiao-6-nyxheim-nivel-51-58"></a>
### Região 6 — Nyxheim (nível 51-58)
**Tamanho:** 1024×2560 px · **Uso:** sexto trecho do Mapa de Masmorras

```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and Kingdom scene (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A tall vertical dungeon-selection map segment — this is the SIXTH of 7 stacked regions forming one long exploration path, so the path enters from the bottom edge of the canvas and exits off the top edge, continuing both directions. A winding path connects distinct location markers from bottom to top, across a fractured highland plateau touched by the void, a constant storm brewing in the background, jagged cracks of purple-black energy splitting the stone ground — the last stretch before the top of the world.

Location markers along the path, bottom to top, each a small distinct landmark with a wooden/parchment sign bearing its Portuguese name (small spelling mistakes in the text are acceptable): 1) "Fortaleza do Caos" — a black fortress with twisted spikes. 2) "Torre do Vazio" — a slender tower dissolving into dark smoke at its peak. 3) the path visibly FORKS here into two side-by-side markers before rejoining: "Domínio Sombrio" — a pulsing gate of shadow, AND "Colosso de Pedra" — a fallen colossal statue, half-buried. 4) "Trono Esquecido" — a cracked stone throne in an empty courtyard.

Scatter 2 extra fog-shrouded silhouette markers with no legible name near the edges of the image — reserved space for future content. This is a complete, self-contained background illustration — no magenta background, not meant to be cut out or keyed. No UI elements, no frame, no extra text beyond the small location name signs described above. Vertical canvas, 1024×2560 px.
```

<a id="regiao-7-aetherion-nivel-60"></a>
### Região 7 — Aetherion (nível 60)
**Tamanho:** 1024×2560 px · **Uso:** sétimo e último trecho (mais alto) do Mapa de Masmorras

```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and Kingdom scene (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A tall vertical dungeon-selection map segment — this is the SEVENTH and FINAL of 7 stacked regions forming one long exploration path, so the path enters from the bottom edge of the canvas but does NOT exit the top (this is the end of the map). The top of the world: a shattered citadel floating above the clouds, a rupturing sky with suspended rock fragments, dramatic apocalyptic lighting.

Location markers along the path, bottom to top, arranged in four ascending tiers of increasing magical intensity: TIER 1 (bronze glow) — four small structures side by side at the same height: "Abismo Final", "Necrópole dos Reis Caídos", "Covil do Titã Adormecido", "Portal do Vazio" (plain ruined structures with a warm bronze magical glow). TIER 2, directly above tier 1 (silver glow) — the SAME four structures reopened, visually similar but with a brighter silver-white magical glow and small silver runic markings added. TIER 3, directly above tier 2 (gold glow) — the same four structures again, now with an intense golden magical glow and glowing gold runic markings. TIER 4, at the very top (violet-black glow) — a single massive cracked monumental gate pulsing with dark violet-black energy, labeled "Trono do Fim dos Tempos"; beside it, separated by a visible bottomless drop into the clouds below, a circular black hole with a spiral staircase vanishing into darkness, labeled "Abismo Sem Fim" — this is the true end of the map, nothing continues past it.

This is a complete, self-contained background illustration — no magenta background, not meant to be cut out or keyed. No UI elements, no frame, no extra text beyond the small location name labels described above. Vertical canvas, 1024×2560 px.
```

---

<a id="fundos-de-batalha"></a>
## Fundos de Batalha

Uma imagem por masmorra, substituindo o fundo genérico desenhado por código na tela de combate. Ruínas Superficiais, Caverna dos Goblins, Cripta do Tesouro, Pântano Podre, Covil de Aranhas, Torre Amaldiçoada e Minas Abandonadas já têm arte própria integrada — os prompts abaixo cobrem as 5 masmorras restantes. Cada prompt já está completo e pronto pra colar. Todas usam **1536×672 px**, a mesma proporção da tela de combate real (640×280) — o personagem fica parado perto de 27% da largura e o inimigo perto de 73%, os dois sobre uma faixa de chão perto da base da imagem, então a composição deixa esse trecho central-baixo livre de objetos grandes.

<a id="ruinas-superficiais"></a>
### Ruínas Superficiais
```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and other scenes (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A combat arena background for a turn-based RPG: the interior of a sunlit ancient stone ruin near the surface, cracked moss-covered walls, a few warm beams of daylight breaking through gaps above, scattered rubble along the edges only (not the center). A packed dirt-and-stone floor strip runs along the bottom ~15% of the image, spanning the full width, slightly darker than the back wall so a character standing on it reads clearly.

Composition: keep the center-bottom area (roughly from 15% to 85% of the width, near the floor line) clear of large objects — this is where two combat sprites will stand, one near the left third and one near the right third. Ambient warm light glow near both the left and right thirds of the upper-middle area.

This is a complete, self-contained background illustration — no magenta background, not meant to be cut out or keyed. No characters, no UI elements, no frame, no text. Wide canvas, 1536×672 px.
```

<a id="caverna-dos-goblins"></a>
### Caverna dos Goblins
```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and other scenes (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A combat arena background for a turn-based RPG: the interior of a rocky goblin-infested cave, crude tribal totems and bone decorations mounted on the rock walls along the edges, warm flickering torchlight glow near both the left and right thirds of the upper-middle area. A packed dirt cave floor strip runs along the bottom ~15% of the image, spanning the full width, slightly darker than the back wall so a character standing on it reads clearly.

Composition: keep the center-bottom area (roughly from 15% to 85% of the width, near the floor line) clear of large objects — this is where two combat sprites will stand, one near the left third and one near the right third.

This is a complete, self-contained background illustration — no magenta background, not meant to be cut out or keyed. No characters, no UI elements, no frame, no text. Wide canvas, 1536×672 px.
```

<a id="floresta-amaldicoada"></a>
### Floresta Amaldiçoada
```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and other scenes (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A combat arena background for a turn-based RPG: a dark cursed forest clearing at night, gnarled twisted tree trunks framing the left and right edges, faint pale moonlight from above, a few small glowing eyes barely visible in the shadows between distant trees. A dark forest-floor strip of dirt and dead leaves runs along the bottom ~15% of the image, spanning the full width, slightly lighter than the surrounding darkness so a character standing on it reads clearly.

Composition: keep the center-bottom area (roughly from 15% to 85% of the width, near the floor line) clear of large objects — this is where two combat sprites will stand, one near the left third and one near the right third.

This is a complete, self-contained background illustration — no magenta background, not meant to be cut out or keyed. No characters, no UI elements, no frame, no text. Wide canvas, 1536×672 px.
```

<a id="covil-dos-dragoes"></a>
### Covil dos Dragões
```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and other scenes (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A combat arena background for a turn-based RPG: a volcanic cave interior, dark scorched rock walls with glowing orange lava veins running through the stone along the left and right edges, warm orange ambient glow, scattered bones on the ground near the edges only. A scorched rocky floor strip runs along the bottom ~15% of the image, spanning the full width, with a faint warm glow reflecting off it.

Composition: keep the center-bottom area (roughly from 15% to 85% of the width, near the floor line) clear of large objects (no lava pools in the center) — this is where two combat sprites will stand, one near the left third and one near the right third.

This is a complete, self-contained background illustration — no magenta background, not meant to be cut out or keyed. No characters, no UI elements, no frame, no text. Wide canvas, 1536×672 px.
```

<a id="necropole-esquecida"></a>
### Necrópole Esquecida
```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and other scenes (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A combat arena background for a turn-based RPG: an old graveyard within crumbling crypt walls, weathered tombstones and a rusted iron fence along the left and right edges, cold pale blue moonlight, thin ground fog drifting low. A stone-and-dirt floor strip runs along the bottom ~15% of the image, spanning the full width, slightly lighter than the surrounding dark so a character standing on it reads clearly.

Composition: keep the center-bottom area (roughly from 15% to 85% of the width, near the floor line) clear of large objects (no tombstones in the center) — this is where two combat sprites will stand, one near the left third and one near the right third.

This is a complete, self-contained background illustration — no magenta background, not meant to be cut out or keyed. No characters, no UI elements, no frame, no text. Wide canvas, 1536×672 px.
```

<a id="ruinas-elficas"></a>
### Ruínas Élficas
```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and other scenes (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A combat arena background for a turn-based RPG: the interior of a reclaimed elven ruin, tall carved stone columns wrapped in vines and small pale flowers along the left and right edges, soft blue-green magical glow drifting like fireflies in the upper-middle area. A mossy stone floor strip runs along the bottom ~15% of the image, spanning the full width, slightly lighter than the back wall so a character standing on it reads clearly.

Composition: keep the center-bottom area (roughly from 15% to 85% of the width, near the floor line) clear of large objects — this is where two combat sprites will stand, one near the left third and one near the right third.

This is a complete, self-contained background illustration — no magenta background, not meant to be cut out or keyed. No characters, no UI elements, no frame, no text. Wide canvas, 1536×672 px.
```

<a id="arena-de-sangue"></a>
### Arena de Sangue
```
Detailed 2D pixel art game background scene, crisp hard-edged pixels with NO anti-aliasing and NO blur, clean dark outlines, limited but rich color palette with simple flat-shaded highlights and shadows — the same sharp pixel-art style as this game's character sprites and other scenes (Octopath Traveler / Eastward / Stardew Valley style), NOT a painted illustration, NOT a realistic render.

A combat arena background for a turn-based RPG: a stone gladiator arena pit, tiered stone seating and rusted hanging chains framing the left and right edges, dramatic warm torchlight glow, a couple of torn banners hanging from the upper corners. A blood-stained sand-and-stone floor strip runs along the bottom ~15% of the image, spanning the full width, slightly darker reddish tone so a character standing on it reads clearly.

Composition: keep the center-bottom area (roughly from 15% to 85% of the width, near the floor line) clear of large objects — this is where two combat sprites will stand, one near the left third and one near the right third.

This is a complete, self-contained background illustration — no magenta background, not meant to be cut out or keyed. No characters, no UI elements, no frame, no text. Wide canvas, 1536×672 px.
```
