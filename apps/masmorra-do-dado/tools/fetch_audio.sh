#!/usr/bin/env bash
# Baixa os pacotes de som livres (OpenGameArt, CC0) e gera public/audio.
# Precisa de: curl, unzip, ffmpeg, python3 + py7zr.   Uso: bash tools/fetch_audio.sh
set -e
D=$(mktemp -d); cd "$D"
B=https://opengameart.org/sites/default/files
for f in RPGsounds_Kenney.zip fire.wav stone_door.ogg 100-CC0-SFX_0.zip sfx_100_v2.zip Fantozzi-footsteps.7z \
         chalk_drawing_01.mp3 chalk_drawing_02.mp3 pencil_erase.ogg flame.ogg steam_hisses.zip \
         qubodup-bowling-roll.7z scrape-2.ogg scrape-5.ogg; do curl -sO "$B/$f"; done
mkdir x; cd x
for z in RPGsounds_Kenney 100-CC0-SFX_0 sfx_100_v2 steam_hisses; do mkdir -p $z; unzip -qo ../$z.zip -d $z; done
python3 - <<'PY'
import py7zr, os
for a in ['Fantozzi-footsteps', 'qubodup-bowling-roll']:
    os.makedirs(a, exist_ok=True)
    py7zr.SevenZipFile(f'../{a}.7z').extractall(a)
PY
cd ..
python3 "$OLDPWD/tools/build_audio.py" "$D" "$OLDPWD/public/audio"
