#!/usr/bin/env bash
# Baixa os pacotes de som livres (OpenGameArt, CC0) e gera public/audio.
# Precisa de: curl, unzip, ffmpeg, python3 + numpy + py7zr.
# Uso: bash tools/fetch_audio.sh [pasta para os downloads]   (sem pasta: uma temporária)
# Para refazer só alguns arquivos: python3 tools/build_audio.py <pasta dos downloads> public/audio wind gust ...
# Para refazer um instrumento do FluidR3_GM: ... public/audio inst:contrabass inst:voice_oohs (as notas baixadas ficam em <pasta>/sf)
# 3ª leva (DESIGN.md §79): nada novo para baixar aqui. As gotas novas e a pedra assentando saem dos pacotes de cima; os instrumentos novos
# da música do menu (contrabaixo, coro "oohs", garrafa soprada) vêm do mesmo FluidR3_GM, baixados pelo build_audio.py.
# 4ª leva (a Ponte de Frases, sala 14): também nada novo. Os grampos, o tremor e a queda (bridge_lock, bridge_hold, bridge_break) saem dos
# pacotes da 1ª e da 2ª leva (rubberduck, Kenney, AntumDeluge, bonebrah, themightyglider); para refazer só eles bastam esses pacotes:
#   python3 -I tools/build_audio.py <pasta dos downloads> public/audio bridge_lock bridge_hold bridge_break
set -e
ROOT=$(cd "$(dirname "$0")/.." && pwd)
D=${1:-$(mktemp -d)}; mkdir -p "$D"; cd "$D"
B=https://opengameart.org/sites/default/files
get() { [ -s "$2" ] || curl -sfL -o "$2" "$B/$1"; }
# 1ª leva: Kenney, rubberduck, botas em concreto, giz, porta, arrastos, vapor, bola rolando
for f in RPGsounds_Kenney.zip stone_door.ogg 100-CC0-SFX_0.zip sfx_100_v2.zip metal_steps.ogg \
         chalk_drawing_01.mp3 chalk_drawing_02.mp3 pencil_erase.ogg steam_hisses.zip \
         qubodup-bowling-roll.7z scrape-1.ogg scrape-2.ogg scrape-5.ogg; do get "$f" "$f"; done
# 2ª leva (DESIGN.md §60): passos de pedra (Fantozzi), fogo de verdade (LEGIT Audio), estalos (AntumDeluge), vento (Storm Arwen),
# gotas num porão (qubodup), pedras caindo (rubberduck), pedregulho (themightyglider), tambor de tronco ao longe (NenadSimic)
get Fantozzi-footsteps.7z Fantozzi-footsteps.7z
get legit_audio_fire_staff_-_free_0.zip fire_staff.zip
get fire-1.wav fire-1.wav
get storm_arwen_2022.flac storm_arwen_2022.flac
get atmosbasement.mp3_.flac atmosbasement.flac
get sfx_breaking_and_falling.zip sfx_breaking_and_falling.zip
get boulder_drop_0.ogg boulder_drop.ogg
get move_boulder_0.ogg move_boulder.ogg
get "NenadSimic%20-%20Muffled%20Distant%20Explosion.wav" distant_log_drum.wav
mkdir -p x; cd x
for z in RPGsounds_Kenney 100-CC0-SFX_0 sfx_100_v2 steam_hisses sfx_breaking_and_falling fire_staff; do mkdir -p $z; unzip -qo ../$z.zip -d $z; done
python3 -I - <<'PY'
import py7zr, os
for a in ['qubodup-bowling-roll', 'Fantozzi-footsteps']:
    os.makedirs(a, exist_ok=True)
    py7zr.SevenZipFile(f'../{a}.7z').extractall(a)
PY
cd ..
python3 "$ROOT/tools/build_audio.py" "$D" "$ROOT/public/audio"
