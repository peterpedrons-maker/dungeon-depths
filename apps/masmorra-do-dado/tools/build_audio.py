#!/usr/bin/env python3
"""Monta os sons REAIS do jogo em public/audio (mp3 mono, leves).

Fontes (todas livres; ver public/audio/CREDITS.txt):
  - efeitos: OpenGameArt (CC0) — Kenney, rubberduck, qubodup, Fantozzi etc.
  - instrumentos: amostras de instrumentos reais do FluidR3_GM (CC BY 3.0), via midi-js-soundfonts.
Uso:  python3 tools/build_audio.py <pasta com os pacotes baixados> <pasta de saída>
(Os downloads estão descritos em fetch_audio.sh.)
"""
import os, re, subprocess, sys, json

SRC = sys.argv[1]
OUT = sys.argv[2]
os.makedirs(OUT + '/sfx', exist_ok=True)
os.makedirs(OUT + '/inst', exist_ok=True)


def run(args):
    return subprocess.run(args, capture_output=True, text=True)


def peak_db(path):
    r = run(['ffmpeg', '-hide_banner', '-i', path, '-af', 'volumedetect', '-f', 'null', '-'])
    m = re.search(r'max_volume: (-?[\d.]+) dB', r.stderr)
    return float(m.group(1)) if m else 0.0


def make(src, dst, start=0.0, dur=None, rev=False, peak=-3.0, br='64k', trim_sil=True, fade=0.04, lp=None):
    filt = []
    if trim_sil:
        filt.append('silenceremove=start_periods=1:start_threshold=-48dB')
    if rev:
        filt.append('areverse')
        if trim_sil:
            filt.append('silenceremove=start_periods=1:start_threshold=-48dB')
    if lp:
        filt.append(f'lowpass=f={lp}')
    f1 = ','.join(filt) if filt else 'anull'
    tmp = dst + '.tmp.wav'
    args = ['ffmpeg', '-y', '-v', 'error', '-ss', str(start)]
    if dur:
        args += ['-t', str(dur)]
    args += ['-i', src, '-ac', '1', '-ar', '44100', '-af', f1, tmp]
    run(args)
    if not os.path.exists(tmp):
        print('FALHOU', src)
        return
    g = peak - peak_db(tmp)
    run(['ffmpeg', '-y', '-v', 'error', '-i', tmp, '-af', f'volume={g}dB,afade=t=out:st=0:d=0.0001' if False else f'volume={g}dB', '-ac', '1', '-b:a', br, dst])
    os.remove(tmp)


def p(*a):
    return os.path.join(SRC, *a)

K = p('x', 'RPGsounds_Kenney', 'OGG')
C1 = p('x', '100-CC0-SFX_0')
C2 = p('x', 'sfx_100_v2')
FS = p('x', 'Fantozzi-footsteps', 'Fantozzi-footsteps', 'ogg')

SFX = {
    # passos em pedra (Fantozzi) e pouso
    'step1': (FS + '/Fantozzi-StoneL1.ogg', {}),
    'step2': (FS + '/Fantozzi-StoneR1.ogg', {}),
    'step3': (FS + '/Fantozzi-StoneL2.ogg', {}),
    'step4': (FS + '/Fantozzi-StoneR2.ogg', {}),
    'land': (K + '/dropLeather.ogg', {}),
    # dado
    'throw1': (C2 + '/sfx100v2_air_03.ogg', {}),
    'throw2': (K + '/knifeSlice.ogg', {'lp': 5000}),
    'recall': (C2 + '/sfx100v2_air_02.ogg', {'dur': 0.55, 'rev': True}),
    'catch': (K + '/handleSmallLeather.ogg', {}),
    'put1': (K + '/bookPlace1.ogg', {}),
    'put2': (K + '/bookPlace2.ogg', {}),
    'bounce1': (C2 + '/sfx100v2_stones_01.ogg', {}),
    'bounce2': (C2 + '/sfx100v2_stones_02.ogg', {}),
    'bounce3': (C2 + '/sfx100v2_stones_03.ogg', {}),
    'bounce4': (C2 + '/sfx100v2_hit_03.ogg', {}),
    'roll': (p('x', 'qubodup-bowling-roll', 'qubodup-bowling-roll', 'qubodup-bowling_roll-nofadeout.ogg'), {'trim_sil': False}),
    # interface / giz
    'locked': (C1 + '/wooden_01.ogg', {}),
    'swap1': (K + '/cloth1.ogg', {}),
    'swap2': (K + '/cloth3.ogg', {}),
    'sweep': (K + '/clothBelt.ogg', {}),
    'chalk1': (p('chalk_drawing_01.mp3'), {}),
    'chalk2': (p('chalk_drawing_02.mp3'), {}),
    'erase': (p('pencil_erase.ogg'), {}),
    # mundo
    'ignite': (p('flame.ogg'), {}),
    'plate1': (C1 + '/slam_04.ogg', {}),
    'plate2': (C1 + '/switch_02.ogg', {}),
    'gem1': (C1 + '/bell_02.ogg', {}),
    'gem2': (C1 + '/glass_01.ogg', {}),
    'bell': (C1 + '/bell_03.ogg', {}),
    'gong': (C1 + '/gong_01.ogg', {}),
    'door1': (p('stone_door.ogg'), {}),
    'door2': (p('scrape-5.ogg'), {}),
    'doorclose1': (C1 + '/slam_07.ogg', {}),
    'doorclose2': (p('scrape-2.ogg'), {'rev': True}),
    'error': (C1 + '/wooden_03.ogg', {'lp': 1200}),
    'burnout': (p('x', 'steam_hisses', 'steam hisses - Marker #3.wav'), {'dur': 1.2}),
}
for name, (src, kw) in SFX.items():
    make(src, f'{OUT}/sfx/{name}.mp3', **kw)

# fogo ambiente (laço de ~29 s da lareira)
make(p('fire.wav'), f'{OUT}/sfx/fire.mp3', trim_sil=False, br='48k', peak=-6.0)

# instrumentos reais: uma nota a cada 3 semitons, tocada com playbackRate pra cobrir o resto
NOTE = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
def name(m):
    return f'{NOTE[m % 12]}{m // 12 - 1}'
INST = {
    'cello': (36, 60),          # C2..C4  graves longos
    'string_ensemble_1': (48, 72),
    'choir_aahs': (48, 72),
    'orchestral_harp': (48, 84),
    'celesta': (72, 96),
    'glockenspiel': (72, 96),
    'flute': (60, 84),
    'timpani': (36, 48),
    'tubular_bells': (60, 84),
}
manifest = {}
base = 'https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/gh-pages/FluidR3_GM'
for inst, (lo, hi) in INST.items():
    notes = list(range(lo, hi + 1, 3))
    manifest[inst] = notes
    os.makedirs(f'{OUT}/inst/{inst}', exist_ok=True)
    for m in notes:
        raw = f'/tmp/sf_{inst}_{m}.mp3'
        if not os.path.exists(raw):
            r = run(['curl', '-s', '-m', '60', '-o', raw, '-w', '%{http_code}', f'{base}/{inst}-mp3/{name(m)}.mp3'])
            if r.stdout.strip() != '200':
                print('sem nota', inst, name(m), r.stdout)
                continue
        make(raw, f'{OUT}/inst/{inst}/{m}.mp3', peak=-4.0, br='56k', trim_sil=False)
json.dump(manifest, open(f'{OUT}/inst/manifest.json', 'w'))
print('ok')
